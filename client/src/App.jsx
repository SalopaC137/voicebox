import { useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider,  useApp  } from "./context/AppContext";

import NavBar           from "./components/shared/NavBar";
import VoiceBoxLanding   from "./landingpage";
import LoginPage        from "./components/auth/LoginPage";
import RegisterPage     from "./components/auth/RegisterPage";
import VerifyPage       from "./components/auth/VerifyPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import ResetPasswordPage  from "./components/auth/ResetPasswordPage";
import Dashboard        from "./pages/Dashboard";
import ComplaintsPage   from "./pages/ComplaintsPage";
import NewComplaintPage from "./pages/NewComplaintPage";
import ChatPage         from "./components/chat/ChatPage";
import AdminUsers       from "./components/admin/AdminUsers";
import AdminComplaints  from "./components/admin/AdminComplaints";

function PageRouter() {
  const { currentUser } = useAuth();
  const { page }        = useApp();

  // Handle special pages from URL
  if (window.location.pathname.startsWith("/verify/")) {
    return <VerifyPage />;
  }
  if (window.location.pathname.startsWith("/reset-password/")) {
    return <ResetPasswordPage />;
  }

  if (!currentUser) {
    if (page === "register") return <RegisterPage />;
    if (page === "login") return <LoginPage />;
    if (page === "forgot-password") return <ForgotPasswordPage />;
    // anything else (landing or unknown) should show landing page
    return <VoiceBoxLanding />;
  }

  // Prevent school_admin from accessing non-admin pages
  if (currentUser.role === "school_admin") {
    return page === "admin-users" ? <AdminUsers /> : 
           page === "admin-complaints" ? <AdminComplaints /> : 
           page === "chat" ? <ChatPage /> :
           <Dashboard />;
  }

  if (page === "dashboard")        return <Dashboard />;
  if (page === "complaints")       return <ComplaintsPage />;
  if (page === "new-complaint")    return <NewComplaintPage />;
  if (page === "chat")             return <ChatPage />;
  if (page === "admin-users")      return <AdminUsers />;
  if (page === "admin-complaints") return <AdminComplaints />;
  return <Dashboard />;
}

