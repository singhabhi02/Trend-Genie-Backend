require("dotenv").config();
const express = require("express");
const Jwt = require("jsonwebtoken");
const ChatSession = require("../models/ChatSession");

const router = express.Router();

const getUserIdFromToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return null;
  }
  const decoded = Jwt.verify(token, process.env.JWT_SECRET);
  return decoded.userId;
};

router.get("/sessions", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ message: "No token provided" });
    }

    const sessions = await ChatSession.find({ userId }).sort({ updatedAt: -1 });
    return res.status(200).json(sessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { title = "New Chat", messages = [] } = req.body;
    const session = await ChatSession.create({
      userId,
      title,
      messages,
    });

    return res.status(201).json(session);
  } catch (error) {
    console.error("Error creating chat session:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/sessions/:sessionId", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { sessionId } = req.params;
    const { title, messages } = req.body;

    const updatePayload = {};
    if (typeof title === "string") {
      updatePayload.title = title;
    }
    if (Array.isArray(messages)) {
      updatePayload.messages = messages;
    }

    const updatedSession = await ChatSession.findOneAndUpdate(
      { _id: sessionId, userId },
      updatePayload,
      { new: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    return res.status(200).json(updatedSession);
  } catch (error) {
    console.error("Error updating chat session:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/sessions/:sessionId", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { sessionId } = req.params;
    const deletedSession = await ChatSession.findOneAndDelete({
      _id: sessionId,
      userId,
    });

    if (!deletedSession) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    return res.status(200).json({ message: "Chat session deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
