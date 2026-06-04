'use client';

import { useEffect, useState } from 'react';
import { Users, Calendar, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import { StatCard } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { PageLoading } from '@/components/page-loading';
import { LeaveQuota } from '@/types';
import { getUserFromStorage } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DivisionGroup {
  name: string;
  employees: LeaveQuota[];
}

export default function DivisionPage() {
  const [divisions, setDivisions] = useState<DivisionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<string>('');
  const [userDivision, setUserDivision] = useState<string>('');

  const fetchDivisionData = async (url: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Gagal memuat data divisi');
        return;
      }
      
      const divs: DivisionGroup[] = data.divisions || [];
      setDivisions(divs);
      setExpandedDivisions(new Set(divs.map((d) => d.name)));
    } catch (err) {
      console.error('Error fetching division data:', err);
      setError('Gagal memuat data divisi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userData = getUserFromStorage();
    if (userData) {
      setUserRole(userData.role);
      setUserDivision(userData.division || '');
      
      const url = userData.division
        ? `/api/division?division=${encodeURIComponent(userData.division)}`
        : '/api/division';
      fetchDivisionData(url);
    }
  }, []);

  const toggleDivision = (name: string) => {
    setExpandedDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const isAdmin = userRole === 'admin';
  const totalEmployees = divisions.reduce((sum, d) => sum + d.employees.length, 0);
  const totalLeaveTaken = divisions.reduce((sum, d) => sum + d.employees.reduce((s, e) => s + e.usedDays, 0), 0);
  const totalRemaining = divisions.reduce((sum, d) => sum + d.employees.reduce((s, e) => s + e.remainingDays, 0), 0);

  return (
    <DashboardLayout
      title="Laporan Divisi"
      subtitle={isAdmin ? 'Ringkasan semua divisi' : `${userDivision} - Ringkasan cuti divisi Anda`}
    >
      {isLoading ? (
        <PageLoading />
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-3">{error}</p>
            <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <StatCard
              title="Total Karyawan"
              value={totalEmployees}
              icon={<Users className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="Total Cuti Terambil"
              value={`${totalLeaveTaken} hari`}
              icon={<Calendar className="w-6 h-6" />}
              color="yellow"
            />
            <StatCard
              title="Total Tersisa"
              value={`${totalRemaining} hari`}
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
            />
          </div>

          {/* Admin: Expand/Collapse controls */}
          {isAdmin && divisions.length > 1 && (
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => setExpandedDivisions(new Set(divisions.map((d) => d.name)))}>
                Buka Semua
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExpandedDivisions(new Set())}>
                Tutup Semua
              </Button>
            </div>
          )}

          {/* Division Sections */}
          <div className="space-y-4">
            {divisions.length === 0 ? (
              <EmptyState icon={Users} title="Data divisi tidak ditemukan" />
            ) : (
              divisions.map((div) => {
                const isExpanded = expandedDivisions.has(div.name);
                const divTaken = div.employees.reduce((s, e) => s + e.usedDays, 0);
                const divRemaining = div.employees.reduce((s, e) => s + e.remainingDays, 0);
                
                return (
                  <div key={div.name} className="bg-card rounded-xl border border-primary/10 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                    <button
                      onClick={() => toggleDivision(div.name)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gradient-to-r hover:from-teal-500/5 hover:to-purple-500/5 transition-all duration-300 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                        <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">{div.name}</h3>
                        <span className="text-sm text-muted-foreground shrink-0">
                          {div.employees.length} karyawan
                        </span>
                      </div>
                      <div className="flex gap-4 sm:gap-6 text-sm shrink-0 ml-4">
                        <span className="text-yellow-600 font-medium">{divTaken} terambil</span>
                        <span className="text-green-600 font-medium">{divRemaining} tersisa</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="px-4 sm:px-6">Nama</TableHead>
                                <TableHead className="px-4 sm:px-6">Kuota</TableHead>
                                <TableHead className="px-4 sm:px-6">Terpakai</TableHead>
                                <TableHead className="px-4 sm:px-6">Tersisa</TableHead>
                                <TableHead className="px-4 sm:px-6">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {div.employees.map((employee, index) => (
                                <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                    {employee.employeeName}
                                  </TableCell>
                                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {employee.totalQuota} hari
                                  </TableCell>
                                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {employee.usedDays} hari
                                  </TableCell>
                                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {employee.remainingDays} hari
                                  </TableCell>
                                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                    <StatusBadge variant={employee.remainingDays > 0 ? 'available' : 'exhausted'}>
                                      {employee.remainingDays > 0 ? 'Tersedia' : 'Habis'}
                                    </StatusBadge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
