import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveUploadUrl } from '@/utils/apiOrigin';
import { cn } from '@/utils/cn';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}

export function UserAvatar({ name, avatarUrl, className }: UserAvatarProps) {
  return (
    <Avatar className={cn('h-8 w-8', className)}>
      <AvatarImage src={resolveUploadUrl(avatarUrl)} alt={name} />
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
