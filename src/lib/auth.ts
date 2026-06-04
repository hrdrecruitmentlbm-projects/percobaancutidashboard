import { UserSession, UserRole } from '@/types';

export function getUserFromStorage(): UserSession | null {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('userSession');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

export function setUserToStorage(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userSession', JSON.stringify(session));
  document.cookie = `userSession=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearUserFromStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('userSession');
  document.cookie = 'userSession=; path=/; max-age=0; SameSite=Lax';
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  switch (route) {
    case '/dashboard':
      return userRole === 'admin' || userRole === 'leader';
    case '/my-leave':
      return true;
    case '/division':
      return userRole === 'admin' || userRole === 'leader';
    case '/all-employees':
      return userRole === 'admin';
    default:
      return false;
  }
}
