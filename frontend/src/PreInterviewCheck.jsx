// Updated PreInterviewCheck.jsx with enhanced CSS class usage
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./App.css";
const PreInterviewCheck = () => {
  const videoRef = useRef(null);
  const [micWorking, setMicWorking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [name, setName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [analyser, setAnalyser] = useState(null);
  const [audioDataArray, setAudioDataArray] = useState(null);
  const rafId = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;

        const audioCtx = new AudioContext();
        const micSource = audioCtx.createMediaStreamSource(stream);
        const analyserNode = audioCtx.createAnalyser();
        micSource.connect(analyserNode);

        const buffer = new Uint8Array(analyserNode.frequencyBinCount);
        setAnalyser(analyserNode);
        setAudioDataArray(buffer);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to access mic or camera.");
      });

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const startMicTest = () => {
    if (!analyser || !audioDataArray) return;
    const checkVolume = () => {
      analyser.getByteFrequencyData(audioDataArray);
      const volume = audioDataArray.reduce((a, b) => a + b, 0);
      setVolumeLevel(volume);
      setMicWorking(volume > 500);
      rafId.current = requestAnimationFrame(checkVolume);
    };
    checkVolume();
  };

  const stopMicTest = () => {
    cancelAnimationFrame(rafId.current);
    setVolumeLevel(0);
  };

  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * handleProceed
   *
   * Proceeds with the interview after the user has
   * completed the pre-interview checks and filled in
   * the form.
   *
   * If the checks haven't been completed or the form
   * isn't filled in, an alert is shown.
   *
   * If the checks have been completed and the form is
   * filled in, the user's resume is uploaded and the
   * user is redirected to the room.
   */
  /*******  7a347e85-04be-4bb4-9cf1-001ab60ad1cb  *******/
  const handleProceed = async () => {
    if (!resumeFile || !name || !roomId || !acceptedTerms || !micWorking) {
      alert("Please complete all fields and checks.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("name", name);
    formData.append("roomId", roomId);

    try {
      const res = await axios.post("/api/upload-resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-name": name,
          "x-roomid": roomId,
        },
      });

      console.log("✅ Upload success:", res.data);
      navigate(
        `/room/${roomId}?role=interviewee&name=${encodeURIComponent(name)}`
      );
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Upload failed");
    }
  };

  return (
    <div className="precheck-container">
      <div className="left-panel">
        <h3>📝 Your Details</h3>
        <label className="input-label">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="custom-input"
          placeholder="Enter your full name"
        />

        <label className="input-label">Upload Resume (PDF)</label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setResumeFile(e.target.files[0])}
          className="custom-input"
        />
        <p className="resume-note">📄 Upload PDF only</p>
      </div>

      <div className="right-panel">
        <h2>🎯 Pre-Interview Check</h2>

        <div className="camera-box">
          <video ref={videoRef} autoPlay muted />
        </div>
        <p className="status-ok">📷 Camera is working</p>

        <div style={{ marginTop: "2rem" }}>
          <label
            style={{
              fontWeight: "600",
              marginBottom: "0.5rem",
              display: "block",
            }}
          >
            🎤 Mic Test
          </label>
          <button
            onMouseDown={startMicTest}
            onMouseUp={stopMicTest}
            onTouchStart={startMicTest}
            onTouchEnd={stopMicTest}
            className="proceed-btn"
            style={{ backgroundColor: "#10b981", marginBottom: "1rem" }}
          >
            🎙️ Hold to Speak
          </button>
          <div className="mic-bar">
            <div
              className={`mic-bar-fill ${micWorking ? "" : "mic-fail"}`}
              style={{ width: `${Math.min(volumeLevel / 100, 100)}%` }}
            />
          </div>
          <p className={micWorking ? "status-ok" : "status-fail"}>
            {micWorking
              ? "✅ Microphone working"
              : "❌ Speak louder to detect mic"}
          </p>
        </div>

        <label className="term-check">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          I agree to the <strong>Terms & Conditions</strong>
        </label>

        <button
          onClick={handleProceed}
          disabled={!micWorking || !acceptedTerms || !name || !resumeFile}
          className="proceed-btn"
        >
          🚀 Join Interview Room
        </button>

        {error && (
          <p className="status-fail" style={{ marginTop: "1rem" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default PreInterviewCheck;