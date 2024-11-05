const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '7d', // Automatically delete documents after 7 days
    },
});

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
