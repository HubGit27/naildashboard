interface DayColumnProps {
  date: Date;
  employees: Employee[];
  appointments: Appointment[];
  timeSlots: string[];
}

function DayColumn({ date, employees, appointments, timeSlots }: DayColumnProps) {
  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <div className="flex-1 border-r border-gray-200 relative min-w-0">
      {/* Day header */}
      <div className="bg-gray-50 p-3 border-b border-gray-200 text-center">
        <div className="text-xs text-gray-500">
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div className={`text-sm font-medium ${
          isToday ? 'text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center mx-auto' : 'text-gray-900'
        }`}>
          {date.getDate()}
        </div>
      </div>
      
      {/* Time slots */}
      <div className="relative">
        {timeSlots.map(time => (
          <TimeSlot 
            key={time}
            time={time}
            date={date}
            employees={employees}
          />
        ))}
        
        {/* Appointments overlay */}
        {appointments.map(appointment => (
          <AppointmentCard 
            key={appointment.id}
            appointment={appointment}
            date={date}
          />
        ))}
      </div>
    </div>
  );
}