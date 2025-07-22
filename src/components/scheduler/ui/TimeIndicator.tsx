"use client";

import React, { useState, useEffect } from 'react';

interface TimeIndicatorProps {
  startHour: number;
  hourRowHeight: number;
}

const TimeIndicator: React.FC<TimeIndicatorProps> = ({ startHour, hourRowHeight }) => {
  const [topPosition, setTopPosition] = useState(0);

  const calculatePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = (hours - startHour) * 60 + minutes;
    return (totalMinutes / 60) * hourRowHeight;
  };

  useEffect(() => {
    const updatePosition = () => {
      setTopPosition(calculatePosition());
    };

    updatePosition();

    const intervalId = setInterval(updatePosition, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [startHour, hourRowHeight]);

  if (topPosition < 0) {
    return null;
  }

  return (
    <div
      className="absolute w-full"
      style={{ top: `${topPosition}px`, zIndex: 30 }}
    >
      <div className="relative h-0">
        <div className="absolute left-0 w-full h-0.5 bg-red-500"></div>
        {/* <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500"></div> */}
      </div>
    </div>
  );
};

export default TimeIndicator;
