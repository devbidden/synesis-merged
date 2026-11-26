
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

    plan: {
        type: String,
        enum: ['BASIC', 'SIX_MONTHS', 'LIFETIME'],
        required: true
    },

    status: {
        type: String,
        enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
        default: 'ACTIVE'
    },

    expiresAt: {
        type: Date,
        default: null
    },

    paymentReference: {
        type: String,
        default: undefined,
        unique: true,
        sparse: true
    },

    subscriptionId: {
        type: String,
        default: null
    },

    nextBillingDate: {
        type: Date,
        default: null
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
    plan: {
        type: String,
        enum: ['BASIC', 'SIX_MONTHS', 'LIFETIME', 'MANUAL'],
        default: 'MANUAL'
    },
       lastVerifiedAt: {
        type: Date,
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model('License', licenseSchema);
