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

const rooms = new Map();

io.on("connection", (socket) => {
  // console.log("User connected", socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on("join", ({ roomId, Username }) => {
    console.log("join", roomId, Username);
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }

    currentRoom = roomId;
    currentUser = Username;

    socket.join(currentRoom);
    if (!rooms.has(currentRoom)) {
      rooms.set(currentRoom, new Set());
    }
    rooms.get(currentRoom).add(currentUser);

    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)));
    // console.log("user joined", currentRoom, currentUser);
    socket.emit("codeUpdate", rooms.get(currentRoom).code);

    socket.on("codeChange", ({ roomId, code }) => {
      socket.to(roomId).emit("codeUpdate",
        code);

      rooms.get(roomId).code = code;
    });

    socket.on("leaveRoom", () => {
      if (currentRoom && currentUser) {
        rooms.get(currentRoom).delete(currentUser);
        io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
        
        socket.leave(currentRoom);

        currentRoom = null;
        currentUser = null;

      }
    });

    socket.on("typing", ({ roomId, Username }) => {
      socket.to(roomId).emit("userTyping", Username);
    });

    socket.on("languageChange", ({ roomId, language }) => { 
      io.to(roomId).emit("languageUpdate", language);
    })

    socket.on("compileCode", async ({ code, roomId, language, version }) => {
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
          language,
          version,
          files: [
            {
              content: code
            }
          ]
        })

        room.output = response.data.run.output;
        io.to(roomId).emit("codeResponse", response.data);
      }
    })

    socket.on("disconnect", () => {
      if (currentRoom && currentUser) {
        rooms.get(currentRoom).delete(currentUser);
        io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
        
        // socket.leave(currentRoom);
      }
      console.log("User disconnected", socket.id);
    });

  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
