// backend/models/interviewer.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const interviewerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "interviewer" },
  createdAt: { type: Date, default: Date.now }
});

interviewerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.models.Interviewer || mongoose.model("Interviewer", interviewerSchema);
