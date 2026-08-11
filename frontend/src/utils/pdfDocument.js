/**
 * Potongan yang dipakai bersama oleh semua dokumen PDF ProTrack.
 *
 * Sebelumnya tiap halaman memegang salinan kodenya sendiri — modal nama
 * penandatangan bahkan sama persis karakter demi karakter di enam berkas.
 * Akibatnya satu perbaikan tampilan harus disalin berkali-kali dan gampang
 * tertinggal di salah satu halaman.
 */
import Swal from 'sweetalert2';
import autoTable from 'jspdf-autotable';

/** Lebar halaman A4 potret dalam milimeter, dipakai untuk menengahkan teks. */
export const LEBAR_HALAMAN = 210;

export const rp = (nilai) => `Rp ${(Number(nilai) || 0).toLocaleString('id-ID')}`;

export const tanggalDokumen = (nilai) =>
  new Date(nilai || Date.now()).toLocaleDateString('en-GB');

/**
 * Menanyakan nama penandatangan.
 * @returns {Promise<string|null>} null berarti pengguna membatalkan.
 */
export const mintaPenandatangan = async () => {
  const hasil = await Swal.fire({
    title: 'Nama Penandatangan',
    input: 'text',
    inputPlaceholder: 'Nama yang menandatangani',
    showCancelButton: true,
    confirmButtonText: 'Generate PDF',
    inputValidator: (v) => (!v || !v.trim()) && 'Nama penandatangan wajib diisi',
  });
  if (!hasil.isConfirmed) return null;
  return (hasil.value || '').trim();
};

/**
 * Memasang kop surat. Kalau berkas gambarnya gagal dimuat, dokumen tetap jadi
 * dengan kop teks — lebih baik daripada PDF gagal sepenuhnya.
 */
export const pasangKop = (doc) => {
  try {
    // Alias dan mode FAST menahan ukuran berkas; tanpa itu satu PDF bisa
    // menembus 3 MB karena gambar kop disematkan mentah berkali-kali.
    doc.addImage('/header-batavia.png', 'PNG', 0, 0, LEBAR_HALAMAN, 40, 'kop', 'FAST');
  } catch {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, LEBAR_HALAMAN, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. BATAVIA JAYA KREASINDO', LEBAR_HALAMAN / 2, 13, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }
};

/** Cap DRAFT miring untuk dokumen yang belum disetujui. */
export const capDraft = (doc) => {
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.07 }));
  doc.setFontSize(70);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 0, 0);
  doc.text('DRAFT', 105, 160, { align: 'center', angle: 45 });
  doc.restoreGraphicsState();
  doc.setTextColor(0, 0, 0);
};

/** Judul besar dokumen. */
export const judulDokumen = (doc, teks, y = 55, x = 14) => {
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(teks, x, y);
  doc.setTextColor(0, 0, 0);
};

/**
 * Tabel item dengan gaya seragam: kepala gelap, angka rata kanan, garis tipis
 * antar baris.
 */
export const tabelItem = (doc, { startY, head, body, columnStyles }) => {
  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'plain',
    margin: { left: 7.5 },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: columnStyles || {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 70 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 45 },
      4: { halign: 'right', cellWidth: 45 },
    },
    didDrawCell: (data) => {
      if (data.section === 'body') {
        doc.setDrawColor(230);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    },
  });
  return doc.lastAutoTable.finalY;
};

/**
 * Baris total di kanan bawah tabel. Baris bernilai nol dilewati supaya tidak
 * meninggalkan baris kosong pada dokumen tanpa pajak atau biaya tambahan.
 */
export const blokTotal = (doc, mulaiY, baris, { labelAkhir = 'GRAND TOTAL', nilaiAkhir = 0 }) => {
  let y = mulaiY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  baris
    .filter((b) => b.selalu || Number(b.nilai) > 0)
    .forEach((b, i) => {
      if (i > 0) y += 7;
      doc.text(b.label, 130, y);
      doc.text(rp(b.nilai), 196, y, { align: 'right' });
    });

  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(labelAkhir, 130, y);
  doc.text(rp(nilaiAkhir), 196, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  return y;
};

/** Blok tanda tangan di kanan bawah. */
export const blokTandaTangan = (doc, penandatangan, y, { x = 167, salam = 'Hormat Kami,' } = {}) => {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(salam, x, y + 5, { align: 'center' });
  doc.text(penandatangan ? `( ${penandatangan} )` : '(________________)', x, y + 45, { align: 'center' });
};

/** Teks panjang yang otomatis dipotong agar tidak terpangkas tepi halaman. */
export const teksBungkus = (doc, teks, x, y, lebar = 180) => {
  const baris = doc.splitTextToSize(String(teks || '-'), lebar);
  doc.text(baris, x, y);
  return y + baris.length * 5;
};
