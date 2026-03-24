import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp }  from "../../context/AppContext";
import S from "../../utils/styles";
import { roleIcon, rolePillStyle, isAdminRole, getDeptName, getSchoolName } from "../../utils/helpers";
import { ROLE_LABELS } from "../../data/university";
import { enableBrowserNotifications } from "../../utils/onesignal";

export default function NavBar() {
  const { currentUser, logout } = useAuth();
  const { setPage, page, navOpen, setNavOpen } = useApp();
  const [notificationsBusy, setNotificationsBusy] = useState(false);
  const [notificationsMsg, setNotificationsMsg] = useState("");
  const r       = currentUser?.role;
  const isAdmin = isAdminRole(r);
  const isStaff = r === "staff";
  const isMobile = window.innerWidth < 768;

  const links = r === "school_admin"
    ? [["📊","Dashboard","dashboard"],["👥","Users","admin-users"],["📋","Complaints","admin-complaints"],["💬","Chat","chat"]]
    : r === "dept_admin"
    ? [["📊","Dashboard","dashboard"],["�","Inbox","complaints"],["👥","Users","admin-users"],["📊","Dept","admin-complaints"],["💬","Chat","chat"]]
    : isStaff
    ? [["📊","Dashboard","dashboard"],["📥","Inbox","complaints"],["✍️","Submit","new-complaint"],["💬","Chat","chat"]]
    : [["📊","Dashboard","dashboard"],["📋","My Complaints","complaints"],["➕","New","new-complaint"],["💬","Chat","chat"]];

  const navStyle = isMobile
    ? navOpen
      ? { ...S.nav, flexDirection: "column", alignItems: "stretch", gap: 20, padding: "20px 10px", height: "100vh", position: "fixed", left: 0, top: 0, width: "100%", transition: "all 0.3s ease", zIndex: 1000, background: "#0A0F1E" }
      : { position: "fixed", top: 10, left: 10, zIndex: 1000, background: "rgba(10,15,30,0.9)", borderRadius: 8, padding: 5 }
    : { ...S.nav, flexDirection: "column", alignItems: "stretch", gap: 20, padding: "20px 10px", height: "100vh", position: "fixed", left: 0, top: 0, width: navOpen ? "200px" : "60px", transition: "width 0.3s ease" };

  const handleEnableNotifications = async () => {
    setNotificationsBusy(true);
    setNotificationsMsg("");

    const result = await enableBrowserNotifications();

    if (result.enabled) {
      setNotificationsMsg("Notifications enabled.");
    } else if (result.reason === "blocked_or_dismissed") {
      setNotificationsMsg("Permission was blocked or dismissed. Check browser site settings.");
    } else {
      setNotificationsMsg("Failed to enable notifications. Try again.");
    }

    setNotificationsBusy(false);
  };

  return (
    <div style={navStyle}>
      <button onClick={() => setNavOpen(!navOpen)} style={{ ...S.btn, padding: "8px", fontSize: 16, width: isMobile ? "100%" : "100%", textAlign: "center" }}>
        {navOpen ? "✕" : "☰"}
      </button>
      {navOpen && (
        <>
          <div style={{ display:"flex", flexDirection: "column", alignItems:"flex-start", gap:16 }}>
            <div style={S.logo} onClick={() => setPage("dashboard")}>
              <div style={S.logoMark}>📢</div>
              <span style={S.logoTxt}>Voice<span style={{color:"#2DD4BF"}}>Box</span></span>
            </div>
            <div style={{ display:"flex", flexDirection: "column", gap:3, width: "100%" }}>
              {links.map(([icon, label, pg]) => (
                <button key={pg} onClick={() => setPage(pg)} style={{
                  ...S.btn, padding:"8px 12px", fontSize:12, width: "100%", textAlign: "left",
                  background: page===pg ? "rgba(13,148,136,.15)" : "transparent",
                  border:     page===pg ? "1px solid rgba(13,148,136,.4)" : "1px solid transparent",
                  color:      page===pg ? "#2DD4BF" : "rgba(255,255,255,.5)",
                }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", flexDirection: "column", alignItems:"flex-start", gap:8, marginTop: "auto" }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,.3)", fontFamily:"monospace" }}>{currentUser.uniqueId}</span>
            <span style={{ ...S.pill, ...rolePillStyle(r) }}>{roleIcon(r)} {ROLE_LABELS[r]?.label || r}</span>
            {r === "school_admin" && <span style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>{getSchoolName(currentUser.school)}</span>}
            {r === "dept_admin"   && <span style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>{getDeptName(currentUser.department)}</span>}
            <button onClick={handleEnableNotifications} disabled={notificationsBusy} style={{ ...S.btn, padding:"6px 12px", fontSize:12, width: "100%" }}>
              {notificationsBusy ? "Enabling..." : "Enable Notifications"}
            </button>
            {notificationsMsg && (
              <span style={{ fontSize:11, color:"rgba(255,255,255,.45)", lineHeight:1.35 }}>{notificationsMsg}</span>
            )}
            <button onClick={logout} style={{ ...S.btn, ...S.btnDanger, padding:"6px 12px", fontSize:12, width: "100%" }}>⏻ Logout</button>
          </div>
        </>
      )}
    </div>
  );
}
