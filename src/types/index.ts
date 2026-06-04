export interface Employee {
  nama: string;
  nik: string;
  masaKerja: string;
  departemen: string;
  liniBisnis: string;
  tanggalMasuk: string;
  email: string;
}

export interface LeaveRequest {
  nama: string;
  nik: string;
  masaKerja: string;
  departemen: string;
  liniBisnis: string;
  tanggalCutiPertama: string;
  tanggalCutiKedua: string;
  jenisCuti: string;
  acaraKeperluan: string;
  lampiran: string;
}

export interface Leader {
  division: string;
  email: string;
}

export interface LeaveQuota {
  employeeName: string;
  division: string;
  totalQuota: number;
  usedDays: number;
  remainingDays: number;
  joinDate: Date;
  isFebruaryJoiner: boolean;
  isOverOneYear: boolean;
}

export interface MonthlyLeave {
  month: number;
  year: number;
  daysUsed: number;
  requests: LeaveRequest[];
}

export type UserRole = 'admin' | 'leader' | 'employee';

export interface UserSession {
  email: string;
  role: UserRole;
  division?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  leaveTakenThisMonth: number;
  totalRemainingQuota: number;
  currentlyOnLeave: number;
}

export interface DivisionStats {
  division: string;
  totalEmployees: number;
  totalLeaveTaken: number;
  totalRemaining: number;
}

export interface RecentActivity {
  nama: string;
  departemen: string;
  tanggalCutiPertama: string;
  tanggalCutiKedua: string;
  jenisCuti: string;
  acaraKeperluan: string;
}

export interface CurrentlyOnLeave {
  nama: string;
  departemen: string;
  tanggalCutiPertama: string;
  tanggalCutiKedua: string;
}

export interface TopLeaveUser {
  nama: string;
  departemen: string;
  usedDays: number;
}

export interface LeaveTrend {
  month: string;
  days: number;
  employees: number;
}

export interface CalendarLeaveEntry {
  nama: string;
  departemen: string;
  jenisCuti: string;
  tanggalCutiPertama: string;
  tanggalCutiKedua: string;
}
