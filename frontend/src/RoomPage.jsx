// src/RoomPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import VideoChat from "./VideoChat";
import socket from "./socket";
import axios from "axios";
import "./App.css";

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
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [clipboardLog, setClipboardLog] = useState([]);
  const [intervieweeEmail, setIntervieweeEmail] = useState("");

  const recognitionRef = useRef(null);

  const languageVersions = {
    java: "15.0.2",
    cpp: "10.2.0",
    javascript: "18.15.0",
    python: "3.10.0",
  };

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

  // 🎯 Fetch real interviewee email from backend using roomId
  useEffect(() => {
    const fetchIntervieweeEmail = async () => {
      try {
        const res = await axios.get(`/api/get-email-by-room?roomId=${roomId}`);
        setIntervieweeEmail(res.data.email);
      } catch (err) {
        console.error("❌ Failed to fetch interviewee email:", err);
      }
    };
    if (role === "interviewer") fetchIntervieweeEmail();
  }, [roomId, role]);

  useEffect(() => {
    if (role === "interviewee") {
      const handleTabSwitch = () => {
        setViolationCount((prev) => prev + 1);
        socket.emit("malpractice", { roomId });
      };
      window.addEventListener("blur", handleTabSwitch);
      return () => {
        window.removeEventListener("blur", handleTabSwitch);
      };
    }
  }, [role, roomId]);

  const handleViewClipboardLog = () => {
    const logText =
      clipboardLog.join("\n") || "No clipboard activity recorded.";
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
    const newVersion = languageVersions[newLang];

    setLanguage(newLang);
    setVersion(newVersion);

    socket.emit("languageChange", {
      roomId,
      language: newLang,
      version: newVersion,
    });
  };

  const handleRunCode = () => {
    socket.emit("compileCode", { roomId, code, language, version });
  };

  const handleLeave = async () => {
    try {
      const res = await axios.get(`/api/get-email-by-room?roomId=${roomId}`);
      const intervieweeEmail = res.data.email;

      socket.emit("leaveRoom");
      navigate(
        `/send-summary?email=${intervieweeEmail}&roomId=${roomId}&type=normal`
      );
    } catch (err) {
      console.error("Failed to fetch interviewee email:", err);
      alert("⚠️ Email not found.");
      socket.emit("leaveRoom");
      navigate("/");
    }
  };

  const endInterview = async () => {
    try {
      const res = await axios.get(`/api/get-email-by-room?roomId=${roomId}`);
      const intervieweeEmail = res.data.email;

      alert("Interview ended due to multiple malpractice events.");
      socket.emit("leaveRoom");
      navigate(
        `/send-summary?email=${intervieweeEmail}&roomId=${roomId}&type=malpractice`
      );
    } catch (err) {
      console.error("Failed to fetch interviewee email:", err);
      alert("⚠️ Email not found.");
      socket.emit("leaveRoom");
      navigate("/");
    }
  };

  const startTranscription = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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

  // Immediately emit when interviewer types
  const handleQuestionChange = (e) => {
    const updatedQuestion = e.target.value;
    setQuestion(updatedQuestion);
    if (role === "interviewer") {
      socket.emit("postQuestion", { roomId, question: updatedQuestion });
    }
  };

  const handleViewResume = async () => {
    const res = await axios.get(`/api/get-resume?roomId=${roomId}`);
    const { base64, filename, contentType } = res.data;

    const blob = new Blob(
      [Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))],
      { type: contentType }
    );
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="editor-container">
      <div className="sidebar">
        <VideoChat
          socket={socket}
          roomId={roomId}
          violationCount={violationCount}
        />

        {role === "interviewer" && (
          <>
            <button
              className="record-btn"
              onClick={isRecording ? stopTranscription : startTranscription}
            >
              {isRecording ? "⏹ Stop" : "🎙 Start"}
            </button>
            {transcript && (
              <button
                className="copy-button"
                onClick={handleDownloadTranscript}
              >
                📥 Download Transcript
              </button>
            )}
            <button className="copy-button" onClick={handleViewResume}>
              📄 View Resume
            </button>
            <button className="copy-button" onClick={handleViewClipboardLog}>
              📋 View Copied Texts
            </button>
            <p style={{ color: "red", fontWeight: "bold" }}>
              ⚠️ Tab Switches: {violationCount}
            </p>
            <button className="leave-button" onClick={endInterview}>
              End Interview
            </button>
            <button className="leave-button" onClick={handleLeave}>
              Leave Interview
            </button>
          </>
        )}

        <h3>Users in Room</h3>
        <ul>
          {users.map((user, idx) => (
            <li key={idx}>{user.slice(0, 12)}</li>
          ))}
        </ul>
        <p className="typing-indicator">{typing}</p>
      </div>

      <div className="editor-wrapper">
        <div className="question-box">
          <div className="question-header">
            <h3> Coding Question</h3>
          </div>
          <textarea
            value={question}
            onChange={handleQuestionChange}
            readOnly={role !== "interviewer"}
            className="question-content"
          />
        </div>

        {/* 🎯 Language Selector repositioned to top right */}
        <div className="language-dropdown-top-right">
          <select value={language} onChange={handleLanguageChange}>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
        </div>

        <Editor
          height="60%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, fontSize: 16 }}
        />

        <button className="run-btn" onClick={handleRunCode}>
          Execute
        </button>
        <textarea
          className="output-console"
          readOnly
          value={output}
          placeholder="Output..."
        />

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
