require("dotenv").config();
const express = require("express");
const User = require("../models/User");
const Jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const { OAuth2Client } = require("google-auth-library");
const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const otpStorage = new Map();

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = new User({ name, email, password });
    await user.save();
    const token = Jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({ 
      token, 
      name: user.name, 
      email: user.email, 
      userId: user._id 
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = Jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ 
      token, 
      name: user.name, 
      email: user.email, 
      userId: user._id 
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Google Login Route
router.post("/google-login", async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = new User({
        name: payload.name,
        email: payload.email,
        password: "google-auth", // Placeholder, not used
      });
      await user.save();
    }
    const token = Jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ 
      token, 
      name: user.name, 
      email: user.email, 
      userId: user._id 
    });
  } catch (error) {
    res.status(500).json({ message: "Google login failed" });
  }
});

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Route
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = generateOTP();
    otpStorage.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 }); // OTP valid for 10 minutes

    // Send OTP via Resend
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // Update with your verified domain
      to: email,
      subject: "Your OTP for Trend-Genie Password Reset",
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Reset Password Route
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate inputs
    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and new password are required" });
    }

    // Check OTP validity
    const storedData = otpStorage.get(email);
    if (
      !storedData ||
      storedData.otp !== otp ||
      Date.now() > storedData.expires
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.password = newPassword; // Password will be hashed in pre-save hook
    await user.save();

    otpStorage.delete(email); // Clear OTP after use
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Update Profile Route
router.put("/update-profile", async (req, res) => {
  try {
    const { profilePicture } = req.body;
    
    // Get user ID from JWT token (you'll need to implement middleware for this)
    // For now, we'll use a simple approach - you should implement proper JWT middleware
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const decoded = Jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }
    
    await user.save();
    
    res.status(200).json({ 
      message: "Profile updated successfully",
      profilePicture: user.profilePicture 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Get User Profile Route
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('name email profilePicture');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
