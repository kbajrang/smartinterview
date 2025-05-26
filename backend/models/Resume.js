import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String }, // Optional
  roomId: { type: String, required: true },
  filename: { type: String, required: true },
  resumePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Resume", ResumeSchema);