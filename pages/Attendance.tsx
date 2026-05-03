
import React, { useState, useRef, useEffect } from 'react';
import { User, AttendanceRecord } from '../types';
import { gasService } from '../services/gasService';
import { matchFace } from '../services/geminiService';

interface AttendanceProps {
  user: User;
  onBack: () => void;
}

const Attendance: React.FC<AttendanceProps> = ({ user, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'camera' | 'verifying' | 'result'>('camera');
  const [photo, setPhoto] = useState<string | null>(null);
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    initAttendance();
    return () => stopCamera();
  }, []);

  const initAttendance = async () => {
    setLoading(true);
    try {
      const settings = await gasService.getSettings();
      if (settings) {
        setOfficeSettings(settings);
      }
      await startCamera();
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError("Kamera tidak dapat diakses.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
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
        () => setError("Izin lokasi diperlukan.")
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

  const capturePhoto = () => {
    if (todayRecord && todayRecord.clockIn && todayRecord.clockOut) {
      setError("Anda sudah menyelesaikan presensi masuk dan pulang untuk hari ini.");
      return;
    }
    if (!isInsideZone) {
      setError(`Anda berada di luar area kantor. Radius maksimal ${officeSettings.attendance_radius}m.`);
      return;
    }
    if (!wifiOk) {
      setError("Harap hubungkan perangkat ke WiFi Kantor.");
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      setPhoto(dataUrl);
      processAttendance(dataUrl);
    }
  };

  const processAttendance = async (capturedPhoto: string) => {
    setStep('verifying');
    setLoading(true);
    setError(null);

    if (!user.faceData) {
      setError("Wajah master tidak ditemukan. Harap hubungi Admin.");
      setStep('camera');
      setLoading(false);
      return;
    }

    const verification = await matchFace(user.faceData, capturedPhoto);
    if (!verification.isMatch) {
      setError(`Presensi Ditolak: ${verification.message}`);
      setStep('camera');
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('/');

      if (!todayRecord) {
        const limit = new Date();
        limit.setHours(8, 30, 0);
        const status = now > limit ? 'terlambat' : 'hadir';

        await gasService.submitAttendance({
          userId: user.id,
          userName: user.name,
          date: dateStr,
          clockIn: timeStr,
          latIn: location!.lat,
          lngIn: location!.lng,
          selfieIn: capturedPhoto,
          status,
          wifiVerified: true
        });
        setResult(`Presensi Masuk Berhasil pada ${timeStr}`);
      } else if (!todayRecord.clockOut) {
        await gasService.updateAttendance(todayRecord.id, {
          clockOut: timeStr,
          latOut: location!.lat,
          lngOut: location!.lng,
          selfieOut: capturedPhoto
        });
        setResult(`Presensi Pulang Berhasil pada ${timeStr}`);
      }
      setStep('result');
    } catch (err) {
      setError("Gagal menyimpan data ke database.");
      setStep('camera');
    } finally {
      setLoading(false);
    }
  };

  const isFinished = !!(todayRecord && todayRecord.clockIn && todayRecord.clockOut);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Presensi Cerdas</h1>
      </div>

      {step === 'camera' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="relative aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-80 border-2 border-white/50 border-dashed rounded-[100px] bg-white/5" />
              <p className="text-white/70 text-[10px] uppercase font-bold mt-4 tracking-widest">Posisikan wajah Anda</p>
            </div>

            <div className="absolute top-4 left-4 right-4 flex flex-col gap-2">
              <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-2 shadow-md w-fit transition-all ${isInsideZone ? 'bg-green-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
                <div className="w-2 h-2 rounded-full bg-white" />
                {isInsideZone ? 'Area Kantor OK' : 'Luar Area Kantor'}
              </div>
              <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-2 shadow-md w-fit ${wifiOk ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                <div className="w-2 h-2 rounded-full bg-white" />
                {wifiOk ? 'WiFi Kantor OK' : 'WiFi Tidak Terdeteksi'}
              </div>
            </div>
            
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {isFinished && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg">Presensi Selesai</h3>
                <p className="text-white/60 text-sm mt-2">Anda sudah melakukan Clock In & Out hari ini.</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="p-4 bg-white rounded-2xl border shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden border">
                <img src={user.faceData} className="w-full h-full object-cover opacity-50 grayscale" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-slate-800">Verifikasi Biometrik</h4>
                <p className="text-[10px] text-slate-400">Radius Absensi: {officeSettings.attendance_radius} meter</p>
             </div>
          </div>

          <button
            disabled={!location || !isInsideZone || !wifiOk || loading || isFinished}
            onClick={capturePhoto}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:bg-slate-200"
          >
            {isFinished ? 'Tugas Hari Ini Selesai' : (todayRecord ? 'Konfirmasi Clock Out' : 'Ambil Selfie & Absen')}
          </button>
        </div>
      )}

      {step === 'verifying' && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in zoom-in duration-300">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
               </svg>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">Verifikasi AI</h2>
            <p className="text-slate-500 text-sm mt-2">Mencocokkan wajah dan lokasi kantor...</p>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-center px-6">
            <h2 className="text-2xl font-bold text-slate-800">Berhasil!</h2>
            <p className="text-slate-500 mt-2">{result}</p>
          </div>
          <button
            onClick={onBack}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 shadow-xl transition-all active:scale-95"
          >
            Kembali ke Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default Attendance;
