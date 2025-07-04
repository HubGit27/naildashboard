// components/scheduler/views/DayView.tsx
"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { User, SchedulerEvent } from '../types';
import { generateTimeSlots } from '../utils';

interface DayViewProps {
  currentDate: Date;
  users: User[];
  events: SchedulerEvent[];
  isDragging: boolean;
  draggedEvent: SchedulerEvent | null;
  onEventClick: (event: SchedulerEvent) => void;
  onDragStart: (event: React.DragEvent, schedulerEvent: SchedulerEvent) => void;
  onDragEnd: () => void;
  onDrop: (targetDate: Date, targetTime: string, targetUserId: string | number) => void;
}

const HOUR_ROW_HEIGHT = 60; // in pixels
const DROP_INTERVAL = 15; // Drop sensitivity in minutes
const MIN_COLUMN_WIDTH = 120; // Minimum width for a column in pixels

const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

export const DayView: React.FC<DayViewProps> = ({ currentDate, users, events, isDragging, draggedEvent, onEventClick, onDragStart, onDragEnd, onDrop }) => {
    const hourTimeSlots = generateTimeSlots(60);
    
    const [columnWidths, setColumnWidths] = useState<number[]>([]);
    const [dragOverInfo, setDragOverInfo] = useState<{ userId: string | number; time: string } | null>(null);
    const [dragStartOffset, setDragStartOffset] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const userColumnRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (containerRef.current && users.length > 0) {
            const containerWidth = containerRef.current.offsetWidth;
            const widthPerUser = Math.max(MIN_COLUMN_WIDTH, containerWidth / users.length);
            setColumnWidths(Array(users.length).fill(widthPerUser));
        }
        userColumnRefs.current = userColumnRefs.current.slice(0, users.length);
    }, [users]);

    const handleLocalDragStart = (e: React.DragEvent<HTMLDivElement>, event: SchedulerEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const offset = e.clientY - rect.top;
        setDragStartOffset(offset);
        onDragStart(e, event); // Propagate to parent
    };

    const calculateDropTime = (e: React.DragEvent, userIndex: number): string => {
        const userColumn = userColumnRefs.current[userIndex];
        if (!userColumn) return "00:00";

        const rect = userColumn.getBoundingClientRect();
        const offsetY = e.clientY - rect.top - dragStartOffset -50; // Adjust for initial drag offset
        
        const totalMinutes = Math.max(0, (offsetY / HOUR_ROW_HEIGHT) * 60);
        const interval = Math.floor(totalMinutes / DROP_INTERVAL) * DROP_INTERVAL;
        const hour = Math.floor(interval / 60).toString().padStart(2, '0');
        const minute = (interval % 60).toString().padStart(2, '0');
        
        return `${hour}:${minute}`;
    };

    const handleDragOver = (e: React.DragEvent, userId: string | number, userIndex: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const time = calculateDropTime(e, userIndex);
        if (!dragOverInfo || dragOverInfo.userId !== userId || dragOverInfo.time !== time) {
            setDragOverInfo({ userId, time });
        }
    };

    const handleDragLeave = () => {
        setDragOverInfo(null);
    };

    const handleDrop = (e: React.DragEvent, userId: string | number, userIndex: number) => {
        e.preventDefault();
        const time = calculateDropTime(e, userIndex);
        onDrop(currentDate, time, userId);
        setDragOverInfo(null);
        setDragStartOffset(0);
    };

    const ResizableHandle = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
        <div
            className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500 transition-colors z-30"
            onMouseDown={onMouseDown}
        />
    );

    const handleMouseDown = useCallback((index: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const leftColumn = containerRef.current?.children[index] as HTMLDivElement;
        const rightColumn = containerRef.current?.children[index + 1] as HTMLDivElement;

        if (!leftColumn || !rightColumn) return;

        const leftStartWidth = leftColumn.getBoundingClientRect().width;
        const rightStartWidth = rightColumn.getBoundingClientRect().width;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.clientX;
            const deltaX = currentX - startX;
            const newLeftWidth = leftStartWidth + deltaX;
            const newRightWidth = rightStartWidth - deltaX;

            if (newLeftWidth < MIN_COLUMN_WIDTH || newRightWidth < MIN_COLUMN_WIDTH) return;

            setColumnWidths(prevWidths => {
                const newWidths = [...prevWidths];
                newWidths[index] = newLeftWidth;
                newWidths[index + 1] = newRightWidth;
                return newWidths;
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

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

            <div ref={containerRef} className="flex-1 grid" style={{ gridTemplateColumns: columnWidths.length > 0 ? columnWidths.map(w => `${w}px`).join(' ') : `repeat(${users.length}, 1fr)` }}>
                {users.map((user, index) => (
                    <div 
                        key={user.id} 
                        ref={el => userColumnRefs.current[index] = el}
                        className="relative flex flex-col"
                        onDragOver={(e) => handleDragOver(e, user.id, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, user.id, index)}
                    >
                        <div className="p-2 h-14 border-b border-gray-200 sticky top-0 bg-gray-50 z-20 text-center font-semibold flex-shrink-0">
                            {user.name}
                        </div>
                        
                        <div className={`relative ${index < users.length - 1 ? 'border-r border-gray-200' : ''}`}>
                            {hourTimeSlots.map(time => (
                                <div key={time} style={{ height: `${HOUR_ROW_HEIGHT}px` }} className="border-t border-gray-100"></div>
                            ))}

                            {dragOverInfo && dragOverInfo.userId === user.id && draggedEvent && (
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
                                                onDragStart={(e) => handleLocalDragStart(e, event)}
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
                        {index < users.length - 1 && (
                            <ResizableHandle onMouseDown={handleMouseDown(index)} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

