'use client';

import { useEffect, useState } from 'react';
import { Users, Calendar, Clock, UserCheck, RefreshCw, Eye, Download, User, Building2, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import DashboardLayout from '@/components/dashboard-layout';
import { StatCard } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { PageLoading } from '@/components/page-loading';
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  DashboardStats, 
  DivisionStats, 
  RecentActivity, 
  CurrentlyOnLeave, 
  TopLeaveUser, 
  LeaveTrend,
  CalendarLeaveEntry 
} from '@/types';

const COLORS = ['#14b8a6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981'];

const DIVISION_COLORS = [
  '#14b8a6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899',
  '#10b981', '#6366f1', '#f97316', '#22d3ee', '#a855f7',
  '#84cc16', '#f43f5e', '#0ea5e9', '#d946ef', '#059669',
];

const defaultStats: DashboardStats = {
  totalEmployees: 0,
  leaveTakenThisMonth: 0,
  totalRemainingQuota: 0,
  currentlyOnLeave: 0,
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl border border-white/20 px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-xs text-muted-foreground mt-1">
          <span className="font-bold" style={{ color: COLORS[index % COLORS.length] }}>{entry.value}</span> {entry.name}
        </p>
      ))}
    </div>
  );
}

function PieChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-xl bg-gradient-to-br from-card to-card/80 border border-primary/10 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="text-sm font-semibold text-foreground">{data.name}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-lg font-bold bg-gradient-to-r from-teal-500 to-purple-500 bg-clip-text text-transparent">
          {data.value}
        </p>
        <p className="text-xs text-muted-foreground">days</p>
      </div>
    </div>
  );
}

