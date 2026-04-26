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
  const { currentUser, loading, logout } = useAuth();
  const { navOpen, toasts, dismissToast, complaintBanner, dismissComplaintBanner, notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showTopNotifications, setShowTopNotifications] = useState(false);
  const accountMenuRef = useRef(null);
  const notificationsMenuRef = useRef(null);
  
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const clickedAccount = accountMenuRef.current && accountMenuRef.current.contains(event.target);
      const clickedNotifications = notificationsMenuRef.current && notificationsMenuRef.current.contains(event.target);

      if (!clickedAccount) {
        setShowAccountMenu(false);
      }

      if (!clickedNotifications) {
        setShowTopNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
  
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

        <div ref={accountMenuRef} style={{ width: "auto", maxWidth: "calc(100vw - 72px)" }}>
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
              </div>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.65)", flexShrink: 0 }}>{showAccountMenu ? "▲" : "▼"}</span>
          </button>

          {showAccountMenu && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: 8, minWidth: 220 }}>
              <div style={{ padding: "2px 2px 8px", fontSize: 11, color: "rgba(255,255,255,.62)", borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentUser?.email || "No email"}
              </div>
              <button
                onClick={logout}
                style={{ width: "100%", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.45)", color: "#FCA5A5", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "left" }}
              >
                ⏻ Logout
              </button>
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
