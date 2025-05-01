// src/IntervieweePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const IntervieweePage = () => {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  const handleJoin = () => {
    const trimmedRoomId = roomId.trim();
    const trimmedUsername = username.trim();

    if (!trimmedRoomId || !trimmedUsername) {
      alert("Please enter both Room ID and Name!");
      return;
    }

    setJoining(true);
    navigate(
      `/room/${trimmedRoomId}?role=interviewee&name=${encodeURIComponent(trimmedUsername)}`
    );
  };

  return (
    <div className="join-container">
      <div className="join-form">
        <h1>Join Interview Room</h1>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter Your Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={handleJoin} disabled={joining}>
          {joining ? "Joining..." : "Join Room"}
        </button>
      </div>
    </div>
  );
};

export default IntervieweePage;
