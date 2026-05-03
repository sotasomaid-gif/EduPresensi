
import React, { useState, useEffect } from 'react';
import { User, LeaveRequest } from '../types';
import { gasService } from '../services/gasService';

interface LeavePageProps {
  user: User;
  onBack: () => void;
}

const LeavePage: React.FC<LeavePageProps> = ({ user, onBack }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'cuti',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    const data = await gasService.getLeaves(user.id);
    setLeaves(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await gasService.submitLeave({
      userId: user.id,
      userName: user.name,
      ...formData,
      type: formData.type as any
    });
    setShowForm(false);
    fetchLeaves();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Pengajuan Izin</h1>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100"
        >
          {showForm ? 'Batal' : 'Buat Izin Baru'}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Jenis Izin</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="cuti">Cuti Tahunan</option>
              <option value="izin">Izin Kepentingan</option>
              <option value="sakit">Sakit</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dari Tanggal</label>
              <input 
                type="date"
                required
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sampai Tanggal</label>
              <input 
                type="date"
                required
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Alasan</label>
            <textarea 
              rows={3}
              required
              placeholder="Jelaskan alasan izin Anda..."
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-xl shadow-blue-100">Kirim Pengajuan</button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-4 rounded-2xl border text-center">
                <p className="text-2xl font-bold text-slate-800">12</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sisa Cuti</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border text-center">
                <p className="text-2xl font-bold text-slate-800">2</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Izin Terpakai</p>
             </div>
          </div>

          <h2 className="font-bold text-slate-800">Riwayat Pengajuan</h2>
          <div className="space-y-3">
            {leaves.map(l => (
              <div key={l.id} className="bg-white p-4 rounded-2xl border shadow-sm flex items-start gap-4 hover:border-blue-200 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  l.type === 'cuti' ? 'bg-blue-50 text-blue-600' : 
                  l.type === 'sakit' ? 'bg-red-50 text-red-600' : 
                  'bg-orange-50 text-orange-600'
                }`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 capitalize">{l.type}</h4>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                      l.status === 'approved' ? 'bg-green-100 text-green-700' :
                      l.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{l.startDate} s/d {l.endDate}</p>
                  <p className="text-xs text-slate-600 italic mt-2 line-clamp-1">"{l.reason}"</p>
                </div>
              </div>
            ))}
            {leaves.length === 0 && (
              <div className="bg-slate-50 border border-dashed p-12 text-center rounded-3xl">
                <p className="text-slate-400 text-sm">Belum ada riwayat pengajuan izin</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavePage;
