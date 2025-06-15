const mongoose = require('mongoose');

const GroupChatSchema = new mongoose.Schema({
    name: { // Optional: user-defined group name
        type: String,
        trim: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastMessage: {
        text: String,
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('GroupChat', GroupChatSchema);