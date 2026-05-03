
import React, { useState, useEffect } from 'react';
import { Page, User } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import LeavePage from './pages/Leave';
import ReportPage from './pages/Report';
import CorrectionPage from './pages/Correction';
import ProfilePage from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData && typeof userData === 'object') {
          setUser(userData);
          setCurrentPage(Page.DASHBOARD);
        } else {
          localStorage.removeItem('user');
        }
      } catch (e) {
        console.error("Failed to parse saved user:", e);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentPage(Page.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCurrentPage(Page.LOGIN);
  };

  const renderPage = () => {
    if (!user && currentPage !== Page.REGISTER) return <Login onLogin={handleLogin} onNavigateToRegister={() => setCurrentPage(Page.REGISTER)} />;
    
    switch (currentPage) {
      case Page.LOGIN:
        return <Login onLogin={handleLogin} onNavigateToRegister={() => setCurrentPage(Page.REGISTER)} />;
      case Page.REGISTER:
        return <Register onRegister={handleLogin} onNavigateToLogin={() => setCurrentPage(Page.LOGIN)} />;
      case Page.DASHBOARD:
        return user ? <Dashboard user={user} onNavigate={setCurrentPage} /> : null;
      case Page.ATTENDANCE:
        return user ? <Attendance user={user} onBack={() => setCurrentPage(Page.DASHBOARD)} /> : null;
      case Page.LEAVE:
        return user ? <LeavePage user={user} onBack={() => setCurrentPage(Page.DASHBOARD)} /> : null;
      case Page.REPORT:
        return user ? <ReportPage user={user} onBack={() => setCurrentPage(Page.DASHBOARD)} /> : null;
      case Page.CORRECTION:
        return user ? <CorrectionPage user={user} onBack={() => setCurrentPage(Page.DASHBOARD)} /> : null;
      case Page.PROFILE:
        return user ? <ProfilePage user={user} onLogout={handleLogout} onBack={() => setCurrentPage(Page.DASHBOARD)} /> : null;
      case Page.ADMIN:
        return user && user.role === 'admin' ? <AdminDashboard user={user} onBack={() => setCurrentPage(Page.DASHBOARD)} /> : null;
      default:
        return <Dashboard user={user!} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {user && currentPage !== Page.LOGIN && currentPage !== Page.REGISTER && (
        <Navbar user={user} activePage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
      )}
      {/* Menambahkan pb-36 pada mobile (md:pb-4) untuk memberi ruang bagi floating navbar */}
      <main className={user ? "pb-36 md:pb-8 pt-4" : ""}>
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
