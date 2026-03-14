import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp }  from "../../context/AppContext";
import S from "../../utils/styles";
import { SCHOOLS, NON_ACADEMIC, ROLE_LABELS, SCHOOL_ADMIN_CODE, DEPT_ADMIN_CODE, YEAR_OF_STUDY, TVET_PROGRAMMES } from "../../data/university";
import { getDeptName, getSchoolName, roleIcon } from "../../utils/helpers";

export default function RegisterPage() {
  const { register }  = useAuth();
  const { setPage }   = useApp();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({
    firstName:"", lastName:"", email:"", phone:"", password:"", confirm:"",
    regNumber:"", staffId:"", designation:"", school:"", department:"",
    programType:"", yearOfStudy:"", unitGroup:"", unitName:"",
  });
  const [code, setCode] = useState(["","","","","",""]);
  const [err,  setErr]  = useState("");

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const needsCode   = role === "school_admin" || role === "dept_admin";
  const EXPECTED    = role === "school_admin" ? SCHOOL_ADMIN_CODE : DEPT_ADMIN_CODE;
  const depts       = SCHOOLS.find(s => s.code === form.school)?.departments || [];

  const next = async () => {
    if (step === 1 && !role) { setErr("Please select a role."); return; }
    if (step === 2) {
      if (!form.firstName || !form.lastName || !form.email || !form.phone) { setErr("Fill all fields."); return; }
      const phoneClean = form.phone.replace(/\D/g, "");
      if (phoneClean.length !== 10 || !/^\d{10}$/.test(phoneClean)) { setErr("Phone must be exactly 10 digits."); return; }
      if (role === "student" && !form.regNumber) { setErr("Registration number required."); return; }
      if ((role === "staff" || role === "dept_admin") && !form.staffId) { setErr("Staff ID required."); return; }
    }
    if (step === 3) {
      if (needsCode && code.join("") !== EXPECTED) { setErr("Invalid activation code."); return; }
      if (!form.school) { setErr("Please select your school."); return; }
      if ((role === "dept_admin" || role === "staff" || role === "student") && !form.department) { setErr("Please select your department."); return; }
      if (role === "student") {
        if (!form.programType) { setErr("Please select degree or diploma."); return; }
        if (!form.yearOfStudy) { setErr("Please select your year of study."); return; }
      }
    }
    if (step === 4) {
      if (!form.password || form.password !== form.confirm) { setErr("Passwords don't match."); return; }
      try {
        setErr("");
        const regData = { ...form, role };
        if (needsCode) regData.activationCode = code.join("");
        const message = await register(regData);
        setErr(message); // Show success message
        // Optionally redirect to login after a delay
        setTimeout(() => setPage("login"), 3000);
      } catch (e) {
        setErr(e.response?.data?.message || "Registration failed. Please try again.");
      }
      return;
    }
    setErr("");
    setStep(s => s + 1);
  };

  const roleOpts = [
    ["school_admin", "🏫", "School Admin", "Manages an entire school"],
    ["dept_admin",   "🏬", "Dept Admin",   "Manages a department (also lecturer)"],
    ["staff",        "🛠️", "Staff",         "Lecturer / non-academic staff"],
    ["student",      "🎓", "Student",       "Enrolled student"],
  ];

  const steps = ["Role","Details","School","Password"];

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#060C18,#0B1820)", padding:20 }}>
      <div style={{ width:560, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:22, padding:34 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <div style={S.logoMark}>📢</div>
          <span style={S.logoTxt}>Voice<span style={{color:"#2DD4BF"}}>Box</span> — Register</span>
          <span style={{ marginLeft:"auto", fontSize:11, color:"rgba(255,255,255,.3)" }}>Step {step}/4</span>
        </div>

        {/* Step indicator */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:22 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", flex:i<3?1:"auto" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                <div style={{
                  width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:700,
                  background: i+1<step ? "rgba(16,185,129,.2)" : i+1===step ? "#0D9488" : "rgba(255,255,255,.07)",
                  border: i+1<step ? "2px solid rgba(16,185,129,.5)" : i+1===step ? "2px solid #2DD4BF" : "2px solid rgba(255,255,255,.12)",
                  color: i+1<=step ? "white" : "rgba(255,255,255,.3)",
                }}>
                  {i+1 < step ? "✓" : i+1}
                </div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", fontWeight:700 }}>{s}</div>
              </div>
              {i < 3 && <div style={{ flex:1, height:1, background:i+1<step?"rgba(16,185,129,.4)":"rgba(255,255,255,.1)", margin:"0 5px", marginBottom:14 }} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Role ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"white", marginBottom:14 }}>Choose Your Role</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {roleOpts.map(([r, icon, label, desc]) => (
                <div key={r} onClick={() => setRole(r)} style={{
                  borderRadius:11, padding:14, cursor:"pointer",
                  background: role===r ? "rgba(13,148,136,.18)" : "rgba(255,255,255,.04)",
                  border: role===r ? "1.5px solid #2DD4BF" : "1.5px solid rgba(255,255,255,.1)",
                  display:"flex", alignItems:"flex-start", gap:10,
                }}>
                  <div style={{ fontSize:22, flexShrink:0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:role===r?"#2DD4BF":"white" }}>{label}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Personal Info ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"white", marginBottom:14 }}>Personal Information</div>
            <div style={{ ...S.g2, marginBottom:11 }}>
              <div><label style={S.label}>First Name</label><input style={S.input} value={form.firstName} onChange={e=>setF("firstName",e.target.value)} placeholder="e.g. Jane" /></div>
              <div><label style={S.label}>Last Name</label><input style={S.input} value={form.lastName} onChange={e=>setF("lastName",e.target.value)} placeholder="e.g. Mwangi" /></div>
            </div>
            <div style={{ ...S.g2, marginBottom:11 }}>
              <div><label style={S.label}>Email</label><input style={S.input} value={form.email} onChange={e=>setF("email",e.target.value)} placeholder="you@laikipia.ac.ke" /></div>
              <div><label style={S.label}>Phone</label><input style={S.input} type="tel" value={form.phone} onChange={e=>setF("phone",e.target.value.replace(/\\D/g, "").slice(0, 10))} placeholder="07XX XXX XXX" maxLength="10" /></div>
            </div>
            {role === "student" && (
              <div style={{marginBottom:11}}><label style={S.label}>Registration Number</label><input style={S.input} value={form.regNumber} onChange={e=>setF("regNumber",e.target.value)} placeholder="LU/2023/XXX/0000" /></div>
            )}
            {(role==="staff"||role==="dept_admin") && (
              <div style={{ ...S.g2, marginBottom:11 }}>
                <div><label style={S.label}>Staff ID</label><input style={S.input} value={form.staffId} onChange={e=>setF("staffId",e.target.value)} placeholder="LU-STAFF-XXXX" /></div>
                <div><label style={S.label}>Designation</label><input style={S.input} value={form.designation} onChange={e=>setF("designation",e.target.value)} placeholder="Lecturer, HoD..." /></div>
              </div>
            )}
            {role === "school_admin" && (
              <div style={{marginBottom:11}}><label style={S.label}>Designation</label><input style={S.input} value={form.designation} onChange={e=>setF("designation",e.target.value)} placeholder="School Dean, Director..." /></div>
            )}
          </div>
        )}

        {/* ── Step 3: Code + School/Dept ── */}
        {step === 3 && (
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"white", marginBottom:14 }}>
              {needsCode ? `🔐 Activation Code + ${role==="school_admin"?"School":"Department"}` : (role==="student"?"Your School & Department":"Your Department or Unit")}
            </div>

            {needsCode && (
              <div style={{ background:role==="school_admin"?"rgba(245,158,11,.06)":"rgba(168,85,247,.06)", border:`1px solid ${role==="school_admin"?"rgba(245,158,11,.2)":"rgba(168,85,247,.2)"}`, borderRadius:12, padding:16, marginBottom:16, textAlign:"center" }}>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.45)", marginBottom:10 }}>
                  Enter the 6-digit <strong style={{color:"white"}}>{role==="school_admin"?"School Admin":"Dept Admin"}</strong> activation code
                </div>
                <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:8 }}>
                  {code.map((v, i) => (
                    <input key={i} id={`code${i}`} maxLength={1} value={v}
                      onChange={e => { const nc=[...code]; nc[i]=e.target.value; setCode(nc); if(e.target.value&&i<5) document.getElementById(`code${i+1}`)?.focus(); }}
                      style={{ width:42, height:50, borderRadius:10, background:v?"rgba(255,255,255,.1)":"rgba(255,255,255,.04)", border:v?`1.5px solid ${role==="school_admin"?"rgba(245,158,11,.5)":"rgba(168,85,247,.5)"}`:"1.5px solid rgba(255,255,255,.15)", color:v?role==="school_admin"?"#FCD34D":"#D8B4FE":"rgba(255,255,255,.3)", fontSize:20, fontWeight:700, textAlign:"center", outline:"none" }} />
                  ))}
                </div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.28)" }}>
                  Activation code required by administrator
                </div>
              </div>
            )}

            <label style={S.label}>School</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
              {SCHOOLS.map(s => (
                <div key={s.code} onClick={()=>{setF("school",s.code);setF("department","");}}
                  style={{...S.chip,...(form.school===s.code?S.chipSel:{})}}>{s.icon} {s.name}</div>
              ))}
            </div>

            {form.school && role !== "school_admin" && (
              <>
                <label style={S.label}>Department</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
                  {depts.map(d => (
                    <div key={d.code} onClick={()=>setF("department",d.code)}
                      style={{...S.chip,...(form.department===d.code?S.chipSel:{})}}>{d.name}</div>
                  ))}
                </div>
                {role === "student" && form.department && (
                  <>
                    <label style={S.label}>Program Type</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                      {[
                        { value: "degree", label: "Degree" },
                        { value: "diploma", label: "Diploma" },
                      ].map(pt => (
                        <div key={pt.value} onClick={()=>{
                          setF("programType",pt.value);
                          if (form.yearOfStudy > 3 && pt.value === "diploma") {
                            setF("yearOfStudy", "");
                          }
                        }}
                          style={{...S.chip,...(form.programType===pt.value?S.chipSel:{})}}>{pt.label}</div>
                      ))}
                    </div>
                    <label style={S.label}>Year of Study</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                      {YEAR_OF_STUDY.filter(y => form.programType === "diploma" ? y.value <= 3 : y.value <= 4).map(y => (
                        <div key={y.value} onClick={()=>setF("yearOfStudy",y.value)}
                          style={{...S.chip,...(form.yearOfStudy===y.value?S.chipSel:{})}}>{y.label}</div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {role === "staff" && (
              <>
                <label style={{ ...S.label, marginTop:6 }}>— OR — Non-Academic Unit</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                  {NON_ACADEMIC.map(g => (
                    <div key={g.code} onClick={()=>{setF("unitGroup",g.code);setF("school","");setF("department","");}}
                      style={{...S.chip,...(form.unitGroup===g.code?S.chipSel:{})}}>{g.icon} {g.name}</div>
                  ))}
                </div>
                {form.unitGroup && (
                  <>
                    <label style={S.label}>Unit</label>
                    <select style={S.select} value={form.unitName} onChange={e=>setF("unitName",e.target.value)}>
                      <option value="">Select unit...</option>
                      {NON_ACADEMIC.find(g=>g.code===form.unitGroup)?.units.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step 4: Password ── */}
        {step === 4 && (
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"white", marginBottom:14 }}>Set Your Password</div>
            <div style={{marginBottom:11}}><label style={S.label}>Password</label><input style={S.input} type="password" value={form.password} onChange={e=>setF("password",e.target.value)} placeholder="Min 8 characters" /></div>
            <div style={{marginBottom:14}}><label style={S.label}>Confirm Password</label><input style={S.input} type="password" value={form.confirm} onChange={e=>setF("confirm",e.target.value)} placeholder="Repeat password" /></div>
            <div style={{ background:"rgba(13,148,136,.06)", border:"1px solid rgba(13,148,136,.2)", borderRadius:10, padding:10, fontSize:11, color:"rgba(255,255,255,.45)" }}>
              <span style={{color:"#2DD4BF",fontWeight:700}}>Summary: </span>
              {roleIcon(role)} {ROLE_LABELS[role]?.label} · {form.firstName} {form.lastName}
              {form.school && ` · ${getSchoolName(form.school)}`}
              {form.department && ` → ${getDeptName(form.department)}`}
              {form.programType && ` (${form.programType.charAt(0).toUpperCase()}${form.programType.slice(1)})`}
              {form.yearOfStudy && ` (${YEAR_OF_STUDY.find(y=>y.value===parseInt(form.yearOfStudy))?.label})`}
              {form.unitGroup && ` · ${NON_ACADEMIC.find(g=>g.code===form.unitGroup)?.name}`}
            </div>
          </div>
        )}

        {err && (
          <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"8px 12px", color:"#fca5a5", fontSize:12, margin:"12px 0" }}>{err}</div>
        )}

        <div style={{ display:"flex", gap:9, marginTop:18 }}>
          {step > 1 && <button style={{ ...S.btn, ...S.btnGhost, flex:1 }} onClick={() => { setErr(""); setStep(s=>s-1); }}>← Back</button>}
          <button style={{ ...S.btn, ...S.btnTeal, flex:2 }} onClick={next}>{step===4?"Create Account ✓":"Continue →"}</button>
        </div>
        <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"rgba(255,255,255,.3)" }}>
          Already registered? <span style={{ color:"#2DD4BF", cursor:"pointer" }} onClick={() => setPage("login")}>Sign in</span>
        </div>
      </div>
    </div>
  );
}
