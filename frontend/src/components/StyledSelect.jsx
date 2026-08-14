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
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
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
        <span className="truncate">{selected?.label || placeholder}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName || BASE_TRIGGER}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
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
                  className={`px-4 py-3 text-[12px] font-black uppercase transition-all ${
                    opt.disabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : String(opt.value) === String(value)
                      ? 'bg-indigo-50 text-indigo-600 cursor-pointer'
                      : 'text-slate-600 hover:bg-indigo-600 hover:text-white cursor-pointer'
                  }`}
                >
                  {opt.label}
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
