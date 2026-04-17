const multer = require('multer');
const path = require('path');

// Konfigurasi Penyimpanan (Disk Storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Pastikan folder 'uploads' sudah lo buat manual di root backend
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    // Nama file: timestamp-namaasli (biar gak ada nama file yang bentrok)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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