import { createContext, useContext, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (data) => {
    if (!data?.accessToken) return;

    const decoded = jwtDecode(data.accessToken);

    const roleFromToken = decoded.roles?.[0] || "";
    const normalizedRole = roleFromToken.replace("ROLE_", "");

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("role", normalizedRole);

    setUser({
      email: decoded.sub,
      role: normalizedRole,
      empCode: decoded.empCode,
    });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
