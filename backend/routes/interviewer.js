import express from "express";
import Interviewer from "../models/interviewer.js";
import bcrypt from "bcrypt";

const router = express.Router();

// ✅ Registration Route
router.post("/interviewer-register", async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  try {
    const existingUser = await Interviewer.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    // ✅ DO NOT hash manually — handled by schema
    const newInterviewer = new Interviewer({
      name,
      email,
      phone,
      password,
    });

    await newInterviewer.save();

    return res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Login Route
router.post("/interviewer-login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const interviewer = await Interviewer.findOne({ email });
    if (!interviewer) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, interviewer.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    return res.status(200).json({
      message: "Login successful",
      interviewer: {
        id: interviewer._id,
        name: interviewer.name,
        email: interviewer.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
