import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from 'jspdf-autotable';
import { Truck, CalendarClock, PackageCheck, MapPin, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const DeliveryManagement = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/po', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const readyToDeliver = (res.data || []).filter((po) => po.qcStatus === 'Passed');
      setDeliveries(readyToDeliver);
    } catch (err) {
      console.error('Gagal load delivery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeliveries(); }, []);

  const handleSchedule = async (po) => {
    const totalQtyPO = (po.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const { value: formValues } = await Swal.fire({
      title: 'SET DELIVERY SCHEDULE',
      html: `
        <div class="text-left space-y-4">
          <div><label class="text-[10px] font-black uppercase text-slate-400">Tgl Pengiriman</label><input id="swal-date" type="date" class="w-full p-3 border rounded-lg outline-none font-bold"></div>
          <div><label class="text-[10px] font-black uppercase text-slate-400">Jumlah Barang</label><input id="swal-qty" type="number" min="1" value="${totalQtyPO || ''}" placeholder="Total unit yang dikirim" class="w-full p-3 border rounded-lg outline-none font-bold"></div>
          <div><label class="text-[10px] font-black uppercase text-slate-400">Kurir / Ekspedisi</label><input id="swal-courier" placeholder="Misal: Lalamove / Kurir Internal" class="w-full p-3 border rounded-lg outline-none font-bold"></div>
          <div><label class="text-[10px] font-black uppercase text-slate-400">Nomor Resi (Opsional)</label><input id="swal-resi" placeholder="Bisa diisi nanti" class="w-full p-3 border rounded-lg outline-none font-bold"></div>
          <div><label class="text-[10px] font-black uppercase text-slate-400">Foto Barang</label><input id="swal-photo" type="file" accept="image/*" class="w-full p-3 border rounded-lg outline-none text-xs"></div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      confirmButtonText: 'SAVE SCHEDULE',
      preConfirm: () => {
        const date = document.getElementById('swal-date').value;
        const qty = document.getElementById('swal-qty').value;
        const courier = document.getElementById('swal-courier').value;
        if (!date || !courier || !qty) {
          Swal.showValidationMessage('Tanggal, Jumlah Barang, dan Kurir wajib diisi!');
          return false;
        }
        return {
          deliveryDate: date,
          deliveryQty: qty,
          courierName: courier,
          trackingNumber: document.getElementById('swal-resi').value,
          photoFile: document.getElementById('swal-photo').files[0] || null
        };
      }
    });

    if (formValues) {
      const ok = await updateStatus(po._id, 'Scheduled', formValues);
      if (ok) await generateBastPDF(po, formValues);
    }
  };

  const updateStatus = async (id, newStatus, extraData = {}) => {
    try {
      const token = localStorage.getItem('token');
      let body;
      if ('photoFile' in extraData) {
        body = new FormData();
        body.append('status', newStatus);
        body.append('deliveryDate', extraData.deliveryDate);
        body.append('deliveryQty', extraData.deliveryQty);
        body.append('courierName', extraData.courierName);
        body.append('trackingNumber', extraData.trackingNumber || '');
        if (extraData.photoFile) body.append('deliveryPhoto', extraData.photoFile);
      } else {
        body = { status: newStatus, ...extraData };
      }
      await axios.put(`http://localhost:5000/api/po/${id}/delivery`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('UPDATED!', `Status pengiriman diubah ke ${newStatus}.`, 'success');
      fetchDeliveries();
      return true;
    } catch (err) {
      Swal.fire('ERROR', 'Gagal update status logistik', 'error');
      return false;
    }
  };

  const generateBastPDF = async (po, values) => {
    try {
      const doc = new jsPDF();

      try {
        doc.addImage("/header-batavia.png", 'PNG', 0, 0, 210, 40);
      } catch {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('PT. BATAVIA JAYA KREASI', 105, 13, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("BERITA ACARA SERAH TERIMA", 105, 55, { align: 'center' });
      doc.setFontSize(11);
      doc.text("(BAST)", 105, 62, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text("Project", 14, 74);
      doc.text(`: ${po.projectId || '-'}`, 45, 74);
      doc.text("No. PO", 14, 80);
      doc.text(`: ${po.poNumber || '-'}`, 45, 80);
      doc.text("Alamat Kirim", 14, 86);
      doc.text(`: ${(po.shippingAddress || '-').substring(0, 60)}`, 45, 86);

      doc.text("Tgl Pengiriman", 120, 74);
      doc.text(`: ${new Date(values.deliveryDate).toLocaleDateString('en-GB')}`, 155, 74);
      doc.text("Ekspedisi", 120, 80);
      doc.text(`: ${values.courierName}`, 155, 80);
      doc.text("No. Resi", 120, 86);
      doc.text(`: ${values.trackingNumber || '-'}`, 155, 86);

      const tableRows = (po.items || []).map(item => [
        item.quantity || 0,
        (item.itemName || '').toUpperCase(),
        (item.unit || '').toUpperCase(),
      ]);

      autoTable(doc, {
        startY: 95,
        head: [['Qty', 'Description', 'Unit']],
        body: tableRows,
        theme: 'plain',
        margin: { left: 15 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        bodyStyles: { halign: 'center' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          1: { halign: 'left', cellWidth: 130 },
          2: { halign: 'center', cellWidth: 30 },
        },
        didDrawCell: (data) => {
          if (data.section === 'body') {
            doc.setDrawColor(230);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });

      const finalY = doc.lastAutoTable.finalY + 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("Jumlah Barang Dikirim", 14, finalY);
      doc.text(`: ${values.deliveryQty} Unit`, 60, finalY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        "Dengan ini menyatakan bahwa barang tersebut di atas telah diserahkan dan diterima dalam keadaan baik dan lengkap.",
        14, finalY + 10, { maxWidth: 180 }
      );

      const signY = finalY + 30;
      doc.setFont('helvetica', 'bold');
      doc.text("Pihak Pertama (Pengirim)", 40, signY, { align: 'center' });
      doc.text("Pihak Kedua (Penerima)", 165, signY, { align: 'center' });

      try {
        doc.addImage("/stample-batavia.png", 'PNG', 15, signY + 3, 45, 45);
      } catch { }

      doc.setFont('helvetica', 'normal');
      doc.text("(________________)", 40, signY + 45, { align: 'center' });
      doc.text("(________________)", 165, signY + 45, { align: 'center' });

      if (values.photoFile) {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(values.photoFile);
        });
        if (dataUrl) {
          try {
            const props = doc.getImageProperties(dataUrl);
            const ratio = Math.min(80 / props.width, 70 / props.height);
            const w = props.width * ratio;
            const h = props.height * ratio;
            let photoY = signY + 58;
            if (photoY + h + 10 > 290) { doc.addPage(); photoY = 20; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text("Foto Bukti Pengiriman", 14, photoY);
            const fmt = (values.photoFile.type || '').includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(dataUrl, fmt, 14, photoY + 4, w, h);
          } catch (e) {
            console.error('BAST photo embed failed:', e);
          }
        }
      }

      doc.save(`BAST-${po.poNumber || po._id}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      Swal.fire('Error', 'Gagal generate PDF BAST', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filtered = deliveries.filter((po) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (po.projectId       || '').toLowerCase().includes(term) ||
      (po.shippingAddress  || '').toLowerCase().includes(term) ||
      (po.courierName      || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' ? true : (po.deliveryStatus || 'Pending') === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:        deliveries.length,
    pending:    deliveries.filter((po) => (po.deliveryStatus || 'Pending') === 'Pending').length,
    scheduled:  deliveries.filter((po) => po.deliveryStatus === 'Scheduled').length,
    inTransit:  deliveries.filter((po) => po.deliveryStatus === 'In Transit').length,
    delivered:  deliveries.filter((po) => po.deliveryStatus === 'Delivered').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mx-auto mb-4" />
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
          <span className="text-slate-400 group-hover:text-cyan-500 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Delivery <span className="text-cyan-500">Management</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            Logistics • Client Shipment
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',         label: `All (${counts.all})`,               cls: 'bg-slate-900 text-white' },
              { key: 'Pending',     label: `Pending (${counts.pending})`,       cls: 'bg-slate-500 text-white' },
              { key: 'Scheduled',   label: `Scheduled (${counts.scheduled})`,   cls: 'bg-blue-600 text-white' },
              { key: 'In Transit',  label: `In Transit (${counts.inTransit})`,  cls: 'bg-amber-500 text-white' },
              { key: 'Delivered',   label: `Delivered (${counts.delivered})`,   cls: 'bg-emerald-600 text-white' },
            ].map(({ key, label, cls }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === key ? cls : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Cari Project, Alamat, Kurir..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-cyan-500"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Truck size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">No items ready for delivery</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">Project / Target</th>
                  <th className="px-6 py-4">Schedule & Courier</th>
                  <th className="px-6 py-4 text-center">Delivery Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="bg-cyan-100 text-cyan-600 p-2.5 rounded-xl">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">Proj: {po.projectId}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1 max-w-[250px]">{po.shippingAddress}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {po.deliveryStatus === 'Pending' || !po.deliveryStatus ? (
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Not Scheduled Yet</span>
                      ) : (
                        <div>
                          <p className="text-xs font-black text-slate-700">{formatDate(po.deliveryDate)}</p>
                          <p className="text-[9px] font-bold text-cyan-600 uppercase tracking-widest mt-0.5">
                            {po.courierName} {po.trackingNumber ? `(${po.trackingNumber})` : ''}
                          </p>
                          {po.deliveryPhoto && (
                            <a
                              href={`http://localhost:5000/api/files/${po.deliveryPhoto}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-1 text-[9px] font-black text-indigo-600 hover:underline uppercase tracking-widest"
                            >
                              📷 Lihat Foto
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {(po.deliveryStatus === 'Pending' || !po.deliveryStatus) && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">PENDING</span>
                      )}
                      {po.deliveryStatus === 'Scheduled' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">SCHEDULED</span>
                      )}
                      {po.deliveryStatus === 'In Transit' && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">IN TRANSIT</span>
                      )}
                      {po.deliveryStatus === 'Delivered' && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">DELIVERED</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {(po.deliveryStatus === 'Pending' || !po.deliveryStatus) && (
                          <button
                            onClick={() => handleSchedule(po)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-cyan-600 transition-all"
                          >
                            <CalendarClock size={13} /> SCHEDULE
                          </button>
                        )}
                        {po.deliveryStatus === 'Scheduled' && (
                          <button
                            onClick={() => updateStatus(po._id, 'In Transit')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all"
                          >
                            <Truck size={13} /> MARK SENT
                          </button>
                        )}
                        {po.deliveryStatus === 'In Transit' && (
                          <button
                            onClick={() => updateStatus(po._id, 'Delivered')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm"
                          >
                            <PackageCheck size={13} /> ARRIVED
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DeliveryManagement;