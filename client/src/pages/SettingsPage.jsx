import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import S from "../utils/styles";

export default function SettingsPage() {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const savePassword = async () => {
    try {
      setBusy(true);
      setMessage("");
      setError("");
      const resMessage = await changePassword(form);
      setMessage(resMessage || "Password updated.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setError(e.message || "Failed to change password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ ...S.page, maxWidth: 760, margin: "0", width: "100%" }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 12 }}>⚙ Settings</div>

      <div style={S.card}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.72)", marginBottom: 10 }}>
          Change your password below.
        </div>

        {error && <div style={{ color: "#FCA5A5", marginBottom: 10, fontSize: 12 }}>{error}</div>}
        {message && <div style={{ color: "#86efac", marginBottom: 10, fontSize: 12 }}>{message}</div>}

        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <label style={S.label}>Current Password</label>
            <input
              type="password"
              style={S.input}
              value={form.currentPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
          </div>

          <div>
            <label style={S.label}>New Password</label>
            <input
              type="password"
              style={S.input}
              value={form.newPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
          </div>

          <div>
            <label style={S.label}>Confirm New Password</label>
            <input
              type="password"
              style={S.input}
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>
        </div>

        <button
          onClick={savePassword}
          disabled={busy}
          style={{ ...S.btn, ...S.btnTeal, marginTop: 12, opacity: busy ? 0.8 : 1 }}
        >
          {busy ? "Updating..." : "Change Password"}
        </button>
      </div>
    </div>
  );
}
