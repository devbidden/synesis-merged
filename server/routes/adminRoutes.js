const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const { getEAFileStatus, createEAUploadToken, saveEAFileMetadata, uploadLocalEAFile } = require('../controllers/eaFileController');
const {
    createLicense,
    listLicenses,
    revokeLicense,
    listUsers,
    listPayingUsers,
    listPayments
} = require('../controllers/adminController');

router.use(requireAdmin);
router.post('/licenses', createLicense);
router.get('/licenses', listLicenses);
router.patch('/licenses/:id/revoke', revokeLicense);
router.get('/ea-file', getEAFileStatus);
router.post('/ea-file/upload-token', createEAUploadToken);
router.put('/ea-file', (req, res, next) => req.is('application/octet-stream') ? uploadLocalEAFile(req, res, next) : saveEAFileMetadata(req, res, next));
router.get('/users', listUsers);
router.get('/paying-users', listPayingUsers);
router.get('/payments', listPayments);

module.exports = router;
