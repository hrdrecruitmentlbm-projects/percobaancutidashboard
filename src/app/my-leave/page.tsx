'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import { StatCard } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { PageLoading } from '@/components/page-loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { LeaveRequest, LeaveQuota } from '@/types';
import { getUserFromStorage } from '@/lib/auth';
import { parseIndonesianDate } from '@/lib/indonesian-date';

export default function MyLeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [quota, setQuota] = useState<LeaveQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyLeave = async (email: string) => {
    try {
      const response = await fetch(`/api/my-leave?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (!response.ok) {
        setLeaveRequests([]);
        setQuota(null);
        return;
      }
      
      setLeaveRequests(data.leaveRequests || []);
      setQuota(data.quota || null);
    } catch (error) {
      console.error('Error fetching leave data:', error);
      setError('Gagal memuat data cuti');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userData = getUserFromStorage();
    if (userData) {
      fetchMyLeave(userData.email);
    }
  }, []);

  return (
    <DashboardLayout title="Cuti Saya" subtitle="Lihat riwayat cuti dan sisa kuota Anda">
      {isLoading ? (
        <PageLoading />
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">{error}</p>
        </div>
      ) : !quota ? (
        <EmptyState
          icon={Calendar}
          title="Data karyawan tidak ditemukan"
          description="Email Anda mungkin belum terdaftar dalam sistem."
        />
      ) : (
        <>
          {/* Quota Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              title={`Kuota Cuti (${new Date().getFullYear()})`}
              value={`${quota.totalQuota} hari`}
              icon={<Calendar className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title={`Terpakai (${new Date().getFullYear()})`}
              value={`${quota.usedDays} hari`}
              icon={<Clock className="w-6 h-6" />}
              color="yellow"
            />
            <StatCard
              title={`Tersisa (${new Date().getFullYear()})`}
              value={`${quota.remainingDays} hari`}
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
            />
          </div>

          {/* Leave History */}
          <div className="bg-card rounded-xl border border-primary/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="p-4 sm:p-6 border-b border-primary/10">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Riwayat Cuti</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-4 sm:px-6">Tanggal</TableHead>
                    <TableHead className="px-4 sm:px-6">Durasi</TableHead>
                    <TableHead className="px-4 sm:px-6">Jenis</TableHead>
                    <TableHead className="px-4 sm:px-6">Keperluan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyState icon={Calendar} title="Tidak ada pengajuan cuti" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaveRequests.map((request, index) => (
                      <TableRow key={index}>
                        <TableCell className="px-4 sm:px-6">
                          {request.tanggalCutiPertama}
                          {request.tanggalCutiKedua && ` - ${request.tanggalCutiKedua}`}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6">
                          {calculateDuration(request.tanggalCutiPertama, request.tanggalCutiKedua)}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6">
                          <StatusBadge variant="default">
                            {request.jenisCuti || 'Tahunan'}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="px-4 sm:px-6">
                          {request.acaraKeperluan}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function calculateDuration(start: string, end?: string): string {
  if (!end) return '1 day';
  
  const startDate = parseIndonesianDate(start);
  const endDate = parseIndonesianDate(end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '1 day';
  
  // G and H are two separate leave days, NOT a date range
  // Same date = 1 day, different dates = 2 days
  return startDate.getTime() === endDate.getTime() ? '1 hari' : '2 hari';
}
