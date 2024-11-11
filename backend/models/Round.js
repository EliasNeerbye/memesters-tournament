const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memeId: { type: String, required: true },
    caption: { type: String, required: true },
    score: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['pending', 'judged'], 
        default: 'pending' 
    }
});

const roundSchema = new mongoose.Schema({
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    roundNumber: { type: Number, required: true },
    memes: [{ type: String, required: true }],
    submissions: [submissionSchema],
    status: { 
        type: String, 
        enum: ['inProgress', 'completed'], 
        default: 'inProgress' 
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date }
}, { timestamps: true });

const Round = mongoose.model('Round', roundSchema);

module.exports = Round;