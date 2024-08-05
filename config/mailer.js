// mailer.js
const nodemailer = require('nodemailer');
const moment = require('moment');
const requestIp = require('request-ip');
const geoip = require('geoip-lite');
const useragent = require('useragent');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    }
});

const sendWelcomeEmail = (user, req) => {
    const clientIp = requestIp.getClientIp(req);
    const geo = geoip.lookup(clientIp);
    const agent = useragent.parse(req.headers['user-agent']);
    const timestamp = moment().format('MMMM Do YYYY, h:mm:ss a');
    const location = geo ? `${geo.city}, ${geo.region}, ${geo.country}` : 'Unknown location';
    const device = `${agent.toAgent()} on ${agent.os}`;

    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: user.email,
        subject: 'Welcome to HogwartsEdx!',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="background-color: #f5f5f5; padding: 20px;">
                    <h2 style="color: #4b0082;">Welcome to HogwartsEdx, ${user.name}!</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Thank you for signing in with Google. We are excited to have you join us!</p>
                    <h3>Sign-in Details</h3>
                    <ul style="list-style-type: none; padding: 0;">
                        <li><strong>Username:</strong> ${user.name}</li>
                        <li><strong>Email ID:</strong> ${user.email}</li>
                        <li><strong>Location:</strong> ${location}</li>
                        <li><strong>Timestamp:</strong> ${timestamp}</li>
                        <li><strong>Device:</strong> ${device}</li>
                    </ul>
                    <p>If you believe that this sign-in is suspicious, please reset your password immediately by clicking the button below:</p>
                    <a href="https://hogwartsedx.vercel.app/forgot-password" style="display: inline-block; padding: 10px 20px; color: white; background-color: #4b0082; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p style="margin-top: 20px;">Best regards,<br>The HogwartsEdx Team</p>
                </div>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending welcome email:', error);
        } else {
            console.log('Welcome email sent:', info.response);
        }
    });
};

module.exports = { sendWelcomeEmail };
