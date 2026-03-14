import { useAuth } from "../context/AuthContext";
import { useApp }  from "../context/AppContext";
import S from "../utils/styles";
import { scopeComplaints, getDeptName, getSchoolName, isAdminRole } from "../utils/helpers";
import { ROLE_LABELS } from "../data/university";
import ComplaintRow from "../components/complaint/ComplaintRow";
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://voicebox-87mb.onrender.com/api";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { complaints, setPage } = useApp();
  const [users, setUsers] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const r       = currentUser.role;
  const isAdmin = isAdminRole(r);

  // Fetch users if admin
  useEffect(() => {
    if (isAdmin) {
      const token = localStorage.getItem("token");
      axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Failed to fetch users:", err));
    }
  }, [isAdmin]);

  const mine     = scopeComplaints(complaints || [], currentUser);
  const personal = r === "dept_admin" && Array.isArray(complaints)
    ? complaints.filter(c => String(c.targetLecturerId?._id || c.targetLecturerId) === String(currentUser._id))
    : [];
  const allVisible = [...new Map([...mine,...personal].map(c=>[c._id,c])).values()];
  const filtered = typeFilter === "all" ? allVisible : allVisible.filter(c => c.type === typeFilter);

  const open     = allVisible.filter(c => c.status==="open").length;
  const inProg   = allVisible.filter(c => c.status==="in-progress").length;
  const resolved = allVisible.filter(c => c.status==="resolved").length;

  const scopeLabel =
    r==="school_admin" ? `School of ${getSchoolName(currentUser.school)}` :
    `${getDeptName(currentUser.department)} · ${getSchoolName(currentUser.school)}`;

  return (
    <div style={S.page}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:900, color:"white", marginBottom:4 }}>Welcome back, {currentUser.firstName} 👋</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>
          {ROLE_LABELS[r]?.label} · {scopeLabel}
          <span style={{ marginLeft:12, fontFamily:"monospace", fontSize:11, color:"rgba(255,255,255,.28)" }}>{currentUser.uniqueId}</span>
        </div>
      </div>

      {/* Admin scope banner */}
      {isAdmin && (
        <div style={{ background:r==="school_admin"?"rgba(245,158,11,.06)":"rgba(168,85,247,.06)", border:`1px solid ${r==="school_admin"?"rgba(245,158,11,.2)":"rgba(168,85,247,.2)"}`, borderRadius:12, padding:"10px 16px", marginBottom:18, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{fontSize:18}}>{r==="school_admin"?"🏫":"🏬"}</span>
          <div style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>
            <span style={{fontWeight:700,color:"white"}}>
              {r==="school_admin"?`School Admin — ${getSchoolName(currentUser.school)}`:`Dept Admin — ${getDeptName(currentUser.department)}`}
            </span>
            {" "}· You can only view and manage {r==="school_admin"?"your school's":"your department's"} data.
          </div>
        </div>
      )}

      {/* Dept admin personal inbox section */}
      {r === "dept_admin" && personal.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"white", marginBottom:10 }}>📥 Your Personal Inbox</div>
          <div style={S.card}>
            {personal.slice(0,3).map(c => <ComplaintRow key={c._id} c={c} />)}
            {personal.length > 3 && (
              <button onClick={() => setPage("complaints")} style={{ ...S.btn, ...S.btnGhost, width:"100%", marginTop:8, padding:10 }}>
                View all {personal.length} personal complaints →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ ...S.g4, marginBottom:22 }}>
        <div style={S.statCard}><div style={S.statNum}>{allVisible.length}</div><div style={S.statLbl}>{isAdmin?"Scoped Complaints":r==="staff"?"Directed to Me":"My Complaints"}</div></div>
        <div style={S.statCard}><div style={{...S.statNum,color:"#FCD34D"}}>{open}</div><div style={S.statLbl}>Open</div></div>
        <div style={S.statCard}><div style={{...S.statNum,color:"#93C5FD"}}>{inProg}</div><div style={S.statLbl}>In Progress</div></div>
        <div style={S.statCard}><div style={{...S.statNum,color:"#6EE7B7"}}>{resolved}</div><div style={S.statLbl}>Resolved</div></div>
        {isAdmin && <div style={S.statCard}><div style={{...S.statNum,color:"#A78BFA"}}>{users.length}</div><div style={S.statLbl}>{r==="school_admin"?"School Users":"Dept Users"}</div></div>}
      </div>

      {/* Recent activity */}
      <div style={S.card}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"white" }}>Recent Activity</div>
          <button style={{ ...S.btn, ...S.btnGhost, fontSize:11, padding:"5px 11px" }}
            onClick={() => setPage(isAdmin?"admin-complaints":"complaints")}>View All →</button>
        </div>
        {/* Type filter */}
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          {["all","complaint","suggestion"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              ...S.btn, padding:"4px 10px", fontSize:11,
              background: typeFilter===t ? "rgba(245,158,11,.2)" : "rgba(255,255,255,.05)",
              border: typeFilter===t ? "1px solid rgba(245,158,11,.4)" : "1px solid rgba(255,255,255,.1)",
              color: typeFilter===t ? "#FCD34D" : "rgba(255,255,255,.55)",
            }}>
              {t === "all" ? "📋 All" : t === "complaint" ? "🚨 Complaints" : "💡 Suggestions"}
            </button>
          ))}
        </div>
        {filtered.slice(0,5).map(c => <ComplaintRow key={c._id} c={c} />)}
        {filtered.length===0 && <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", padding:24, fontSize:13 }}>No complaints yet.</div>}
      </div>

      <div style={{ ...S.g2, marginTop:14 }}>
        {r !== "school_admin" && <button onClick={() => setPage("new-complaint")} style={{ ...S.btn, ...S.btnTeal, ...S.btnFull, padding:14 }}>📝 Submit Complaint / Suggestion</button>}
        <button onClick={() => setPage("chat")}          style={{ ...S.btn, ...S.btnGhost, ...S.btnFull, padding:14 }}>💬 Open Chat Room</button>
      </div>
    </div>
  );
}
