
import React, { useState } from 'react';
import { gasService } from '../services/gasService';
import { User } from '../types';

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
  const [step, setStep] = useState<'info' | 'details'>('info');
  const [formData, setFormData] = useState({
    name: '',
    id: '', // NISN
    username: '',
    email: '',
    department: '', // Kelas
    whatsapp: '',
    password: '',
    subjects: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRegistration = () => {
    setStep('details');
    setError(null);
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
        subjects: formData.subjects
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-black text-slate-800 text-xl">Langkah 1: Lengkapi Profil</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-bold uppercase tracking-wider">
                  Silakan lengkapi data diri Anda untuk mengakses sistem presensi sekolah. Gunakan NISN resmi Anda sebagai ID.
                </p>
              </div>
              <button 
                onClick={startRegistration}
                className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                MULAI PENDAFTARAN
              </button>
              <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                Sudah punya akun? <button onClick={onNavigateToLogin} className="text-blue-600">Login Disini</button>
              </p>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleRegister} className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
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
                className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                {loading ? 'MENYIMPAN DATA...' : 'KONFIRMASI PENDAFTARAN'}
              </button>
              <button 
                type="button"
                onClick={() => setStep('info')}
                className="w-full text-slate-400 text-xs font-black uppercase tracking-widest"
              >
                Kembali
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
