// components/scheduler/hooks/useScheduler.ts
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { User, SchedulerEvent, EventForm, ViewType } from '../types';

const today = new Date();
const DUMMY_EVENTS: SchedulerEvent[] = [
    { id: 1, title: 'Team Meeting', start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0), end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30), color: '#3b82f6', userId: '1' },
    { id: 2, title: 'Project Review', start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0), end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30), color: '#ef4444', userId: '2' },
];

// Local storage keys
const STORAGE_KEYS = {
    DATE: 'scheduler_date',
    VIEW: 'scheduler_view',
    SELECTED_USERS: 'scheduler_selected_users',
} as const;

// Safe localStorage operations
const safeLocalStorage = {
    get: (key: string, fallback?: string) => {
        if (typeof window === 'undefined') return fallback;
        try {
            return localStorage.getItem(key) || fallback;
        } catch {
            return fallback;
        }
    },
    set: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, value);
        } catch {
            // Silently fail if localStorage is not available
        }
    }
};

export const useScheduler = ({ initialUsers = [], searchParams }: {
    initialUsers: User[];
    searchParams: { [key:string]: string | undefined };
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const [isClient, setIsClient] = useState(false);
    
    // Enhanced parameter parsing with localStorage fallback
    const getInitialDate = () => {
        // Priority: URL params -> localStorage -> current date
        const urlDate = searchParams.date || urlSearchParams.get('date');
        if (urlDate) {
            const parsed = new Date(urlDate);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
        }
        
        // Try localStorage as fallback
        const storedDate = safeLocalStorage.get(STORAGE_KEYS.DATE);
        if (storedDate) {
            const parsed = new Date(storedDate);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
        }
        
        return new Date();
    };

    const getInitialView = (): ViewType => {
        // Priority: URL params -> localStorage -> 'day'
        const urlView = searchParams.view || urlSearchParams.get('view');
        if (urlView === 'day' || urlView === 'week' || urlView === 'month') {
            return urlView;
        }
        
        const storedView = safeLocalStorage.get(STORAGE_KEYS.VIEW);
        if (storedView === 'day' || storedView === 'week' || storedView === 'month') {
            return storedView;
        }
        
        return 'day';
    };

    const getInitialSelection = () => {
        // Priority: URL params -> localStorage -> all users
        const urlEmployees = searchParams.employees || urlSearchParams.get('employees');
        let employeeIds = urlEmployees?.split(',').filter(Boolean);
        
        if (!employeeIds || employeeIds.length === 0) {
            const storedUsers = safeLocalStorage.get(STORAGE_KEYS.SELECTED_USERS);
            if (storedUsers) {
                employeeIds = storedUsers.split(',').filter(Boolean);
            }
        }
        
        if (employeeIds && employeeIds.length > 0) {
            // Validate that the employee IDs exist in initialUsers
            const validIds = employeeIds.filter(id => 
                initialUsers.some(user => user.id.toString() === id)
            );
            if (validIds.length > 0) {
                return validIds;
            }
        }
        
        // Fallback to all users
        return initialUsers.map(u => u.id.toString());
    };

    const [currentDate, setCurrentDate] = useState<Date>(getInitialDate);
    const [view, setView] = useState<ViewType>(getInitialView);
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [selectedUsers, setSelectedUsers] = useState<Array<string | number>>(getInitialSelection);
    
    // Cache for different view modes
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

    // Re-sync with URL parameters when they change
    useEffect(() => {
        if (!isClient) return;
        
        const newDate = getInitialDate();
        const newView = getInitialView();
        const newSelection = getInitialSelection();
        
        setCurrentDate(newDate);
        setView(newView);
        setSelectedUsers(newSelection);
        
        // Update caches based on view
        if (newView === 'day') {
            setDayViewSelectionCache(newSelection);
        } else {
            setSingleViewSelectionCache(newSelection.length > 0 ? newSelection[0] : null);
        }
    }, [urlSearchParams, isClient, initialUsers]);

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
            if (singleViewSelectionCache) { 
                setSelectedUsers([singleViewSelectionCache]); 
            }
        } else if (view === 'day') {
            setSelectedUsers(dayViewSelectionCache);
        }
    }, [view, dayViewSelectionCache, singleViewSelectionCache]);

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
            userId: targetUserId || draggedEvent.userId 
        };
        setEvents(events.map(e => e.id === draggedEvent.id ? updatedEvent : e));
        handleDragEnd();
    };

    useEffect(() => { 
        setIsClient(true); 
    }, []);
    
    // Enhanced URL update with localStorage persistence
    useEffect(() => {
        if (!isClient) return;
        
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams();
            
            // Always set these parameters
            params.set('date', currentDate.toISOString());
            params.set('view', view);
            
            if (selectedUsers.length > 0) {
                params.set('employees', selectedUsers.map(id => id.toString()).join(','));
            }
            
            // Save to localStorage as backup
            safeLocalStorage.set(STORAGE_KEYS.DATE, currentDate.toISOString());
            safeLocalStorage.set(STORAGE_KEYS.VIEW, view);
            safeLocalStorage.set(STORAGE_KEYS.SELECTED_USERS, selectedUsers.map(id => id.toString()).join(','));
            
            const newUrl = `${pathname}?${params.toString()}`;
            
            // Only update if URL actually changed
            if (window.location.pathname + '?' + params.toString() !== window.location.pathname + window.location.search) {
                router.replace(newUrl, { scroll: false });
            }
        }, 100); // Debounce URL updates
        
        return () => clearTimeout(timeoutId);
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

    const visibleUsers = useMemo(() => 
        users.filter(user => selectedUsers.includes(user.id)), 
        [users, selectedUsers]
    );
    
    const visibleEvents = useMemo(() => 
        events.filter(event => selectedUsers.includes(event.userId)), 
        [events, selectedUsers]
    );

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