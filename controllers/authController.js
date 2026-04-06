const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); 
const crypto = require('crypto');

// 1. REGISTER (Udah Oke)
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'Email sudah terdaftar!' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ username, email, password: hashedPassword, role });
    await user.save();

    res.status(201).json({ msg: 'Akun berhasil dibuat, silakan login!' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ada masalah di server saat register');
  }
};

// 2. LOGIN (Udah Oke)
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

    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).send('Ada masalah di server saat login');
  }
};

// 3. FORGOT PASSWORD (DIUBAH KE PORT FRONTEND)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'Email nggak ada di database, Fa!' });

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Setup Kurir Mailtrap
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // PENTING: Arahkan ke localhost:5173 (Vite), bukan 5000!
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const mailOptions = {
      from: '"ProTrack Support" <support@protrack.com>',
      to: user.email,
      subject: 'Reset Password ProTrack ERP',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2>Halo, ${user.username}!</h2>
          <p>Lo nerima email ini karena ada permintaan reset password buat akun ProTrack lo.</p>
          <p>Klik tombol di bawah ini buat ganti password (berlaku cuma 10 menit):</p>
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">RESET PASSWORD SEKARANG</a>
          <p>Kalau lo gak ngerasa minta ini, cuekin aja email ini ya.</p>
          <hr />
          <small>ProTrack ERP Monitoring System</small>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: 'Email reset password sudah dikirim ke Mailtrap!' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal kirim email');
  }
};

// 4. RESET PASSWORD (Udah Oke)
exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ msg: 'Token gak valid atau udah basi!' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ msg: 'Password berhasil diganti! Silakan login ulang.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal update password');
  }
};