'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import { UserSession } from '@/types';
import { getUserFromStorage, canAccessRoute } from '@/lib/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Override route check — if true, skip route access validation */
  skipRouteCheck?: boolean;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  skipRouteCheck = false,
}: DashboardLayoutProps) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = getUserFromStorage();
    
    if (!userData) {
      router.push('/');
      return;
    }

    // Check route access
    if (!skipRouteCheck && !canAccessRoute(userData.role, window.location.pathname)) {
      router.push(userData.role === 'employee' ? '/my-leave' : '/dashboard');
      return;
    }

    setUser(userData);
    setIsLoading(false);
  }, [router, skipRouteCheck]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userRole={user.role}
        userDivisions={user.divisions}
        userEmail={user.email}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
