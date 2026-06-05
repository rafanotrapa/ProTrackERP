const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const supplierQuotationController = require('../controllers/supplierQuotationController');
const { protect } = require('../middleware/auth');

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
router.post('/', upload.single('document'), supplierQuotationController.createQuotation);

router.get('/', supplierQuotationController.getAllQuotations);

router.get('/pending', protect, supplierQuotationController.getPendingApprovals);

router.get('/project/:projectId', protect, supplierQuotationController.getQuotationByProject);

router.get('/:id', protect, supplierQuotationController.getQuotationById);

router.patch('/:id/approve', protect, supplierQuotationController.approveQuotation);

module.exports = router;