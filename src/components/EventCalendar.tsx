"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  // Initialize from localStorage, URL, or current date (in that order of priority)
  const [value, onChange] = useState<Value>(() => {
    if (typeof window !== 'undefined') {
      // First check localStorage for user's last selected date
      const stored = localStorage.getItem('selectedCalendarDate');
      if (stored) {
        return new Date(stored);
      }
      
      // Then check URL params
      const urlDate = new URLSearchParams(window.location.search).get('date');
      if (urlDate) {
        return new Date(urlDate);
      }
    }
    
    // Fallback to current date
    return new Date();
  });

  const router = useRouter();

  // Custom handler that saves to localStorage and updates URL
  const handleDateChange = (newValue: Value) => {
    onChange(newValue);
    
    // Save to localStorage when user clicks a date
    if (newValue instanceof Date) {
      localStorage.setItem('selectedCalendarDate', newValue.toISOString());
    }
  };

  // Update URL when value changes (preserve other search params)
  useEffect(() => {
    if (value instanceof Date) {
      const params = new URLSearchParams(window.location.search);
      params.set('date', value.toString());
      router.push(`${window.location.pathname}?${params.toString()}`);
    }
  }, [value, router]);

  // Sync localStorage to URL on component mount (preserve other search params)
  useEffect(() => {
    const stored = localStorage.getItem('selectedCalendarDate');
    
    if (stored) {
      const storedDate = new Date(stored);
      const currentParams = new URLSearchParams(window.location.search);
      const urlDate = currentParams.get('date');
      
      // If localStorage has a date but URL doesn't match, update URL
      if (urlDate !== storedDate.toString()) {
        currentParams.set('date', storedDate.toString());
        router.replace(`${window.location.pathname}?${currentParams.toString()}`);
      }
    }
  }, []); // Only run once on mount

  return <Calendar onChange={handleDateChange} value={value} />;
};

export default EventCalendar;