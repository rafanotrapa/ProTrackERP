import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, BellRing } from 'lucide-react';
import { aktifkanPush, statusIzin } from '../utils/webPushClient';
import { useLang } from '../i18n';

const API = 'http://localhost:5000';
const JEDA_MS = 60_000;

/* Peta targetTipe -> URL.
 *
 * Dipisahkan begini karena rute aplikasi ini memakai DUA jenis parameter yang
 * tidak boleh tertukar: /timeline dan /project-billing menerima KODE BISNIS
 * ('BJK-202608-0001'), sedangkan rute detail lain menerima _id Mongo. Menyimpan
 * _id untuk semuanya akan membuat dua rute pertama gagal memuat data.
 */
const RUTE = {
  clientQuote: () => '/client-quote',
  quotationApproval: (id) => `/quotation-approval/${id}`,
  clientQuotationApproval: (id) => `/client-quotation-approval/${id}`,
  projectBilling: (kode) => `/project-billing/${kode}`,
  timeline: (kode) => `/timeline/${kode}`,
  poRecord: () => '/po-record',
  deliveryManagement: () => '/delivery-management',
  supplierPayment: () => '/supplier-payment',
  supplierQuotationRecord: () => '/supplier-quotation-record',
  supplierInvoiceRecord: () => '/supplier-invoice-record',
  quotationLog: () => '/quotation-log',
  invoiceLog: () => '/invoice-log',
  verifyPayment: () => '/verify-payment',
  expenseLog: () => '/expense-submission-log',
  projectLog: () => '/project-log',
};

const tujuan = (n) => {
  const buat = RUTE[n.targetTipe];
  return buat ? buat(n.targetId) : null;
};

