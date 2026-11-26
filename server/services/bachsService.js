
const crypto = require('crypto');
const path = require('path');

const dotenvResult = require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
});

if (dotenvResult.error) {
    console.error('Failed to load .env:', dotenvResult.error.message);
} else {
    console.log(
        `[dotenv] injecting env (${Object.keys(dotenvResult.parsed || {}).length}) from ../.env`
    );
}

console.log('Bachs key loaded:', !!process.env.BACHS_API_KEY);

const LIVE_BASE_URL = 'https://api.bachs.io';
const SANDBOX_BASE_URL = 'https://sandbox-api.bachs.io';

const getSecretKey = () => {
    return String(
        process.env.BACHS_API_KEY ||
        process.env.PAYSTACK_API_KEY ||
        ''
    ).trim().replace(/^['"]|['"]$/g, '');
};

const getBaseUrl = () => {
    if (process.env.BACHS_API_URL) {
        return process.env.BACHS_API_URL.replace(/\/+$/, '');
    }

    return getSecretKey().startsWith('sk_sandbox_')
        ? SANDBOX_BASE_URL
        : LIVE_BASE_URL;
};

const assertSecretKey = () => {
    const key = getSecretKey();

    if (!key || /your_|replace_with|changeme/i.test(key)) {
        throw new Error('Bachs API key is not configured.');
    }

    return key;
};

const request = async (path, { method = 'GET', body, idempotencyKey } = {}) => {
    const headers = {
        Authorization: `Bearer ${assertSecretKey()}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };

    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(`${getBaseUrl()}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.message ||
            `Bachs request failed: ${response.status}`
        );
    }

    return data.data ?? data;
};

// Create a product in Bachs
const createProduct = async ({
    name,
    description,
    amount,
    currency = 'USD',
    billingCycle
}) => {
    const body = {
        name,
        description,
        price: {
            price_type: 'fixed',
            amount: String(amount),
            currency
        }
    };

    if (billingCycle) {
        body.billing_cycle = billingCycle;
    }

    return request('/v1/products', {
        method: 'POST',
        body,
        idempotencyKey: `synesisbot-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-v1`
    });
};

// List products already created in Bachs
const listProducts = () => request('/v1/products');

// Initialize one-time checkout
const initializeTransaction = ({
    email,
    name,
    amount,
    currency = 'USD',
    reference,
    successUrl,
    cancelUrl,
    metadata
}) => {
    return request('/v1/checkout-sessions', {
        method: 'POST',
        body: {
            customer: {
                email,
                name: name || email
            },
            pricing: {
                currency,
                amount: String(amount)
            },
            reference,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata
        },
        idempotencyKey: reference
    });
};

// Initialize checkout for a product
const initializeProductCheckout = ({
    productId,
    email,
    name,
    reference,
    successUrl,
    cancelUrl,
    metadata
}) => {
    return request('/v1/checkout-sessions', {
        method: 'POST',
        body: {
            product_cart: [
                {
                    product_id: productId,
                    quantity: 1
                }
            ],
            customer: {
                email,
                name: name || email
            },
            reference,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata
        },
        idempotencyKey: reference
    });
};

// Retrieve checkout session
const getCheckoutSession = (checkoutId) => {
    return request(
        `/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`
    );
};

const cancelSubscription = (subscriptionId, { cancelAtPeriodEnd = true } = {}) => {
    return request(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: 'DELETE',
        body: {
            cancel_at_period_end: cancelAtPeriodEnd,
            reason: 'Customer requested'
        }
    });
};

const verifyWebhookSignature = (rawBody, timestamp, signature, secret) => {
    if (!secret || !timestamp || !signature) return false;

    const payload = `${timestamp}.${rawBody}`;

    const expected = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));

    if (a.length !== b.length) return false;

    return crypto.timingSafeEqual(a, b);
};

module.exports = {
    getSecretKey,
    getBaseUrl,
    createProduct,
    listProducts,
    initializeTransaction,
    initializeProductCheckout,
    getCheckoutSession,
    cancelSubscription,
    verifyWebhookSignature
};
