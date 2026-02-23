import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import AttendanceTable from "../components/AttendanceTable";

const ManagerDashboard = () => {
  return (
    <DashboardLayout>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Team Attendance Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Team Members" value="12" color="border-indigo-500" />
        <StatCard title="Present Today" value="10" color="border-green-500" />
        <StatCard title="Absent Today" value="2" color="border-red-500" />
      </div>

      <AttendanceTable />

    </DashboardLayout>
  );
};

export default ManagerDashboard;
