import { useState } from "react";
import SearchBar from "./SearchBar";
import AttendanceTable from "./AttendanceTable";
import { useAttendance } from "../hooks/useAttendance";

export default function AttendanceSearch() {

  const [empCodeInput, setEmpCodeInput] = useState("");

  const {
    records,
    loading,
    error,
    fetchRecords
  } = useAttendance();

  const handleSearch = () => {
    fetchRecords(empCodeInput);
  };

  const handleClear = () => {
    setEmpCodeInput("");
  };

  return (

    <div>

      <SearchBar
        empCodeInput={empCodeInput}
        setEmpCodeInput={setEmpCodeInput}
        handleSearch={handleSearch}
        handleClear={handleClear}
        loading={loading}
      />

      {error && <div>{error}</div>}

      <AttendanceTable rows={records} />

    </div>
  );
}