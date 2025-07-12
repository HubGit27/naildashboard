
"use client";

import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const handleDateChange = (value: any) => {
    if (value instanceof Date) {
      onDateChange(value);
    }
  };

  return (
    <Calendar
      onChange={handleDateChange}
      value={selectedDate}
      className="rounded-md border"
    />
  );
}
