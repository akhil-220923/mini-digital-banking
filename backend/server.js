require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path"); // ✅ ADD THIS

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes_v2");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoute");
const adminRoutes = require("./routes/adminRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://guileless-sunburst-b156f0.netlify.app"
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FIXED STATIC PATH
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Routes
app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/loans", require("./routes/loanRoutes"));
app.use("/api/issues", require("./routes/issueRoutes"));
app.use("/api/accountant", require("./routes/accountantRoutes"));

// Test Route
app.get("/", (req, res) => {
    res.send("Mini Banking Backend Running");
});

// Error Handler
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.post("/register", (req, res) => {
    console.log("Request received");
    console.log(req.body);
    res.send("Registered");
});