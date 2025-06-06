import { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./InterviewerDashboard.css";

const generateRoomId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const InterviewerDashboard = () => {
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState(generateRoomId());
  const [time, setTime] = useState(null);
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
      await axios.post("/api/send-invite", {
        email,
        roomId,
        timeSlot: time.toISOString(),
      });
      setMessage("✅ Invite sent successfully!");
      fetchInterviews();
      setEmail("");
      setTime(null);
      setRoomId(generateRoomId());
    } catch (err) {
      console.error("Error sending invite:", err);
      setMessage("❌ Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async () => {
    try {
      const res = await axios.get("/api/interviews");
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

            <div className="room-id-wrapper">
              <label className="room-id-label">
                Room ID
                <span className="regen-btn" onClick={() => setRoomId(generateRoomId())}>
                  🔄 Regenerate
                </span>
              </label>
              <input type="text" value={roomId} className="readonly" readOnly />
            </div>

            <div className="date-time-wrapper">
              <label className="input-label">Select Date & Time</label>
              <DatePicker
                selected={time}
                onChange={(date) => setTime(date)}
                showTimeSelect
                minDate={new Date()}
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="datepicker-input"
                placeholderText="Click to select date & time"
              />
            </div>

            <button className="invite-button" onClick={handleSendInvite} disabled={loading}>
              {loading ? "Sending..." : "Send Invite"}
            </button>
          </div>
          {message && <p className="status-message">{message}</p>}
        </div>

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
                      href={`${window.location.origin}/room/${item.roomId}?role=interviewer`}
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
