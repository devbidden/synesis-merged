const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');
const { handleUpload } = require('@vercel/blob/client');
const { del, head } = require('@vercel/blob');
const DownloadStat = require('../models/DownloadStat');

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const EA_FILENAME = 'synesis-ea.ex5';
const uploadDirectory = () => process.env.EA_UPLOAD_DIR
    ? path.resolve(process.env.EA_UPLOAD_DIR)
    : path.join(__dirname, '../uploads');
const eaFilePath = () => path.join(uploadDirectory(), EA_FILENAME);
const isPublicBlobUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.hostname.endsWith('.public.blob.vercel-storage.com');
    } catch {
        return false;
    }
};

const getEAFileStatus = async (req, res) => {
    try {
        const [file, downloadStat] = await Promise.all([
            fsp.stat(eaFilePath()).catch((error) => {
                if (error.code === 'ENOENT') return null;
                throw error;
            }),
            DownloadStat.findById('ea-file').lean()
        ]);
        const blobAvailable = isPublicBlobUrl(downloadStat?.fileUrl);
        return res.json({
            success: true,
            available: blobAvailable || !!file?.isFile(),
            uploadMode: process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : (process.env.VERCEL ? 'unconfigured' : 'local'),
            fileName: EA_FILENAME,
            size: blobAvailable ? downloadStat.fileSize : (file?.size || null),
            updatedAt: blobAvailable ? downloadStat.fileUpdatedAt : (file?.mtime || null),
            downloadCount: downloadStat?.count || 0,
            lastDownloadedAt: downloadStat?.lastDownloadedAt || null
        });
    } catch (error) {
        console.error('EA file status error:', error);
        return res.status(500).json({ success: false, message: 'Unable to check the EA file.' });
    }
};

const uploadLocalEAFile = async (req, res) => {
    const originalName = req.get('x-upload-filename') || '';
    if (path.extname(path.basename(originalName)).toLowerCase() !== '.ex5') {
        return res.status(400).json({ success: false, message: 'Choose an .ex5 EA file.' });
    }
    const contentLength = Number(req.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE) {
        return res.status(413).json({ success: false, message: 'The EA file must be smaller than 100 MB.' });
    }

    const directory = uploadDirectory();
    const temporaryPath = path.join(directory, `.upload-${crypto.randomUUID()}.tmp`);
    let size = 0;
    try {
        await fsp.mkdir(directory, { recursive: true });
        const sizeLimit = new Transform({
            transform(chunk, encoding, callback) {
                size += chunk.length;
                if (size > MAX_FILE_SIZE) {
                    const error = new Error('The EA file must be smaller than 100 MB.');
                    error.code = 'EA_FILE_TOO_LARGE';
                    callback(error);
                    return;
                }
                callback(null, chunk);
            }
        });
        await pipeline(req, sizeLimit, fs.createWriteStream(temporaryPath, { flags: 'wx' }));
        if (!size) {
            await fsp.rm(temporaryPath, { force: true });
            return res.status(400).json({ success: false, message: 'The selected EA file is empty.' });
        }
        await fsp.rename(temporaryPath, eaFilePath());
        return res.json({ success: true, message: 'EA file uploaded. Customers can now download it.' });
    } catch (error) {
        await fsp.rm(temporaryPath, { force: true }).catch(() => {});
        if (error.code === 'EA_FILE_TOO_LARGE') return res.status(413).json({ success: false, message: error.message });
        console.error('Local EA file upload error:', error);
        return res.status(500).json({ success: false, message: 'Unable to upload the EA file.' });
    }
};

const getPublicEAFileStatus = async (req, res) => {
    try {
        const [file, downloadStat] = await Promise.all([
            fsp.stat(eaFilePath()).catch((error) => {
                if (error.code === 'ENOENT') return null;
                throw error;
            }),
            DownloadStat.findById('ea-file').lean()
        ]);
        return res.json({ success: true, available: isPublicBlobUrl(downloadStat?.fileUrl) || !!file?.isFile() });
    } catch (error) {
        console.error('Public EA file status error:', error);
        return res.status(500).json({ success: false, message: 'Unable to check the EA download.' });
    }
};

