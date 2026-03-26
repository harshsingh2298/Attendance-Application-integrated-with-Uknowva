import { COLUMNS } from "../utils/constants";

export default function AttendanceTable({ rows = [] }) {

  return (

    <table>

      <thead>
        <tr>
          {COLUMNS.map(c => (
            <th key={c.key}>{c.label}</th>
          ))}
        </tr>
      </thead>

      <tbody>

        {rows.map((row, i) => (

          <tr key={i}>

            {COLUMNS.map(col => (
              <td key={col.key}>{row[col.key]}</td>
            ))}

          </tr>

        ))}

      </tbody>

    </table>
  );
}