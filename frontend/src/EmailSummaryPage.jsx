import React, { useState, useEffect } from "react";
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
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [pdfPath, setPdfPath] = useState(null);

  useEffect(() => {
    setMessage(defaultMessages[type] || "");

    const saved = localStorage.getItem("interviewTranscript");
    if (saved) {
      setTranscript(saved);
    } else {
      console.warn("⚠️ Transcript not found in localStorage");
    }
  }, [type]);

  const handleGeneratePDF = async () => {
    try {
      const res = await axios.post("https://llmintegrationmp.onrender.com/api/analyze", {
        email,
        roomId,
        transcript,
      });

      const pdfUrl = res.data.pdf;
      setPdfPath(pdfUrl);
      alert("✅ PDF feedback generated!");
    } catch (error) {
      console.error("LLM PDF generation failed:", error);
      alert("❌ Failed to generate PDF.");
    }
  };

  const handleSend = async () => {
    try {
      await axios.post("http://localhost:5000/api/send-summary", {
        email,
        roomId,
        type,
        content: message + "\n\n" + personalNote,
        pdf: pdfPath, // 👈 Pass PDF URL for backend to fetch and attach
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
        <p><strong>To:</strong> {email}</p>

        <label>Default Message:</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <label>💬 Personal Feedback (Optional):</label>
        <textarea
          placeholder="Write any personal note or detailed comment to include in the email..."
          value={personalNote}
          onChange={(e) => setPersonalNote(e.target.value)}
        />

        <button className="send-button" onClick={handleSend}>
          📤 Send Email with Feedback
        </button>

        <button
          className="send-button"
          style={{ backgroundColor: "#1e40af" }}
          onClick={handleGeneratePDF}
        >
          📄 Generate Feedback PDF
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
