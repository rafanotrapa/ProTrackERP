const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. GUNAKAN ABSOLUTE PATH BIAR GAK NYASAR
const uploadDir = path.join(__dirname, '../uploads/documents');

// 2. AUTO-CREATE FOLDER (Safety Net)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Penyimpanan (Disk Storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'INV-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter Format File (Security Match)
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya diperbolehkan upload Gambar (JPG/PNG) atau PDF!'));
  }
};

// Inisialisasi Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
  fileFilter: fileFilter
});

module.exports = upload;