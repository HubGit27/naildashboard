
import Announcements from "@/components/Announcements";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import ResizeableColumnContainer from "@/components/ResizeableColumnContainer";
import SchedulingContainer from "@/components/schedulingCalander.tsx/SchedulingContainer";
import CollapsiblePanel from "@/components/CollapsiblePanel";

const CalanderPage = ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  console.log("Brandon CalanderPage searchParams ", searchParams);
  //const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      <div 
        className={`
          transition-all duration-300 ease-in-out 
          w-full
          flex flex-col gap-8
        `}
      >
        <SchedulingContainer searchParams={searchParams} />
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
