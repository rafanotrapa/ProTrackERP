import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Boxes, Search, Pencil, PackageCheck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Inventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data || []);
    } catch (err) {
      console.error('Gagal load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleUpdateUsage = async (row) => {
    const { value } = await Swal.fire({
      title: 'Update Terpakai',
      html: `<p style="font-size:13px;color:#475569;margin-bottom:8px;"><strong>${row.itemName}</strong></p>
             <p style="font-size:11px;color:#94a3b8;">Jumlah awal: <strong>${row.initialQty}</strong> ${row.unit}</p>`,
      input: 'number',
      inputValue: row.usedQty,
      inputAttributes: { min: 0, max: row.initialQty, step: 1 },
      inputLabel: `Jumlah terpakai (maks ${row.initialQty})`,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#4f46e5',
      inputValidator: (val) => {
        const n = Number(val);
        if (val === '' || isNaN(n) || n < 0) return 'Masukkan angka valid (>= 0)';
        if (n > row.initialQty) return `Tidak boleh melebihi jumlah awal (${row.initialQty})`;
        return null;
      },
    });

    if (value === undefined) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch('http://localhost:5000/api/inventory/use',
        { itemName: row.itemName, usedQty: Number(value) },
        { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ icon: 'success', title: 'Tersimpan!', timer: 1200, showConfirmButton: false });
      fetchInventory();
    } catch (err) {
      console.error('Gagal update usage:', err);
      Swal.fire('Error', 'Gagal update jumlah terpakai', 'error');
    }
  };

  const filtered = items.filter((it) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (it.itemName || '').toLowerCase().includes(q) ||
      (it.category || '').toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ? true :
      filter === 'available' ? it.remaining > 0 :
      it.remaining <= 0;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: items.length,
    available: items.filter((i) => i.remaining > 0).length,
    depleted: items.filter((i) => i.remaining <= 0).length,
  };

  const barColor = (pct) => (pct <= 10 ? 'bg-rose-500' : pct <= 40 ? 'bg-amber-500' : 'bg-emerald-500');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Inventory <span className="text-indigo-600">Storage</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            Stok Barang dari Purchase Order
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',       label: `All (${counts.all})`,             cls: 'bg-slate-900 text-white' },
              { key: 'available', label: `Tersedia (${counts.available})`,  cls: 'bg-emerald-600 text-white' },
              { key: 'depleted',  label: `Habis (${counts.depleted})`,      cls: 'bg-rose-600 text-white' },
            ].map(({ key, label, cls }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  filter === key ? cls : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Cari nama item / jenis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Boxes size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">
              {items.length === 0 ? 'Belum ada barang — buat Purchase Order dulu' : 'No items found'}
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Jenis</th>
                  <th className="px-6 py-4 text-center">Qty Awal</th>
                  <th className="px-6 py-4 text-center">Terpakai</th>
                  <th className="px-6 py-4 text-center">Sisa</th>
                  <th className="px-6 py-4">Status Stok</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((it, idx) => {
                  const pct = it.initialQty > 0 ? Math.round((it.remaining / it.initialQty) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-800 text-sm uppercase">{it.itemName}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2 py-1 rounded-full text-[8px] font-black uppercase bg-sky-100 text-sky-600">
                          {it.category}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center font-black text-slate-700">{it.initialQty} <span className="text-[8px] text-slate-400">{it.unit}</span></td>
                      <td className="px-6 py-5 text-center font-black text-amber-600">{it.usedQty}</td>
                      <td className="px-6 py-5 text-center font-black text-emerald-600">{it.remaining}</td>
                      <td className="px-6 py-5">
                        <div className="w-32">
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${barColor(pct)}`} style={{ width: `${Math.max(0, Math.min(pct, 100))}%` }} />
                          </div>
                          <p className="text-[8px] font-black text-slate-400 mt-1">{pct}% tersisa</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => handleUpdateUsage(it)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                        >
                          <Pencil size={11} /> Terpakai
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Inventory;
