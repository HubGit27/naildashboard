
import Announcements from "@/components/Announcements";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import ResizeableColumnContainer from "@/components/ResizeableColumnContainer";
import SchedulingContainer from "@/components/schedulingCalander.tsx/SchedulingContainer";
import Scheduler from "@/components/schedulingCalander.tsx/Scheduler";
import CollapsiblePanel from "@/components/CollapsiblePanel";
import prisma from "@/lib/prisma";

const CalanderPage = async({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  console.log("Brandon CalanderPage searchParams ", searchParams);
  //const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  let relatedData = {};
  let storeId = "123" //Need to be fixed

  const employees = await prisma.employee.findMany({
    where: storeId ? {
        stores: {
          some: {
            id: storeId
          }
        }
      } : undefined,
    select: { id: true, firstName: true, lastName: true},
  });

  const classTeachers = await prisma.teacher.findMany({
    select: { id: true, name: true, surname: true },
  });
    const resolvedParams = await searchParams;
  const initialDate = resolvedParams.date || new Date().toISOString();
  relatedData = { teachers: classTeachers, employees: employees, initialDate:initialDate };

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      <div 
        className={`
          transition-all duration-300 ease-in-out 
          w-full
          flex flex-col gap-8
        `}
      >
        <Scheduler 
          relatedData={relatedData}
          searchParams={searchParams}
        />
        {/* <SchedulingContainer searchParams={searchParams} /> */}
      </div>
      
      {/* RIGHT - Collapses to the right side of screen */}
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

export default CalanderPage;
