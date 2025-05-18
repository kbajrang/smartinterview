import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./App.css";

const IntervieweeForm = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resume, setResume] = useState(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) {
      setError("❌ Missing room ID in URL.");
    }
  }, [roomId]);

  const handleJoin = async () => {
    setError("");

    if (!name.trim() || !email.trim() || !phone.trim() || !age.trim()) {
      setError("Please fill all fields.");
      return;
    }

    if (!resume) {
      setError("Please upload your resume.");
      return;
    }

    try {
      setJoining(true);

      // 1. Register user
      const registerRes = await axios.post("/api/register", {
        name,
        age,
        email,
        phone,
        role: "interviewee",
        roomId,
      });

      const userId = registerRes.data.userId;

      // 2. Upload resume
      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.split(",")[1]; // strip data:...base64,
        const contentType = resume.type;

        const uploadRes = await axios.post("/api/upload-resume", {
          name,
          roomId,
          file: base64String,
          filename: resume.name,
          contentType,
        });

        if (!uploadRes.data.message) {
          setError("Resume upload failed.");
          setJoining(false);
          return;
        }

        navigate(`/precheck/${roomId}?name=${encodeURIComponent(name)}`);
      };
      reader.readAsDataURL(resume);

      // 3. Redirect to system check
      navigate(`/precheck/${roomId}?name=${encodeURIComponent(name)}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
      setJoining(false);
    }
  };

  return (
    <div className="join-container">
      <div className="join-form">
        <h2>Interview Details</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setResume(e.target.files[0])}
        />

        <button onClick={handleJoin} disabled={joining}>
          {joining ? "Joining..." : "Continue to System Check"}
        </button>

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      </div>
    </div>
  );
};

export default IntervieweeForm;
