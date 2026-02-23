import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import AttendanceTable from "../components/AttendanceTable";

const AdminDashboard = () => {

  return (
    <DashboardLayout>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Admin Overview
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Employees" value="120" color="border-blue-500" />
        <StatCard title="Present Today" value="95" color="border-green-500" />
        <StatCard title="Absent Today" value="25" color="border-red-500" />
        <StatCard title="Managers" value="8" color="border-purple-500" />
      </div>

      {/* Table */}
      <AttendanceTable />

    </DashboardLayout>
  );
};

export default AdminDashboard;
