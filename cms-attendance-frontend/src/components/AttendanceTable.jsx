const AttendanceTable = () => {
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">

      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="p-4">Employee</th>
            <th className="p-4">Date</th>
            <th className="p-4">Punch In</th>
            <th className="p-4">Punch Out</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-b hover:bg-gray-50 transition">
            <td className="p-4">Harsh</td>
            <td className="p-4">2026-02-18</td>
            <td className="p-4">09:10 AM</td>
            <td className="p-4">06:20 PM</td>
            <td className="p-4 text-green-600 font-medium">Present</td>
          </tr>
        </tbody>
      </table>

    </div>
  );
};

export default AttendanceTable;
