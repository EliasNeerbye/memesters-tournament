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
    isVerified: {
        type: Boolean,
        default: false
    },
    roles: {
        type: [String],
        enum: ['user', 'admin', 'moderator'],
        default: ['user']
    },
    profile: {
        displayName: {
        type: String,
        trim: true,
        maxlength: [50, 'Display name must be less than 50 characters']
        },
        avatar: {
        type: String,
        default: null
        }
    },
    lastLogin: {
        type: Date,
        default: null
    }
    }, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Method to generate authentication token
userSchema.methods.generateAuthToken = function() {
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

// Static method to find by login credentials
userSchema.statics.findByCredentials = async function(login) {
    // Allow login by either username or email
    return await this.findOne({
        $or: [
        { username: login },
        { email: login }
        ]
    });
};

// Virtual for full name or username display
userSchema.virtual('displayIdentifier').get(function() {
    return this.profile.displayName || this.username;
});

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

// Modify toJSON method to remove sensitive information
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.__v;
    return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;