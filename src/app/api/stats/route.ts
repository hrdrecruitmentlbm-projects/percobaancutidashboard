import { NextRequest, NextResponse } from 'next/server';
import { getEmployees, getLeaveRequests } from '@/lib/google-sheets';
import { calculateLeaveQuota, calculateDaysUsed } from '@/lib/leave-calculator';
import { parseIndonesianDate } from '@/lib/indonesian-date';
import { namesMatch, cleanField } from '@/lib/name-cleaner';

function getDateRangeStart(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case '3months':
      return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    case '6months':
      return new Date(now.getFullYear(), now.getMonth() - 5, 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    case 'all':
    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'year';
    
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
    
    // Filter requests by date range
    const rangeStart = getDateRangeStart(range);
    const filteredRequests = rangeStart
      ? leaveRequests.filter((request) => {
          const pertama = parseIndonesianDate(request.tanggalCutiPertama);
          if (isNaN(pertama.getTime())) return false;
          return pertama.getTime() >= rangeStart.getTime();
        })
      : leaveRequests;
    
    // Filter requests for current month (always needed for stats card)
    const currentMonthRequests = leaveRequests.filter((request) => {
      const date = parseIndonesianDate(request.tanggalCutiPertama);
      return !isNaN(date.getTime()) && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    // Calculate leave taken this month
    const leaveTakenThisMonth = currentMonthRequests.reduce((total, request) => {
      const pertama = parseIndonesianDate(request.tanggalCutiPertama);
      if (isNaN(pertama.getTime())) return total;
      
      const kedua = request.tanggalCutiKedua ? parseIndonesianDate(request.tanggalCutiKedua) : null;
      
      if (kedua && !isNaN(kedua.getTime())) {
        if (pertama.getTime() === kedua.getTime()) {
          return total + 1;
        } else {
          return total + 2;
        }
      }
      return total + 1;
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
    
    // Calculate division stats (based on filtered requests)
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
    
    // Calculate monthly data for chart (based on filtered requests)
    const monthlyData = filteredRequests.reduce((acc, request) => {
      const pertama = parseIndonesianDate(request.tanggalCutiPertama);
      if (isNaN(pertama.getTime())) return acc;
      
      const jenisCuti = cleanField(request.jenisCuti).toLowerCase();
      if (jenisCuti === 'melahirkan') return acc;
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[pertama.getMonth()];
      
      if (!acc[month]) {
        acc[month] = { month, days: 0 };
      }
      
      const kedua = request.tanggalCutiKedua ? parseIndonesianDate(request.tanggalCutiKedua) : null;
      
      if (kedua && !isNaN(kedua.getTime())) {
        if (pertama.getTime() === kedua.getTime()) {
          acc[month].days += 1;
        } else {
          acc[month].days += 2;
        }
      } else {
        acc[month].days += 1;
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
      
      const pertamaDay = new Date(pertama.getFullYear(), pertama.getMonth(), pertama.getDate());
      if (pertamaDay.getTime() === today.getTime()) return true;
      
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
    
    // Top 5 leave users (based on filtered requests)
    const topLeaveUsers = employeeQuotas
      .sort((a, b) => b.usedDays - a.usedDays)
      .slice(0, 5)
      .map((emp) => ({
        nama: emp.nama,
        departemen: emp.departemen,
        usedDays: emp.usedDays,
      }));
    
    // Leave trend - monthly data with employee count (based on filtered requests)
    const leaveTrend = Object.values(monthlyData).map((data) => {
      const monthRequests = filteredRequests.filter((request) => {
        const pertama = parseIndonesianDate(request.tanggalCutiPertama);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return !isNaN(pertama.getTime()) && 
               monthNames[pertama.getMonth()] === data.month;
      });
      
      const uniqueEmployees = new Set(monthRequests.map((r) => r.nama)).size;
      
      return {
        month: data.month,
        days: data.days,
        employees: uniqueEmployees,
      };
    });
    
    // Calendar leave data - map yearMonthKey -> day -> employees (all months)
    const calendarLeaveData = leaveRequests
      .filter((request) => {
        const pertama = parseIndonesianDate(request.tanggalCutiPertama);
        if (isNaN(pertama.getTime())) return false;
        
        const kedua = request.tanggalCutiKedua ? parseIndonesianDate(request.tanggalCutiKedua) : null;
        if (!kedua || isNaN(kedua.getTime())) return true;
        
        return true;
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
        
        const pMonthKey = `${pertama.getFullYear()}-${String(pertama.getMonth() + 1).padStart(2, '0')}`;
        const pDay = `${pertama.getDate()}`;
        if (!acc[pMonthKey]) acc[pMonthKey] = {};
        if (!acc[pMonthKey][pDay]) acc[pMonthKey][pDay] = [];
        acc[pMonthKey][pDay].push(entry);
        
        if (kedua && !isNaN(kedua.getTime()) && kedua.getTime() !== pertama.getTime()) {
          const kMonthKey = `${kedua.getFullYear()}-${String(kedua.getMonth() + 1).padStart(2, '0')}`;
          const kDay = `${kedua.getDate()}`;
          if (!acc[kMonthKey]) acc[kMonthKey] = {};
          if (!acc[kMonthKey][kDay]) acc[kMonthKey][kDay] = [];
          acc[kMonthKey][kDay].push(entry);
        }
        
        return acc;
      }, {} as Record<string, Record<string, { nama: string; departemen: string; jenisCuti: string; tanggalCutiPertama: string; tanggalCutiKedua: string }[]>>);
    
    // Upcoming leave - next 14 days
    const upcomingEnd = new Date(today);
    upcomingEnd.setDate(upcomingEnd.getDate() + 14);
    
    const upcomingLeave = leaveRequests
      .filter((request) => {
        const pertama = parseIndonesianDate(request.tanggalCutiPertama);
        if (isNaN(pertama.getTime())) return false;
        
        const pertamaDay = new Date(pertama.getFullYear(), pertama.getMonth(), pertama.getDate());
        
        // First date must be after today and within 14 days
        return pertamaDay.getTime() > today.getTime() && pertamaDay.getTime() <= upcomingEnd.getTime();
      })
      .sort((a, b) => {
        const dateA = parseIndonesianDate(a.tanggalCutiPertama);
        const dateB = parseIndonesianDate(b.tanggalCutiPertama);
        return dateA.getTime() - dateB.getTime();
      })
      .map((request) => ({
        nama: request.nama,
        departemen: request.departemen,
        tanggalCutiPertama: request.tanggalCutiPertama,
        tanggalCutiKedua: request.tanggalCutiKedua,
      }));
    
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
      upcomingLeave,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
