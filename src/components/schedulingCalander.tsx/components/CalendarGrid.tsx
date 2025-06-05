import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';

interface CalendarGridProps {
  view: 'day' | 'week' | 'month';
  date: Date;
  employees: Employee[];
  appointments: Appointment[];
}

export function CalendarGrid({ view, date, employees, appointments }: CalendarGridProps) {
  switch (view) {
    case 'day':
      return <DayView date={date} employees={employees} appointments={appointments} />;
    case 'week':
      return <WeekView date={date} employees={employees} appointments={appointments} />;
    case 'month':
      return <MonthView date={date} employees={employees} appointments={appointments} />;
    default:
      return <WeekView date={date} employees={employees} appointments={appointments} />;
  }
}