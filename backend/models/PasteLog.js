// models/PasteLog.js
import mongoose from "mongoose";

const pasteLogSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  name: { type: String, required: true },
  pastedText: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("PasteLog", pasteLogSchema);
