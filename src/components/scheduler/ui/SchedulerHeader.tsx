"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Users, Calendar } from 'lucide-react';
import { ViewType } from '../types';
import { formatDateHeader } from '../utils';
import { DatePicker } from './DatePicker';

interface SchedulerHeaderProps {
  currentDate: Date;
  view: ViewType;
  viewingUserName: string | null;
  onNavigate: (direction: number) => void;
  onSetView: (view: ViewType) => void;
  onDateSelect: (date: Date) => void;
  onAddAppointment: () => void;
  onOpenUserSelector: () => void;
}

export const SchedulerHeader: React.FC<SchedulerHeaderProps> = ({
  currentDate,
  view,
  viewingUserName,
  onNavigate,
  onSetView,
  onDateSelect,
  onAddAppointment,
  onOpenUserSelector,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setShowDatePicker(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerRef]);

  return (
    <header className="bg-white border-b border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Scheduler</h1>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button onClick={() => onNavigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
          <div className="relative" ref={datePickerRef}>
            <button onClick={() => setShowDatePicker(!showDatePicker)} className="px-3 py-1.5 text-sm font-semibold bg-gray-100 rounded-lg flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Calander</span>
            </button>
            {showDatePicker && (
              <div class="absolute z-50 mt-2 bg-white rounded-md shadow-lg border">
                <DatePicker selectedDate={currentDate} onDateChange={handleDateSelect} />
              </div>
            )}
          </div>
          <button onClick={() => onNavigate(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 hidden md:block">
          {formatDateHeader(currentDate, view)}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        <button onClick={onOpenUserSelector} className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">
          <Users className="w-4 h-4" />
          <span className="text-sm font-semibold">
            {view === 'day' ? 'Select Employees' : viewingUserName ? `Viewing: ${viewingUserName}` : 'Select Employee'}
          </span>
        </button>

        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['day', 'week', 'month'] as ViewType[]).map(v => (
            <button key={v} onClick={() => onSetView(v)} className={`px-3 py-1 text-sm rounded-md capitalize font-medium ${view === v ? 'bg-white shadow-sm' : ''}`}>
              {v}
            </button>
          ))}
        </div>
        <button onClick={onAddAppointment} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-semibold">Add Appointment</span>
        </button>
      </div>
    </header>
  );
};
