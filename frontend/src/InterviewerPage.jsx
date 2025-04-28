// src/InterviewerPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const generateRoomId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const InterviewerPage = () => {
  const [roomId, setRoomId] = useState(generateRoomId());
  const [copySuccess, setCopySuccess] = useState("");
  const navigate = useNavigate();

  const handleStart = () => {
    navigate(`/room/${roomId}?role=interviewer`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  return (
    <div className="join-container">
      <div className="join-form">
        <h1>Room Created</h1>
        <div style={{ position: "relative" }}>
          <input type="text" value={roomId} readOnly style={{ marginBottom: "10px" }} />
          <button onClick={handleCopy} style={{ marginTop: "5px" }}>Copy Room ID</button>
          {copySuccess && <p style={{ color: "green", fontSize: "12px" }}>{copySuccess}</p>}
        </div>
        <button onClick={handleStart} style={{ marginTop: "15px" }}>
          Start Interview
        </button>
      </div>
    </div>
  );
};

export default InterviewerPage;
