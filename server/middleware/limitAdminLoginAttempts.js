const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attemptsByIp = new Map();

const limitAdminLoginAttempts = (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const previous = attemptsByIp.get(ip);
    const record = !previous || previous.resetAt <= now
        ? { count: 0, resetAt: now + WINDOW_MS }
        : previous;

    if (record.count >= MAX_ATTEMPTS) {
        return res.status(429).json({ success: false, message: 'Too many login attempts. Please wait and try again.' });
    }
    record.count += 1;
    attemptsByIp.set(ip, record);

    if (attemptsByIp.size > 1000) {
        for (const [key, value] of attemptsByIp) {
            if (value.resetAt <= now) attemptsByIp.delete(key);
        }
    }
    return next();
};

module.exports = limitAdminLoginAttempts;
