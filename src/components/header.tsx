'use client';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="flex items-center justify-between h-16 px-4 sm:px-6 bg-gradient-to-r from-teal-500/5 to-purple-500/5 border-b border-primary/10">
      <div className="pl-10 lg:pl-0">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
        )}
      </div>
      
      <div className="text-right shrink-0">
        <p className="text-xs font-medium text-muted-foreground hidden sm:block">Hari Ini</p>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
