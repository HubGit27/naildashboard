// components/scheduler/hooks/useScheduler.ts
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from "next/navigation";
import { User, SchedulerEvent, EventForm, ViewType } from '../types';

const today = new Date();
const DUMMY_EVENTS: SchedulerEvent[] = [
    { id: 1, title: 'Team Meeting', start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0), end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30), color: '#3b82f6', userId: '1' },
    { id: 2, title: 'Project Review', start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0), end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30), color: '#ef4444', userId: '2' },
];

export const useScheduler = ({ initialUsers = [], searchParams }: {
    initialUsers: User[];
    searchParams: { [key:string]: string | undefined };
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);
    
    const getInitialDate = () => {
        const urlDate = searchParams.date;
        if (urlDate) {
            const parsed = new Date(urlDate);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
        }
        return new Date();
    };

    const getInitialView = () => {
        const urlView = searchParams.view;
        if (urlView === 'day' || urlView === 'week' || urlView === 'month') {
            return urlView;
        }
        return 'day';
    };

    const getInitialSelection = () => {
        const urlEmployees = searchParams.employees?.split(',');
        return urlEmployees && urlEmployees.length > 0 ? urlEmployees : initialUsers.map(u => u.id);
    };

    const [currentDate, setCurrentDate] = useState<Date>(getInitialDate);
    const [view, setView] = useState<ViewType>(getInitialView);
    
    // --- FIX: Re-introducing the 'users' state variable ---
    const [users, setUsers] = useState<User[]>(initialUsers);
    
    const [selectedUsers, setSelectedUsers] = useState<Array<string | number>>(getInitialSelection);
    
    const [dayViewSelectionCache, setDayViewSelectionCache] = useState<Array<string | number>>(getInitialSelection);
    const [singleViewSelectionCache, setSingleViewSelectionCache] = useState<string | number | null>(() => {
        const initialSelection = getInitialSelection();
        return initialSelection.length > 0 ? initialSelection[0] : (initialUsers.length > 0 ? initialUsers[0].id : null);
    });
    
    const [events, setEvents] = useState<SchedulerEvent[]>(DUMMY_EVENTS);
    const [selectedEvent, setSelectedEvent] = useState<SchedulerEvent | null>(null);
    const [showEventModal, setShowEventModal] = useState<boolean>(false);
    const [showUserModal, setShowUserModal] = useState<boolean>(false);
    
    const [draggedEvent, setDraggedEvent] = useState<SchedulerEvent | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleUserToggle = (userId: string | number) => {
        if (view === 'day') {
            const newSelection = selectedUsers.includes(userId)
                ? selectedUsers.length > 1 ? selectedUsers.filter(id => id !== userId) : selectedUsers
                : [...selectedUsers, userId];
            setSelectedUsers(newSelection);
            setDayViewSelectionCache(newSelection);
        } else {
            setSelectedUsers([userId]);
            setSingleViewSelectionCache(userId);
        }
    };

    useEffect(() => {
        if (view === 'week' || view === 'month') {
            if (singleViewSelectionCache) { setSelectedUsers([singleViewSelectionCache]); }
        } else if (view === 'day') {
            setSelectedUsers(dayViewSelectionCache);
        }
    }, [view]);

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
        const updatedEvent: SchedulerEvent = { ...draggedEvent, start: newStart, end: newEnd, userId: targetUserId || draggedEvent.userId };
        setEvents(events.map(e => e.id === draggedEvent.id ? updatedEvent : e));
        handleDragEnd();
    };

    useEffect(() => { setIsClient(true); }, []);
    
    useEffect(() => {
        if (!isClient) return;
        const params = new URLSearchParams(window.location.search);
        params.set('date', currentDate.toISOString());
        params.set('view', view);
        
        if (selectedUsers.length > 0) {
            params.set('employees', selectedUsers.join(','));
        } else {
            params.delete('employees');
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [currentDate, selectedUsers, view, isClient, router, pathname]);

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

    // This code should now work correctly as 'users' is defined in scope
    const visibleUsers = useMemo(() => users.filter(user => selectedUsers.includes(user.id)), [users, selectedUsers]);
    const visibleEvents = useMemo(() => events.filter(event => selectedUsers.includes(event.userId)), [events, selectedUsers]);

    return {
        isClient,
        currentDate,
        setCurrentDate,
        view,
        setView,
        users,
        visibleUsers,
        events: visibleEvents,
        selectedUsers,
        handleUserToggle,
        showEventModal,
        setShowEventModal,
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
