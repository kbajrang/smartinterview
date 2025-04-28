// backend/index.js

import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());

// Save full transcript
app.post("/api/save-transcript", (req, res) => {
  const { roomId, transcript } = req.body;
  if (!roomId || !transcript) {
    return res.status(400).json({ error: "Missing roomId or transcript" });
  }
  const dir = path.join(__dirname, "transcripts");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const filePath = path.join(dir, `transcript_room_${roomId}.txt`);
  fs.writeFileSync(filePath, transcript, "utf-8");
  console.log(`📄 Transcript saved: ${filePath}`);
  res.status(200).json({ message: "Transcript saved!", file: filePath });
});

// Append single transcript line
app.post("/api/append-transcript", (req, res) => {
  const { roomId, line } = req.body;
  if (!roomId || !line) {
    return res.status(400).json({ error: "Missing roomId or line" });
  }
  const dir = path.join(__dirname, "transcripts");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const filePath = path.join(dir, `transcript_room_${roomId}.txt`);
  fs.appendFileSync(filePath, line + "\n", "utf-8");
  console.log(`📝 Line appended to: ${filePath}`);
  res.status(200).json({ message: "Line appended!" });
});

// WebSocket logic
const rooms = new Map();
let lastCompileTime = 0;

io.on("connection", (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on("join", ({ roomId, Username }) => {
    if (!roomId || !Username) return;
    const room = rooms.get(roomId) || { users: new Set(), code: "", output: "", question: "" };
    if (room.users.size >= 2) {
      socket.emit("roomFull");
      return;
    }

    currentRoom = roomId;
    currentUser = Username;
    room.users.add(currentUser);
    rooms.set(roomId, room);

    socket.join(roomId);
    io.to(roomId).emit("userJoined", Array.from(room.users));

    socket.emit("codeUpdate", room.code);
    socket.emit("questionUpdate", room.question); // FIX: Send the latest question correctly

    if (room.users.size === 2) {
      socket.to(roomId).emit("start-call");
    }
  });

  socket.on("codeChange", ({ roomId, code }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).code = code;
      socket.to(roomId).emit("codeUpdate", code);
    }
  });

  socket.on("postQuestion", ({ roomId, question }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).question = question;
      io.to(roomId).emit("questionUpdate", question); // FIX: Broadcast new question to everyone
    }
  });

  socket.on("typing", ({ roomId, Username }) => {
    socket.to(roomId).emit("userTyping", Username);
  });

  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  socket.on("compileCode", async ({ code, roomId, language, version }) => {
    const now = Date.now();
    const wait = 200 - (now - lastCompileTime);
    if (wait > 0) await new Promise((res) => setTimeout(res, wait));
    lastCompileTime = Date.now();

    try {
      const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language,
        version,
        files: [{ content: code }],
      });
      if (rooms.has(roomId)) {
        rooms.get(roomId).output = response.data.run.output;
        io.to(roomId).emit("codeResponse", response.data);
      }
    } catch (err) {
      console.error("❌ Compile error:", err?.response?.data || err.message);
      io.to(roomId).emit("codeResponse", {
        run: { output: "Error: Rate limit exceeded or compilation failed." },
      });
    }
  });

  socket.on("video-offer", ({ roomId, sdp }) => {
    socket.to(roomId).emit("video-offer", { sdp });
  });

  socket.on("video-answer", ({ roomId, sdp }) => {
    socket.to(roomId).emit("video-answer", { sdp });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser && rooms.has(currentRoom)) {
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).users));
      socket.leave(currentRoom);
    }
    currentRoom = null;
    currentUser = null;
  });

  socket.on("disconnect", () => {
    if (currentRoom && currentUser && rooms.has(currentRoom)) {
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).users));
    }
    console.log("🔌 User disconnected:", socket.id);
  });
});

// Start server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
