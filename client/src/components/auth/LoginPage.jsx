import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp }  from "../../context/AppContext";
import S from "../../utils/styles";

export default function LoginPage() {
  const { login } = useAuth();
  const { setPage }                = useApp();
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const registerNotice = sessionStorage.getItem("registerNotice");
    if (registerNotice) {
      setNotice(registerNotice);
      sessionStorage.removeItem("registerNotice");
    }
  }, []);

  const tryLogin = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const r = await login(email, pass);
      if (r === "ok") {
        setErr("");
        setPage("dashboard");
      } else {
        setErr(r);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#060C18,#0B1820)" }}>
      <div style={{ width:420, padding:36, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:22 }}>
        <div style={{ textAlign:"center", marginBottom:26 }}>
          <div style={{ ...S.logoMark, width:52, height:52, margin:"0 auto 12px", fontSize:24 }}>📢</div>
          <div style={{ fontSize:27, fontWeight:900, color:"white" }}>Voice<span style={{color:"#2DD4BF"}}>Box</span></div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.38)", marginTop:3 }}>Laikipia University · Complaint & Suggestion Platform</div>
        </div>

        <div style={{marginBottom:12}}>
          <label style={S.label}>Email</label>
          <input style={S.input} value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@laikipia.ac.ke" />
        </div>
        <div style={{marginBottom:14}}>
          <label style={S.label}>Password</label>
          <input style={S.input} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&tryLogin()} />
        </div>

        {err && (
          <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"8px 12px", color:"#fca5a5", fontSize:12, marginBottom:12 }}>{err}</div>
        )}

        {notice && (
          <div style={{ background:"rgba(16,185,129,.12)", border:"1px solid rgba(16,185,129,.4)", borderRadius:8, padding:"8px 12px", color:"#86efac", fontSize:12, marginBottom:12 }}>{notice}</div>
        )}

        <button
          style={{ ...S.btn, ...S.btnTeal, ...S.btnFull, display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:isSubmitting ? 0.8 : 1, cursor:isSubmitting ? "not-allowed" : "pointer" }}
          onClick={tryLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,.35)", borderTopColor:"#fff", animation:"loginSpin .7s linear infinite" }} />
              Signing in...
            </>
          ) : (
            "Sign In →"
          )}
        </button>

        <style>{`@keyframes loginSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"rgba(255,255,255,.3)" }}>
          <span style={{ color:"#2DD4BF", cursor:"pointer" }} onClick={() => setPage("forgot-password")}>Forgot Password?</span>
        </div>

        <div style={{ textAlign:"center", marginTop:18, fontSize:12, color:"rgba(255,255,255,.3)" }}>
          New here?{" "}
          <span style={{ color:"#2DD4BF", cursor:"pointer" }} onClick={() => setPage("register")}>Create an account</span>
        </div>
      </div>
    </div>
  );
}
