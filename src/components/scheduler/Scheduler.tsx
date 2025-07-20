// components/scheduler/Scheduler.tsx
"use client";

import React, { useMemo, useCallback } from 'react';
import { useScheduler } from './hooks/useScheduler';
import { User, SchedulerAppointment } from './types';

import { SchedulerHeader } from './ui/SchedulerHeader';
import { UserSelectionModal } from './ui/UserSelectionModal';
import { AppointmentModal } from './ui/AppointmentModal';
import { ConfirmationModal } from './ui/ConfirmationModal'; // Import ConfirmationModal
import { DayView } from './views/DayView';
import { WeekView } from './views/WeekView';
import { MonthView } from './views/MonthView';

interface SchedulerProps {
  initialUsers: User[];

  searchParams: { [key: string]: string | undefined };
}

const Scheduler: React.FC<SchedulerProps> = ({initialUsers, searchParams }) => {
  const {
    isClient,
    currentDate,
    setCurrentDate,
    view,
    setView,
    users,
    visibleUsers,
    appointments: visibleAppointments,
    showAppointmentModal,
    setShowAppointmentModal,
    selectedAppointment,
    setSelectedAppointment,
    appointmentToURL,
    navigateDate,
    handleSaveAppointment,
    handleDayClickInMonthView,
    isDragging,
    draggedAppointment,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    selectedUsers,
    handleUserToggle,
    showUserModal,
    setShowUserModal,
    showConfirmationModal, // Destructure showConfirmationModal
    confirmAppointmentChange, // Destructure confirmAppointmentChange
    cancelAppointmentChange, // Destructure cancelAppointmentChange
    columnWidths, // Destructure columnWidths
    setColumnWidths, // Destructure setColumnWidths
    isLoading,
    error,
  } = useScheduler({ initialUsers, searchParams });

  const viewingUserName = useMemo(() => {
    if (view !== 'day' && selectedUsers.length === 1) {
      const selectedUser = users.find(user => user.id === selectedUsers[0]);
      return selectedUser ? selectedUser.name : null;
    }
    return null;
  }, [users, selectedUsers, view]);

  const handleAddAppointmentClick = useCallback(() => {
    setSelectedAppointment(null);
    setShowAppointmentModal(true);
  }, [setSelectedAppointment, setShowAppointmentModal]);
  
  const handleAppointmentClick = useCallback((appointment: SchedulerAppointment) => {
    if (!isDragging) {
      setSelectedAppointment(appointment);
      setShowAppointmentModal(true);
      appointmentToURL(appointment);
    }
  }, [isDragging, setSelectedAppointment, setShowAppointmentModal, appointmentToURL]);

  const renderView = () => {
    if (isLoading) {
        return <div className="p-8 text-center">Loading Scheduler...</div>;
    }
    if (error) {
        return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    }

    switch (view) {
      case 'day':
        return <DayView 
            currentDate={currentDate} 
            users={visibleUsers} 
            appointments={visibleAppointments}
            onAppointmentClick={handleAppointmentClick}
            isDragging={isDragging}
            draggedAppointment={draggedAppointment}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            columnWidths={columnWidths} // Pass columnWidths
            setColumnWidths={setColumnWidths} // Pass setColumnWidths
        />;
      case 'week':
        return <WeekView 
            currentDate={currentDate} 
            appointments={visibleAppointments}
            onAppointmentClick={handleAppointmentClick}
            isDragging={isDragging}
            draggedAppointment={draggedAppointment} // Pass draggedAppointment
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
        />;
      case 'month':
        return <MonthView 
            currentDate={currentDate} 
            appointments={visibleAppointments}
            onDayClick={handleDayClickInMonthView} 
        />;
      default:
        return null;
    }
  };

  if (!isClient) {
    return <div className="p-8 text-center">Initializing Scheduler...</div>;
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      <SchedulerHeader
        currentDate={currentDate}
        view={view}
        viewingUserName={viewingUserName}
        onNavigate={navigateDate}
        onSetView={setView}
        onDateSelect={setCurrentDate}
        onAddAppointment={handleAddAppointmentClick}
        onOpenUserSelector={() => setShowUserModal(true)}
      />
      
      <div className="flex-1 overflow-auto">
        {renderView()}
      </div>

      {/* {showAppointmentModal && (
        <AppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          onSave={handleSaveAppointment}
          appointmentData={selectedAppointment}
          users={users}
        />
      )} */}
      
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

      <ConfirmationModal
        isOpen={showConfirmationModal}
        onConfirm={confirmAppointmentChange}
        onCancel={cancelAppointmentChange}
        message="Are you sure you want to move this appointment?"
      />
    </div>
  );
};

export default Scheduler;
