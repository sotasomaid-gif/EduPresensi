
import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord, LeaveRequest, Announcement, CorrectionRequest, WorkSchedule } from '../types';
import { gasService } from '../services/gasService';

const AdminDashboard: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
  const [tab, setTab] = useState<'users' | 'attendance' | 'schedules' | 'requests' | 'announcements' | 'settings' | 'reports'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<'pdf' | 'excel' | null>(null);
  
  // Schedule Form State
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState<WorkSchedule>({
    level: 'SMA',
    className: '',
    subject: '',
    day: 'Senin',
    timeStart: '07:00',
    timeEnd: '08:30',
    teacher: ''
  });

  // Filter States
  const [filters, setFilters] = useState({
    startDate: '', endDate: '', filterUserId: '', filterName: '', filterStatus: ''
  });

  // Settings state
  const [settings, setSettings] = useState({
    school_name: '', dept_name: '', school_address: '', city_location: '',
    principal_name: '', principal_nip: '', teacher_name: '', teacher_nip: '',
    office_lat: 0, office_lng: 0, attendance_radius: 100,
    logo_left: '', logo_right: ''
  });

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [u, a, l, c, ann, sch, s] = await Promise.all([
        gasService.getAllUsers(),
        gasService.getAttendance(),
        gasService.getLeaves(),
        gasService.getCorrections(),
        gasService.getAnnouncements(),
        gasService.getSchedules(),
        gasService.getSettings()
      ]);
      setUsers(u); setAttendance(a); setLeaves(l); setCorrections(c); setAnnouncements(ann); setSchedules(sch);
      if (s && !s.error) setSettings(prev => ({ ...prev, ...s }));
    } finally { setLoading(false); }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(format);
    try {
      const result = format === 'pdf' 
        ? await gasService.downloadAdminAttendancePDF(filters)
        : await gasService.downloadAdminAttendanceExcel(filters);
      
      if (result && result.base64) {
        const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const linkSource = `data:${mime};base64,${result.base64}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = result.fileName || `Rekap_Presensi.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        downloadLink.click();
      } else {
        alert("Gagal mengunduh file. Cek koneksi server.");
      }
    } finally {
      setIsExporting(null);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'logo_left' | 'logo_right') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await gasService.updateSettings(settings);
      alert("Pengaturan Berhasil Disimpan!");
      fetchAllData();
    } finally { setLoading(false); }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await gasService.bulkImportSchedules([newSchedule]);
      alert("Jadwal Berhasil Ditambahkan!");
      setShowScheduleForm(false);
      fetchAllData();
    } finally { setLoading(false); }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Hapus jadwal ini?")) return;
    setLoading(true);
    try {
      await gasService.deleteSchedule(id);
      fetchAllData();
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-32 pt-6 page-transition">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 gradient-brand rounded-3xl flex items-center justify-center text-white shadow-2xl">
             <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
           </div>
           <div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Admin Control Hub</h1>
             <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[4px]">{settings.school_name || "Academic Portal"}</p>
           </div>
        </div>
      </div>

      <div className="flex border-b border-slate-100 mb-8 overflow-x-auto no-scrollbar gap-10">
        {[
          { id: 'users', label: 'Master Siswa' },
          { id: 'attendance', label: 'Log Absensi' },
          { id: 'schedules', label: 'Atur Jadwal' },
          { id: 'reports', label: 'Report Center' },
          { id: 'requests', label: 'Validasi Izin' },
          { id: 'announcements', label: 'Warta' },
          { id: 'settings', label: 'Identitas & Aturan' }
        ].map(item => (
          <button key={item.id} onClick={() => setTab(item.id as any)} className={`pb-4 text-[10px] font-black border-b-4 transition-all uppercase tracking-widest whitespace-nowrap ${tab === item.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-300'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-40 animate-pulse text-slate-400 font-black uppercase text-[10px] tracking-widest">Sinkronisasi Data...</div>
      ) : (
        <div className="space-y-10">
          
          {tab === 'users' && (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Siswa</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">NISN / ID</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Kelas</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Kontak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-8 py-5 font-bold text-slate-800">{u.name}</td>
                        <td className="px-8 py-5 font-mono text-[10px] text-slate-400 font-bold tracking-widest">{u.id}</td>
                        <td className="px-8 py-5 font-bold text-slate-600">{u.department}</td>
                        <td className="px-8 py-5 text-blue-600 font-bold">{u.whatsapp}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {tab === 'schedules' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Manajemen Jadwal Pelajaran</h3>
                  <button 
                    onClick={() => setShowScheduleForm(!showScheduleForm)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    {showScheduleForm ? 'Batal' : 'Tambah Jadwal Baru'}
                  </button>
               </div>

               {showScheduleForm && (
                 <form onSubmit={handleAddSchedule} className="bg-white p-8 rounded-[32px] border-2 border-blue-50 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tingkat / Level</label>
                          <select className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold" value={newSchedule.level} onChange={e => setNewSchedule({...newSchedule, level: e.target.value})}>
                             <option value="SMP">SMP</option>
                             <option value="SMA">SMA</option>
                             <option value="SMK">SMK</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kelas</label>
                          <input type="text" placeholder="Cth: 10-IPA-1" required className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold" value={newSchedule.className} onChange={e => setNewSchedule({...newSchedule, className: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                          <input type="text" placeholder="Cth: Matematika" required className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold" value={newSchedule.subject} onChange={e => setNewSchedule({...newSchedule, subject: e.target.value})} />
                       </div>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hari</label>
                          <select className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold" value={newSchedule.day} onChange={e => setNewSchedule({...newSchedule, day: e.target.value})}>
                             {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jam Mulai</label>
                          <input type="time" required className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold" value={newSchedule.timeStart} onChange={e => setNewSchedule({...newSchedule, timeStart: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jam Selesai</label>
                          <input type="time" required className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold" value={newSchedule.timeEnd} onChange={e => setNewSchedule({...newSchedule, timeEnd: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guru Pengajar</label>
                          <input type="text" placeholder="Nama Guru..." className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold" value={newSchedule.teacher} onChange={e => setNewSchedule({...newSchedule, teacher: e.target.value})} />
                       </div>
                    </div>
                    <button type="submit" className="w-full gradient-brand text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-[0.98] transition-all">Simpan Jadwal</button>
                 </form>
               )}

               <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50">
                        <tr>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Kelas</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Mata Pelajaran</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Waktu</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Pengajar</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Aksi</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y">
                        {schedules.map(s => (
                           <tr key={s.id} className="hover:bg-slate-50 transition-all">
                              <td className="px-8 py-5 font-black text-slate-800 text-xs">[{s.level}] {s.className}</td>
                              <td className="px-8 py-5 font-bold text-slate-600">{s.subject}</td>
                              <td className="px-8 py-5">
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{s.day}</span>
                                    <span className="font-mono text-[10px] font-bold text-slate-400">{s.timeStart} - {s.timeEnd}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5 font-medium text-slate-500 text-xs">{s.teacher || '-'}</td>
                              <td className="px-8 py-5">
                                 <button 
                                   onClick={() => handleDeleteSchedule(s.id!)}
                                   className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                 >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                 </button>
                              </td>
                           </tr>
                        ))}
                        {schedules.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Belum ada jadwal yang diatur</td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {tab === 'reports' && (
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-10">
               <div className="space-y-4">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Download Report Center</h3>
                  <p className="text-slate-400 text-sm font-medium">Pilih filter untuk menghasilkan laporan PDF atau EXCEL dengan format Kop Instansi yang identik.</p>
               </div>

               <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rentang Tanggal</label>
                    <div className="flex gap-2">
                      <input type="date" className="flex-1 p-4 bg-slate-50 border rounded-2xl text-xs font-bold" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
                      <input type="date" className="flex-1 p-4 bg-slate-50 border rounded-2xl text-xs font-bold" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NISN / Nama Siswa</label>
                    <input type="text" placeholder="Cari NISN atau Nama..." className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold" value={filters.filterName} onChange={e => setFilters({...filters, filterName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Presensi</label>
                    <select className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold" value={filters.filterStatus} onChange={e => setFilters({...filters, filterStatus: e.target.value})}>
                       <option value="">Semua Status</option>
                       <option value="hadir">Hadir</option>
                       <option value="terlambat">Terlambat</option>
                       <option value="izin">Izin</option>
                       <option value="sakit">Sakit</option>
                       <option value="alpa">Alpa</option>
                    </select>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row gap-4 pt-6">
                  <button 
                    disabled={!!isExporting}
                    onClick={() => handleExport('pdf')}
                    className="flex-1 gradient-brand text-white py-5 rounded-[24px] font-black uppercase text-xs shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                    {isExporting === 'pdf' ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2}/></svg>}
                    Download PDF Resmi
                  </button>
                  <button 
                    disabled={!!isExporting}
                    onClick={() => handleExport('excel')}
                    className="flex-1 bg-green-600 text-white py-5 rounded-[24px] font-black uppercase text-xs shadow-2xl shadow-green-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                    {isExporting === 'excel' ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2}/></svg>}
                    Download Excel (Kop Identik)
                  </button>
               </div>
            </div>
          )}

          {tab === 'settings' && (
            <form onSubmit={handleUpdateSettings} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-12">
               <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-[4px]">Identity & Rules</h3>
                    <div className="space-y-4">
                       <input type="text" placeholder="Dinas Pendidikan Kabupaten/Kota" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={settings.dept_name} onChange={e => setSettings({...settings, dept_name: e.target.value})} />
                       <input type="text" placeholder="Nama Sekolah" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={settings.school_name} onChange={e => setSettings({...settings, school_name: e.target.value})} />
                       <textarea placeholder="Alamat Lengkap Sekolah" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold h-24 resize-none" value={settings.school_address} onChange={e => setSettings({...settings, school_address: e.target.value})} />
                       <input type="text" placeholder="Lokasi (Tempat Laporan)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={settings.city_location} onChange={e => setSettings({...settings, city_location: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-[4px]">Logo Instansi & Sekolah</h3>
                    <p className="text-[10px] text-slate-400 font-bold -mt-4">Klik pada kotak di bawah untuk mengunggah logo.</p>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Logo Dinas (Kiri)</label>
                          <div className="relative h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden hover:border-blue-300 transition-colors">
                             {settings.logo_left ? (
                               <img src={settings.logo_left} className="w-full h-full object-contain p-4" alt="Logo Dinas" />
                             ) : (
                               <div className="flex flex-col items-center gap-2">
                                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Upload Logo Dinas</span>
                               </div>
                             )}
                             <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logo_left')} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Logo Sekolah (Kanan)</label>
                          <div className="relative h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden hover:border-blue-300 transition-colors">
                             {settings.logo_right ? (
                               <img src={settings.logo_right} className="w-full h-full object-contain p-4" alt="Logo Sekolah" />
                             ) : (
                               <div className="flex flex-col items-center gap-2">
                                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Upload Logo Sekolah</span>
                               </div>
                             )}
                             <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logo_right')} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-[4px]">Pejabat & Guru</h3>
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="Nama Kepala Sekolah" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={settings.principal_name} onChange={e => setSettings({...settings, principal_name: e.target.value})} />
                          <input type="text" placeholder="NIP Kepala Sekolah" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={settings.principal_nip} onChange={e => setSettings({...settings, principal_nip: e.target.value})} />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="Nama Guru Mapel" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={settings.teacher_name} onChange={e => setSettings({...settings, teacher_name: e.target.value})} />
                          <input type="text" placeholder="NIP Guru Mapel" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={settings.teacher_nip} onChange={e => setSettings({...settings, teacher_nip: e.target.value})} />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-[4px]">Geofencing GPS</h3>
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-3">
                          <input type="number" step="any" placeholder="Latitude" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={settings.office_lat} onChange={e => setSettings({...settings, office_lat: parseFloat(e.target.value)})} />
                          <input type="number" step="any" placeholder="Longitude" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={settings.office_lng} onChange={e => setSettings({...settings, office_lng: parseFloat(e.target.value)})} />
                       </div>
                       <input type="number" placeholder="Radius Kehadiran (Meter)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={settings.attendance_radius} onChange={e => setSettings({...settings, attendance_radius: parseInt(e.target.value)})} />
                    </div>
                  </div>
               </div>

               <button type="submit" className="w-full gradient-brand text-white py-6 rounded-[24px] font-black uppercase text-xs shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all">Simpan Seluruh Pengaturan Branding</button>
            </form>
          )}

          {tab === 'attendance' && (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Siswa</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Tgl</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Jam</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendance.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-8 py-5 font-bold text-slate-800">{a.userName}</td>
                        <td className="px-8 py-5 text-slate-500">{a.date}</td>
                        <td className="px-8 py-5 font-bold text-blue-600">{a.clockIn}</td>
                        <td className="px-8 py-5 uppercase font-black text-[10px] text-slate-400">{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {tab === 'requests' && (
            <div className="grid md:grid-cols-2 gap-10">
               {leaves.filter(l => l.status === 'pending').map(l => (
                 <div key={l.id} className="bg-white p-10 rounded-[48px] border-2 border-slate-50 shadow-sm hover:border-blue-200 transition-all group">
                    <div className="flex items-start justify-between mb-8">
                       <div className="space-y-2">
                          <h4 className="font-black text-slate-900 text-2xl leading-none tracking-tight">{l.name || "Nama Tidak Ada"}</h4>
                          <div className="flex flex-wrap gap-2">
                             <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">NISN: {l.userid}</span>
                             <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">@{l.username || "no-username"}</span>
                             <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">{l.department}</span>
                          </div>
                       </div>
                       <div className="w-14 h-14 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-200 transition-colors">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100">
                          <div className="flex justify-between items-center mb-4">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Jenis Pengajuan</span>
                             <span className="text-xs font-black text-blue-600 uppercase">{l.type}</span>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Dari</p>
                                <p className="text-sm font-bold text-slate-800">{l.startDate}</p>
                             </div>
                             <div className="w-8 h-px bg-slate-200"></div>
                             <div className="flex-1 text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Sampai</p>
                                <p className="text-sm font-bold text-slate-800">{l.endDate}</p>
                             </div>
                          </div>
                       </div>
                       <div className="p-6 bg-slate-900 rounded-[32px] shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                             <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z" /></svg>
                          </div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Pesan/Alasan:</p>
                          <p className="text-sm font-medium text-white italic leading-relaxed">"{l.reason}"</p>
                       </div>
                    </div>
                    <div className="flex gap-4 mt-10">
                       <button onClick={() => gasService.updateRequestStatus(l.id, 'leave', 'approved').then(() => fetchAllData())} className="flex-1 gradient-brand text-white py-5 rounded-3xl text-[11px] font-black uppercase shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">Setujui Izin</button>
                       <button onClick={() => gasService.updateRequestStatus(l.id, 'leave', 'rejected').then(() => fetchAllData())} className="flex-1 bg-red-50 text-red-600 py-5 rounded-3xl text-[11px] font-black uppercase active:scale-95 transition-all">Tolak</button>
                    </div>
                 </div>
               ))}
               {leaves.filter(l => l.status === 'pending').length === 0 && (
                 <div className="col-span-2 py-40 bg-slate-50/50 rounded-[64px] border-4 border-dashed border-slate-200 text-center">
                    <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100">
                       <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[10px]">Antrean Bersih</p>
                 </div>
               )}
            </div>
          )}

          {tab === 'announcements' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
               <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest">Kirim Warta Terbaru</h3>
               <div className="space-y-4">
                  <input id="annTitle" type="text" placeholder="Judul Warta" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold" />
                  <textarea id="annContent" placeholder="Isi pengumuman..." className="w-full h-32 p-4 bg-slate-50 border rounded-2xl text-xs font-bold resize-none" />
                  <button 
                    onClick={async () => {
                      const t = (document.getElementById('annTitle') as HTMLInputElement).value;
                      const c = (document.getElementById('annContent') as HTMLTextAreaElement).value;
                      if(t && c) {
                        await gasService.addAnnouncement(t, c, user.name);
                        alert("Warta Terkirim!");
                        fetchAllData();
                      }
                    }} 
                    className="w-full gradient-brand text-white py-4 rounded-2xl font-black uppercase text-xs"
                  >
                    Publikasikan Sekarang
                  </button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
