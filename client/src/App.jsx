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
    const token = window.location.pathname.split("/verify/")[1];
    window.location.href = `/login?verify=${token}`;
    return null;
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
  const { navOpen } = useApp();
  
  const isMobile = window.innerWidth < 768;
  
  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#0B1220", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📢</div>
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
