const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters long"],
            maxlength: [30, "Username must be less than 30 characters"],
            validate: {
                validator: function (v) {
                    return /^[a-zA-Z0-9_-]+$/.test(v);
                },
                message: "Username can only contain letters, numbers, underscores, and hyphens",
            },
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
            validate: {
                validator: validator.isEmail,
                message: "Invalid email address",
            },
        },
        tempEmail: {
            type: String,
            lowercase: true,
            trim: true,
            validate: {
                validator: validator.isEmail,
                message: "Invalid email address",
            },
        },
        pfp: {
            type: String,
            default: null,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        roles: {
            type: [String],
            enum: ["user", "admin", "moderator"],
            default: ["user"],
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        allLogins: {
            type: [
                {
                    ip: { type: "string" },
                    date: { type: Date },
                },
            ],
        },
        currentGame: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Game",
        },
        currentMemes: [String],
    },
    {
        timestamps: true,
    }
);

// Method to generate authentication token
userSchema.methods.generateAuthToken = async function(ip) {
    this.lastLogin = Date.now();
    
    // Add the current login to allLogins
    this.allLogins.push({
        ip: ip,
        date: new Date()
    });

    // Limit the array to the last 10 logins (optional)
    if (this.allLogins.length > 20) {
        this.allLogins = this.allLogins.slice(-10);
    }

    // Save the updated user document
    await this.save();

    const token = jwt.sign(
        { 
            _id: this._id,
            email: this.email
        }, 
        process.env.JWT_SECRET, 
        { 
            expiresIn: '7d' 
        }
    );

    return token;
}


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