/* Kamus dua bahasa.
 *
 * Kunci ditulis datar dengan titik ('header.signOut'), bukan bersarang: lookup
 * jadi satu akses properti, dan kunci yang timpang gampang terlihat saat diff.
 *
 * ISTILAH YANG SENGAJA TIDAK DITERJEMAHKAN — biarkan sama di kedua bahasa:
 *
 *   Purchase Order, PO, Quotation, Supplier Quotation, SQ, Client Quotation,
 *   Invoice, Vendor, Supplier, Client, Project, PIC, COGS, Grand Total,
 *   Subtotal, QC, BAST, Delivery, Inventory, Expense Submission, Timeline,
 *   Dashboard, ERP, Term of Payment, TOP, Draft, Approve, Reject, Reimburse
 *
 * Istilah baku Indonesia yang tetap Indonesia walau mode English, karena tidak
 * punya padanan 1:1 di konteks bisnis dan pajak lokal:
 *
 *   PPN, Termin, DP, Pelunasan, Bea Masuk, NPWP, Faktur Pajak, Resi, Retur,
 *   Ongkir
 *
 * Nilai status yang datang dari database (Pending, Approved, Paid, dst) hanya
 * boleh dipetakan SAAT RENDER lewat status.*. Jangan pernah mengirim hasil
 * terjemahannya kembali ke API atau memakainya dalam perbandingan.
 */

