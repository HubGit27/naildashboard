"use client";
/*
Server: Renders with new Date() (today)
Client Hydration: Also starts with new Date() (same as server) ✅
After Hydration: Checks localStorage/URL and updates if different
Calendar: Briefly shows today, then smoothly transitions to stored date
*/
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  // Always start with current date for SSR consistency
  const [value, onChange] = useState<Value>(new Date());
  const [isHydrated, setIsHydrated] = useState(false);

  const router = useRouter();

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
    onChange(newValue);
    
    // Save to localStorage when user clicks a date
    if (newValue instanceof Date) {
      localStorage.setItem('selectedCalendarDate', newValue.toISOString());
    }
  };

  // Update URL when value changes (preserve other search params)
  useEffect(() => {
    if (isHydrated && value instanceof Date) {
      const params = new URLSearchParams(window.location.search);
      params.set('date', value.toString());
      router.push(`${window.location.pathname}?${params.toString()}`);
    }
  }, [value, router, isHydrated]);

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