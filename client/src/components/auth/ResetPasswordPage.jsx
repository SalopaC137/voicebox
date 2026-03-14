import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import S from "../../utils/styles";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_SERVER_URL}/api`;

export default function ResetPasswordPage() {
  const { setPage } = useApp();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

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
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setMessage("");

    try {
      await axios.post(`${API_BASE}/auth/reset-password/${token}`, { password });
      setMessage("Password reset successful. You can now log in.");
      setTimeout(() => setPage("login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div style={{ ...S.page, maxWidth: 400, margin: "50px auto", textAlign: "center" }}>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={S.input}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={S.input}
          required
        />
        <button type="submit" style={S.btnTeal}>Reset Password</button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={() => setPage("login")} style={S.btnGhost}>Back to Login</button>
    </div>
  );
}