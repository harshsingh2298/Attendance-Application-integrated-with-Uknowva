import { useEffect, useState } from "react";
import API from "../api/axiosInstance";
import { toast } from "react-toastify";

const EmployeeDashboard = () => {
  const [attendance, setAttendance] = useState([]);

  const punchIn = async () => {
    try {
      await API.post("/attendance/punch-in");
      toast.success("Punched In Successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data);
    }
  };

  const punchOut = async () => {
    try {
      await API.post("/attendance/punch-out");
      toast.success("Punched Out Successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data);
    }
  };

  const fetchData = async () => {
    const res = await API.get("/attendance/my");
    setAttendance(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Employee Dashboard</h1>

      <div className="space-x-4 mb-6">
        <button
          onClick={punchIn}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Punch In
        </button>

        <button
          onClick={punchOut}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
        >
          Punch Out
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          My Attendance
        </h2>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th>Date</th>
              <th>Punch In</th>
              <th>Punch Out</th>
              <th>Total Hours</th>
            </tr>
          </thead>

          <tbody>
            {attendance.map((a) => (
              <tr key={a.attendanceId} className="border-b">
                <td>{a.attendanceDate}</td>
                <td>{a.punchIn}</td>
                <td>{a.punchOut}</td>
                <td>{a.totalHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
