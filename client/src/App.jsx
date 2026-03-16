import { useEffect } from "react";
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
  const { currentUser, loading } = useAuth();
  const { navOpen, toasts, dismissToast, complaintBanner, dismissComplaintBanner } = useApp();
  
  const isMobile = window.innerWidth < 768;
  
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

      <div style={{ position: "fixed", top: 14, right: 14, zIndex: 1200, display: "flex", flexDirection: "column", gap: 8, width: "min(360px, calc(100vw - 24px))" }}>
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
  useEffect(() => {
    if (window.__oneSignalInitialized) return;
    window.__oneSignalInitialized = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.init({
        appId: "26f16bf7-589f-4e66-bdf3-25a409693225",
        notifyButton: {
          enable: true,
        },
        serviceWorkerPath: "/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
      });
    });
  }, []);

  return (
    <AuthProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </AuthProvider>
  );
}
