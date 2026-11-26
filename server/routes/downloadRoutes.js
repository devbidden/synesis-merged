const express = require('express');
const router = express.Router();
const { getPublicEAFileStatus, downloadEAFile } = require('../controllers/eaFileController');

router.get('/ea/status', getPublicEAFileStatus);
router.get('/ea', downloadEAFile);

module.exports = router;
