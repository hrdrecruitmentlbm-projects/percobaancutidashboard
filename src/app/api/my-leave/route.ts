import { NextRequest, NextResponse } from 'next/server';
import { getEmployees, getLeaveRequests } from '@/lib/google-sheets';
import { getLeaveQuotaForEmployee } from '@/lib/leave-calculator';
import { namesMatch } from '@/lib/name-cleaner';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }
  
  try {
    const employees = await getEmployees();
    const leaveRequests = await getLeaveRequests();
    
    // Find employee by email
    const employee = employees.find((emp) => emp.email.toLowerCase() === email.toLowerCase());
    
    if (!employee) {
      // Return empty data instead of error (for admin users not in employee list)
      return NextResponse.json({
        employee: null,
        leaveRequests: [],
        quota: null,
      });
    }
    
    // Get leave requests for this employee using name matching
    const employeeLeaveRequests = leaveRequests.filter(
      (request) => namesMatch(request.nama, employee.nama)
    );
    
    // Calculate quota
    const quota = getLeaveQuotaForEmployee(
      employee.nama,
      employee.tanggalMasuk,
      leaveRequests
    );
    
    return NextResponse.json({
      employee,
      leaveRequests: employeeLeaveRequests,
      quota,
    });
  } catch (error) {
    console.error('Error fetching leave data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave data' },
      { status: 500 }
    );
  }
}
