/*
Server: Renders with new Date() (today)
Client Hydration: Also starts with new Date() (same as server) ✅
After Hydration: Checks localStorage/URL and updates if different
Calendar: Briefly shows today, then smoothly transitions to stored date
*/
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  // Always start with current date for SSR consistency
  const [value, onChange] = useState<Value>(new Date());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isUpdatingFromCalendar, setIsUpdatingFromCalendar] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Mark as hydrated after client-side mount
  useEffect(() => {
    setIsHydrated(true);
    
    // Only after hydration, check localStorage/URL and update if needed
    const stored = localStorage.getItem('selectedCalendarDate');
    if (stored) {
      onChange(new Date(stored));
    } else {
      const urlDate = new URLSearchParams(window.location.search).get('date');
      if (urlDate) {
        onChange(new Date(urlDate));
      }
    }
  }, []);

  // Custom handler that saves to localStorage and updates URL
  const handleDateChange = (newValue: Value) => {
    setIsUpdatingFromCalendar(true);
    onChange(newValue);
    
    // Save to localStorage when user clicks a date
    if (newValue instanceof Date) {
      localStorage.setItem('selectedCalendarDate', newValue.toISOString());
    }
    
    // Reset flag after a brief delay
    setTimeout(() => setIsUpdatingFromCalendar(false), 100);
  };

  // Update URL when value changes (preserve other search params)
  useEffect(() => {
    if (isHydrated && value instanceof Date && isUpdatingFromCalendar) {
      const params = new URLSearchParams(window.location.search);
      params.set('date', value.toString());
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }
  }, [value, router, isHydrated, isUpdatingFromCalendar]);

  // Listen for external URL changes (from other components)
  useEffect(() => {
    if (!isHydrated || isUpdatingFromCalendar) return;

    const urlDate = searchParams?.get('date');
    if (urlDate) {
      const newDate = new Date(urlDate);
      // Only update if it's different from current value
      if (value instanceof Date && newDate.getTime() !== value.getTime()) {
        onChange(newDate);
        localStorage.setItem('selectedCalendarDate', newDate.toISOString());
      } else if (!(value instanceof Date)) {
        onChange(newDate);
        localStorage.setItem('selectedCalendarDate', newDate.toISOString());
      }
    }
  }, [searchParams, isHydrated, isUpdatingFromCalendar, value]);

  // Sync localStorage to URL on component mount (preserve other search params)
  useEffect(() => {
    if (!isHydrated) return;
    
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
  }, [isHydrated, router]);

  return <Calendar onChange={handleDateChange} value={value} />;
};

export default EventCalendar;