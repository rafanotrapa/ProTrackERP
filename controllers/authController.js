const User = require('../models/User');
const Log = require('../models/Log');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');
const { resetPasswordTemplate } = require('../utils/emailTemplates');
const { MODUL_BISA_DILIHAT } = require('../middleware/auth');

const RESET_EXPIRE_MINUTES = 10;

const resetLoginAttempts = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    loginAttempts: 0,
    isLocked: false,
    lockedUntil: null
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, role, viewModules } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'Email sudah terdaftar!' });

    // Pemeriksaan ramah supaya pesannya jelas. Yang benar-benar menahan tetap
    // indeks unik parsial di models/User.js — dua permintaan bersamaan bisa
    // sama-sama lolos pemeriksaan ini sebelum salah satunya sempat menyimpan.
    if (role === 'Super Admin') {
      const sudahAda = await User.exists({ role: 'Super Admin' });
      if (sudahAda) {
        return res.status(400).json({ msg: 'Super Admin sudah ada. Hanya boleh satu akun Super Admin.' });
      }
    }

    if (role === 'Viewer' && (!Array.isArray(viewModules) || viewModules.length === 0)) {
      return res.status(400).json({ msg: 'Pilih minimal satu modul yang boleh dilihat akun Viewer.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username, email, password: hashedPassword, role,
      viewModules: role === 'Viewer' ? viewModules : [],
    });

    try {
      await user.save();
    } catch (e) {
      // E11000 dari indeks parsial Super Admin; nomor duplikat email sudah
      // ditangkap di atas.
      if (e.code === 11000) {
        return res.status(400).json({ msg: 'Super Admin sudah ada. Hanya boleh satu akun Super Admin.' });
      }
      throw e;
    }

    try {
        await Log.create({
          // Token lama tidak memuat username, jadi req.user.username bisa
          // undefined dan Log gagal tervalidasi (field user wajib). Ini yang
          // bikin 7 registrasi tidak tercatat di log audit produksi.
          user: req.user?.username || 'Admin',
          action: `REGISTERED NEW EMPLOYEE: ${username} (${role})`,
          category: 'ACCOUNT',
          type: 'CREATE'
        });
    } catch (logErr) {
        console.error("⚠️ Gagal mencatat log registrasi:", logErr.message);
    }

    res.status(201).json({ msg: 'Akun karyawan berhasil dibuat!' });
  } catch (err) {
    console.error("❌ ERROR REGISTER:", err);
    res.status(500).json({ msg: 'Server Error saat register' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ msg: 'Email atau password salah!' });
    }

    if (user.isLocked && user.lockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(423).json({
        msg: `Akun Anda telah diblokir. Silakan hubungi Admin untuk membuka blokir.`,
        isLocked: true,
        remainingMinutes
      });
    }

    if (user.isLocked && user.lockedUntil <= Date.now()) {
      await resetLoginAttempts(user._id);
      user.isLocked = false;
      user.loginAttempts = 0;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      user.lastLoginAttempt = new Date();

      const remainingAttempts = 3 - user.loginAttempts;

      if (user.loginAttempts >= 3) {
        user.isLocked = true;
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();

        await Log.create({
          user: user.username,
          action: `ACCOUNT LOCKED - 3 failed login attempts`,
          category: 'ACCOUNT',
          type: 'SECURITY'
        });

        return res.status(423).json({
          msg: `Akun Anda telah diblokir karena 3 kali gagal login. Silakan hubungi Admin untuk membuka blokir.`,
          isLocked: true,
          remainingAttempts: 0
        });
      }

      await user.save();

      return res.status(401).json({
        msg: `Password salah! ${remainingAttempts} kesempatan lagi sebelum akun diblokir.`,
        remainingAttempts
      });
    }

    await resetLoginAttempts(user._id);

    // 8 jam menutupi satu hari kerja. Sebelumnya 1 hari penuh, sehingga token
    // yang tertinggal di browser komputer bersama masih bisa dipakai keesokan
    // harinya tanpa password.
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, tv: user.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    try {
        await Log.create({
          user: user.username,
          action: `USER LOGGED IN TO SYSTEM`,
          category: 'ACCOUNT',
          type: 'LOGIN'
        });
    } catch (logErr) {
        console.error("⚠️ Gagal mencatat log login:", logErr.message);
    }

    // viewModules ikut dikirim supaya dashboard bisa menyaring kartu modul untuk
    // akun Viewer. Ini hanya penentu tampilan — akses sesungguhnya tetap
    // diperiksa server pada tiap permintaan.
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        viewModules: user.viewModules || [],
      },
    });
  } catch (err) {
    console.error("❌ ERROR LOGIN:", err);
    res.status(500).json({ msg: 'Server Error saat login' });
  }
};

