
import React, { useState, useEffect } from 'react';
import { gasService } from '../services/gasService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigateToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const s = await gasService.getSettings();
      if (s) setSchoolSettings(s);
    };
    fetchSettings();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = await gasService.login(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Akses ditolak. Email atau Password salah.');
      }
    } catch (err) {
      setError('Gangguan koneksi ke server akademik.');
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = schoolSettings?.logo_right || schoolSettings?.logo_left;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfdfe] p-4">
      {/* Background Ornaments */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-50 blur-[120px] opacity-60"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-50 blur-[100px] opacity-60"></div>
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-0 bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden relative z-10 page-transition">
        {/* Left Side: Dynamic Branding */}
        <div className="hidden md:flex gradient-brand p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from),_transparent_70%)] from-white"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain brightness-0 invert" />
              ) : (
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tight text-white leading-none">EduPresensi</h1>
                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1 opacity-80">Next-Gen Academic Hub</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl font-black text-white leading-tight">Masa depan pendidikan dimulai di sini.</h2>
            <p className="text-blue-100/80 text-lg leading-relaxed font-medium">Platform akademik terintegrasi dengan verifikasi biometrik tingkat tinggi untuk transparansi dan disiplin maksimal.</p>
            
            <div className="flex gap-4 pt-4">
              <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/20 text-xs font-bold text-white uppercase tracking-widest">Intelligent GPS</div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/20 text-xs font-bold text-white uppercase tracking-widest">Face ID 2.0</div>
            </div>
          </div>

          <div className="relative z-10 text-[10px] font-bold text-blue-200/50 uppercase tracking-[4px]">
            &copy; 2025 Intelligent Systems • {schoolSettings?.school_name || "Academic Portal"}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full space-y-10">
            <div className="space-y-3">
              <div className="md:hidden flex justify-center mb-8">
                 {logoUrl ? (
                   <img src={logoUrl} alt="School Logo" className="h-20 w-20 object-contain shadow-xl rounded-2xl" />
                 ) : (
                    <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                 )}
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Portal Masuk</h3>
              <p className="text-slate-500 font-medium">Selamat datang kembali! Gunakan identitas digital Anda untuk mengakses layanan.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Email Akademik / NISN</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700"
                    placeholder="nama@sekolah.sch.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Pin Keamanan</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3 animate-pulse">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full gradient-brand text-white p-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Autentikasi Sekarang
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
               <p className="text-sm text-slate-500 font-bold">Belum memiliki identitas biometrik?</p>
               <button 
                 onClick={onNavigateToRegister}
                 className="w-full py-4 border-2 border-slate-200 rounded-2xl text-slate-800 font-black hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
               >
                 Daftar Wajah & Akun Baru
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
