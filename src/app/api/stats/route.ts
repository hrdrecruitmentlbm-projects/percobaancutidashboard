import { NextResponse } from 'next/server';
import { getEmployees, getLeaveRequests } from '@/lib/google-sheets';
import { calculateLeaveQuota, calculateDaysUsed } from '@/lib/leave-calculator';
import { parseIndonesianDate } from '@/lib/indonesian-date';
import { namesMatch, cleanField } from '@/lib/name-cleaner';

export async function GET() {
  try {
    const employees = await getEmployees();
    const leaveRequests = await getLeaveRequests();
    
    // Return empty stats if no data
    if (!employees || employees.length === 0) {
      return NextResponse.json({
        stats: {
          totalEmployees: 0,
          leaveTakenThisMonth: 0,
          totalRemainingQuota: 0,
          currentlyOnLeave: 0,
        },
        divisionStats: [],
        monthlyData: [],
        employeeQuotas: [],
      });
    }
    
    // Calculate stats
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filter requests for current month
    const currentMonthRequests = leaveRequests.filter((request) => {
      const date = parseIndonesianDate(request.tanggalCutiPertama);
      return !isNaN(date.getTime()) && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    // Calculate leave taken this month
    const leaveTakenThisMonth = currentMonthRequests.reduce((total, request) => {
      const pertama = parseIndonesianDate(request.tanggalCutiPertama);
      if (isNaN(pertama.getTime())) return total;
      
      const kedua = request.tanggalCutiKedua ? parseIndonesianDate(request.tanggalCutiKedua) : null;
      
      // G and H are two separate leave days, NOT a date range
      if (kedua && !isNaN(kedua.getTime())) {
        if (pertama.getTime() === kedua.getTime()) {
          return total + 1; // Same date = 1 day
        } else {
          return total + 2; // Different dates = 2 days
        }
      }
      return total + 1; // Only first date = 1 day
    }, 0);
    
    // Calculate total remaining quota
    let totalRemainingQuota = 0;
    const employeeQuotas = employees.map((employee) => {
      const { quota } = calculateLeaveQuota(employee.tanggalMasuk);
      const usedDays = calculateDaysUsed(
        leaveRequests.filter((r) => namesMatch(r.nama, employee.nama)),
        currentYear
      );
      const remaining = Math.max(0, quota - usedDays);
      totalRemainingQuota += remaining;
      return { ...employee, quota, usedDays, remaining };
    });
    
    // Calculate division stats
    const divisionStats = employees.reduce((acc, employee) => {
      const division = employee.departemen;
      if (!acc[division]) {
        acc[division] = {
          division,
          totalEmployees: 0,
          totalLeaveTaken: 0,
          totalRemaining: 0,
        };
      }
      acc[division].totalEmployees += 1;
      const empData = employeeQuotas.find((e) => namesMatch(e.nama, employee.nama));
      if (empData) {
        acc[division].totalLeaveTaken += empData.usedDays;
        acc[division].totalRemaining += empData.remaining;
      }
      return acc;
    }, {} as Record<string, { division: string; totalEmployees: number; totalLeaveTaken: number; totalRemaining: number }>);
    
    // Calculate monthly data for chart
    const monthlyData = leaveRequests.reduce((acc, request) => {
      const pertama = parseIndonesianDate(request.tanggalCutiPertama);
      if (isNaN(pertama.getTime())) return acc;
      
      // Year filter: only count current year
      if (pertama.getFullYear() !== currentYear) return acc;
      
      // Skip melahirkan
      const jenisCuti = cleanField(request.jenisCuti).toLowerCase();
      if (jenisCuti === 'melahirkan') return acc;
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[pertama.getMonth()];
      
      if (!acc[month]) {
        acc[month] = { month, days: 0 };
      }
      
      const kedua = request.tanggalCutiKedua ? parseIndonesianDate(request.tanggalCutiKedua) : null;
      
      // G and H are two separate leave days, NOT a date range
      if (kedua && !isNaN(kedua.getTime())) {
        if (pertama.getTime() === kedua.getTime()) {
          acc[month].days += 1; // Same date = 1 day
        } else {
          acc[month].days += 2; // Different dates = 2 days
        }
      } else {
        acc[month].days += 1; // Only first date = 1 day
      }
      
      return acc;
    }, {} as Record<string, { month: string; days: number }>);
    
    // Currently on leave (requests where either date is today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentlyOnLeaveList = leaveRequests.filter((request) => {
      const pertama = parseIndonesianDate(request.tanggalCutiPertama);
      const kedua = request.tanggalCutiKedua ? parseIndonesianDate(request.tanggalCutiKedua) : null;
      
      if (isNaN(pertama.getTime())) return false;
      
      // Check if first date is today
      const pertamaDay = new Date(pertama.getFullYear(), pertama.getMonth(), pertama.getDate());
      if (pertamaDay.getTime() === today.getTime()) return true;
      
      // Check if second date is today
      if (kedua && !isNaN(kedua.getTime())) {
        const keduaDay = new Date(kedua.getFullYear(), kedua.getMonth(), kedua.getDate());
        if (keduaDay.getTime() === today.getTime()) return true;
      }
      
      return false;
    });
    
    const currentlyOnLeave = currentlyOnLeaveList.length;
    
    // Recent activity - last 5 leave requests (most recently submitted)
    const recentActivity = leaveRequests
      .filter((request) => {
        const pertama = parseIndonesianDate(request.tanggalCutiPertama);
        return !isNaN(pertama.getTime());
      })
      .slice(-5)
      .reverse()
      .map((request) => ({
        nama: request.nama,
        departemen: request.departemen,
        tanggalCutiPertama: request.tanggalCutiPertama,
        tanggalCutiKedua: request.tanggalCutiKedua,
        jenisCuti: request.jenisCuti,
        acaraKeperluan: request.acaraKeperluan,
      }));
    
    // Top 5 leave users
    const topLeaveUsers = employeeQuotas
      .sort((a, b) => b.usedDays - a.usedDays)
      .slice(0, 5)
      .map((emp) => ({
        nama: emp.nama,
        departemen: emp.departemen,
        usedDays: emp.usedDays,
      }));
    
    // Leave trend - monthly data with employee count
    const leaveTrend = Object.values(monthlyData).map((data) => {
      const monthRequests = leaveRequests.filter((request) => {
        const pertama = parseIndonesianDate(request.tanggalCutiPertama);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return !isNaN(pertama.getTime()) && 
               pertama.getFullYear() === currentYear && 
               monthNames[pertama.getMonth()] === data.month;
      });
      
      // Count unique employees who took leave this month
      const uniqueEmployees = new Set(monthRequests.map((r) => r.nama)).size;
      
      return {
        month: data.month,
        days: data.days,
        employees: uniqueEmployees,
      };
    });
    
    // Calendar leave data - map day numbers to employees for current month
    const calendarLeaveData = leaveRequests
      .filter((request) => {
        const pertama = parseIndonesianDate(request.tanggalCutiPertama);
        if (isNaN(pertama.getTime())) return false;
        
        const kedua = request.tanggalCutiKedua ? parseIndonesianDate(request.tanggalCutiKedua) : null;
        
        const inCurrentMonth = 
          (pertama.getMonth() === currentMonth && pertama.getFullYear() === currentYear) ||
          (kedua && !isNaN(kedua.getTime()) && kedua.getMonth() === currentMonth && kedua.getFullYear() === currentYear);
        
        return inCurrentMonth;
      })
      .reduce((acc, request) => {
        const pertama = parseIndonesianDate(request.tanggalCutiPertama);
        const kedua = request.tanggalCutiKedua ? parseIndonesianDate(request.tanggalCutiKedua) : null;
        
        const entry = {
          nama: request.nama,
          departemen: request.departemen,
          jenisCuti: request.jenisCuti,
          tanggalCutiPertama: request.tanggalCutiPertama,
          tanggalCutiKedua: request.tanggalCutiKedua,
        };
        
        // Add to first date
        const pKey = `${pertama.getDate()}`;
        if (!acc[pKey]) acc[pKey] = [];
        acc[pKey].push(entry);
        
        // Add to second date if different
        if (kedua && !isNaN(kedua.getTime())) {
          const kKey = `${kedua.getDate()}`;
          if (pKey !== kKey) {
            if (!acc[kKey]) acc[kKey] = [];
            acc[kKey].push(entry);
          }
        }
        
        return acc;
      }, {} as Record<string, { nama: string; departemen: string; jenisCuti: string; tanggalCutiPertama: string; tanggalCutiKedua: string }[]>);
    
    return NextResponse.json({
      stats: {
        totalEmployees: employees.length,
        leaveTakenThisMonth,
        totalRemainingQuota,
        currentlyOnLeave,
      },
      divisionStats: Object.values(divisionStats),
      monthlyData: Object.values(monthlyData),
      employeeQuotas,
      recentActivity,
      currentlyOnLeaveList: currentlyOnLeaveList.map((r) => ({
        nama: r.nama,
        departemen: r.departemen,
        tanggalCutiPertama: r.tanggalCutiPertama,
        tanggalCutiKedua: r.tanggalCutiKedua,
      })),
      topLeaveUsers,
      leaveTrend,
      calendarLeaveData,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