function Shell() {
  const { currentUser, loading, logout, updateProfile, changePassword } = useAuth();
  const { navOpen, toasts, dismissToast, complaintBanner, dismissComplaintBanner, notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showTopNotifications, setShowTopNotifications] = useState(false);
  const [accountTab, setAccountTab] = useState("profile");
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", regNumber: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const accountMenuRef = useRef(null);
  const notificationsMenuRef = useRef(null);
  
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const clickedAccount = accountMenuRef.current && accountMenuRef.current.contains(event.target);
      const clickedNotifications = notificationsMenuRef.current && notificationsMenuRef.current.contains(event.target);

      if (!clickedAccount) {
        setShowAccountMenu(false);
        setAccountTab("profile");
      }

      if (!clickedNotifications) {
        setShowTopNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setProfileForm({
      firstName: currentUser.firstName || "",
      lastName: currentUser.lastName || "",
      regNumber: currentUser.regNumber || "",
    });
  }, [currentUser]);

  useEffect(() => {
    if (!showAccountMenu) {
      setAccountTab("profile");
    }
  }, [showAccountMenu]);
  
  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#0B1220", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>VB</div>
          <div style={{ color:"rgba(255,255,255,.6)", fontSize:14 }}>Loading...</div>
        </div>
      </div>
    );
  }
  
  // If not authenticated, don't show navbar
  if (!currentUser) {
    return (
      <div style={{ minHeight:"100vh", background:"#0B1220", color:"rgba(255,255,255,.88)", fontFamily:"system-ui,sans-serif", fontSize:14 }}>
        <PageRouter />
      </div>
    );
  }
  
  return (
    <div style={{ minHeight:"100vh", background:"#0B1220", color:"rgba(255,255,255,.88)", fontFamily:"system-ui,sans-serif", fontSize:14 }}>
      <NavBar />
      <div style={{ marginLeft: isMobile ? 0 : (navOpen ? "200px" : "60px") }}>
        <PageRouter />
      </div>

      <div style={{ position: "fixed", top: 14, right: 14, zIndex: 1300, display: "flex", alignItems: "flex-start", gap: 8, maxWidth: "calc(100vw - 24px)" }}>
        <div ref={notificationsMenuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowTopNotifications((prev) => !prev)}
            style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(10,15,30,.96)", border: "1px solid rgba(45,212,191,.18)", color: "#2DD4BF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(0,0,0,.32)", position: "relative" }}
            aria-label="Notifications"
          >
            <span style={{ fontSize: 16 }}>🔔</span>
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 999, background: "#F59E0B", color: "#111827", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "2px solid #0B1220" }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showTopNotifications && (
            <div style={{ position: "absolute", top: 48, right: 0, width: 320, maxWidth: "calc(100vw - 24px)", background: "rgba(10,15,30,.98)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, boxShadow: "0 14px 28px rgba(0,0,0,.34)", padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#FFFFFF" }}>Notifications</div>
                <button onClick={markAllNotificationsAsRead} style={{ ...{
                  background: "rgba(255,255,255,.04)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "rgba(255,255,255,.78)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  fontSize: 10,
                  cursor: "pointer",
                }}}>Mark all read</button>
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {notifications.slice(0, 8).map((n) => (
                  <button
                    key={n._id}
                    onClick={() => !n.read && markNotificationAsRead(n._id)}
                    style={{
                      textAlign: "left",
                      background: n.read ? "rgba(255,255,255,.02)" : "rgba(45,212,191,.08)",
                      border: n.read ? "1px solid rgba(255,255,255,.08)" : "1px solid rgba(45,212,191,.22)",
                      borderRadius: 10,
                      padding: "8px 9px",
                      color: "rgba(255,255,255,.9)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 11, lineHeight: 1.35, marginBottom: 2 }}>{n.message}</div>
                    <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.45)" }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </button>
                ))}
                {notifications.length === 0 && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", textAlign: "center", padding: "12px 6px" }}>No notifications yet.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={accountMenuRef} style={{ position: "relative", width: "auto", maxWidth: "calc(100vw - 72px)" }}>
          <div style={{ background: "rgba(10,15,30,.96)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 12, boxShadow: "0 10px 24px rgba(0,0,0,.32)", overflow: "hidden", display: "inline-block" }}>
          <button
            onClick={() => setShowAccountMenu((prev) => !prev)}
            style={{ width: "100%", background: "transparent", border: "none", padding: "8px 10px", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
          >
            <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(45,212,191,.14)", border: "1px solid rgba(45,212,191,.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2DD4BF", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                {`${currentUser?.firstName || "A"}`.trim().slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.1 }}>
                  {`${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() || "My Account"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.62)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.1 }}>
                  {currentUser?.email || "No email"}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.65)", flexShrink: 0 }}>{showAccountMenu ? "▲" : "▼"}</span>
          </button>

          {showAccountMenu && (
            <div style={{ position: "absolute", top: 48, right: 0, width: "min(380px, calc(100vw - 24px))", background: "rgba(10,15,30,.98)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, boxShadow: "0 14px 28px rgba(0,0,0,.34)", padding: 10 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, padding: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12 }}>
                <button
                  onClick={() => setAccountTab("profile")}
                  style={{
                    ...S.btn,
                    flex: 1,
                    fontSize: 11,
                    padding: "9px 10px",
                    textAlign: "center",
                    background: accountTab === "profile" ? "rgba(45,212,191,.16)" : "transparent",
                    border: accountTab === "profile" ? "1px solid rgba(45,212,191,.38)" : "1px solid transparent",
                    color: accountTab === "profile" ? "#2DD4BF" : "rgba(255,255,255,.72)",
                    borderRadius: 10,
                  }}
                >
                  Profile
                </button>
                <button
                  onClick={() => setAccountTab("settings")}
                  style={{
                    ...S.btn,
                    flex: 1,
                    fontSize: 11,
                    padding: "9px 10px",
                    textAlign: "center",
                    background: accountTab === "settings" ? "rgba(45,212,191,.16)" : "transparent",
                    border: accountTab === "settings" ? "1px solid rgba(45,212,191,.38)" : "1px solid transparent",
                    color: accountTab === "settings" ? "#2DD4BF" : "rgba(255,255,255,.72)",
                    borderRadius: 10,
                  }}
                >
                  Settings
                </button>
                <button
                  onClick={logout}
                  style={{
                    ...S.btn,
                    flex: 1,
                    fontSize: 11,
                    padding: "9px 10px",
                    textAlign: "center",
                    background: "rgba(239,68,68,.12)",
                    border: "1px solid rgba(239,68,68,.35)",
                    color: "#FCA5A5",
                    borderRadius: 10,
                  }}
                >
                  Logout
                </button>
              </div>

              {accountTab === "profile" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Your Details</div>
                    <div style={{ display: "grid", gap: 8, fontSize: 11, color: "rgba(255,255,255,.55)" }}>
                      <div>Unique ID: <span style={{ color: "#FFFFFF" }}>{currentUser?.uniqueId || "—"}</span></div>
                      <div>Role: <span style={{ color: "#FFFFFF" }}>{currentUser?.role || "—"}</span></div>
                      <div>Email: <span style={{ color: "#FFFFFF" }}>{currentUser?.email || "—"}</span></div>
                      {currentUser?.role === "student" && (
                        <div>Reg Number: <span style={{ color: "#FFFFFF" }}>{currentUser?.regNumber || "—"}</span></div>
                      )}
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Edit Profile</div>
                    {profileError && <div style={{ marginBottom: 8, fontSize: 11, color: "#FCA5A5" }}>{profileError}</div>}
                    {profileMessage && <div style={{ marginBottom: 8, fontSize: 11, color: "#86efac" }}>{profileMessage}</div>}
                    <div style={{ display: "grid", gap: 8 }}>
                      <div>
                        <label style={{ ...S.label, fontSize: 11 }}>First Name</label>
                        <input
                          style={{ ...S.input, fontSize: 12, padding: "7px 10px" }}
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label style={{ ...S.label, fontSize: 11 }}>Last Name</label>
                        <input
                          style={{ ...S.input, fontSize: 12, padding: "7px 10px" }}
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                      {currentUser?.role === "student" && (
                        <div>
                          <label style={{ ...S.label, fontSize: 11 }}>Reg Number</label>
                          <input
                            style={{ ...S.input, fontSize: 12, padding: "7px 10px" }}
                            value={profileForm.regNumber}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, regNumber: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          setProfileBusy(true);
                          setProfileError("");
                          setProfileMessage("");
                          const message = await updateProfile({
                            firstName: profileForm.firstName,
                            lastName: profileForm.lastName,
                            regNumber: profileForm.regNumber,
                          });
                          setProfileMessage(message);
                        } catch (error) {
                          setProfileError(error.message || "Profile update failed.");
                        } finally {
                          setProfileBusy(false);
                        }
                      }}
                      disabled={profileBusy}
                      style={{ ...S.btn, ...S.btnTeal, width: "100%", marginTop: 8, fontSize: 12, padding: "8px 10px", opacity: profileBusy ? 0.8 : 1 }}
                    >
                      {profileBusy ? "Saving..." : "Save Profile"}
                    </button>
                  </div>

                </div>
              )}

              {accountTab === "settings" && (
                <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Change Password</div>
                  {passwordError && <div style={{ marginBottom: 8, fontSize: 11, color: "#FCA5A5" }}>{passwordError}</div>}
                  {passwordMessage && <div style={{ marginBottom: 8, fontSize: 11, color: "#86efac" }}>{passwordMessage}</div>}
                  <div style={{ display: "grid", gap: 8 }}>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>Current Password</label>
                      <input
                        type="password"
                        style={{ ...S.input, fontSize: 12, padding: "7px 10px" }}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>New Password</label>
                      <input
                        type="password"
                        style={{ ...S.input, fontSize: 12, padding: "7px 10px" }}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>Confirm New Password</label>
                      <input
                        type="password"
                        style={{ ...S.input, fontSize: 12, padding: "7px 10px" }}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        setPasswordBusy(true);
                        setPasswordError("");
                        setPasswordMessage("");
                        const message = await changePassword(passwordForm);
                        setPasswordMessage(message);
                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      } catch (error) {
                        setPasswordError(error.message || "Password change failed.");
                      } finally {
                        setPasswordBusy(false);
                      }
                    }}
                    disabled={passwordBusy}
                    style={{ ...S.btn, ...S.btnTeal, width: "100%", marginTop: 8, fontSize: 12, padding: "8px 10px", opacity: passwordBusy ? 0.8 : 1 }}
                  >
                    {passwordBusy ? "Updating..." : "Change Password"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {complaintBanner && (
        <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 1300, width: "min(520px, calc(100vw - 24px))" }}>
          <div style={{ background: "rgba(6,78,59,.95)", border: "1px solid rgba(52,211,153,.45)", borderRadius: 10, padding: "10px 12px", boxShadow: "0 8px 20px rgba(0,0,0,.28)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "#6EE7B7", fontWeight: 800, marginBottom: 3 }}>{complaintBanner.label}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.92)" }}>{complaintBanner.message}</div>
              </div>
              <button onClick={dismissComplaintBanner} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.6)", fontSize: 14, cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "fixed", top: 90, right: 14, zIndex: 1200, display: "flex", flexDirection: "column", gap: 8, width: "min(360px, calc(100vw - 24px))" }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{ background: "rgba(10,15,30,.96)", border: "1px solid rgba(45,212,191,.4)", borderRadius: 10, padding: "10px 12px", boxShadow: "0 8px 20px rgba(0,0,0,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "#2DD4BF", fontWeight: 700, marginBottom: 3 }}>New notification</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.9)" }}>{toast.message}</div>
              </div>
              <button onClick={() => dismissToast(toast.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.55)", fontSize: 14, cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </AuthProvider>
  );
}
