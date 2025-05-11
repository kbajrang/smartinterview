import mongoose from "mongoose";

const scheduledInterviewSchema = new mongoose.Schema({
  email: String,
  roomId: String,
  timeSlot: Date,
  status: { type: String, default: "scheduled" }, // "scheduled", "completed"
}, { timestamps: true });

export default mongoose.model("ScheduledInterview", scheduledInterviewSchema);
