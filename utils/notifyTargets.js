const User = require('../models/User');
const Project = require('../models/Project');

/* Penentu SIAPA yang harus menerima sebuah notifikasi.
 *
 * Dipisah dari pengirimannya karena logika "siapa" dipakai oleh ketiga kanal
 * (lonceng in-app, email, dan nanti Web Push). Menargetkan sekali di sini
 * membuat kanal-kanal itu tidak pernah bisa berbeda pendapat soal penerima.
 */

// 'Admin' berganti nama jadi 'Administrator' tapi kedua nama masih hidup
// berdampingan di seluruh rute. Penyamaan ini menyalin middleware/auth.js:165-169
// supaya notifikasi peran tidak diam-diam melewatkan akun yang sudah dimigrasi.
const samakanPeran = (peran) => {
  const set = new Set([peran]);
  if (set.has('Admin') || set.has('Administrator')) {
    set.add('Admin');
    set.add('Administrator');
  }
  return [...set];
};

/** Semua akun dengan peran tertentu. Mengembalikan array ObjectId. */
async function usersByRole(peran) {
  const daftar = await User.find({ role: { $in: samakanPeran(peran) } }).select('_id').lean();
  return daftar.map((u) => u._id);
}

/**
 * Akun Marketing yang memegang sebuah project.
 *
 * Project.createdBy diisi server (controllers/projectController.js) dan
 * divalidasi harus berperan Marketing saat PIC dipindahkan, jadi ia memang
 * penanda PIC — bukan sekadar jejak pembuat.
 *
 * Tapi field itu TIDAK required, sehingga project lama atau hasil impor bisa
 * kosong. Kalau kosong, notifikasi jatuh ke seluruh akun Marketing daripada
 * hilang tanpa jejak.
 *
 * @param {string} kodeProject mis. 'BJK-202608-0001'
 */
async function picMarketing(kodeProject) {
  if (!kodeProject) return usersByRole('Marketing');
  const project = await Project.findOne({ projectId: kodeProject }).select('createdBy').lean();
  if (project?.createdBy) return [project.createdBy];
  return usersByRole('Marketing');
}

/**
 * Gabungkan beberapa daftar penerima, buang duplikat, dan buang akun tertentu.
 * Pelaku dibuang secara bawaan — memberi tahu seseorang tentang perbuatannya
 * sendiri hanya menambah bising.
 *
 * @param {Array<Array>} daftar
 * @param {string|object} [kecuali] biasanya req.user.id
 */
function gabung(daftar, kecuali) {
  const buang = kecuali ? String(kecuali) : null;
  const unik = new Map();
  daftar.flat().filter(Boolean).forEach((id) => {
    const kunci = String(id);
    if (kunci !== buang) unik.set(kunci, id);
  });
  return [...unik.values()];
}

module.exports = { usersByRole, picMarketing, gabung, samakanPeran };
