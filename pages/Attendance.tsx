
import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord } from '../types';
import { gasService } from '../services/gasService';

interface AttendanceProps {
  user: User;
  onBack: () => void;
}

const Attendance: React.FC<AttendanceProps> = ({ user, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'status' | 'processing' | 'result'>('status');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isInsideZone, setIsInsideZone] = useState(false);
  const [wifiOk, setWifiOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  
  // Dynamic Settings
  const [officeSettings, setOfficeSettings] = useState({
    office_lat: -6.2000,
    office_lng: 106.8166,
    attendance_radius: 100
  });

  useEffect(() => {
    initAttendance();
  }, []);

  const initAttendance = async () => {
    setLoading(true);
    try {
      const settings = await gasService.getSettings();
      if (settings) {
        setOfficeSettings(settings);
      }
      checkRequirements(settings || officeSettings);
      await checkTodayStatus();
    } catch (e) {
      setError("Gagal memuat konfigurasi sistem.");
    } finally {
      setLoading(false);
    }
  };

  const checkTodayStatus = async () => {
    const records = await gasService.getAttendance(user.id);
    const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('/');
    const todayRec = records.find(r => r.date === today);
    if (todayRec) setTodayRecord(todayRec);
  };

  const checkRequirements = (currentSettings: any) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(coords);
          const dist = calculateDistance(
            coords.lat, 
            coords.lng, 
            parseFloat(currentSettings.office_lat), 
            parseFloat(currentSettings.office_lng)
          );
          setIsInsideZone(dist <= parseInt(currentSettings.attendance_radius));
        },
        () => setError("Izin lokasi diperlukan untuk melakukan presensi.")
      );
    }
    setWifiOk(navigator.onLine);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleAttendance = async () => {
    if (todayRecord && todayRecord.clockIn && todayRecord.clockOut) {
      setError("Anda sudah menyelesaikan presensi masuk dan pulang untuk hari ini.");
      return;
    }
    if (!isInsideZone) {
      setError(`Anda berada di luar area presensi. Jarak maksimal dari titik koordinat adalah ${officeSettings.attendance_radius}m.`);
      return;
    }

    setStep('processing');
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('/');

      if (!todayRecord) {
        const limit = new Date();
        limit.setHours(8, 30, 0); // Batas masuk jam 08:30
        const status = now > limit ? 'terlambat' : 'hadir';

        await gasService.submitAttendance({
          userId: user.id,
          userName: user.name,
          date: dateStr,
          clockIn: timeStr,
          latIn: location!.lat,
          lngIn: location!.lng,
          status,
          wifiVerified: true
        });
        setResult(`Presensi Masuk Berhasil pada ${timeStr}`);
      } else if (!todayRecord.clockOut) {
        await gasService.updateAttendance(todayRecord.id, {
          clockOut: timeStr,
          latOut: location!.lat,
          lngOut: location!.lng
        });
        setResult(`Presensi Pulang Berhasil pada ${timeStr}`);
      }
      setStep('result');
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan data ke database. Silakan coba lagi.");
      setStep('status');
    } finally {
      setLoading(false);
    }
  };

  const isFinished = !!(todayRecord && todayRecord.clockIn && todayRecord.clockOut);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
          <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Presensi Lokasi</h1>
      </div>

      {step === 'status' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] text-center">Validasi Sistem</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className={`p-6 rounded-3xl flex items-center justify-between border-2 transition-all ${isInsideZone ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200 animate-pulse'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${isInsideZone ? 'bg-green-500' : 'bg-red-500'} text-white shadow-lg`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-wider ${isInsideZone ? 'text-green-700' : 'text-red-700'}`}>Zona Presensi</p>
                        <p className="text-sm font-bold text-slate-800">{isInsideZone ? 'Dalam Jangkauan' : 'Luar Area Kantor'}</p>
                      </div>
                    </div>
                    {isInsideZone && (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className={`p-6 rounded-3xl flex items-center justify-between border-2 transition-all ${wifiOk ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${wifiOk ? 'bg-blue-500' : 'bg-slate-400'} text-white shadow-lg`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-wider ${wifiOk ? 'text-blue-700' : 'text-slate-500'}`}>Koneksi Jaringan</p>
                        <p className="text-sm font-bold text-slate-800">{wifiOk ? 'Online & Terverifikasi' : 'Offline / Tidak Terdeteksi'}</p>
                      </div>
                    </div>
                    {wifiOk && (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {todayRecord && (
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center gap-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Hari Ini</p>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Jam Masuk</p>
                      <p className="text-lg font-black text-slate-800">{todayRecord.clockIn}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Jam Pulang</p>
                      <p className="text-lg font-black text-slate-800">{todayRecord.clockOut || '--:--'}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-5 bg-red-50 text-red-600 rounded-3xl text-xs font-bold border border-red-100 flex items-start gap-4">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                  </div>
                  <span className="leading-relaxed mt-1.5">{error}</span>
                </div>
              )}

              <button
                disabled={!location || !isInsideZone || !wifiOk || loading || isFinished}
                onClick={handleAttendance}
                className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:scale-100 disabled:shadow-none uppercase tracking-widest"
              >
                {loading ? 'MEMPROSES DATA...' : (isFinished ? 'Tugas Hari Ini Selesai' : (todayRecord ? 'Konfirmasi Clock Out' : 'Submit Presensi'))}
              </button>
           </div>
           
           <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMP - SMA - SMK DIGITAL PRESENCE v2.0</p>
           </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-in zoom-in duration-300">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-8 border-slate-100 border-t-slate-900 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <svg className="w-10 h-10 text-slate-900 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
               </svg>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Menyimpan Presensi</h2>
            <p className="text-slate-500 text-sm mt-3 font-medium">Validasi lokasi dan waktu server sedang dilakukan...</p>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-10 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-green-200 rotate-12 transition-transform hover:rotate-0">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-center px-6 space-y-3">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Berhasil!</h2>
            <p className="text-slate-500 font-bold text-lg">{result}</p>
          </div>
          <button
            onClick={onBack}
            className="w-full max-w-sm bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Kembali ke Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default Attendance;
