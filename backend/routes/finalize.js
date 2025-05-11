// backend/routes/finalize.js
import express from "express";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kailasabajrang6@gmail.com",
    pass: "wbhlzqvjwsfyvatx", // Use App Password
  },
});

const getTranscriptText = (roomId) => {
  const filePath = path.join("transcripts", `transcript_room_${roomId}.txt`);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "Transcript not found.";
};

router.post("/finalize-failure", async (req, res) => {
  const { email, roomId, violations } = req.body;

  if (!email || !roomId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const transcript = getTranscriptText(roomId);

  const mailOptions = {
    from: '"Smart Interview System" <your.email@gmail.com>',
    to: email,
    subject: "❌ Disqualification Notice - Smart Interview",
    html: `
      <h2>Dear Candidate,</h2>
      <p>You have been <strong>disqualified</strong> from the interview due to malpractice.</p>
      <p><strong>Violations Detected:</strong> ${violations}</p>
      <p><strong>Transcript:</strong></p>
      <pre style="background:#f5f5f5; padding:10px; border:1px solid #ccc;">${transcript}</pre>
      <p>Please avoid such behavior in future interviews.</p>
      <br><p>Regards,<br/>Smart Interview Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Disqualification email sent." });
  } catch (err) {
    console.error("❌ Mail error:", err);
    res.status(500).json({ error: "Failed to send disqualification email." });
  }
});

router.post("/finalize-success", async (req, res) => {
  const { email, roomId } = req.body;

  if (!email || !roomId) {
    return res.status(400).json({ error: "Missing email or roomId" });
  }

  const transcript = getTranscriptText(roomId);

  const mailOptions = {
    from: '"Smart Interview System" <your.email@gmail.com>',
    to: email,
    subject: "✅ Interview Completed - Feedback Coming Soon",
    html: `
      <h2>Dear Candidate,</h2>
      <p>Congratulations on successfully completing your interview.</p>
      <p>Your answers are being reviewed and a detailed feedback report will be sent to you soon.</p>
      <p><strong>Transcript:</strong></p>
      <pre style="background:#f5f5f5; padding:10px; border:1px solid #ccc;">${transcript}</pre>
      <br><p>Regards,<br/>Smart Interview Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Success email sent." });
  } catch (err) {
    console.error("❌ Mail error:", err);
    res.status(500).json({ error: "Failed to send success email." });
  }
});

export default router;
