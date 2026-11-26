
const express = require('express');
const router = express.Router();

const {
    activateLicense,
    editDeviceId
} = require('../controllers/licenseController');

router.post('/activate', activateLicense);
router.patch('/edit-device', editDeviceId);

module.exports = router;
