// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Login"; // ✅ Add LoginPage
import InterviewerPage from "./InterviewerPage";
import IntervieweePage from "./IntervieweePage";
import RoomPage from "./RoomPage";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* ✅ LoginPage first */}
        <Route path="/" element={<LoginPage />} />

        {/* ✅ After login navigate here */}
        <Route path="/interviewer" element={<InterviewerPage />} />
        <Route path="/interviewee" element={<IntervieweePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
