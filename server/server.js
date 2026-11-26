require('dotenv').config();
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const licenseRoutes = require('./routes/licenseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { handleBachsWebhook } = require('./controllers/webhookController');

const app = express();

app.use(cors());

// Keep the webhook body raw so Bachs can verify its signature.
app.post(
    '/api/payment/webhook',
    express.raw({ type: 'application/json' }),
    handleBachsWebhook
);

app.use(express.json());

// Routes
app.use('/api/license', licenseRoutes);
app.use('/api/payment', paymentRoutes);

// Start server after MongoDB connects
const startServer = async () => {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
