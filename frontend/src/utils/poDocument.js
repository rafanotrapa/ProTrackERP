/**
 * Dokumen PDF Purchase Order.
 *
 * Dipakai di dua tempat: otomatis saat PO diterbitkan lewat Create PO, dan saat
 * diunduh ulang dari PO Record. Keduanya memanggil fungsi yang sama supaya
 * dokumen yang keluar selalu identik.
 */
import { jsPDF } from 'jspdf';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  rp, tanggalDokumen, mintaPenandatangan, pasangKop, judulDokumen,
  tabelItem, blokTotal, blokTandaTangan, teksBungkus,
} from './pdfDocument';
import { openSecureFile } from './secureFile';

/**
 * Mengarsipkan berkas ke server. Sengaja tidak menggagalkan apa pun bila
 * arsipnya gagal — pengguna sudah memegang PDF-nya, dan PO tetap bisa dicetak
 * ulang dari data.
 */
const arsipkan = async (poNumber, blob) => {
  try {
    const token = localStorage.getItem('token');
    const data = new FormData();
    data.append('document', new File([blob], `${poNumber}.pdf`, { type: 'application/pdf' }));
    await axios.patch(`http://localhost:5000/api/po/${poNumber}/document`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.warn('Dokumen PO gagal diarsipkan, PDF tetap terunduh:', err.message);
  }
};

/** Subtotal dihitung dari item; sisanya diambil apa adanya dari dokumen PO. */
const hitungSubtotal = (items = []) =>
  items.reduce((jml, it) => jml + (Number(it.cogs) || 0) * (Number(it.quantity) || 0), 0);

/**
 * @param {object} po Dokumen PO dari server, vendorId sudah ter-populate.
 * @returns {Promise<boolean>} false bila pengguna membatalkan.
 */
export const unduhDokumenPO = async (po) => {
  if (!po) return false;

  // Dokumen yang sudah diarsipkan diambil apa adanya. PO adalah surat resmi ke
  // supplier, jadi unduhan berikutnya harus berkas yang sama persis — bukan
  // hasil cetak ulang yang bisa berbeda bila data atau tata letak berubah.
  if (po.documentFile) {
    try {
      await openSecureFile(po.documentFile);
      return true;
    } catch (err) {
      console.warn('Arsip dokumen PO tidak terbaca, dicetak ulang dari data:', err.message);
    }
  }

  const penandatangan = await mintaPenandatangan();
  if (penandatangan === null) return false;

  try {
    const doc = new jsPDF();
    const vendor = po.vendorId || {};
    const items = po.items || [];

    pasangKop(doc);
    judulDokumen(doc, 'PURCHASE ORDER');

    const infoY = 65;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('To :', 14, infoY);
    doc.setFont('helvetica', 'bold');
    doc.text(String(vendor.vendorName || '-').toUpperCase(), 14, infoY + 6);
    doc.setFont('helvetica', 'normal');
    if (vendor.contactPerson) doc.text(`Attn: ${vendor.contactPerson}`, 14, infoY + 12);
    if (vendor.address) teksBungkus(doc, vendor.address, 14, infoY + 18, 95);

    doc.text('Date', 120, infoY);
    doc.text(`: ${tanggalDokumen(po.timestamp)}`, 150, infoY);
    doc.text('PO #', 120, infoY + 6);
    doc.text(`: ${po.poNumber || '-'}`, 150, infoY + 6);
    doc.text('Project ID', 120, infoY + 12);
    doc.text(`: ${po.projectId || '-'}`, 150, infoY + 12);

    // Alamat kirim dibungkus; alamat panjang pernah terpangkas di dokumen BAST.
    doc.setFont('helvetica', 'bold');
    doc.text('SHIP TO :', 120, infoY + 20);
    doc.setFont('helvetica', 'normal');
    teksBungkus(doc, po.shippingAddress, 120, infoY + 26, 80);

    const mataUang = String(po.currency || 'IDR').toUpperCase();


    const akhirTabel = tabelItem(doc, {
      startY: infoY + 48,
      // Header dan nominal mengikuti mata uang PO-nya. Sebelumnya '(IDR)'
      // di-hardcode di sini, jadi PO ke supplier asing salah cetak.
      head: [['Qty', 'Description', 'Unit', `Unit Price (${mataUang})`, `Line Total (${mataUang})`]],
      body: items.map((it) => [
        it.quantity || 0,
        String(it.itemName || '').toUpperCase(),
        String(it.unit || '').toUpperCase(),
        rp(it.cogs, mataUang),
        rp((Number(it.cogs) || 0) * (Number(it.quantity) || 0), mataUang),
      ]),
    });

    const subtotal = hitungSubtotal(items);
    const labelBiaya = po.additionalFeeRemarks
      ? `Additional Fee (${po.additionalFeeRemarks})`
      : 'Additional Fee';

    let y = blokTotal(
      doc,
      akhirTabel + 15,
      [
        { label: 'Subtotal', nilai: subtotal, selalu: true },
        { label: labelBiaya, nilai: po.additionalFee },
        { label: `Tax / PPN${po.taxPercentage ? ` ${po.taxPercentage}%` : ''}`, nilai: po.taxAmount },
      ],
      { nilaiAkhir: po.totalAmount, mataUang }
    );

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CATATAN :', 14, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.text('Mohon kirim barang sesuai rincian di atas ke alamat pengiriman yang tertera.', 14, y + 25);

    blokTandaTangan(doc, penandatangan, y + 35);

    doc.save(`${po.poNumber || 'PURCHASE-ORDER'}.pdf`);

    if (po.poNumber) await arsipkan(po.poNumber, doc.output('blob'));
    return true;
  } catch (err) {
    console.error('PDF PO Error:', err);
    Swal.fire('PDF Error', 'Gagal generate PDF: ' + err.message, 'error');
    return false;
  }
};
