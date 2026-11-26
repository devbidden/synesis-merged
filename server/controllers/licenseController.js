const License = require('../models/License');
const crypto = require('crypto');

const activateLicense = async (req, res) => {
    try {
        const { licenseKey, deviceId, mt5Account } = req.body;

        if (!licenseKey || !deviceId) {
            return res.status(400).json({
                success: false,
                status: 'MISSING_FIELDS',
                message: 'License key and device ID are required.'
            });
        }

        const license = await License.findOne({ licenseKey });

        if (!license) {
            return res.status(404).json({
                success: false,
                status: 'INVALID',
                message: 'Invalid license key.'
            });
        }

        if (license.status === 'REVOKED') {
            return res.status(403).json({
                success: false,
                status: 'REVOKED',
                message: 'This license has been revoked.'
            });
        }

        if (
            license.status === 'EXPIRED' ||
            (license.expiresAt && license.expiresAt <= new Date())
        )  {
            return res.status(403).json({
                success: false,
                status: 'EXPIRED',
                message: 'This license has expired.'
            });
        }

        // First activation
        if (!license.deviceId) {

            const activatedLicense = await License.findOneAndUpdate(
                {
                    _id: license._id,
                    deviceId: null
                },
                {
                    $set: {
                        deviceId,
                        mt5Account,
                        activatedAt: new Date(),
                        lastVerifiedAt: new Date()
                    }
                },
                { new: true }
            );

            // Another device may have activated it simultaneously
            if (!activatedLicense) {
                return res.status(403).json({
                    success: false,
                    status: 'DEVICE_MISMATCH',
                    message: 'License has already been activated on another device.'
                });
            }
            return res.status(200).json({
                success: true,
                status: 'ACTIVATED',
                message: 'License verified successfully.',
                expiresAt: license.expiresAt
            });
        }

        // Existing activation: check device
        if (license.deviceId !== deviceId) {
            return res.status(403).json({
                success: false,
                status: 'DEVICE_MISMATCH',
                message: 'This license is already activated on another device.'
            });
        }

        // Same device: update verification date
        await License.updateOne(
            { _id: license._id, deviceId },
            {
                $set: {
                    lastVerifiedAt: new Date(),
                    mt5Account
                }
            }
        );

        return res.status(200).json({
            success: true,
            status: 'VALID',
            message: 'License verified successfully.'
        });

    } catch (error) {
        console.error('License activation error:', error);

        return res.status(500).json({
            success: false,
            status: 'SERVER_ERROR',
            message: 'Unable to verify license.'
        });
    }
};




const generateLicenseKey = () => {
    return `SYN-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
};

const createLicense = async (req, res) => {
    try {
        const { name, email, duration } = req.body;

        if (!name || !email || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and duration are required.'
            });
        }

        const licenseKey = generateLicenseKey();

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + Number(duration));

        const license = await License.create({
            licenseKey,
            user: {
                name,
                email
            },
            expiresAt
        });

        return res.status(201).json({
            success: true,
            message: 'License created successfully.',
            license
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Unable to create license.'
        });
    }
};
const editDeviceId = async (req, res) => {
    try {
        const { licenseKey, deviceId } = req.body;

        if (!licenseKey || !deviceId) {
            return res.status(400).json({
                success: false,
                message: 'License key and new device ID are required.'
            });
        }

        const license = await License.findOneAndUpdate(
            { licenseKey },
            {
                $set: {
                    deviceId: deviceId,
                    lastVerifiedAt: new Date()
                }
            },
            { new: true }
        );

        if (!license) {
            return res.status(404).json({
                success: false,
                message: 'License not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Device ID updated successfully.',
            license: {
                licenseKey: license.licenseKey,
                deviceId: license.deviceId,
                status: license.status
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Unable to update device ID.'
        });
    }
};

module.exports = { activateLicense, createLicense, editDeviceId, generateLicenseKey };

