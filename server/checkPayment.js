
require('dotenv').config();

const { getCheckoutSession } = require('./services/bachsService');

async function checkPayment() {
    try {
        const session = await getCheckoutSession(
            'chk_VnOUIBd97iQs8CPp'
        );

        console.log('Bachs checkout response:');
        console.log(JSON.stringify(session, null, 2));

    } catch (error) {
        console.error('Payment verification failed:', error.message);
    }
}

checkPayment();
