import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    // Check expiration
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.clear();
      return <Navigate to="/" replace />;
    }

    const roleFromToken = decoded.roles?.[0] || "";
    const normalizedRole = roleFromToken.replace("ROLE_", "");

    if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
      return <Navigate to="/" replace />;
    }

    return children;

  } catch (error) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
