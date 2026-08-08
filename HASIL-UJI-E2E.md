# Hasil Uji End-to-End — 8 Agustus 2026

Diuji di lokal (`localhost:5173` + `localhost:5000`) terhubung ke database `protrack_erp`.
Branch: `fix/audit-2026-08` (3 commit, belum di-push).

## Cara push nanti

```
cd C:\Users\Rafa\ProTrackERP
git push -u origin fix/audit-2026-08
```

Login sebagai akun **`rafanotrapa`** saat browser terbuka (bukan `asn95`, nanti 403).
Setelah itu buka PR di:
`https://github.com/rafanotrapa/ProTrackERP/compare/main...fix/audit-2026-08`

---

## 1. AUTO mode, termin DP 40% — alur penuh sampai lunas

Project `BJK-202608-2817` "Uji Fix Termin Kursi Rapat", kontrak Rp 400.000.000.
Vendor `PT Mitra Kursi Sejahtera`. SQ: barang Rp 240jt + ongkir Rp 8jt + PPN Rp 26,4jt.

Urutan yang dijalankan (sesuai koreksi alur bisnis):
Project → Supplier Quotation → approve → **Client Quotation** → approve →
**Client Invoice** → **Input Payment #1** → verifikasi → PO → QC →
Invoice Submission → Supplier Payment → Delivery/BAST → invoice termin 2 → payment 2 → verifikasi.

| Yang diperiksa | Hasil |
|---|---|
| Termin tersimpan di DB | `topOption: "DP 40%"`, `customTop: "DP 40%"` (dulu kosong) |
| Tahap billing | 2 tahap: DP 40% Rp 160.000.000 + Pelunasan 60% Rp 240.000.000 |
| TOP di layar approval | `DP 40%` (dulu `N/A`) |
| Client Invoice | "CURRENT BILLING AMOUNT (DP 40%)", nominal terkunci Rp 160.000.000 |
| Input Payment | "BILLING PHASE / TOP: DP 40%" |
| Layar verifikasi | menampilkan "NILAI TAGIHAN" sebagai pembanding (dulu tidak ada) |
| Status akhir | DP 40% = Paid, Pelunasan 60% = Paid, outstanding Rp 0 |

Catatan penting: dropdown TOP di Client Quotation **sengaja tidak disentuh** — itu skenario
persis yang dulu membuat skema termin hilang.

## 2. Pengakuan COGS

| Momen | supplierCOGS | supplierTotalPaid | Margin |
|---|---|---|---|
| Tagihan supplier masuk, belum dibayar | Rp 248.000.000 | Rp 0 | 38% |
| Setelah supplier dibayar | Rp 248.000.000 | Rp 274.400.000 | 38% |

Margin stabil di kedua momen. Sebelum perbaikan, project tampil bermargin 100%
selama vendor belum dibayar. `estimatedCOGS` kini memakai basis yang sama dengan
`supplierCOGS`, sehingga perbandingan estimasi vs aktual berarti.

## 3. Invoice Submission — pemisahan base / pajak / bea

Auto-fill dari PO Rp 274.400.000 terpecah menjadi:

- Base billing: **Rp 248.000.000** (barang + ongkir vendor)
- Tagihan pajak: **Rp 26.400.000** (field terpisah, checkbox aktif)
- Bea masuk: **kosong** (memang tidak bisa diprediksi di awal)
- Grand total: Rp 274.400.000 — tanpa PPN terhitung dua kali

## 4. Lebih bayar

Invoice Rp 240.000.000, dibayar Rp 250.000.000 → muncul konfirmasi
"Pembayaran Melebihi Tagihan ... Kelebihan 10.000.000 akan dicatat sebagai lebih bayar",
dengan pilihan "Perbaiki nominal". Dibayar pas Rp 240.000.000 → lolos tanpa peringatan.

Input Payment milik Marketing tidak perlu guard: nominalnya read-only, dikunci ke nilai invoice.

## 5. PDF

| Berkas | Hasil |
|---|---|
| BAST | Alamat 64 karakter tercetak utuh dalam 2 baris (dulu terpotong di karakter ke-60) |
| BAST ukuran | 706 KB (dulu 3,3 MB) |
| Invoice PDF | blob `application/pdf` 706 KB ter-generate, TOP & billing phase tercetak |
| Nama penandatangan | kosong ditolak: "Nama penandatangan wajib diisi" |
| Generate Invoice | prompt nama penandatangan kini muncul (dulu tertutup notifikasi sukses) |

Catatan: saat pengujian otomatis, Chrome memblokir penulisan berkas ke folder Downloads
setelah unduhan pertama. Pembuatan PDF-nya sendiri terbukti berhasil lewat penyadapan blob.

## 6. MANUAL mode + skema termin lain

| Skema | Project | Hasil |
|---|---|---|
| Termin 3x 30/30/40 (MANUAL) | `BJK-202608-2361` Rp 300jt | Rp 90jt + Rp 90jt + Rp 120jt |
| COD (MANUAL) | `BJK-202608-1175` Rp 50jt | 1 tahap "Full Payment" Rp 50jt |
| DP 40% (AUTO) | `BJK-202608-2817` Rp 400jt | Rp 160jt + Rp 240jt |

Skema 4x–6x memakai cabang kode yang sama dengan 3x dan tercakup di
self-test `node utils/paymentTerms.js`.

## 7. Perbaikan UI

- Ikon "Receive & QC Goods" tampil (dulu kosong)
- Vendor tampil `PT Mitra Kursi Sejahtera` (dulu `PT. PT Mitra ...`)
- Layar approval Management menampilkan nama vendor, kode di bawahnya
- Tombol "Record Payment" membawa project — form langsung terisi

---

## Yang BELUM dikerjakan

1. **Label termin pada tagihan supplier.** PO diterbitkan sekali sebagai penugasan
   senilai penuh; pembayaran ke vendor berjalan mengikuti TOP lewat beberapa kali
   Invoice Submission (tidak ada batasan satu invoice per PO — yang dicek unik
   hanya nomor tagihan). Pola ini sudah didukung dan nominalnya akumulatif benar
   di laporan. Yang tersisa hanya kosmetik: `terminName` selalu tersimpan
   "Full Payment" karena form belum menyediakan isiannya, jadi tagihan DP pun
   berlabel "Full Payment". `selectedPO.paymentTerms` di `SupplierInvoice.jsx`
   adalah sisa rancangan lama yang tidak pernah terisi dan tidak dipakai.

2. **Kredensial di histori Git.** `.env` masih terbaca di commit lama repo publik
   (`git show b2a851e:.env`). Menghapus di commit terbaru tidak menghapus histori.

3. **`node_modules/` masih ter-track** (11.164 berkas) walau sudah masuk `.gitignore` —
   perlu `git rm -r --cached node_modules`.

## Data uji yang tertinggal di database

`BJK-202608-2817`, `BJK-202608-2361`, `BJK-202608-1175`, `BJK-202608-4801`,
vendor `VND-202608-1091`, `SQ-202608-5343`, `PO-202608-7045`, beserta invoice
dan pembayarannya.
