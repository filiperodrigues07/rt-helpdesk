import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  description: string;
  tone?: 'default' | 'warning' | 'destructive';
}

const TONE_CLASSES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-primary bg-primary/10',
  warning: 'text-warning bg-warning/10',
  destructive: 'text-destructive bg-destructive/10',
};

export function StatCard({ icon: Icon, label, value, description, tone = 'default' }: StatCardProps) {
  return (
    <Card className="transition-transform hover:-translate-y-0.5">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-[1.75rem] font-semibold leading-none tabular-nums">{value}</p>
          <p className="mt-2 truncate text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', TONE_CLASSES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
