
const { webhooks, BachsWebhookError } = require('@bachs/sdk');
const Payment = require('../models/Payment');
const License = require('../models/License');
const { generateLicenseKey } = require('./licenseController');
const { sendLicenseEmail } = require('../services/emailService');

const addMonths = (date, months) => {
    const result = new Date(date);
    const day = result.getDate();

    result.setDate(1);
    result.setMonth(result.getMonth() + months);

    const lastDay = new Date(
        result.getFullYear(),
        result.getMonth() + 1,
        0
    ).getDate();

    result.setDate(Math.min(day, lastDay));

    return result;
};

const deliverLicenseEmail = async (payment, license) => {
    if (payment.licenseEmailSentAt) return;

    await sendLicenseEmail({
        name: payment.customer.name,
        email: payment.customer.email,
        licenseKey: license.licenseKey,
        plan: payment.plan,
        expiresAt: license.expiresAt
    });

    payment.licenseEmailSentAt = new Date();
    await payment.save();
};

const handleBachsWebhook = async (req, res) => {
    try {
        const secret = process.env.BACHS_WEBHOOK_SECRET;

        if (!secret) {
            console.error('Missing BACHS_WEBHOOK_SECRET');
            return res.sendStatus(500);
        }

        const rawBody = req.body.toString('utf8');

        let event;

        try {
            event = webhooks.constructEvent(
                rawBody,
                req.headers,
                secret
            );
        } catch (error) {
            if (error instanceof BachsWebhookError) {
                console.error('Invalid Bachs signature');
                return res.status(400).send('Invalid signature');
            }

            throw error;
        }

        if (event.type === 'customer.subscription.created') {
            const subscription = event.data;
            const reference = subscription.reference || subscription.metadata?.reference;
            if (!subscription.id || !reference) {
                console.error('Subscription or checkout reference missing:', subscription);
                return res.sendStatus(200);
            }

            const payment = await Payment.findOneAndUpdate(
                { reference },
                { $set: { subscriptionId: subscription.id } },
                { new: true }
            );
            if (payment?.license) {
                await License.updateOne(
                    { _id: payment.license },
                    { $set: { subscriptionId: subscription.id } }
                );
            }
            return res.sendStatus(200);
        }

        // Keep subscription cancellation state in sync if it is changed in Bachs.
        if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const subscription = event.data;
            if (subscription.id) {
                const updates = {};
                if (subscription.cancel_at_period_end !== undefined) {
                    updates.subscriptionCancelAtPeriodEnd = subscription.cancel_at_period_end;
                    if (!subscription.cancel_at_period_end) {
                        updates.subscriptionCanceledAt = null;
                        updates.subscriptionCancelEffectiveAt = null;
                    }
                }
                if (subscription.canceled_at) updates.subscriptionCanceledAt = new Date(subscription.canceled_at);
                if (subscription.current_period_end) {
                    updates.subscriptionCancelEffectiveAt = new Date(subscription.current_period_end);
                    updates.expiresAt = new Date(subscription.current_period_end);
                }
                if (event.type === 'customer.subscription.deleted') {
                    updates.subscriptionCancelAtPeriodEnd = true;
                    updates.subscriptionCanceledAt = subscription.canceled_at ? new Date(subscription.canceled_at) : new Date();
                    if (subscription.canceled_at) updates.expiresAt = new Date(subscription.canceled_at);
                }
                await Promise.all([
                    Payment.updateMany({ subscriptionId: subscription.id }, { $set: Object.fromEntries(Object.entries(updates).filter(([key]) => key !== 'expiresAt')) }),
                    License.updateMany({ subscriptionId: subscription.id }, { $set: updates })
                ]);
            }
            return res.sendStatus(200);
        }

        // We only generate licenses for successful payments.
        if (event.type !== 'collection.succeeded') {
            return res.sendStatus(200);
        }

        const data = event.data;

        console.log('Verified successful payment:', event.id);

        // Find the reference sent when checkout was initialized.
        const reference =
            data.reference ||
            data.metadata?.reference;

        if (!reference) {
            console.error('Payment reference missing:', data);
            return res.sendStatus(500);
        }

        const payment = await Payment.findOne({ reference });

        if (!payment) {
            console.error('Payment record not found:', reference);
            return res.sendStatus(500);
        }

        // Mark the payment as successful.
        if (payment.status !== 'SUCCESS') {
            payment.status = 'SUCCESS';
            payment.paidAt = new Date();
            await payment.save();
        }

        const subscriptionId = data.subscription_id || data.subscription?.id;
        if (subscriptionId && payment.subscriptionId !== subscriptionId) {
            payment.subscriptionId = subscriptionId;
            await payment.save();
        }

        // Check whether this payment already generated a license.
        const existingLicense = await License.findOne({
            paymentReference: reference
        });

        if (existingLicense) {
            console.log('License already exists:', existingLicense.licenseKey);

            if (!payment.license) {
                payment.license = existingLicense._id;
                await payment.save();
            }

            // A prior email failure can be retried by a repeated webhook.
            await deliverLicenseEmail(payment, existingLicense);

            return res.sendStatus(200);
        }

        // Calculate license expiry based on the purchased plan.
        const now = new Date();
        let expiresAt;

        if (payment.plan === 'BASIC') {
            expiresAt = addMonths(now, 1);
        } else if (payment.plan === 'SIX_MONTHS') {
            expiresAt = addMonths(now, 6);
        } else if (payment.plan === 'LIFETIME') {
            expiresAt = null;
        } else {
            console.error('Unknown payment plan:', payment.plan);
            return res.sendStatus(500);
        }

        // Generate and save the license.
        const license = await License.create({
            licenseKey: generateLicenseKey(),
            user: {
                name: payment.customer.name,
                email: payment.customer.email
            },
            plan: payment.plan,
            subscriptionId: payment.subscriptionId,
            paymentReference: reference,
            expiresAt
        });

        // Link the generated license to its payment.
        payment.license = license._id;
        await payment.save();

        console.log('LICENSE GENERATED SUCCESSFULLY');
        console.log('License:', license.licenseKey);
        console.log('Customer:', payment.customer.email);

        await deliverLicenseEmail(payment, license);
        
        return res.sendStatus(200);

    } catch (error) {
        // Handle simultaneous webhook deliveries.
        if (error.code === 11000) {
            console.log('Duplicate license creation prevented.');
            return res.sendStatus(200);
        }

        console.error('Webhook processing error:', error);
        return res.sendStatus(500);
    }
};

module.exports = { handleBachsWebhook };
