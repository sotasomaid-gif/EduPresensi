
import React, { useState, useEffect } from 'react';
import { User, Announcement, Page, AttendanceRecord, WorkSchedule } from '../types';
import { gasService } from '../services/gasService';

interface DashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ann, sched, records] = await Promise.all([
          gasService.getAnnouncements(),
          gasService.getSchedules(),
          gasService.getAttendance(user.id)
        ]);
        setAnnouncements(ann);
        setSchedules(sched);
        
        const todayStr = new Date().toLocaleDateString('id-ID', { 
          day: '2-digit', month: '2-digit', year: 'numeric' 
        }).split('/').join('/');
        
        const todayRec = records.find(r => r.date === todayStr);
        if (todayRec) setTodayRecord(todayRec);
      } catch (e) {
        console.error("Dashboard Load Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => clearInterval(timer);
  }, [user.id]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[200]">
        <div className="relative">
          <div className="w-20 h-20 border-8 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
        <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Menyelaraskan Data...</p>
      </div>
    );
  }

  const profileImageUrl = user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=200`;

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-10 pb-32 pt-6 page-transition">
      {/* Welcome Banner - Refined Student ID Card */}
      <div className="relative group">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[48px] blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative gradient-brand rounded-[40px] p-8 md:p-12 text-white shadow-2xl overflow-hidden min-h-[300px] flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
             <div className="relative animate-float">
                <img 
                  src={profileImageUrl} 
                  alt="Profile" 
                  className="w-32 h-32 md:w-44 md:h-44 rounded-[40px] border-8 border-white/10 shadow-2xl object-cover bg-white/20 backdrop-blur-md"
                />
                <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl">
                   <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                   </div>
                </div>
             </div>
             <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[3px]">
                  <span className="w-2 h-2 bg-blue-300 rounded-full"></span> Active Student Account
                </div>
                <div>
                   <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight drop-shadow-md">{user.name.toUpperCase()}</h1>
                   <p className="text-blue-100/70 text-lg font-bold mt-1">NISN: 00{user.id.substring(user.id.length - 8)}</p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                   <div className="flex items-center gap-2 px-4 py-2 bg-black/10 rounded-2xl border border-white/10 text-xs font-bold">
                      <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      {user.department}
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-black/10 rounded-2xl border border-white/10 text-xs font-bold">
                      <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {todayRecord?.clockIn ? `In: ${todayRecord.clockIn}` : 'Belum Absen'}
                   </div>
                </div>
             </div>
          </div>

          <div className="relative z-10 flex flex-col items-center md:items-end gap-10">
             <div className="text-center md:text-right">
                <p className="text-5xl md:text-7xl font-black font-mono tracking-tighter tabular-nums drop-shadow-lg">{currentTime.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-xs text-blue-200 font-black uppercase tracking-[5px] mt-2 opacity-80">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
             </div>
             
             <div className="flex gap-4 w-full md:w-auto">
                {!todayRecord ? (
                  <button 
                    onClick={() => onNavigate(Page.ATTENDANCE)}
                    className="w-full md:w-64 bg-white text-blue-800 px-8 py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:scale-[1.05] active:scale-95 transition-all shadow-2xl hover:shadow-white/20 group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:rotate-12 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    Presensi Masuk
                  </button>
                ) : !todayRecord.clockOut ? (
                  <button 
                    onClick={() => onNavigate(Page.ATTENDANCE)}
                    className="w-full md:w-64 bg-orange-400 text-orange-950 px-8 py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:scale-[1.05] active:scale-95 transition-all shadow-2xl hover:shadow-orange-400/20 group"
                  >
                    <div className="w-10 h-10 bg-orange-900/10 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </div>
                    Presensi Pulang
                  </button>
                ) : (
                  <div className="w-full md:w-64 bg-white/10 backdrop-blur-2xl border border-white/20 px-8 py-5 rounded-3xl font-black flex items-center justify-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Shift Selesai
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Main Feature Grid */}
      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-6 h-full">
               <button 
                 onClick={() => onNavigate(Page.LEAVE)}
                 className="group relative bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all overflow-hidden"
               >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10 w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="relative z-10 mt-10">
                     <p className="font-black text-2xl text-slate-800 leading-none">Izin &<br/>Sakit</p>
                     <p className="text-slate-400 text-[9px] font-black mt-3 uppercase tracking-[2px]">Request Service</p>
                  </div>
               </button>
               
               <button 
                 onClick={() => onNavigate(Page.CORRECTION)}
                 className="group relative bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-2 transition-all overflow-hidden"
               >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10 w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200 group-hover:rotate-6 transition-transform">
                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </div>
                  <div className="relative z-10 mt-10">
                     <p className="font-black text-2xl text-slate-800 leading-none">Koreksi<br/>Absen</p>
                     <p className="text-slate-400 text-[9px] font-black mt-3 uppercase tracking-[2px]">Data Adjustment</p>
                  </div>
               </button>
            </div>

            {/* Schedule Info */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden h-full">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-widest flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    Jadwal Hari Ini
                  </h3>
               </div>
               <div className="space-y-4">
                  {schedules.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.day}</span>
                          <span className="font-bold text-slate-800">{s.shift}</span>
                       </div>
                       <span className="bg-white px-4 py-1.5 rounded-xl border text-xs font-black text-blue-600 shadow-sm">{s.timeStart} - {s.timeEnd}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Performance Summary Card */}
          <div className="bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>
             <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                <div className="space-y-4 text-center md:text-left">
                   <h3 className="text-3xl font-black tracking-tight leading-none">Statistik Performa Semester</h3>
                   <p className="text-slate-400 font-medium max-w-sm">Evaluasi otomatis berdasarkan algoritma kehadiran dan partisipasi digital Anda.</p>
                   <button 
                     onClick={() => onNavigate(Page.REPORT)}
                     className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all flex items-center gap-2 mx-auto md:mx-0 shadow-xl shadow-white/5"
                   >
                     Buka Report Center
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="text-center p-6 bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10">
                      <p className="text-5xl font-black text-blue-400">98.2</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Presence Score</p>
                   </div>
                   <div className="text-center p-6 bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10">
                      <p className="text-5xl font-black text-green-400">A+</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Attendance Rank</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* School News Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-widest flex items-center gap-3">
                <div className="relative">
                   <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                   <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                </div>
                News & Alerts
              </h3>
              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">See All</button>
           </div>
           
           <div className="space-y-6 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
              {announcements.map(ann => (
                <div key={ann.id} className="group bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                   <div className="flex justify-between items-center mb-5">
                      <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">{ann.author.split(' ')[0]}</span>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{ann.date}</span>
                   </div>
                   <h4 className="font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-snug text-lg">{ann.title}</h4>
                   <p className="text-sm text-slate-500 mt-3 line-clamp-3 leading-relaxed font-medium">{ann.content}</p>
                   <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                      Read Full Article <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                   </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="p-20 text-center bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-sm">
                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[3px]">Papan Warta Kosong</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
