const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: { // For 1-on-1 chats
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    groupChat: { // For group chats
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupChat'
    },
    content: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

// Indexes for querying messages efficiently
MessageSchema.index({ groupChat: 1, createdAt: -1 }); // For fetching group messages
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 }); // For 1-on-1 messages
MessageSchema.index({ recipient: 1, sender: 1, createdAt: -1 }); // For 1-on-1 messages (other direction)


module.exports = mongoose.model('Message', MessageSchema);