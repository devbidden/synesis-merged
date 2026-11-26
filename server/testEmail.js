
require('dotenv').config();

const { sendLicenseEmail } = require('./services/emailService');

async function testEmail() {
    try {
        console.log('Checking SMTP configuration...');

        console.log({
            hostConfigured: !!(process.env.SMTP_HOST || process.env.EMAIL_HOST),
            userConfigured: !!(process.env.SMTP_USER || process.env.EMAIL_USER),
            passwordConfigured: !!(process.env.SMTP_PASSWORD || process.env.EMAIL_PASS)
        });

        const result = await sendLicenseEmail({
            name: 'SynesisBot Test',
            email: 'obunadikechioma8@gmail.com',
            licenseKey: 'SYN-TEST-1234-5678',
            plan: 'BASIC',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        console.log('EMAIL SENT SUCCESSFULLY');
        console.log('Message ID:', result.messageId);
        console.log('Accepted:', result.accepted);

    } catch (error) {
        console.error('EMAIL TEST FAILED:', error.message);
    }
}

testEmail();
