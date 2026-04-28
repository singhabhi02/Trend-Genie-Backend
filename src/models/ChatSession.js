const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    timestamp: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      enum: ["text", "movie", "fashion"],
      default: "text",
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Chat",
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatSession", chatSessionSchema);
