
const crypto = require('crypto');
const Payment = require('../models/Payment');
const {
    initializeProductCheckout
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
                successUrl: 'https://synesisbot.com/payment/success',
                cancelUrl: 'https://synesisbot.com/payment/cancel',
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

module.exports = { initializePayment };
