// src/InterviewerPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const generateRoomId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const InterviewerPage = () => {
  const [roomId, setRoomId] = useState(generateRoomId());
  const navigate = useNavigate();

  const handleStart = () => {
    navigate(`/room/${roomId}?role=interviewer`);
  };

  return (
    <div className="join-container">
      <div className="join-form">
        <h1>Room Created</h1>
        <input type="text" value={roomId} readOnly />
        <button onClick={handleStart}>Start Interview</button>
      </div>
    </div>
  );
};

export default InterviewerPage;
