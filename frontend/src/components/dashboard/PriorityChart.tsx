import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import type { TicketPriority } from '@/types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/utils/ticketLabels';

interface PriorityChartProps {
  data: { priority: TicketPriority; count: number }[];
}

const ORDER: TicketPriority[] = ['BAIXA', 'NORMAL', 'ALTA', 'CRITICA'];

export function PriorityChart({ data }: PriorityChartProps) {
  const chartData = ORDER.map((priority) => ({
    priority,
    label: PRIORITY_LABELS[priority],
    count: data.find((row) => row.priority === priority)?.count ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" name="Chamados" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
