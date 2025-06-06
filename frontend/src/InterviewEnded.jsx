// src/InterviewEnded.jsx
import { useNavigate } from "react-router-dom";

const InterviewEnded = () => {
  const navigate = useNavigate();

  return (
    <div className="join-container">
      <div className="join-form">
        <h2>🚫 Interview Ended</h2>
        <p>
          The interview has been ended by the interviewer. If this was due to a technical issue,
          please contact support at <strong>support@smartinterview.com</strong>.
        </p>
        <button onClick={() => navigate("/")}>Return to Home</button>
      </div>
    </div>
  );
};

export default InterviewEnded;