const createEAUploadToken = async (req, res) => {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(503).json({ success: false, message: 'Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the backend environment.' });
    }

    try {
        const result = await handleUpload({
            body: req.body,
            request: req,
            onBeforeGenerateToken: async (pathname) => {
                if (path.extname(pathname).toLowerCase() !== '.ex5' || !pathname.startsWith('synesis-ea/')) {
                    throw new Error('Only Synesis .ex5 files can be uploaded.');
                }
                return {
                    addRandomSuffix: true,
                    allowedContentTypes: ['application/octet-stream', 'application/x-msdownload'],
                    maximumSizeInBytes: MAX_FILE_SIZE
                };
            }
        });
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('EA Blob upload authorization error:', error);
        return res.status(400).json({ success: false, message: error.message || 'Unable to authorize the EA upload.' });
    }
};

const saveEAFileMetadata = async (req, res) => {
    const { url: fileUrl, pathname } = req.body || {};
    if (!isPublicBlobUrl(fileUrl) || !pathname?.startsWith('synesis-ea/') || path.extname(pathname).toLowerCase() !== '.ex5') {
        return res.status(400).json({ success: false, message: 'The uploaded file URL is invalid.' });
    }

    try {
        const metadata = await head(fileUrl);
        if (metadata.pathname !== pathname || metadata.url !== fileUrl) {
            return res.status(400).json({ success: false, message: 'The uploaded file metadata does not match its Blob URL.' });
        }
        if (!['application/octet-stream', 'application/x-msdownload'].includes(metadata.contentType)) {
            return res.status(400).json({ success: false, message: 'The uploaded Blob is not an EA binary.' });
        }
        if (metadata.size <= 0) return res.status(400).json({ success: false, message: 'The uploaded EA file is empty.' });
        if (metadata.size > MAX_FILE_SIZE) return res.status(413).json({ success: false, message: 'The EA file must be smaller than 100 MB.' });

        const previous = await DownloadStat.findById('ea-file').lean();
        const fileUpdatedAt = metadata.uploadedAt || new Date();
        const record = await DownloadStat.findOneAndUpdate(
            { _id: 'ea-file' },
            { $set: { fileUrl, downloadUrl: metadata.downloadUrl, blobPathname: metadata.pathname, fileSize: metadata.size, fileUpdatedAt } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        if (previous?.fileUrl && previous.fileUrl !== fileUrl && isPublicBlobUrl(previous.fileUrl)) {
            del(previous.fileUrl).catch((error) => console.error('Old EA Blob cleanup failed:', error));
        }

        return res.json({
            success: true,
            message: 'EA file uploaded. Customers can now download it.',
            file: { fileName: EA_FILENAME, size: record.fileSize, updatedAt: record.fileUpdatedAt }
        });
    } catch (error) {
        console.error('EA Blob metadata save error:', error);
        return res.status(500).json({ success: false, message: 'The file uploaded, but its download record could not be saved. Please retry the upload.' });
    }
};

const downloadEAFile = async (req, res) => {
    try {
        const downloadStat = await DownloadStat.findById('ea-file').lean();
        if (isPublicBlobUrl(downloadStat?.downloadUrl || downloadStat?.fileUrl)) {
            const target = downloadStat.downloadUrl || downloadStat.fileUrl;
            await DownloadStat.updateOne(
                { _id: 'ea-file' },
                { $inc: { count: 1 }, $set: { lastDownloadedAt: new Date() } },
                { upsert: true }
            );
            return res.redirect(302, target);
        }

        const filePath = eaFilePath();
        await fsp.access(filePath, fs.constants.R_OK);
        return res.download(filePath, EA_FILENAME, (error) => {
            if (error) {
                console.error('EA file transfer error:', error);
                if (!res.headersSent) res.status(500).json({ success: false, message: 'Unable to download the EA file.' });
                return;
            }
            DownloadStat.updateOne(
                { _id: 'ea-file' },
                { $inc: { count: 1 }, $set: { lastDownloadedAt: new Date() } },
                { upsert: true }
            ).catch((statError) => console.error('EA download count update failed:', statError));
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ success: false, message: 'The EA download is not available yet.' });
        }
        console.error('EA file download error:', error);
        return res.status(500).json({ success: false, message: 'Unable to download the EA file.' });
    }
};

module.exports = { getEAFileStatus, getPublicEAFileStatus, createEAUploadToken, saveEAFileMetadata, uploadLocalEAFile, downloadEAFile };
