const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
// Import controllernya
const supplierQuotationController = require('../controllers/supplierQuotationController');

// Konfigurasi Multer
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
    cb(new Error('Format file tidak didukung!'), false);
  }
};

const upload = multer({ storage, fileFilter });

// --- MAPPING ROUTE KE CONTROLLER ---

// POST: Create Quotation
router.post('/', upload.single('document'), supplierQuotationController.createQuotation);

// GET: List All
router.get('/', supplierQuotationController.getAllQuotations);

// GET: Get by Project ID (INI YANG TADI 404)
router.get('/project/:projectId', supplierQuotationController.getQuotationByProject);

module.exports = router;