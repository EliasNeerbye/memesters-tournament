const Code = require('../models/Code');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class AuthService {
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

    async generateLoginCode(contact, user = null) {
        try {
            // Generate a 6-digit numeric code
            const plainCode = crypto.randomInt(100000, 999999).toString();

            // Create a new verification code
            const code = new Code({
                contact,
                user: user ? user._id : null,
                purpose: 'login',
                code: plainCode // This will be hashed in the pre-save hook
            });
            
            await code.save();

            // Send email with plain text verification code
            if(await this.sendVerificationEmail(contact, plainCode)){
                return true;
            }

            return false;
        } catch (error) {
            console.error('Code generation error:', error);
            throw new Error('Failed to generate verification code');
        }
    }

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
            return true;
        } catch (error) {
            console.error('Email sending error:', error);
            throw new Error('Failed to send verification email');
        }
    }

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

    async jwtValidation(token = null, secret) {
        if (!token) {
            return {error: "No token"};
        }

        try {
            const decoded = jwt.verify(token, secret);
            return decoded;
        } catch (error) {
            return {error};
        }
    }
}

module.exports = new AuthService();