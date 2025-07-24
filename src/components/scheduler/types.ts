// components/scheduler/types.ts

export interface User {
  id: string | number;
  name: string;
  color: string;
  avatar: string;
}

// Renamed from 'Event' to 'SchedulerAppointment' to avoid DOM 'Event' type collision
export interface SchedulerAppointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  userId: string | number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'waiting';
}

export interface AppointmentForm {
  title: string;
  start: string;
  end: string;
  userId: string | number;
}

export interface MonthDay {
  date: Date;
  isCurrentMonth: boolean;
}

export type ViewType = 'day' | 'week' | 'month';
