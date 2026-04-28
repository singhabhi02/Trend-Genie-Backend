require("dotenv").config();
const mongoose = require("mongoose");

// Test MongoDB connection
async function testConnection() {
  try {
    console.log("Testing MongoDB connection...");
    console.log("MONGO_URI:", process.env.MONGO_URI || "Not set");
    console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");
    
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI environment variable is not set!");
      console.log("Please create a .env file with the following content:");
      console.log("MONGO_URI=mongodb://localhost:27017/trend-genie");
      console.log("JWT_SECRET=your-secret-key");
      return;
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ Successfully connected to MongoDB!");
    console.log("Database:", mongoose.connection.db.databaseName);
    
    // Test User model
    const User = require("./src/models/User");
    const userCount = await User.countDocuments();
    console.log("Users in database:", userCount);
    
    await mongoose.disconnect();
    console.log("✅ Test completed successfully!");
    
  } catch (error) {
    console.error("❌ Error testing connection:", error.message);
    if (error.name === 'MongoNetworkError') {
      console.log("💡 Make sure MongoDB is running on your system");
      console.log("💡 You can start MongoDB with: mongod");
    }
  }
}

testConnection();

