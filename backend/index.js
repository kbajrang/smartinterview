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
import fetch from "node-fetch"; // ⬅️ Important: Add at the top of index.js if not present
import mongoose from "mongoose";
import User from "./models/User.js";
import multer from "multer"; // (Will use later for Resume upload)
import Interviewer from "./models/interviewer.js"; // ✅ CORRECT
import interviewerRoutes from "./routes/interviewer.js"; // ✅ Import
import inviteRouter from "./routes/invite.js"; // ✅ Make sure this path is correct
import Resume from "./models/Resume.js";
import PasteLog from "./models/PasteLog.js"; // ⬅️ Add this at top with other model imports

const MONGO_URI =
  "mongodb+srv://KailasaBajrang:Bajjusatya@cluster0.spg3xdo.mongodb.net/SmartInterviewSystem?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure resume directory exists
const uploadsDir = path.join(__dirname, "uploads", "resumes");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Setup storage for resumes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/resumes"); // Save in uploads/resumes folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);
// app.use(express.json()); // ✅ REQUIRED for req.body to work
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", interviewerRoutes); // ✅ mount route prefix
app.use("/api", inviteRouter); // ✅ This enables /api/send-invite

app.use("/resumes", express.static(path.join(__dirname, "uploads/resumes")));

//for running application on one port
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

// Folders
const transcriptDir = path.join(__dirname, "transcripts");
if (!fs.existsSync(transcriptDir)) fs.mkdirSync(transcriptDir);

// Save full transcript
app.post("/api/save-transcript", (req, res) => {
  try {
    const { roomId, transcript } = req.body;
    if (!roomId || !transcript) {
      return res.status(400).json({ error: "Missing roomId or transcript" });
    }

    const filePath = path.join(transcriptDir, `transcript_room_${roomId}.txt`);
    fs.writeFileSync(filePath, transcript, "utf-8");
    console.log(`📄 Transcript saved: ${filePath}`);
    res.status(200).json({ message: "Transcript saved!", file: filePath });
  } catch (error) {
    console.error("Error saving transcript:", error);
    res.status(500).json({ error: "Failed to save transcript" });
  }
});

// Append a line to transcript
app.post("/api/append-transcript", (req, res) => {
  try {
    const { roomId, line } = req.body;
    if (!roomId || !line) {
      return res.status(400).json({ error: "Missing roomId or line" });
    }

    const filePath = path.join(transcriptDir, `transcript_room_${roomId}.txt`);
    fs.appendFileSync(filePath, line + "\n", "utf-8");
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
app.post("/api/upload-resume", async (req, res) => {
  try {
    const { name, roomId, file, filename, contentType } = req.body;
    if (!name || !roomId || !file || !filename || !contentType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await Resume.create({
      name,
      roomId,
      resumeBase64: file,
      filename,
      contentType,
    });
    res.status(200).json({ message: "Resume uploaded successfully" });
  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({ error: "Failed to upload resume" });
  }
});

app.get("/api/get-resume", async (req, res) => {
  try {
    const { roomId } = req.query;
    const resume = await Resume.findOne({ roomId });
    if (!resume) return res.status(404).json({ error: "Not found" });

    res.status(200).json({
      base64: resume.resumeBase64,
      filename: resume.filename,
      contentType: resume.contentType,
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching resume" });
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
