
const crypto = require('crypto');
const Payment = require('../models/Payment');
const License = require('../models/License');
const {
    initializeProductCheckout,
    cancelSubscription
} = require('../services/bachsService');

// Keep product IDs on the backend. The six-month product is a one-time charge.
const PLANS = {
    BASIC: {
        productId: 'prod_8a9f1c3241b04dfcbedf',
        amount: '20.00'
    },
    SIX_MONTHS: {
        productId: 'prod_2e659410b1f2442998f3',
        amount: '100.00'
    },
    LIFETIME: {
        productId: 'prod_959d7260f82f43f2808b',
        amount: '3000.00'
    }
};

const frontendUrl = (process.env.FRONTEND_URL || 'https://synesisbot.com').replace(/\/+$/, '');

const initializePayment = async (req, res) => {
    try {
        const { name, email, plan } = req.body;

        if (!name || !email || !plan) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and plan are required.'
            });
        }

        const selectedPlan = PLANS[plan];

        if (!selectedPlan) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment plan.'
            });
        }

        if (selectedPlan.productId.startsWith('REPLACE_')) {
            return res.status(400).json({
                success: false,
                message: 'This plan is not configured yet.'
            });
        }

        const reference = `SYN-${crypto.randomUUID()}`;

        const payment = await Payment.create({
            reference,
            customer: {
                name: name.trim(),
                email: email.trim().toLowerCase()
            },
            plan,
            productId: selectedPlan.productId,
            amount: selectedPlan.amount
        });

        try {
            const checkout = await initializeProductCheckout({
                productId: selectedPlan.productId,
                email: payment.customer.email,
                name: payment.customer.name,
                reference,
                successUrl: `${frontendUrl}/payment/success`,
                cancelUrl: `${frontendUrl}/payment/cancel`,
                metadata: {
                    reference,
                    plan
                }
            });

            await Payment.updateOne(
                { reference },
                {
                    $set: {
                        checkoutId: checkout.id || checkout.checkout_id || null
                    }
                }
            );

            if (!checkout.checkout_url) {
                throw new Error('Bachs did not return a checkout URL.');
            }

            return res.status(200).json({
                success: true,
                message: 'Checkout created successfully.',
                checkoutUrl: checkout.checkout_url,
                reference
            });

        } catch (error) {
            await Payment.updateOne(
                { reference },
                { $set: { status: 'FAILED' } }
            );

            throw error;
        }

    } catch (error) {
        console.error('Payment initialization error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to initialize payment.'
        });
    }
};

const cancelRecurringSubscription = async (req, res) => {
    try {
        const { licenseKey, email } = req.body;
        if (typeof licenseKey !== 'string' || !licenseKey.trim() || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ success: false, message: 'License key and purchase email are required.' });
        }

        const license = await License.findOne({
            licenseKey: licenseKey.trim(),
            'user.email': email.trim().toLowerCase()
        });

        // Do not reveal whether a key or an email address was valid.
        if (!license) {
            return res.status(404).json({ success: false, message: 'We could not find a matching subscription.' });
        }
        if (license.plan !== 'BASIC' || !license.subscriptionId) {
            return res.status(409).json({ success: false, message: 'This license has no active recurring subscription to cancel.' });
        }
        if (license.subscriptionCancelAtPeriodEnd) {
            return res.json({
                success: true,
                message: 'Your subscription is already set to cancel at the end of the current billing period.',
                effectiveAt: license.subscriptionCancelEffectiveAt
            });
        }

        // Bachs defaults to period-end cancellation; specify it explicitly so access remains valid until then.
        const canceled = await cancelSubscription(license.subscriptionId, { cancelAtPeriodEnd: true });
        const effectiveAt = canceled.current_period_end
            ? new Date(canceled.current_period_end)
            : license.expiresAt;
        const canceledAt = canceled.canceled_at ? new Date(canceled.canceled_at) : new Date();

        license.subscriptionCancelAtPeriodEnd = true;
        license.subscriptionCanceledAt = canceledAt;
        license.subscriptionCancelEffectiveAt = effectiveAt || null;
        if (effectiveAt && !Number.isNaN(effectiveAt.getTime())) license.expiresAt = effectiveAt;
        await license.save();

        await Payment.updateMany(
            { subscriptionId: license.subscriptionId },
            {
                $set: {
                    subscriptionCancelAtPeriodEnd: true,
                    subscriptionCanceledAt: canceledAt,
                    subscriptionCancelEffectiveAt: effectiveAt || null
                }
            }
        );

        return res.json({
            success: true,
            message: 'Your subscription will not renew. Your license remains active until the current billing period ends.',
            effectiveAt: effectiveAt || null
        });
    } catch (error) {
        console.error('Subscription cancellation error:', error);
        return res.status(502).json({ success: false, message: 'Unable to cancel the subscription right now. Please try again or contact support.' });
    }
};

module.exports = { initializePayment, cancelRecurringSubscription };
