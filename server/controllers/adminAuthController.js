const crypto = require('crypto');
const { createAdminSession } = require('../middleware/adminSession');

const login = (req, res) => {
    const configuredKey = process.env.ADMIN_API_KEY;
    if (!configuredKey) {
        return res.status(503).json({ success: false, message: 'Admin access is not configured.' });
    }

    const suppliedKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey : '';
    const expected = Buffer.from(configuredKey);
    const supplied = Buffer.from(suppliedKey);
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    return res.json({ success: true, ...createAdminSession() });
};

module.exports = { login };
