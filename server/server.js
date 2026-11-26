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
app.use(express.json());

// Webhook route must come before express.json()
app.post(
    '/api/payment/webhook',
    express.raw({ type: 'application/json' }),
    handleBachsWebhook
);
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