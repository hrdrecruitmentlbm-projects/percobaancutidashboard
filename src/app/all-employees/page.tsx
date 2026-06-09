'use client';

import { useEffect, useState } from 'react';
import { Users, Calendar, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import { StatCard } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { PageLoading } from '@/components/page-loading';
import { LeaveQuota } from '@/types';
import { Input } from '@/components/ui/input';
import { UserCheck } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 25;

export default function AllEmployeesPage() {
  const [employees, setEmployees] = useState<LeaveQuota[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<LeaveQuota[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllEmployees = async () => {
    try {
      const response = await fetch('/api/all-employees');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API error:', data.error);
        setEmployees([]);
        setDivisions([]);
        return;
      }
      
      setEmployees(data.employees || []);
      setDivisions(data.divisions || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];
    
    if (selectedDivision !== 'all') {
      filtered = filtered.filter((emp) => emp.division === selectedDivision);
    }
    
    if (searchTerm) {
      filtered = filtered.filter((emp) =>
        emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredEmployees(filtered);
  };

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, selectedDivision, searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDivision, searchTerm]);

  const totalEmployees = filteredEmployees.length;
  const totalLeaveTaken = filteredEmployees.reduce((sum, emp) => sum + emp.usedDays, 0);
  const totalRemaining = filteredEmployees.reduce((sum, emp) => sum + emp.remainingDays, 0);

  // Pagination calculations
  const totalPages = Math.ceil(totalEmployees / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const showStart = totalEmployees > 0 ? startIndex + 1 : 0;
  const showEnd = Math.min(startIndex + ITEMS_PER_PAGE, totalEmployees);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <DashboardLayout title="Semua Karyawan" subtitle="Lihat dan filter data cuti semua karyawan">
      {isLoading ? (
        <PageLoading />
      ) : (
        <>
          {/* Stats */}
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

          {/* Filters */}
          <div className="bg-card rounded-xl border border-primary/10 p-4 mb-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari karyawan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">Semua Divisi</option>
                {divisions.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee Table */}
          <div className="bg-card rounded-xl border border-primary/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="p-4 sm:p-6 border-b border-primary/10">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Daftar Karyawan</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-4 sm:px-6">Nama</TableHead>
                    <TableHead className="px-4 sm:px-6 hidden sm:table-cell">Divisi</TableHead>
                    <TableHead className="px-4 sm:px-6 hidden lg:table-cell">Tanggal Masuk</TableHead>
                    <TableHead className="px-4 sm:px-6 hidden lg:table-cell">Masa Kerja</TableHead>
                    <TableHead className="px-4 sm:px-6">Kuota</TableHead>
                    <TableHead className="px-4 sm:px-6">Terpakai</TableHead>
                    <TableHead className="px-4 sm:px-6">Tersisa</TableHead>
                    <TableHead className="px-4 sm:px-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <EmptyState icon={UserCheck} title="Tidak ada karyawan ditemukan" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEmployees.map((employee, index) => (
                      <TableRow key={startIndex + index} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="px-4 sm:px-6 whitespace-nowrap font-medium text-foreground">
                          {employee.employeeName}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 whitespace-nowrap text-muted-foreground hidden sm:table-cell">
                          {employee.division}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 whitespace-nowrap text-muted-foreground hidden lg:table-cell">
                          {employee.formattedJoinDate}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 whitespace-nowrap text-muted-foreground hidden lg:table-cell">
                          {employee.masaKerja}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 whitespace-nowrap text-muted-foreground">
                          {employee.totalQuota} hari
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 whitespace-nowrap text-muted-foreground">
                          {employee.usedDays} hari
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 whitespace-nowrap text-muted-foreground">
                          {employee.remainingDays} hari
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 whitespace-nowrap">
                          <StatusBadge variant={employee.remainingDays > 0 ? 'available' : 'exhausted'}>
                            {employee.remainingDays > 0 ? 'Tersedia' : 'Habis'}
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            {totalEmployees > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-primary/10 gap-3">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {showStart}-{showEnd} dari {totalEmployees} karyawan
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {getPageNumbers().map((page, index) =>
                    typeof page === 'string' ? (
                      <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground text-sm">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 p-0 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-teal-500 to-purple-500 text-white border-0 shadow-md shadow-teal-500/25'
                            : ''
                        }`}
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
