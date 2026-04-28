require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increased limit for profile pictures

// In-memory storage for testing (replace with MongoDB later)
const users = new Map();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

// Mock user data for testing
users.set("test-user", {
  id: "test-user",
  name: "Test User",
  email: "test@example.com",
  profilePicture: null
});

// Generate JWT token
const generateToken = (userId) => {
  return Jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
};

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running! (Simple version)");
});

// Mock auth routes for testing
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  // Simple mock login
  if (email === "test@example.com" && password === "password") {
    const token = generateToken("test-user");
    res.json({
      token,
      name: "Test User",
      email: "test@example.com",
      userId: "test-user"
    });
  } else {
    res.status(400).json({ message: "Invalid credentials" });
  }
});

// Update profile route
app.put("/api/auth/update-profile", (req, res) => {
  try {
    const { profilePicture } = req.body;
    
    // Get user ID from JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const decoded = Jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    
    // Update user profile picture
    if (users.has(userId)) {
      const user = users.get(userId);
      user.profilePicture = profilePicture;
      users.set(userId, user);
      
      console.log("Profile picture updated for user:", userId);
      
      res.status(200).json({ 
        message: "Profile updated successfully",
        profilePicture: user.profilePicture 
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Get user profile route
app.get("/api/auth/profile/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    
    if (users.has(userId)) {
      const user = users.get(userId);
      res.status(200).json({
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple server is running on http://localhost:${PORT}`);
  console.log("This is a test version without MongoDB");
  console.log("Use test@example.com / password to login");
});

