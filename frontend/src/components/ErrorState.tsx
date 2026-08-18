import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/BrandLogo';

interface ErrorStateProps {
  code?: string;
  title: string;
  description: string;
  actionLabel: string;
  action: { to: string } | { onClick: () => void };
}

export function ErrorState({ code, title, description, actionLabel, action }: ErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <BrandLogo className="h-10 w-10" />
      {code && <p className="text-4xl font-bold text-muted-foreground">{code}</p>}
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {'to' in action ? (
        <Button asChild>
          <Link to={action.to}>{actionLabel}</Link>
        </Button>
      ) : (
        <Button onClick={action.onClick}>{actionLabel}</Button>
      )}
    </div>
  );
}
