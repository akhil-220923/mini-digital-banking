const express = require("express");
const router = express.Router();

const Transaction = require("../models/Transaction");
const { verifyUser } = require("../middleware/auth");

/**
 * ✅ TEST ROUTE
 * GET /api/transactions
 * Just to check if route is working
 */
router.get("/", verifyUser, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });

    res.status(200).json({
      message: "Transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * ✅ TEST CREATE TRANSACTION
 * POST /api/transactions
 */
router.post("/", verifyUser, async (req, res) => {
  try {
    const { amount, type, receiverId } = req.body;

    if (!amount || !type) {
      return res.status(400).json({
        message: "Amount and type are required",
      });
    }

    const newTransaction = new Transaction({
      sender: req.user.id, // comes from verifyUser middleware
      receiver: receiverId || null,
      amount,
      type,
    });

    await newTransaction.save();

    res.status(201).json({
      message: "Transaction created successfully",
      data: newTransaction,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;