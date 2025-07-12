import Announcements from "@/components/Announcements";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import ResizeableColumnContainer from "@/components/ResizeableColumnContainer";
import CollapsiblePanel from "@/components/CollapsiblePanel";
import Scheduler from "@/components/scheduler/Scheduler";
import prisma from "@/lib/prisma";
import AppointmentDetails from "@/components/scheduler/ui/AppointmentDetails";

// This is a Server Component - its only job is data fetching and layout
const storeId = "123";   
const employees = await prisma.employee.findMany({
    where: storeId ? { stores: { some: { id: storeId } } } : undefined,
    select: { id: true, firstName: true, lastName: true },
  });  
const initialUsers = employees.map(emp => ({
    id: emp.id,
    name: `${emp.firstName} ${emp.lastName}`,
    // You'd add color/avatar logic here, maybe based on a hash of the ID
    color: `#${emp.id.substring(0, 6)}`, // Example color generation
    avatar: `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase(),
  }));

const CalendarPage = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
  const appointmentId = searchParams?.appointmentId;
  let appointment = null;
  if (appointmentId) {
    const fetchedAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        employee: true,
        appointmentServices: {
          include: {
            service: true,
          }
        }
      }
    });

    if (fetchedAppointment) {
      appointment = {
        ...fetchedAppointment,
        appointmentServices: fetchedAppointment.appointmentServices.map(as => ({
          ...as,
          price: as.price.toString(),
          service: {
            ...as.service,
            price: as.service.price.toString(),
          }
        })),
      };
    }
  }

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      <div className="transition-all duration-300 ease-in-out w-full flex flex-col gap-8">
        {/* Pass server-fetched data as props to the Client Component */}
        <Scheduler
          initialUsers={initialUsers}
          searchParams={searchParams}
        />
      </div>

      <CollapsiblePanel>
        {appointment && <AppointmentDetails appointment={appointment} />}
        {/* <ResizeableColumnContainer title="Calendar" defaultHeight={400}>
          <EventCalendarContainer searchParams={searchParams} />
        </ResizeableColumnContainer>
        <ResizeableColumnContainer title="Announcements" defaultHeight={300}>
          <Announcements />
        </ResizeableColumnContainer> */}
      </CollapsiblePanel>
    </div>
  );
};

export default CalendarPage;