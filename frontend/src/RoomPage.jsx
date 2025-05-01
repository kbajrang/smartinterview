// src/RoomPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import VideoChat from "./VideoChat";
import socket from "./socket";
import axios from "axios";
import "./App.css";

function enterFullScreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen();
  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
}

const RoomPage = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");
  const name = searchParams.get("name") || "Anonymous";
  const navigate = useNavigate();

  const [language, setLanguage] = useState("java");
  const [version, setVersion] = useState("15.0.2");
  const [code, setCode] = useState("// write your code here");
  const [question, setQuestion] = useState("Read the question carefully...");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [output, setOutput] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [clipboardLog, setClipboardLog] = useState([]);

  const recognitionRef = useRef(null);

  const languageVersions = {
    java: "15.0.2",
    cpp: "10.2.0",
    javascript: "16.3.0",
    python: "3.10.0",
  };

  useEffect(() => {
    if (role === "interviewee") {
      enterFullScreen();

      const handleTabSwitch = () => {
        alert("⚠️ Switching tabs is not allowed during the interview.");
        socket.emit("malpractice", { roomId });
      };

      const handleExitFullscreen = () => {
        if (!document.fullscreenElement) {
          alert("⚠️ Exiting full screen is considered malpractice.");
          socket.emit("malpractice", { roomId });
        }
      };

      const handleCopy = () => {
        const copiedText = window.getSelection().toString();
        if (copiedText.trim()) {
          setClipboardLog((prev) => [...prev, `📋 Copied: ${copiedText}`]);
        }
      };

      const handlePaste = (e) => {
        const pastedText = e.clipboardData.getData("text");
        if (pastedText.trim()) {
          setClipboardLog((prev) => [...prev, `📥 Pasted: ${pastedText}`]);
        }
      };

      window.addEventListener("blur", handleTabSwitch);
      document.addEventListener("fullscreenchange", handleExitFullscreen);
      document.addEventListener("copy", handleCopy);
      document.addEventListener("paste", handlePaste);

      return () => {
        window.removeEventListener("blur", handleTabSwitch);
        document.removeEventListener("fullscreenchange", handleExitFullscreen);
        document.removeEventListener("copy", handleCopy);
        document.removeEventListener("paste", handlePaste);
      };
    }
  }, [role, roomId]);

  useEffect(() => {
    if (!roomId || !name) {
      navigate("/");
      return;
    }

    socket.emit("join", { roomId, Username: name });

    socket.on("roomFull", () => {
      alert("Room is full. Redirecting...");
      navigate("/");
    });

    socket.on("userJoined", (users) => setUsers(users));
    socket.on("codeUpdate", (newCode) => setCode(newCode));
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 12)} is typing...`);
      setTimeout(() => setTyping(""), 2000);
    });
    socket.on("languageUpdate", (newLang) => setLanguage(newLang));
    socket.on("codeResponse", (res) => setOutput(res.run.output));
    socket.on("questionUpdate", (newQuestion) => setQuestion(newQuestion));
    socket.on("malpractice", () => setViolationCount((prev) => prev + 1));

    const handleBeforeUnload = () => socket.emit("leaveRoom");
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.emit("leaveRoom");
      window.removeEventListener("beforeunload", handleBeforeUnload);
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("codeResponse");
      socket.off("questionUpdate");
      socket.off("roomFull");
      socket.off("malpractice");
    };
  }, [roomId, name, navigate]);

  const handleViewClipboardLog = () => {
    const logText = clipboardLog.join("\n") || "No clipboard activity recorded.";
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`<pre>${logText}</pre>`);
    newWindow.document.close();
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, Username: name });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setVersion(languageVersions[newLang]);
    socket.emit("languageChange", { roomId, language: newLang });
  };

  const handleRunCode = () => {
    socket.emit("compileCode", { roomId, code, language, version });
  };

  const handleLeave = () => {
    socket.emit("leaveRoom");
    navigate("/");
  };

  const endInterview = () => {
    alert("Interview ended due to multiple malpractice events.");
    navigate("/");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const startTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("SpeechRecognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = async (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const spokenText = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          const label = role === "interviewer" ? "Interviewer" : "Interviewee";
          const line = `${label}: ${spokenText}`;
          setTranscript((prev) => `${prev}\n${line}`);
          try {
            await axios.post(`/api/append-transcript`, { roomId, line });
          } catch (error) {
            console.error("Transcript append failed:", error);
          }
        } else {
          interimTranscript += spokenText;
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopTranscription = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
  };

  const handleDownloadTranscript = () => {
    const file = new Blob([transcript], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `Transcript_Room_${roomId}.txt`;
    link.click();
  };

  const handlePostQuestion = () => {
    if (role === "interviewer") {
      socket.emit("postQuestion", { roomId, question });
    }
  };

  const handleViewResume = async () => {
    try {
      const interviewee = users.find((u) => u !== name);
      if (!interviewee) return alert("Interviewee not found in room.");

      const response = await axios.get(`http://localhost:5000/api/get-resume?name=${encodeURIComponent(interviewee)}`);
      const { resumeUrl } = response.data;

      if (resumeUrl) {
        window.open(`http://localhost:5000${resumeUrl}`, "_blank");
      } else {
        alert("No resume uploaded.");
      }
    } catch (error) {
      console.error("Error fetching resume:", error);
    }
  };

  return (
    <div className="editor-container">
      <div className="sidebar">
        <VideoChat socket={socket} roomId={roomId} violationCount={violationCount} />

        {role === "interviewer" && (
          <>
            <button className="record-btn" onClick={isRecording ? stopTranscription : startTranscription}>
              {isRecording ? "⏹ Stop" : "🎙 Start"}
            </button>
            {transcript && (
              <button className="copy-button" onClick={handleDownloadTranscript}>
                📥 Download Transcript
              </button>
            )}
            <button className="copy-button" onClick={handleViewResume}>📄 View Resume</button>
            <button className="copy-button" onClick={handleViewClipboardLog}>📋 View Copied Texts</button>
            <p style={{ color: "red", fontWeight: "bold" }}>⚠️ Tab Switches: {violationCount}</p>
            <button className="leave-button" onClick={endInterview}>End Interview</button>
          </>
        )}

        <div className="room-info">
          <h2>Room ID</h2>
          <code>{roomId}</code>
          <button className="copy-button" onClick={copyRoomId}>Copy Room ID</button>
          {copySuccess && <p className="copy-success">{copySuccess}</p>}
        </div>

        <h3>Users in Room</h3>
        <ul>{users.map((user, idx) => <li key={idx}>{user.slice(0, 12)}</li>)}</ul>
        <p className="typing-indicator">{typing}</p>

        <select className="language-selector" value={language} onChange={handleLanguageChange}>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>

        <button className="leave-button" onClick={handleLeave}>Leave Room</button>
      </div>

      <div className="editor-wrapper">
        <div className="question-box">
          <div className="question-header">
            <h3> Coding Question</h3>
            {role === "interviewer" && (
              <button onClick={handlePostQuestion}>📤 Post</button>
            )}
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            readOnly={role !== "interviewer"}
            className="question-content"
          />
        </div>

        <Editor
          height="60%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, fontSize: 16 }}
        />

        <button className="run-btn" onClick={handleRunCode}>Execute</button>
        <textarea className="output-console" readOnly value={output} placeholder="Output..." />

        {role === "interviewer" && transcript && (
          <div className="transcript-box">
            <h4>📝 Transcript:</h4>
            <pre style={{ whiteSpace: "pre-wrap" }}>{transcript}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
