import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./App.css";

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

  useEffect(() => {
    setMessage(defaultMessages[type] || "");

    // Fetch transcript from localStorage
    const saved = localStorage.getItem("interviewTranscript");
    if (saved) {
      setTranscript(saved);
    } else {
      console.warn("⚠️ Transcript not found in localStorage");
    }
  }, [type]);

  const handleSend = async () => {
    try {
      await axios.post("http://localhost:5000/api/send-summary", {
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

  const handleGeneratePDF = async () => {
    try {
      const res = await axios.post("https://llmintegrationmp.onrender.com/api/analyze", {
        email,
        roomId,
        transcript, // ✅ transcript passed to backend
      });

      const pdfUrl = res.data.pdf;
      alert("✅ PDF feedback generated!");
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error("LLM PDF generation failed:", error);
      alert("❌ Failed to generate PDF.");
    }
  };

  return (
    <div className="join-container" style={{ padding: "2rem" }}>
      <div className="join-form" style={{ width: "600px" }}>
        <h2>📧 Final Email to Candidate</h2>
        <p><strong>To:</strong> {email}</p>
        <textarea
          rows={12}
          style={{
            width: "100%",
            padding: "1rem",
            marginTop: "1rem",
            borderRadius: "10px",
            background: "#2d2d2d",
            color: "#f5f5f5",
            fontFamily: "monospace",
            fontSize: "14px",
          }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button className="invite-button" onClick={handleSend} style={{ marginTop: "1rem" }}>
          Send Email
        </button>

        <button
          className="invite-button"
          style={{ marginTop: "1rem", backgroundColor: "#1e40af" }}
          onClick={handleGeneratePDF}
        >
          📄 Generate Feedback PDF
        </button>

        {status && (
          <p className="status-message" style={{ marginTop: "1rem", color: status.startsWith("✅") ? "lime" : "gold" }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
};

export default EmailSummaryPage;
