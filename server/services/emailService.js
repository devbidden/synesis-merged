
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

const sendLicenseEmail = async ({ name, email, licenseKey, plan, expiresAt }) => {
    return transporter.sendMail({
        from: `"SynesisBot" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your SynesisBot License Key',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#222;">
                <h2>Welcome to SynesisBot, ${name}!</h2>
                <p>Your payment was successful. Your license is ready.</p>

                <div style="background:#f4f4f4;padding:20px;border-radius:8px;text-align:center;">
                    <p>Your License Key</p>
                    <h2 style="letter-spacing:2px;">${licenseKey}</h2>
                </div>

                <p><strong>Plan:</strong> ${plan}</p>
                <p><strong>Expiry:</strong> ${expiresAt ? new Date(expiresAt).toDateString() : 'Lifetime'
            }</p>

                <p>Keep your license key safe. You will need it to activate SynesisBot.</p>
                <p>For assistance, contact support@synesisbot.com.</p>

                <p>Regards,<br><strong>SynesisBot Team</strong></p>
            </div>
        `
    });
};

module.exports = { sendLicenseEmail };
