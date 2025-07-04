// components/scheduler/views/WeekView.tsx
"use client";

import React, { useState, useRef, useCallback } from 'react';
import { SchedulerEvent } from '../types';
import { getWeekDays, generateTimeSlots } from '../utils';

interface WeekViewProps {
  currentDate: Date;
  events: SchedulerEvent[];
  isDragging: boolean;
  draggedEvent: SchedulerEvent | null;
  onEventClick: (event: SchedulerEvent) => void;
  onDragStart: (event: React.DragEvent, schedulerEvent: SchedulerEvent) => void;
  onDragEnd: () => void;
  onDrop: (targetDate: Date, targetTime: string) => void;
}

const HOUR_ROW_HEIGHT = 60; // in pixels
const DROP_INTERVAL = 15; // Drop sensitivity in minutes

const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

export const WeekView: React.FC<WeekViewProps> = ({ currentDate, events, isDragging, draggedEvent, onEventClick, onDragStart, onDragEnd, onDrop }) => {
  const weekDays = getWeekDays(currentDate);
  const hourTimeSlots = generateTimeSlots(60);

  const [dragOverInfo, setDragOverInfo] = useState<{ date: Date; time: string } | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState(0);

  const dayColumnRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleLocalDragStart = (e: React.DragEvent<HTMLDivElement>, event: SchedulerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    setDragStartOffset(offset);
    onDragStart(e, event);
  };

  const calculateDropTime = (e: React.DragEvent, dayIndex: number): string => {
    const dayColumn = dayColumnRefs.current[dayIndex];
    if (!dayColumn) return "00:00";

    const rect = dayColumn.getBoundingClientRect();
    const offsetY = e.clientY - rect.top - dragStartOffset -50;
    
    const totalMinutes = Math.max(0, (offsetY / HOUR_ROW_HEIGHT) * 60);
    const interval = Math.floor(totalMinutes / DROP_INTERVAL) * DROP_INTERVAL;
    const hour = Math.floor(interval / 60).toString().padStart(2, '0');
    const minute = (interval % 60).toString().padStart(2, '0');
    
    return `${hour}:${minute}`;
  };

  const handleDragOver = (e: React.DragEvent, date: Date, dayIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const time = calculateDropTime(e, dayIndex);
    if (!dragOverInfo || !isSameDay(dragOverInfo.date, date) || dragOverInfo.time !== time) {
      setDragOverInfo({ date, time });
    }
  };

  const handleDragLeave = () => {
    setDragOverInfo(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date, dayIndex: number) => {
    e.preventDefault();
    const time = calculateDropTime(e, dayIndex);
    onDrop(date, time);
    setDragOverInfo(null);
    setDragStartOffset(0);
  };

  const getEventStyle = (event: SchedulerEvent): React.CSSProperties => {
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const durationHours = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    const top = startHour * HOUR_ROW_HEIGHT;
    const height = durationHours * HOUR_ROW_HEIGHT;

    return {
      position: 'absolute',
      top: `${top}px`,
      height: `${height}px`,
      left: '4px',
      right: '4px',
      backgroundColor: event.color,
      zIndex: 20,
      opacity: isDragging ? 0.5 : 1
    };
  };

  return (
    <div className="flex h-full bg-white">
      <div className="w-16 flex-shrink-0 border-r border-gray-200">
        <div className="h-14 border-b"></div>
        {hourTimeSlots.map(time => (
          <div key={time} className="h-[60px] text-center text-xs text-gray-500 pt-1 border-t">
            {time}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7">
        {weekDays.map((day, index) => (
          <div 
            key={day.toISOString()} 
            ref={el => dayColumnRefs.current[index] = el}
            className="flex flex-col"
            onDragOver={(e) => handleDragOver(e, day, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, day, index)}
          >
            <div className="sticky top-0 bg-white z-30 p-2 border-b text-center h-14 flex-shrink-0">
              <div className="text-xs text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</div>
              <div className={`mt-1 text-xl font-semibold ${isSameDay(day, new Date()) ? 'text-blue-600' : ''}`}>
                {day.getDate()}
              </div>
            </div>

            <div className={`relative ${index < weekDays.length - 1 ? 'border-r border-gray-200' : ''}`}>
                {hourTimeSlots.map(time => (
                    <div key={time} style={{ height: `${HOUR_ROW_HEIGHT}px` }} className="border-t border-gray-100"></div>
                ))}
            
                {dragOverInfo && isSameDay(dragOverInfo.date, day) && draggedEvent && (
                    <div 
                        className="absolute bg-blue-100 opacity-50 pointer-events-none"
                        style={{
                            top: `${(parseInt(dragOverInfo.time.split(':')[0]) * 60 + parseInt(dragOverInfo.time.split(':')[1])) / 60 * HOUR_ROW_HEIGHT}px`,
                            height: `${((draggedEvent.end.getTime() - draggedEvent.start.getTime()) / (1000 * 60) / 60) * HOUR_ROW_HEIGHT}px`,
                            left: '0',
                            right: '0',
                            zIndex: 5
                        }}
                    />
                )}
                
                {events
                  .filter(event => isSameDay(event.start, day))
                  .map(event => (
                    <div
                      key={event.id}
                      draggable={true}
                      onDragStart={(e) => handleLocalDragStart(e, event)}
                      onDragEnd={onDragEnd}
                      onClick={() => onEventClick(event)}
                      style={getEventStyle(event)}
                      className="p-1 rounded text-white text-xs cursor-grab hover:opacity-80 transition-opacity"
                    >
                      <p className="font-bold truncate">{event.title}</p>
                      <p className="opacity-80 truncate">
                        {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
