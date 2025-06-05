
// app/scheduler/page.tsx - Main SSR page
import { Suspense } from 'react';
// import { SchedulerService } from '@/lib/scheduler-service';
import { CalendarGrid } from './components/CalendarGrid';
// import { SchedulerHeader } from './components/SchedulerHeader';
// import { SchedulerSidebar } from './components/SchedulerSidebar';

/*
app/
├── scheduler/
│   ├── page.tsx                    // Main page with SSR data fetching
│   ├── components/
│   │   ├── SchedulerHeader.tsx     // Navigation, view controls (client)
│   │   ├── SchedulerSidebar.tsx    // Employee list, filters (client)
│   │   ├── CalendarGrid.tsx        // Main calendar layout (server)
│   │   ├── DayView.tsx             // Day view component (server)
│   │   ├── WeekView.tsx            // Week view component (server)
│   │   ├── MonthView.tsx           // Month view component (server)
│   │   ├── AppointmentCard.tsx     // Individual appointment (server)
│   │   ├── TimeSlot.tsx            // Time slot component (server)
│   │   └── modals/
│   │       ├── AppointmentModal.tsx // Edit/create appointments (client)
│   │       └── CustomerModal.tsx   // Customer selection (client)
│   ├── actions/
│   │   ├── appointments.ts         // Server actions for appointments
│   │   ├── employees.ts            // Server actions for employees
│   │   └── customers.ts            // Server actions for customers
│   └── types/
│       └── scheduler.ts            // Shared types
├── lib/
│   ├── prisma.ts                   // Prisma client
│   └── scheduler-service.ts        // Business logic
└── api/
    └── scheduler/
        ├── appointments/
        │   └── route.ts            // API routes for real-time updates
        └── availability/
            └── route.ts            // Check availability endpoint
*/


interface SchedulerPageProps {
  searchParams: {
    view?: 'day' | 'week' | 'month';
    date?: string;
    employees?: string;
  };
}

export default async function SchedulerPage({ searchParams }: SchedulerPageProps) {
  const view = searchParams.view || 'week';
  const date = searchParams.date ? new Date(searchParams.date) : new Date();
  const selectedEmployeeIds = searchParams.employees?.split(',') || [];

  // // Server-side data fetching
  // const [employees, appointments, services, customers] = await Promise.all([
  //   SchedulerService.getEmployees(),
  //   SchedulerService.getAppointments(
  //     getStartDate(date, view),
  //     getEndDate(date, view),
  //     selectedEmployeeIds
  //   ),
  //   SchedulerService.getServices(),
  //   SchedulerService.getCustomers()
  // ]);

  return (
    <div className="h-screen flex flex-col">
      {/* Client-side header for navigation */}
      <SchedulerHeader 
        currentDate={date}
        view={view}
        employees={employees}
        selectedEmployeeIds={selectedEmployeeIds}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Client-side sidebar for filters */}
        <SchedulerSidebar 
          employees={employees}
          selectedEmployeeIds={selectedEmployeeIds}
          services={services}
          customers={customers}
        />
        
        {/* Server-side rendered calendar */}
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarGrid 
            view={view}
            date={date}
            employees={employees.filter(emp => 
              selectedEmployeeIds.length === 0 || selectedEmployeeIds.includes(emp.id)
            )}
            appointments={appointments}
          />
        </Suspense>
      </div>
    </div>
  );
}

