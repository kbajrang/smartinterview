// src/Login.jsx
import React from "react";
import "./App.css";

const LoginPage = () => {
  return (
    <div className="join-container">
      <div className="join-form">
        <h1>Welcome to Smart Interview</h1>
        <p style={{ fontSize: "16px", marginTop: "1rem", color: "#444" }}>
          🚀 To join an interview, please use the invitation link sent to your email.
        </p>
        <p style={{ fontSize: "14px", marginTop: "1rem", color: "#666" }}>
          If you haven’t received one, contact your interviewer.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
