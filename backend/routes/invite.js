// backend/routes/invite.js
import express from "express";
import nodemailer from "nodemailer";
import ScheduledInterview from "../models/ScheduledInterview.js";

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER || "kailasabajrang6@gmail.com",
    pass: process.env.MAIL_PASS || "wbhlzqvjwsfyvatx", // Use app password!
  },
});

router.post("/send-invite", async (req, res) => {
  const { email, roomId, timeSlot } = req.body;

  if (!email || !roomId || !timeSlot) {
    return res.status(400).json({ error: "Missing email, roomId, or timeSlot" });
  }

  const joinUrl = `http://localhost:5173/precheck/${roomId}?name=Candidate&role=interviewee`;

  const mailOptions = {
    from: `"Smart Interview System" <${process.env.MAIL_USER || "kailasabajrang6@gmail.com"}>`,
    to: email,
    subject: "📝 Your Interview Invitation",
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2 style="color:#4f46e5;">Interview Invitation</h2>
        <p>You are invited for a technical interview.</p>
        <p><strong>Date & Time:</strong> ${new Date(timeSlot).toLocaleString()}</p>
        <p><strong>Join Link:</strong> <a href="${joinUrl}" target="_blank">${joinUrl}</a></p>
        <p><strong>Room ID:</strong> ${roomId}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    await ScheduledInterview.create({ email, roomId, timeSlot });
    return res.status(200).json({ message: "✅ Invite sent and stored successfully!" });
  } catch (error) {
    console.error("❌ Email/send error:", error);
    return res.status(500).json({ error: "Failed to send invite or store record" });
  }
});

// ✅ GET /api/interviews — fetch upcoming and past interviews
router.get("/interviews", async (req, res) => {
  try {
    const now = new Date();
    const upcoming = await ScheduledInterview.find({ timeSlot: { $gte: now } }).sort("timeSlot");
    const past = await ScheduledInterview.find({ timeSlot: { $lt: now } }).sort("-timeSlot");

    res.status(200).json({ upcoming, past });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch interview data" });
  }
});
// ✅ GET /api/get-email-by-room?roomId=123456
router.get("/get-email-by-room", async (req, res) => {
  try {
    const { roomId } = req.query;
    if (!roomId) return res.status(400).json({ error: "roomId missing" });

    const interview = await ScheduledInterview.findOne({ roomId });
    if (!interview) return res.status(404).json({ error: "Email not found" });

    return res.status(200).json({ email: interview.email });
  } catch (error) {
    console.error("❌ Error fetching email by roomId:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
// POST /api/send-summary
router.post("/send-summary", async (req, res) => {
  const { email, content } = req.body;

  if (!email || !content) {
    return res.status(400).json({ error: "Missing email or content" });
  }

  const mailOptions = {
    from: `"Smart Interview System" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "📩 Interview Summary",
    text: content,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("❌ Email send error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
});



export default router;
