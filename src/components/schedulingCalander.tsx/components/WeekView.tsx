import { AppointmentCard } from './AppointmentCard';
import { TimeSlot } from './TimeSlot';

interface WeekViewProps {
  date: Date;
  employees: Employee[];
  appointments: Appointment[];
}

export function WeekView({ date, employees, appointments }: WeekViewProps) {
  const weekDays = getWeekDays(date);
  const timeSlots = generateTimeSlots();

  return (
    <div className="flex-1 flex">
      {/* Time column */}
      <div className="w-16 bg-gray-50 border-r border-gray-200">
        <div className="h-16 border-b border-gray-200"></div>
        {timeSlots.map(time => (
          <div key={time} className="h-16 border-b border-gray-100 text-xs text-gray-500 p-2">
            {time.endsWith(':00') ? time.slice(0, -3) : ''}
          </div>
        ))}
      </div>
      
      {/* Days columns */}
      <div className="flex-1 flex">
        {weekDays.map(day => (
          <DayColumn 
            key={day.toISOString()}
            date={day}
            employees={employees}
            appointments={appointments.filter(apt => 
              apt.start.toDateString() === day.toDateString()
            )}
            timeSlots={timeSlots}
          />
        ))}
      </div>
    </div>
  );
}