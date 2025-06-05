import { DropZone } from './DropZone';

interface TimeSlotProps {
  time: string;
  date: Date;
  employees: Employee[];
}

export function TimeSlot({ time, date, employees }: TimeSlotProps) {
  return (
    <div className="h-16 border-b border-gray-100 relative">
      {/* Server-rendered time slot */}
      <div className="h-full hover:bg-blue-50 transition-colors">
        {/* Client component for drag/drop functionality */}
        <DropZone 
          time={time}
          date={date}
          employees={employees}
        />
      </div>
    </div>
  );
}