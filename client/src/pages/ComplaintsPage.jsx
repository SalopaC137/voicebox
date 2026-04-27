import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp }  from "../context/AppContext";
import S from "../utils/styles";
import ComplaintRow from "../components/complaint/ComplaintRow";
import { normalizeComplaintStatus } from "../utils/helpers";

export default function ComplaintsPage() {
  const { currentUser }         = useAuth();
  const { complaints, setPage, selectedComplaintId, setSelectedComplaintId } = useApp();
  const isStaff = currentUser.role === "staff";
  const isDeptAdmin = currentUser.role === "dept_admin";
  const complaintsList = Array.isArray(complaints) ? complaints : [];

  const personal = isDeptAdmin
    ? complaintsList.filter(c => String(c.targetLecturerId?._id || c.targetLecturerId) === String(currentUser._id))
    : isStaff
    ? complaintsList.filter(c => String(c.targetLecturerId?._id || c.targetLecturerId) === String(currentUser._id) || c.targetLecturerUid===currentUser.uniqueId)
    : complaintsList.filter(c => String(c.submittedBy?._id || c.submittedBy) === String(currentUser._id));

  const deptwide = isDeptAdmin
    ? complaintsList.filter(c => c.targetDept === currentUser.department && c.targetSchool === currentUser.school && String(c.targetLecturerId?._id || c.targetLecturerId) !== String(currentUser._id))
    : [];

  const [tab, setTab] = useState(isDeptAdmin ? "personal" : "all");
  const [type, setType] = useState("all");
  const [filter, setFilter] = useState("all");
  const mine = tab === "personal" ? personal : tab === "dept" ? deptwide : isDeptAdmin ? [...personal, ...deptwide] : personal;
  const byType = type === "all" ? mine : mine.filter(c => c.type === type);
  const filtered = filter === "all" ? byType : byType.filter(c => normalizeComplaintStatus(c.status) === filter);

  useEffect(() => {
    if (selectedComplaintId) {
      const timer = setTimeout(() => setSelectedComplaintId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [selectedComplaintId]);

  return (
    <div style={{ ...S.page, paddingTop: 58 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ fontSize:19, fontWeight:800, color:"white" }}>
          {isDeptAdmin ? (tab === "personal" ? "📥 Personal Inbox" : "📊 Department Complaints") : isStaff ? "📥 Inbox — Directed to Me" : "📋 My Complaints"}
        </div>
        {!isStaff && !isDeptAdmin && <button style={{ ...S.btn, ...S.btnTeal }} onClick={() => setPage("new-complaint")}>+ New</button>}
      </div>

      {isDeptAdmin && (
        <div style={{ display:"flex", gap:6, marginBottom:14 }}>
          {["personal", "dept", "all"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              ...S.btn, padding:"5px 13px", fontSize:12,
              background: tab===t ? "rgba(168,85,247,.2)" : "rgba(255,255,255,.05)",
              border: tab===t ? "1px solid rgba(168,85,247,.4)" : "1px solid rgba(255,255,255,.1)",
              color: tab===t ? "#C4B5FD" : "rgba(255,255,255,.55)",
            }}>
              {t === "personal" ? "📥 Personal" : t === "dept" ? "📊 Department" : "📋 All"}
              {tab===t && ` (${filtered.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Type filter */}
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {["all","complaint","suggestion"].map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            ...S.btn, padding:"5px 13px", fontSize:12,
            background: type===t ? "rgba(245,158,11,.2)" : "rgba(255,255,255,.05)",
            border: type===t ? "1px solid rgba(245,158,11,.4)" : "1px solid rgba(255,255,255,.1)",
            color: type===t ? "#FCD34D" : "rgba(255,255,255,.55)",
          }}>
            {t === "all" ? "📋 All" : t === "complaint" ? "🚨 Complaints" : "💡 Suggestions"}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {["all","open","in-progress","resolved"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...S.btn, padding:"5px 13px", fontSize:12,
            background: filter===f ? "rgba(13,148,136,.2)" : "rgba(255,255,255,.05)",
            border: filter===f ? "1px solid rgba(13,148,136,.4)" : "1px solid rgba(255,255,255,.1)",
            color: filter===f ? "#2DD4BF" : "rgba(255,255,255,.55)",
          }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}{filter===f?` (${filtered.length})`:""}
          </button>
        ))}
      </div>

      <div style={S.card}>
        {filtered.map((c) => (
          <ComplaintRow
            key={c._id}
            c={{
              ...c,
              _highlight: String(c._id) === String(selectedComplaintId),
              _forceExpand: String(c._id) === String(selectedComplaintId),
            }}
          />
        ))}
        {filtered.length === 0 && <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", padding:28 }}>No complaints here.</div>}
      </div>
    </div>
  );
}
