import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import S from "../../utils/styles";
import axios from "axios";
import LoadingSpinner from "../shared/LoadingSpinner";

const API_BASE = `${import.meta.env.VITE_SERVER_URL}/api`;

export default function VerifyPage() {
  const { setPage } = useApp();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = window.location.pathname.split("/verify/")[1];
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    axios.get(`${API_BASE}/auth/verify/${token}`)
      .then(res => {
        setStatus("success");
        setMessage("Email verified successfully! You can now log in.");
        setTimeout(() => window.location.replace("/"), 2500);
      })
      .catch(err => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed.");
      });
  }, [setPage]);

  return (
    <div style={{ ...S.page, maxWidth: 400, margin: "50px auto", textAlign: "center" }}>
      <h2>Verify Your Account</h2>
      {status === "verifying" && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <LoadingSpinner />
          <p style={{ margin:0 }}>Verifying your email...</p>
        </div>
      )}
      {status === "success" && <p style={{ color: "green" }}>{message}</p>}
      {status === "error" && <p style={{ color: "red" }}>{message}</p>}
      <button onClick={() => window.location.replace("/")} style={{ ...S.btn, ...S.btnTeal, marginTop:16, padding:"10px 28px" }}>Go to Login</button>
    </div>
  );
}