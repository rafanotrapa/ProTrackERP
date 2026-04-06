const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Ambil token dari header
  const token = req.header('Authorization')?.split(' ')[1]; // Format: "Bearer <token>"

  // 2. Cek kalau nggak ada token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 3. Verifikasi token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Masukin data user ke request
    next(); // Lanjut ke controller
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};