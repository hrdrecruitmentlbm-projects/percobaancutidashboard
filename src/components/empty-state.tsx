import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-teal-500" />
        </div>
      )}
      <p className="text-foreground font-semibold text-center">{title}</p>
      {description && (
        <p className="text-muted-foreground text-sm text-center mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
