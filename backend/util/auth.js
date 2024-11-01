const Code = require('../models/Code');
const User = require('../models/User');
const nodemailer = require('nodemailer');

class AuthService {
    // Configure nodemailer transporter
    constructor() {
        this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
        });
    }

    // Generate and send verification code
    async generateLoginCode(contact, user = null) {
        try {
        // Create a new verification code
        const code = new Code({
            contact,
            user: user ? user._id : null,
            purpose: 'login'
        });
        
        await code.save();

        // Send email with verification code
        await this.sendVerificationEmail(contact, code.code);

        return code;
        } catch (error) {
        console.error('Code generation error:', error);
        throw new Error('Failed to generate verification code');
        }
    }

    // Send verification email
    async sendVerificationEmail(email, code) {
        try {
        await this.transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Your Login Verification Code',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Your Verification Code</h2>
                <p>Your 6-digit verification code is:</p>
                <h1 style="letter-spacing: 10px; text-align: center;">${code}</h1>
                <p>This code will expire in 5 minutes.</p>
            </div>
            `
        });
        } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send verification email');
        }
    }

    // Verify login code
    async verifyLoginCode(contact, code) {
        try {
        // Find and validate the code
        const verificationCode = await Code.findValidCode(contact, code);

        if (!verificationCode) {
            throw new Error('Invalid or expired code');
        }

        // Find or create user if not exists
        let user = await User.findOne({ email: contact });
        if (!user) {
            user = new User({ 
            email: contact,
            isVerified: true 
            });
            await user.save();
        }

        // Mark code as used
        await verificationCode.markAsUsed();

        // Generate authentication token
        const token = user.generateAuthToken();

        return { user, token };
        } catch (error) {
        console.error('Code verification error:', error);
        throw error;
        }
    }
}

module.exports = new AuthService();