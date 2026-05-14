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
// ⚠️ PENTING: ROUTE STATIS HARUS DI ATAS ROUTE DINAMIS (:id)

// 1. POST: Create Quotation
router.post('/', upload.single('document'), supplierQuotationController.createQuotation);

// 2. GET: List All Quotations
router.get('/', supplierQuotationController.getAllQuotations);

// 3. GET: Pending Approvals (STATIS - harus di atas /:id)
router.get('/pending', protect, supplierQuotationController.getPendingApprovals);

// 4. GET: Get by Project ID (STATIS - harus di atas /:id)
router.get('/project/:projectId', protect, supplierQuotationController.getQuotationByProject);

// 5. GET: Get by ID UNIK (DINAMIS - ditaruh paling bawah)
router.get('/:id', protect, supplierQuotationController.getQuotationById);

// 6. PATCH: Approve/Reject Quotation (DINAMIS)
router.patch('/:id/approve', protect, supplierQuotationController.approveQuotation);

module.exports = router;