// import { Routes, Route } from "react-router-dom";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// import Login from "./pages/Login";
// import AdminDashboard from "./pages/AdminDashboard";
// import ManagerDashboard from "./pages/ManagerDashboard";
// import EmployeeDashboard from "./pages/EmployeeDashboard";
// import ProtectedRoute from "./components/ProtectedRoute";

// function App() {
//   return (
//     <>
//       <ToastContainer position="top-right" autoClose={3000} />

//       <Routes>

//         {/* Public Route */}
//         <Route path="/" element={<Login />} />

//         {/* Admin Route */}
//         <Route
//           path="/admin"
//           element={
//             <ProtectedRoute allowedRoles={["ADMIN"]}>
//               <AdminDashboard />
//             </ProtectedRoute>
//           }
//         />

//         {/* Manager Route */}
//         <Route
//           path="/manager"
//           element={
//             <ProtectedRoute allowedRoles={["MANAGER"]}>
//               <ManagerDashboard />
//             </ProtectedRoute>
//           }
//         />

//         {/* Employee Route */}
//         <Route
//           path="/employee"
//           element={
//             <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
//               <EmployeeDashboard />
//             </ProtectedRoute>
//           }
//         />

//       </Routes>
//     </>
//   );
// }

// export default App;



/**
 * CMS Attendance — Complete Frontend
 * Stack: React + hooks only, no external UI lib
 * API: http://localhost:9049
 *
 * Pages:
 *   LoginPage         → POST /auth/login
 *   Dashboard (tabbed)
 *     ├─ OverviewTab  → punch-in/out, my local attendance
 *     ├─ CmsTab       → search CMS records by empCode + table
 *     ├─ TeamTab      → manager: /attendance/senior
 *     └─ AdminTab     → admin: /attendance/all + /attendance/cms/all
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────
const API = "http://localhost:9049";
const STORAGE_KEY = "cms_auth";

// ─── Fonts & global CSS injected once ────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 15px; }
body { background: #0a0c12; color: #e8eaf0; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }

:root {
  --bg0: #0a0c12;
  --bg1: #0f1119;
  --bg2: #161925;
  --bg3: #1e2230;
  --border: rgba(255,255,255,0.08);
  --border-hi: rgba(255,255,255,0.15);
  --text1: #e8eaf0;
  --text2: #8b90a0;
  --text3: #555b6e;
  --accent: #6ee7b7;       /* mint green */
  --accent2: #f59e0b;      /* amber */
  --accent3: #818cf8;      /* indigo */
  --red: #f87171;
  --green: #34d399;
  --yellow: #fbbf24;
  --purple: #a78bfa;
}

