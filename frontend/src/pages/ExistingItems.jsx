import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Boxes, Tag, DollarSign } from 'lucide-react';

const ExistingItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/item', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setItems(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <button onClick={() => navigate('/vendor')} className="text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase flex items-center gap-2 mb-2">
              <ArrowLeft size={14} /> Back to Menu
            </button>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
              <Boxes className="text-indigo-600" /> Item Catalog
            </h1>
          </div>
          <button onClick={() => navigate('/add-item')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg transition-all">
            + New Item
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center font-bold text-slate-300 animate-pulse uppercase">Syncing Items...</div>
          ) : items.length === 0 ? (
            <div className="p-20 text-center text-slate-400 font-bold">Katalog barang masih kosong bre.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Info</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Price</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-5">
                        <p className="text-[10px] font-mono font-bold text-indigo-600">{item.itemId}</p>
                        <p className="font-bold text-slate-800">{item.itemName}</p>
                      </td>
                      <td className="p-5">
                        <p className="text-sm font-black text-slate-700">Rp {item.basePrice?.toLocaleString()}</p>
                      </td>
                      <td className="p-5 text-sm font-medium text-slate-500">{item.unit}</td>
                      <td className="p-5 text-center">
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">In Stock</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExistingItems;