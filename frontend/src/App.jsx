// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import InterviewerPage from "./InterviewerPage";
import IntervieweePage from "./IntervieweePage";
import RoomPage from "./RoomPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InterviewerPage />} />
        <Route path="/join" element={<IntervieweePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        {/* 404 - Invalid route handling */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
