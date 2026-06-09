import { NextRequest, NextResponse } from 'next/server';
import { getEmployees, getLeaveRequests } from '@/lib/google-sheets';
import { getLeaveQuotaForDivision } from '@/lib/leave-calculator';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  // Support both single `division` and multiple `divisions` params
  const singleDivision = searchParams.get('division');
  const multiDivisions = searchParams.getAll('divisions');
  const requestedDivisions = multiDivisions.length > 0
    ? multiDivisions
    : singleDivision
      ? [singleDivision]
      : [];
  
  try {
    const employees = await getEmployees();
    const leaveRequests = await getLeaveRequests();
    
    // If specific division(s) requested (leader view)
    if (requestedDivisions.length > 0) {
      const divisions = requestedDivisions.map((div) => ({
        name: div,
        employees: getLeaveQuotaForDivision(
          div,
          employees.map((emp) => ({
            nama: emp.nama,
            departemen: emp.departemen,
            tanggalMasuk: emp.tanggalMasuk,
            masaKerja: emp.masaKerja,
          })),
          leaveRequests
        ),
      }));
      
      return NextResponse.json({ divisions });
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
          masaKerja: emp.masaKerja,
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
