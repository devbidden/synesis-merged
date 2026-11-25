const express = require('express');
const router = express.Router();

const { activateLicense, createLicense,editDeviceId } = require('../controllers/licenseController');

router.post('/activate', activateLicense); 
router.post('/create', createLicense); //on payment create the license
router.patch('/edit-device', editDeviceId);

module.exports = router;