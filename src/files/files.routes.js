const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFile } = require('./files.controller');

const router = express.Router();

// Pasta de uploads: src/uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${unique}-${safeBase}${ext}`);
  },
});

const upload = multer({ storage });

// POST /files/upload -> campo de formulário: 'file'
router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;
