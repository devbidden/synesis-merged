const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 15;
const attemptsByIp = new Map();
let lastCleanup = 0;

const limitCancellationAttempts = (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const existing = attemptsByIp.get(ip);
    const record = !existing || existing.resetAt <= now
        ? { count: 0, resetAt: now + WINDOW_MS }
        : existing;

    if (now - lastCleanup > WINDOW_MS) {
        for (const [key, value] of attemptsByIp) {
            if (value.resetAt <= now) attemptsByIp.delete(key);
        }
        lastCleanup = now;
    }

    if (record.count >= MAX_ATTEMPTS) {
        return res.status(429).json({ success: false, message: 'Too many cancellation attempts. Please wait and try again.' });
    }

    record.count += 1;
    attemptsByIp.set(ip, record);
    return next();
};

module.exports = limitCancellationAttempts;
