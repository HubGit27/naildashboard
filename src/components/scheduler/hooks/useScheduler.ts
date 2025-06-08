// components/scheduler/hooks/useScheduler.ts
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from "next/navigation";
import { User, SchedulerEvent, EventForm, ViewType } from '../types';

const today = new Date();
const DUMMY_EVENTS: SchedulerEvent[] = [
    { id: 1, title: 'Team Meeting', start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0), end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30), color: '#3b82f6', userId: 'EMP-001' },
    { id: 2, title: 'Project Review', start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0), end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30), color: '#ef4444', userId: 'EMP-002' },
];

export const useScheduler = ({ initialUsers = [], initialDate, searchParams }: {
    initialUsers: User[];
    initialDate?: string;
    searchParams: { [key:string]: string | undefined };
}) => {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [currentDate, setCurrentDate] = useState<Date>(() => initialDate ? new Date(initialDate) : new Date());
    const [view, setView] = useState<ViewType>('day');
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [selectedUsers, setSelectedUsers] = useState<Array<string | number>>(() => users.map(u => u.id));
    const [events, setEvents] = useState<SchedulerEvent[]>(DUMMY_EVENTS);
    const [selectedEvent, setSelectedEvent] = useState<SchedulerEvent | null>(null);
    const [showEventModal, setShowEventModal] = useState<boolean>(false);
    
    // --- FIX: Add state for the user selection modal ---
    const [showUserModal, setShowUserModal] = useState<boolean>(false);
    
    const [draggedEvent, setDraggedEvent] = useState<SchedulerEvent | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleUserToggle = (userId: string | number) => {
        setSelectedUsers(prevSelected => {
            if (prevSelected.includes(userId)) {
                return prevSelected.length > 1 ? prevSelected.filter(id => id !== userId) : prevSelected;
            } else {
                return [...prevSelected, userId];
            }
        });
    };

    const handleDragStart = (event: React.DragEvent, schedulerEvent: SchedulerEvent) => {
        setDraggedEvent(schedulerEvent);
        setIsDragging(true);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedEvent(null);
        setIsDragging(false);
    };

    const handleDrop = (targetDate: Date, targetTime: string, targetUserId?: string | number) => {
        if (!draggedEvent) return;

        const eventDuration = draggedEvent.end.getTime() - draggedEvent.start.getTime();
        const [hours, minutes] = targetTime.split(':').map(Number);
        
        const newStart = new Date(targetDate);
        newStart.setHours(hours, minutes, 0, 0);

        const newEnd = new Date(newStart.getTime() + eventDuration);

        const updatedEvent: SchedulerEvent = {
            ...draggedEvent,
            start: newStart,
            end: newEnd,
            userId: targetUserId || draggedEvent.userId,
        };

        setEvents(events.map(e => e.id === draggedEvent.id ? updatedEvent : e));
        handleDragEnd();
    };


    useEffect(() => { setIsClient(true); }, []);

    useEffect(() => {
        if (!isClient) return;
        const params = new URLSearchParams(window.location.search);
        params.set('date', currentDate.toISOString());
        router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    }, [currentDate, router, isClient]);


    const navigateDate = (direction: number) => {
        const newDate = new Date(currentDate);
        if (view === 'day') newDate.setDate(currentDate.getDate() + direction);
        else if (view === 'week') newDate.setDate(currentDate.getDate() + (direction * 7));
        else if (view === 'month') newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const handleDayClickInMonthView = (clickedDate: Date) => {
        setCurrentDate(clickedDate);
        setView('day');
    };

    const handleSaveEvent = (eventData: EventForm) => {
        const user = users.find(u => u.id === eventData.userId);
        const newEvent: SchedulerEvent = {
            id: selectedEvent?.id || Date.now(),
            title: eventData.title,
            start: new Date(eventData.start),
            end: new Date(eventData.end),
            color: user ? user.color : '#3b82f6',
            userId: eventData.userId
        };

        if (selectedEvent) {
            setEvents(events.map(e => e.id === selectedEvent.id ? newEvent : e));
        } else {
            setEvents([...events, newEvent]);
        }
        setShowEventModal(false);
        setSelectedEvent(null);
    };

    const visibleUsers = useMemo(() => users.filter(user => selectedUsers.includes(user.id)), [users, selectedUsers]);

    return {
        isClient,
        currentDate,
        setCurrentDate,
        view,
        setView,
        users,
        visibleUsers,
        events,
        selectedUsers,
        handleUserToggle,
        showEventModal,
        setShowEventModal,
        // --- FIX: Return the state and setter from the hook ---
        showUserModal,
        setShowUserModal,
        selectedEvent,
        setSelectedEvent,
        navigateDate,
        handleSaveEvent,
        handleDayClickInMonthView,
        isDragging,
        draggedEvent,
        handleDragStart,
        handleDragEnd,
        handleDrop,
    };
};
