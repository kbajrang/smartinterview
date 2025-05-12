import React, { useState, useEffect } from "react";
import axios from "axios";
import "./InterviewerDashboard.css";

const InterviewerDashboard = () => {
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");

  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);

  const handleSendInvite = async () => {
    if (!email || !roomId || !time) {
      setMessage("❌ Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/send-invite", {
        email,
        roomId,
        timeSlot: time,
      });
      setMessage("✅ Invite sent successfully!");
      fetchInterviews(); // refresh list
    } catch (err) {
      console.error("Error sending invite:", err);
      setMessage("❌ Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/interviews");
      setUpcoming(res.data.upcoming || []);
      setPast(res.data.past || []);
    } catch (err) {
      console.error("Failed to load interviews", err);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-header">🎓 Welcome, Interviewer</h2>

      <div className="dashboard-content">
        {/* Left Panel */}
        <div className="invite-section">
          <h3 className="section-title">📩 Send Invite</h3>
          <div className="invite-form">
            <input
              type="email"
              placeholder="Candidate Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Room ID (6 digits)"
              maxLength={6}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
            <button
              className="invite-button"
              onClick={handleSendInvite}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Invite"}
            </button>
          </div>
          {message && <p className="status-message">{message}</p>}
        </div>

        {/* Right Panel */}
        <div className="interview-section">
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === "upcoming" ? "active" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              📅 Upcoming
            </button>
            <button
              className={`tab-button ${activeTab === "past" ? "active" : ""}`}
              onClick={() => setActiveTab("past")}
            >
              ✅ Past
            </button>
          </div>

          <div className="card-list">
            {(activeTab === "upcoming" ? upcoming : past).length === 0 ? (
              <p className="placeholder-text">No {activeTab} interviews yet.</p>
            ) : (
              (activeTab === "upcoming" ? upcoming : past).map((item, index) => (
                <div key={index} className="interview-card">
                  <p><strong>📧 {item.email}</strong></p>
                  <p>🆔 Room ID: {item.roomId}</p>
                  <p>🕒 Time: {new Date(item.timeSlot).toLocaleString()}</p>
                  {activeTab === "upcoming" && (
                    <a
                      href={`http://localhost:5173/room/${item.roomId}?role=interviewer`}
                      className="join-button"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerDashboard;
