import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./EmailSummaryPage.css";

const defaultMessages = {
  malpractice: `Dear Candidate,

We regret to inform you that your interview has been terminated due to multiple tab switches or copy-paste detections. This behavior violates our interview guidelines.

You may reapply for future opportunities.

Regards,
Smart Interview Team`,
  normal: `Dear Candidate,

Thank you for attending your interview. Our team will review your session and get back to you shortly with the results.

If you wish to receive detailed feedback, please send a request to this email with subject: Request Feedback.

Best of luck!

Regards,
Smart Interview Team`,
};

const EmailSummaryPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");
  const type = searchParams.get("type");
  const roomId = searchParams.get("roomId");

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setMessage(defaultMessages[type] || "");
  }, [type]);

  const handleSend = async () => {
    try {
      await axios.post("/api/send-summary", {
        email,
        roomId,
        type,
        content: message,
      });
      setStatus("✅ Email sent successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error("❌ Failed to send summary email:", err);
      setStatus("❌ Failed to send email.");
    }
  };

  return (
    <div className="email-wrapper">
      <div className="email-card">
        <h2>📧 Final Email to Candidate</h2>
        <p>
          <strong>To:</strong> {email}
        </p>

        <label>Email Content:</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={12}
        />

        <button className="send-button" onClick={handleSend}>
          📤 Send Email
        </button>

        {status && (
          <p className={`status-message ${status.startsWith("✅") ? "success" : "error"}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
};

export default EmailSummaryPage;
