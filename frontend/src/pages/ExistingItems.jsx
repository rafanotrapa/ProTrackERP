import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Boxes, Search, Package, Pencil, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ExistingItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // FUNGSI TARIK DATA (Dipake juga buat refresh setelah delete)
  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/item', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data);
    } catch (err) {
      console.error("Gagal load item list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // LOGIC DELETE DENGAN PROTEKSI 404 (ANTI-GAGAL)
  const handleDelete = (id, name) => {
    if (!id) {
      Swal.fire('ERROR', 'ID Item tidak ditemukan (undefined)!', 'error');
      return;
    }

    Swal.fire({
      title: 'ARE YOU SURE?',
      text: `Item "${name}" will be permanently removed from catalog.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#0f172a',  
      confirmButtonText: 'YES, DELETE IT',
      cancelButtonText: 'CANCEL',
      customClass: {
        popup: 'rounded-[2rem] border-2 border-slate-100 shadow-2xl',
        confirmButton: 'rounded-xl font-black text-[10px] tracking-widest px-6 py-3',
        cancelButton: 'rounded-xl font-black text-[10px] tracking-widest px-6 py-3'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          
          // Pastikan URL API sesuai backend (tanpa 's')
          await axios.delete(`http://localhost:5000/api/item/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          Swal.fire({
            title: 'DELETED!',
            text: 'Item removed successfully.',
            icon: 'success',
            confirmButtonColor: '#0f172a'
          });
          
          fetchItems(); // Refresh list otomatis
        } catch (err) {
          console.error("Delete Error:", err.response);
          Swal.fire({
            icon: 'error',
            title: 'FAILED',
            text: err.response?.data?.msg || 'Gagal hapus! Cek koneksi backend.',
            confirmButtonColor: '#0f172a'
          });
        }
      }
    });
  };

  // LOGIC UPDATE (Placeholder)
  const handleUpdate = (id) => {
    Swal.fire({
      title: 'UPDATE MODULE',
      text: 'Fitur update sedang dalam tahap sinkronisasi data.',
      icon: 'info',
      confirmButtonColor: '#0f172a'
    });
  };

  // SEARCH FILTERING
  const filteredItems = useMemo(() => {
    return items.filter((item) => 
      (item.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.itemId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, items]);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-slate-900">
      <Header />

      {/* SUB-HEADER (FULL WIDTH) */}
      <div className="w-full border-b border-slate-100 px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/vendor')} className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group">
            <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Item <span className="text-indigo-600">Catalog</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">Procurement Module • Master Data</p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
             <input 
               type="text" 
               placeholder="Search Item..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full p-3 pl-10 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600 transition-all shadow-sm italic placeholder:text-slate-300"
             />
             <span className="absolute left-4 top-3 text-slate-300"><Search size={16} /></span>
          </div>
          <button onClick={() => navigate('/add-item')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-slate-200 transition-all active:scale-95 whitespace-nowrap">+ New Item</button>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16 md:pt-4">
        <div className="max-w-none w-full">
          <div className="flex justify-between items-end px-2 mb-4">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Catalog Records</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase leading-none">{filteredItems.length} Items Listed</p>
          </div>

          <div className="bg-white rounded-4xl border-2 border-slate-100 shadow-2xl shadow-slate-100/50 overflow-hidden">
            {loading ? (
              <div className="p-32 text-center"><div className="inline-block w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : filteredItems.length === 0 ? (
              <div className="p-32 text-center">
                <p className="text-2xl font-black italic uppercase tracking-tighter text-slate-300">Catalog is Empty.</p>
                <button onClick={() => navigate('/add-item')} className="mt-4 text-indigo-600 font-black uppercase text-xs hover:underline italic">Create First Master Item →</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white border-b border-slate-800">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">Item ID / Name</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-center">Category</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-center">Unit</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">Specifications</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-right text-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="bg-slate-100 p-3 rounded-xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Package size={20} /></div>
                            <div>
                              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic leading-none mb-1">{item.itemId || 'N/A'}</p>
                              <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors leading-none">{item.itemName}</h3>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                           <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{item.category}</span>
                        </td>
                        <td className="p-6 text-center">
                           <p className="text-xs font-black text-slate-600 uppercase italic leading-none">{item.unit}</p>
                        </td>
                        <td className="p-6">
                           <p className="text-[11px] font-medium text-slate-400 italic line-clamp-1 max-w-50">{item.specifications || '- No Details -'}</p>
                        </td>
                        <td className="p-6">
                          <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => handleUpdate(item._id)}
                               className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm active:scale-90"
                             >
                                <Pencil size={14} />
                             </button>
                             <button 
                               onClick={() => handleDelete(item._id, item.itemName)} // <-- Pake _id Fa!
                               className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-500 transition-all shadow-sm active:scale-90"
                             >
                                <Trash2 size={14} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExistingItems;