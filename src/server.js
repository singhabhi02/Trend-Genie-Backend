require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const Jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const User = require("./models/User");
const recommendRoutes = require("./routes/recommend");

const app = express();
const PORT = process.env.PORT || 5000;
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors());
// Increase payload limit to support base64-encoded profile images.
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Generate JWT token
const token = Jwt.sign({ userId: "123" }, process.env.JWT_SECRET, {
  expiresIn: "1h",
});

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/recommend", recommendRoutes); // ✅ Now using the separate recommendation route
app.use("/api/chat", chatRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
