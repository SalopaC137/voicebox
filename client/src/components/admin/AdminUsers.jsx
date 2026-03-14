import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp }  from "../../context/AppContext";
import axios from "axios";
import S from "../../utils/styles";
import { scopeUsers, getDeptName, getSchoolName, roleIcon } from "../../utils/helpers";

const API_BASE = `${import.meta.env.VITE_SERVER_URL}/api`;

export default function AdminUsers() {
  const { currentUser }         = useAuth();
  const { setPage, users, setUsers } = useApp();
  // local state removed – the shared context holds the user list now

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showSuspended, setShowSuspended] = useState(false);


  const suspendUser = async (id, value) => {
    // ask before making a change so admins don't click by accident
    const verb = value ? "suspend" : "restore";
    if (!window.confirm(`Are you sure you want to ${verb} this user?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE}/users/${id}/suspend`, { isSuspended: value }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // update local list so UI reflects the change instantly
      if (value) {
        if (showSuspended) {
          setUsers(prev => prev.map(u => u._id === id ? { ...u, isSuspended: true } : u));
        } else {
          setUsers(prev => prev.filter(u => u._id !== id));
        }
      } else {
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isSuspended: false } : u));
      }
    } catch (err) {
      console.error("Failed to suspend user:", err);
    }
  };

  // if an admin toggles the "show suspended" checkbox we re‑fetch the full list
  // from the server (server will only include suspended records when the query
  // param is set).  Using the shared context state ensures socket updates still
  // propagate.
  useEffect(() => {
    if (!currentUser || !currentUser.role) return;
    if (currentUser.role !== "school_admin" && currentUser.role !== "dept_admin") return;
    const token = localStorage.getItem("token");
    const url = `${API_BASE}/users${showSuspended ? "?includeSuspended=true" : ""}`;
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Failed to fetch users:", err));
  }, [currentUser, showSuspended]);

  const visible  = scopeUsers(users, currentUser);
  const filtered = visible.filter(u => {
    const ms = !search || (u.firstName+u.lastName+u.email+u.uniqueId).toLowerCase().includes(search.toLowerCase());
    const mf = filter==="all" || u.role===filter;
    return ms && mf;
  });

  const scopeTitle = currentUser.role==="school_admin"
    ? `${getSchoolName(currentUser.school)} — Users`
    : `${getDeptName(currentUser.department)} — Users`;

  const roleColor = r => ({
    school_admin:"rgba(245,158,11,.25)", dept_admin:"rgba(168,85,247,.25)",
    staff:"rgba(59,130,246,.25)", student:"rgba(16,185,129,.25)"
  }[r]||"rgba(255,255,255,.1)");

  const roleBorder = r => ({
    school_admin:"rgba(245,158,11,.4)", dept_admin:"rgba(168,85,247,.4)",
    staff:"rgba(59,130,246,.4)", student:"rgba(16,185,129,.4)"
  }[r]||"rgba(255,255,255,.2)");

  const uidColor = r => ({
    school_admin:"#FCD34D", dept_admin:"#D8B4FE", staff:"#93C5FD", student:"#6EE7B7"
  }[r]||"white");

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:19, fontWeight:800, color:"white" }}>👥 {scopeTitle}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginTop:2 }}>
            Showing users in your {currentUser.role==="school_admin"?"school":"department"} only
          </div>
        </div>
        <button onClick={() => setPage("register")} style={{ ...S.btn, ...S.btnTeal }}>+ Add User</button>
      </div>

      {/* Stats */}
      <div style={{ ...S.g4, marginBottom:16 }}>
        {[
          ["all",         "Total",        visible.length],
          ["dept_admin",  "Dept Admins",   visible.filter(u=>u.role==="dept_admin").length],
          ["staff",       "Staff",         visible.filter(u=>u.role==="staff").length],
          ["student",     "Students",      visible.filter(u=>u.role==="student").length],
        ].map(([f, label, count]) => (
          <div key={f} onClick={() => setFilter(f)} style={{ ...S.statCard, cursor:"pointer", border:filter===f?"1px solid rgba(13,148,136,.4)":"1px solid rgba(255,255,255,.07)" }}>
            <div style={S.statNum}>{count}</div>
            <div style={S.statLbl}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{marginBottom:14}}>
        <input style={S.input} value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by name, email, or UID..." />
      </div>

      <div style={{ marginBottom: 16, fontSize: 12 }}>
        <label style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showSuspended}
            onChange={e => setShowSuspended(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          Show suspended users
        </label>
      </div>

      <div style={S.card}>
        {/* Table header */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1.3fr 80px 110px", gap:10, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,.07)", marginBottom:6 }}>
          {["User","Unique ID","Dept / Unit","Status","Actions"].map(h => (
            <div key={h} style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,.25)", textTransform:"uppercase", letterSpacing:".07em" }}>{h}</div>
          ))}
        </div>

        {filtered.map(u => {
          const uid = u._id || u.id; // normalize just in case
          return (
          <div key={uid} style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1.3fr 80px 110px", gap:10, padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,.04)", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, background:roleColor(u.role), border:`1px solid ${roleBorder(u.role)}` }}>
                {roleIcon(u.role)}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"white" }}>{u.firstName} {u.lastName}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>{u.email}</div>
              </div>
            </div>
            <div style={{ fontFamily:"monospace", fontSize:11, color:uidColor(u.role) }}>{u.uniqueId}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.45)" }}>{u.department ? getDeptName(u.department) : u.unitGroup || "—"}</div>
            <div>
              <span style={{ ...S.badge, ...(u.isSuspended ? S.btnDanger : S.badgeRes) }}>
                {u.isSuspended ? "Suspended" : "Active"}
              </span>
            </div>
            <div>
              <button onClick={() => suspendUser(uid, !u.isSuspended)} style={{
                ...S.btn, padding:"4px 9px", fontSize:10,
                ...(u.isSuspended
                  ? { background:"rgba(16,185,129,.14)", border:"1px solid rgba(16,185,129,.3)", color:"#6EE7B7" }
                  : S.btnDanger)
              }}>
                {u.isSuspended ? "Restore" : "Suspend"}
              </button>
            </div>
          </div>
        )})}

        {filtered.length === 0 && (
          <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", padding:28 }}>No users found.</div>
        )}
      </div>
    </div>
  );
}
