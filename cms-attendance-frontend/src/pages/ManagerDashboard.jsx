import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import AttendanceTable from "../components/AttendanceTable";

const ManagerDashboard = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://attendance-app.free.beeceptor.com")
      .then((res) => res.json())
      .then((data) => {
        setAttendance(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching attendance:", err);
        setLoading(false);
      });
  }, []);

  // Dynamic stats calculation
  const totalMembers = attendance.length;
  const presentCount = attendance.filter(
    (emp) => emp.status === "Present"
  ).length;
  const absentCount = attendance.filter(
    (emp) => emp.status === "Absent"
  ).length;

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Team Attendance Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Team Members"
          value={totalMembers}
          color="border-indigo-500"
        />
        <StatCard
          title="Present Today"
          value={presentCount}
          color="border-green-500"
        />
        <StatCard
          title="Absent Today"
          value={absentCount}
          color="border-red-500"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading attendance...</p>
      ) : (
        <AttendanceTable data={attendance} />
      )}
    </DashboardLayout>
  );
};

export default ManagerDashboard;