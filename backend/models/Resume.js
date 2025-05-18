
import mongoose from "mongoose";
const resumeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roomId: { type: String, required: true },
  resumeBase64: { type: String, required: true }, // <-- base64 content
  filename: { type: String },
  contentType: { type: String },
});

export default mongoose.model("Resume", resumeSchema);