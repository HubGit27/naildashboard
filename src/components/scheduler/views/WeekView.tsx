// components/scheduler/views/WeekView.tsx
"use client";

import React, { useState, useRef, useCallback } from 'react';
import { SchedulerAppointment } from '../types';
import { getWeekDays, generateTimeSlots, getAppointmentColor } from '../utils';
import TimeIndicator from '../ui/TimeIndicator';

interface WeekViewProps {
  currentDate: Date;
  appointments: SchedulerAppointment[];
  isDragging: boolean;
  draggedAppointment: SchedulerAppointment | null;
  onAppointmentClick: (appointment: SchedulerAppointment) => void;
  onDragStart: (event: React.DragEvent, schedulerAppointment: SchedulerAppointment) => void;
  onDragEnd: () => void;
  onDrop: (targetDate: Date, targetTime: string) => void;
  onEmptySlotClick: (date: Date, time: string) => void;
}

const HOUR_ROW_HEIGHT = 60; // in pixels
const DROP_INTERVAL = 15; // Drop sensitivity in minutes

const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

export const WeekView: React.FC<WeekViewProps> = ({ currentDate, appointments, isDragging, draggedAppointment, onAppointmentClick, onDragStart, onDragEnd, onDrop, onEmptySlotClick }) => {
  const weekDays = getWeekDays(currentDate);
  const { startHour, endHour, hourTimeSlots } = React.useMemo(() => {
    let minHour = 9;
    let maxHour = 20;

    appointments.forEach(apt => {
      const aptDay = apt.start.getDay();
      const weekStartDay = weekDays[0].getDay();
      const weekEndDay = weekDays[6].getDay();

      if (aptDay >= weekStartDay && aptDay <= weekEndDay) {
        minHour = Math.min(minHour, apt.start.getHours());
        maxHour = Math.max(maxHour, apt.end.getHours());
      }
    });

    const slots = generateTimeSlots(minHour, maxHour, 60);
    return { startHour: minHour, endHour: maxHour, hourTimeSlots: slots };
  }, [appointments, weekDays]);

  const [dragOverInfo, setDragOverInfo] = useState<{ date: Date; time: string } | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState(0);

  const dayColumnRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleLocalDragStart = (e: React.DragEvent<HTMLDivElement>, appointment: SchedulerAppointment) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    setDragStartOffset(offset);
    onDragStart(e, appointment);
  };

  const calculateDropTime = (e: React.DragEvent, dayIndex: number): string => {
    const dayColumn = dayColumnRefs.current[dayIndex];
    if (!dayColumn) return "00:00";

    const rect = dayColumn.getBoundingClientRect();
    const offsetY = e.clientY - rect.top - dragStartOffset -50;
    
    const totalMinutes = Math.max(0, (offsetY / HOUR_ROW_HEIGHT) * 60) + (startHour * 60);
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

  const getAppointmentStyle = (appointment: SchedulerAppointment): React.CSSProperties => {
    const startMinutes = (appointment.start.getHours() - startHour) * 60 + appointment.start.getMinutes();
    const durationMinutes = (appointment.end.getTime() - appointment.start.getTime()) / (1000 * 60);
    const top = (startMinutes / 60) * HOUR_ROW_HEIGHT;
    const height = (durationMinutes / 60) * HOUR_ROW_HEIGHT;

    return {
      position: 'absolute',
      top: `${top}px`,
      height: `${height}px`,
      left: '4px',
      right: '4px',
      backgroundColor: getAppointmentColor(appointment.status),
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
            ref={el => {dayColumnRefs.current[index] = el}}
            className="flex flex-col"
            onDragOver={(e) => handleDragOver(e, day, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, day, index)}
            onClick={(e) => {
                // Only handle click if it's not on an appointment
                if (e.target === e.currentTarget || e.target.closest('.appointment-item') === null) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const offsetY = e.clientY - rect.top;
                    const totalMinutes = Math.max(0, (offsetY / HOUR_ROW_HEIGHT) * 60) + (startHour * 60);
                    const interval = Math.floor(totalMinutes / DROP_INTERVAL) * DROP_INTERVAL;
                    const hour = Math.floor(interval / 60).toString().padStart(2, '0');
                    const minute = (interval % 60).toString().padStart(2, '0');
                    const clickedTime = `${hour}:${minute}`;
                    onEmptySlotClick(day, clickedTime);
                }
            }}
          >
            <div className="sticky top-0 bg-white z-30 p-2 border-b text-center h-14 flex-shrink-0">
              <div className="text-xs text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</div>
              <div className={`mt-1 text-xl font-semibold ${isSameDay(day, new Date()) ? 'text-blue-600' : ''}`}>
                {day.getDate()}
              </div>
            </div>

            <div className={`relative cursor-pointer ${index < weekDays.length - 1 ? 'border-r border-gray-200' : ''}`}>
                {isSameDay(day, new Date()) && (
                    <TimeIndicator startHour={startHour} hourRowHeight={HOUR_ROW_HEIGHT} />
                )}
                {hourTimeSlots.map(time => (
                    <div key={time} style={{ height: `${HOUR_ROW_HEIGHT}px` }} className="border-t border-gray-100"></div>
                ))}
            
                {dragOverInfo && isSameDay(dragOverInfo.date, day) && draggedAppointment && (
                    <div 
                        className="absolute bg-blue-100 opacity-50 pointer-events-none"
                        style={{
                            top: `${((parseInt(dragOverInfo.time.split(':')[0]) - startHour) * 60 + parseInt(dragOverInfo.time.split(':')[1])) / 60 * HOUR_ROW_HEIGHT}px`,
                            height: `${((draggedAppointment.end.getTime() - draggedAppointment.start.getTime()) / (1000 * 60) / 60) * HOUR_ROW_HEIGHT}px`,
                            left: '0',
                            right: '0',
                            zIndex: 5
                        }}
                    />
                )}
                
                {appointments
                  .filter(appointment => isSameDay(appointment.start, day))
                  .map(appointment => (
                    <div
                      key={appointment.id}
                      draggable={true}
                      onDragStart={(e) => handleLocalDragStart(e, appointment)}
                      onDragEnd={onDragEnd}
                      onClick={() => onAppointmentClick(appointment)}
                      style={getAppointmentStyle(appointment)}
                      className="p-1 rounded text-white text-xs cursor-grab hover:opacity-80 transition-opacity appointment-item"
                    >
                      <p className="font-bold truncate">{appointment.title}</p>
                      <p className="opacity-80 truncate">
                        {appointment.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {appointment.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
