import { NextResponse } from 'next/server';
import { getEmployees, getLeaveRequests } from '@/lib/google-sheets';
import { getLeaveQuotaForEmployee } from '@/lib/leave-calculator';

export async function GET() {
  try {
    const employees = await getEmployees();
    const leaveRequests = await getLeaveRequests();
    
    // Get leave quota for all employees
    const now = new Date();
    const employeeQuotas = employees.map((employee) => {
      const quota = getLeaveQuotaForEmployee(
        employee.nama,
        employee.tanggalMasuk,
        leaveRequests,
        now
      );
      
      return {
        ...quota,
        division: employee.departemen,
      };
    });
    
    // Get unique divisions
    const divisions = [...new Set(employees.map((emp) => emp.departemen))].filter(Boolean);
    
    return NextResponse.json({
      employees: employeeQuotas,
      divisions,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
