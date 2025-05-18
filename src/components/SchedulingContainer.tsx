"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import EventCalendarContainer from "./EventCalendarContainer";
import EmployeeSelector, { Employee } from "./EmployeeSelector";
import TimeScheduler, { Appointment } from "./TimeScheduler";

// Mock data - replace with actual API calls
const MOCK_EMPLOYEES: Employee[] = [
  { id: "emp1", name: "John Smith" },
  { id: "emp2", name: "Sarah Johnson" },
  { id: "emp3", name: "David Wilson" },
  { id: "emp4", name: "Maria Garcia" },
  { id: "emp5", name: "Alex Chen" },
];

// Mock appointments - replace with actual API calls
const fetchAppointmentsForDate = async (dateStr: string): Promise<Appointment[]> => {
  console.log("Fetching appointments for:", dateStr);
  
  // In a real app, make an API call here
  return [
    {
      id: "apt1",
      title: "Team Meeting",
      startTime: "09:00",
      endTime: "10:30",
      description: "Weekly sync",
      employeeId: "emp1",
      color: "#E8F5E9",
    },
    {
      id: "apt2",
      title: "Client Call",
      startTime: "11:00",
      endTime: "12:00",
      description: "Project review",
      employeeId: "emp2",
      color: "#FFF8E1",
    },
    {
      id: "apt3",
      title: "Lunch Break",
      startTime: "12:00",
      endTime: "13:00",
      employeeId: "emp1",
      color: "#E3F2FD",
    },
    {
      id: "apt4",
      title: "Development",
      startTime: "14:00",
      endTime: "16:00",
      description: "Frontend work",
      employeeId: "emp3",
      color: "#F3E5F5",
    },
    {
      id: "apt5",
      title: "Interview",
      startTime: "10:00",
      endTime: "11:00",
      description: "Sr. Developer position",
      employeeId: "emp2",
      color: "#FFEBEE",
    },
  ];
};

const SchedulingContainer = () => {
  const [employees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(["emp1", "emp2"]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  
  // Parse date from the URL parameter
  const selectedDate = dateParam ? new Date(dateParam) : null;

  // Fetch appointments when date changes
  useEffect(() => {
    if (dateParam) {
      fetchAppointmentsForDate(dateParam).then(data => {
        setAppointments(data);
      });
    } else {
      setAppointments([]);
    }
  }, [dateParam]);

  return (
    <div className="flex flex-col gap-3">
        <div className="bg-white p-4 rounded-md shadow-sm mb-4">
          <h2 className="text-xl font-semibold mb-4">Team Schedule</h2>
          <EmployeeSelector 
            employees={employees}
            selectedEmployeeIds={selectedEmployeeIds}
            onSelectionChange={setSelectedEmployeeIds}
          />
        </div>
        <TimeScheduler
          date={selectedDate}
          appointments={appointments}
          employees={employees}
          selectedEmployeeIds={selectedEmployeeIds}
        />
      </div>
  );
};

export default SchedulingContainer;