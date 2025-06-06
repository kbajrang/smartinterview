// backend/index.js

import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";
import fetch from "node-fetch";
import mongoose from "mongoose";
import User from "./models/User.js";
import multer from "multer";
import Interviewer from "./models/interviewer.js";
import interviewerRoutes from "./routes/interviewer.js";
import inviteRouter from "./routes/invite.js";
import recordingRouter from "./routes/recording.js";
import Resume from "./models/Resume.js";
import PasteLog from "./models/PasteLog.js";
import ScheduledInterview from "./models/ScheduledInterview.js";
import Transcript from "./models/Transcript.js";

dotenv.config();

const MONGO_URI =
  "mongodb+srv://KailasaBajrang:Bajjusatya@cluster0.spg3xdo.mongodb.net/SmartInterviewSystem?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads", "resumes");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const name = req.headers["x-name"]?.replace(/\s+/g, "_") || "unknown";
    const roomId = req.headers["x-roomid"] || "unknown";

    const ext = path.extname(file.originalname);
    cb(null, `${name}-${roomId}${ext}`);
  },
});

const upload = multer({ storage });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", interviewerRoutes);
app.use("/api", inviteRouter);
app.use(recordingRouter);

app.post("/api/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const { name, roomId } = req.body;
    console.log(req.body);
    const filename = req.file.filename;
    const resumePath = `/resumes/${filename}`; // ✅ PUBLIC path

    const scheduled = await ScheduledInterview.findOne({ roomId });
    const email = scheduled?.email || "";

    await Resume.create({
      name,
      roomId,
      email,
      filename,
      resumePath,
    });

    res.status(200).json({ message: "Resume uploaded", resumeUrl: resumePath });
  } catch (err) {
    console.error("Resume upload error:", err);
    res.status(500).json({ error: "Failed to upload resume" });
  }
});

app.get("/api/get-resume", async (req, res) => {
  try {
    console.log("in get-resume");
    console.log("Query received:", req.query);

    const { roomId } = req.query;
    const resume = await Resume.findOne({ roomId });
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    console.log("Resume found:", resume);
    res.status(200).json({ resumeUrl: resume.resumePath, email: resume.email });
  } catch (err) {
    console.error("Resume fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/resumes/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "uploads",
    "resumes",
    req.params.filename
  );
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Resume not found");
  }
});

app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

const transcriptDir = path.join(__dirname, "transcripts");
if (!fs.existsSync(transcriptDir)) fs.mkdirSync(transcriptDir);
const pasteDir = path.join(__dirname, "paste_logs");
if (!fs.existsSync(pasteDir)) fs.mkdirSync(pasteDir);

app.post("/api/save-transcript", async (req, res) => {
  try {
    const { roomId, transcript } = req.body;
    if (!roomId || !transcript) {
      return res.status(400).json({ error: "Missing roomId or transcript" });
    }

    const filePath = path.join(transcriptDir, `transcript_room_${roomId}.txt`);
    fs.writeFileSync(filePath, transcript, "utf-8");

    await Transcript.findOneAndUpdate(
      { roomId },
      { content: transcript, updatedAt: new Date() },
      { upsert: true }
    );

    console.log(`📄 Transcript saved: ${filePath}`);
    res.status(200).json({ message: "Transcript saved!", file: filePath });
  } catch (error) {
    console.error("Error saving transcript:", error);
    res.status(500).json({ error: "Failed to save transcript" });
  }
});

app.post("/api/append-transcript", async (req, res) => {
  try {
    const { roomId, line } = req.body;
    if (!roomId || !line) {
      return res.status(400).json({ error: "Missing roomId or line" });
    }

    const filePath = path.join(transcriptDir, `transcript_room_${roomId}.txt`);
    fs.appendFileSync(filePath, line + "\n", "utf-8");

    let doc = await Transcript.findOne({ roomId });
    if (!doc) {
      doc = await Transcript.create({ roomId, content: line + "\n" });
    } else {
      doc.content += line + "\n";
      doc.updatedAt = new Date();
      await doc.save();
    }

    console.log(`📝 Line appended to: ${filePath}`);
    res.status(200).json({ message: "Line appended!" });
  } catch (error) {
    console.error("Error appending transcript:", error);
    res.status(500).json({ error: "Failed to append transcript" });
  }
});

