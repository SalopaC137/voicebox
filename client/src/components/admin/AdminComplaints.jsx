import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp }  from "../../context/AppContext";
import axios from "axios";
import S from "../../utils/styles";
import { scopeComplaints, getDeptName, getSchoolName, fmtDate, normalizeComplaintStatus } from "../../utils/helpers";
import { SCHOOLS } from "../../data/university";
import ComplaintRow from "../complaint/ComplaintRow";

const API_BASE = `${import.meta.env.VITE_SERVER_URL}/api`;

export default function AdminComplaints() {
  const { currentUser }           = useAuth();
  const { complaints, addAdminNote, users, selectedComplaintId, setSelectedComplaintId }     = useApp();
  // users are stored in context so that real‑time events update this list too

  const visible     = scopeComplaints(complaints, currentUser);
  const deptOptions = currentUser.role==="school_admin"
    ? (SCHOOLS.find(s => s.code===currentUser.school)?.departments || [])
    : [];

  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter,   setDeptFilter]   = useState("all");
  const [search,       setSearch]       = useState("");
  const [showReport,   setShowReport]   = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportData, setReportData] = useState(null);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [noteMap,      setNoteMap]      = useState({});
  const [noteOpen,     setNoteOpen]     = useState({});

  useEffect(() => {
    if (!showReport) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setReportLoading(true);
    setReportError("");

    axios.get(`${API_BASE}/complaints/reports/cumulative`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setReportData(res.data || null))
      .catch((err) => {
        setReportError(err.response?.data?.message || "Failed to load cumulative report.");
      })
      .finally(() => setReportLoading(false));
  }, [showReport]);

  const filtered = visible.filter(c => {
    const ms = !search || (c.title+c.category+(c.targetLecturerUid||"")+(c.targetDept||"")).toLowerCase().includes(search.toLowerCase());
    const ms2 = statusFilter==="all" || normalizeComplaintStatus(c.status)===statusFilter;
    const md  = deptFilter==="all"   || c.targetDept===deptFilter;
    return ms && ms2 && md;
  });

  // Report stats (prefer backend cumulative report when available)
  const total    = reportData?.totals?.total ?? visible.length;
  const resolved = reportData?.totals?.resolved ?? visible.filter(c=>normalizeComplaintStatus(c.status)==="resolved").length;
  const open     = reportData?.totals?.open ?? visible.filter(c=>normalizeComplaintStatus(c.status)==="open").length;
  const inProg   = reportData?.totals?.inProgress ?? visible.filter(c=>normalizeComplaintStatus(c.status)==="in-progress").length;
  const resolRate= reportData?.totals?.resolutionRate ?? (total ? Math.round((resolved/total)*100) : 0);
  const byCatRaw = reportData?.breakdowns?.byCategory || null;
  const byPriRaw = reportData?.breakdowns?.byPriority || null;
  const byCat    = byCatRaw
    ? byCatRaw.reduce((a, row) => { a[row.key] = row.count; return a; }, {})
    : visible.reduce((a,c)=>{a[c.category]=(a[c.category]||0)+1;return a;},{});
  const byPri    = byPriRaw
    ? byPriRaw.reduce((a, row) => { a[row.key] = row.count; return a; }, {})
    : visible.reduce((a,c)=>{a[c.priority]=(a[c.priority]||0)+1;return a;},{});
  const byDept   = deptOptions.map(d => ({ ...d, count:visible.filter(c=>c.targetDept===d.code).length }));

  const downloadReportPdf = async () => {
    if (!reportData && !visible.length) return;

    try {
      setPdfExporting(true);
      const [{ default: JsPdf }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new JsPdf();
      const generatedAt = new Date();
      const reportScope = currentUser.role === "school_admin"
        ? `${getSchoolName(currentUser.school)} (School)`
        : `${getDeptName(currentUser.department)} (Department)`;

      doc.setFontSize(16);
      doc.text("VoiceBox Cumulative Complaints Report", 14, 16);
      doc.setFontSize(10);
      doc.text(`Scope: ${reportScope}`, 14, 24);
      doc.text(`Generated: ${generatedAt.toLocaleString()}`, 14, 30);

      autoTable(doc, {
        startY: 36,
        head: [["Metric", "Value"]],
        body: [
          ["Total", String(total)],
          ["Open", String(open)],
          ["In Progress", String(inProg)],
          ["Resolved", String(resolved)],
          ["Resolution Rate", `${resolRate}%`],
        ],
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [13, 148, 136] },
      });

      const byCategoryRows = Object.entries(byCat).map(([key, count]) => [key, String(count)]);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["By Category", "Count"]],
        body: byCategoryRows.length ? byCategoryRows : [["No data", "0"]],
        theme: "striped",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 92, 246] },
      });

      const byPriorityRows = Object.entries(byPri).map(([key, count]) => [key, String(count)]);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["By Priority", "Count"]],
        body: byPriorityRows.length ? byPriorityRows : [["No data", "0"]],
        theme: "striped",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 158, 11] },
      });

      if (currentUser.role === "school_admin") {
        const byDeptRows = byDept.filter(d => d.count > 0).map((d) => [d.name, String(d.count)]);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 8,
          head: [["By Department", "Count"]],
          body: byDeptRows.length ? byDeptRows : [["No data", "0"]],
          theme: "striped",
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 130, 246] },
        });
      }

      const safeScope = reportScope.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const fileName = `voicebox-report-${safeScope}-${generatedAt.toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfExporting(false);
    }
  };

  const sendNote = (cid) => {
    const text = noteMap[cid]; if (!text?.trim()) return;
    addAdminNote(cid, {
      senderId:   currentUser._id,
      senderUid:  currentUser.uniqueId,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      message:    text,
    });
    setNoteMap(p=>({...p,[cid]:""}));
    setNoteOpen(p=>({...p,[cid]:false}));
  };

  useEffect(() => {
    if (selectedComplaintId) {
      const timer = setTimeout(() => setSelectedComplaintId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [selectedComplaintId, setSelectedComplaintId]);

  const scopeTitle = currentUser.role==="school_admin"
    ? `${getSchoolName(currentUser.school)} — Complaints`
    : `${getDeptName(currentUser.department)} — Complaints`;

  return (
    <div style={{ ...S.page, paddingTop: 58 }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:19, fontWeight:800, color:"white" }}>📋 {scopeTitle}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginTop:2 }}>
          Restricted to your {currentUser.role==="school_admin"?"school":"department"}
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:16 }}>
        <button onClick={() => setShowReport(p=>!p)} style={{ ...S.btn, ...(showReport?S.btnAmber:S.btnGhost), fontSize:12 }}>
          📊 {showReport?"Hide":"Generate"} Report
        </button>
      </div>

      {/* ── Report Panel ── */}
      {showReport && (
        <div style={{ ...S.card, marginBottom:18, background:"rgba(245,158,11,.03)", border:"1px solid rgba(245,158,11,.18)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#FCD34D" }}>📊 {scopeTitle} Report</div>
            <button
              onClick={downloadReportPdf}
              disabled={reportLoading || !!reportError || pdfExporting}
              style={{
                ...S.btn,
                ...S.btnBlue,
                padding:"6px 10px",
                fontSize:11,
                opacity: reportLoading || !!reportError || pdfExporting ? 0.55 : 1,
                cursor: reportLoading || !!reportError || pdfExporting ? "not-allowed" : "pointer",
              }}
            >
              {pdfExporting ? "Preparing PDF..." : "⬇ Download PDF"}
            </button>
          </div>

          {reportLoading && (
            <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", marginBottom:10 }}>Loading cumulative report...</div>
          )}

          {reportError && (
            <div style={{ fontSize:12, color:"#fca5a5", marginBottom:10 }}>{reportError}</div>
          )}

          {/* 5 stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:14 }}>
            {[["Total",total,"white"],["Open",open,"#FCD34D"],["In Progress",inProg,"#93C5FD"],["Resolved",resolved,"#6EE7B7"],["Resolution %",`${resolRate}%`,"#2DD4BF"]].map(([l,v,c]) => (
              <div key={l} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:10, padding:12, textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:900, color:c }}>{v}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.38)", marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.4)", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Resolved vs Unresolved</div>
            <div style={{ height:10, borderRadius:100, background:"rgba(255,255,255,.07)", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${resolRate}%`, background:"linear-gradient(90deg,#0D9488,#10B981)", borderRadius:100 }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:10, color:"rgba(255,255,255,.4)" }}>
              <span style={{color:"#6EE7B7"}}>{resolved} resolved ({resolRate}%)</span>
              <span style={{color:"#fca5a5"}}>{open+inProg} unresolved ({100-resolRate}%)</span>
            </div>
          </div>

          <div style={S.g2}>
            <div>
              {/* By Dept (school admin) */}
              {currentUser.role==="school_admin" && byDept.some(d=>d.count>0) && (
                <>
                  <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.4)", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>By Department</div>
                  {byDept.filter(d=>d.count>0).map(d => (
                    <div key={d.code} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={{ flex:1, fontSize:12, color:"rgba(255,255,255,.65)" }}>{d.name}</span>
                      <div style={{ height:6, width:`${Math.min(d.count*18,90)}px`, borderRadius:3, background:"rgba(13,148,136,.5)", minWidth:6 }} />
                      <span style={{ fontSize:11, fontWeight:700, color:"#2DD4BF", minWidth:18, textAlign:"right" }}>{d.count}</span>
                    </div>
                  ))}
                </>
              )}
              {/* By Category */}
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.4)", margin:"10px 0 8px", textTransform:"uppercase", letterSpacing:".06em" }}>By Category</div>
              {Object.entries(byCat).map(([cat,cnt]) => (
                <div key={cat} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ flex:1, fontSize:12, color:"rgba(255,255,255,.65)" }}>{cat}</span>
                  <div style={{ height:6, width:`${Math.min(cnt*18,90)}px`, borderRadius:3, background:"rgba(139,92,246,.5)", minWidth:6 }} />
                  <span style={{ fontSize:11, fontWeight:700, color:"#C4B5FD", minWidth:18, textAlign:"right" }}>{cnt}</span>
                </div>
              ))}
            </div>
            {/* By Priority */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.4)", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>By Priority</div>
              {Object.entries(byPri).map(([p,cnt]) => (
                <div key={p} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ flex:1, fontSize:12, color:"rgba(255,255,255,.65)", textTransform:"capitalize" }}>{p}</span>
                  <div style={{ height:6, width:`${Math.min(cnt*18,90)}px`, borderRadius:3, background:"rgba(245,158,11,.5)", minWidth:6 }} />
                  <span style={{ fontSize:11, fontWeight:700, color:"#FCD34D", minWidth:18, textAlign:"right" }}>{cnt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div style={{ ...S.g4, marginBottom:14 }}>
        {[["all","All",total],["open","Open",open],["in-progress","In Progress",inProg],["resolved","Resolved",resolved]].map(([f,label,count]) => (
          <div key={f} onClick={() => setStatusFilter(f)} style={{ ...S.statCard, cursor:"pointer", border:statusFilter===f?"1px solid rgba(13,148,136,.4)":"1px solid rgba(255,255,255,.07)" }}>
            <div style={S.statNum}>{count}</div><div style={S.statLbl}>{label}</div>
          </div>
        ))}
      </div>

      {/* Dept filter chips (school admin only) */}
      {currentUser.role==="school_admin" && deptOptions.length > 0 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
          <div onClick={() => setDeptFilter("all")} style={{...S.chip,...(deptFilter==="all"?S.chipSel:{})}}>🌐 All Departments</div>
          {deptOptions.map(d => (
            <div key={d.code} onClick={() => setDeptFilter(d.code)} style={{...S.chip,...(deptFilter===d.code?S.chipSel:{})}}>{d.name}</div>
          ))}
        </div>
      )}

      <div style={{marginBottom:14}}>
        <input style={S.input} value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search complaints..." />
      </div>

      {/* Complaint list */}
      <div style={S.card}>
        {filtered.map(c => {
          const targetStaff = users.find(u => u.uniqueId===c.targetLecturerUid);
          return (
            <div key={c._id} style={{ borderBottom:"1px solid rgba(255,255,255,.06)", paddingBottom:12, marginBottom:12 }}>
              <ComplaintRow c={{ ...c, _highlight: String(c._id) === String(selectedComplaintId), _forceExpand: String(c._id) === String(selectedComplaintId) }} />

              {/* Admin notes history */}
              {(c.adminNotes||[]).map(n => (
                <div key={n._id} style={{ background:"rgba(245,158,11,.04)", border:"1px solid rgba(245,158,11,.16)", borderRadius:8, padding:"7px 11px", marginBottom:6, marginTop:6 }}>
                  <div style={{ fontSize:10, color:"#FCD34D", fontWeight:700, marginBottom:1 }}>
                    📨 {n.senderName} → {targetStaff?`${targetStaff.firstName} ${targetStaff.lastName}`:c.targetLecturerUid} · {fmtDate(n.createdAt)}
                  </div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.65)" }}>{n.message}</div>
                </div>
              ))}

              {/* Message to staff */}
              {noteOpen[c._id] ? (
                <div style={{ display:"flex", gap:7, marginTop:5 }}>
                  <input
                    value={noteMap[c._id]||""}
                    onChange={e=>setNoteMap(p=>({...p,[c._id]:e.target.value}))}
                    onKeyDown={e=>e.key==="Enter"&&sendNote(c._id)}
                    placeholder={`Message to ${targetStaff?targetStaff.firstName+" "+targetStaff.lastName:"staff"}...`}
                    style={{ ...S.input, flex:1, padding:"7px 11px" }} />
                  <button onClick={() => sendNote(c._id)} style={{ ...S.btn, ...S.btnAmber, padding:"7px 13px", flexShrink:0 }}>Send 📨</button>
                  <button onClick={() => setNoteOpen(p=>({...p,[c._id]:false}))} style={{ ...S.btn, ...S.btnGhost, padding:"7px 10px" }}>✕</button>
                </div>
              ) : (
                <button onClick={() => setNoteOpen(p=>({...p,[c._id]:true}))} style={{ ...S.btn, ...S.btnGhost, padding:"5px 11px", fontSize:11, marginTop:3 }}>
                  📨 Message staff about this
                </button>
              )}
            </div>
          );
        })}
        {filtered.length===0 && <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", padding:30 }}>No complaints match your filters.</div>}
      </div>
    </div>
  );
}
