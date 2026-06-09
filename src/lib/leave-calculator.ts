import { LeaveRequest, LeaveQuota, MonthlyLeave } from '@/types';
import { parseIndonesianDate, formatToIndonesianDate } from './indonesian-date';
import { namesMatch, cleanField } from './name-cleaner';

export function calculateLeaveQuota(
  joinDate: string,
  currentDate: Date = new Date()
): { quota: number; isFebruaryJoiner: boolean; isOverOneYear: boolean } {
  const join = parseIndonesianDate(joinDate);
  const currentYear = currentDate.getFullYear();
  const joinMonth = join.getMonth() + 1;
  const joinYear = join.getFullYear();
  
  const yearsSinceJoin = currentYear - joinYear;
  const isFebruaryJoiner = joinMonth === 2;
  const isOverOneYear = yearsSinceJoin >= 1;
  
  let quota: number;
  
  if (yearsSinceJoin < 1) {
    // Year 1: 0 days (haven't completed 1 year)
    quota = 0;
  } else if (yearsSinceJoin === 1) {
    // Year 2 (exactly 1 year): max(1, 12 - joinMonth)
    quota = Math.max(1, 12 - joinMonth);
  } else {
    // Year 3+: 12 days (full quota)
    quota = 12;
  }
  
  return { quota, isFebruaryJoiner, isOverOneYear };
}

export function calculateDaysUsed(leaveRequests: LeaveRequest[], year?: number): number {
  const targetYear = year ?? new Date().getFullYear();
  let totalDays = 0;
  
  for (const request of leaveRequests) {
    const jenisCuti = cleanField(request.jenisCuti).toLowerCase();
    if (jenisCuti === 'melahirkan') continue;
    
    const pertama = parseIndonesianDate(request.tanggalCutiPertama);
    if (isNaN(pertama.getTime())) continue;
    if (pertama.getFullYear() !== targetYear) continue;
    
    const kedua = request.tanggalCutiKedua ? parseIndonesianDate(request.tanggalCutiKedua) : null;
    
    // G and H are two separate leave days, NOT a date range
    if (kedua && !isNaN(kedua.getTime())) {
      // Both dates have values
      if (pertama.getTime() === kedua.getTime()) {
        totalDays += 1; // Same date = 1 day
      } else {
        totalDays += 2; // Different dates = 2 days
      }
    } else {
      totalDays += 1; // Only first date = 1 day
    }
  }
  
  return totalDays;
}

export function calculateMonthlyLeave(leaveRequests: LeaveRequest[], year?: number): MonthlyLeave[] {
  const targetYear = year ?? new Date().getFullYear();
  const monthlyData: { [key: string]: MonthlyLeave } = {};
  
  for (const request of leaveRequests) {
    const jenisCuti = cleanField(request.jenisCuti).toLowerCase();
    if (jenisCuti === 'melahirkan') continue;
    
    const pertama = parseIndonesianDate(request.tanggalCutiPertama);
    if (isNaN(pertama.getTime())) continue;
    if (pertama.getFullYear() !== targetYear) continue;
    
    const month = pertama.getMonth();
    const key = `${targetYear}-${month}`;
    
    if (!monthlyData[key]) {
      monthlyData[key] = {
        month,
        year: targetYear,
        daysUsed: 0,
        requests: [],
      };
    }
    
    const kedua = request.tanggalCutiKedua ? parseIndonesianDate(request.tanggalCutiKedua) : null;
    
    // G and H are two separate leave days, NOT a date range
    let days = 0;
    if (kedua && !isNaN(kedua.getTime())) {
      if (pertama.getTime() === kedua.getTime()) {
        days = 1; // Same date = 1 day
      } else {
        days = 2; // Different dates = 2 days
      }
    } else {
      days = 1; // Only first date = 1 day
    }
    
    monthlyData[key].daysUsed += days;
    monthlyData[key].requests.push(request);
  }
  
  return Object.values(monthlyData).sort((a, b) => a.year - b.year || a.month - b.month);
}

export function checkMonthlyLimit(monthlyLeave: MonthlyLeave[], maxDaysPerMonth: number = 2): boolean {
  return monthlyLeave.every((month) => month.daysUsed <= maxDaysPerMonth);
}

export function getLeaveQuotaForEmployee(
  employeeName: string,
  joinDate: string,
  allLeaveRequests: LeaveRequest[],
  currentDate: Date = new Date(),
  masaKerja: string = ''
): LeaveQuota {
  const employeeRequests = allLeaveRequests.filter(
    (request) => namesMatch(request.nama, employeeName)
  );
  
  const { quota, isFebruaryJoiner, isOverOneYear } = calculateLeaveQuota(joinDate, currentDate);
  const usedDays = calculateDaysUsed(employeeRequests, currentDate.getFullYear());
  const remainingDays = Math.max(0, quota - usedDays);
  const parsedJoinDate = parseIndonesianDate(joinDate);
  
  return {
    employeeName,
    division: '',
    totalQuota: quota,
    usedDays,
    remainingDays,
    joinDate: parsedJoinDate,
    formattedJoinDate: formatToIndonesianDate(parsedJoinDate),
    masaKerja,
    isFebruaryJoiner,
    isOverOneYear,
  };
}

export function getLeaveQuotaForDivision(
  division: string,
  employees: { nama: string; departemen: string; tanggalMasuk: string; masaKerja: string }[],
  allLeaveRequests: LeaveRequest[]
): LeaveQuota[] {
  const divisionEmployees = employees.filter(
    (emp) => cleanField(emp.departemen).toLowerCase() === division.toLowerCase()
  );
  
  return divisionEmployees.map((employee) => {
    const quota = getLeaveQuotaForEmployee(employee.nama, employee.tanggalMasuk, allLeaveRequests, new Date(), employee.masaKerja);
    return { ...quota, division };
  });
}
