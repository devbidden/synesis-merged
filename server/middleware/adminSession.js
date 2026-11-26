const crypto = require('crypto');

const SESSION_TTL_SECONDS = 8 * 60 * 60;

const sign = (payload, secret) => crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

const createAdminSession = () => {
    const secret = process.env.ADMIN_API_KEY;
    if (!secret) return null;
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: expiresAt })).toString('base64url');
    return {
        token: `${payload}.${sign(payload, secret)}`,
        expiresAt: new Date(expiresAt * 1000).toISOString()
    };
};

const isValidAdminSession = (token) => {
    const secret = process.env.ADMIN_API_KEY;
    if (!secret || typeof token !== 'string') return false;
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return false;

    const expected = Buffer.from(sign(payload, secret));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return false;

    try {
        const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return claims.role === 'admin' && Number.isInteger(claims.exp) && claims.exp > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
};

module.exports = { createAdminSession, isValidAdminSession };
