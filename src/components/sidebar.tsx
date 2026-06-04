'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, Users, UserCheck, LogOut, Menu, X } from 'lucide-react';
import { UserRole } from '@/types';
import { clearUserFromStorage } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole: UserRole;
  userDivision?: string;
  userEmail?: string;
}

export default function Sidebar({ userRole, userDivision, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    clearUserFromStorage();
    router.push('/');
  };

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: userRole === 'admin' || userRole === 'leader' },
    { name: 'Cuti Saya', href: '/my-leave', icon: User, show: true },
    { name: 'Divisi', href: '/division', icon: Users, show: userRole === 'admin' || userRole === 'leader' },
    { name: 'Semua Karyawan', href: '/all-employees', icon: UserCheck, show: userRole === 'admin' },
  ];

  const navItems = navigation.filter((item) => item.show);

  const initials = userEmail
    ? userEmail.split('@')[0].slice(0, 2).toUpperCase()
    : userRole.slice(0, 2).toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 border-b border-white/10 px-4">
        <h1 className="text-xl font-bold gradient-text">Cuti Dashboard</h1>
        {/* Close button — mobile only */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-teal-500/20 to-purple-500/20 text-white shadow-lg shadow-teal-500/10'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-teal-400')} />
              <span>{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-teal-400 to-purple-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/25">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userEmail || userRole}</p>
            <p className="text-xs text-white/50 capitalize">{userRole}{userDivision ? ` · ${userDivision}` : ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 bg-card rounded-lg border border-border shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay + drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden shadow-2xl">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
