// components/scheduler/Scheduler.tsx
"use client";

import React, { useMemo } from 'react'; // Import useMemo
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
    events: visibleEvents,
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

  // --- FIX: Determine the name of the single selected user ---
  const viewingUserName = useMemo(() => {
    if (view !== 'day' && selectedUsers.length === 1) {
      const selectedUser = users.find(user => user.id === selectedUsers[0]);
      return selectedUser ? selectedUser.name : null;
    }
    return null;
  }, [users, selectedUsers, view]);


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
            events={visibleEvents}
            onEventClick={handleEventClick}
            isDragging={isDragging}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
        />;
      case 'week':
        return <WeekView 
            currentDate={currentDate} 
            events={visibleEvents}
            onEventClick={handleEventClick}
            isDragging={isDragging}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
        />;
      case 'month':
        return <MonthView 
            currentDate={currentDate} 
            events={visibleEvents}
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
        viewingUserName={viewingUserName} // Pass the name to the header
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
            view={view}
        />
      )}
    </div>
  );
};

export default Scheduler;
