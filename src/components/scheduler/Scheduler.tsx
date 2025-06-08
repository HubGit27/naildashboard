// components/scheduler/Scheduler.tsx
"use client";

import React from 'react';
import { useScheduler } from './hooks/useScheduler';
import { User, SchedulerEvent } from './types';

import { SchedulerHeader } from './ui/SchedulerHeader';
import { UserSelectionModal } from './ui/UserSelectionModal';
import { EventModal } from './ui/EventModal';
import { DayView } from './views/DayView';
import { WeekView } from './views/WeekView';
import { MonthView } from './views/MonthView';

interface SchedulerProps {
  initialUsers: User[];
  initialDate?: string;
  searchParams: { [key: string]: string | undefined };
}

const Scheduler: React.FC<SchedulerProps> = ({ initialUsers, initialDate, searchParams }) => {
  const {
    isClient,
    currentDate,
    setCurrentDate,
    view,
    setView,
    users,
    visibleUsers,
    events,
    showEventModal,
    setShowEventModal,
    selectedEvent,
    setSelectedEvent,
    navigateDate,
    handleSaveEvent,
    handleDayClickInMonthView,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    selectedUsers,
    handleUserToggle,
    showUserModal,
    setShowUserModal,
  } = useScheduler({ initialUsers, initialDate, searchParams });

  const handleAddEventClick = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };
  
  const handleEventClick = (event: SchedulerEvent) => {
    if (!isDragging) {
      setSelectedEvent(event);
      setShowEventModal(true);
    }
  };

  const renderView = () => {
    switch (view) {
      case 'day':
        return <DayView 
            currentDate={currentDate} 
            users={visibleUsers} 
            events={events} 
            onEventClick={handleEventClick}
            isDragging={isDragging}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
        />;
      case 'week':
        return <WeekView 
            currentDate={currentDate} 
            events={events} 
            onEventClick={handleEventClick}
            isDragging={isDragging}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
        />;
      case 'month':
        return <MonthView 
            currentDate={currentDate} 
            events={events} 
            onDayClick={handleDayClickInMonthView} 
        />;
      default:
        return null;
    }
  };

  if (!isClient) {
    return <div className="p-8 text-center">Loading Scheduler...</div>;
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      <SchedulerHeader
        currentDate={currentDate}
        view={view}
        onNavigate={navigateDate}
        onSetView={setView}
        onToday={() => setCurrentDate(new Date())}
        onAddEvent={handleAddEventClick}
        onOpenUserSelector={() => setShowUserModal(true)}
      />
      
      <div className="flex-1 overflow-auto">
        {renderView()}
      </div>

      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onSave={handleSaveEvent}
          eventData={selectedEvent}
          users={users}
        />
      )}
      
      {showUserModal && (
        <UserSelectionModal
            isOpen={showUserModal}
            onClose={() => setShowUserModal(false)}
            users={users}
            selectedUsers={selectedUsers}
            onToggle={handleUserToggle}
        />
      )}
    </div>
  );
};

export default Scheduler;
