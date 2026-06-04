import { NextRequest, NextResponse } from 'next/server';
import { getEmployees, getLeaveRequests } from '@/lib/google-sheets';
import { getLeaveQuotaForDivision } from '@/lib/leave-calculator';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const division = searchParams.get('division');
  
  try {
    const employees = await getEmployees();
    const leaveRequests = await getLeaveRequests();
    
    // If specific division requested (leader view)
    if (division) {
      const divisionData = getLeaveQuotaForDivision(
        division,
        employees.map((emp) => ({
          nama: emp.nama,
          departemen: emp.departemen,
          tanggalMasuk: emp.tanggalMasuk,
        })),
        leaveRequests
      );
      
      return NextResponse.json({
        divisions: [{ name: division, employees: divisionData }],
      });
    }
    
    // Admin view: group all employees by division
    const divisionMap = new Map<string, typeof employees>();
    
    for (const emp of employees) {
      const dept = emp.departemen || 'Unknown';
      if (!divisionMap.has(dept)) {
        divisionMap.set(dept, []);
      }
      divisionMap.get(dept)!.push(emp);
    }
    
    const divisions = Array.from(divisionMap.entries()).map(([dept, emps]) => ({
      name: dept,
      employees: getLeaveQuotaForDivision(
        dept,
        emps.map((emp) => ({
          nama: emp.nama,
          departemen: emp.departemen,
          tanggalMasuk: emp.tanggalMasuk,
        })),
        leaveRequests
      ),
    }));
    
    // Sort by division name
    divisions.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({ divisions });
  } catch (error) {
    console.error('Error fetching division data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch division data' },
      { status: 500 }
    );
  }
}
