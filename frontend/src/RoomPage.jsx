import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import VideoChat from "./VideoChat";
import axios from "axios";
import "./App.css";

const socket = io("https://smartinterview-4.onrender.com", { transports: ["websocket"] });

const RoomPage = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");
  const name = searchParams.get("name") || "Anonymous";

  const [language, setLanguage] = useState("java");
  const [version, setVersion] = useState("");
  const [code, setCode] = useState("// write your code here");
  const [question, setQuestion] = useState("Read the question carefully...");
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [output, setOutput] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const languageVersions = {
    java: "15.0.2",
    cpp: "10.2.0",
    javascript: "16.3.0",
    python: "3.10.0",
  };

  useEffect(() => {
    if (!roomId || !name) {
      navigate("/");
      return;
    }

    socket.emit("join", { roomId, Username: name });

    socket.on("userJoined", (users) => setUsers(users));
    socket.on("codeUpdate", (newCode) => setCode(newCode));
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 12)} is typing...`);
      setTimeout(() => setTyping(""), 2000);
    });
    socket.on("languageUpdate", (newLang) => setLanguage(newLang));
    socket.on("codeResponse", (res) => setOutput(res.run.output));
    socket.on("questionUpdate", (newQuestion) => setQuestion(newQuestion));

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
    };
  }, [roomId, name]);

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

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const startTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("SpeechRecognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = async (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const spokenText = event.results[i][0].transcript.trim();
          const label = role === "interviewer" ? "Interviewer" : "Interviewee";
          const line = `${label}: ${spokenText}`;
          setTranscript((prev) => `${prev}\n${line}`);
          try {
            await axios.post("https://smartinterview-4.onrender.com/api/append-transcript", {
              roomId,
              line,
            });
          } catch (error) {
            console.error("Transcript append failed:", error);
          }
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

  const handlePostQuestion = () => {
    if (role === "interviewer") {
      socket.emit("postQuestion", { roomId, question });
    }
  };

  return (
    <div className="editor-container">
      <div className="sidebar">
        <VideoChat socket={socket} roomId={roomId} />

        {role === "interviewer" && (
          <div style={{ margin: "15px 0" }}>
            <button className="record-btn" onClick={isRecording ? stopTranscription : startTranscription}>
              {isRecording ? "⏹ Stop" : "🎙 Start"}
            </button>
          </div>
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
        <div style={{ marginBottom: "10px", backgroundColor: "#1e1e1e", padding: "10px", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>🔥 Coding Question</h3>
            {role === "interviewer" && (
              <button onClick={handlePostQuestion} style={{ padding: "6px 10px" }}>
                📤 Post Question
              </button>
            )}
          </div>

          <textarea
            style={{
              marginTop: "8px",
              width: "100%",
              height: isQuestionExpanded ? "300px" : "100px",
              resize: "none",
              fontSize: "14px",
              padding: "8px",
              backgroundColor: "#2d2d2d",
              color: "white",
              borderRadius: "8px",
            }}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            readOnly={role !== "interviewer"}
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
