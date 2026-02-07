// models/Conversation.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true,
    },
    content: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const ConversationSchema = new mongoose.Schema({
    messages: [MessageSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Conversation ||
    mongoose.model("Conversation", ConversationSchema);

