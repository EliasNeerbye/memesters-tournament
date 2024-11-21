const mongoose = require('mongoose');
const crypto = require('crypto');

const gameSchema = new mongoose.Schema(
    {
        hostUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        players: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                socketId: {
                    type: String,
                    required: true,
                },
            },
        ],
        currentRound: {
            type: Number,
            default: 0,
        },
        state: {
            type: String,
            enum: ["waiting", "playing", "finished"],
            default: "waiting",
        },
        rounds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Round",
            },
        ],
        leaderboard: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                score: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        settings: [
            {
                rounds: {
                    type: Number,
                    required: true,
                    default: 5,
                },
                timeLimit: {
                    type: Number,
                    required: true,
                    default: 300000,
                },
                // Other settings...?
            },
        ],
        code: {
            type: Number,
        },
    },
    { timestamps: true }
);

gameSchema.pre('save', async function (next) {
    // Automatically set game code if not already set
    if (!this.code) {
        this.code = crypto.randomInt(10000000, 99999999).toString();
    }

    // If there are no players, handle based on game state
    if (this.players.length === 0) {
        if (this.state === 'waiting') {
            // Delete the game if it's in 'waiting' with no players
            await this.deleteOne();
        } else if (this.state === 'playing') {
            // Set game to 'finished' if it's in 'playing' with no players
            this.state = 'finished';
        }
    }

    next();
});

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