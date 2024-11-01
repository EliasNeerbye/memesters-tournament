const mongoose = require('mongoose');
const crypto = require('crypto');

const CodeSchema = new mongoose.Schema({
    // Unique verification code
    code: {
        type: String,
        required: true,
        unique: true
    },
    
    // Optional reference to user (if code is user-specific)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Email or contact method the code was sent to
    contact: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    
    // Type of contact method (email, phone, etc.)
    contactType: {
        type: String,
        enum: ['email', 'phone'],
        default: 'email'
    },
    
    // Purpose of the code (login, password reset, etc.)
    purpose: {
        type: String,
        enum: ['login', 'password_reset', 'account_verification'],
        default: 'login'
    },
    
    // Number of times code has been attempted
    attempts: {
        type: Number,
        default: 0,
        max: 3 // Limit verification attempts
    },
    
    // Flags for code status
    isUsed: {
        type: Boolean,
        default: false
    },
    
    // Automatically expires after 5 minutes
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // 5 minutes in seconds
    }
    }, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Pre-save hook to generate a secure random code
CodeSchema.pre('save', function(next) {
    // If code is not already set, generate a new one
    if (!this.code) {
        // Generate a 6-digit numeric code
        this.code = crypto.randomInt(100000, 999999).toString();
    }
    next();
});

// Method to check if code is valid and not expired
CodeSchema.methods.isValid = function() {
    const now = new Date();
    const codeCreatedAt = this.createdAt;
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    return (
        !this.isUsed && 
        codeCreatedAt > fiveMinutesAgo &&
        this.attempts < 3
    );
};

// Static method to find and validate a code
CodeSchema.statics.findValidCode = async function(contact, code, purpose = 'login') {
    const verificationCode = await this.findOne({ 
        contact, 
        code, 
        purpose,
        isUsed: false
    });
    
    return verificationCode && verificationCode.isValid() ? verificationCode : null;
};

// Method to increment verification attempts
CodeSchema.methods.incrementAttempts = function() {
    this.attempts += 1;
    return this.save();
};

// Method to mark code as used
CodeSchema.methods.markAsUsed = function() {
    this.isUsed = true;
    return this.save();
};

const Code = mongoose.model('Code', CodeSchema);

module.exports = Code;