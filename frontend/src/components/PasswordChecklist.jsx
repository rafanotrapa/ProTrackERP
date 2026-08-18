import React from 'react';
import { Check, X } from 'lucide-react';
import { cekSyarat } from '../utils/passwordPolicy';

/**
 * Checklist syarat password yang berubah realtime saat user mengetik.
 * Sengaja disembunyikan sampai kolomnya disentuh, supaya form tidak langsung
 * terlihat penuh peringatan merah sebelum user sempat mengetik apa pun.
 */
const PasswordChecklist = ({ password = '', username = '', email = '', tampil = true }) => {
  if (!tampil) return null;

  const syarat = cekSyarat(password, { username, email });

  return (
    <ul className="mt-3 space-y-1.5 rounded-xl bg-slate-50 border border-slate-200 p-3">
      {syarat.map((s) => (
        <li
          key={s.label}
          className={`flex items-center gap-2 text-[11px] font-bold ${
            s.lolos ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          {s.lolos ? (
            <Check size={13} className="shrink-0" />
          ) : (
            <X size={13} className="shrink-0" />
          )}
          <span>{s.label}</span>
        </li>
      ))}
    </ul>
  );
};

export default PasswordChecklist;