export const id = {
  // Kerangka aplikasi
  'header.tagline': 'Enterprise Resource Planning',
  'header.access': 'Akses {role}',
  'header.signOut': 'Keluar',

  'footer.tagline': 'Strategic Enterprise Resource Planning',
  'footer.version': 'Versi',
  'footer.environment': 'Lingkungan',
  'footer.serverTime': 'Waktu Server',
  'footer.encrypted': 'Sistem Terenkripsi',
  'footer.authorized': 'Khusus Pihak Berwenang',
  'footer.copyright': '© 2026 ProTrack ERP • Dikembangkan untuk Capstone Project',
  'footer.privacy': 'Kebijakan Privasi',
  'footer.terms': 'Syarat Layanan',

  // Layar gagal render
  'error.title': 'Halaman Gagal Dimuat',
  'error.subtitle': 'Bagian lain aplikasi tetap bisa dipakai',
  'error.body': 'Terjadi kesalahan saat menampilkan halaman ini. Data Anda tidak terpengaruh.',
  'error.reload': 'Muat Ulang',
  'error.toDashboard': 'Ke Dashboard',
  'error.details': 'Rincian teknis',

  // Login
  'login.success': 'Login Berhasil!',
  'login.welcome': 'Selamat datang, {nama}',
  'login.locked': 'AKUN DIBLOKIR',
  'login.lockedHelp': 'Silakan hubungi Administrator untuk membuka blokir akun Anda.',
  'login.wrongPassword': 'PASSWORD SALAH!',
  'login.attemptsLeft': '⚠️ Sisa {n} kesempatan lagi sebelum akun diblokir.',
  'login.failed': 'Login Gagal!',
  'login.retry': 'Coba Lagi',

  // Dashboard
  'dashboard.quickAccess': 'Akses Cepat',
  'dashboard.modules': 'Modul',
  'dashboard.systemStatus': 'Status Sistem',
  'dashboard.operational': 'Beroperasi',
  'dashboard.access': 'Buka',
  'dashboard.noModules': 'Belum Ada Modul',
  'dashboard.contactAdmin': 'Hubungi administrator untuk mendapatkan akses',
  'dashboard.myProjects': 'Project Saya',
  'dashboard.myProjectsSub': 'Project yang Anda pegang sebagai PIC',
  'dashboard.allProjects': 'Seluruh Project',
  'dashboard.allProjectsSub': 'Pantauan semua project beserta pemegangnya',
  'dashboard.colProject': 'Project',
  'dashboard.colClient': 'Klien',
  'dashboard.colValue': 'Nilai',
  'dashboard.colPic': 'PIC',
  'dashboard.colStatus': 'Status',
  'dashboard.noProjects': 'Belum ada project',
  'dashboard.noProjectsMine': 'Anda belum memegang project. Project yang Anda buat akan muncul di sini.',
  'dashboard.loadingProjects': 'Memuat project...',
  'dashboard.greetMorning': 'Selamat Pagi',
  'dashboard.greetNoon': 'Selamat Siang',
  'dashboard.greetAfternoon': 'Selamat Sore',
  'dashboard.greetEvening': 'Selamat Malam',

  // Nilai status dari database — hanya untuk ditampilkan
  'status.Tendering': 'Tender',
  'status.Draft': 'Draft',
  'status.Pending': 'Menunggu',
  'status.Approved': 'Disetujui',
  'status.Rejected': 'Ditolak',
  'status.Verified': 'Terverifikasi',
  'status.Pending Verification': 'Menunggu Verifikasi',
  'status.Paid': 'Lunas',
  'status.Unpaid': 'Belum Dibayar',
  'status.Partial': 'Sebagian',
  'status.Waiting Delivery': 'Menunggu Pengiriman',
  'status.Passed': 'Lolos',
  'status.Returned': 'Diretur',
  'status.Scheduled': 'Terjadwal',
  'status.In Transit': 'Dalam Perjalanan',
  'status.Delivered': 'Terkirim',
  'status.Ongoing': 'Berjalan',
  'status.Completed': 'Selesai',

  // Checklist password. Teks aturannya TIDAK boleh ikut dipindah ke
  // utils/passwordPolicy.js — berkas itu diimpor Node polos oleh
  // tests/passwordPolicy.test.js dan harus bebas React.
  'password.minLength': 'Minimal {min} karakter',
  'password.lower': 'Ada huruf kecil (a-z)',
  'password.upper': 'Ada huruf besar (A-Z)',
  'password.digit': 'Ada angka (0-9)',
  'password.symbol': 'Ada simbol (! @ # $ % ^ & *)',
  'password.notCommon': 'Bukan kata yang mudah ditebak',
  'password.notIdentity': 'Tidak memuat username atau email',
  'password.summary': 'Min. {min} karakter, kombinasi huruf besar, huruf kecil, angka, dan simbol.',


  // Notifikasi. Kalimatnya dirakit saat render dari kode jenis + parameter yang
  // tersimpan di models/Notification.js — server tidak tahu bahasa apa yang
  // aktif di browser penerima, jadi kalimat jadi tidak boleh disimpan di DB.
  'notifBell.title': 'Notifikasi',
  'notifBell.empty': 'Belum ada notifikasi',
  'notifBell.markAll': 'Tandai semua dibaca',
  'notifBell.loading': 'Memuat...',

  'notif.supplierQuotationCreated': 'Supplier Quotation {nomor} dari {oleh} perlu Anda setujui',
  'notif.supplierQuotationApproved': 'Supplier Quotation {nomor} disetujui — Client Quotation bisa dikerjakan',
  'notif.supplierQuotationRejected': 'Supplier Quotation {nomor} ditolak {oleh} — perbaiki dan ajukan ulang',
  'notif.clientQuotationSubmitted': 'Client Quotation {nomor} dari {oleh} perlu Anda setujui',
  'notif.clientQuotationApproved': 'Client Quotation {nomor} disetujui — invoice bisa diterbitkan',
  'notif.clientQuotationRejected': 'Client Quotation {nomor} ditolak {oleh} — perbaiki dan ajukan ulang',
  'notif.poCreated': 'Purchase Order {nomor} terbit — siapkan pembayaran ke vendor',
  'notif.poQcPassed': 'Barang PO {nomor} lolos QC — siap dijadwalkan kirim',
  'notif.poQcReturned': 'Barang PO {nomor} diretur saat QC — perlu ditindaklanjuti ke vendor',
  'notif.poDelivered': 'Barang PO {nomor} sudah terkirim — tagihan ke client bisa diterbitkan',
  'notif.supplierInvoiceSubmitted': 'Tagihan supplier {nomor} dari {oleh} perlu dibayar',
  'notif.supplierInvoicePaid': 'Tagihan supplier {nomor} sudah dibayar — vendor bisa dikabari',
  'notif.invoiceIssued': 'Invoice {nomor} terbit — kirimkan ke client untuk ditagihkan',
  'notif.paymentSubmitted': 'Bukti pembayaran invoice {nomor} perlu Anda verifikasi',
  'notif.paymentVerified': 'Pembayaran invoice {nomor} terverifikasi — progress project bertambah',
  'notif.paymentRejected': 'Pembayaran invoice {nomor} ditolak — periksa ulang bukti transfernya',
  'notif.projectCompleted': 'Project {nomor} selesai — seluruh tagihan lunas',
  'notif.expenseApproved': 'Pengajuan biaya {nomor} disetujui {oleh}',
  'notif.expenseRejected': 'Pengajuan biaya {nomor} ditolak {oleh} — lihat alasannya di detail',
  'notif.picChanged': 'Anda kini memegang project {nomor} sebagai PIC',

  // Umum
  'common.autoGenerated': 'Dibuat otomatis oleh sistem',
};

