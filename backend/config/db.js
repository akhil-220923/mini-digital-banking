const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/minibank";
    await mongoose.connect(uri);

    console.log("MongoDB Connected");
  } catch (error) {
    console.log("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;