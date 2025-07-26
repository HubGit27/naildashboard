// components/scheduler/views/DayView.tsx
"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { User, SchedulerAppointment } from '../types';
import { generateTimeSlots, getAppointmentColor, getOverlappingAppointmentsLayout } from '../utils';
import TimeIndicator from '../ui/TimeIndicator';

interface DayViewProps {
  currentDate: Date;
  users: User[];
  appointments: SchedulerAppointment[];
  isDragging: boolean;
  draggedAppointment: SchedulerAppointment | null;
  onAppointmentClick: (appointment: SchedulerAppointment) => void;
  onDragStart: (event: React.DragEvent, schedulerAppointment: SchedulerAppointment) => void;
  onDragEnd: () => void;
  onDrop: (targetDate: Date, targetTime: string, targetUserId: string | number) => void;
  columnWidths: number[];
  setColumnWidths: (widths: number[]) => void;
  onEmptySlotClick: (date: Date, time: string, userId: string | number) => void;
}

const HOUR_ROW_HEIGHT = 60; // in pixels
const DROP_INTERVAL = 15; // Drop sensitivity in minutes
const MIN_COLUMN_WIDTH_PERCENT = 10; // Minimum width for a column as percentage

const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

export const DayView: React.FC<DayViewProps> = ({ 
    currentDate, 
    users, 
    appointments, 
    isDragging, 
    draggedAppointment, 
    onAppointmentClick, 
    onDragStart, 
    onDragEnd, 
    onDrop, 
    columnWidths, 
    setColumnWidths, 
    onEmptySlotClick 
}) => {
    const { startHour, endHour, hourTimeSlots } = useMemo(() => {
        let minHour = 9;
        let maxHour = 20;

        appointments.forEach(apt => {
            if (isSameDay(apt.start, currentDate)) {
                minHour = Math.min(minHour, apt.start.getHours());
                maxHour = Math.max(maxHour, apt.end.getHours());
            }
        });

        const slots = generateTimeSlots(minHour, maxHour, 60);
        return { startHour: minHour, endHour: maxHour, hourTimeSlots: slots };
    }, [currentDate, appointments]);

    const calculateTopPosition = (date: Date) => {
        const startMinutes = (date.getHours() - startHour) * 60 + date.getMinutes();
        return (startMinutes / 60) * HOUR_ROW_HEIGHT;
    };
    
    const [dragOverInfo, setDragOverInfo] = useState<{ userId: string | number; time: string } | null>(null);
    const [dragStartOffset, setDragStartOffset] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const userColumnRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Initialize column widths as percentages
    useEffect(() => {
        if (users.length > 0 && columnWidths.length !== users.length) {
            const widthPerUser = 100 / users.length; // Equal percentages
            setColumnWidths(Array(users.length).fill(widthPerUser));
        }
        userColumnRefs.current = userColumnRefs.current.slice(0, users.length);
    }, [users, columnWidths.length, setColumnWidths]);

    const handleLocalDragStart = (e: React.DragEvent<HTMLDivElement>, appointment: SchedulerAppointment) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const offset = e.clientY - rect.top;
        setDragStartOffset(offset);
        onDragStart(e, appointment);
    };

    const calculateDropTime = (e: React.DragEvent, userIndex: number): string => {
        const userColumn = userColumnRefs.current[userIndex];
        if (!userColumn) return "00:00";

        const rect = userColumn.getBoundingClientRect();
        const offsetY = e.clientY - rect.top - dragStartOffset - 50;
        
        const totalMinutes = Math.max(0, (offsetY / HOUR_ROW_HEIGHT) * 60) + (startHour * 60);
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
            className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500 transition-colors z-30 opacity-0 hover:opacity-100"
            onMouseDown={onMouseDown}
        />
    );

    const handleMouseDown = useCallback((index: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const containerWidth = containerRef.current?.getBoundingClientRect().width || 100;
        const startWidths = [...columnWidths]; // Capture initial widths

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!containerRef.current) return;
            
            const currentX = moveEvent.clientX;
            const deltaX = currentX - startX;
            const deltaPercentage = (deltaX / containerWidth) * 100;

            setColumnWidths(prevWidths => {
                const newWidths = [...startWidths]; // Always start from initial widths
                const leftIndex = index;
                const rightIndex = index + 1;
                
                // Calculate new widths
                const proposedLeftWidth = startWidths[leftIndex] + deltaPercentage;
                const proposedRightWidth = startWidths[rightIndex] - deltaPercentage;
                
                // Check if both columns meet minimum requirements
                if (proposedLeftWidth >= MIN_COLUMN_WIDTH_PERCENT && 
                    proposedRightWidth >= MIN_COLUMN_WIDTH_PERCENT) {
                    newWidths[leftIndex] = proposedLeftWidth;
                    newWidths[rightIndex] = proposedRightWidth;
                }
                
                // Ensure total adds up to 100% (handle floating point precision)
                const total = newWidths.reduce((sum, width) => sum + width, 0);
                if (Math.abs(total - 100) > 0.01) {
                    const ratio = 100 / total;
                    for (let i = 0; i < newWidths.length; i++) {
                        newWidths[i] *= ratio;
                    }
                }
                
                return newWidths;
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [setColumnWidths, columnWidths]);

    if (users.length === 0) {
        return <div className="p-8 text-center text-gray-500">Select a user to see their schedule.</div>;
    }

    // Create the grid template from percentage-based column widths
    const gridTemplate = columnWidths.length > 0 
        ? columnWidths.map(w => `${w}%`).join(' ') 
        : `repeat(${users.length}, 1fr)`;

    return (
        <div className="flex h-full bg-white overflow-hidden">
            {/* Time column - fixed width */}
            <div className="w-16 flex-shrink-0 border-r border-gray-200">
                <div className="h-14 border-b border-gray-200"></div>
                {hourTimeSlots.map(time => (
                    <div key={time} className="h-[60px] text-right pr-2 text-xs text-gray-500 relative -top-2">
                        {time}
                    </div>
                ))}
            </div>

            {/* User columns container - takes remaining space */}
            <div 
                ref={containerRef} 
                className="flex-1 min-w-0 grid relative" 
                style={{ gridTemplateColumns: gridTemplate }}
            >
                {users.map((user, index) => (
                    <div 
                        key={user.id} 
                        ref={el => { userColumnRefs.current[index] = el; }}
                        className="relative flex flex-col min-w-0 group"
                        onDragOver={(e) => handleDragOver(e, user.id, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, user.id, index)}
                    >
                        {/* User header */}
                        <div className="p-2 h-14 border-b border-gray-200 sticky top-0 bg-gray-50 z-20 text-center font-semibold flex-shrink-0 min-w-0">
                            <div className="truncate" title={user.name}>
                                {user.name}
                            </div>
                        </div>
                        
                        {/* Schedule area */}
                        <div
                            className={`relative cursor-pointer min-w-0 ${index < users.length - 1 ? 'border-r border-gray-200' : ''}`}
                            onClick={(e) => {
                                if (e.target === e.currentTarget || e.target.closest('.appointment-item') === null) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const offsetY = e.clientY - rect.top;
                                    const totalMinutes = Math.max(0, (offsetY / HOUR_ROW_HEIGHT) * 60) + (startHour * 60);
                                    const interval = Math.floor(totalMinutes / DROP_INTERVAL) * DROP_INTERVAL;
                                    const hour = Math.floor(interval / 60).toString().padStart(2, '0');
                                    const minute = (interval % 60).toString().padStart(2, '0');
                                    const clickedTime = `${hour}:${minute}`;
                                    onEmptySlotClick(currentDate, clickedTime, user.id);
                                }
                            }}
                        >
                            {/* Current time indicator */}
                            {isSameDay(currentDate, new Date()) && (
                                <TimeIndicator startHour={startHour} hourRowHeight={HOUR_ROW_HEIGHT} />
                            )}
                            
                            {/* Hour slots */}
                            {hourTimeSlots.map(time => (
                                <div key={time} style={{ height: `${HOUR_ROW_HEIGHT}px` }} className="border-t border-gray-100"></div>
                            ))}

                            {/* Drag preview */}
                            {dragOverInfo && dragOverInfo.userId === user.id && draggedAppointment && (
                                <div 
                                    className="absolute bg-blue-100 opacity-50 pointer-events-none"
                                    style={{
                                        top: `${calculateTopPosition(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), parseInt(dragOverInfo.time.split(':')[0]), parseInt(dragOverInfo.time.split(':')[1].split(' ')[0])))}px`,
                                        height: `${((draggedAppointment.end.getTime() - draggedAppointment.start.getTime()) / (1000 * 60) / 60) * HOUR_ROW_HEIGHT}px`,
                                        left: '0',
                                        right: '0',
                                        zIndex: 5
                                    }}
                                />
                            )}

                            {/* Appointments */}
                            <div className="absolute inset-0 top-0 z-20 pointer-events-none">
                                {getOverlappingAppointmentsLayout(appointments.filter(appointment => appointment.userId === user.id && isSameDay(appointment.start, currentDate)))
                                    .map(appointment => {
                                        const top = calculateTopPosition(appointment.start);
                                        const height = ((appointment.end.getTime() - appointment.start.getTime()) / (1000 * 60) / 60) * HOUR_ROW_HEIGHT;

                                        return (
                                            <div 
                                                key={appointment.id}
                                                draggable={true}
                                                onDragStart={(e) => handleLocalDragStart(e, appointment)}
                                                onDragEnd={onDragEnd}
                                                onClick={() => onAppointmentClick(appointment)}
                                                className="absolute p-2 rounded text-white text-xs cursor-grab shadow-md pointer-events-auto appointment-item overflow-hidden"
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                    backgroundColor: getAppointmentColor(appointment.status),
                                                    left: `${appointment.left}%`,
                                                    width: `${appointment.width}%`,
                                                    opacity: isDragging ? 0.5 : 1,
                                                }}
                                            >
                                                <p className="font-bold truncate">{appointment.title}</p>
                                                <p className="opacity-80 truncate">
                                                    {appointment.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {appointment.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                        
                        {/* Resize handle - only show between columns */}
                        {index < users.length - 1 && (
                            <ResizableHandle onMouseDown={handleMouseDown(index)} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};