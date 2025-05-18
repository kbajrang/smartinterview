// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./Login"; // ✅ Add LoginPage
import InterviewerPage from "./InterviewerPage";
import IntervieweePage from "./IntervieweePage";
import RoomPage from "./RoomPage";
import InterviewerLogin from "./InterviewerLogin";
import InterviewerDashboard from "./InterviewerDashboard";
import InterviewerRegister from "./InterviewerRegister";
import PreInterviewCheck from "./PreInterviewCheck";
import EmailSummaryPage from "./EmailSummaryPage";

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
        <Route path="/interviewer-login" element={<InterviewerLogin />} />
        <Route
          path="/interviewer-dashboard"
          element={<InterviewerDashboard />}
        />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/interviewer-register" element={<InterviewerRegister />} />
        <Route path="/precheck/:roomId" element={<PreInterviewCheck />} />
        <Route path="/send-summary" element={<EmailSummaryPage />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
