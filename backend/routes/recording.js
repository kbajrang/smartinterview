// backend/routes/recording.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const roomId = req.query.roomId || 'unknown';
    const timestamp = Date.now();
    cb(null, `recording_${roomId}_${timestamp}.webm`);
  },
});

const upload = multer({ storage });

router.post('/upload-recording', upload.single('audio'), (req, res) => {
  res.status(200).json({ message: 'Recording uploaded successfully' });
});

export default router;
