import { useState } from "react";
import { useApp } from "../../context/AppContext";
import S from "../../utils/styles";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_SERVER_URL}/api`;

export default function ForgotPasswordPage() {
  const { setPage } = useApp();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email.");
    }
  };

  return (
    <div style={{ ...S.page, maxWidth: 400, margin: "50px auto", textAlign: "center" }}>
      <h2>Forgot Password</h2>
      <p>Enter your email address and we'll send you a link to reset your password.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={S.input}
          required
        />
        <button type="submit" style={S.btnTeal}>Send Reset Email</button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={() => setPage("login")} style={S.btnGhost}>Back to Login</button>
    </div>
  );
}