const User = require('../models/User');
const Log = require('../models/Log');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ============================================================
// KONFIGURASI NODEMAILER
// ============================================================
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  auth: {
    user: process.env.EMAIL_USER || '74be9a391d9aa4',
    pass: process.env.EMAIL_PASS || '1e011a60b431c8'
  }
});

// ============================================================
// HELPER: RESET LOGIN ATTEMPTS
// ============================================================
const resetLoginAttempts = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    loginAttempts: 0,
    isLocked: false,
    lockedUntil: null
  });
};

// ============================================================
// 1. REGISTER (Admin Adds Employee)
// ============================================================
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'Email sudah terdaftar!' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ username, email, password: hashedPassword, role });
    await user.save();

    try {
        await Log.create({
          user: req.user ? req.user.username : 'Admin', 
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

// ============================================================
// 2. LOGIN
// ============================================================
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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

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

    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error("❌ ERROR LOGIN:", err);
    res.status(500).json({ msg: 'Server Error saat login' });
  }
};

// ============================================================
// 3. GET ALL USERS
// ============================================================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ created_at: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Gagal mengambil data user" });
  }
};

// ============================================================
// 4. DELETE USER (Revoke Access)
// ============================================================
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
          user: req.user.username, 
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

// ============================================================
// 5. ADMIN FORCE RESET PASSWORD (Override) + UNLOCK ACCOUNT
// ============================================================
exports.adminResetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User tidak ditemukan' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.loginAttempts = 0;
    user.isLocked = false;
    user.lockedUntil = null;
    await user.save();

    try {
      await Log.create({
        user: req.user.username,
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

// ============================================================
// 6. ADMIN UNLOCK ACCOUNT (tanpa reset password)
// ============================================================
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
        user: req.user.username, 
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

// ============================================================
// 7. FORGOT PASSWORD - Kirim email reset link
// ============================================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ 
        msg: 'Jika email terdaftar, kami akan kirimkan link reset password.' 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const mailOptions = {
      from: '"ProTrack ERP" <noreply@protrack.com>',
      to: user.email,
      subject: '🔐 Reset Password ProTrack Anda',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 50px; height: 50px; background: #4f46e5; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">P</span>
            </div>
            <h2 style="color: #1e293b; margin: 0;">ProTrack ERP</h2>
          </div>
          
          <h3 style="color: #1e293b;">Halo ${user.username},</h3>
          <p style="color: #475569; line-height: 1.6;">
            Kami menerima permintaan untuk mereset password akun ProTrack Anda. 
            Klik tombol di bawah untuk melanjutkan:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 12px; font-weight: bold; 
                      display: inline-block;">
              🔐 Reset Password Sekarang
            </a>
          </div>
          
          <p style="color: #475569; font-size: 12px; margin-top: 20px;">
            Link ini akan kadaluarsa dalam <strong>10 menit</strong>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #94a3b8; font-size: 10px; text-align: center;">
            &copy; 2026 ProTrack ERP
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

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

// ============================================================
// 8. RESET PASSWORD
// ============================================================
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