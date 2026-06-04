import { cn } from '@/lib/utils';

const badgeVariants = {
  available: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm',
  exhausted: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm',
  default: 'bg-gradient-to-r from-teal-500 to-purple-500 text-white shadow-sm',
} as const;

interface StatusBadgeProps {
  variant: keyof typeof badgeVariants;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
