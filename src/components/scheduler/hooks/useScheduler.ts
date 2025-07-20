// components/scheduler/hooks/useScheduler.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { User, SchedulerAppointment, AppointmentForm, ViewType } from '../types';

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
    COLUMN_WIDTHS: 'scheduler_column_widths',
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
    const [appointments, setAppointments] = useState<SchedulerAppointment[]>([]);
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
    const [urlAppointmentId, setUrlAppointmentId] = useState<string | null>(null);
    const [columnWidths, setColumnWidths] = useState<number[]>(() => {
        const storedWidths = safeLocalStorage.get(STORAGE_KEYS.COLUMN_WIDTHS);
        if (storedWidths) {
            try {
                const parsed = JSON.parse(storedWidths);
                if (Array.isArray(parsed) && parsed.every(item => typeof item === 'number')) {
                    return parsed;
                }
            } catch {
                // Fallback to empty array if parsing fails
            }
        }
        return [];
    });

    useEffect(() => {
        if (columnWidths.length > 0) {
            safeLocalStorage.set(STORAGE_KEYS.COLUMN_WIDTHS, JSON.stringify(columnWidths));
        }
    }, [columnWidths]);

    const [dayViewSelectionCache, setDayViewSelectionCache] = useState<Array<string | number>>(() => {
        const stored = safeLocalStorage.get(STORAGE_KEYS.SELECTED_USERS);
        return stored ? stored.split(',') : [];
    });
    const [singleViewSelectionCache, setSingleViewSelectionCache] = useState<string | number | null>(() => {
        const stored = safeLocalStorage.get(STORAGE_KEYS.SELECTED_USERS);
        const firstUser = stored?.split(',')[0];
        return firstUser || null;
    });

    const selectedUsers = useMemo(() => {
        if (view === 'day') {
            return dayViewSelectionCache.length > 0 ? dayViewSelectionCache : (users.length > 0 ? [users[0].id] : []);
        } else {
            return singleViewSelectionCache ? [singleViewSelectionCache] : (users.length > 0 ? [users[0].id] : []);
        }
    }, [view, dayViewSelectionCache, singleViewSelectionCache, users]);

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

                const formattedAppointments: SchedulerAppointment[] = fetchedAppointments.map((apt: any) => ({
                    id: apt.id,
                    title: `${apt.customer.name}`,
                    start: new Date(apt.startTime),
                    end: new Date(apt.endTime),
                    userId: apt.employeeId,
                    color: generateColor(apt.employeeId),
                }));

                setAppointments(formattedAppointments);

                const initialSelection = getInitialSelection(users);
                if (dayViewSelectionCache.length === 0) {
                    setDayViewSelectionCache(initialSelection);
                }
                if (!singleViewSelectionCache) {
                    setSingleViewSelectionCache(initialSelection.length > 0 ? initialSelection[0] : (users.length > 0 ? users[0].id : null));
                }

            } catch (e: any) {
                setError(e.message || 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        if (users.length > 0) {
            fetchAppointments();
        }
    }, [users, getInitialSelection, dayViewSelectionCache, singleViewSelectionCache]);


    const [selectedAppointment, setSelectedAppointment] = useState<SchedulerAppointment | null>(null);
    const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
    const [showUserModal, setShowUserModal] = useState<boolean>(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [pendingAppointmentChange, setPendingAppointmentChange] = useState<{ appointment: SchedulerAppointment, newStart: Date, newEnd: Date, newUserId: string | number } | null>(null);

    const [draggedAppointment, setDraggedAppointment] = useState<SchedulerAppointment | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleUserToggle = useCallback((userId: string | number) => {
        if (view === 'day') {
            const newSelection = dayViewSelectionCache.includes(userId)
                ? dayViewSelectionCache.length > 1 ? dayViewSelectionCache.filter(id => id !== userId) : dayViewSelectionCache
                : [...dayViewSelectionCache, userId];
            setDayViewSelectionCache(newSelection);
        } else {
            setSingleViewSelectionCache(userId);
        }
    }, [view, dayViewSelectionCache]);



    const handleDragEnd = useCallback(() => {
        setDraggedAppointment(null);
        setIsDragging(false);
    }, []);

    const handleDragStart = useCallback((event: React.DragEvent, schedulerAppointment: SchedulerAppointment) => {
        setDraggedAppointment(schedulerAppointment);
        setIsDragging(true);
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDrop = useCallback((targetDate: Date, targetTime: string, targetUserId?: string | number) => {
        if (!draggedAppointment) return;

        const appointmentDuration = draggedAppointment.end.getTime() - draggedAppointment.start.getTime();
        const [hours, minutes] = targetTime.split(':').map(Number);
        const newStart = new Date(targetDate);
        newStart.setHours(hours, minutes, 0, 0);

        const newEnd = new Date(newStart.getTime() + appointmentDuration);

        setPendingAppointmentChange({
            appointment: draggedAppointment,
            newStart,
            newEnd,
            newUserId: targetUserId || draggedAppointment.userId,
        });

        setShowConfirmationModal(true);
        handleDragEnd();
    }, [draggedAppointment, handleDragEnd]);

    const confirmAppointmentChange = useCallback(async () => {
        if (!pendingAppointmentChange) return;

        const { appointment, newStart, newEnd, newUserId } = pendingAppointmentChange;

        try {
            const response = await fetch(`/server-api/appointments/${appointment.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        startTime: newStart.toISOString(),
                        endTime: newEnd.toISOString(),
                        employeeId: newUserId,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update appointment');
            }

            const updatedAppointment: SchedulerAppointment = {
                ...appointment,
                start: newStart,
                end: newEnd,
                userId: newUserId,
            };

            setAppointments(appointments.map(a => a.id === appointment.id ? updatedAppointment : a));
        } catch (error) {
            console.error("Failed to save appointment changes:", error);
            // Optionally, revert the change in the UI or show an error message
        } finally {
            setShowConfirmationModal(false);
            setPendingAppointmentChange(null);
        }
    }, [pendingAppointmentChange, appointments]);

    const cancelAppointmentChange = useCallback(() => {
        setShowConfirmationModal(false);
        setPendingAppointmentChange(null);
    }, []);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);

            params.set('date', currentDate.toISOString());
            params.set('view', view);

            if (selectedUsers.length > 0) {
                params.set('employees', selectedUsers.map(id => id.toString()).join(','));
            } else {
                params.delete('employees');
            }

            if (urlAppointmentId) {
                params.set('appointmentId', urlAppointmentId);
            } else {
                params.delete('appointmentId');
            }
            
            safeLocalStorage.set(STORAGE_KEYS.DATE, currentDate.toISOString());
            safeLocalStorage.set(STORAGE_KEYS.VIEW, view);
            safeLocalStorage.set(STORAGE_KEYS.SELECTED_USERS, selectedUsers.map(id => id.toString()).join(','));

            const newUrl = `${pathname}?${params.toString()}`;

            if (newUrl !== window.location.pathname + window.location.search) {
                router.replace(newUrl, { scroll: false });
            }
        }, 100); // Debounce URL updates

        return () => clearTimeout(timeoutId);
    }, [currentDate, selectedUsers, view, isClient, router, pathname, urlAppointmentId]);

    const navigateDate = useCallback((direction: number) => {
        const newDate = new Date(currentDate);
        if (view === 'day') newDate.setDate(currentDate.getDate() + direction);
        else if (view === 'week') newDate.setDate(currentDate.getDate() + (direction * 7));
        else if (view === 'month') newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    }, [currentDate, view]);

    const handleDayClickInMonthView = useCallback((clickedDate: Date) => {
        setCurrentDate(clickedDate);
        setView('day');
    }, []);

    const handleSaveAppointment = useCallback((appointmentData: AppointmentForm) => {
        const user = users.find(u => u.id === appointmentData.userId);
        const newAppointment: SchedulerAppointment = {
            id: selectedAppointment?.id || crypto.randomUUID(),
            title: appointmentData.title,
            start: new Date(appointmentData.start),
            end: new Date(appointmentData.end),
            color: user ? user.color : '#3b82f6',
            userId: appointmentData.userId
        };
        if (selectedAppointment) {
            setAppointments(appointments.map(a => a.id === selectedAppointment.id ? newAppointment : a));
        } else {
            setAppointments([...appointments, newAppointment]);
        }
        setShowAppointmentModal(false);
        setSelectedAppointment(null);
    }, [users, selectedAppointment, appointments]);

    const visibleUsers = useMemo(() =>
        users.filter(user => selectedUsers.includes(user.id)),
        [users, selectedUsers]
    );

    const visibleAppointments = useMemo(() =>
        appointments.filter(appointment => selectedUsers.includes(appointment.userId)),
        [appointments, selectedUsers]
    );
    
    const appointmentToURL = useCallback((appointment: SchedulerAppointment) => {
        setUrlAppointmentId(appointment.id);
    }, []);
    return {
        isClient,
        currentDate,
        setCurrentDate,
        view,
        setView,
        users,
        visibleUsers,
        appointments: visibleAppointments,
        selectedUsers,
        handleUserToggle,
        showAppointmentModal,
        setShowAppointmentModal,
        appointmentToURL,
        showUserModal,
        setShowUserModal,
        selectedAppointment,
        setSelectedAppointment,
        navigateDate,
        handleSaveAppointment,
        handleDayClickInMonthView,
        isDragging,
        draggedAppointment, // Expose draggedAppointment
        handleDragStart,
        handleDragEnd,
        handleDrop,
        showConfirmationModal,
        confirmAppointmentChange,
        cancelAppointmentChange,
        columnWidths, // Expose columnWidths
        setColumnWidths, // Expose setColumnWidths
        isLoading,
        error,
    };
};