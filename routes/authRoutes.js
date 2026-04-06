const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

// URL: POST http://localhost:5000/api/auth/register
router.post('/register', register);

// URL: POST http://localhost:5000/api/auth/login
router.post('/login', login);

// URL: POST http://localhost:5000/api/auth/forgotpassword
router.post('/forgotpassword', forgotPassword);

// URL: PUT http://localhost:5000/api/auth/resetpassword/:token
router.put('/resetpassword/:token', resetPassword);

module.exports = router;