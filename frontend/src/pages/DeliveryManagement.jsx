import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Truck, CalendarClock, PackageCheck, MapPin } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const DeliveryManagement = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/po', { headers: { Authorization: `Bearer ${token}` } });
      
      // Hanya tampilkan PO yang barangnya udah LULUS QC (siap dikirim ke klien)
      const readyToDeliver = (res.data || []).filter(po => po.qcStatus === 'Passed');
      setDeliveries(readyToDeliver);
    } catch (err) {
      console.error("Gagal load delivery:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeliveries(); }, []);

  // FASE 1: CREATE DELIVERY TIME
  const handleSchedule = async (id) => {
    const { value: formValues } = await Swal.fire({
      title: 'SET DELIVERY SCHEDULE',
      html: `
        <div class="text-left space-y-4">
          <div><label class="text-[10px] font-black uppercase text-slate-400">Tgl Pengiriman</label><input id="swal-date" type="date" class="w-full p-3 border rounded-lg outline-none font-bold"></div>
          <div><label class="text-[10px] font-black uppercase text-slate-400">Kurir / Ekspedisi</label><input id="swal-courier" placeholder="Misal: Lalamove / Kurir Internal" class="w-full p-3 border rounded-lg outline-none font-bold"></div>
          <div><label class="text-[10px] font-black uppercase text-slate-400">Nomor Resi (Opsional)</label><input id="swal-resi" placeholder="Bisa diisi nanti" class="w-full p-3 border rounded-lg outline-none font-bold"></div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      confirmButtonText: 'SAVE SCHEDULE',
      preConfirm: () => {
        const date = document.getElementById('swal-date').value;
        const courier = document.getElementById('swal-courier').value;
        if (!date || !courier) {
          Swal.showValidationMessage('Tanggal dan Kurir wajib diisi!');
          return false;
        }
        return { deliveryDate: date, courierName: courier, trackingNumber: document.getElementById('swal-resi').value };
      }
    });

    if (formValues) {
      updateStatus(id, 'Scheduled', formValues);
    }
  };

  // MAIN UPDATE FUNCTION
  const updateStatus = async (id, newStatus, extraData = {}) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/po/${id}/delivery`, { status: newStatus, ...extraData }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('UPDATED!', `Status pengiriman diubah ke ${newStatus}.`, 'success');
      fetchDeliveries();
    } catch (err) {
      Swal.fire('ERROR', 'Gagal update status logistik', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50 text-slate-900">
      <Header />
      <div className="flex items-center gap-6 px-8 py-8 w-full border-b bg-slate-50/30 border-slate-200">
        <button onClick={() => navigate('/dashboard')} className="flex justify-center items-center w-12 h-12 bg-white rounded-2xl border transition-all active:scale-90 shadow-sm group border-slate-200 hover:bg-slate-50">
          <span className="text-xl font-black italic transition-colors text-slate-400 group-hover:text-cyan-500">←</span>
        </button>
        <div>
            <h1 className="text-3xl font-black italic leading-none tracking-tighter uppercase text-slate-900">
            Delivery <span className="text-cyan-500">Management</span>
            </h1>
          <p className="mt-1 text-[10px] font-black italic leading-none tracking-[0.2em] uppercase text-slate-400">Logistics • Client Shipment</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16">
        <div className="mx-auto max-w-7xl bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-end">
             <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Ready for Dispatch</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">Project / Target</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">Schedule & Courier</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-center">Delivery Status</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-right">Logistics Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {deliveries.length === 0 ? (
                   <tr><td colSpan="4" className="p-12 text-center text-slate-400 font-bold italic">No items ready for delivery.</td></tr>
                ) : deliveries.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                         <div className="bg-cyan-100 text-cyan-600 p-3 rounded-xl"><MapPin size={20}/></div>
                         <div>
                            <p className="text-sm font-black text-slate-800 uppercase italic">Proj: {po.projectId}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 line-clamp-1 max-w-[250px]">{po.shippingAddress}</p>
                         </div>
                      </div>
                    </td>
                    <td className="p-6">
                       {po.deliveryStatus === 'Pending' ? (
                          <span className="text-xs font-black text-slate-300 italic uppercase">Not Scheduled Yet</span>
                       ) : (
                          <div>
                            <p className="text-xs font-black text-slate-700 uppercase">{formatDate(po.deliveryDate)}</p>
                            <p className="text-[9px] font-bold text-cyan-600 uppercase tracking-widest mt-0.5">{po.courierName} {po.trackingNumber ? `(${po.trackingNumber})` : ''}</p>
                          </div>
                       )}
                    </td>
                    
                    <td className="p-6 text-center">
                       {po.deliveryStatus === 'Pending' && <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">PENDING</span>}
                       {po.deliveryStatus === 'Scheduled' && <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">SCHEDULED</span>}
                       {po.deliveryStatus === 'In Transit' && <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">IN TRANSIT</span>}
                       {po.deliveryStatus === 'Delivered' && <span className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest">DELIVERED</span>}
                    </td>

                    <td className="p-6">
                      <div className="flex justify-end gap-2">
                        {po.deliveryStatus === 'Pending' && (
                          <button onClick={() => handleSchedule(po._id)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-cyan-600 transition-all">
                            <CalendarClock size={14}/> SCHEDULE
                          </button>
                        )}
                        {po.deliveryStatus === 'Scheduled' && (
                          <button onClick={() => updateStatus(po._id, 'In Transit')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all">
                            <Truck size={14}/> MARK AS SENT
                          </button>
                        )}
                        {po.deliveryStatus === 'In Transit' && (
                          <button onClick={() => updateStatus(po._id, 'Delivered')} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-200">
                            <PackageCheck size={14}/> ARRIVED
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DeliveryManagement;