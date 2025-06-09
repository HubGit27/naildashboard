// app/calendar/page.tsx

import Announcements from "@/components/Announcements";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import ResizeableColumnContainer from "@/components/ResizeableColumnContainer";
import CollapsiblePanel from "@/components/CollapsiblePanel";
import Scheduler from "@/components/scheduler/Scheduler";
import prisma from "@/lib/prisma";

// This is a Server Component - its only job is data fetching and layout
const CalendarPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  // Hardcoded for now, should come from authentication/session
  const storeId = "123"; 

  // Fetch initial data on the server
  const employees = await prisma.employee.findMany({
    where: storeId ? { stores: { some: { id: storeId } } } : undefined,
    select: { id: true, firstName: true, lastName: true },
  });

  const initialDate = searchParams.date || new Date().toISOString();

  // The users for the scheduler could be employees, teachers, or a mix
  // For this example, let's map employees to the User type structure
  const initialUsers = employees.map(emp => ({
    id: emp.id,
    name: `${emp.firstName} ${emp.lastName}`,
    // You'd add color/avatar logic here, maybe based on a hash of the ID
    color: `#${emp.id.substring(0, 6)}`, // Example color generation
    avatar: `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase(),
  }));


  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      <div className="transition-all duration-300 ease-in-out w-full flex flex-col gap-8">
        {/* Pass server-fetched data as props to the Client Component */}
        <Scheduler
          initialUsers={initialUsers}
          initialDate={initialDate}
          searchParams={searchParams}
        />
      </div>

      <CollapsiblePanel>
        <ResizeableColumnContainer title="Calendar" defaultHeight={400}>
          <EventCalendarContainer searchParams={searchParams} />
        </ResizeableColumnContainer>
        <ResizeableColumnContainer title="Announcements" defaultHeight={300}>
          <Announcements />
        </ResizeableColumnContainer>
      </CollapsiblePanel>
    </div>
  );
};

export default CalendarPage;