const express = require('express');
const router = express.Router();
const limitAdminLoginAttempts = require('../middleware/limitAdminLoginAttempts');
const { login } = require('../controllers/adminAuthController');

router.post('/login', limitAdminLoginAttempts, login);

module.exports = router;