function getStartDate(date: Date, view: string): Date {
  // Implementation for getting start date based on view
  const start = new Date(date);
  if (view === 'week') {
    start.setDate(date.getDate() - date.getDay());
  } else if (view === 'month') {
    start.setDate(1);
  }
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndDate(date: Date, view: string): Date {
  // Implementation for getting end date based on view
  const end = new Date(date);
  if (view === 'week') {
    end.setDate(date.getDate() - date.getDay() + 6);
  } else if (view === 'month') {
    end.setMonth(date.getMonth() + 1, 0);
  }
  end.setHours(23, 59, 59, 999);
  return end;
}



// import { useState, useEffect } from "react";
// import { useSearchParams } from "next/navigation";
// import EventCalendarContainer from "../EventCalendarContainer";
// import EmployeeSelector, { Employee } from "./EmployeeSelector";
// import TimeScheduler, { Appointment } from "./TimeScheduler";
// import Scheduler from "./Scheduler";
// import prisma from "@/lib/prisma";
// import {Prisma} from "@prisma/client";

// const SchedulingContainer = async () => {

//   return (
//       <div className="flex flex-col gap-3">
//         <Scheduler/>
//       </div>
//   );
// };

// export default SchedulingContainer;



// Mock data - replace with actual API calls
// const MOCK_EMPLOYEES: Employee[] = [
//   { id: "emp1", name: "John Smith" },
//   { id: "emp2", name: "Sarah Johnson" },
//   { id: "emp3", name: "David Wilson" },
//   { id: "emp4", name: "Maria Garcia" },
//   { id: "emp5", name: "Alex Chen" },
// ];

// // Mock appointments - replace with actual API calls
// const fetchAppointmentsForDate = async (dateStr: string): Promise<Appointment[]> => {
//   console.log("Fetching appointments for:", dateStr);
  
//   // In a real app, make an API call here
//   return [
//     {
//       id: "apt1",
//       title: "Team Meeting",
//       startTime: "09:00",
//       endTime: "10:30",
//       description: "Weekly sync",
//       employeeId: "emp1",
//       color: "#E8F5E9",
//     },
//     {
//       id: "apt2",
//       title: "Client Call",
//       startTime: "11:00",
//       endTime: "12:00",
//       description: "Project review",
//       employeeId: "emp2",
//       color: "#FFF8E1",
//     },
//     {
//       id: "apt3",
//       title: "Lunch Break",
//       startTime: "12:00",
//       endTime: "13:00",
//       employeeId: "emp1",
//       color: "#E3F2FD",
//     },
//     {
//       id: "apt4",
//       title: "Development",
//       startTime: "14:00",
//       endTime: "16:00",
//       description: "Frontend work",
//       employeeId: "emp3",
//       color: "#F3E5F5",
//     },
//     {
//       id: "apt5",
//       title: "Interview",
//       startTime: "10:00",
//       endTime: "11:00",
//       description: "Sr. Developer position",
//       employeeId: "emp2",
//       color: "#FFEBEE",
//     },
//   ];
// };

// const SchedulingContainer = async () => {
  // const [employees] = useState<Employee[]>(MOCK_EMPLOYEES);
  // const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(["emp1", "emp2"]);
  // const [appointments, setAppointments] = useState<Appointment[]>([]);
  // const searchParams = useSearchParams();
  // const dateParam = searchParams.get("date");
  
  // // Parse date from the URL parameter
  // const selectedDate = dateParam ? new Date(dateParam) : null;
  
  // const query: Prisma.StudentWhereInput = {};

  // if (queryParams) {
  //   for (const [key, value] of Object.entries(queryParams)) {
  //     if (value !== undefined) {
  //       switch (key) {
  //         case "teacherId":
  //           query.class = {
  //             lessons: {
  //               some: {
  //                 teacherId: value,
  //               },
  //             },
  //           };
  //           break;
  //         case "search":
  //           query.name = { contains: value, mode: "insensitive" };
  //           break;
  //         default:
  //           break;
  //       }
  //     }
  //   }
  // }
  // const [data, count] = await prisma.$transaction([
  //   prisma.student.findMany({
  //     where: query,
  //     include: {
  //       class: true,
  //     },
  //     take: ITEM_PER_PAGE,
  //     skip: ITEM_PER_PAGE * (p - 1),
  //   }),
  //   prisma.student.count({ where: query }),
  // ]);
  // Fetch appointments when date changes
  // useEffect(() => {
  //   if (dateParam) {
  //     fetchAppointmentsForDate(dateParam).then(data => {
  //       setAppointments(data);
  //     });
  //   } else {
  //     setAppointments([]);
  //   }
  // }, [dateParam]);

//   return (
//       <div className="flex flex-col gap-3">
//         {/* <div className="bg-white p-4 rounded-md shadow-sm mb-4">
//           <h2 className="text-xl font-semibold mb-4">Team Schedule</h2>
//           <EmployeeSelector 
//             employees={employees}
//             selectedEmployeeIds={selectedEmployeeIds}
//             onSelectionChange={setSelectedEmployeeIds}
//           />
//         </div> */}
//         <Scheduler/>
//         {/* <TimeScheduler
//           date={selectedDate}
//           appointments={appointments}
//           employees={employees}
//           selectedEmployeeIds={selectedEmployeeIds}
//         /> */}
//       </div>
//   );
// };

// export default SchedulingContainer;