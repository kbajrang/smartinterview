// src/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css"; // Assuming you have basic styles

const LoginPage = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [resume, setResume] = useState(null);
  const [selectedRole, setSelectedRole] = useState(""); // Track role
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      alert("Please fill in Name, Phone and Email.");
      return;
    }

    if (!selectedRole) {
      alert("Please select your role (Interviewer or Interviewee).");
      return;
    }

    if (selectedRole === "interviewee" && (!age || !resume)) {
      alert("Please enter Age and upload Resume for Interviewee.");
      return;
    }

    try {
      // First Register the User
      const registerPayload = {
        name,
        phone,
        email,
        role: selectedRole,
        ...(selectedRole === "interviewee" && { age }), // Include age only for interviewee
      };

      const registerResponse = await axios.post("/api/register", registerPayload);

      const userId = registerResponse.data.userId;

      // If Interviewee, upload resume separately
      if (selectedRole === "interviewee" && resume) {
        const formData = new FormData();
        formData.append("resume", resume);
        formData.append("userId", userId);

        await axios.post("/api/upload-resume", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      localStorage.setItem("userId", userId);
      localStorage.setItem("role", selectedRole);

      if (selectedRole === "interviewer") {
        navigate(`/interviewer?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&userId=${userId}`);
      } else if (selectedRole === "interviewee") {
        navigate(`/interviewee?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&userId=${userId}`);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Failed to register. Please try again.");
    }
  };

  return (
    <div className="join-container">
      <div className="join-form">
        <h1>Login</h1>

        <input
          type="text"
          placeholder="Enter Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Enter Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Role Buttons */}
        <div style={{ marginTop: "1rem" }}>
          <button onClick={() => setSelectedRole("interviewer")}>
            I'm Interviewer
          </button>

          <button onClick={() => setSelectedRole("interviewee")} style={{ marginTop: "10px" }}>
            I'm Interviewee
          </button>
        </div>

        {/* Conditional Fields for Interviewee */}
        {selectedRole === "interviewee" && (
          <>
            <input
              type="number"
              placeholder="Enter Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />

            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResume(e.target.files[0])}
            />
          </>
        )}

        {/* Register Button */}
        <button onClick={handleRegister} style={{ marginTop: "20px" }}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
