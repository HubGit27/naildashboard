// components/scheduler/ui/EventModal.tsx
"use client";

import React,  { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { SchedulerEvent, User, EventForm } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: EventForm) => void;
  onDelete?: (eventId: number) => void;
  eventData: SchedulerEvent | null;
  users: User[];
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, eventData, users }) => {
  const [formState, setFormState] = useState<EventForm>({
    title: '',
    start: '',
    end: '',
    userId: users[0]?.id || '',
    color: users[0]?.color || '#3b82f6',
  });
  const [localStart, setLocalStart] = useState('');
  const [localEnd, setLocalEnd] = useState('');

  /**
   * Converts a UTC date string to a local datetime-local compatible string.
   * param utcDateString The UTC date string.
   * returns A string in "YYYY-MM-DDTHH:mm" format in the user's local time.
   */
  const formatForDateTimeLocal = (utcDateString: string): string => {
    if (!utcDateString) return '';
    console.log(utcDateString)
    const utcString = utcDateString.endsWith('Z') ? utcDateString : utcDateString + 'Z';
    const date = new Date(utcString);
    console.log(date)
    // Manually build the string in local time
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // months are 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    console.log(`${year}-${month}-${day}T${hours}:${minutes}`)
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  useEffect(() => {
    setLocalStart(formatForDateTimeLocal(formState.start));
  }, [formState.start]);

  useEffect(() => {
    setLocalEnd(formatForDateTimeLocal(formState.end));
  }, [formState.end]);
  useEffect(() => {
    if (eventData) {
      setFormState({
        title: eventData.title,
        start: eventData.start.toISOString().slice(0, 16),
        end: eventData.end.toISOString().slice(0, 16),
        userId: eventData.userId,
        color: eventData.color,
      });
    } else {
      const defaultStartTime = new Date();
      const defaultEndTime = new Date(defaultStartTime.getTime() + 60 * 60 * 1000);
      setFormState({
        title: '',
        start: defaultStartTime.toISOString().slice(0, 16),
        end: defaultEndTime.toISOString().slice(0, 16),
        userId: users[0]?.id || '',
        color: users[0]?.color || '#3b82f6',
      });
    }
  }, [eventData, users, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.title && formState.start && formState.end) {
        onSave(formState);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{eventData ? 'Edit Event' : 'Add New Event'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" name="title" id="title" value={formState.title} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700">User</label>
              <select name="userId" id="userId" value={formState.userId} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="start" className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="datetime-local"
                name="start"
                id="start"
                value={localStart}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="end" className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="datetime-local"
                name="end"
                id="end"
                value={localEnd}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div>
              {eventData && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(eventData.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                  aria-label="Delete Event"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                {eventData ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
