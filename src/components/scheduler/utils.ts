// components/scheduler/utils.ts

import { MonthDay, SchedulerAppointment } from './types';

export const getAppointmentColor = (status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'waiting'): string => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return '#60a5fa'; // Soft blue - gentler than bright blue
    case 'confirmed':
      return '#2dd4bf'; // Soft teal - muted teal shade
    case 'in_progress':
      return '#fb923c'; // Soft orange - warmer, less harsh
    case 'completed':
      return '#4ade80'; // Soft green - pleasant success color
    case 'cancelled':
      return '#9ca3af'; // Soft gray - same gentle gray
    case 'no_show':
      return '#f87171'; // Soft red - less aggressive red
    case 'waiting':
      return '#fbbf24'; // Soft yellow - warm, gentle yellow
    default:
      return '#9ca3af'; // Soft gray fallback
  }
};

/**
 * Generates an array of time slots for a 24-hour day.
 * @param interval - The interval in minutes between each slot (e.g., 15, 30, 60).
 * @returns An array of strings representing time slots (e.g., "09:00").
 */
export const generateTimeSlots = (startHour: number, endHour: number, interval: number = 60): string[] => {
  const slots: string[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const date = new Date();
      date.setHours(hour, minute);
      slots.push(date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }
  }
  return slots;
};

/**
 * Gets all the dates for the week of a given date.
 * @param date - The reference date.
 * @returns An array of 7 Date objects, starting from Sunday.
 */
export const getWeekDays = (date: Date): Date[] => {
  const start = new Date(date);
  const dayOfWeek = start.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const diff = start.getDate() - dayOfWeek;
  start.setDate(diff);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const weekDay = new Date(start);
    weekDay.setDate(start.getDate() + i);
    days.push(weekDay);
  }
  return days;
};

/**
 * Generates the calendar grid for a given month.
 * @param date - The reference date.
 * @returns An array of 42 MonthDay objects, representing a 6x7 grid.
 */
export const getMonthDays = (date: Date): MonthDay[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const days: MonthDay[] = [];

  // Days from the previous month to fill the grid's start
  for (let i = 0; i < firstDayOfWeek; i++) {
    const day = new Date(year, month, i - firstDayOfWeek + 1);
    days.push({ date: day, isCurrentMonth: false });
  }

  // Days of the current month
  for (let i = 1; i <= daysInMonth; i++) {
    const day = new Date(year, month, i);
    days.push({ date: day, isCurrentMonth: true });
  }

  // Days from the next month to fill the grid's end
  const gridCells = 42; // 6 weeks * 7 days
  const remaining = gridCells - days.length;
  for (let i = 1; i <= remaining; i++) {
    const day = new Date(year, month + 1, i);
    days.push({ date: day, isCurrentMonth: false });
  }

  return days;
};


/**
 * Formats the date header based on the current view.
 * @param date - The current date.
 * @param view - The current view ('day', 'week', 'month').
 * @returns A formatted string for the header.
 */
export const formatDateHeader = (date: Date, view: 'day' | 'week' | 'month'): string => {
  if (view === 'day') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  if (view === 'week') {
    const weekStart = getWeekDays(date)[0];
    const weekEnd = getWeekDays(date)[6];
    return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }
  if (view === 'month') {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }
  return '';
};

export interface OverlapAppointment extends SchedulerAppointment {
  left: number;
  width: number;
  column: number;
}

export const getOverlappingAppointmentsLayout = (appointments: SchedulerAppointment[]): OverlapAppointment[] => {
  const sortedAppointments = [...appointments].sort((a, b) => a.start.getTime() - b.start.getTime());
  const columns: OverlapAppointment[][] = [];

  sortedAppointments.forEach(appointment => {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      // Check if the current appointment overlaps with any in this column
      const overlaps = column.some(existing => (
        appointment.start < existing.end && appointment.end > existing.start
      ));

      if (!overlaps) {
        // Place the appointment in this column
        columns[i].push({ ...appointment, column: i, left: 0, width: 0 });
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Create a new column for this appointment
      columns.push([{ ...appointment, column: columns.length, left: 0, width: 0 }]);
    }
  });

  const result: OverlapAppointment[] = [];
  columns.forEach(column => {
    column.forEach(appointment => {
      const overlappingAppointmentsInTime = sortedAppointments.filter(other => (
        appointment.start < other.end && appointment.end > other.start
      ));

      const maxOverlaps = overlappingAppointmentsInTime.reduce((max, current) => {
        const currentOverlaps = sortedAppointments.filter(o => (
          current.start < o.end && current.end > o.start
        )).length;
        return Math.max(max, currentOverlaps);
      }, 1);

      const width = 100 / maxOverlaps;
      const left = appointment.column * width;

      result.push({
        ...appointment,
        left,
        width,
      });
    });
  });

  return result;
};
