import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";

const InterviewerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      const res = await axios.post("/api/interviewer-login", {
        email,
        password,
      });

      const { interviewer } = res.data;

      // Store session in localStorage
      localStorage.setItem("interviewerId", interviewer.id);
      localStorage.setItem("interviewerName", interviewer.name);

      navigate("/interviewer-dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="join-container">
      <div className="join-form">
        <h2>Interviewer Login</h2>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>Login</button>

        <p style={{ marginTop: "1rem", fontSize: "14px" }}>
          New here?{" "}
          <span
            style={{
              color: "#007bff",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => navigate("/interviewer-register")}
          >
            Create an account
          </span>
        </p>

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      </div>
    </div>
  );
};

export default InterviewerLogin;
