const mongoose = require('mongoose');
const License = require('../models/License');
const Payment = require('../models/Payment');
const { generateLicenseKey } = require('./licenseController');

const pagination = (query) => {
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), 200);
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    return { limit, skip: (page - 1) * limit, page };
};

const createLicense = async (req, res) => {
    try {
        const { name, email, duration, plan = 'MANUAL' } = req.body;
        const validPlans = ['BASIC', 'SIX_MONTHS', 'LIFETIME', 'MANUAL'];
        const durationDays = duration === undefined || duration === null || duration === ''
            ? null
            : Number(duration);

        if (!name?.trim() || !email?.trim() || (durationDays !== null && (!Number.isFinite(durationDays) || durationDays <= 0))) {
            return res.status(400).json({ success: false, message: 'Name, email, and a positive duration in days (when provided) are required.' });
        }
        if (!validPlans.includes(plan)) {
            return res.status(400).json({ success: false, message: 'Invalid license plan.' });
        }

        const expiresAt = durationDays === null ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        const license = await License.create({
            licenseKey: generateLicenseKey(),
            user: { name: name.trim(), email: email.trim().toLowerCase() },
            plan,
            expiresAt
        });

        return res.status(201).json({ success: true, license });
    } catch (error) {
        console.error('Admin license creation error:', error);
        return res.status(500).json({ success: false, message: 'Unable to create license.' });
    }
};

const listLicenses = async (req, res) => {
    try {
        const { limit, skip, page } = pagination(req.query);
        const filter = {};
        if (req.query.status) filter.status = req.query.status.toUpperCase();
        const [licenses, total] = await Promise.all([
            License.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            License.countDocuments(filter)
        ]);
        return res.json({ success: true, licenses, pagination: { page, limit, total } });
    } catch (error) {
        console.error('Admin license listing error:', error);
        return res.status(500).json({ success: false, message: 'Unable to list licenses.' });
    }
};

const revokeLicense = async (req, res) => {
    try {
        const isObjectId = mongoose.isValidObjectId(req.params.id);
        const selector = isObjectId ? { _id: req.params.id } : { licenseKey: req.params.id };
        const license = await License.findOneAndUpdate(
            { ...selector, status: { $ne: 'REVOKED' } },
            { $set: { status: 'REVOKED' } },
            { new: true, runValidators: true }
        );
        if (!license) {
            const exists = await License.exists(selector);
            return res.status(exists ? 409 : 404).json({
                success: false,
                message: exists ? 'License is already revoked.' : 'License not found.'
            });
        }
        return res.json({ success: true, message: 'License revoked.', license });
    } catch (error) {
        console.error('Admin license revocation error:', error);
        return res.status(500).json({ success: false, message: 'Unable to revoke license.' });
    }
};

const listUsers = async (req, res) => {
    try {
        const { limit, skip, page } = pagination(req.query);
        const users = await License.aggregate([
            { $sort: { createdAt: -1 } },
            { $group: {
                _id: '$user.email',
                name: { $first: '$user.name' },
                email: { $first: '$user.email' },
                licenseCount: { $sum: 1 },
                licenses: { $push: { id: '$_id', licenseKey: '$licenseKey', plan: '$plan', status: '$status', expiresAt: '$expiresAt', createdAt: '$createdAt' } },
                firstSeenAt: { $min: '$createdAt' },
                lastSeenAt: { $max: '$createdAt' }
            } },
            { $sort: { lastSeenAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);
        const total = await License.distinct('user.email').then((emails) => emails.length);
        return res.json({ success: true, users, pagination: { page, limit, total } });
    } catch (error) {
        console.error('Admin user listing error:', error);
        return res.status(500).json({ success: false, message: 'Unable to list users.' });
    }
};

const listPayingUsers = async (req, res) => {
    try {
        const { limit, skip, page } = pagination(req.query);
        const [users, count] = await Promise.all([
            Payment.aggregate([
                { $match: { status: 'SUCCESS' } },
                { $group: {
                    _id: '$customer.email',
                    name: { $first: '$customer.name' },
                    email: { $first: '$customer.email' },
                    successfulPaymentCount: { $sum: 1 },
                    totalPaid: { $sum: { $convert: { input: '$amount', to: 'double', onError: 0, onNull: 0 } } },
                    currency: { $first: '$currency' },
                    plans: { $addToSet: '$plan' },
                    lastPaidAt: { $max: '$paidAt' }
                } },
                { $sort: { lastPaidAt: -1 } },
                { $skip: skip },
                { $limit: limit }
            ]),
            Payment.distinct('customer.email', { status: 'SUCCESS' }).then((emails) => emails.length)
        ]);
        return res.json({ success: true, users, pagination: { page, limit, total: count } });
    } catch (error) {
        console.error('Admin paying-user listing error:', error);
        return res.status(500).json({ success: false, message: 'Unable to list paying users.' });
    }
};

const listPayments = async (req, res) => {
    try {
        const { limit, skip, page } = pagination(req.query);
        const filter = {};
        if (req.query.status) filter.status = req.query.status.toUpperCase();
        const [payments, total] = await Promise.all([
            Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('license', 'licenseKey status expiresAt').lean(),
            Payment.countDocuments(filter)
        ]);
        return res.json({ success: true, payments, pagination: { page, limit, total } });
    } catch (error) {
        console.error('Admin payment listing error:', error);
        return res.status(500).json({ success: false, message: 'Unable to list payments.' });
    }
};

module.exports = { createLicense, listLicenses, revokeLicense, listUsers, listPayingUsers, listPayments };
