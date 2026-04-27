import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import S from "../utils/styles";
import { YEAR_OF_STUDY } from "../data/university";

export default function ProfilePage() {
  const { currentUser, updateProfile } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", regNumber: "", yearOfStudy: "", programType: "degree" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    setForm({
      firstName: currentUser.firstName || "",
      lastName: currentUser.lastName || "",
      regNumber: currentUser.regNumber || "",
      yearOfStudy: currentUser.yearOfStudy ? String(currentUser.yearOfStudy) : "",
      programType: currentUser.programType || "degree",
    });
  }, [currentUser]);

  const saveProfile = async () => {
    try {
      setBusy(true);
      setMessage("");
      setError("");
      const resMessage = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        regNumber: form.regNumber,
        yearOfStudy: form.yearOfStudy ? Number(form.yearOfStudy) : null,
        programType: form.programType,
      });
      setMessage(resMessage || "Profile updated.");
    } catch (e) {
      setError(e.message || "Failed to update profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ ...S.page, maxWidth: 700, margin: "0", width: "100%" }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 12 }}>👤 Personal Profile</div>

      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ ...S.g2 }}>
          <div>
            <label style={S.label}>Unique ID</label>
            <div style={{ color: "rgba(255,255,255,.86)", fontSize: 13 }}>{currentUser?.uniqueId || "—"}</div>
          </div>
          <div>
            <label style={S.label}>Role</label>
            <div style={{ color: "rgba(255,255,255,.86)", fontSize: 13 }}>{currentUser?.role || "—"}</div>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={S.label}>Email</label>
          <div style={{ color: "rgba(255,255,255,.86)", fontSize: 13 }}>{currentUser?.email || "—"}</div>
        </div>
      </div>

      <div style={S.card}>
        {error && <div style={{ color: "#FCA5A5", marginBottom: 10, fontSize: 12 }}>{error}</div>}
        {message && <div style={{ color: "#86efac", marginBottom: 10, fontSize: 12 }}>{message}</div>}

        <div style={{ ...S.g2, marginBottom: 10 }}>
          <div>
            <label style={S.label}>First Name</label>
            <input
              style={S.input}
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            />
          </div>
          <div>
            <label style={S.label}>Last Name</label>
            <input
              style={S.input}
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            />
          </div>
        </div>

        {currentUser?.role === "student" && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Registration Number</label>
              <input
                style={S.input}
                value={form.regNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, regNumber: e.target.value }))}
              />
            </div>

            <div style={{ ...S.g2 }}>
              <div>
                <label style={S.label}>Year of Study</label>
                <select
                  style={S.select}
                  value={form.yearOfStudy}
                  onChange={(e) => setForm((prev) => ({ ...prev, yearOfStudy: e.target.value }))}
                >
                  <option value="">Select year</option>
                  {YEAR_OF_STUDY.map((year) => (
                    <option key={year.value} value={String(year.value)}>{year.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={S.label}>Program Type</label>
                <select
                  style={S.select}
                  value={form.programType}
                  onChange={(e) => setForm((prev) => ({ ...prev, programType: e.target.value }))}
                >
                  <option value="degree">Degree</option>
                  <option value="diploma">Diploma</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={saveProfile}
          disabled={busy}
          style={{ ...S.btn, ...S.btnTeal, opacity: busy ? 0.8 : 1 }}
        >
          {busy ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