/** Waktu relatif yang mengikuti bahasa aktif, tanpa menambah dependensi. */
const waktuRelatif = (iso, lang) => {
  const detik = Math.round((new Date(iso) - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { numeric: 'auto' });
  const satuan = [
    ['year', 31536000], ['month', 2592000], ['day', 86400],
    ['hour', 3600], ['minute', 60],
  ];
  for (const [nama, n] of satuan) {
    if (Math.abs(detik) >= n) return rtf.format(Math.round(detik / n), nama);
  }
  return rtf.format(Math.round(detik), 'second');
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [buka, setBuka] = useState(false);
  const [jumlah, setJumlah] = useState(0);
  const [daftar, setDaftar] = useState(null);
  const [izin, setIzin] = useState(() => statusIzin());
  const ref = useRef(null);

  const header = useCallback(() => {
    // Dibaca lewat localStorage seperti 95 pemanggilan lain di aplikasi ini.
    // utils/sessionScope.js menambal Storage.prototype supaya mode akun-per-tab
    // mengalihkannya ke sessionStorage; memakai sessionStorage langsung justru
    // memutus penambalan itu.
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const ambilJumlah = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const res = await axios.get(`${API}/api/notifications/unread-count`, header());
      setJumlah(res.data?.jumlah || 0);
    } catch {
      // Diamkan: lonceng tidak boleh memunculkan error di layar.
    }
  }, [header]);

  const ambilDaftar = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/notifications`, header());
      setDaftar(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDaftar([]);
    }
  }, [header]);

  /* eslint-disable react-hooks/set-state-in-effect --
   * Aturan ini menyasar setState yang dipanggil langsung di badan efek dan
   * memicu render berantai. Di sini setState terjadi di dalam callback async
   * setelah jaringan menjawab, dan sumbernya adalah sistem eksternal yang
   * di-poll — persis kasus yang dokumentasi aturannya sebut sah. Linter tidak
   * bisa menembus pemanggilan tak langsung lewat ambilJumlah. */
  useEffect(() => {
    ambilJumlah();
    // clearInterval WAJIB: React 19 dalam StrictMode menjalankan efek dua kali
    // saat DEV, jadi interval tanpa pembersihan akan berlipat tiap render.
    const timer = setInterval(ambilJumlah, JEDA_MS);
    // Angka jadi basi setelah laptop di-sleep; segarkan saat tab kembali aktif.
    const saatKembali = () => { if (!document.hidden) ambilJumlah(); };
    document.addEventListener('visibilitychange', saatKembali);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', saatKembali);
    };
  }, [ambilJumlah]);

  // Pola klik-di-luar yang sama dengan components/StyledSelect.jsx.
  useEffect(() => {
    const diLuar = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setBuka(false);
    };
    document.addEventListener('mousedown', diLuar);
    return () => document.removeEventListener('mousedown', diLuar);
  }, []);

  const toggle = () => {
    const berikutnya = !buka;
    setBuka(berikutnya);
    if (berikutnya) ambilDaftar();
  };

  const klik = async (n) => {
    setBuka(false);
    if (!n.dibaca) {
      setJumlah((j) => Math.max(0, j - 1));
      setDaftar((d) => d?.map((x) => (x._id === n._id ? { ...x, dibaca: true } : x)));
      axios.patch(`${API}/api/notifications/${n._id}/read`, {}, header()).catch(() => ambilJumlah());
    }
    const url = tujuan(n);
    if (url) navigate(url);
  };

  const nyalakanPush = async () => {
    const hasil = await aktifkanPush();
    setIzin(hasil.ok ? 'granted' : statusIzin());
  };

  const tandaiSemua = async () => {
    setJumlah(0);
    setDaftar((d) => d?.map((x) => ({ ...x, dibaca: true })));
    try {
      await axios.patch(`${API}/api/notifications/read-all`, {}, header());
    } catch {
      ambilJumlah();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label={t('notifBell.title')}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-all active:scale-95"
      >
        <Bell size={17} />
        {jumlah > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 flex items-center justify-center rounded-full bg-rose-600 text-white text-2xs font-black">
            {jumlah > 9 ? '9+' : jumlah}
          </span>
        )}
      </button>

      {buka && (
        <div className="absolute right-0 mt-2 w-88 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              {t('notifBell.title')}
            </span>
            {jumlah > 0 && (
              <button
                onClick={tandaiSemua}
                className="text-2xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800"
              >
                {t('notifBell.markAll')}
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto custom-scrollbar">
            {daftar === null && (
              <li className="px-4 py-6 text-center text-xs font-bold text-slate-400">
                {t('notifBell.loading')}
              </li>
            )}
            {daftar?.length === 0 && (
              <li className="px-4 py-8 text-center text-xs font-bold text-slate-400">
                {t('notifBell.empty')}
              </li>
            )}
            {daftar?.map((n) => (
              <li
                key={n._id}
                onClick={() => klik(n)}
                className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${
                  n.dibaca ? '' : 'bg-indigo-50/40'
                }`}
              >
                <div className="flex gap-2.5">
                  <span
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                      n.dibaca ? 'bg-transparent' : 'bg-indigo-600'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className={`text-xs leading-relaxed ${n.dibaca ? 'text-slate-500' : 'font-bold text-slate-700'}`}>
                      {t(`notif.${n.jenis}`, n.params || {})}
                    </p>
                    <p className="mt-0.5 text-2xs font-bold text-slate-400">
                      {waktuRelatif(n.createdAt, lang)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Web Push adalah lapis ketiga: notifikasi tingkat sistem operasi di
              laptop dan HP. Sengaja diminta lewat tombol, bukan otomatis saat
              halaman dibuka — permintaan izin yang muncul tiba-tiba hampir
              selalu ditolak, dan penolakan itu sulit dibatalkan user. */}
          {izin !== 'granted' && (
            <button
              onClick={nyalakanPush}
              disabled={izin === 'denied' || izin === 'unsupported'}
              className="w-full px-4 py-3 border-t border-slate-100 text-left text-2xs font-black uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center gap-2"
            >
              <BellRing size={13} className="shrink-0" />
              {izin === 'denied'
                ? t('notifBell.pushDenied')
                : izin === 'unsupported'
                ? t('notifBell.pushUnsupported')
                : t('notifBell.pushOn')}
            </button>
          )}
          {izin === 'granted' && (
            <p className="px-4 py-3 border-t border-slate-100 text-2xs font-bold text-emerald-600 flex items-center gap-2">
              <BellRing size={13} className="shrink-0" /> {t('notifBell.pushActive')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
