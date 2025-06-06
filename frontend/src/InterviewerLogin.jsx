import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./InterviwerLogin.css";

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
      const res = await axios.post("/api/interviewer-login", { email, password });
      const { interviewer } = res.data;
      localStorage.setItem("interviewerId", interviewer.id);
      localStorage.setItem("interviewerName", interviewer.name);
      navigate("/interviewer-dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Interviewer Login</h2>

        <input
          type="email"
          className="login-input"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="login-input"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-button" onClick={handleLogin}>
          Login
        </button>

        <p className="login-footer">
          New here?{" "}
          <span className="login-link" onClick={() => navigate("/interviewer-register")}>
            Create an account
          </span>
        </p>

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
};

export default InterviewerLogin;
