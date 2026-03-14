import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp }  from "../context/AppContext";
import axios from "axios";
import S from "../utils/styles";
import { SCHOOLS, NON_ACADEMIC, ROLE_LABELS } from "../data/university";
import { getDeptName, getSchoolName, roleIcon, isAdminRole } from "../utils/helpers";

const API_BASE = "https://voicebox-87mb.onrender.com/api";

export default function NewComplaintPage() {
  const { currentUser }           = useAuth();
  const { addComplaint, setPage } = useApp();
  const r = currentUser.role;

  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({
    title:"", description:"", category:"Academic", priority:"medium",
    type:"complaint", isAnonymous:false,
    targetSchool:"", targetDept:"", targetLecturerUid:"", targetLecturerId:"",
  });
  const [touched, setTouched] = useState(false);
  const [err,     setErr]     = useState("");

  // Fetch all staff on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API_BASE}/users/staff/all`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setStaffList(res.data || []))
    .catch(err => console.error("Failed to fetch staff:", err));
  }, []);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const depts      = SCHOOLS.find(s => s.code===form.targetSchool)?.departments || [];
  const isNonAcad  = NON_ACADEMIC.some(g => g.code === form.targetDept);

  // Build list of people who can be targeted
  const deptStaff   = staffList.filter(u => (u.role==="staff"||u.role==="dept_admin") && u.school===form.targetSchool && u.department===form.targetDept && u._id!==currentUser._id);
  const schoolAdmins= staffList.filter(u => u.role==="school_admin" && u.school===form.targetSchool && u._id!==currentUser._id);
  const unitStaff   = staffList.filter(u => (u.role==="staff"||u.role==="dept_admin") && u.unitGroup===form.targetDept && u._id!==currentUser._id);
  const currentList = isNonAcad ? unitStaff : deptStaff; // Exclude school_admin

  const missingTarget = touched && !form.targetLecturerId;

  const submit = () => {
    setTouched(true);
    if (!form.title.trim())       { setErr("A title is required."); return; }
    if (!form.description.trim()) { setErr("A description is required."); return; }
    if (!form.targetLecturerId)   { setErr("You must select a specific person."); return; }
    setErr("");
    addComplaint({ ...form })
      .then(() => {
        // after filing a complaint we send the user directly to the complaints page
        // so they can immediately verify it was recorded (even if anonymous)
        setPage("complaints");
      })
      .catch(e => setErr(e.response?.data?.message || "Failed to submit"));
  };

  return (
    <div style={S.page}>
      <div style={{ fontSize:19, fontWeight:800, color:"white", marginBottom:4 }}>📋 New Complaint / Suggestion</div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", marginBottom:22 }}>
        Direct your {r==="student"?"complaint or suggestion":"complaint, suggestion or escalation"} to a specific person — required.
      </div>

      <div style={S.g2}>
        {/* ──── Left: targeting ──── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ ...S.card, border:missingTarget?"1px solid rgba(239,68,68,.35)":"1px solid rgba(255,255,255,.08)" }}>
            <div style={{ fontSize:13, fontWeight:800, color:"white", marginBottom:12 }}>
              🎯 Direct To <span style={{ fontSize:11, color:"rgba(239,68,68,.6)", fontWeight:400 }}>(required)</span>
            </div>

            <label style={S.label}>Step 1 — School / Unit</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
              {SCHOOLS.map(s => (
                <div key={s.code} onClick={()=>{setF("targetSchool",s.code);setF("targetDept","");setF("targetLecturerUid","");setF("targetLecturerId","");}}
                  style={{...S.chip,...(form.targetSchool===s.code?S.chipSel:{})}}>{s.icon} {s.name}</div>
              ))}
              {NON_ACADEMIC.map(g => (
                <div key={g.code} onClick={()=>{setF("targetSchool",currentUser.school);setF("targetDept",g.code);setF("targetLecturerUid","");setF("targetLecturerId","");}}
                  style={{...S.chip,...(isNonAcad&&form.targetDept===g.code?S.chipSel:{})}}>{g.icon} {g.name}</div>
              ))}
            </div>

            {form.targetSchool && !isNonAcad && (
              <>
                <label style={S.label}>Step 2 — Department</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
                  {depts.map(d => (
                    <div key={d.code} onClick={()=>{setF("targetDept",d.code);setF("targetLecturerUid","");setF("targetLecturerId","");}}
                      style={{...S.chip,...(form.targetDept===d.code?S.chipSel:{})}}>{d.name}</div>
                  ))}
                </div>
              </>
            )}

            {form.targetDept && (
              <>
                <label style={{ ...S.label, color:missingTarget?"#fca5a5":"rgba(255,255,255,.38)" }}>
                  Step 3 — Select Person {missingTarget && <span style={{color:"#fca5a5"}}>← required</span>}
                </label>
                {currentList.length === 0
                  ? <div style={{ fontSize:12, color:"rgba(255,255,255,.35)", padding:"8px 0" }}>No staff in this area yet.</div>
                  : <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {currentList.map(u => (
                        <div key={u._id} onClick={()=>{setF("targetLecturerUid",u.uniqueId);setF("targetLecturerId",u._id);}} style={{
                          display:"flex", alignItems:"center", gap:9, padding:"9px 11px", borderRadius:10, cursor:"pointer",
                          background: form.targetLecturerId===u._id?"rgba(13,148,136,.14)":missingTarget?"rgba(239,68,68,.04)":"rgba(255,255,255,.04)",
                          border: form.targetLecturerId===u._id?"1px solid rgba(13,148,136,.45)":missingTarget?"1px solid rgba(239,68,68,.22)":"1px solid rgba(255,255,255,.07)",
                        }}>
                          <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
                            background: u.role==="school_admin"?"rgba(245,158,11,.2)":u.role==="dept_admin"?"rgba(168,85,247,.2)":"rgba(59,130,246,.2)",
                            border:`1px solid ${u.role==="school_admin"?"rgba(245,158,11,.4)":u.role==="dept_admin"?"rgba(168,85,247,.4)":"rgba(59,130,246,.4)"}` }}>
                            {roleIcon(u.role)}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:"white" }}>{u.firstName} {u.lastName}</div>
                            <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontFamily:"monospace" }}>
                              {u.uniqueId} Â· {u.designation || ROLE_LABELS[u.role]?.label} Â· {getDeptName(u.department)}
                            </div>
                          </div>
                          {form.targetLecturerId===u._id && <div style={{ color:"#2DD4BF", fontSize:16 }}>âœ“</div>}
                        </div>
                      ))}
                    </div>
                }
              </>
            )}
            {!form.targetDept && (
              <div style={{ fontSize:11, color:"rgba(255,255,255,.28)", marginTop:4, fontStyle:"italic" }}>Select a school and department above to see available staff.</div>
            )}
          </div>

          {/* Anon toggle */}
          <div onClick={() => setF("isAnonymous",!form.isAnonymous)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(139,92,246,.06)", border:"1px solid rgba(139,92,246,.2)", borderRadius:12, padding:"11px 15px", cursor:"pointer" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.8)" }}>🎭 Submit Anonymously</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>Your name & UID hidden from the recipient</div>
            </div>
            <div style={{ width:34, height:18, borderRadius:100, display:"flex", alignItems:"center", padding:2, background:form.isAnonymous?"rgba(139,92,246,.4)":"rgba(255,255,255,.1)", border:`1px solid ${form.isAnonymous?"rgba(139,92,246,.6)":"rgba(255,255,255,.2)"}` }}>
              <div style={{ width:14, height:14, borderRadius:"50%", background:form.isAnonymous?"#8B5CF6":"rgba(255,255,255,.4)", marginLeft:form.isAnonymous?"auto":0, transition:"all .15s" }} />
            </div>
          </div>
        </div>

        {/* ──── Right: details ──── */}
        <div style={S.card}>
          <div style={{ fontSize:13, fontWeight:800, color:"white", marginBottom:12 }}>📝 Complaint Details</div>

          <div style={{ display:"flex", gap:7, marginBottom:12 }}>
            {["complaint","suggestion"].map(t => (
              <div key={t} onClick={() => setF("type",t)} style={{ ...S.chip, ...(form.type===t?S.chipSel:{}), flex:1, textAlign:"center" }}>
                {t==="complaint"?"📋 Complaint":"💡 Suggestion"}
              </div>
            ))}
          </div>

          <div style={{marginBottom:11}}><label style={S.label}>Title *</label><input style={S.input} value={form.title} onChange={e=>setF("title",e.target.value)} placeholder="Brief summary of your issue" /></div>
          <div style={{marginBottom:11}}><label style={S.label}>Description *</label><textarea style={{ ...S.textarea, minHeight:95 }} value={form.description} onChange={e=>setF("description",e.target.value)} placeholder="Explain what happened and what outcome you expect..." /></div>

          <div style={{ ...S.g2, marginBottom:14 }}>
            <div>
              <label style={S.label}>Category</label>
              <select style={S.select} value={form.category} onChange={e=>setF("category",e.target.value)}>
                {["Academic","Infrastructure","Welfare","Administration","Finance","Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Priority</label>
              <select style={S.select} value={form.priority} onChange={e=>setF("priority",e.target.value)}>
                {["low","medium","high","urgent"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {form.targetLecturerUid && (
            <div style={{ background:"rgba(13,148,136,.07)", border:"1px solid rgba(13,148,136,.2)", borderRadius:10, padding:11, marginBottom:12, fontSize:12, lineHeight:1.8, color:"rgba(255,255,255,.55)" }}>
              <div style={{ fontWeight:700, color:"#2DD4BF", marginBottom:3 }}>ðŸ“‹ Summary</div>
              <b style={{color:"white"}}>To:</b> <span style={{color:"#93C5FD",fontFamily:"monospace"}}>{form.targetLecturerUid}</span><br/>
              <b style={{color:"white"}}>Dept:</b> {getDeptName(form.targetDept)} Â· <b style={{color:"white"}}>School:</b> {isNonAcad?"Non-Academic":getSchoolName(form.targetSchool)}<br/>
              <b style={{color:"white"}}>From:</b> <span style={{color:form.isAnonymous?"#C4B5FD":"white"}}>{form.isAnonymous?"Anonymous":`${currentUser.firstName} ${currentUser.lastName}`}</span>
            </div>
          )}

          {(err || missingTarget) && (
            <div style={{ background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.25)", borderRadius:8, padding:"8px 11px", color:"#fca5a5", fontSize:12, marginBottom:10 }}>
              ⚠️ {err || "You must select a specific person."}
            </div>
          )}

          <button style={{ ...S.btn, ...S.btnTeal, ...S.btnFull }} onClick={submit}>
            📤 Submit {form.type==="complaint"?"Complaint":"Suggestion"}
          </button>
        </div>
      </div>
    </div>
  );
}
