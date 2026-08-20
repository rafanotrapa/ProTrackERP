/* Service worker ProTrack ERP.
 *
 * Hanya menangani Web Push. Sengaja TIDAK melakukan caching apa pun: ERP ini
 * menampilkan data keuangan yang berubah terus, dan service worker yang
 * menyajikan versi lama dari cache akan menampilkan angka basi tanpa ada yang
 * menyadari. Kalau suatu saat butuh mode offline, itu keputusan tersendiri yang
 * harus dipikirkan matang.
 *
 * Berkas ini dilayani dari root (frontend/public disalin apa adanya ke dist),
 * sehingga cakupannya seluruh situs.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { pesan: event.data ? event.data.text() : '' };
  }

  const judul = data.judul || 'ProTrack ERP';
  const opsi = {
    body: data.pesan || '',
    icon: '/favicon.png',
    badge: '/favicon.png',
    // tag membuat notifikasi baru MENGGANTIKAN yang lama alih-alih menumpuk.
    // Tanpa ini, sepuluh kejadian beruntun jadi sepuluh notifikasi terpisah di
    // layar dan orang langsung mematikan izinnya.
    tag: 'protrack-notif',
    renotify: true,
    data: { tautan: data.tautan || '/' },
  };

  event.waitUntil(self.registration.showNotification(judul, opsi));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const tautan = event.notification.data?.tautan || '/';

  // Kalau ProTrack sudah terbuka di suatu tab, fokuskan tab itu dan arahkan ke
  // dokumennya — jangan membuka tab baru setiap kali notifikasi diklik.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((daftar) => {
      for (const klien of daftar) {
        if ('focus' in klien) {
          klien.navigate(tautan).catch(() => {});
          return klien.focus();
        }
      }
      return self.clients.openWindow(tautan);
    })
  );
});
