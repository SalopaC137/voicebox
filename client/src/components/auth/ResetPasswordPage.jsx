import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import S from "../../utils/styles";
import axios from "axios";
import LoadingSpinner from "../shared/LoadingSpinner";

const API_BASE = `${import.meta.env.VITE_SERVER_URL}/api`;

export default function ResetPasswordPage() {
  const { setPage } = useApp();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const urlToken = window.location.pathname.split("/reset-password/")[1];
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("Invalid reset link.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setMessage("");

    try {
      setIsSubmitting(true);
      await axios.post(`${API_BASE}/auth/reset-password/${token}`, { password });
      setMessage("Password reset successful. You can now log in.");
      setTimeout(() => window.location.replace("/"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#060C18,#0B1820)" }}>
        <div style={{ width:440, padding:"44px 40px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:22 }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ ...S.logoMark, width:52, height:52, margin:"0 auto 12px", fontSize:24 }}>📢</div>
          <div style={{ fontSize:27, fontWeight:900, color:"white" }}>Voice<span style={{color:"#2DD4BF"}}>Box</span></div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.38)", marginTop:3 }}>Reset Your Password</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:16}}>
            <label style={S.label}>New Password</label>
            <input
              style={S.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div style={{marginBottom:20}}>
            <label style={S.label}>Confirm Password</label>
            <input
              style={S.input}
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"8px 12px", color:"#fca5a5", fontSize:12, marginBottom:12 }}>{error}</div>
          )}

          {message && (
            <div style={{ background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.3)", borderRadius:8, padding:"8px 12px", color:"#bbf7d0", fontSize:12, marginBottom:12 }}>{message}</div>
          )}

          <button
            style={{ ...S.btn, ...S.btnTeal, ...S.btnFull, padding:"13px 0", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:isSubmitting ? 0.85 : 1, cursor:isSubmitting ? "not-allowed" : "pointer" }}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner />
                Resetting...
              </>
            ) : "Reset Password"}
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:24, fontSize:13, color:"rgba(255,255,255,.4)" }}>
          Remember your password?{" "}
          <span
            style={{ color:"#2DD4BF", cursor:"pointer", fontWeight:600, textDecoration:"underline", textUnderlineOffset:3 }}
            onClick={() => window.location.replace("/")}
          >Sign In</span>
        </div>
      </div>
    </div>
  );
}