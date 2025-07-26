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

  const allServices = await prisma.service.findMany();

  if (appointmentId) {
    const fetchedAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        employee: true,
        appointmentServices: {
          include: {
            service: true,
          },
        },
        payment: true,
      },
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
          },
        })),
        payment: fetchedAppointment.payment
          ? {
              ...fetchedAppointment.payment,
              amount: fetchedAppointment.payment.amount.toString(),
              tip: fetchedAppointment.payment.tip.toString(),
              tax: fetchedAppointment.payment.tax.toString(),
              total: fetchedAppointment.payment.total.toString(),
            }
          : null,
      };
    }
  }

  const serializedServices = allServices.map(service => ({
    ...service,
    price: service.price.toString(),
  }));

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Scheduler - takes available space but can shrink */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Scheduler
            initialUsers={initialUsers}
            searchParams={searchParams}
          />
        </div>
        
        {/* AppointmentDetails - fixed width, always visible */}
        <div className="w-[400px] flex-shrink-0">
          {appointment ? (
            <AppointmentDetails 
              appointment={appointment} 
              allServices={serializedServices} 
              allEmployees={initialUsers} 
            />
          ) : (
            <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200 h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700">No appointment selected</p>
                <p className="text-sm text-gray-500">Click on an appointment in the scheduler to see its details.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;