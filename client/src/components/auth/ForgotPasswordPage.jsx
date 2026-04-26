import { useState } from "react";
import { useApp } from "../../context/AppContext";
import S from "../../utils/styles";
import axios from "axios";
import LoadingSpinner from "../shared/LoadingSpinner";

const API_BASE = `${import.meta.env.VITE_SERVER_URL}/api`;

export default function ForgotPasswordPage() {
  const { setPage } = useApp();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setMessage("");

    try {
      setIsSubmitting(true);
      await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#060C18,#0B1820)", padding:20 }}>
      <div style={{ width:440, padding:"44px 40px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:22 }}>
        <div style={{ textAlign:"center", marginBottom:30 }}>
          <div style={{ ...S.logoMark, width:52, height:52, margin:"0 auto 12px", fontSize:24 }}>📢</div>
          <div style={{ fontSize:27, fontWeight:900, color:"white" }}>Voice<span style={{color:"#2DD4BF"}}>Box</span></div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.38)", marginTop:4 }}>Forgot Password</div>
        </div>

        <div style={{ textAlign:"center", marginBottom:20, color:"rgba(255,255,255,.6)", fontSize:13, lineHeight:1.6 }}>
          Enter your email address and we will send you a secure reset link.
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:18 }}>
            <label style={S.label}>Email Address</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={S.input}
              required
            />
          </div>

          {message && (
            <div style={{ background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.3)", borderRadius:8, padding:"8px 12px", color:"#bbf7d0", fontSize:12, marginBottom:12 }}>{message}</div>
          )}
          {error && (
            <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"8px 12px", color:"#fca5a5", fontSize:12, marginBottom:12 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ ...S.btn, ...S.btnTeal, ...S.btnFull, padding:"13px 0", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:isSubmitting ? 0.85 : 1, cursor:isSubmitting ? "not-allowed" : "pointer" }}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner />
                Sending...
              </>
            ) : "Send Reset Email"}
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:24, fontSize:13, color:"rgba(255,255,255,.4)" }}>
          <span
            style={{ color:"#2DD4BF", cursor:"pointer", fontWeight:600, textDecoration:"underline", textUnderlineOffset:3 }}
            onClick={() => setPage("login")}
          >
            Back to Login
          </span>
        </div>
      </div>
    </div>
  );
}