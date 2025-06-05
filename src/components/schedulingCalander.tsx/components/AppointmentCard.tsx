
import { EditAppointmentButton } from './EditAppointmentButton';

interface AppointmentCardProps {
  appointment: Appointment;
  date: Date;
}

export function AppointmentCard({ appointment, date }: AppointmentCardProps) {
  if (appointment.start.toDateString() !== date.toDateString()) {
    return null;
  }

  const startHour = appointment.start.getHours() + appointment.start.getMinutes() / 60;
  const endHour = appointment.end.getHours() + appointment.end.getMinutes() / 60;
  const duration = endHour - startHour;
  const topPosition = (startHour - 8) * 64; // Assuming 8 AM start, 64px per hour

  return (
    <div
      className="absolute left-1 right-1 bg-blue-500 text-white rounded-lg p-2 text-xs cursor-pointer hover:bg-blue-600 transition-colors"
      style={{
        top: `${topPosition}px`,
        height: `${duration * 64}px`,
        zIndex: 10
      }}
    >
      <div className="font-medium truncate">{appointment.title}</div>
      <div className="text-xs opacity-90">
        {appointment.start.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        })}
      </div>
      <div className="text-xs opacity-75 truncate">{appointment.services}</div>
      
      {/* Client component for interaction */}
      <EditAppointmentButton appointment={appointment} />
    </div>
  );
}