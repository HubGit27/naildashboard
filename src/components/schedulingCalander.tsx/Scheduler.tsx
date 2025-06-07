"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Calendar } from 'lucide-react';
import prisma from "@/lib/prisma";
import { useRouter,useSearchParams  } from "next/navigation";
// Type definitions
interface User {
  id: number;
  name: string;
  color: string;
  avatar: string;
}

interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  color: string;
  userId: number;
}

interface EventForm {
  title: string;
  start: string;
  end: string;
  color: string;
  userId: number;
}

interface UserForm {
  name: string;
  color: string;
  avatar: string;
}

interface MonthDay {
  date: Date;
  isCurrentMonth: boolean;
}

type ViewType = 'day' | 'week' | 'month';

const Scheduler = ({
  relatedData,
  searchParams,
}:{
  relatedData?: any;
  searchParams: { [keys: string]: string | undefined };
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<ViewType>('day');
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'John Doe', color: '#3b82f6', avatar: 'JD' },
    { id: 2, name: 'Jane Smith', color: '#ef4444', avatar: 'JS' },
    { id: 3, name: 'Mike Johnson', color: '#10b981', avatar: 'MJ' }
  ]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([1, 2, 3]);
  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: 'Team Meeting',
      start: new Date(2025, 5, 1, 9, 0),
      end: new Date(2025, 5, 1, 10, 30),
      color: '#3b82f6',
      userId: 1
    },
    {
      id: 2,
      title: 'Project Review',
      start: new Date(2025, 5, 1, 14, 0),
      end: new Date(2025, 5, 1, 15, 30),
      color: '#ef4444',
      userId: 2
    },
    {
      id: 3,
      title: 'Client Call',
      start: new Date(2025, 5, 1, 11, 0),
      end: new Date(2025, 5, 1, 12, 0),
      color: '#10b981',
      userId: 3
    },
    {
      id: 4,
      title: 'Design Review',
      start: new Date(2025, 5, 1, 13, 0),
      end: new Date(2025, 5, 1, 14, 0),
      color: '#3b82f6',
      userId: 1
    },
    {
      id: 5,
      title: 'Code Review',
      start: new Date(2025, 5, 1, 10, 0),
      end: new Date(2025, 5, 1, 11, 30),
      color: '#ef4444',
      userId: 2
    }
  ]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [eventForm, setEventForm] = useState<EventForm>({
    title: '',
    start: '',
    end: '',
    color: '#3b82f6',
    userId: 1
  });
  const [userForm, setUserForm] = useState<UserForm>({
    name: '',
    color: '#3b82f6',
    avatar: ''
  });
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Time slots for day/week view
  const timeSlots = useMemo<string[]>(() => {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:15`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
      slots.push(`${hour.toString().padStart(2, '0')}:45`);
    }
    console.log("timeSlots: ", slots)
    return slots;

  }, []);

  // Get days for week view
  const getWeekDays = (date: Date): Date[] => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get days for month view
  const getMonthDays = (date: Date): MonthDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: MonthDay[] = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    return days;
  };

  // Navigation functions
  const navigateDate = (direction: number): void => {
    const newDate = new Date(currentDate);
    
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() + direction);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    }
    
    setCurrentDate(newDate);
  };

  // User management
  const handleUserToggle = (userId: number): void => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleAddUser = (): void => {
    setUserForm({
      name: '',
      color: '#3b82f6',
      avatar: ''
    });
    setShowUserModal(true);
  };

  const handleSaveUser = (): void => {
    if (!userForm.name) return;
    
    const avatar = userForm.avatar || userForm.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    const newUser: User = {
      id: Date.now(),
      name: userForm.name,
      color: userForm.color,
      avatar: avatar.substring(0, 2)
    };
    
    setUsers([...users, newUser]);
    setSelectedUsers([...selectedUsers, newUser.id]);
    setShowUserModal(false);
  };
  // Add this state to track selected employees
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const router = useRouter();
  const newSearchParams = useSearchParams();

  const handleEmployeeSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedIds = selectedOptions.map(option => option.value); // Keep as strings
    
    console.log('Selected employees:', selectedIds); // Debug log
    setSelectedEmployees(selectedIds);
  };
  const handleSaveEmployees = () => {

    const params = new URLSearchParams(newSearchParams);
    console.log(selectedEmployees)
    if (selectedEmployees.length > 0) {
      // Save selected employee IDs as comma-separated string
      params.set('employees', selectedEmployees.join(','));
    } else {
      // Remove the parameter if no employees selected
      params.delete('employees');
    }
    
    // Update the URL with new search params
    router.push(`?${params.toString()}`);
    
    // Close the modal
    setShowUserModal(false);
  };

  const handleDeleteUser = (userId: number): void => {
    if (users.length <= 1) return; // Keep at least one user
    
    setUsers(users.filter(u => u.id !== userId));
    setSelectedUsers(selectedUsers.filter(id => id !== userId));
    setEvents(events.filter(e => e.userId !== userId));
  };

  const getVisibleUsers = (): User[] => {
    return users.filter(user => selectedUsers.includes(user.id));
  };

  const getUserById = (userId: number): User | undefined => {
    return users.find(u => u.id === userId);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, event: Event): void => {
    setDraggedEvent(event);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', (e.target as HTMLElement).outerHTML);
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>): void => {
    (e.target as HTMLElement).style.opacity = '1';
    setIsDragging(false);
    setDraggedEvent(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTimeSlotDrop = (e: React.DragEvent<HTMLDivElement>, date: Date, timeSlot: string, userId?: number): void => {
    if (userId) {
      handleDrop(e, date, timeSlot, userId);
    } else {
      handleDrop(e, date, timeSlot);
    }
  };

  const handleDateDrop = (e: React.DragEvent<HTMLDivElement>, date: Date): void => {
    handleDrop(e, date);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetDate: Date, targetTime?: string, targetUserId?: number): void => {
    e.preventDefault();
    
    if (!draggedEvent) return;
    
    const eventDuration = draggedEvent.end.getTime() - draggedEvent.start.getTime();
    let newStart: Date;
    
    if (targetTime) {
      // For day/week view with specific time
      const [hours, minutes] = targetTime.split(':').map(Number);
      newStart = new Date(targetDate);
      newStart.setHours(hours, minutes, 0, 0);
    } else {
      // For month view, keep the same time but change the date
      newStart = new Date(targetDate);
      newStart.setHours(draggedEvent.start.getHours(), draggedEvent.start.getMinutes(), 0, 0);
    }
    
    const newEnd = new Date(newStart.getTime() + eventDuration);
    
    const updatedEvent: Event = {
      ...draggedEvent,
      start: newStart,
      end: newEnd,
      userId: targetUserId || draggedEvent.userId
    };
    
    setEvents(events.map(event => 
      event.id === draggedEvent.id ? updatedEvent : event
    ));
    
    setDraggedEvent(null);
    setIsDragging(false);
  };

  // Event management
  const handleEventClick = (event: Event): void => {
    setSelectedEvent(event);
    const user = getUserById(event.userId);
    setEventForm({
      title: event.title,
      start: event.start.toISOString().slice(0, 16),
      end: event.end.toISOString().slice(0, 16),
      color: user ? user.color : event.color,
      userId: event.userId
    });
    setShowEventModal(true);
  };

  const handleAddEvent = (): void => {
    setSelectedEvent(null);
    const firstUser = getVisibleUsers()[0];
    setEventForm({
      title: '',
      start: new Date().toISOString().slice(0, 16),
      end: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      color: firstUser ? firstUser.color : '#3b82f6',
      userId: firstUser ? firstUser.id : 1
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = (): void => {
    if (!eventForm.title || !eventForm.start || !eventForm.end) return;
    
    const user = getUserById(eventForm.userId);
    
    const newEvent: Event = {
      id: selectedEvent?.id || Date.now(),
      title: eventForm.title,
      start: new Date(eventForm.start),
      end: new Date(eventForm.end),
      color: user ? user.color : eventForm.color,
      userId: eventForm.userId
    };
    
    if (selectedEvent) {
      setEvents(events.map(e => e.id === selectedEvent.id ? newEvent : e));
    } else {
      setEvents([...events, newEvent]);
    }
    
    setShowEventModal(false);
  };

  const handleDeleteEvent = (): void => {
    if (selectedEvent) {
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      setShowEventModal(false);
    }
  };

  // Check if event is on a specific date
  const isEventOnDate = (event: Event, date: Date): boolean => {
    const eventDate = new Date(event.start);
    return eventDate.toDateString() === date.toDateString();
  };

  // Get events for a specific date and user
  const getEventsForDateAndUser = (date: Date, userId: number): Event[] => {
    return events.filter(event => 
      isEventOnDate(event, date) && event.userId === userId
    );
  };

  // Get events for a specific date (for month view)
  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(event => isEventOnDate(event, date));
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate event position for multi-user day view
  const getEventStyleForUser = (event: Event, date: Date, userId: number): React.CSSProperties => {
    if (!isEventOnDate(event, date) || event.userId !== userId) {
      return { display: 'none' };
    }
    
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    const duration = endHour - startHour;
    //console.log("startHour", startHour, "endHour", endHour, "event" , event)
    return {
      position: 'absolute',
      top: `${startHour * 240}px`,
      height: `${duration * 240}px`,
      left: '4px',
      right: '4px',
      backgroundColor: event.color,
      color: 'white',
      borderRadius: '6px',
      padding: '6px 8px',
      fontSize: '12px',
      cursor: isDragging && draggedEvent?.id === event.id ? 'grabbing' : 'grab',
      zIndex: 10,
      overflow: 'hidden',
      opacity: isDragging && draggedEvent?.id === event.id ? 0.5 : 1,
      transform: isDragging && draggedEvent?.id === event.id ? 'rotate(2deg)' : 'none',
      transition: 'all 0.2s ease',
      border: '2px solid rgba(255,255,255,0.2)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };
  };

  // Calculate event position for time-based views
  const getEventStyle = (event: Event, date: Date): React.CSSProperties => {
    if (!isEventOnDate(event, date)) return { display: 'none' };
    
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    const duration = endHour - startHour;
    
    return {
      position: 'absolute',
      top: `${startHour * 240}px`,
      height: `${duration * 240}px`,
      left: '2px',
      right: '2px',
      backgroundColor: event.color,
      color: 'white',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '12px',
      cursor: isDragging && draggedEvent?.id === event.id ? 'grabbing' : 'grab',
      zIndex: 10,
      overflow: 'hidden',
      opacity: isDragging && draggedEvent?.id === event.id ? 0.5 : 1,
      transform: isDragging && draggedEvent?.id === event.id ? 'rotate(2deg)' : 'none',
      transition: 'all 0.2s ease'
    };
  };

  const weekDays = view === 'week' ? getWeekDays(currentDate) : [];
  const monthDays = view === 'month' ? getMonthDays(currentDate) : [];
  
  const { employees } = relatedData;
  console.log(employees);
  return (
    <div className="flex flex-col gap-3">
      <div className="w-full h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Scheduler</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateDate(1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg"
              >
                Today
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['day', 'week', 'month'] as ViewType[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 text-sm rounded-md capitalize ${
                    view === v ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            
            {/* User Management for Day View */}
            {view === 'day' && (
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-sm text-gray-600">Users:</span>
                <div className="flex items-center space-x-1">
                  {users.map(user => (
                    <button
                        key={user.id}
                        onClick={() => handleUserToggle(user.id)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs transition-all ${
                          selectedUsers.includes(user.id)
                            ? 'bg-opacity-20 text-gray-800 border-2' // Note: style prop below might override background
                            : 'bg-gray-100 text-gray-500 border-2 border-transparent'
                        }`}
                        style={{
                          backgroundColor: selectedUsers.includes(user.id) ? `${user.color}40` : undefined, // Appends '40' for ~25% opacity if user.color is a hex like #RRGGBB
                          borderColor: selectedUsers.includes(user.id) ? user.color : 'transparent',
                        }}
                        aria-pressed={selectedUsers.includes(user.id)} // Good for accessibility to indicate toggle state
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.avatar}
                      </div>
                      <span>{user.name}</span>
                      {users.length > 1 && (
                        <span // Changed from <button> to <span>
                          onClick={(e: React.MouseEvent<HTMLSpanElement>) => { // Typed the event
                            e.stopPropagation(); // Crucial to prevent the outer button's onClick
                            handleDeleteUser(user.id);
                          }}
                          onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => { // Typed the event
                            // Standard keyboard accessibility for button-like elements
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault(); // Prevent default space scroll or enter form submit
                              e.stopPropagation();
                              handleDeleteUser(user.id);
                            }
                          }}
                          className="ml-1 text-gray-400 hover:text-red-500 cursor-pointer" // Added cursor-pointer
                          role="button" // Accessibility: Informs assistive tech this span acts as a button
                          tabIndex={0} // Accessibility: Makes the span focusable via keyboard
                          aria-label={`Remove ${user.name}`} // Accessibility: Clear label for the action
                        >
                          ×
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={handleAddUser}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={handleAddEvent}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Current Date Display */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {view === 'day' && formatDate(currentDate)}
            {view === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
            {view === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        {/* Calendar Content */}
        <div className="flex-1 overflow-auto">
          {view === 'day' && (
            <div className="flex">
              {/* Time column */}
              <div className="w-16 bg-gray-50 border-r border-gray-200 flex-shrink-0">
                <div key={"time"} className="h-[60px] border-b border-gray-100 text-xs text-gray-500 p-2">
                </div>
                {timeSlots.map(time => (
                  <div key={time} className="h-[60px] border-b border-gray-100 text-xs text-gray-500 p-2">
                    { time.endsWith(':00') || time.endsWith(':30') ? time : ''}
                  </div>
                ))}
              </div>
              
              {/* User columns */}
              <div className="flex-1 flex overflow-x-auto">
                {getVisibleUsers().map(user => (
                  <div key={user.id} className="flex-1 min-w-[200px] border-r border-gray-200 relative">
                    {/* User header */}
                    <div className="bg-gray-50 p-3 border-b border-gray-200 flex items-center space-x-2 sticky top-0 z-20">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">
                          {getEventsForDateAndUser(currentDate, user.id).length} events
                        </div>
                      </div>
                    </div>
                    
                    {/* Time slots for this user */}
                    <div className="relative">
                      {timeSlots.map(time => (
                        <div 
                          key={time} 
                          className="h-[60px] border-b border-gray-100 hover:bg-blue-50 transition-colors relative"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleTimeSlotDrop(e, currentDate, time, user.id)}
                        >
                          {/* Time slot indicator */}
                          <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-blue-100 border-2 border-dashed border-blue-300 rounded transition-opacity">
                            Create Appointment at 
                            {time}
                          </div>
                        </div>
                      ))}
                      
                      {/* Events for this user */}
                      {events.map(event => (
                        <div
                          key={event.id}
                          draggable
                          style={getEventStyleForUser(event, currentDate, user.id)}
                          onClick={(e) => {
                            if (!isDragging) {
                              handleEventClick(event);
                            }
                          }}
                          onDragStart={(e) => handleDragStart(e, event)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-90">
                            {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Empty state when no users selected */}
                {getVisibleUsers().length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No users selected</p>
                      <p className="text-sm">Select users from the header to view their schedules</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'week' && (
            <div className="flex h-full">
              {/* Time column */}
              <div className="w-16 bg-gray-50 border-r border-gray-200">
                {timeSlots.map(time => (
                  <div key={time} className="h-[60px] border-b border-gray-100 text-xs text-gray-500 p-2">
                    {time.endsWith(':00') ? time.slice(0, -3) : ''}
                  </div>
                ))}
              </div>
              
              {/* Week columns */}
              <div className="flex-1 flex">
                {weekDays.map(day => (
                  <div key={day.toISOString()} className="flex-1 border-r border-gray-200 relative">
                    <div className="bg-gray-50 p-2 border-b border-gray-200 text-center">
                      <div className="text-xs text-gray-500">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-sm font-medium ${
                        day.toDateString() === new Date().toDateString() 
                          ? 'text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center mx-auto' 
                          : 'text-gray-900'
                      }`}>
                        {day.getDate()}
                      </div>
                    </div>
                    
                    <div className="relative">
                      {timeSlots.map(time => (
                        <div 
                          key={time} 
                          className="h-[60px] border-b border-gray-100 hover:bg-blue-50 transition-colors"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleTimeSlotDrop(e, day, time)}
                        ></div>
                      ))}
                      
                      {events.map(event => (
                        <div
                          key={event.id}
                          draggable
                          style={getEventStyle(event, day)}
                          onClick={(e) => {
                            if (!isDragging) {
                              handleEventClick(event);
                            }
                          }}
                          onDragStart={(e) => handleDragStart(e, event)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-75">
                            {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'month' && (
            <div className="p-4">
              {/* Month grid header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-700">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Month grid */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((dayObj, index) => {
                  const dayEvents = getEventsForDate(dayObj.date);
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border border-gray-200 transition-colors ${
                        dayObj.isCurrentMonth ? 'bg-white hover:bg-blue-50' : 'bg-gray-50'
                      } ${
                        dayObj.date.toDateString() === new Date().toDateString() 
                          ? 'ring-2 ring-blue-500' 
                          : ''
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDateDrop(e, dayObj.date)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        dayObj.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {dayObj.date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            draggable
                            className={`text-xs px-2 py-1 rounded text-white truncate transition-all ${
                              isDragging && draggedEvent?.id === event.id 
                                ? 'opacity-50 cursor-grabbing transform rotate-1' 
                                : 'cursor-grab hover:scale-105'
                            }`}
                            style={{ backgroundColor: event.color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isDragging) {
                                handleEventClick(event);
                              }
                            }}
                            onDragStart={(e) => handleDragStart(e, event)}
                            onDragEnd={handleDragEnd}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedEvent ? 'Edit Event' : 'Add Event'}
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Event title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned User
                  </label>
                  <select
                    value={eventForm.userId}
                    onChange={(e) => {
                      const userId = parseInt(e.target.value);
                      const user = getUserById(userId);
                      setEventForm({
                        ...eventForm, 
                        userId,
                        color: user ? user.color : eventForm.color
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.start}
                    onChange={(e) => setEventForm({...eventForm, start: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.end}
                    onChange={(e) => setEventForm({...eventForm, end: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <div>
                  {selectedEvent && (
                    <button
                      onClick={handleDeleteEvent}
                      className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEvent}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Employees to Calendar</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-xs text-gray-500">Employees</label>
                  <select
                    multiple
                    className="ring-[1.5px] ring-gray-300 p-2 rounded-md w-full h-32"
                    value={selectedEmployees.map(String)} // Convert to strings for the select
                    onChange={handleEmployeeSelection}
                  >
                    {employees.length > 0 ? (
                      employees.map((employee: { id: number; firstName: string; lastName: string }) => (
                        <option value={employee.id} key={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </option>
                      ))
                    ) : (
                      <option disabled>No employees available</option>
                    )}
                  </select>
                  {selectedEmployees.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEmployees}
                  disabled={selectedEmployees.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Employees
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduler;