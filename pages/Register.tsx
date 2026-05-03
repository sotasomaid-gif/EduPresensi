
import React, { useState, useRef } from 'react';
import { gasService } from '../services/gasService';
import { User } from '../types';
import { analyzeEnrollmentFace } from '../services/geminiService';

interface RegisterProps {
  onRegister: (user: User) => void;
  onNavigateToLogin: () => void;
}

const AVAILABLE_SUBJECTS = [
  "Matematika", "Bahasa Indonesia", "Bahasa Inggris", "IPA (Fisika/Kimia/Biologi)", 
  "IPS (Ekonomi/Geografi/Sosiologi)", "Pendidikan Agama", "PJOK", 
  "Seni Budaya", "Informatika", "Prakarya", "PKn", "Sejarah"
];

const Register: React.FC<RegisterProps> = ({ onRegister, onNavigateToLogin }) => {
  const [step, setStep] = useState<'info' | 'face' | 'details'>('info');
  const [formData, setFormData] = useState({
    name: '',
    id: '', // NISN
    username: '',
    email: '',
    department: '', // Kelas
    whatsapp: '',
    password: '',
    subjects: [] as string[],
    faceData: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setStep('face');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      setError("Kamera tidak dapat diakses. Pastikan izin kamera diberikan.");
    }
  };

  const captureFace = async () => {
    if (videoRef.current && canvasRef.current) {
      setLoading(true);
      setError(null);
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      
      try {
        const check = await analyzeEnrollmentFace(dataUrl);
        if (check.isVerified) {
          setFormData({ ...formData, faceData: dataUrl });
          setStep('details');
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(t => t.stop());
        } else {
          setError(check.message);
        }
      } catch (e) {
        setError("Gagal memproses wajah. Coba lagi.");
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject) 
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.subjects.length === 0) {
      setError("Pilih minimal satu mata pelajaran.");
      return;
    }
    setLoading(true);
    try {
      const user = await gasService.register({
        id: formData.id, // NISN as ID
        name: formData.name,
        username: formData.username,
        email: formData.email,
        department: formData.department,
        whatsapp: formData.whatsapp,
        subjects: formData.subjects,
        faceData: formData.faceData
      });
      onRegister(user);
    } catch (err: any) {
      setError(err.message || "Gagal registrasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#F8FAFC] py-12">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Registrasi Siswa</h1>
          <p className="text-slate-500 mt-2 font-medium">Sistem Presensi Digital Terintegrasi (SMP-SMA/SMK)</p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl border border-slate-100">
          {step === 'info' && (
            <div className="space-y-6 text-center">
              <div className="p-8 bg-blue-50 rounded-[32px] space-y-4 border border-blue-100 shadow-inner">
                <div className="w-20 h-20 bg-blue-600 rounded-[24px] flex items-center justify-center mx-auto text-white shadow-xl shadow-blue-200 animate-float">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-black text-slate-800 text-xl">Langkah 1: Verifikasi Wajah</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-bold uppercase tracking-wider">
                  Amankan akun Anda dengan biometrik. Foto ini akan menjadi referensi utama saat melakukan presensi harian.
                </p>
              </div>
              <button 
                onClick={startCamera}
                className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                MULAI VERIFIKASI WAJAH
              </button>
              <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                Sudah punya akun? <button onClick={onNavigateToLogin} className="text-blue-600">Login Disini</button>
              </p>
            </div>
          )}

          {step === 'face' && (
            <div className="space-y-6">
              <div className="relative aspect-square bg-slate-900 rounded-[40px] overflow-hidden border-8 border-white shadow-2xl">
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-[40px] border-slate-900/40 rounded-[40px] pointer-events-none">
                  <div className="w-full h-full border-2 border-white/50 border-dashed rounded-full" />
                </div>
              </div>
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 text-center animate-pulse">{error}</div>}
              <button 
                disabled={loading}
                onClick={captureFace}
                className="w-full gradient-brand text-white py-5 rounded-3xl font-black shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3"
              >
                {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : 'AMBIL FOTO BIOMETRIK'}
              </button>
              <button onClick={() => setStep('info')} className="w-full text-slate-400 text-xs font-black uppercase tracking-widest">Batal</button>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleRegister} className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex justify-center -mt-16">
                 <div className="relative group">
                    <img src={formData.faceData} className="w-24 h-24 rounded-[32px] object-cover border-8 border-white shadow-2xl bg-white" />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg border-4 border-white">
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NISN (ID Siswa)</label>
                  <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                  <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas</label>
                  <input type="text" required placeholder="Cth: 12-SMA-IPA-1" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Sekolah</label>
                  <input type="email" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. WhatsApp</label>
                  <input type="tel" required placeholder="08xxxxxxxxxx" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Mata Pelajaran Yang Diikuti</label>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_SUBJECTS.map(subj => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => toggleSubject(subj)}
                        className={`text-left px-4 py-3 rounded-2xl border text-[10px] font-bold transition-all ${formData.subjects.includes(subj) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'}`}
                      >
                        {subj}
                      </button>
                    ))}
                 </div>
              </div>

              {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 text-center">{error}</div>}

              <button
                disabled={loading}
                type="submit"
                className="w-full gradient-brand text-white py-5 rounded-3xl font-black shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {loading ? 'MENYIMPAN DATA...' : 'KONFIRMASI PENDAFTARAN'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
