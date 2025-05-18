// ✅ socket.js - ensures frontend connects to backend socket server
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
  transports: ["websocket"],
});

export default socket;
