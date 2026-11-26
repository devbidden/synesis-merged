const express = require('express');
const router = express.Router();
const limitCancellationAttempts = require('../middleware/limitCancellationAttempts');

const {
    initializePayment,
    cancelRecurringSubscription
} = require('../controllers/paymentController');

router.post('/initialize', initializePayment);
router.post('/cancel-subscription', limitCancellationAttempts, cancelRecurringSubscription);

module.exports = router;
