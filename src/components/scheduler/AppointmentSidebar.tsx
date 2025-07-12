// components/scheduler/AppointmentSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ResizeableColumnContainer from "@/components/ResizeableColumnContainer";
import { SchedulerAppointment } from "./types";

interface AppointmentSidebarProps {
  initialAppointment: SchedulerAppointment | null;
  searchParams: { [key: string]: string | undefined };
}

export default function AppointmentSidebar({ initialAppointment, searchParams }: AppointmentSidebarProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<SchedulerAppointment | null>(initialAppointment);
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();

  // Listen for appointment changes from URL
  useEffect(() => {
    const appointmentId = urlSearchParams.get('appointment');
    
    if (appointmentId && !selectedAppointment) {
      // Fetch appointment data if not already loaded
      fetchAppointment(appointmentId);
    } else if (!appointmentId && selectedAppointment) {
      // Clear appointment if removed from URL
      setSelectedAppointment(null);
    }
  }, [urlSearchParams, selectedAppointment]);

  // Custom event listener for appointment selection from Scheduler
  useEffect(() => {
    const handleAppointmentSelect = (event: CustomEvent<SchedulerAppointment>) => {
      const appointment = event.detail;
      setSelectedAppointment(appointment);
      
      // Update URL without full page reload
      const params = new URLSearchParams(window.location.search);
      params.set('appointment', appointment.id);
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    };

    const handleAppointmentClear = () => {
      setSelectedAppointment(null);
      
      // Remove from URL
      const params = new URLSearchParams(window.location.search);
      params.delete('appointment');
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    };

    // Listen for custom events from Scheduler
    window.addEventListener('scheduler:appointmentSelect', handleAppointmentSelect as EventListener);
    window.addEventListener('scheduler:appointmentClear', handleAppointmentClear);

    return () => {
      window.removeEventListener('scheduler:appointmentSelect', handleAppointmentSelect as EventListener);
      window.removeEventListener('scheduler:appointmentClear', handleAppointmentClear);
    };
  }, [pathname]);

  const fetchAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`);
      if (response.ok) {
        const appointmentData = await response.json();
        setSelectedAppointment({
          id: appointmentData.id,
          title: appointmentData.customer.name,
          start: new Date(appointmentData.startTime),
          end: new Date(appointmentData.endTime),
          userId: appointmentData.employeeId,
          color: `#${appointmentData.employeeId.substring(0, 6)}`,
        });
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
    }
  };

  const handleClose = () => {
    setSelectedAppointment(null);
    
    // Remove from URL
    const params = new URLSearchParams(window.location.search);
    params.delete('appointment');
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  };

  // Don't render if no appointment selected
  if (!selectedAppointment) {
    return null;
  }

  return (
    <ResizeableColumnContainer title="Appointment Details" defaultHeight={300}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">{selectedAppointment.title}</h3>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Start:</span> {selectedAppointment.start.toLocaleString()}
          </div>
          <div>
            <span className="font-medium">End:</span> {selectedAppointment.end.toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Duration:</span> {
              Math.round((selectedAppointment.end.getTime() - selectedAppointment.start.getTime()) / (1000 * 60))
            } minutes
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            Edit
          </button>
          <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
            Delete
          </button>
        </div>
      </div>
    </ResizeableColumnContainer>
  );
}