app.get("/api/get-email-by-room", async (req, res) => {
  try {
    const { roomId } = req.query;
    if (!roomId) return res.status(400).json({ error: "roomId missing" });

    const doc = await Interviewer.findOne({ roomId });
    if (!doc) return res.status(404).json({ error: "Email not found" });

    res.status(200).json({ email: doc.email });
  } catch (error) {
    console.error("Email fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/store-paste-db", async (req, res) => {
  try {
    const { roomId, name, pastedText } = req.body;

    if (!roomId || !name || !pastedText) {
      return res
        .status(400)
        .json({ error: "Missing roomId, name, or pastedText" });
    }

  await PasteLog.create({ roomId, name, pastedText });

    const filePath = path.join(pasteDir, `paste_room_${roomId}.txt`);
    fs.appendFileSync(filePath, `[${name}] ${pastedText}\n`, "utf-8");

  res.status(200).json({ message: "Paste saved to DB" });
  } catch (error) {
    console.error("Paste DB error:", error);
    res.status(500).json({ error: "Failed to save paste to DB" });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, phone, email, role, age } = req.body;

    if (!name || !phone || !email || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newUser = new User({ name, phone, email, role, age });
    await newUser.save();

    res.status(201).json({ message: "User registered", userId: newUser._id });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// WebSocket logic
const rooms = new Map();
let lastCompileTime = 0;

io.on("connection", (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on("join", ({ roomId, Username }) => {
    if (!roomId || !Username) return;
    const room = rooms.get(roomId) || {
      users: new Set(),
      code: "",
      output: "",
      question: "",
    };
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
    socket.emit("questionUpdate", room.question);
    socket.emit("languageUpdate", room.language || "java");
    socket.emit("versionUpdate", room.version || "15.0.2");

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
      io.to(roomId).emit("questionUpdate", question);
    }
  });

  socket.on("typing", ({ roomId, Username }) => {
    socket.to(roomId).emit("userTyping", Username);
  });

  socket.on("languageChange", ({ roomId, language, version }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).language = language;
      rooms.get(roomId).version = version;
    }
    io.to(roomId).emit("languageUpdate", language);
    io.to(roomId).emit("versionUpdate", version);
  });

  socket.on("compileCode", async ({ code, roomId, language, version }) => {
    const now = Date.now();
    const wait = 200 - (now - lastCompileTime);
    if (wait > 0) await new Promise((res) => setTimeout(res, wait));
    lastCompileTime = Date.now();

    try {
      const pistonApiUrl =
        process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston/execute";

      const response = await axios.post(pistonApiUrl, {
        language,
        version,
        files: [{ content: code }],
      });

      if (rooms.has(roomId)) {
        rooms.get(roomId).output = response.data.run.output;
        io.to(roomId).emit("codeResponse", response.data);
      }
    } catch (error) {
      console.error(
        "❌ Compile error:",
        error?.response?.data || error.message
      );
      io.to(roomId).emit("codeResponse", {
        run: { output: "Error: Compilation failed or API unavailable." },
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
  socket.on("malpractice", ({ roomId }) => {
    socket.to(roomId).emit("malpractice");
  });

  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser && rooms.has(currentRoom)) {
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).users)
      );
      socket.leave(currentRoom);
    }
    currentRoom = null;
    currentUser = null;
  });

  socket.on("disconnect", () => {
    if (currentRoom && currentUser && rooms.has(currentRoom)) {
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).users)
      );
    }
    console.log("🔌 User disconnected:", socket.id);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Start server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});