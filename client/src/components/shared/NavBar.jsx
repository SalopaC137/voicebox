import { useAuth } from "../../context/AuthContext";
import { useApp }  from "../../context/AppContext";
import S from "../../utils/styles";
import { roleIcon, rolePillStyle, isAdminRole, getDeptName, getSchoolName } from "../../utils/helpers";
import { ROLE_LABELS } from "../../data/university";

export default function NavBar() {
  const { currentUser } = useAuth();
  const {
    setPage,
    page,
    navOpen,
    setNavOpen,
  } = useApp();
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
      ? { ...S.nav, flexDirection: "column", alignItems: "stretch", gap: 20, padding: "20px 14px", height: "100vh", position: "fixed", left: 0, top: 0, width: "100%", transition: "all 0.3s ease", zIndex: 1000, background: "#0A0F1E" }
      : { position: "fixed", top: 10, left: 10, zIndex: 1000, background: "rgba(10,15,30,0.9)", borderRadius: 8, padding: 5 }
    : { ...S.nav, flexDirection: "column", alignItems: "stretch", gap: 22, padding: "20px 14px", height: "100vh", position: "fixed", left: 0, top: 0, width: navOpen ? "240px" : "72px", transition: "width 0.3s ease" };

  const handleNavigate = (pg) => {
    setPage(pg);
    if (isMobile) setNavOpen(false);
  };

  return (
    <div style={navStyle}>
      <button onClick={() => setNavOpen(!navOpen)} style={{ ...S.btn, padding: "12px", fontSize: 17, width: isMobile ? "100%" : "100%", textAlign: "center" }}>
        {navOpen ? "✕" : "☰"}
      </button>

      {navOpen && (
        <>
          <div style={{ display:"flex", flexDirection: "column", alignItems:"flex-start", gap:18 }}>
            <div style={S.logo} onClick={() => handleNavigate("dashboard")}> 
              <div style={S.logoMark}>📢</div>
              <span style={S.logoTxt}>Voice<span style={{color:"#2DD4BF"}}>Box</span></span>
            </div>
            <div style={{ display:"flex", flexDirection: "column", gap:10, width: "100%" }}>
              {links.map(([icon, label, pg]) => (
                <button key={pg} onClick={() => handleNavigate(pg)} style={{
                  ...S.btn, padding:"13px 16px", fontSize:14, width: "100%", textAlign: "left", borderRadius: 14,
                  minHeight: 46,
                  background: page===pg ? "rgba(13,148,136,.15)" : "transparent",
                  border:     page===pg ? "1px solid rgba(13,148,136,.4)" : "1px solid transparent",
                  color:      page===pg ? "#2DD4BF" : "rgba(255,255,255,.5)",
                  lineHeight: 1.15,
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
          </div>
        </>
      )}
    </div>
  );
}
