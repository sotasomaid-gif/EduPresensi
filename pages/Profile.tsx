
import React, { useState } from 'react';
import { User } from '../types';
import { gasService } from '../services/gasService';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  onBack: () => void;
}

const ProfilePage: React.FC<ProfileProps> = ({ user, onLogout, onBack }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const profileImageUrl = user.profileImage || user.faceData || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=200`;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      const res = await gasService.changePassword(user.id, currentPassword, newPassword);
      if (res && res.success) {
        setSuccess('Password berhasil diperbarui!');
        setTimeout(() => setShowPasswordModal(false), 2000);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res?.error || 'Gagal mengubah password.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Profil Akademik</h1>
      </div>

      <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden mb-6">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <div className="px-8 pb-8">
          <div className="relative -mt-12 flex justify-center md:justify-start">
            <img 
              src={profileImageUrl} 
              className="w-24 h-24 rounded-[32px] border-4 border-white shadow-xl object-cover bg-white"
            />
          </div>
          <div className="mt-4 text-center md:text-left">
            <h2 className="text-2xl font-extrabold text-slate-800">{user.name}</h2>
            <p className="text-slate-500 font-medium">{user.department} Department</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Sekolah</label>
              <p className="text-sm font-semibold text-slate-700">{user.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID Pelajar / NIK</label>
              <p className="text-sm font-semibold text-slate-700">ED-{user.id.toUpperCase()}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Akses</label>
              <p className="text-sm font-semibold text-slate-700 capitalize">{user.role}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Akun</label>
              <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" /> Aktif
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => setShowPasswordModal(true)}
          className="w-full bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="font-bold text-slate-700">Ganti Password</span>
          </div>
          <svg className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button 
          className="w-full bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between hover:bg-red-50 transition-colors text-red-600 mb-8" 
          onClick={onLogout}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="font-bold">Keluar Aplikasi</span>
          </div>
          <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !loading && setShowPasswordModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-8 animate-in zoom-in duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Perbarui Password</h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Password Saat Ini</label>
                <input 
                  type="password" required
                  className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Password Baru</label>
                <input 
                  type="password" required
                  className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Konfirmasi Password Baru</label>
                <input 
                  type="password" required
                  className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
              {success && <p className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">{success}</p>}

              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-4 border-2 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
                  disabled={loading}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 gradient-brand text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
