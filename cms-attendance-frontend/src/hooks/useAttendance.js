import { useState } from "react";
import { API_BASE } from "../utils/constants";
import { getToken } from "../utils/getToken";

export const useAttendance = () => {

  const token = getToken();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRecords = async (empCode) => {

    setLoading(true);
    setError("");

    const endpoint = empCode
      ? `/attendance/cms/search?empCode=${empCode}`
      : `/attendance/cms/all`;

    try {

      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message);

      setRecords(json.data || []);

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  };

  return {
    records,
    loading,
    error,
    fetchRecords
  };
};