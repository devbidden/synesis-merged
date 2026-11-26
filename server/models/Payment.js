const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    reference: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
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
    productId: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
    },
    checkoutId: {
        type: String,
        default: null
    },
    subscriptionId: {
        type: String,
        default: null
    },
    license: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'License',
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    },
    licenseEmailSentAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
