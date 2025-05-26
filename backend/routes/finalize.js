// backend/routes/finalize.js
import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "smartinterviwesystem@gmail.com",
    pass: "qmsmpwdmnzbtlvff", // App Password
  },
});

// Disqualification Email
router.post("/finalize-failure", async (req, res) => {
  const { email, roomId, violations } = req.body;

  if (!email || !roomId || !violations) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const mailOptions = {
    from: '"Smart Interview System" <smartinterviwesystem@gmail.com>',
    to: email,
    subject: "Interview Outcome: Disqualification Due to Policy Violation",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Dear Candidate,</h2>
        <p>We regret to inform you that your recent interview conducted through the <strong>Smart Interview System</strong> has resulted in disqualification.</p>
        <p><strong>Reason:</strong> One or more violations of interview policy were detected during the session.</p>
        <p>We encourage you to uphold integrity and professionalism in all future assessments.</p>
        <p>If you believe this was a mistake, feel free to contact our support team.</p>
        <br>
        <p>Best regards,<br><strong>Smart Interview Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Disqualification email sent successfully." });
  } catch (err) {
    console.error("❌ Mail error:", err);
    res.status(500).json({ error: "Failed to send disqualification email." });
  }
});

// Success Email
router.post("/finalize-success", async (req, res) => {
  const { email, roomId } = req.body;

  if (!email || !roomId) {
    return res.status(400).json({ error: "Missing email or roomId" });
  }

  const mailOptions = {
    from: '"Smart Interview System" <smartinterviwesystem@gmail.com>',
    to: email,
    subject: "Interview Completed Successfully – Feedback Pending",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Dear Candidate,</h2>
        <p>Thank you for attending your interview through the <strong>Smart Interview System</strong>.</p>
        <p>Your session has been marked as <strong>completed successfully</strong>.</p>
        <p>If you would like to receive detailed feedback, please contact your interviewer by email with the subject line: <strong>Request Feedback</strong>.</p>
        <p>We wish you all the best in your career journey!</p>
        <br>
        <p>Warm regards,<br><strong>Smart Interview Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Success email sent successfully." });
  } catch (err) {
    console.error("❌ Mail error:", err);
    res.status(500).json({ error: "Failed to send success email." });
  }
});

export default router;
