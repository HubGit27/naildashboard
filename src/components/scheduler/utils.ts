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

/**
 * Improved overlap detection that properly handles complex overlapping scenarios
 */
export const getOverlappingAppointmentsLayout = (appointments: SchedulerAppointment[]): OverlapAppointment[] => {
  if (appointments.length === 0) return [];
  
  // Sort appointments by start time
  const sortedAppointments = [...appointments].sort((a, b) => a.start.getTime() - b.start.getTime());
  
  // Create events for start and end times to track active appointments at any point
  interface TimeEvent {
    time: number;
    type: 'start' | 'end';
    appointmentId: string;
  }
  
  const events: TimeEvent[] = [];
  sortedAppointments.forEach(apt => {
    events.push({ time: apt.start.getTime(), type: 'start', appointmentId: apt.id });
    events.push({ time: apt.end.getTime(), type: 'end', appointmentId: apt.id });
  });
  
  // Sort events by time, with 'end' events before 'start' events at the same time
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.type === 'end' ? -1 : 1;
  });
  
  // Track maximum concurrent appointments
  let maxConcurrent = 0;
  let currentActive = new Set<string>();
  
  events.forEach(event => {
    if (event.type === 'start') {
      currentActive.add(event.appointmentId);
      maxConcurrent = Math.max(maxConcurrent, currentActive.size);
    } else {
      currentActive.delete(event.appointmentId);
    }
  });
  
  // Now assign columns using a more sophisticated algorithm
  const result: OverlapAppointment[] = [];
  const appointmentColumns = new Map<string, number>();
  
  // Reset for column assignment
  currentActive.clear();
  const availableColumns: boolean[] = new Array(maxConcurrent).fill(true);
  
  events.forEach(event => {
    if (event.type === 'start') {
      // Find the first available column
      let column = 0;
      while (!availableColumns[column]) {
        column++;
      }
      
      appointmentColumns.set(event.appointmentId, column);
      availableColumns[column] = false;
      currentActive.add(event.appointmentId);
      
    } else {
      // Free up the column
      const column = appointmentColumns.get(event.appointmentId);
      if (column !== undefined) {
        availableColumns[column] = true;
      }
      currentActive.delete(event.appointmentId);
    }
  });
  
  // Calculate width and position for each appointment
  sortedAppointments.forEach(appointment => {
    const column = appointmentColumns.get(appointment.id) || 0;
    
    // Find the maximum number of concurrent appointments during this appointment's duration
    let maxConcurrentDuringThis = 1;
    sortedAppointments.forEach(other => {
      if (other.id !== appointment.id && 
          appointment.start < other.end && 
          appointment.end > other.start) {
        maxConcurrentDuringThis++;
      }
    });
    
    // Calculate actual concurrent appointments at different time points
    let actualMaxConcurrent = 1;
    const checkPoints = [appointment.start.getTime()];
    
    // Add all start/end times of overlapping appointments as check points
    sortedAppointments.forEach(other => {
      if (other.id !== appointment.id &&
          appointment.start < other.end && 
          appointment.end > other.start) {
        checkPoints.push(other.start.getTime());
        checkPoints.push(other.end.getTime());
      }
    });
    
    // Check concurrent count at each point during this appointment
    checkPoints.forEach(checkTime => {
      if (checkTime >= appointment.start.getTime() && checkTime < appointment.end.getTime()) {
        let concurrent = 0;
        sortedAppointments.forEach(other => {
          if (checkTime >= other.start.getTime() && checkTime < other.end.getTime()) {
            concurrent++;
          }
        });
        actualMaxConcurrent = Math.max(actualMaxConcurrent, concurrent);
      }
    });
    
    const width = 100 / actualMaxConcurrent;
    const left = column * width;
    
    result.push({
      ...appointment,
      left,
      width,
      column
    });
  });
  
  return result;
};