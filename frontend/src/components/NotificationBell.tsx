import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/useNotifications';
import { NOTIFICATION_ICONS, NOTIFICATION_TONE } from '@/utils/notificationLabels';
import { cn } from '@/utils/cn';
import type { AppNotification } from '@/types';

const TONE_CLASSES: Record<'default' | 'warning' | 'destructive', string> = {
  default: 'bg-primary/10 text-primary',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  function handleSelect(notification: AppNotification) {
    if (!notification.readAt) {
      markRead.mutate(notification.id);
    }
    if (notification.relatedUrl) {
      navigate(notification.relatedUrl);
    }
  }

  const hasUnread = !!unreadCount && unreadCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium leading-none text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-medium">Notificações</span>
          {hasUnread && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {(!notifications || notifications.length === 0) && (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação por enquanto.
            </div>
          )}

          {notifications?.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type];
            const tone = NOTIFICATION_TONE[notification.type];
            const isUnread = !notification.readAt;

            return (
              <button
                key={notification.id}
                onClick={() => handleSelect(notification)}
                className={cn(
                  'flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-accent/50',
                  isUnread && 'bg-accent/20',
                )}
              >
                <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md', TONE_CLASSES[tone])}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm', isUnread ? 'font-medium' : 'text-muted-foreground')}>
                    {notification.title}
                  </p>
                  {notification.message && (
                    <p className="truncate text-xs text-muted-foreground">{notification.message}</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
