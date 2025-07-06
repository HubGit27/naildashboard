// components/scheduler/hooks/useScheduler.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { User, SchedulerEvent, EventForm, ViewType } from '../types';

// Function to generate a consistent color from a string (e.g., user ID)
const generateColor = (id: string): string => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
};


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

export const useScheduler = ({
    initialUsers,
    searchParams,
}: {
    initialUsers: User[];
    searchParams: { [key: string]: string | undefined };
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const [isClient, setIsClient] = useState(false);

        const [users] = useState<User[]>(initialUsers);
    const [events, setEvents] = useState<SchedulerEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize state from URL/localStorage
    const getInitialDate = useCallback(() => {
        const urlDate = searchParams.date || urlSearchParams.get('date');
        if (urlDate) {
            const parsed = new Date(urlDate);
            if (!isNaN(parsed.getTime())) return parsed;
        }
        const storedDate = safeLocalStorage.get(STORAGE_KEYS.DATE);
        if (storedDate) {
            const parsed = new Date(storedDate);
            if (!isNaN(parsed.getTime())) return parsed;
        }
        return new Date();
    }, [searchParams, urlSearchParams]);

    const getInitialView = useCallback((): ViewType => {
        const urlView = searchParams.view || urlSearchParams.get('view');
        if (urlView === 'day' || urlView === 'week' || urlView === 'month') return urlView;
        const storedView = safeLocalStorage.get(STORAGE_KEYS.VIEW);
        if (storedView === 'day' || storedView === 'week' || storedView === 'month') return storedView as ViewType;
        return 'day';
    }, [searchParams, urlSearchParams]);

    const getInitialSelection = useCallback((initialUsers: User[]) => {
        const urlEmployees = searchParams.employees || urlSearchParams.get('employees');
        let employeeIds = urlEmployees?.split(',').filter(Boolean);

        if (!employeeIds || employeeIds.length === 0) {
            const storedUsers = safeLocalStorage.get(STORAGE_KEYS.SELECTED_USERS);
            if (storedUsers) {
                employeeIds = storedUsers.split(',').filter(Boolean);
            }
        }

        if (employeeIds && employeeIds.length > 0) {
            const validIds = employeeIds.filter(id =>
                initialUsers.some(user => user.id.toString() === id)
            );
            if (validIds.length > 0) return validIds;
        }
        return initialUsers.map(u => u.id.toString());
    }, [searchParams, urlSearchParams]);


    const [currentDate, setCurrentDate] = useState<Date>(getInitialDate);
    const [view, setView] = useState<ViewType>(getInitialView);
    const [selectedUsers, setSelectedUsers] = useState<Array<string | number>>([]);

    // Fetch data on mount
    useEffect(() => {
        const fetchAppointments = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const appointmentsRes = await fetch('/server-api/appointments');
                if (!appointmentsRes.ok) {
                    throw new Error('Failed to fetch appointments');
                }
                const fetchedAppointments = await appointmentsRes.json();

                const formattedEvents: SchedulerEvent[] = fetchedAppointments.map((apt: any) => ({
                    id: apt.id,
                    title: `${apt.customer.name}`,
                    start: new Date(apt.startTime),
                    end: new Date(apt.endTime),
                    userId: apt.employeeId,
                    color: generateColor(apt.employeeId),
                }));

                setEvents(formattedEvents);
                setSelectedUsers(getInitialSelection(users));

            } catch (e: any) {
                setError(e.message || 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        if (users.length > 0) {
            fetchAppointments();
        }
    }, [users, getInitialSelection]);


    const [dayViewSelectionCache, setDayViewSelectionCache] = useState<Array<string | number>>([]);
    const [singleViewSelectionCache, setSingleViewSelectionCache] = useState<string | number | null>(null);

    useEffect(() => {
        if (users.length > 0 && selectedUsers.length === 0) {
            const initialSelection = getInitialSelection(users);
            setSelectedUsers(initialSelection);
            setDayViewSelectionCache(initialSelection);
            setSingleViewSelectionCache(initialSelection.length > 0 ? initialSelection[0] : (users.length > 0 ? users[0].id : null));
        }
    }, [users, selectedUsers, getInitialSelection]);


    const [selectedEvent, setSelectedEvent] = useState<SchedulerEvent | null>(null);
    const [showEventModal, setShowEventModal] = useState<boolean>(false);
    const [showUserModal, setShowUserModal] = useState<boolean>(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [pendingEventChange, setPendingEventChange] = useState<{ event: SchedulerEvent, newStart: Date, newEnd: Date, newUserId: string | number } | null>(null);

    const [draggedEvent, setDraggedEvent] = useState<SchedulerEvent | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Re-sync with URL parameters when they change
    useEffect(() => {
        if (!isClient || users.length === 0) return;

        const newDate = getInitialDate();
        const newView = getInitialView();
        const newSelection = getInitialSelection(users);

        setCurrentDate(newDate);
        setView(newView);
        setSelectedUsers(newSelection);

        if (newView === 'day') {
            setDayViewSelectionCache(newSelection);
        } else {
            setSingleViewSelectionCache(newSelection.length > 0 ? newSelection[0] : null);
        }
    }, [urlSearchParams, isClient, users, getInitialDate, getInitialView, getInitialSelection]);

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

        setPendingEventChange({
            event: draggedEvent,
            newStart,
            newEnd,
            newUserId: targetUserId || draggedEvent.userId,
        });

        setShowConfirmationModal(true);
        handleDragEnd();
    };

    const confirmEventChange = () => {
        if (!pendingEventChange) return;

        const { event, newStart, newEnd, newUserId } = pendingEventChange;

        const updatedEvent: SchedulerEvent = {
            ...event,
            start: newStart,
            end: newEnd,
            userId: newUserId,
        };

        setEvents(events.map(e => e.id === event.id ? updatedEvent : e));
        setShowConfirmationModal(false);
        setPendingEventChange(null);
    };

    const cancelEventChange = () => {
        setShowConfirmationModal(false);
        setPendingEventChange(null);
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Enhanced URL update with localStorage persistence
    useEffect(() => {
        if (!isClient) return;

        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams();
            params.set('date', currentDate.toISOString());
            params.set('view', view);

            if (selectedUsers.length > 0) {
                params.set('employees', selectedUsers.map(id => id.toString()).join(','));
            }

            safeLocalStorage.set(STORAGE_KEYS.DATE, currentDate.toISOString());
            safeLocalStorage.set(STORAGE_KEYS.VIEW, view);
            safeLocalStorage.set(STORAGE_KEYS.SELECTED_USERS, selectedUsers.map(id => id.toString()).join(','));

            const newUrl = `${pathname}?${params.toString()}`;
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
            id: selectedEvent?.id || crypto.randomUUID(),
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
        draggedEvent, // Expose draggedEvent
        handleDragStart,
        handleDragEnd,
        handleDrop,
        showConfirmationModal,
        confirmEventChange,
        cancelEventChange,
        isLoading,
        error,
    };
};
