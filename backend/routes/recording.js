// backend/routes/recording.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

module.exports = router;
