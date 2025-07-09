// components/scheduler/ui/AppointmentDetails.tsx
"use client";

import React from 'react';
import { SchedulerAppointment, User } from '../types';

interface AppointmentDetailsProps {
  appointment: SchedulerAppointment;
  user?: User;
  onClose: () => void;
}

export const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ appointment, user, onClose }) => {
  return (
    <div className="p-4 bg-white h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{appointment.title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          &times;
        </button>
      </div>
      <p><strong>User:</strong> {user ? user.name : 'Unknown'}</p>
      <p><strong>Start:</strong> {appointment.start.toLocaleString()}</p>
      <p><strong>End:</strong> {appointment.end.toLocaleString()}</p>
    </div>
  );
};