interface EmployeeQuota {
  nama: string;
  departemen: string;
  quota: number;
  usedDays: number;
  remaining: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [divisionStats, setDivisionStats] = useState<DivisionStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; days: number }[]>([]);
  const [employeeQuotas, setEmployeeQuotas] = useState<EmployeeQuota[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [currentlyOnLeaveList, setCurrentlyOnLeaveList] = useState<CurrentlyOnLeave[]>([]);
  const [topLeaveUsers, setTopLeaveUsers] = useState<TopLeaveUser[]>([]);
  const [leaveTrend, setLeaveTrend] = useState<LeaveTrend[]>([]);
  const [calendarLeaveData, setCalendarLeaveData] = useState<Record<string, CalendarLeaveEntry[]>>({});
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [isCalendarPopupOpen, setIsCalendarPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();

      if (!response.ok) {
        console.error('API error:', data.error);
        return;
      }

      setStats(data.stats || defaultStats);
      setDivisionStats(data.divisionStats || []);
      setMonthlyData(data.monthlyData || []);
      setEmployeeQuotas(data.employeeQuotas || []);
      setRecentActivity(data.recentActivity || []);
      setCurrentlyOnLeaveList(data.currentlyOnLeaveList || []);
      setTopLeaveUsers(data.topLeaveUsers || []);
      setLeaveTrend(data.leaveTrend || []);
      setCalendarLeaveData(data.calendarLeaveData || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]) {
      console.log('Month clicked:', data.activePayload[0].payload.month);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePieClick = (_: any, index: number) => {
    if (divisionStats[index]) {
      console.log('Division clicked:', divisionStats[index].division);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout title="Dashboard" subtitle="Selamat datang! Berikut ringkasan cuti Anda.">
      {isLoading ? (
        <PageLoading />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="Total Karyawan"
              value={stats.totalEmployees}
              icon={<Users className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="Cuti Terambil Bulan Ini"
              value={stats.leaveTakenThisMonth}
              icon={<Calendar className="w-6 h-6" />}
              color="yellow"
            />
            <StatCard
              title="Total Sisa Cuti"
              value={stats.totalRemainingQuota}
              icon={<Clock className="w-6 h-6" />}
              color="green"
            />
            <StatCard
              title="Sedang Cuti"
              value={stats.currentlyOnLeave}
              icon={<UserCheck className="w-6 h-6" />}
              color="red"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl border border-primary/10 p-4 mb-6 sm:mb-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white text-sm font-medium hover:from-teal-400 hover:to-purple-400 transition-all duration-200 shadow-md shadow-teal-500/25 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <Link
                href="/all-employees"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-foreground text-sm font-medium hover:bg-primary/5 transition-all duration-200"
              >
                <Eye className="w-4 h-4" />
                Lihat Semua Karyawan
              </Link>
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-muted text-muted-foreground text-sm font-medium cursor-not-allowed opacity-50"
              >
                <Download className="w-4 h-4" />
                Export Laporan
              </button>
            </div>
          </div>

          {/* First Row: Monthly Bar + Division Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-card rounded-xl border border-primary/10 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                Penggunaan Cuti per Bulan
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} onClick={handleBarClick}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }} />
                    <Bar
                      dataKey="days"
                      name="days used"
                      fill="url(#barGradient)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                      animationBegin={200}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-primary/10 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                Distribusi Cuti per Divisi
              </h3>
              <div className="flex items-center gap-4">
                {/* Donut Chart */}
                <div className="flex-1 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={divisionStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="totalLeaveTaken"
                        nameKey="division"
                        onClick={handlePieClick}
                        animationDuration={800}
                        animationBegin={400}
                        stroke="none"
                      >
                        {divisionStats.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={DIVISION_COLORS[index % DIVISION_COLORS.length]}
                            className="drop-shadow-sm hover:drop-shadow-lg transition-all duration-200"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieChartTooltip />} />
                      {/* Center text */}
                      <text
                        x="50%"
                        y="45%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-2xl font-bold"
                      >
                        {divisionStats.reduce((sum, d) => sum + d.totalLeaveTaken, 0)}
                      </text>
                      <text
                        x="50%"
                        y="55%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-muted-foreground text-xs"
                      >
                        days taken
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Legend Sidebar */}
                <div className="w-48 shrink-0 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {divisionStats.map((div, index) => {
                    const totalDays = divisionStats.reduce((sum, d) => sum + d.totalLeaveTaken, 0);
                    const percent = totalDays > 0 ? ((div.totalLeaveTaken / totalDays) * 100).toFixed(0) : 0;
                    return (
                      <div key={div.division} className="flex items-center gap-2 group cursor-pointer">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-transparent group-hover:ring-white/50 transition-all"
                          style={{ backgroundColor: DIVISION_COLORS[index % DIVISION_COLORS.length] }}
                        />
                        <span className="text-[11px] text-muted-foreground truncate flex-1 group-hover:text-foreground transition-colors">
                          {div.division}
                        </span>
                        <span className="text-[11px] font-semibold text-foreground tabular-nums">
                          {percent}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: Division Comparison (Full Width) */}
          <div className="bg-card rounded-xl border border-primary/10 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
              Performa Divisi: Terambil vs Tersisa
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={divisionStats} layout="vertical" onClick={handleBarClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="division" 
                    stroke="var(--muted-foreground)" 
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }} />
                  <Legend />
                  <Bar dataKey="totalLeaveTaken" name="Terambil" fill="#14b8a6" radius={[0, 4, 4, 0]} animationDuration={800} />
                  <Bar dataKey="totalRemaining" name="Tersisa" fill="#8b5cf6" radius={[0, 4, 4, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Third Row: Top Users + Leave Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-card rounded-xl border border-primary/10 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                Pengguna Cuti Terbanyak
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topLeaveUsers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="nama" 
                      stroke="var(--muted-foreground)" 
                      fontSize={11}
                      width={120}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }} />
                    <Bar 
                      dataKey="usedDays" 
                      name="hari terpakai"
                      fill="url(#topUsersGradient)" 
                      radius={[0, 4, 4, 0]} 
                      animationDuration={800}
                    />
                    <defs>
                      <linearGradient id="topUsersGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-primary/10 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                Tren Cuti
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leaveTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip content={<ChartTooltip />} />
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="days" 
                      name="hari terpakai"
                      stroke="#14b8a6" 
                      strokeWidth={2}
                      fill="url(#trendGradient)" 
                      animationDuration={800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Fourth Row: Recent Activity + Who's On Leave + Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Recent Activity */}
            <div className="bg-card rounded-xl border border-primary/10 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-4 border-b border-primary/10">
                <h3 className="text-sm sm:text-base font-semibold text-foreground">
                  Aktivitas Terbaru
                </h3>
              </div>
              <div className="p-4">
                {recentActivity.length === 0 ? (
                  <EmptyState icon={Calendar} title="Belum ada aktivitas" />
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-purple-500 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
                          <span className="text-[10px] font-bold text-white">{getInitials(activity.nama)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{activity.nama}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {activity.tanggalCutiPertama}
                            {activity.tanggalCutiKedua && ` - ${activity.tanggalCutiKedua}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Who's On Leave */}
            <div className="bg-card rounded-xl border border-primary/10 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-4 border-b border-primary/10">
                <h3 className="text-sm sm:text-base font-semibold text-foreground">
                  Yang Sedang Cuti Hari Ini
                </h3>
              </div>
              <div className="p-4">
                {currentlyOnLeaveList.length === 0 ? (
                  <EmptyState icon={UserCheck} title="Tidak ada yang sedang cuti hari ini" description="Semua karyawan tersedia" />
                ) : (
                  <div className="space-y-3">
                    {currentlyOnLeaveList.map((employee, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-teal-500/5 to-purple-500/5 border border-primary/10">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-purple-500 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
                          <span className="text-[10px] font-bold text-white">{getInitials(employee.nama)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{employee.nama}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            {employee.departemen}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-teal-600 font-medium">
                          <CalendarDays className="w-2.5 h-2.5" />
                          Sedang Cuti
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar - Compact Sidebar */}
            <div className="bg-card rounded-xl border border-primary/10 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-4 border-b border-primary/10">
                <h3 className="text-sm sm:text-base font-semibold text-foreground">
                  {new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                </h3>
              </div>
              <div className="p-2">
                <div className="grid grid-cols-7 gap-0.5">
                  {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((day, i) => (
                    <div key={`${day}-${i}`} className="text-center text-[9px] font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }).map((_, index) => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    const startingDay = (firstDay.getDay() + 6) % 7;
                    const dayOfMonth = index - startingDay + 1;
                    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                    const isCurrentDay = dayOfMonth === today.getDate();
                    const isValidDay = dayOfMonth >= 1 && dayOfMonth <= daysInMonth;
                    const dayLeaveEntries = calendarLeaveData[`${dayOfMonth}`] || [];
                    const hasLeave = isValidDay && dayLeaveEntries.length > 0;
                    
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          if (isValidDay && hasLeave) {
                            setSelectedDate(dayOfMonth);
                            setIsCalendarPopupOpen(true);
                          }
                        }}
                        className={`
                          min-h-[3rem] flex flex-col items-center justify-start text-[10px] rounded-md transition-all p-0.5
                          ${!isValidDay ? 'text-transparent' : ''}
                          ${isCurrentDay ? 'bg-gradient-to-br from-teal-500 to-purple-500 text-white font-bold shadow-sm shadow-teal-500/25' : ''}
                          ${hasLeave && !isCurrentDay ? 'bg-teal-500/10 border border-teal-500/30 cursor-pointer hover:bg-teal-500/20' : ''}
                          ${isValidDay && !isCurrentDay && !hasLeave ? 'text-foreground hover:bg-muted/50' : ''}
                        `}
                      >
                        <span className={`text-[10px] font-medium ${isCurrentDay ? 'text-white' : ''}`}>
                          {isValidDay ? dayOfMonth : ''}
                        </span>
                        {hasLeave && (
                          <div className="w-full mt-0.5 space-y-0">
                            {dayLeaveEntries.slice(0, 2).map((entry, i) => (
                              <div
                                key={i}
                                className={`text-[6px] leading-tight truncate px-0.5 rounded ${
                                  isCurrentDay 
                                    ? 'text-white/90' 
                                    : 'text-teal-700 dark:text-teal-300'
                                }`}
                              >
                                {entry.nama.split(' ')[0]}
                              </div>
                            ))}
                            {dayLeaveEntries.length > 2 && (
                              <div className={`text-[6px] leading-tight text-center ${
                                isCurrentDay ? 'text-white/80' : 'text-teal-600 dark:text-teal-400'
                              }`}>
                                +{dayLeaveEntries.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Leave Dialog */}
          <Dialog open={isCalendarPopupOpen} onOpenChange={setIsCalendarPopupOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Cuti pada {selectedDate !== null ? `${new Date().toLocaleDateString('id-ID', { month: 'long' })} ${selectedDate}` : ''}
                </DialogTitle>
                <DialogDescription>
                  {selectedDate !== null && calendarLeaveData[`${selectedDate}`]
                    ? `${calendarLeaveData[`${selectedDate}`].length} karyawan sedang cuti`
                    : 'Tidak ada karyawan sedang cuti'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                {selectedDate !== null && calendarLeaveData[`${selectedDate}`]?.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-teal-500/5 to-purple-500/5 border border-primary/10"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-purple-500 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
                      <span className="text-xs font-bold text-white">
                        {entry.nama.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{entry.nama}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {entry.departemen}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-teal-600">{entry.jenisCuti || 'Tahunan'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.tanggalCutiPertama}
                        {entry.tanggalCutiKedua && entry.tanggalCutiKedua !== entry.tanggalCutiPertama && ` - ${entry.tanggalCutiKedua}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Employee Table */}
          <div className="bg-card rounded-xl border border-primary/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="p-4 sm:p-6 border-b border-primary/10">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Status Cuti Karyawan
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 sm:px-6">Nama</TableHead>
                  <TableHead className="px-4 sm:px-6 hidden sm:table-cell">Divisi</TableHead>
                  <TableHead className="px-4 sm:px-6">Kuota</TableHead>
                  <TableHead className="px-4 sm:px-6">Terpakai</TableHead>
                  <TableHead className="px-4 sm:px-6">Tersisa</TableHead>
                  <TableHead className="px-4 sm:px-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeQuotas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState icon={UserCheck} title="Data karyawan belum tersedia" />
                    </TableCell>
                  </TableRow>
                ) : (
                  employeeQuotas.slice(0, 10).map((emp, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-foreground">
                        {emp.nama}
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                        {emp.departemen}
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                        {emp.quota} hari
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                        {emp.usedDays} hari
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                        {emp.remaining} hari
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4">
                        <StatusBadge variant={emp.remaining > 0 ? 'available' : 'exhausted'}>
                          {emp.remaining > 0 ? 'Tersedia' : 'Habis'}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
