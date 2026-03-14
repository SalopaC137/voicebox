import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import S from "../../utils/styles";
import axios from "axios";

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

    axios.post(`${API_BASE}/auth/verify/${token}`)
      .then(res => {
        setStatus("success");
        setMessage("Email verified successfully! You can now log in.");
        // Optionally auto-login or redirect
        setTimeout(() => setPage("login"), 3000);
      })
      .catch(err => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed.");
      });
  }, [setPage]);

  return (
    <div style={{ ...S.page, maxWidth: 400, margin: "50px auto", textAlign: "center" }}>
      <h2>Verify Your Account</h2>
      {status === "verifying" && <p>Verifying your email...</p>}
      {status === "success" && <p style={{ color: "green" }}>{message}</p>}
      {status === "error" && <p style={{ color: "red" }}>{message}</p>}
      <button onClick={() => setPage("login")} style={S.btnTeal}>Go to Login</button>
    </div>
  );
}