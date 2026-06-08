import { google } from 'googleapis';
import { Employee, LeaveRequest, Leader } from '@/types';
import { cleanField } from './name-cleaner';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// In-memory cache with 60-second TTL
const CACHE_TTL = 60 * 1000;
interface CacheEntry<T> { data: T; timestamp: number }
const cache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function getEmployees(): Promise<Employee[]> {
  const cached = getFromCache<Employee[]>('employees');
  if (cached) return cached;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'DATABASE KARYAWAN!A2:H',
    });

    const rows = response.data.values || [];
    
    const employees = rows.map((row) => ({
      nama: cleanField(row[1] || ''),
      nik: cleanField(row[2] || ''),
      masaKerja: cleanField(row[3] || ''),
      departemen: cleanField(row[4] || ''),
      liniBisnis: cleanField(row[5] || ''),
      tanggalMasuk: cleanField(row[7] || ''),
      email: cleanField(row[6] || ''),
    })).filter((employee) => employee.nama && employee.email);

    setCache('employees', employees);
    return employees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const cached = getFromCache<LeaveRequest[]>('leaveRequests');
  if (cached) return cached;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Inputan Cuti!A7:L',
    });

    const rows = response.data.values || [];
    
    const requests = rows.map((row) => ({
      nama: cleanField(row[1] || ''),
      nik: cleanField(row[2] || ''),
      masaKerja: cleanField(row[3] || ''),
      departemen: cleanField(row[4] || ''),
      liniBisnis: cleanField(row[5] || ''),
      tanggalCutiPertama: cleanField(row[6] || ''),
      tanggalCutiKedua: cleanField(row[7] || ''),
      jenisCuti: cleanField(row[9] || ''),
      acaraKeperluan: cleanField(row[10] || ''),
      lampiran: cleanField(row[11] || ''),
    })).filter((request) => {
      return !!request.nama;
    });

    setCache('leaveRequests', requests);
    return requests;
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    throw error;
  }
}

export async function getLeaders(): Promise<Leader[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leaders!A:B',
    });

    const rows = response.data.values || [];
    
    // Skip header row (first row)
    return rows.slice(1).map((row) => ({
      division: row[0] || '',
      email: row[1] || '',
    })).filter((leader) => leader.division && leader.email);
  } catch (error) {
    console.warn('Warning: Could not fetch leaders sheet. Returning empty array.', error);
    return [];
  }
}

export async function getUserRole(email: string): Promise<{ role: 'admin' | 'leader' | 'employee'; divisions?: string[] }> {
  const leaders = await getLeaders();
  
  const leaderMatches = leaders.filter((leader) => leader.email.toLowerCase() === email.toLowerCase());
  if (leaderMatches.length > 0) {
    return { role: 'leader', divisions: leaderMatches.map((l) => l.division) };
  }
  
  return { role: 'employee' };
}
