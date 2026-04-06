import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Material', // Sesuai Model
    unit: 'Pcs',
    specifications: ''    // Sesuai Model
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Kirim data ke backend
      await axios.post('http://localhost:5000/api/item', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Master Item Berhasil Disimpan!");
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Gagal simpan item bre!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-12">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl">
        <h1 className="text-2xl font-black uppercase mb-6 text-slate-800">Add Master Item</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Item Name</label>
            <input name="itemName" required onChange={handleChange} className="w-full p-3 border rounded-xl outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
              <select name="category" onChange={handleChange} className="w-full p-3 border rounded-xl">
                <option value="Material">Material</option>
                <option value="Jasa">Jasa</option>
                <option value="Tools">Tools</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Unit</label>
              <input name="unit" onChange={handleChange} className="w-full p-3 border rounded-xl" placeholder="Pcs/Lot" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Specifications</label>
            <textarea name="specifications" onChange={handleChange} className="w-full p-3 border rounded-xl h-24" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 p-4 rounded-2xl text-white font-black uppercase">
            Save Item
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItem;