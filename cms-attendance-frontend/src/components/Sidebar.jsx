import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const role = localStorage.getItem("role");

  return (
    <div className="w-64 bg-gradient-to-b from-indigo-700 to-purple-700 text-white flex flex-col">

      <div className="p-6 text-2xl font-bold tracking-wide">
        CMS Attendance
      </div>

      <nav className="flex-1 px-4 space-y-2">

        <NavLink
          to="/dashboard"
          className="block px-4 py-2 rounded-lg hover:bg-white/20 transition"
        >
          Dashboard
        </NavLink>

        {role === "ADMIN" && (
          <>
            <NavLink
              to="/employees"
              className="block px-4 py-2 rounded-lg hover:bg-white/20 transition"
            >
              Manage Employees
            </NavLink>

            <NavLink
              to="/reports"
              className="block px-4 py-2 rounded-lg hover:bg-white/20 transition"
            >
              Reports
            </NavLink>
          </>
        )}

        {role === "MANAGER" && (
          <NavLink
            to="/team"
            className="block px-4 py-2 rounded-lg hover:bg-white/20 transition"
          >
            My Team
          </NavLink>
        )}

      </nav>
    </div>
  );
};

export default Sidebar;