@keyframes fadeUp   { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
@keyframes spin     { to { transform:rotate(360deg) } }
@keyframes pulse    { 0%,100% { opacity:1 } 50% { opacity:.4 } }
@keyframes shimmer  { 0% { background-position:-800px 0 } 100% { background-position:800px 0 } }
@keyframes rowIn    { from { opacity:0; transform:translateX(-6px) } to { opacity:1; transform:translateX(0) } }
@keyframes scanline { 0% { transform:translateY(-100%) } 100% { transform:translateY(100vh) } }

.fade-up { animation: fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
.fade-in { animation: fadeIn .3s ease both; }
.a1{animation-delay:.05s} .a2{animation-delay:.1s} .a3{animation-delay:.15s}
.a4{animation-delay:.2s}  .a5{animation-delay:.25s} .a6{animation-delay:.3s}

input, button, select { font-family: inherit; }
input::placeholder { color: var(--text3); }
input:focus { outline: none; }
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--bg1); }
::-webkit-scrollbar-thumb { background: var(--bg3); border-radius: 9px; }
`;

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const saveAuth  = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const loadAuth  = ()     => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; } };
const clearAuth = ()     => localStorage.removeItem(STORAGE_KEY);

// ─── HTTP helper ──────────────────────────────────────────────────────────────
async function api(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

// ─── Tiny icon SVG component ──────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none", sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const ICONS = {
  user:     ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2","M12 11a4 4 0 100-8 4 4 0 000 8"],
  lock:     ["M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z","M7 11V7a5 5 0 0110 0v4"],
  eye:      ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 100 6 3 3 0 000-6z"],
  eyeOff:   ["M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24","M1 1l22 22"],
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z",
  logout:   ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4","M16 17l5-5-5-5","M21 12H9"],
  clock:    ["M12 2a10 10 0 100 20A10 10 0 0012 2","M12 6v6l4 2"],
  check:    "M20 6L9 17l-5-5",
  alert:    ["M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z","M12 9v4","M12 17h.01"],
  calendar: ["M3 4h18v18H3z","M16 2v4","M8 2v4","M3 10h18"],
  map:      ["M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z","M12 7a3 3 0 100 6 3 3 0 000-6z"],
  tag:      ["M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z","M7 7h.01"],
  download: ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M7 10l5 5 5-5","M12 15V3"],
  grid:     ["M3 3h7v7H3z","M14 3h7v7h-7z","M14 14h7v7h-7z","M3 14h7v7H3z"],
  team:     ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M9 7a4 4 0 100 8 4 4 0 000-8","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75"],
  punch:    ["M12 2a10 10 0 100 20A10 10 0 0012 2","M12 8v4l3 3"],
  shield:   ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  id:       ["M2 9a3 3 0 013-3h14a3 3 0 013 3v9a3 3 0 01-3 3H5a3 3 0 01-3-3V9z","M8 13h.01","M12 13h4"],
  sort:     ["M3 6h18","M7 12h10","M11 18h2"],
  refresh:  "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ size = 18, color = "var(--accent)" }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    border: `2px solid rgba(255,255,255,.1)`,
    borderTopColor: color,
    animation: "spin .6s linear infinite",
    flexShrink: 0,
  }} />
);

// ─── Role badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const cfg = {
    ROLE_ADMIN:    { bg: "rgba(167,139,250,.15)", color: "#a78bfa", label: "Admin" },
    ROLE_MANAGER:  { bg: "rgba(251,191,36,.12)",  color: "#fbbf24", label: "Manager" },
    ROLE_EMPLOYEE: { bg: "rgba(110,231,183,.12)", color: "#6ee7b7", label: "Employee" },
  }[role] || { bg: "rgba(139,144,160,.12)", color: "#8b90a0", label: role };
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color, letterSpacing: ".3px",
    }}>{cfg.label}</span>
  );
};

// ─── Attendance type badge ────────────────────────────────────────────────────
const TypeBadge = ({ value }) => {
  if (!value) return <span style={{ color: "var(--text3)" }}>—</span>;
  const t = value.toLowerCase();
  let bg, color;
  if (t.includes("present"))    { bg="rgba(52,211,153,.12)"; color="#34d399"; }
  else if (t.includes("absent"))  { bg="rgba(248,113,113,.12)"; color="#f87171"; }
  else if (t.includes("leave"))   { bg="rgba(248,113,113,.12)"; color="#f87171"; }
  else if (t.includes("duty"))    { bg="rgba(251,191,36,.12)";  color="#fbbf24"; }
  else if (t.includes("half"))    { bg="rgba(167,139,250,.12)"; color="#a78bfa"; }
  else                            { bg="rgba(129,140,248,.12)"; color="#818cf8"; }
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: bg, color, letterSpacing: ".3px", whiteSpace: "nowrap",
    }}>{value}</span>
  );
};

// ─── Time cell ────────────────────────────────────────────────────────────────
const TimeCell = ({ value, dot }) => {
  if (!value || value === "NA") return <span style={{ color: "var(--text3)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>—</span>;
  const parts = value.split(" ");
  const time = parts.length > 1 ? parts[1] : value;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--text2)" }}>{time}</span>
    </div>
  );
};

// ─── Shimmer rows ─────────────────────────────────────────────────────────────
const ShimmerRow = () => (
  <div style={{ display: "flex", gap: 16, padding: "13px 20px", borderBottom: "1px solid var(--border)" }}>
    {[1,2,3,4,5,6,7,8,9].map(i => (
      <div key={i} style={{
        flex: i===3 ? 2 : 1, height: 12, borderRadius: 6,
        background: "linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%)",
        backgroundSize: "800px 100%",
        animation: "shimmer 1.6s infinite",
        animationDelay: `${i*0.04}s`,
      }} />
    ))}
  </div>
);

// ─── CMS Attendance Table ─────────────────────────────────────────────────────
function CmsTable({ rows, loading }) {
  const [sortKey, setSortKey] = useState("forDate");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE = 12;

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  };

  const sorted = [...rows].sort((a, b) => {
    const va = (a[sortKey] ?? "").toLowerCase();
    const vb = (b[sortKey] ?? "").toLowerCase();
    return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE));
  const slice = sorted.slice((page - 1) * PAGE, page * PAGE);

  const cols = [
    { key: "employeeCode",   label: "Emp Code",     w: 110 },
    { key: "name",           label: "Name",         w: 180 },
    { key: "forDate",        label: "Date",         w: 110 },
    { key: "startTime",      label: "In",           w: 100 },
    { key: "endTime",        label: "Out",          w: 100 },
    { key: "location",       label: "In Loc",       w: 90  },
    { key: "outLocation",    label: "Out Loc",      w: 90  },
    { key: "attendanceType", label: "Type",         w: 140 },
  ];

  const thS = {
    padding: "11px 14px",
    fontSize: 11, fontWeight: 700,
    color: "var(--text3)", letterSpacing: ".7px",
    textTransform: "uppercase",
    textAlign: "left", whiteSpace: "nowrap",
    cursor: "pointer", userSelect: "none",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg1)",
  };
  const tdS = {
    padding: "11px 14px",
    fontSize: 13, color: "var(--text2)",
    whiteSpace: "nowrap",
    borderBottom: "1px solid var(--border)",
  };

  if (loading) return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
      {Array.from({ length: 6 }).map((_, i) => <ShimmerRow key={i} />)}
    </div>
  );

  if (!rows.length) return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "56px 32px", gap: 12, textAlign: "center",
      background: "var(--bg1)", borderRadius: 12, border: "1px solid var(--border)",
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon d={ICONS.search} size={22} stroke="var(--text3)" />
      </div>
      <p style={{ color: "var(--text3)", fontSize: 14 }}>No records found</p>
    </div>
  );

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40, textAlign: "center" }}>#</th>
              {cols.map(c => (
                <th key={c.key} style={{ ...thS, minWidth: c.w }} onClick={() => toggleSort(c.key)}>
                  {c.label} {sortKey === c.key ? (sortAsc ? "↑" : "↓") : <span style={{ opacity: .3 }}>⇅</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i}
                style={{ animation: `rowIn .25s ${(i % PAGE) * 0.02}s both`, cursor: "default" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.025)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ ...tdS, textAlign: "center", color: "var(--text3)", fontSize: 11 }}>
                  {(page - 1) * PAGE + i + 1}
                </td>
                <td style={tdS}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--accent2)" }}>
                    {row.employeeCode ?? "—"}
                  </span>
                </td>
                <td style={tdS}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg,var(--accent3),var(--accent))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "#0a0c12",
                    }}>
                      {(row.name ?? "?")[0]}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text1)" }}>{row.name ?? "—"}</span>
                  </div>
                </td>
                <td style={tdS}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{row.forDate ?? "—"}</span>
                </td>
                <td style={tdS}><TimeCell value={row.startTime} dot="#34d399" /></td>
                <td style={tdS}><TimeCell value={row.endTime}   dot="#f87171" /></td>
                <td style={tdS}>
                  <span style={{ color: row.location && row.location !== "NA" ? "var(--accent3)" : "var(--text3)", fontSize: 12 }}>
                    {row.location || "NA"}
                  </span>
                </td>
                <td style={tdS}>
                  <span style={{ color: row.outLocation && row.outLocation !== "NA" ? "var(--accent3)" : "var(--text3)", fontSize: 12 }}>
                    {row.outLocation || "NA"}
                  </span>
                </td>
                <td style={tdS}><TypeBadge value={row.attendanceType} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderTop: "1px solid var(--border)",
          background: "var(--bg1)", flexWrap: "wrap", gap: 8,
        }}>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>
            {(page-1)*PAGE+1}–{Math.min(page*PAGE, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {[...Array(totalPages)].map((_, idx) => {
              const p = idx + 1;
              if (totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) return <span key={p} style={{ color: "var(--text3)", padding: "0 4px", lineHeight: "28px", fontSize: 12 }}>…</span>;
                return null;
              }
              return (
                <button key={p} onClick={() => setPage(p)} style={{
                  minWidth: 28, height: 28, borderRadius: 6, border: "1px solid",
                  borderColor: p === page ? "var(--accent)" : "var(--border)",
                  background: p === page ? "rgba(110,231,183,.12)" : "transparent",
                  color: p === page ? "var(--accent)" : "var(--text2)",
                  fontSize: 12, cursor: "pointer",
                }}>{p}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCSV(rows) {
  const headers = ["Emp Code","Name","Date","Start","End","In Loc","Out Loc","Type"];
  const keys    = ["employeeCode","name","forDate","startTime","endTime","location","outLocation","attendanceType"];
  const body    = rows.map(r => keys.map(k => `"${(r[k]??"")}"`).join(",")).join("\n");
  const blob    = new Blob([headers.join(",") + "\n" + body], { type: "text/csv" });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement("a");
  a.href = url; a.download = "attendance.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE: Login
// ═════════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async () => {
    if (!email || !password) { setError("Enter email and password."); return; }
    setLoading(true); setError("");
    try {
      const res = await api("/auth/login", { method: "POST", body: { email, password } });
      const d   = res.data || res;
      const auth = {
        accessToken:  d.accessToken,
        refreshToken: d.refreshToken,
        empCode:      d.empCode,
        role:         d.role,
        email,
      };
      saveAuth(auth);
      onLogin(auth);
    } catch (e) {
      setError(e.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    width: "100%",
    padding: "13px 16px",
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: "var(--text1)",
    fontSize: 14,
    transition: "border .2s, box-shadow .2s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg0)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(rgba(110,231,183,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(110,231,183,.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      {/* Glow */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 500, height: 300, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(110,231,183,.06) 0%, transparent 70%)",
        zIndex: 0,
      }} />

      <div className="fade-up" style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 420,
        margin: "0 24px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 52, height: 52, borderRadius: 14, marginBottom: 16,
            background: "linear-gradient(135deg, rgba(110,231,183,.2), rgba(129,140,248,.2))",
            border: "1px solid rgba(110,231,183,.2)",
          }}>
            <Icon d={ICONS.shield} size={26} stroke="var(--accent)" sw={1.5} />
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 26, fontWeight: 800,
            color: "var(--text1)", letterSpacing: "-.5px",
            marginBottom: 6,
          }}>CMS Attendance</h1>
          <p style={{ fontSize: 13, color: "var(--text3)" }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--bg1)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "32px 28px",
          boxShadow: "0 32px 64px rgba(0,0,0,.5)",
        }}>
          {/* Error */}
          {error && (
            <div className="fade-in" style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: 8, marginBottom: 20,
              background: "rgba(248,113,113,.08)",
              border: "1px solid rgba(248,113,113,.2)",
              fontSize: 13, color: "var(--red)",
            }}>
              <Icon d={ICONS.alert} size={15} stroke="var(--red)" />
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text3)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }}>
                <Icon d={ICONS.user} size={15} />
              </div>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="employee@company.com"
                style={{ ...fieldStyle, paddingLeft: 42 }}
                onFocus={e => { e.target.style.borderColor = "rgba(110,231,183,.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(110,231,183,.08)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text3)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }}>
                <Icon d={ICONS.lock} size={15} />
              </div>
              <input
                type={showPw ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                style={{ ...fieldStyle, paddingLeft: 42, paddingRight: 44 }}
                onFocus={e => { e.target.style.borderColor = "rgba(110,231,183,.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(110,231,183,.08)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              />
              <button onClick={() => setShowPw(v => !v)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--text3)",
                display: "flex", padding: 4,
              }}>
                <Icon d={showPw ? ICONS.eyeOff : ICONS.eye} size={15} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", padding: "13px",
            background: "linear-gradient(135deg, #6ee7b7, #34d399)",
            border: "none", borderRadius: 10,
            color: "#0a0c12", fontWeight: 700, fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? .75 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "opacity .2s, transform .15s",
            fontFamily: "'Syne', sans-serif",
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
          >
            {loading ? <><Spinner size={16} color="#0a0c12" />Signing in…</> : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: Overview — punch in/out + my local attendance records
// ═════════════════════════════════════════════════════════════════════════════
function OverviewTab({ auth }) {
  const [myRecords, setMyRecords] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [punchLoading, setPunchLoading] = useState(null); // "in" | "out" | null
  const [msg,       setMsg]       = useState(null); // { type: "ok"|"err", text }

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const loadMyRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/attendance/my", { token: auth.accessToken });
      setMyRecords(Array.isArray(res) ? res : (res.data ?? []));
    } catch (e) {
      flash("err", e.message);
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => { loadMyRecords(); }, [loadMyRecords]);

  const punch = async (type) => {
    setPunchLoading(type);
    try {
      await api(`/attendance/punch-${type}`, { method: "POST", token: auth.accessToken });
      flash("ok", type === "in" ? "Punched in successfully!" : "Punched out successfully!");
      loadMyRecords();
    } catch (e) {
      flash("err", e.message);
    } finally {
      setPunchLoading(null);
    }
  };

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Date + punch controls */}
      <div className="fade-up" style={{
        background: "var(--bg1)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "28px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 20,
      }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>Today</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text1)" }}>{today}</div>
          <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>
            Logged in as <span style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace" }}>{auth.empCode}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => punch("in")} disabled={punchLoading !== null} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 22px", borderRadius: 10,
            background: "rgba(52,211,153,.12)", border: "1px solid rgba(52,211,153,.25)",
            color: "#34d399", fontWeight: 700, fontSize: 13, cursor: "pointer",
            transition: "all .2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(52,211,153,.12)"}
          >
            {punchLoading === "in" ? <Spinner size={14} color="#34d399" /> : <Icon d={ICONS.punch} size={15} stroke="#34d399" />}
            Punch In
          </button>
          <button onClick={() => punch("out")} disabled={punchLoading !== null} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 22px", borderRadius: 10,
            background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.2)",
            color: "#f87171", fontWeight: 700, fontSize: 13, cursor: "pointer",
            transition: "all .2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(248,113,113,.1)"}
          >
            {punchLoading === "out" ? <Spinner size={14} color="#f87171" /> : <Icon d={ICONS.punch} size={15} stroke="#f87171" />}
            Punch Out
          </button>
        </div>
      </div>

      {/* Flash message */}
      {msg && (
        <div className="fade-in" style={{
          padding: "12px 16px", borderRadius: 10,
          background: msg.type === "ok" ? "rgba(52,211,153,.1)"  : "rgba(248,113,113,.1)",
          border:     `1px solid ${msg.type === "ok" ? "rgba(52,211,153,.25)" : "rgba(248,113,113,.25)"}`,
          color:      msg.type === "ok" ? "#34d399" : "#f87171",
          fontSize: 13, display: "flex", alignItems: "center", gap: 8,
        }}>
          <Icon d={msg.type === "ok" ? ICONS.check : ICONS.alert} size={15} stroke={msg.type === "ok" ? "#34d399" : "#f87171"} />
          {msg.text}
        </div>
      )}

      {/* My local records */}
      <div className="fade-up a2">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text1)" }}>
            My Attendance Records
          </h2>
          <button onClick={loadMyRecords} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8,
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--text2)", fontSize: 12, cursor: "pointer",
          }}>
            <Icon d={ICONS.refresh} size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 20, padding: "13px 20px", borderBottom: "1px solid var(--border)" }}>
                {[1,2,3,4,5].map(j => (
                  <div key={j} style={{
                    flex: 1, height: 12, borderRadius: 6,
                    background: "linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%)",
                    backgroundSize: "800px 100%", animation: "shimmer 1.6s infinite",
                  }} />
                ))}
              </div>
            ))}
          </div>
        ) : myRecords.length === 0 ? (
          <div style={{
            padding: "40px 24px", textAlign: "center",
            background: "var(--bg1)", borderRadius: 12, border: "1px solid var(--border)",
            color: "var(--text3)", fontSize: 14,
          }}>
            No local attendance records yet. Punch in to get started.
          </div>
        ) : (
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg1)" }}>
                  {["Date","Punch In","Punch Out","Hours","Status"].map(h => (
                    <th key={h} style={{
                      padding: "11px 16px", textAlign: "left", fontSize: 11,
                      fontWeight: 700, color: "var(--text3)", letterSpacing: ".7px",
                      textTransform: "uppercase", borderBottom: "1px solid var(--border)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myRecords.map((r, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {[
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.attendanceDate ?? "—"}</span>,
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#34d399" }}>{r.punchIn ? r.punchIn.split("T")[1]?.slice(0,5) : "—"}</span>,
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#f87171" }}>{r.punchOut ? r.punchOut.split("T")[1]?.slice(0,5) : "—"}</span>,
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--accent2)" }}>{r.totalHours != null ? `${r.totalHours.toFixed(1)}h` : "—"}</span>,
                      <TypeBadge value={r.status} />,
                    ].map((cell, j) => (
                      <td key={j} style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text2)", verticalAlign: "middle" }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: CMS Attendance Search
// ═════════════════════════════════════════════════════════════════════════════
function CmsTab({ auth }) {
  const [query,   setQuery]   = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [searched, setSearched] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");

  const types = [...new Set(records.map(r => r.attendanceType).filter(Boolean))].sort();

  const search = async () => {
    setLoading(true); setError(""); setSearched(true);
    try {
      const endpoint = query.trim()
        ? `/attendance/cms/search?empCode=${encodeURIComponent(query.trim())}`
        : `/attendance/cms/all`;
      const res = await api(endpoint, { token: auth.accessToken });
      setRecords(res.data ?? []);
    } catch (e) {
      setError(e.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = typeFilter
    ? records.filter(r => r.attendanceType === typeFilter)
    : records;

  const stats = {
    total:   filtered.length,
    present: filtered.filter(r => r.attendanceType?.toLowerCase().includes("present")).length,
    absent:  filtered.filter(r => r.attendanceType?.toLowerCase().includes("absent") || r.attendanceType?.toLowerCase().includes("leave")).length,
    other:   filtered.filter(r => !r.attendanceType?.toLowerCase().includes("present") && !r.attendanceType?.toLowerCase().includes("absent") && !r.attendanceType?.toLowerCase().includes("leave")).length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Search bar */}
      <div className="fade-up" style={{
        background: "var(--bg1)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "24px",
      }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: ".6px", textTransform: "uppercase", marginBottom: 8 }}>
              Employee Code
            </label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }}>
                <Icon d={ICONS.id} size={15} />
              </div>
              <input
                type="text" value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                placeholder="e.g. 9086899  —  blank to load all"
                style={{
                  width: "100%", padding: "11px 14px 11px 38px",
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 9, color: "var(--text1)", fontSize: 13,
                  fontFamily: "'DM Mono', monospace",
                  transition: "border .2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(110,231,183,.4)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          </div>

          {types.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: ".6px", textTransform: "uppercase", marginBottom: 8 }}>
                Filter Type
              </label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{
                padding: "11px 14px", background: "var(--bg2)",
                border: "1px solid var(--border)", borderRadius: 9,
                color: "var(--text1)", fontSize: 13, cursor: "pointer",
              }}>
                <option value="">All types</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          <button onClick={search} disabled={loading} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 22px", borderRadius: 9,
            background: "linear-gradient(135deg,#6ee7b7,#34d399)",
            border: "none", color: "#0a0c12",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            opacity: loading ? .75 : 1,
            fontFamily: "'Syne', sans-serif",
          }}>
            {loading ? <Spinner size={14} color="#0a0c12" /> : <Icon d={ICONS.search} size={15} stroke="#0a0c12" />}
            Search
          </button>

          {filtered.length > 0 && (
            <button onClick={() => exportCSV(filtered)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "11px 18px", borderRadius: 9,
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--text2)", fontSize: 13, cursor: "pointer",
            }}>
              <Icon d={ICONS.download} size={14} /> Export
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="fade-in" style={{
          padding: "12px 16px", borderRadius: 10,
          background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)",
          color: "var(--red)", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
        }}>
          <Icon d={ICONS.alert} size={15} stroke="var(--red)" /> {error}
        </div>
      )}

      {/* Stats */}
      {searched && !loading && !error && filtered.length > 0 && (
        <div className="fade-in" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Total",   value: stats.total,   color: "var(--accent3)" },
            { label: "Present", value: stats.present, color: "var(--green)"   },
            { label: "Absent",  value: stats.absent,  color: "var(--red)"     },
            { label: "Other",   value: stats.other,   color: "var(--accent2)" },
          ].map((s, i) => (
            <div key={i} style={{
              flex: "1 1 90px", background: "var(--bg1)",
              border: "1px solid var(--border)", borderRadius: 12,
              padding: "14px 18px",
            }}>
              <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {searched && <CmsTable rows={filtered} loading={loading} />}

      {/* Initial prompt */}
      {!searched && (
        <div style={{
          padding: "56px 24px", textAlign: "center",
          background: "var(--bg1)", borderRadius: 12,
          border: "1px dashed var(--border)",
        }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Icon d={ICONS.search} size={22} stroke="var(--text3)" />
          </div>
          <p style={{ color: "var(--text3)", fontSize: 14 }}>
            Enter an employee code and press <kbd style={{ padding: "2px 7px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 5, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>Enter</kbd> to search.<br />
            Leave blank to load all records.
          </p>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: Team (Manager only) — /attendance/senior
// ═════════════════════════════════════════════════════════════════════════════
function TeamTab({ auth }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api("/attendance/senior", { token: auth.accessToken })
      .then(res => setRecords(Array.isArray(res) ? res : (res.data ?? [])))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [auth.accessToken]);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text1)" }}>
          Team Attendance
        </h2>
        {records.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--text3)" }}>{records.length} records</span>
        )}
      </div>
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", color: "var(--red)", fontSize: 13 }}>
          {error}
        </div>
      )}
      {!error && (
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <ShimmerRow key={i} />)
          ) : records.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", background: "var(--bg1)", color: "var(--text3)", fontSize: 14 }}>
              No team records found.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg1)" }}>
                  {["Date","Punch In","Punch Out","Hours","Status","Location"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: ".7px", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {[
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.attendanceDate ?? "—"}</span>,
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#34d399" }}>{r.punchIn ? r.punchIn.split("T")[1]?.slice(0,5) : "—"}</span>,
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#f87171" }}>{r.punchOut ? r.punchOut.split("T")[1]?.slice(0,5) : "—"}</span>,
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--accent2)" }}>{r.totalHours != null ? `${r.totalHours.toFixed(1)}h` : "—"}</span>,
                      <TypeBadge value={r.status} />,
                      <span style={{ fontSize: 12, color: "var(--text3)" }}>{r.location || "—"}</span>,
                    ].map((cell, j) => (
                      <td key={j} style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", verticalAlign: "middle" }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: Admin — /attendance/all + /attendance/cms/all
// ═════════════════════════════════════════════════════════════════════════════
function AdminTab({ auth }) {
  const [view,       setView]      = useState("local");  // "local" | "cms"
  const [localRecs,  setLocalRecs] = useState([]);
  const [cmsRecs,    setCmsRecs]   = useState([]);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
const [syncMsg, setSyncMsg] = useState("");

  const loadLocal = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api("/attendance/all", { token: auth.accessToken });
      setLocalRecs(Array.isArray(res) ? res : (res.data ?? []));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [auth.accessToken]);

  const loadCms = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api("/attendance/cms/all", { token: auth.accessToken });
      setCmsRecs(res.data ?? []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [auth.accessToken]);

  const syncCms = async () => {
  setSyncLoading(true);
  setSyncMsg("");

  try {
    const res = await api("/attendance/cms/sync", {
      method: "POST",
      token: auth.accessToken
    });

    setSyncMsg(res.message || "CMS Sync completed");

    loadCms(); // refresh data

  } catch (e) {
    setSyncMsg("Sync failed: " + e.message);
  } finally {
    setSyncLoading(false);
  }
};

  useEffect(() => { view === "local" ? loadLocal() : loadCms(); }, [view]);

  const tabs = [
    { id: "local", label: "Local DB Records" },
    { id: "cms",   label: "CMS All Records"  },
  ];

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sub-tabs */}
      <div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12
}}>

  <h2 style={{
    fontFamily: "'Syne', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: "var(--text1)"
  }}>
    CMS Data Sync
  </h2>

  <button
    onClick={syncCms}
    disabled={syncLoading}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 18px",
      borderRadius: 10,
      background: "linear-gradient(135deg,#6ee7b7,#34d399)",
      border: "none",
      color: "#0a0c12",
      fontWeight: 700,
      cursor: "pointer"
    }}
  >
    {syncLoading
      ? <Spinner size={14} color="#0a0c12"/>
      : <Icon d={ICONS.refresh} size={14} stroke="#0a0c12"/>}

    Sync CMS
  </button>
  {syncMsg && (
  <div style={{
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
    background: "rgba(110,231,183,.1)",
    border: "1px solid rgba(110,231,183,.2)",
    color: "var(--accent)"
  }}>
    {syncMsg}
  </div>
)}
</div>
      <div style={{ display: "flex", gap: 4, background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600,
            border: "none", cursor: "pointer", transition: "all .2s",
            background: view === t.id ? "var(--bg3)" : "transparent",
            color: view === t.id ? "var(--text1)" : "var(--text3)",
          }}>{t.label}</button>
        ))}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", color: "var(--red)", fontSize: 13 }}>
          {error}
        </div>
      )}

      {view === "cms" ? (
        <CmsTable rows={cmsRecs} loading={loading} />
      ) : (
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <ShimmerRow key={i} />)
          ) : localRecs.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", background: "var(--bg1)", color: "var(--text3)", fontSize: 14 }}>
              No records found.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg1)" }}>
                  {["Date","In","Out","Hours","Status"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: ".7px", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localRecs.map((r, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {[
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.attendanceDate ?? "—"}</span>,
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#34d399" }}>{r.punchIn ? r.punchIn.split("T")[1]?.slice(0,5) : "—"}</span>,
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#f87171" }}>{r.punchOut ? r.punchOut.split("T")[1]?.slice(0,5) : "—"}</span>,
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--accent2)" }}>{r.totalHours != null ? `${r.totalHours.toFixed(1)}h` : "—"}</span>,
                      <TypeBadge value={r.status} />,
                    ].map((cell, j) => (
                      <td key={j} style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", verticalAlign: "middle" }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
function Dashboard({ auth, onLogout }) {
  const isEmployee = auth.role === "ROLE_EMPLOYEE";
  const isManager  = auth.role === "ROLE_MANAGER";
  const isAdmin    = auth.role === "ROLE_ADMIN";

  const allTabs = [
    { id: "overview", label: "Overview",   icon: ICONS.grid,   show: true },
    { id: "cms",      label: "CMS Search", icon: ICONS.search, show: true },
    { id: "team",     label: "Team",       icon: ICONS.team,   show: isManager || isAdmin },
    { id: "admin",    label: "Admin",      icon: ICONS.shield, show: isAdmin },
  ].filter(t => t.show);

  const [activeTab, setActiveTab] = useState("overview");
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api("/auth/logout", { method: "POST", token: auth.accessToken, body: { refreshToken: auth.refreshToken } });
    } catch (_) {}
    clearAuth();
    onLogout();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg0)", display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg1)",
        padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 58, flexShrink: 0,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        {/* Logo + tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg,rgba(110,231,183,.3),rgba(129,140,248,.3))",
              border: "1px solid rgba(110,231,183,.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon d={ICONS.shield} size={16} stroke="var(--accent)" sw={1.5} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: "var(--text1)", letterSpacing: "-.3px" }}>
              CMS Attendance
            </span>
          </div>
          <nav style={{ display: "flex", gap: 2 }}>
            {allTabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: "none", cursor: "pointer", transition: "all .15s",
                background: activeTab === t.id ? "var(--bg3)" : "transparent",
                color: activeTab === t.id ? "var(--text1)" : "var(--text3)",
              }}>
                <Icon d={t.icon} size={14} stroke={activeTab === t.id ? "var(--accent)" : "currentColor"} />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* User info + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", fontFamily: "'DM Mono', monospace" }}>{auth.empCode}</div>
            <div style={{ marginTop: 1 }}><RoleBadge role={auth.role} /></div>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 14px", borderRadius: 9,
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--text3)", fontSize: 13, cursor: "pointer",
            transition: "all .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(248,113,113,.3)"; e.currentTarget.style.color = "var(--red)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; }}
          >
            {loggingOut ? <Spinner size={13} color="var(--red)" /> : <Icon d={ICONS.logout} size={14} />}
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: "32px 28px", maxWidth: 1300, width: "100%", margin: "0 auto" }}>
        {activeTab === "overview" && <OverviewTab auth={auth} />}
        {activeTab === "cms"      && <CmsTab      auth={auth} />}
        {activeTab === "team"     && <TeamTab     auth={auth} />}
        {activeTab === "admin"    && <AdminTab    auth={auth} />}
      </main>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [auth, setAuth] = useState(() => loadAuth());

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {auth
        ? <Dashboard auth={auth} onLogout={() => setAuth(null)} />
        : <LoginPage  onLogin={a => setAuth(a)} />
      }
    </>
  );
}
