const express = require('express');
const router = express.Router();

const { protect, admin } = require('../middleware/auth'); 

const { 
  register, 
  login, 
  getAllUsers, 
  deleteUser, 
  adminResetPassword,
  adminUnlockAccount,    // 🆕
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/register', protect, admin, register);
router.get('/users', protect, admin, getAllUsers);
router.delete('/user/:id', protect, admin, deleteUser);
router.patch('/reset-admin/:id', protect, admin, adminResetPassword);
router.patch('/unlock/:id', protect, admin, adminUnlockAccount);

module.exports = router;