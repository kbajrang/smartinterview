// src/LoginPage.jsx
import "./LoginPage.css";

const LoginPage = () => {
  return (
    <div className="login-background">
      <div className="login-glass-card">
        <h1 className="login-title">Welcome to Smart Interview</h1>
        <p className="login-description">
          🚀 To join an interview, please use the invitation link sent to your email.
        </p>
        <p className="login-note">
          If you haven’t received one, contact your interviewer.
        </p>
        <p className="login-contact">
          📧 For support, write to:{" "}
          <a href="mailto:smartinterviewsystem@gmail.com">
            smartinterviewsystem@gmail.com
          </a>
        </p>
        <p className="interviewer-link">
          🎯 Are you an interviewer?{" "}
          <a href="http://localhost:5000/interviewer-login">
            Login or Sign Up here
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
