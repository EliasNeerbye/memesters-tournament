const mongoose = require('mongoose');

// Submission schema
const submissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    memeIndex: { type: String, required: true },
    captions: [{ type: String, required: true }],
    score: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["pending", "judged"],
        default: "pending",
    },
});

// Judgement schema
const judgementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submissionsRanked: [{ type: mongoose.Schema.Types.ObjectId, ref: "Submission", required: true }],
});

// Round schema
const roundSchema = new mongoose.Schema(
    {
        gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
        roundNumber: { type: Number, required: true },
        memeTemplates: [
            {
                type: String,
                required: true,
                get: function (data) {
                    try {
                        return JSON.parse(data);
                    } catch (error) {
                        return data;
                    }
                },
                set: function (data) {
                    return JSON.stringify(data);
                },
            },
        ],
        submissions: [submissionSchema],
        judgements: [judgementSchema],
        status: {
            type: String,
            enum: ["submitting", "judging", "completed"],
            default: "submitting",
        },
        startTime: { type: Date, default: Date.now },
        endTime: { type: Date },
    },
    { timestamps: true }
);

const Round = mongoose.model('Round', roundSchema);

module.exports = Round;
