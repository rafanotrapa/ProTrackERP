const express = require('express');
const router = express.Router();

// IMPORT MIDDLEWARE (Pastikan nama file di folder middleware adalah auth.js)
const { protect, admin } = require('../middleware/auth'); 

// IMPORT CONTROLLER
const { 
  register, 
  login, 
  getAllUsers, 
  deleteUser, 
  adminResetPassword 
} = require('../controllers/authController');

// --- PUBLIC ROUTES ---
router.post('/login', login);

// --- PRIVATE ROUTES (ADMIN ONLY) ---
// Register, Get Users, Delete, & Reset Password cuma bisa diakses Admin
router.post('/register', protect, admin, register);
router.get('/users', protect, admin, getAllUsers);
router.delete('/user/:id', protect, admin, deleteUser);
router.patch('/reset-admin/:id', protect, admin, adminResetPassword);

module.exports = router;