/**
 * Daftar modul yang bisa dicentang untuk akun Viewer.
 *
 * Sebelumnya seluruh isi MODULE_MAP ditawarkan, termasuk modul yang tidak punya
 * halaman rekaman — mencentangnya lolos disimpan tapi tidak pernah memunculkan
 * kartu apa pun di dashboard. Sekarang hanya modul yang benar-benar bisa dibuka
 * tanpa mengisi form.
 */
exports.getModuleOptions = (req, res) => {
  res.json([...MODUL_BISA_DILIHAT].sort());
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ created_at: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Gagal mengambil data user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User tidak ditemukan' });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ msg: 'Lo nggak bisa hapus akun lo sendiri' });
    }

    const deletedUsername = user.username;
    await User.findByIdAndDelete(req.params.id);

    try {
        await Log.create({
          user: req.user?.username || 'Admin',
          action: `REVOKED ACCESS / DELETED ACCOUNT: ${deletedUsername}`,
          category: 'ACCOUNT',
          type: 'DELETE'
        });
    } catch (logErr) {
        console.error("⚠️ Gagal mencatat log delete user:", logErr.message);
    }

    res.json({ msg: 'Akses user berhasil dicabut' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Gagal menghapus user" });
  }
};

exports.adminResetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User tidak ditemukan' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    // Reset oleh Admin biasanya dilakukan justru karena akunnya bermasalah,
    // jadi semua sesi lama harus ikut mati.
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.loginAttempts = 0;
    user.isLocked = false;
    user.lockedUntil = null;
    await user.save();

    try {
      await Log.create({
        user: req.user?.username || 'Admin',
        action: `FORCE RESET PASSWORD & UNLOCKED ACCOUNT FOR: ${user.username}`,
        category: 'ACCOUNT',
        type: 'SECURITY'
      });
    } catch (logErr) {
      console.error("⚠️ Gagal mencatat log reset password:", logErr.message);
    }

    res.json({ msg: `Password untuk ${user.username} berhasil di-override dan akun dibuka!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Gagal reset password" });
  }
};

exports.adminUnlockAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User tidak ditemukan' });
    }

    user.loginAttempts = 0;
    user.isLocked = false;
    user.lockedUntil = null;
    await user.save();

    try {
      await Log.create({
        user: req.user?.username || 'Admin',
        action: `UNLOCKED ACCOUNT FOR: ${user.username}`,
        category: 'ACCOUNT',
        type: 'SECURITY'
      });
    } catch (logErr) {
      console.error("⚠️ Gagal mencatat log unlock:", logErr.message);
    }

    res.json({ msg: `Akun ${user.username} berhasil dibuka!` });
  } catch (err) {
    console.error("❌ Error unlock account:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Sebelumnya email yang tidak terdaftar tetap dibalas 200 dengan pesan
    // seragam, supaya orang luar tidak bisa menebak alamat mana yang punya akun.
    // Atas permintaan pembimbing, ketidaktersediaannya kini disampaikan terus
    // terang. Konsekuensinya alamat email jadi bisa ditebak satu per satu.
    if (!user) {
      return res.status(404).json({
        msg: 'Email tidak terdaftar di sistem.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + RESET_EXPIRE_MINUTES * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const { subject, html, text, attachments } = resetPasswordTemplate({
      username: user.username,
      resetUrl,
      expireMinutes: RESET_EXPIRE_MINUTES
    });

    try {
      await sendEmail({ to: user.email, subject, html, text, attachments });
    } catch (mailErr) {
      // Email gagal kekirim -> token dibatalin biar nggak nyangkut di DB
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      console.error("❌ Gagal kirim email reset password:", mailErr.message);
      return res.status(500).json({ msg: 'Gagal mengirim email. Coba lagi nanti.' });
    }

    await Log.create({
      user: user.username,
      action: `REQUESTED PASSWORD RESET`,
      category: 'ACCOUNT',
      type: 'SECURITY'
    });

    res.status(200).json({
      msg: 'Jika email terdaftar, kami akan kirimkan link reset password.'
    });

  } catch (err) {
    console.error("❌ Error forgot password:", err);
    res.status(500).json({ msg: 'Server error, coba lagi nanti.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        msg: 'Token tidak valid atau sudah kadaluarsa.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    // Password diganti lewat tautan reset: matikan sesi lama, karena kalau
    // akunnya memang sedang disalahgunakan, sesi penyerang harus ikut putus.
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.loginAttempts = 0;
    user.isLocked = false;
    user.lockedUntil = null;
    await user.save();

    await Log.create({
      user: user.username,
      action: `RESET PASSWORD SUCCESSFULLY`,
      category: 'ACCOUNT',
      type: 'SECURITY'
    });

    res.status(200).json({
      msg: 'Password berhasil direset! Silakan login dengan password baru Anda.'
    });

  } catch (err) {
    console.error("❌ Error reset password:", err);
    res.status(500).json({ msg: 'Server error, coba lagi nanti.' });
  }
};