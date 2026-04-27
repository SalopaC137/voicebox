import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import S from "../utils/styles";

export default function SettingsPage() {
  const { changePassword, requestDeleteAccountCode, deleteAccount } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [codeBusy, setCodeBusy] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
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

  const requestCode = async () => {
    try {
      setCodeBusy(true);
      setDeleteError("");
      const resMessage = await requestDeleteAccountCode();
      setDeleteMessage(resMessage || "Deletion code sent.");
    } catch (e) {
      setDeleteError(e.message || "Failed to send code.");
    } finally {
      setCodeBusy(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!/^\d{4}$/.test(deleteCode)) {
      setDeleteError("Enter the 4-digit code sent to your email.");
      return;
    }
    if (!window.confirm("This will permanently delete your account. Continue?")) return;

    try {
      setDeleteBusy(true);
      setDeleteError("");
      await deleteAccount(deleteCode);
      setDeleteMessage("Account deleted.");
    } catch (e) {
      setDeleteError(e.message || "Failed to delete account.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div style={{ ...S.page, maxWidth: 700, margin: "0", width: "100%" }}>
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

      <div style={{ ...S.card, marginTop: 14, border: "1px solid rgba(239,68,68,.28)", background: "rgba(239,68,68,.06)" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#FCA5A5", marginBottom: 8 }}>Danger Zone</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.72)", marginBottom: 10 }}>
          Delete account requires a 4-digit confirmation code sent to your email.
        </div>

        {deleteError && <div style={{ color: "#FCA5A5", marginBottom: 10, fontSize: 12 }}>{deleteError}</div>}
        {deleteMessage && <div style={{ color: "#86efac", marginBottom: 10, fontSize: 12 }}>{deleteMessage}</div>}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={requestCode}
            disabled={codeBusy || deleteBusy}
            style={{ ...S.btn, ...S.btnGhost, opacity: codeBusy || deleteBusy ? 0.75 : 1 }}
          >
            {codeBusy ? "Sending..." : "Send 4-Digit Code"}
          </button>

          <input
            style={{ ...S.input, width: 160, letterSpacing: "0.2em", textAlign: "center" }}
            inputMode="numeric"
            maxLength={4}
            value={deleteCode}
            onChange={(e) => setDeleteCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="0000"
          />

          <button
            onClick={confirmDeleteAccount}
            disabled={deleteBusy || codeBusy}
            style={{ ...S.btn, ...S.btnDanger, opacity: deleteBusy || codeBusy ? 0.75 : 1 }}
          >
            {deleteBusy ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
