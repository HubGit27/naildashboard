// components/scheduler/types.ts

export interface User {
  id: string | number;
  name: string;
  color: string;
  avatar: string;
}

// Renamed from 'Event' to 'SchedulerEvent' to avoid DOM 'Event' type collision
export interface SchedulerEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  color: string;
  userId: string | number;
}

export interface EventForm {
  title: string;
  start: string;
  end: string;
  color: string;
  userId: string | number;
}

export interface MonthDay {
  date: Date;
  isCurrentMonth: boolean;
}
export interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  color: string;
  userId: string | number;
}

export type ViewType = 'day' | 'week' | 'month';
