const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    hostUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    players: [{
        userId: {
        type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        socketId: {
            type: String,
            required: true
        }
    }],
    currentRound: {
        type: Number,
        default: 1
    },
    state: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'waiting'
    },
    rounds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Round'
    }],
    leaderboard: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        score: {
            type: Number,
            default: 0
        }
    }]
}, { timestamps: true });

// Add method to check if game is full
gameSchema.methods.isFull = function() {
    return this.players.length >= 13; // Adjust max players as needed
};

// Add method to check if user is in game
gameSchema.methods.hasPlayer = function(userId) {
    return this.players.some(player => player.userId.equals(userId));
};

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;