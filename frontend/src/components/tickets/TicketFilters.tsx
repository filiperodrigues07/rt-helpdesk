import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { useCategories } from '@/hooks/useCategories';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/utils/ticketLabels';
import type { TicketPriority, TicketStatus } from '@/types';

export interface TicketFilterValue {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
  categoryId?: string;
}

interface TicketFiltersProps {
  value: TicketFilterValue;
  onChange: (value: TicketFilterValue) => void;
  showStatus?: boolean;
}

const ALL = '__all__';

export function TicketFilters({ value, onChange, showStatus = true }: TicketFiltersProps) {
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: userService.list });
  const { data: categories } = useCategories();

  const hasActiveFilters = !!(value.search || value.status || value.priority || value.assigneeId || value.categoryId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, nº ou descrição..."
          className="w-64 pl-8"
          value={value.search ?? ''}
          onChange={(event) => onChange({ ...value, search: event.target.value || undefined })}
        />
      </div>

      {showStatus && (
        <Select
          value={value.status ?? ALL}
          onValueChange={(v) => onChange({ ...value, status: v === ALL ? undefined : (v as TicketStatus) })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={value.priority ?? ALL}
        onValueChange={(v) => onChange({ ...value, priority: v === ALL ? undefined : (v as TicketPriority) })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas prioridades</SelectItem>
          {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.assigneeId ?? ALL}
        onValueChange={(v) => onChange({ ...value, assigneeId: v === ALL ? undefined : v })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os responsáveis</SelectItem>
          {users?.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.categoryId ?? ALL}
        onValueChange={(v) => onChange({ ...value, categoryId: v === ALL ? undefined : v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas categorias</SelectItem>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
