
import { User, AttendanceRecord, LeaveRequest, Announcement, CorrectionRequest, WorkSchedule } from '../types';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyRmONluymkYi3u_vlLfU-WFwpLbJy_iVfktPtxnqAy7HsZMDh35WoywOLyjHRKHlQiPw/exec';

class GasService {
  private async callGas(action: string, method: 'GET' | 'POST', body?: any, params: Record<string, string> = {}) {
    const queryParams = new URLSearchParams({ action: action.toLowerCase(), ...params });
    const url = `${GAS_URL}?${queryParams.toString()}`;

    try {
      const options: RequestInit = {
        method: method,
        mode: 'cors',
      };
      
      if (method === 'POST' && body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      if (data && typeof data === 'object' && data.error) {
        console.error("GAS Error:", data.error);
        return data;
      }
      return data;
    } catch (error) {
      console.error(`GAS Service Error (${action}):`, error);
      return { error: String(error) };
    }
  }

  private mapUser(u: any): User {
    return {
      id: u.id?.toString() || u.nisn?.toString() || '',
      name: u.name || '',
      username: u.username || '',
      email: u.email || '',
      role: u.role || 'employee',
      department: u.department || u.class || '',
      whatsapp: u.whatsapp || '',
      subjects: u.subjects ? (typeof u.subjects === 'string' ? u.subjects.split(', ') : u.subjects) : [],
      faceData: u.facedata || ''
    };
  }

  async login(email: string, password: string): Promise<User | null> {
    const data = await this.callGas('login', 'GET', null, { email, password });
    if (!data || data.error) return null;
    return this.mapUser(data);
  }

  async register(userData: Partial<User>): Promise<User> {
    const data = await this.callGas('register', 'POST', userData);
    if (!data || data.error) throw new Error(data?.error || "Gagal registrasi");
    return this.mapUser(data);
  }

  async bulkRegister(students: any[]): Promise<any> {
    return await this.callGas('bulkregister', 'POST', students);
  }

  async bulkImportSchedules(schedules: WorkSchedule[]): Promise<any> {
    return await this.callGas('bulkschedules', 'POST', schedules);
  }

  async updateSchedule(schedule: WorkSchedule): Promise<any> {
    return await this.callGas('updateschedule', 'POST', schedule);
  }

  async deleteSchedule(id: string): Promise<any> {
    return await this.callGas('deleteschedule', 'POST', { id });
  }

  async getAttendance(userId?: string): Promise<AttendanceRecord[]> {
    const params: Record<string, string> = {};
    if (userId) params.userId = userId;
    const data = await this.callGas('getAttendance', 'GET', null, params);
    return Array.isArray(data) ? data.map(a => ({
        ...a,
        id: a.id?.toString() || '',
        userId: a.userid || a.userId,
        userName: a.username || a.userName,
        latIn: a.latin || a.latIn,
        lngIn: a.lngin || a.lngIn,
        latOut: a.latout || a.latOut,
        lngOut: a.lngout || a.lngOut,
        wifiVerified: a.wifiverified === true || a.wifiverified === 'true'
    })) : [];
  }

  async getSchedules(): Promise<WorkSchedule[]> {
    const data = await this.callGas('getschedules', 'GET');
    return Array.isArray(data) ? data.map(s => ({
        ...s,
        id: s.id?.toString() || '',
        className: s.classname || s.className,
        timeStart: s.timestart || s.timeStart,
        timeEnd: s.timeend || s.timeEnd,
        shift: s.shift || ''
    })) : [];
  }

  async updateRequestStatus(id: string, type: 'leave' | 'correction', status: 'approved' | 'rejected'): Promise<any> {
    return await this.callGas('updaterequeststatus', 'POST', { id, type, status });
  }

  async addAnnouncement(title: string, content: string, author: string): Promise<any> {
    return await this.callGas('addannouncement', 'POST', { title, content, author });
  }

  async getFileAsBase64(fileId: string): Promise<string | null> {
    const data = await this.callGas('getfilebase64', 'GET', null, { fileId });
    return data?.base64 || null;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    const data = await this.callGas('getannouncements', 'GET');
    return Array.isArray(data) ? data : [];
  }

  async submitAttendance(record: any): Promise<any> {
    return await this.callGas('submitattendance', 'POST', record);
  }

  async updateAttendance(id: string, data: any): Promise<any> {
    return await this.callGas('updateattendance', 'POST', { id, ...data });
  }

  async getLeaves(userId?: string): Promise<LeaveRequest[]> {
    const params: Record<string, string> = {};
    if (userId) params.userId = userId;
    const data = await this.callGas('getleaves', 'GET', null, params);
    return Array.isArray(data) ? data : [];
  }

  async submitLeave(leave: any): Promise<any> {
    return await this.callGas('submitleave', 'POST', leave);
  }

  async changePassword(userId: string, current: string, newPass: string): Promise<any> {
    return await this.callGas('changepassword', 'POST', { userId, current, newPass });
  }

  async getCorrections(userId?: string): Promise<CorrectionRequest[]> {
    const params: Record<string, string> = {};
    if (userId) params.userId = userId;
    const data = await this.callGas('getcorrections', 'GET', null, params);
    return Array.isArray(data) ? data : [];
  }

  async submitCorrection(correction: any): Promise<any> {
    return await this.callGas('submitcorrection', 'POST', correction);
  }

  async downloadAttendancePDF(userId: string): Promise<any> { return this.callGas('generatepdf', 'GET', null, { userId }); }
  
  async downloadAdminAttendancePDF(filters: any): Promise<any> { 
    return this.callGas('generateadminreport', 'GET', null, filters); 
  }

  async downloadAdminAttendanceExcel(filters: any): Promise<any> {
    return this.callGas('generateadminexcel', 'GET', null, filters);
  }

  async getSettings(): Promise<any> { return this.callGas('getSettings', 'GET'); }
  async updateSettings(settings: any): Promise<any> { return this.callGas('updateSettings', 'POST', settings); }
  async getAllUsers(): Promise<User[]> {
    const data = await this.callGas('getAllUsers', 'GET');
    return Array.isArray(data) ? data.map(u => this.mapUser(u)) : [];
  }
}

export const gasService = new GasService();
