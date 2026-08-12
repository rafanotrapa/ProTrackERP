const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');

const MODULE_MAP = {
  '/api/auth':               'Account',
  '/api/project':            'Project',
  '/api/vendor':             'Vendor',
  '/api/item':               'Item',
  '/api/supplier_quotation': 'Supplier Quotation',
  '/api/client_quotation':   'Client Quotation',
  '/api/logs':               'System Logs',
  '/api/po':                 'Purchase Order',
  '/api/client_invoice':     'Client Invoice',
  '/api/payments':           'Client Payment',
  '/api/financial':          'Financial Report',
  '/api/supplier_invoices':  'Supplier Invoice',
  '/api/supplier_payments':  'Supplier Payment',
  '/api/project-billing':    'Project Billing',
  '/api/project-timeline':   'Project Timeline',
  '/api/expense-submission': 'Expense Submission',
  '/api/inventory':          'Inventory',
};

const ACTION_VERB = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };

// Peran lihat-saja. Super Admin mencakup seluruh modul; Viewer hanya modul yang
// tercantum di viewModules miliknya.
const PERAN_BACA_SAJA = ['Super Admin', 'Viewer'];
const bacaSaja = (peran) => PERAN_BACA_SAJA.includes(peran);

const protect = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tanda tangan yang sah saja tidak cukup. Tanpa pemeriksaan ini, token yang
    // sudah terbit tetap berlaku sampai kedaluwarsa walaupun user-nya dihapus,
    // perannya diubah, atau passwordnya direset karena akunnya diduga bocor.
    // Peran juga dibaca ulang dari database supaya perubahan peran langsung
    // berlaku, bukan menunggu login berikutnya.
    const user = await User.findById(decoded.id).select('role tokenVersion viewModules');
    if (!user) {
      return res.status(401).json({ msg: 'Akun sudah tidak aktif. Silakan login ulang.' });
    }
    if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ msg: 'Sesi sudah tidak berlaku. Silakan login ulang.' });
    }

    req.user = { ...decoded, role: user.role, viewModules: user.viewModules || [] };

    // Penjagaan baca-saja ditaruh di sini, bukan di tiap rute, supaya tidak ada
    // satu pun endpoint yang bisa terlewat — termasuk rute yang ditambahkan
    // nanti tanpa ingat menyertakan penjagaannya.
    if (bacaSaja(user.role) && req.method !== 'GET') {
      return res.status(403).json({
        msg: 'Akun ini hanya memiliki akses lihat. Perubahan data tidak diizinkan.'
      });
    }

    const verb = ACTION_VERB[req.method];
    if (verb) {
      const moduleName = MODULE_MAP[req.baseUrl] || req.baseUrl || 'System';
      res.on('finish', () => {
        if (res.statusCode >= 400) return;
        const writeLog = (username) => Log.create({
          user:     username || 'Unknown',
          action:   `${verb} @ ${moduleName}`,
          category: moduleName,
          type:     verb,
        }).catch(() => {});
        if (decoded.username) writeLog(decoded.username);
        else User.findById(decoded.id).select('username').then((u) => writeLog(u?.username)).catch(() => {});
      });
    }

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Peran 'Admin' berganti nama menjadi 'Administrator'. Nama lama tetap diterima
// supaya akun yang belum ikut migrasi tidak langsung terkunci.
const admin = (req, res, next) => {
  if (req.user && ['Administrator', 'Admin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ msg: 'Akses ditolak! Bukan Administrator.' });
  }
};

/**
 * Batasi endpoint ke peran tertentu.
 *
 * Pembatasan peran sebelumnya hanya ada di frontend lewat <ProtectedRoute>,
 * yang cuma menyembunyikan menu. API-nya sendiri menerima siapa pun yang
 * punya token valid, sehingga mis. staf Marketing bisa memanggil endpoint
 * approve quotation dan verifikasi pembayaran secara langsung.
 *
 * Dipakai setelah `protect`, karena membaca req.user hasil verifikasi token.
 */
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ msg: 'Akses ditolak.' });
  }

  // Peran lihat-saja tidak perlu didaftarkan di 18 berkas rute satu per satu.
  // Permintaan tulis sudah ditolak lebih dulu di protect, jadi yang sampai sini
  // pasti GET. Super Admin lolos untuk semua modul; Viewer hanya untuk modul
  // yang dicentang untuknya.
  if (bacaSaja(req.user.role)) {
    if (req.user.role === 'Super Admin') return next();

    const modul = MODULE_MAP[req.baseUrl];
    if (modul && (req.user.viewModules || []).includes(modul)) return next();

    return res.status(403).json({
      msg: `Akun ini tidak diberi akses lihat untuk modul ${modul || 'ini'}.`
    });
  }

  // 'Admin' berganti nama jadi 'Administrator', tapi ke-18 berkas rute masih
  // menulis nama lama. Kedua nama disamakan dua arah supaya rute lama tetap
  // menerima akun yang sudah dimigrasi, dan sebaliknya.
  const diizinkan = new Set(allowedRoles);
  if (diizinkan.has('Admin') || diizinkan.has('Administrator')) {
    diizinkan.add('Admin');
    diizinkan.add('Administrator');
  }

  if (!diizinkan.has(req.user.role)) {
    return res.status(403).json({
      msg: `Akses ditolak. Endpoint ini hanya untuk: ${allowedRoles.join(', ')}.`
    });
  }
  next();
};

module.exports = { protect, admin, authorizeRoles, PERAN_BACA_SAJA, MODULE_MAP };
