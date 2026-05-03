
import React from 'react';
import { Page, User } from '../types';

interface NavbarProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  activePage: Page;
}

const Navbar: React.FC<NavbarProps> = ({ user, activePage, onNavigate, onLogout }) => {
  const navItems = [
    { id: Page.DASHBOARD, label: 'Beranda', icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { id: Page.ATTENDANCE, label: 'Absensi', icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )},
    { id: Page.LEAVE, label: 'Izin', icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
    { id: Page.REPORT, label: 'Laporan', icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
  ];

  if (user.role === 'admin') {
    navItems.push({
      id: Page.ADMIN, label: 'Panel', icon: (active: boolean) => (
        <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    });
  }

  const profileImageUrl = user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-10 py-4 bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-[100] transition-all soft-shadow">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onNavigate(Page.DASHBOARD)}>
          <div className="w-11 h-11 gradient-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
             </svg>
          </div>
          <div className="flex flex-col">
             <span className="text-xl font-black tracking-tight text-slate-800">EduPresensi</span>
             <span className="text-[9px] font-black text-blue-600 uppercase tracking-[2px]">Smart Academy</span>
          </div>
        </div>
        
        <nav className="flex gap-1 text-slate-400">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all relative uppercase tracking-widest ${activePage === item.id ? 'text-blue-600 bg-blue-50' : 'hover:text-slate-600 hover:bg-slate-50'}`}
            >
              {item.label}
              {activePage === item.id && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate(Page.PROFILE)}
            className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl hover:bg-slate-50 transition-all border border-slate-100 soft-shadow"
          >
            <img src={profileImageUrl} alt="Profile" className="w-9 h-9 rounded-xl object-cover border-2 border-white shadow-sm" />
            <div className="flex flex-col text-left">
               <span className="text-xs font-black text-slate-800 leading-tight">{user.name.split(' ')[0]}</span>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{user.department}</span>
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Floating Bottom Navigation */}
      {/* Meningkatkan z-index ke 9999 untuk memastikan selalu di atas namun padding di App.tsx tetap menjaga keterlihatan konten */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-[9999] flex justify-center pointer-events-none">
        <nav className="w-full max-w-sm glass-morphism rounded-[32px] px-2 py-2 flex justify-between items-center soft-shadow border border-white/60 pointer-events-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all"
            >
              <div className={`p-2.5 rounded-xl transition-all ${activePage === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 -translate-y-1' : 'text-slate-400'}`}>
                 {React.cloneElement(item.icon(activePage === item.id) as React.ReactElement<any>, { className: 'w-6 h-6' })}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity ${activePage === item.id ? 'opacity-100 text-blue-600' : 'opacity-0 h-0 overflow-hidden'}`}>
                {item.label.split(' ')[0]}
              </span>
            </button>
          ))}
          <button
            onClick={() => onNavigate(Page.PROFILE)}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all"
          >
            <div className={`p-0.5 rounded-xl border-2 transition-all ${activePage === Page.PROFILE ? 'border-blue-600 shadow-xl shadow-blue-500/30 -translate-y-1' : 'border-transparent'}`}>
               <img src={profileImageUrl} alt="Profile" className="w-8 h-8 rounded-[10px] object-cover border" />
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity ${activePage === Page.PROFILE ? 'opacity-100 text-blue-600' : 'opacity-0 h-0 overflow-hidden'}`}>
              Profil
            </span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
