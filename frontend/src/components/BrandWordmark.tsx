import { cn } from '@/utils/cn';

interface BrandWordmarkProps {
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}

export function BrandWordmark({ className, primaryClassName, secondaryClassName }: BrandWordmarkProps) {
  return (
    <span className={cn('inline-flex min-w-0 items-baseline gap-1.5 whitespace-nowrap', className)}>
      <span className={cn('font-bold', primaryClassName)}>RT</span>
      <span className={cn('font-medium', secondaryClassName)}>Helpdesk</span>
    </span>
  );
}
