const User = require('../models/User');
const Log = require('../models/Log'); // <--- WAJIB IMPORT INI
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTER (Admin Adds Employee)
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'Email sudah terdaftar!' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ username, email, password: hashedPassword, role });
    await user.save();

    // ==========================================
    // INSERT LOG: REGISTER
    // ==========================================
    await Log.create({
      user: req.user ? req.user.username : 'Admin', // Siapa yang daftarin
      action: `REGISTERED NEW EMPLOYEE: ${username} (${role})`,
      category: 'ACCOUNT',
      type: 'CREATE'
    });

    res.status(201).json({ msg: 'Akun karyawan berhasil dibuat!' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error saat register');
  }
};

// 2. LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Email tidak ditemukan!' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Password salah!' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    // ==========================================
    // INSERT LOG: LOGIN (Opsional tapi bagus buat audit)
    // ==========================================
    await Log.create({
      user: user.username,
      action: `USER LOGGED IN TO SYSTEM`,
      category: 'ACCOUNT',
      type: 'LOGIN'
    });

    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error saat login');
  }
};

// 3. GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Gagal mengambil data user" });
  }
};

// 4. DELETE USER (Revoke Access)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User tidak ditemukan' });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ msg: 'Lo nggak bisa hapus akun lo sendiri, Fa!' });
    }

    const deletedUsername = user.username;
    await User.findByIdAndDelete(req.params.id);

    // ==========================================
    // INSERT LOG: DELETE USER
    // ==========================================
    await Log.create({
      user: req.user.username, // Siapa admin yang hapus
      action: `REVOKED ACCESS / DELETED ACCOUNT: ${deletedUsername}`,
      category: 'ACCOUNT',
      type: 'DELETE'
    });

    res.json({ msg: 'Akses user berhasil dicabut' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Gagal menghapus user" });
  }
};

// 5. ADMIN FORCE RESET PASSWORD (Override)
exports.adminResetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User tidak ditemukan' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    // ==========================================
    // INSERT LOG: RESET PASSWORD
    // ==========================================
    await Log.create({
      user: req.user.username,
      action: `FORCE RESET PASSWORD FOR: ${user.username}`,
      category: 'ACCOUNT',
      type: 'SECURITY'
    });

    res.json({ msg: `Password untuk ${user.username} berhasil di-override!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Gagal reset password" });
  }
};