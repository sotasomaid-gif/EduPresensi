
export interface User {
  id: string; // Used as NISN
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'employee';
  department: string; // Used as Class (e.g., 10-IPA-1)
  whatsapp: string;
  subjects: string[]; // List of followed subjects
  profileImage?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  latIn: number;
  lngIn: number;
  latOut?: number;
  lngOut?: number;
  status: 'hadir' | 'terlambat' | 'izin' | 'alpa' | 'sakit';
  wifiVerified: boolean;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'cuti' | 'izin' | 'sakit';
}

export interface CorrectionRequest {
  id: string;
  attendanceId: string;
  userId: string;
  date: string;
  requestedTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export interface WorkSchedule {
  id?: string;
  level: string; // SMP, SMA, SMK
  className: string;
  subject: string;
  day: string;
  timeStart: string;
  timeEnd: string;
  teacher?: string;
  shift?: string;
}

export enum Page {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  REPORT = 'REPORT',
  CORRECTION = 'CORRECTION',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN'
}