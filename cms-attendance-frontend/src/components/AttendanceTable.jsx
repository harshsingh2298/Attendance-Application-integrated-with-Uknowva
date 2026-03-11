const AttendanceTable = ({ data = [] }) => {

  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "0h";

    const to24Hour = (time) => {
      const [timePart, modifier] = time.split(" ");
      let [hours, minutes] = timePart.split(":");
      if (modifier === "PM" && hours !== "12") {
        hours = parseInt(hours, 10) + 12;
      }
      if (modifier === "AM" && hours === "12") {
        hours = "00";
      }
      return `${hours}:${minutes}`;
    };

    const start = new Date(`1970-01-01T${to24Hour(checkIn)}:00`);
    const end = new Date(`1970-01-01T${to24Hour(checkOut)}:00`);

    const diffMs = end - start;
    const diffHrs = diffMs / (1000 * 60 * 60);

    return diffHrs.toFixed(2) + " hrs";
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <table className="min-w-full">
        <thead>
          <tr className="border-b">
            <th>Name</th>
            <th>Date</th>
            <th>Punch In</th>
            <th>Punch Out</th>
            <th>Total Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((emp) => (
            <tr key={emp.employeeId} className="border-b">
              <td>{emp.name}</td>
              <td>{emp.date}</td>
              <td>{emp.checkIn || "-"}</td>
              <td>{emp.checkOut || "-"}</td>
              <td>{calculateHours(emp.checkIn, emp.checkOut)}</td>
              <td>{emp.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;