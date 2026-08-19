const Project = require('../models/Project');

// Kode project disimpan sebagai teks di banyak koleksi, bukan sebagai ObjectId,
// jadi nama project tidak bisa diambil lewat populate. Pencocokannya dinormalkan
// supaya selisih spasi atau huruf besar-kecil tidak membuat nama gagal ketemu.
const norm = (kode) => String(kode || '').trim().toLowerCase();

/**
 * Peta kode project ke namanya. Satu query untuk berapa pun banyaknya kode,
 * bukan satu query per baris.
 * @param {string[]} kodeProject
 * @returns {Promise<Map<string, string>>}
 */
async function petaNamaProject(kodeProject = []) {
  const unik = [...new Set(kodeProject.filter(Boolean).map((k) => String(k).trim()))];
  if (unik.length === 0) return new Map();

  const projects = await Project.find({ projectId: { $in: unik } })
    .select('projectId projectName')
    .lean();

  const peta = new Map();
  projects.forEach((p) => {
    if (p.projectName) peta.set(norm(p.projectId), p.projectName);
  });
  return peta;
}

/**
 * Tempelkan projectName ke tiap dokumen yang punya projectId.
 * Nama yang sudah tersimpan di dokumen dibiarkan, karena itu nama saat
 * dokumen dibuat dan bisa saja sengaja berbeda.
 * @param {object[]} dokumen hasil .lean() atau objek biasa
 */
async function lengkapiNamaProject(dokumen = []) {
  const peta = await petaNamaProject(dokumen.map((d) => d?.projectId));
  return dokumen.map((d) => ({
    ...d,
    projectName: d.projectName || peta.get(norm(d.projectId)) || '',
  }));
}

module.exports = { petaNamaProject, lengkapiNamaProject, norm };
