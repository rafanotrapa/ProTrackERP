import axios from 'axios';

const API = 'http://localhost:5000';

/* Pendaftaran Web Push dari sisi browser.
 *
 * Alurnya: daftarkan service worker -> minta izin ke user -> ambil kunci publik
 * VAPID dari server -> berlangganan ke layanan push browser -> kirim hasil
 * langganannya ke server supaya bisa dituju nanti.
 *
 * Semua fungsi di sini mengembalikan status, tidak melempar. Push adalah lapis
 * ketiga yang boleh gagal — lonceng in-app tetap jalan tanpanya.
 */

export const didukung = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const header = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

/* Kunci VAPID dikirim server sebagai base64url, tapi PushManager menuntut
 * Uint8Array. Konversi ini wajib — tanpa itu subscribe gagal dengan pesan yang
 * sama sekali tidak menjelaskan sebabnya. */
const keUint8 = (base64url) => {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const mentah = window.atob(base64);
  return Uint8Array.from([...mentah].map((c) => c.charCodeAt(0)));
};

/** Status izin sekarang: 'default' | 'granted' | 'denied' | 'unsupported'. */
export const statusIzin = () => (didukung() ? Notification.permission : 'unsupported');

/**
 * Aktifkan notifikasi perangkat ini.
 * @returns {Promise<{ok: boolean, alasan?: string}>}
 */
export async function aktifkanPush() {
  if (!didukung()) return { ok: false, alasan: 'unsupported' };

  try {
    const izin = await Notification.requestPermission();
    if (izin !== 'granted') return { ok: false, alasan: izin };

    const { data } = await axios.get(`${API}/api/notifications/vapid-key`, header());
    if (!data?.kunci) return { ok: false, alasan: 'server-belum-dikonfigurasi' };

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Langganan lama dipakai ulang kalau ada; browser bisa sudah punya satu
    // dari sesi sebelumnya dan mendaftar dua kali menghasilkan endpoint ganda.
    const langganan =
      (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keUint8(data.kunci),
      }));

    await axios.post(`${API}/api/notifications/push/subscribe`, langganan.toJSON(), header());
    return { ok: true };
  } catch (err) {
    console.error('Gagal mengaktifkan push:', err.message);
    return { ok: false, alasan: 'gagal' };
  }
}

/** Matikan notifikasi perangkat ini. */
export async function matikanPush() {
  if (!didukung()) return { ok: false };
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const langganan = await reg?.pushManager.getSubscription();
    if (langganan) {
      await axios.post(
        `${API}/api/notifications/push/unsubscribe`,
        { endpoint: langganan.endpoint },
        header()
      );
      await langganan.unsubscribe();
    }
    return { ok: true };
  } catch (err) {
    console.error('Gagal mematikan push:', err.message);
    return { ok: false };
  }
}
