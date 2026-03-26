import { COLUMNS } from "./constants";

export const exportCSV = (rows, filename = "attendance.csv") => {

  const headers = COLUMNS.map(c => c.label).join(",");

  const body = rows.map(r =>
    COLUMNS.map(c => `"${(r[c.key] ?? "").toString().replace(/"/g, '""')}"`)
    .join(",")
  ).join("\n");

  const blob = new Blob([headers + "\n" + body], { type: "text/csv" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
};