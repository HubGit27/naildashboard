// components/TimeScheduler.tsx
"use client";

import { useMemo } from "react";
import { Employee } from "./EmployeeSelector";

export type Appointment = {
  id: string;
  title: string;
  startTime: string; // format: "HH:MM" (24-hour)
  endTime: string; // format: "HH:MM" (24-hour)
  description?: string;
  employeeId: string;
  color?: string; // For visual distinction
};

interface TimeSchedulerProps {
  date: Date | null;
  appointments: Appointment[];
  employees: Employee[];
  selectedEmployeeIds: string[];
}

// Helper function to convert "HH:MM" to minutes since midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper function to format time display
const formatTimeDisplay = (hour: number): string => {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
};

const TimeScheduler = ({
  date,
  appointments,
  employees,
  selectedEmployeeIds,
}: TimeSchedulerProps) => {
  // Generate time slots for the day (hourly from 8 AM to 6 PM)
  const timeSlots = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => i + 7); // 8 AM to 6 PM
  }, []);

  // Filter appointments for selected employees
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) =>
      selectedEmployeeIds.includes(apt.employeeId)
    );
  }, [appointments, selectedEmployeeIds]);

  // Get employee name by ID
  const getEmployeeName = (id: string): string => {
    const employee = employees.find((emp) => emp.id === id);
    return employee ? employee.name : "Unknown";
  };

  // Calculate position and height for appointment blocks
  const getAppointmentStyle = (appointment: Appointment) => {
    const startMinutes = timeToMinutes(appointment.startTime);
    const endMinutes = timeToMinutes(appointment.endTime);
    
    // Schedule starts at 8 AM (480 minutes)
    const startPosition = ((startMinutes - 480) / 60) * 100;
    const duration = (endMinutes - startMinutes) / 60;
    
    return {
      top: `${startPosition}%`,
      height: `${duration * 100}%`,
      backgroundColor: appointment.color || "#E3EFFF",
      borderLeft: `3px solid ${appointment.color ? appointment.color : "#3B82F6"}`,
    };
  };

  if (!date) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-md">
        <p className="text-gray-500">Select a date to view the schedule</p>
      </div>
    );
  }

  if (selectedEmployeeIds.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-md">
        <p className="text-gray-500">Select team members to view their schedule</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-semibold">
          {date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </h2>
      </div>

      {/* Shared scroll container */}
      <div className="flex h-[800px] overflow-y-auto">
        {/* Time indicators */}
        <div className="w-16 border-r pr-2 flex-shrink-0 relative">
          <div className="relative h-[800px]">
            {timeSlots.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-right text-xs text-gray-500"
                style={{ top: `${((hour - 8) / 18) * 100}%` }}
              >
                {formatTimeDisplay(hour)}
              </div>
            ))}
          </div>
        </div>

        {/* Schedule grid */}
        <div className="flex-grow relative h-[800px]">
          {/* Hour lines */}
          {timeSlots.map((hour) => (
            <div
              key={hour}
              className="absolute w-full border-t border-gray-200"
              style={{ top: `${((hour - 8) / 10) * 100}%` }}
            />
          ))}

          {/* Display employees as columns */}
          <div className="flex h-full">
            {selectedEmployeeIds.map((empId) => (
              <div
                key={empId}
                className="flex-1 relative border-r p-1 min-w-[120px]"
              >
                <div className="sticky top-0 bg-blue-50 p-1 text-center text-xs font-medium z-10 rounded mb-1">
                  {getEmployeeName(empId)}
                </div>

                {/* Render appointments for this employee */}
                {filteredAppointments
                  .filter((apt) => apt.employeeId === empId)
                  .map((appointment) => (
                    <div
                      key={appointment.id}
                      className="absolute left-1 right-1 p-2 rounded shadow-sm overflow-hidden"
                      style={getAppointmentStyle(appointment)}
                    >
                      <h4 className="font-medium text-sm truncate">{appointment.title}</h4>
                      <p className="text-xs text-gray-600 truncate">
                        {appointment.startTime} - {appointment.endTime}
                      </p>
                      {appointment.description && (
                        <p className="text-xs truncate mt-1">{appointment.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeScheduler;