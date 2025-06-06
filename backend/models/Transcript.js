import mongoose from "mongoose";

const transcriptSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  content: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Transcript || mongoose.model("Transcript", transcriptSchema);
