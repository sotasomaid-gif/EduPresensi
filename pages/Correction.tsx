
import React, { useState, useEffect } from 'react';
import { User, CorrectionRequest, AttendanceRecord } from '../types';
import { gasService } from '../services/gasService';

interface CorrectionProps {
  user: User;
  onBack: () => void;
}

const CorrectionPage: React.FC<CorrectionProps> = ({ user, onBack }) => {
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    requestedTime: '',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = await gasService.getCorrections(user.id);
    setCorrections(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await gasService.submitCorrection({
      userId: user.id,
      ...formData
    });
    setShowForm(false);
    fetchData();
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
          <h1 className="text-xl font-bold">Koreksi Absensi</h1>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-100"
        >
          {showForm ? 'Tutup' : 'Ajukan Koreksi'}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 mb-2">
            <p className="text-xs text-orange-700 font-medium">Fitur ini digunakan jika Anda lupa clock-in/out atau terjadi kendala teknis saat absensi.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tanggal Absensi</label>
            <input 
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Jam yang Seharusnya</label>
            <input 
              type="time"
              required
              value={formData.requestedTime}
              onChange={e => setFormData({...formData, requestedTime: e.target.value})}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Alasan Koreksi</label>
            <textarea 
              rows={3}
              required
              placeholder="Jelaskan kendala yang terjadi..."
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
            />
          </div>
          <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold shadow-xl shadow-orange-100">Kirim Pengajuan Koreksi</button>
        </form>
      ) : (
        <div className="space-y-4">
          <h2 className="font-bold text-slate-800">Status Pengajuan</h2>
          {corrections.map(c => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800">Koreksi Absen</h4>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    c.status === 'approved' ? 'bg-green-100 text-green-700' :
                    c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Tanggal: {c.date} • Jam: {c.requestedTime}</p>
                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg italic">"{c.reason}"</p>
              </div>
            </div>
          ))}
          {corrections.length === 0 && (
            <div className="bg-slate-50 border border-dashed p-12 text-center rounded-3xl">
              <p className="text-slate-400 text-sm">Belum ada riwayat koreksi absensi</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CorrectionPage;
