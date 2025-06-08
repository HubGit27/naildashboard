// components/scheduler/views/MonthView.tsx
"use client";

import React from 'react';
import { Event } from '../types';
import { getMonthDays } from '../utils';

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  onDayClick: (date: Date) => void;
  // Future: onEventClick
}

export const MonthView: React.FC<MonthViewProps> = ({ currentDate, events, onDayClick }) => {
  const monthDays = getMonthDays(currentDate);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b">
        {weekdays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {monthDays.map(({ date, isCurrentMonth }, index) => {
          const eventsOnDay = events.filter(e => e.start.toDateString() === date.toDateString());
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`border-t border-l p-2 flex flex-col cursor-pointer hover:bg-blue-50 transition-colors ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}`}
              onClick={() => onDayClick(date)}
            >
              <span className={`self-end w-7 h-7 flex items-center justify-center rounded-full text-sm ${isToday ? 'bg-blue-600 text-white font-bold' : ''}`}>
                {date.getDate()}
              </span>
              <div className="flex-1 mt-1 overflow-hidden">
                {eventsOnDay.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className="text-xs text-white rounded px-1 py-0.5 mb-1 truncate"
                    style={{ backgroundColor: event.color }}
                  >
                    {event.title}
                  </div>
                ))}
                {eventsOnDay.length > 2 && (
                  <div className="text-xs text-gray-600">
                    + {eventsOnDay.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
