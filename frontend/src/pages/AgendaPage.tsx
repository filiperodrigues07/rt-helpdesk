import * as React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppointments } from '@/hooks/useAppointments';
import { useUpdateAppointment } from '@/hooks/useAppointmentMutations';
import { toast } from '@/hooks/use-toast';
import { AppointmentFormDialog } from '@/components/agenda/AppointmentFormDialog';
import { APPOINTMENT_TYPE_COLORS } from '@/utils/appointmentLabels';
import type { Appointment } from '@/types';
import '@/styles/fullcalendar.css';

export function AgendaPage() {
  const [range, setRange] = React.useState<{ start: string; end: string } | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [defaultRange, setDefaultRange] = React.useState<{ start: string; end: string } | null>(null);

  const { data: appointments, isLoading } = useAppointments(range);
  const updateAppointment = useUpdateAppointment();

  const events = React.useMemo(
    () =>
      appointments?.map((appointment) => ({
        id: appointment.id,
        title: appointment.title,
        start: appointment.startsAt,
        end: appointment.endsAt,
        backgroundColor: APPOINTMENT_TYPE_COLORS[appointment.type],
        borderColor: APPOINTMENT_TYPE_COLORS[appointment.type],
      })) ?? [],
    [appointments],
  );

  function handleDatesSet(arg: DatesSetArg) {
    setRange({ start: arg.start.toISOString(), end: arg.end.toISOString() });
  }

  function handleSelect(selectInfo: { start: Date; end: Date }) {
    setSelectedAppointment(null);
    setDefaultRange({ start: selectInfo.start.toISOString(), end: selectInfo.end.toISOString() });
    setDialogOpen(true);
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const appointment = appointments?.find((item) => item.id === clickInfo.event.id);
    if (!appointment) return;
    setSelectedAppointment(appointment);
    setDefaultRange(null);
    setDialogOpen(true);
  }

  async function persistReschedule(id: string, start: Date | null, end: Date | null, revert: () => void) {
    if (!start || !end) {
      revert();
      return;
    }
    try {
      await updateAppointment.mutateAsync({
        id,
        input: { startsAt: start.toISOString(), endsAt: end.toISOString() },
      });
      toast({ title: 'Evento reagendado' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao reagendar evento' });
      revert();
    }
  }

  function handleEventDrop(dropInfo: EventDropArg) {
    persistReschedule(dropInfo.event.id, dropInfo.event.start, dropInfo.event.end, dropInfo.revert);
  }

  function handleEventResize(resizeInfo: EventResizeDoneArg) {
    persistReschedule(resizeInfo.event.id, resizeInfo.event.start, resizeInfo.event.end, resizeInfo.revert);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Agenda</h1>
          <p className="text-sm text-muted-foreground">Suporte, implantação, treinamentos e demais compromissos da equipe.</p>
        </div>
        <Button
          onClick={() => {
            setSelectedAppointment(null);
            setDefaultRange(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo evento
        </Button>
      </div>

      <Card className={isLoading ? 'opacity-60' : undefined}>
        <CardContent className="p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            locale={ptBrLocale}
            height="auto"
            selectable
            selectMirror
            editable
            eventStartEditable
            eventDurationEditable
            eventDisplay="block"
            nowIndicator
            events={events}
            datesSet={handleDatesSet}
            select={handleSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
          />
        </CardContent>
      </Card>

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment}
        defaultRange={defaultRange}
      />
    </div>
  );
}
