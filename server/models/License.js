const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
    licenseKey: {
        type: String,
        required: true,
        unique: true
    },

    user: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true
        }
    },

    status: {
        type: String,
        enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
        default: 'ACTIVE'
    },

    expiresAt: {
        type: Date,
        required: true
    },

    deviceId: {
        type: String,
        default: null
    },

    mt5Account: {
        type: Number,
        default: null
    },

    activatedAt: {
        type: Date,
        default: null
    },

    lastVerifiedAt: {
        type: Date,
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model('License', licenseSchema);