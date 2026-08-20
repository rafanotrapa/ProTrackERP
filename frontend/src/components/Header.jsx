import React from 'react';
import { useNavigate } from 'react-router-dom';
import protrackMark from '../assets/protrack-mark.png';
import { useLang } from '../i18n';
import { BAHASA } from '../i18n/kamus';
import NotificationBell from './NotificationBell';

const Header = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLang();

  const user = JSON.parse(localStorage.getItem('user')) || { username: 'User', role: 'Guest' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="flex sticky top-0 z-50 justify-between items-center p-4 bg-slate-900 border-b border-slate-800 shadow-xl">
      <div
        className="flex items-center gap-3 cursor-pointer transition-all active:scale-95"
        onClick={() => navigate('/dashboard')}
      >
        <img src={protrackMark} alt="ProTrack ERP" className="object-contain w-10 h-10" />
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
            ProTrack <span className="text-xs not-italic tracking-widest text-indigo-400 ml-1">ERP</span>
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 italic">{t('header.tagline')}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Pemilih bahasa dulu hanya ada di hero Dashboard, sehingga tidak
            terjangkau dari 59 halaman lain. Di Header ia ikut ke mana-mana.
            Warnanya versi gelap karena latar navbar ini slate-900. */}
        <div className="flex items-center bg-slate-800 rounded-full p-1 border border-slate-700">
          {BAHASA.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                lang === l ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {l === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
            </button>
          ))}
        </div>

        {/* Sebelum blok identitas, bukan sesudahnya: blok itu ber-hidden sm:block
            sehingga lenyap di layar sempit, dan lonceng tidak boleh ikut lenyap. */}
        <NotificationBell />

        <div className="hidden pr-6 text-right border-r sm:block border-slate-800">
          <p className="text-sm font-black uppercase leading-none text-white tracking-wide">
            {user.username || user.name || 'User'}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-indigo-400 italic">
            {t('header.access', { role: user.role })}
          </p>
        </div>

        <div className="flex justify-center items-center w-10 h-10 font-black text-white bg-slate-800 rounded-full border border-slate-700 shadow-inner">
          {(user.username || user.name || 'U').charAt(0).toUpperCase()}
        </div>

        <button
          onClick={handleLogout}
          className="px-6 py-2.5 bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all hover:bg-red-600 active:scale-95"
        >
          {t('header.signOut')}
        </button>
      </div>
    </nav>
  );
};

export default Header;