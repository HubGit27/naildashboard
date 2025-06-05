'use client';

interface DropZoneProps {
  time: string;
  date: Date;
  employees: Employee[];
}

export function DropZone({ time, date, employees }: DropZoneProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Handle appointment drop logic
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="absolute inset-0"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Invisible drop zone overlay */}
    </div>
  );
}