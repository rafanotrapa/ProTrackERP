const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import Controller
const supplierQuotationController = require('../controllers/supplierQuotationController');
const { protect } = require('../middleware/auth');

// --- KONFIGURASI MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung! Hanya PDF dan Gambar.'), false);
  }
};

const upload = multer({ storage, fileFilter });

// --- MAPPING ROUTE KE CONTROLLER ---

// 1. POST: Create Quotation
router.post('/', upload.single('document'), supplierQuotationController.createQuotation);

// 2. GET: List All Quotations
router.get('/', supplierQuotationController.getAllQuotations);

// 3. GET: Get by Project ID (Untuk Auto-fill)
router.get('/project/:projectId', supplierQuotationController.getQuotationByProject);

// 4. GET: Get by ID UNIK (INI YANG BIKIN ERROR 404 TADI KALAU GAK ADA)
// Penting: Ditaruh di bawah agar tidak mendahului rute statis jika ada
router.get('/:id', supplierQuotationController.getQuotationById);

// 5. PATCH: Approve/Reject Quotation
router.patch('/:id/approve', supplierQuotationController.approveQuotation);

module.exports = router;