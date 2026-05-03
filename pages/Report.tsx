
import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord } from '../types';
import { gasService } from '../services/gasService';

interface ReportProps {
  user: User;
  onBack: () => void;
}

const ReportPage: React.FC<ReportProps> = ({ user, onBack }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const data = await gasService.getAttendance(user.id);
      setRecords(data);
    };
    fetch();
  }, [user.id]);

  const handleDownloadPDF = async () => {
    if (records.length === 0) {
      alert("Tidak ada data kehadiran untuk dibuat laporan.");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const result = await gasService.downloadAttendancePDF(user.id);
      
      if (result && result.base64) {
        const linkSource = `data:application/pdf;base64,${result.base64}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = result.fileName || `Laporan_Absensi_${user.name}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } else if (result && result.error) {
        alert("Server Error: " + result.error + "\n\nPastikan Anda sudah me-redeploy Google Apps Script dengan versi terbaru.");
      } else {
        alert("Gagal membuat PDF. Pastikan Google Apps Script sudah di-deploy sebagai Web App dan dapat diakses 'Anyone'.");
      }
    } catch (error) {
      console.error("PDF Download Exception:", error);
      alert("Terjadi kesalahan koneksi saat mengunduh laporan.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Laporan Kehadiran</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase">Total Kehadiran</p>
          <p className="text-3xl font-extrabold text-slate-800 mt-1">{records.length}</p>
          <div className="mt-4 flex items-center gap-2 text-green-600 text-xs font-bold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
            <span>Bulan Ini</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase">Jam Kerja Rata-rata</p>
          <p className="text-3xl font-extrabold text-slate-800 mt-1">8h 15m</p>
          <p className="mt-4 text-slate-400 text-xs font-medium">Berdasarkan data harian</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase">Status Kehadiran</p>
          <p className="text-3xl font-extrabold text-slate-800 mt-1">Aktif</p>
          <p className="mt-4 text-green-500 text-xs font-bold uppercase tracking-widest">Akun Terverifikasi</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Detail Riwayat Presensi</h3>
          <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className={`text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition-all ${
              isGeneratingPDF 
                ? 'bg-slate-100 text-slate-400' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
            }`}
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                Menghasilkan Laporan...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Unduh PDF
              </>
            )}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Masuk</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Keluar</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Metode</th>
              </tr>
            </thead>
            <tbody className="divide-y border-t">
              {records.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{rec.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{rec.clockIn}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{rec.clockOut || '--:--'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                      rec.status === 'hadir' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase">
                    {rec.wifiVerified ? 'WiFi Office' : 'GPS Verification'}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Belum ada riwayat presensi yang ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
