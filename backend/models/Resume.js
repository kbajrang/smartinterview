// backend/models/Resume.js
import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roomId: { type: String, required: true },
  resumePath: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Resume", resumeSchema);
