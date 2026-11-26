const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');
const DownloadStat = require('../models/DownloadStat');

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const EA_FILENAME = 'synesis-ea.ex5';
const uploadDirectory = () => process.env.EA_UPLOAD_DIR
    ? path.resolve(process.env.EA_UPLOAD_DIR)
    : path.join(__dirname, '../uploads');
const eaFilePath = () => path.join(uploadDirectory(), EA_FILENAME);

const getEAFileStatus = async (req, res) => {
    try {
        const [file, downloadStat] = await Promise.all([
            fsp.stat(eaFilePath()).catch((error) => {
                if (error.code === 'ENOENT') return null;
                throw error;
            }),
            DownloadStat.findById('ea-file').lean()
        ]);
        return res.json({
            success: true,
            available: !!file?.isFile(),
            fileName: EA_FILENAME,
            size: file?.size || null,
            updatedAt: file?.mtime || null,
            downloadCount: downloadStat?.count || 0,
            lastDownloadedAt: downloadStat?.lastDownloadedAt || null
        });
    } catch (error) {
        console.error('EA file status error:', error);
        return res.status(500).json({ success: false, message: 'Unable to check the EA file.' });
    }
};

const getPublicEAFileStatus = async (req, res) => {
    try {
        const file = await fsp.stat(eaFilePath()).catch((error) => {
            if (error.code === 'ENOENT') return null;
            throw error;
        });
        return res.json({ success: true, available: !!file?.isFile() });
    } catch (error) {
        console.error('Public EA file status error:', error);
        return res.status(500).json({ success: false, message: 'Unable to check the EA download.' });
    }
};

const uploadEAFile = async (req, res) => {
    const originalName = req.get('x-upload-filename') || '';
    if (path.extname(path.basename(originalName)).toLowerCase() !== '.ex5') {
        return res.status(400).json({ success: false, message: 'Choose an .ex5 EA file.' });
    }
    if (!req.is('application/octet-stream')) {
        return res.status(415).json({ success: false, message: 'Upload the EA as a binary file.' });
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
                    const error = new Error('EA_FILE_TOO_LARGE');
                    error.code = 'EA_FILE_TOO_LARGE';
                    callback(error);
                    return;
                }
                callback(null, chunk);
            }
        });

        await pipeline(req, sizeLimit, fs.createWriteStream(temporaryPath, { flags: 'wx' }));
        if (size === 0) {
            await fsp.rm(temporaryPath, { force: true });
            return res.status(400).json({ success: false, message: 'The selected EA file is empty.' });
        }

        await fsp.rename(temporaryPath, eaFilePath());
        return res.json({
            success: true,
            message: 'EA file uploaded. Customers can now download it.',
            file: { fileName: EA_FILENAME, size, updatedAt: new Date() }
        });
    } catch (error) {
        await fsp.rm(temporaryPath, { force: true }).catch(() => {});
        if (error.code === 'EA_FILE_TOO_LARGE') {
            return res.status(413).json({ success: false, message: 'The EA file must be smaller than 100 MB.' });
        }
        console.error('EA file upload error:', error);
        return res.status(500).json({ success: false, message: 'Unable to upload the EA file.' });
    }
};

const downloadEAFile = async (req, res) => {
    try {
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

module.exports = { getEAFileStatus, getPublicEAFileStatus, uploadEAFile, downloadEAFile };
