import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useApp }  from "../../context/AppContext";
import S from "../../utils/styles";
import { statusBadge, fmtDate, getDeptName, isAdminRole, roleIcon } from "../../utils/helpers";
import { ROLE_LABELS } from "../../data/university";

const API_BASE = `${import.meta.env.VITE_SERVER_URL}/api`;

export default function ComplaintRow({ c }) {
  const { users }                                  = useApp();
  const { updateComplaint, deleteComplaint, addReply } = useApp();
  const { currentUser } = useAuth();
  const r        = currentUser.role;
  const isAdmin  = isAdminRole(r);
  const isTarget = (c.targetLecturerId && (String(c.targetLecturerId._id || c.targetLecturerId) === String(currentUser._id))) || c.targetLecturerUid === currentUser.uniqueId;
  const isSubmitter = String(c.submittedBy?._id || c.submittedBy) === String(currentUser._id);
  const isDeptAdminInDept = r === "dept_admin" && c.targetDept === currentUser.department;
  const canReply = isTarget || isSubmitter || isDeptAdminInDept;
  const canMod   = isAdmin || isTarget || isSubmitter;  // Admin, target, or submitter can modify status
  const canDelete = isAdmin || isTarget || isSubmitter;  // Anyone involved can delete
  const hasRead  = c.readBy && Array.isArray(c.readBy) ? c.readBy.some(id => String(id._id || id) === String(currentUser._id)) : false;
  // Use populated submittedBy data if available, otherwise fallback to users array
  const submitter= (c.submittedBy && typeof c.submittedBy === 'object') 
    ? c.submittedBy 
    : (users && Array.isArray(users) ? users.find(u => String(u._id || u.id) === String(c.submittedBy?._id || c.submittedBy)) : null);

  const [expanded,  setExpanded]  = useState(false);
  const [replyTxt,  setReplyTxt]  = useState("");

  const handleExpand = () => {
    setExpanded(p => !p);
    // Mark as read when expanded
    if (!expanded && !hasRead) {
      const token = localStorage.getItem("token");
      axios.patch(`${API_BASE}/complaints/${c._id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.error("Failed to mark as read:", err));
    }
  };

  const sendReply = () => {
    if (!replyTxt.trim()) return;
    addReply(c._id, {
      senderId:   currentUser._id,
      senderUid:  currentUser.uniqueId,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      message:    replyTxt,
    });
    setReplyTxt("");
  };

  return (
    <div style={{ borderBottom:"1px solid rgba(255,255,255,.05)", paddingBottom:10, marginBottom:10 }}>

      {/* ── Header row ── */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }} onClick={() => handleExpand()}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, flexWrap:"wrap" }}>
            <span style={{ ...S.badge, ...statusBadge(c.status) }}>{c.status}</span>
            {c.isAnonymous && (
            <span style={{ ...S.badge, ...S.badgeAnon }}>
              Anon{isSubmitter?" (you)":""}
            </span>
          )}
            <span style={{ ...S.badge, background:"rgba(255,255,255,.06)", color:"rgba(255,255,255,.4)", fontSize:9 }}>{c.category}</span>
            <span style={{ ...S.badge, background:"rgba(255,255,255,.06)", color:"rgba(255,255,255,.4)", fontSize:9 }}>{c.type}</span>
            {(c.replies||[]).length > 0 && (
              <span style={{ ...S.badge, background:"rgba(13,148,136,.1)", color:"#2DD4BF", fontSize:9, position:"relative" }}>
                💬 {c.replies.length} repl{c.replies.length === 1 ? "y" : "ies"}
                {!expanded && !hasRead && <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:"#10B981", marginLeft:6, verticalAlign:"middle" }}></span>}
              </span>
            )}
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:"white", marginBottom:2 }}>{c.title}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.38)" }}>
            {c.isAnonymous && !isAdmin
              ? (isSubmitter ? "You (anonymous)" : "Anonymous")
              : submitter
                ? `${submitter.firstName} ${submitter.lastName}`
                : c.submitterUid}
            {" → "}<span style={{ color:"#93C5FD", fontFamily:"monospace" }}>{c.targetLecturerUid}</span>
            {" · "}{getDeptName(c.targetDept)}
            {" · "}{fmtDate(c.createdAt)}
          </div>
        </div>
        <div style={{ display:"flex", gap:5, flexShrink:0, alignItems:"center" }}>
          {canMod && c.status !== "resolved" && (
            <button onClick={e => { e.stopPropagation(); updateComplaint(c._id, { status: c.status==="open" ? "in-progress" : (isSubmitter ? "resolved" : c.status) }); }}
              style={{ ...S.btn, padding:"4px 9px", fontSize:11, background:"rgba(16,185,129,.12)", border:"1px solid rgba(16,185,129,.3)", color:"#6EE7B7" }}>
              {c.status === "open" ? "→ Progress" : isSubmitter ? "→ Resolved" : "✓"}
            </button>
          )}
          {canDelete && (
            <button onClick={e => { e.stopPropagation(); deleteComplaint(c._id); }}
              style={{ ...S.btn, ...S.btnDanger, padding:"4px 8px", fontSize:11 }}>✕</button>
          )}
          <span style={{ color:"rgba(255,255,255,.28)", fontSize:12 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid rgba(255,255,255,.05)" }}>

          {/* Description */}
          <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", lineHeight:1.65, background:"rgba(255,255,255,.03)", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
            {c.description}
          </div>

          {/* Admin anon reveal */}
          {isAdmin && c.isAnonymous && submitter && (
            <div style={{ fontSize:11, color:"#C4B5FD", fontFamily:"monospace", background:"rgba(139,92,246,.07)", border:"1px solid rgba(139,92,246,.2)", borderRadius:8, padding:"9px 12px", marginBottom:10 }}>
              <div style={{fontWeight:700, color:"#D8B4FE", marginBottom:3}}>Admin View - Anonymous Submitter</div>
              <div style={{fontSize:10, lineHeight:1.6}}>
                <b style={{color:"white"}}>Name:</b> {submitter.firstName} {submitter.lastName}<br/>
                <b style={{color:"white"}}>Position:</b> {submitter.designation || submitter.role || "Staff"}<br/>
                <b style={{color:"white"}}>ID:</b> {c.submitterUid}
              </div>
            </div>
          )}

          {/* Admin notes */}
          {(c.adminNotes||[]).length > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"rgba(245,158,11,.5)", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>📋 Admin Notes</div>
              {c.adminNotes.map(n => (
                <div key={n.id} style={{ background:"rgba(245,158,11,.05)", border:"1px solid rgba(245,158,11,.18)", borderRadius:8, padding:"8px 11px", marginBottom:6 }}>
                  <div style={{ fontSize:10, color:"#FCD34D", fontWeight:700, marginBottom:2 }}>{n.senderName} · {fmtDate(n.createdAt)}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.7)" }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}

          {/* Replies */}
          {(c.replies||[]).length > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"rgba(59,130,246,.5)", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>💬 Replies</div>
              {c.replies.map(reply => {
                const roleColors = {
                  school_admin: { bg:"rgba(245,158,11,.07)", border:"rgba(245,158,11,.18)", text:"#FCD34D", icon:"🏫" },
                  dept_admin:   { bg:"rgba(168,85,247,.07)", border:"rgba(168,85,247,.18)", text:"#D8B4FE", icon:"🏬" },
                  staff:        { bg:"rgba(59,130,246,.07)", border:"rgba(59,130,246,.18)", text:"#93C5FD", icon:"🛠" },
                  student:      { bg:"rgba(16,185,129,.07)", border:"rgba(16,185,129,.18)", text:"#6EE7B7", icon:"🎓" },
                };
                const style = roleColors[reply.senderRole] || roleColors.staff;
                return (
                  <div key={reply._id || Math.random()} style={{ display:"flex", gap:8, marginBottom:8 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, background:style.bg.replace("0.07", "0.2"), border:`1px solid ${style.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>
                      {style.icon}
                    </div>
                    <div style={{ flex:1, background:style.bg, border:`1px solid ${style.border}`, borderRadius:10, borderBottomLeftRadius:2, padding:"8px 11px" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:style.text, marginBottom:2 }}>
                        {reply.senderName} ({ROLE_LABELS[reply.senderRole]?.label || reply.senderRole}) <span style={{ fontFamily:"monospace", color:"rgba(255,255,255,.3)", fontWeight:400 }}>{reply.senderUid}</span>
                      </div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,.75)" }}>{reply.message}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,.28)", marginTop:3 }}>{fmtDate(reply.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply box (staff / dept_admin who is the target, OR student who submitted) */}
          {canReply && c.status !== "resolved" && (
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:"rgba(59,130,246,.5)", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>
                {isTarget ? "Reply to Sender" : "Reply to Staff"}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input value={replyTxt} onChange={e => setReplyTxt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendReply()}
                  placeholder="Write your reply..." style={{ ...S.input, flex:1, padding:"8px 12px" }} />
                <button onClick={sendReply} style={{ ...S.btn, ...S.btnBlue, padding:"8px 14px", flexShrink:0 }}>Send ➤</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
