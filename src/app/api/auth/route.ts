import { NextRequest, NextResponse } from 'next/server';
import { getLeaders, getEmployees } from '@/lib/google-sheets';

const ADMIN_EMAILS = ['hrd.recruitmentlbm@gmail.com'];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email } = body;
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email wajib diisi' },
      { status: 400 }
    );
  }
  
  try {
    // 1. Check admin emails FIRST - bypass all checks
    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json({
        email,
        role: 'admin',
        division: undefined,
      });
    }
    
    // 2. Try to get leaders and employees (with error handling)
    let leaders: { division: string; email: string }[] = [];
    let employees: { nama: string; email: string }[] = [];
    
    try {
      leaders = await getLeaders();
    } catch (error) {
      console.warn('Warning: Could not fetch leaders:', error);
      // Continue without leaders data
    }
    
    try {
      employees = await getEmployees();
    } catch (error) {
      console.warn('Warning: Could not fetch employees:', error);
      // Continue without employees data
    }
    
    // 3. Check if user is a leader
    const leaderMatch = leaders.find((leader) => leader.email.toLowerCase() === email.toLowerCase());
    if (leaderMatch) {
      return NextResponse.json({
        email,
        role: 'leader',
        division: leaderMatch.division,
      });
    }
    
    // 4. Check if user is an employee
    const employee = employees.find((emp) => emp.email.toLowerCase() === email.toLowerCase());
    if (employee) {
      return NextResponse.json({
        email,
        role: 'employee',
        division: undefined,
      });
    }
    
    // 5. Email not found in any list
    return NextResponse.json(
      { error: 'Email tidak ditemukan. Silakan periksa alamat email Anda.' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan autentikasi. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
