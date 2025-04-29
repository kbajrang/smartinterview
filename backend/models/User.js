import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["interviewer", "interviewee"], required: true },
  age: { type: Number },
  resumePath: { type: String },
});

export default mongoose.model("User", UserSchema);
