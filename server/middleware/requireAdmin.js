const crypto = require('crypto');

const requireAdmin = (req, res, next) => {
    const expectedKey = process.env.ADMIN_API_KEY;
    const providedKey = req.get('x-admin-api-key');

    if (!expectedKey) {
        console.error('Missing ADMIN_API_KEY');
        return res.status(503).json({ success: false, message: 'Admin access is not configured.' });
    }

    if (!providedKey) {
        return res.status(401).json({ success: false, message: 'Admin API key required.' });
    }

    const expected = Buffer.from(expectedKey);
    const provided = Buffer.from(providedKey);
    if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
        return res.status(403).json({ success: false, message: 'Invalid admin API key.' });
    }

    return next();
};

module.exports = requireAdmin;
