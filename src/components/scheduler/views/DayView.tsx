// components/scheduler/views/DayView.tsx
"use client";

import React from 'react';
import { User, SchedulerEvent } from '../types';
import { generateTimeSlots } from '../utils';

interface DayViewProps {
  currentDate: Date;
  users: User[];
  events: SchedulerEvent[];
  isDragging: boolean;
  onEventClick: (event: SchedulerEvent) => void;
  onDragStart: (event: React.DragEvent, schedulerEvent: SchedulerEvent) => void;
  onDragEnd: () => void;
  onDrop: (targetDate: Date, targetTime: string, targetUserId: string | number) => void;
}

const HOUR_ROW_HEIGHT = 60; // in pixels
const DROP_INTERVAL = 15; // Drop sensitivity in minutes

const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

export const DayView: React.FC<DayViewProps> = ({ currentDate, users, events, isDragging, onEventClick, onDragStart, onDragEnd, onDrop }) => {
    const hourTimeSlots = generateTimeSlots(60); 
    const dropTimeSlots = generateTimeSlots(DROP_INTERVAL);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    if (users.length === 0) {
        return <div className="p-8 text-center text-gray-500">Select a user to see their schedule.</div>;
    }
    
    return (
        <div className="flex h-full bg-white">
            <div className="w-16 flex-shrink-0 border-r border-gray-200">
                <div className="h-14 border-b border-gray-200"></div>
                {hourTimeSlots.map(time => (
                    <div key={time} className="h-[60px] text-right pr-2 text-xs text-gray-500 relative -top-2">
                        {time}
                    </div>
                ))}
            </div>

            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${users.length}, minmax(200px, 1fr))` }}>
                {users.map((user, index) => (
                    <div key={user.id} className="flex flex-col">
                        {/* Header is sticky and separate from the scrollable content */}
                        <div className="p-2 h-14 border-b border-gray-200 sticky top-0 bg-gray-50 z-20 text-center font-semibold flex-shrink-0">
                            {user.name}
                        </div>
                        
                        {/* --- FIX: New container for scrollable content --- */}
                        {/* This div is relative, contains the border, and will now have a defined height from its non-absolute children */}
                        <div className={`relative ${index < users.length - 1 ? 'border-r border-gray-200' : ''}`}>
                            {/* The hourly grid lines are now in the normal document flow, giving this container height */}
                            {hourTimeSlots.map(time => (
                                <div key={time} style={{ height: `${HOUR_ROW_HEIGHT}px` }} className="border-t border-gray-100"></div>
                            ))}

                            {/* Drop zones are absolutely positioned to overlay the grid */}
                            <div className="absolute inset-0 top-0 z-10">
                                {dropTimeSlots.map(time => (
                                    <div 
                                        key={time}
                                        className="h-[15px]"
                                        onDragOver={handleDragOver}
                                        onDrop={() => onDrop(currentDate, time, user.id)}
                                    />
                                ))}
                            </div>

                            {/* Events are absolutely positioned to overlay the grid */}
                            <div className="absolute inset-0 top-0 z-20 pointer-events-none">
                                {events
                                    .filter(event => event.userId === user.id && isSameDay(event.start, currentDate))
                                    .map(event => {
                                        const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
                                        const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
                                        const durationMinutes = endMinutes - startMinutes;
                                        const top = (startMinutes / 60) * HOUR_ROW_HEIGHT;
                                        const height = (durationMinutes / 60) * HOUR_ROW_HEIGHT;

                                        return (
                                            <div 
                                                key={event.id}
                                                draggable={true}
                                                onDragStart={(e) => onDragStart(e, event)}
                                                onDragEnd={onDragEnd}
                                                onClick={() => onEventClick(event)}
                                                className="absolute p-2 rounded text-white text-xs cursor-grab shadow-md pointer-events-auto"
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                    backgroundColor: event.color,
                                                    left: '4px',
                                                    right: '4px',
                                                    opacity: isDragging ? 0.5 : 1,
                                                }}
                                            >
                                                <p className="font-bold truncate">{event.title}</p>
                                                <p className="opacity-80 truncate">
                                                    {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
