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

const MONGO_URI = "mongodb+srv://KailasaBajrang:Bajjusatya@cluster0.spg3xdo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // <--- paste your MongoDB Atlas URL
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((error) => console.error("❌ MongoDB connection error:", error));

// Setup storage for resumes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/resumes"); // Save in uploads/resumes folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });




dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
}));

app.use(express.json()); // ✅ REQUIRED for parsing req.body

app.use("/resumes", express.static(path.join(__dirname, "uploads/resumes")));

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
app.post("/api/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const { userId } = req.body;
    const filePath = req.file.path; // Full path like uploads/resumes/171442xxxx.pdf

    if (!userId || !filePath) {
      return res.status(400).json({ error: "Missing userId or file" });
    }

    // Create public-facing URL path
    const publicPath = `/resumes/${path.basename(filePath)}`;

    // Save public path to MongoDB
    await User.findByIdAndUpdate(userId, { resumePath: publicPath });

    // Send this path to frontend
    res.status(200).json({
      message: "Resume uploaded successfully!",
      resumeUrl: publicPath
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({ error: "Failed to upload resume" });
  }
});
app.get("/api/get-resume", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const user = await User.findOne({ name });

    if (!user || !user.resumePath) {
      return res.status(404).json({ error: "Resume not found for this user" });
    }

    res.status(200).json({ resumeUrl: user.resumePath });
  } catch (error) {
    console.error("Error fetching resume:", error);
    res.status(500).json({ error: "Failed to fetch resume" });
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
    socket.emit("questionUpdate", room.question);

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

  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  socket.on("compileCode", async ({ code, roomId, language, version }) => {
    const now = Date.now();
    const wait = 200 - (now - lastCompileTime);
    if (wait > 0) await new Promise((res) => setTimeout(res, wait));
    lastCompileTime = Date.now();

    try {
      const pistonApiUrl = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston/execute";

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
      console.error("❌ Compile error:", error?.response?.data || error.message);
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Start server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
