import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import ResizeableColumnContainer from "@/components/ResizeableColumnContainer";
import FinanceChart from "@/components/FinanceChart";
import SchedulingContainer from "@/components/SchedulingContainer";
import UserCard from "@/components/UserCard";


const CalanderPage = ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
   console.log("Brandon CalanderPage searchParams ", searchParams)
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        <SchedulingContainer searchParams={searchParams}/>
        {/* USER CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="admin" />
          <UserCard type="teacher" />
          <UserCard type="student" />
          <UserCard type="parent" />
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChartContainer />
          </div>
          {/* ATTENDANCE CHART */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChartContainer />
          </div>
        </div>
        {/* BOTTOM CHART */}
        <div className="w-full h-[500px]">
          <FinanceChart />
        </div> 
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <ResizeableColumnContainer title="Calendar" defaultHeight={400}>
            <EventCalendarContainer searchParams={searchParams}/>
        </ResizeableColumnContainer>

        <ResizeableColumnContainer title="Announcements" defaultHeight={300}>
            <Announcements />
        </ResizeableColumnContainer> 
      </div>
    </div>
  );
};

export default CalanderPage;
