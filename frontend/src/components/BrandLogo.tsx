import { useLogo } from '@/hooks/useLogo';
import { resolveUploadUrl } from '@/utils/apiOrigin';
import defaultLogo from '@/assets/logo.png';
import { cn } from '@/utils/cn';

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
  const { data: logoUrl } = useLogo();

  return (
    <img
      src={resolveUploadUrl(logoUrl) ?? defaultLogo}
      alt="RT HELPDESK"
      className={cn('object-contain', className)}
    />
  );
}
