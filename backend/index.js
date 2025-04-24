import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Room store: Map<roomId, { users: Set, code: string, output: string }>
const rooms = new Map();
let lastCompileTime = 0;

io.on("connection", (socket) => {
  let currentRoom = null;
  let currentUser = null;

  // 🔌 Join Room
  socket.on("join", ({ roomId, Username }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      if (rooms.has(currentRoom)) {
        rooms.get(currentRoom).users.delete(currentUser);
        io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).users));
      }
    }

    currentRoom = roomId;
    currentUser = Username;
    socket.join(currentRoom);

    if (!rooms.has(currentRoom)) {
      rooms.set(currentRoom, { users: new Set(), code: "", output: "" });
    }

    const room = rooms.get(currentRoom);
    room.users.add(currentUser);

    io.to(currentRoom).emit("userJoined", Array.from(room.users));
    socket.emit("codeUpdate", room.code);
  });

  // 💻 Code Sync
  socket.on("codeChange", ({ roomId, code }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).code = code;
      socket.to(roomId).emit("codeUpdate", code);
    }
  });

  // 💨 Leave Room
  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser && rooms.has(currentRoom)) {
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).users));
      socket.leave(currentRoom);
    }
    currentRoom = null;
    currentUser = null;
  });

  // ⌨️ Typing Indicator
  socket.on("typing", ({ roomId, Username }) => {
    socket.to(roomId).emit("userTyping", Username);
  });

  // 🌐 Language Switch
  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  // ⚙️ Code Compile (rate-limited)
  socket.on("compileCode", async ({ code, roomId, language, version }) => {
    const now = Date.now();
    const wait = 200 - (now - lastCompileTime);

    if (wait > 0) {
      console.log(`⏳ Delaying compile by ${wait}ms to avoid rate limit`);
      await new Promise((res) => setTimeout(res, wait));
    }

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

  // 📹 WebRTC: Video Offer/Answer/ICE
  socket.on("video-offer", ({ roomId, sdp }) => {
    socket.to(roomId).emit("video-offer", { sdp });
  });

  socket.on("video-answer", ({ roomId, sdp }) => {
    socket.to(roomId).emit("video-answer", { sdp });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  // ❌ Handle Disconnect
  socket.on("disconnect", () => {
    if (currentRoom && currentUser && rooms.has(currentRoom)) {
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).users));
    }
    console.log("🔌 User disconnected:", socket.id);
  });
});

// 🌍 Start server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
