import React from 'react';
import { AlertTriangle, RotateCw, LayoutDashboard } from 'lucide-react';

/**
 * Jaring pengaman untuk error saat render.
 *
 * Tanpa ini, satu komponen yang melempar error membuat React membongkar
 * seluruh pohon dan yang tersisa di layar hanya halaman putih tanpa pesan —
 * persis yang terjadi pada halaman detail Supplier Payment. Pengguna tidak
 * punya petunjuk apa pun dan satu-satunya jalan keluar adalah menutup tab.
 *
 * Harus berupa class component; React belum menyediakan padanan hook untuk
 * componentDidCatch.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Tetap dicetak ke console supaya jejaknya bisa dibaca lewat Inspect.
    console.error('Render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-white font-sans flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={28} className="text-amber-500" />
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Halaman Gagal Dimuat
          </h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-3">
            Bagian lain aplikasi tetap bisa dipakai
          </p>

          <p className="text-sm text-slate-500 mt-6 leading-relaxed">
            Terjadi kesalahan saat menampilkan halaman ini. Data Anda tidak
            terpengaruh. Silakan muat ulang, atau kembali ke dashboard dan coba
            lagi dari sana.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest transition-all"
            >
              <RotateCw size={14} /> Muat Ulang
            </button>
            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest transition-all"
            >
              <LayoutDashboard size={14} /> Ke Dashboard
            </button>
          </div>

          {/* Rinciannya disembunyikan supaya layar tetap rapi saat demo, tapi
              tetap bisa dibuka kalau perlu dilaporkan. */}
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">
              Rincian teknis
            </summary>
            <pre className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap break-words">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