export const en = {
  'header.tagline': 'Enterprise Resource Planning',
  'header.access': '{role} Access',
  'header.signOut': 'Sign Out',

  'footer.tagline': 'Strategic Enterprise Resource Planning',
  'footer.version': 'Version',
  'footer.environment': 'Environment',
  'footer.serverTime': 'Server Time',
  'footer.encrypted': 'System Encrypted',
  'footer.authorized': 'Authorized Personnel Only',
  'footer.copyright': '© 2026 ProTrack ERP • Developed for Capstone Project',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Service',

  'error.title': 'Page Failed to Load',
  'error.subtitle': 'The rest of the application still works',
  'error.body': 'Something went wrong while rendering this page. Your data is unaffected.',
  'error.reload': 'Reload',
  'error.toDashboard': 'Go to Dashboard',
  'error.details': 'Technical details',

  'login.success': 'Login Successful!',
  'login.welcome': 'Welcome, {nama}',
  'login.locked': 'ACCOUNT LOCKED',
  'login.lockedHelp': 'Please contact your Administrator to unlock your account.',
  'login.wrongPassword': 'WRONG PASSWORD!',
  'login.attemptsLeft': '⚠️ {n} attempt(s) left before the account is locked.',
  'login.failed': 'Login Failed!',
  'login.retry': 'Try Again',

  'dashboard.quickAccess': 'Quick Access',
  'dashboard.modules': 'Modules',
  'dashboard.systemStatus': 'System Status',
  'dashboard.operational': 'Operational',
  'dashboard.access': 'Access',
  'dashboard.noModules': 'No Modules Available',
  'dashboard.contactAdmin': 'Contact administrator for access',
  'dashboard.myProjects': 'My Projects',
  'dashboard.myProjectsSub': 'Projects you hold as PIC',
  'dashboard.allProjects': 'All Projects',
  'dashboard.allProjectsSub': 'Overview of every project and its holder',
  'dashboard.colProject': 'Project',
  'dashboard.colClient': 'Client',
  'dashboard.colValue': 'Value',
  'dashboard.colPic': 'PIC',
  'dashboard.colStatus': 'Status',
  'dashboard.noProjects': 'No projects yet',
  'dashboard.noProjectsMine': 'You are not holding any project yet. Projects you create will appear here.',
  'dashboard.loadingProjects': 'Loading projects...',
  'dashboard.greetMorning': 'Good Morning',
  // Sapaan Indonesia punya empat tingkat, English hanya tiga. greetNoon
  // sengaja disamakan dengan greetAfternoon supaya ambang jam di Dashboard
  // tidak perlu bercabang per bahasa.
  'dashboard.greetNoon': 'Good Afternoon',
  'dashboard.greetAfternoon': 'Good Afternoon',
  'dashboard.greetEvening': 'Good Evening',

  'status.Tendering': 'Tendering',
  'status.Draft': 'Draft',
  'status.Pending': 'Pending',
  'status.Approved': 'Approved',
  'status.Rejected': 'Rejected',
  'status.Verified': 'Verified',
  'status.Pending Verification': 'Pending Verification',
  'status.Paid': 'Paid',
  'status.Unpaid': 'Unpaid',
  'status.Partial': 'Partial',
  'status.Waiting Delivery': 'Waiting Delivery',
  'status.Passed': 'Passed',
  'status.Returned': 'Returned',
  'status.Scheduled': 'Scheduled',
  'status.In Transit': 'In Transit',
  'status.Delivered': 'Delivered',
  'status.Ongoing': 'Ongoing',
  'status.Completed': 'Completed',

  'password.minLength': 'At least {min} characters',
  'password.lower': 'Has a lowercase letter (a-z)',
  'password.upper': 'Has an uppercase letter (A-Z)',
  'password.digit': 'Has a digit (0-9)',
  'password.symbol': 'Has a symbol (! @ # $ % ^ & *)',
  'password.notCommon': 'Not an easily guessed word',
  'password.notIdentity': 'Does not contain your username or email',
  'password.summary': 'Min. {min} characters, mixing uppercase, lowercase, digits, and symbols.',


  'notifBell.title': 'Notifications',
  'notifBell.empty': 'No notifications yet',
  'notifBell.markAll': 'Mark all as read',
  'notifBell.loading': 'Loading...',

  'notif.supplierQuotationCreated': 'Supplier Quotation {nomor} from {oleh} needs your approval',
  'notif.supplierQuotationApproved': 'Supplier Quotation {nomor} approved — the Client Quotation can be prepared',
  'notif.supplierQuotationRejected': 'Supplier Quotation {nomor} rejected by {oleh} — revise and resubmit',
  'notif.clientQuotationSubmitted': 'Client Quotation {nomor} from {oleh} needs your approval',
  'notif.clientQuotationApproved': 'Client Quotation {nomor} approved — invoices can be issued',
  'notif.clientQuotationRejected': 'Client Quotation {nomor} rejected by {oleh} — revise and resubmit',
  'notif.poCreated': 'Purchase Order {nomor} issued — prepare the vendor payment',
  'notif.poQcPassed': 'Goods for PO {nomor} passed QC — ready to schedule delivery',
  'notif.poQcReturned': 'Goods for PO {nomor} returned at QC — follow up with the vendor',
  'notif.poDelivered': 'Goods for PO {nomor} delivered — the client invoice can be issued',
  'notif.supplierInvoiceSubmitted': 'Supplier invoice {nomor} from {oleh} needs to be paid',
  'notif.supplierInvoicePaid': 'Supplier invoice {nomor} has been paid — you can inform the vendor',
  'notif.invoiceIssued': 'Invoice {nomor} issued — send it to the client for billing',
  'notif.paymentSubmitted': 'Payment proof for invoice {nomor} needs your verification',
  'notif.paymentVerified': 'Payment for invoice {nomor} verified — project progress advanced',
  'notif.paymentRejected': 'Payment for invoice {nomor} rejected — re-check the transfer proof',
  'notif.projectCompleted': 'Project {nomor} is complete — all invoices settled',
  'notif.expenseApproved': 'Expense submission {nomor} approved by {oleh}',
  'notif.expenseRejected': 'Expense submission {nomor} rejected by {oleh} — see the reason in the details',
  'notif.picChanged': 'You are now the PIC for project {nomor}',

  'common.autoGenerated': 'Generated automatically by the system',
};

export const KAMUS = { id, en };
export const BAHASA = ['id', 'en'];

/* Pemeriksaan mandiri paritas kunci.
 *
 * Mengikuti pola yang sudah dipakai utils/paymentTerms.js dan
 * utils/clientPaymentStatus.js: cek yang berjalan sendiri tanpa framework test.
 * Kunci yang tertinggal di satu bahasa tidak akan membuat layar kosong (t()
 * punya rantai fallback), tapi akan tampil dalam bahasa yang salah — dan itu
 * persis gejala yang sedang diperbaiki. Jadi lebih baik berisik di console. */
if (import.meta.env?.DEV) {
  const kunciId = Object.keys(id);
  const kunciEn = Object.keys(en);
  const kurangDiEn = kunciId.filter((k) => !(k in en));
  const kurangDiId = kunciEn.filter((k) => !(k in id));
  if (kurangDiEn.length || kurangDiId.length) {
    console.warn('[i18n] kunci timpang —', { kurangDiEn, kurangDiId });
  }
}
