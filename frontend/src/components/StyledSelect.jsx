import React, { useState, useRef, useEffect } from 'react';

const BASE_TRIGGER =
  'w-full p-3.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 flex justify-between items-center cursor-pointer hover:border-indigo-600 transition-all shadow-sm';

const StyledSelect = ({
  options = [],
  value,
  onChange,
  name,
  placeholder = '-- Select --',
  disabled = false,
  searchable,
  triggerClassName,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const showSearch = searchable !== undefined ? searchable : options.length > 6;
  const selected = options.find((o) => String(o.value) === String(value));
  // Baris kedua (sub) ikut dicari, supaya pengguna bisa mengetik nama project
  // walaupun yang tampil sebagai judul adalah nomor dokumennya.
  const teksCari = (o) => `${o.label ?? ''} ${o.sub ?? ''}`.toLowerCase();
  const filtered = search
    ? options.filter((o) => teksCari(o).includes(search.toLowerCase().trim()))
    : options;

  const pick = (opt) => {
    if (opt.disabled) return;
    onChange?.({ target: { name, value: opt.value } });
    setOpen(false);
    setSearch('');
  };

  if (disabled) {
    return (
      <div className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-400 shadow-inner cursor-not-allowed flex items-center">
        <span className="truncate">
          {selected?.label || placeholder}
          {selected?.sub && <span className="ml-2 font-semibold text-slate-400">{selected.sub}</span>}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName || BASE_TRIGGER}
      >
        <span className="truncate">
          {selected?.label || placeholder}
          {selected?.sub && <span className="ml-2 font-semibold text-slate-500">{selected.sub}</span>}
        </span>
        <span className={`text-[10px] ml-2 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          {showSearch && (
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-3 text-xs border-b outline-none font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          )}
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-[12px] font-black text-slate-300 uppercase">No options</li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={String(opt.value)}
                  onClick={() => pick(opt)}
                  className={`group px-4 py-3 text-[12px] font-black uppercase transition-all ${
                    opt.disabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : String(opt.value) === String(value)
                      ? 'bg-indigo-50 text-indigo-600 cursor-pointer'
                      : 'text-slate-600 hover:bg-indigo-600 hover:text-white cursor-pointer'
                  }`}
                >
                  {/* Dipotong dengan elipsis hanya saat ada baris kedua. Tanpa sub,
                      teksnya dibiarkan apa adanya supaya select di halaman lain
                      tampil persis seperti sebelumnya. */}
                  {opt.sub ? <span className="block truncate">{opt.label}</span> : opt.label}
                  {opt.sub && (
                    <span
                      className={`mt-0.5 block truncate text-[11px] font-bold normal-case tracking-normal ${
                        opt.disabled
                          ? 'text-slate-300'
                          : String(opt.value) === String(value)
                          ? 'text-indigo-400'
                          : 'text-slate-400 group-hover:text-indigo-100'
                      }`}
                    >
                      {opt.sub}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StyledSelect;
