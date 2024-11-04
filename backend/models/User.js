const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username must be less than 30 characters'],
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9_-]+$/.test(v);
            },
            message: 'Username can only contain letters, numbers, underscores, and hyphens'
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
        validator: validator.isEmail,
        message: 'Invalid email address'
        }
    },
    tempEmail: {
        type: String,
        required: false,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
        validator: validator.isEmail,
        message: 'Invalid email address'
        },
        default: null
    },
    pfp: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    roles: {
        type: [String],
        enum: ['user', 'admin', 'moderator'],
        default: ['user']
    },
    lastLogin: {
        type: Date,
        default: null
    },
    allLogins: {
        type: [
            {
                ip: { type: "string" },
                date: { type: Date }
            }
        ]
    }
    }, { 
    timestamps: true
});

// Method to generate authentication token
userSchema.methods.generateAuthToken = function() {
    this.lastLogin = Date.now();
    return jwt.sign(
        { 
            _id: this._id, 
            username: this.username,
            email: this.email,
            roles: this.roles
        }, 
            process.env.JWT_SECRET, 
        { 
            expiresIn: '7d' 
        }
    );
};

// Pre-save hook for additional processing
userSchema.pre('save', function(next) {
    // Update last modified timestamp
    this.updatedAt = Date.now();
    
    // Ensure username is lowercase for consistency
    if (this.isModified('username')) {
        this.username = this.username.toLowerCase();
    }
    
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;