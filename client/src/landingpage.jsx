import { useEffect } from "react";
import { useApp } from "./context/AppContext"; // used to navigate to login/register

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --ink:#07090F; --paper:#F4F1EB; --teal:#0B8C82; --teal-lt:#13B8AC;
    --amber:#C4700A; --muted:#7A7468; --rule:rgba(0,0,0,0.1); --card:#FDFBF7;
    --fd:'Syne',Georgia,serif; --fb:'DM Sans',system-ui,sans-serif; --fm:'DM Mono',monospace;
  }
  html { scroll-behavior:smooth; }
  .vb-root { background:var(--paper); color:var(--ink); font-family:var(--fb); font-size:16px; line-height:1.6; overflow-x:hidden; }

  /* NAV */
  .vb-nav { position:fixed; top:0; left:0; right:0; z-index:100; display:flex; align-items:center; justify-content:space-between; padding:16px 52px; background:rgba(244,241,235,.92); backdrop-filter:blur(14px); border-bottom:1px solid var(--rule); }
  .vb-logo { display:flex; align-items:center; gap:10px; font-family:var(--fd); font-size:18px; font-weight:800; color:var(--ink); text-decoration:none; cursor:pointer; }
  .vb-logo-mark { width:34px; height:34px; border-radius:9px; background:var(--ink); display:flex; align-items:center; justify-content:center; color:var(--paper); font-size:16px; }
  .vb-logo span { color:var(--teal); }
  .vb-nav-links { display:flex; align-items:center; gap:24px; }
  .vb-nav-links a { font-size:13px; font-weight:500; color:var(--muted); text-decoration:none; transition:color .2s; font-family:var(--fb); }
  .vb-nav-links a:hover { color:var(--ink); }
  .vb-nav-cta { background:var(--ink) !important; color:var(--paper) !important; padding:8px 20px; border-radius:100px; font-weight:600 !important; }
  .vb-nav-cta:hover { background:var(--teal) !important; }

  /* HERO */
  .vb-hero { min-height:100vh; display:flex; flex-direction:column; justify-content:flex-end; padding:0 52px 64px; position:relative; overflow:hidden; }
  .vb-hero-bg { position:absolute; top:50%; left:50%; transform:translate(-50%,-52%); font-family:var(--fd); font-size:clamp(90px,17vw,260px); font-weight:800; line-height:1; color:transparent; -webkit-text-stroke:1.5px rgba(0,0,0,0.055); white-space:nowrap; pointer-events:none; z-index:0; letter-spacing:-0.03em; animation:vbBgfade 1.4s ease forwards; opacity:0; }
  @keyframes vbBgfade { to { opacity:1; } }
  .vb-hero-tag { display:inline-flex; align-items:center; gap:7px; background:var(--ink); color:var(--paper); padding:6px 14px; border-radius:100px; font-size:12px; font-family:var(--fm); letter-spacing:.04em; margin-bottom:22px; position:relative; z-index:1; animation:vbUp .7s .1s both; }
  .vb-dot { width:6px; height:6px; border-radius:50%; background:var(--teal-lt); animation:vbPulse 2s infinite; }
  @keyframes vbPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.6)} }
  .vb-hero h1 { font-family:var(--fd); font-size:clamp(50px,8vw,112px); font-weight:800; line-height:.92; letter-spacing:-0.04em; position:relative; z-index:1; animation:vbUp .7s .2s both; max-width:880px; }
  .vb-hero h1 em { font-style:normal; color:var(--teal); display:block; }
  .vb-hero-bottom { display:flex; align-items:flex-end; justify-content:space-between; margin-top:40px; position:relative; z-index:1; animation:vbUp .7s .35s both; gap:40px; }
  .vb-hero-sub { font-size:17px; color:var(--muted); max-width:420px; line-height:1.65; font-weight:300; }
  .vb-hero-sub strong { color:var(--ink); font-weight:500; }
  .vb-hero-btns { display:flex; gap:12px; flex-shrink:0; }
  .vb-btn-p { background:var(--ink); color:var(--paper); padding:14px 30px; border-radius:100px; font-family:var(--fd); font-weight:700; font-size:14px; text-decoration:none; transition:all .2s; display:inline-flex; align-items:center; gap:8px; cursor:pointer; border:none; }
  .vb-btn-p:hover { background:var(--teal); transform:translateY(-2px); }
  .vb-btn-s { background:transparent; color:var(--ink); padding:14px 30px; border-radius:100px; font-family:var(--fd); font-weight:700; font-size:14px; text-decoration:none; transition:all .2s; border:1.5px solid var(--ink); cursor:pointer; }
  .vb-btn-s:hover { background:var(--ink); color:var(--paper); transform:translateY(-2px); }
  .vb-hero-rule { position:absolute; bottom:0; left:0; right:0; height:1px; background:var(--rule); }
  @keyframes vbUp { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }

  /* STATS */
  .vb-stats { display:grid; grid-template-columns:repeat(4,1fr); border-bottom:1px solid var(--rule); }
  .vb-stat { padding:38px 52px; border-right:1px solid var(--rule); }
  .vb-stat:last-child { border-right:none; }
  .vb-stat-n { font-family:var(--fd); font-size:50px; font-weight:800; line-height:1; letter-spacing:-0.04em; margin-bottom:5px; }
  .vb-stat-n span { color:var(--teal); }
  .vb-stat-l { font-size:13px; color:var(--muted); }

  /* SECTIONS */
  .vb-section { position:relative; z-index:1; }
  .vb-inner { padding:90px 52px; }
  .vb-sec-tag { font-family:var(--fm); font-size:11px; color:var(--teal); text-transform:uppercase; letter-spacing:.12em; margin-bottom:13px; display:block; }
  .vb-sec-h { font-family:var(--fd); font-size:clamp(30px,4.5vw,56px); font-weight:800; line-height:1.05; letter-spacing:-0.03em; max-width:620px; margin-bottom:16px; }
  .vb-sec-p { font-size:16px; color:var(--muted); max-width:500px; line-height:1.7; font-weight:300; }

  /* ROLES */
  .vb-roles-wrap { display:grid; grid-template-columns:1fr 1.4fr; border-top:1px solid var(--rule); }
  .vb-roles-intro { padding:78px 52px; border-right:1px solid var(--rule); display:flex; flex-direction:column; justify-content:center; }
  .vb-roles-grid { display:grid; grid-template-columns:1fr 1fr; }
  .vb-role-card { padding:42px 34px; border-bottom:1px solid var(--rule); border-right:1px solid var(--rule); transition:background .2s; position:relative; overflow:hidden; cursor:default; }
  .vb-role-card:nth-child(even) { border-right:none; }
  .vb-role-card:nth-child(3), .vb-role-card:nth-child(4) { border-bottom:none; }
  .vb-role-card:hover { background:var(--card); }
  .vb-role-card::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; transform:scaleX(0); transform-origin:left; transition:transform .3s; }
  .vb-role-card:hover::after { transform:scaleX(1); }
  .vb-tc::after { background:var(--teal); }
  .vb-ac::after { background:var(--amber); }
  .vb-ri { width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:19px; margin-bottom:14px; }
  .vb-ri-t { background:rgba(11,140,130,.12); }
  .vb-ri-a { background:rgba(196,112,10,.12); }
  .vb-ri-b { background:rgba(37,99,235,.12); }
  .vb-ri-g { background:rgba(22,163,74,.12); }
  .vb-role-n { font-family:var(--fd); font-size:16px; font-weight:700; margin-bottom:4px; }
  .vb-role-uid { font-family:var(--fm); font-size:11px; color:var(--muted); margin-bottom:9px; }
  .vb-role-d { font-size:13.5px; color:var(--muted); line-height:1.6; }

  /* FEATURES */
  .vb-feat-sec { background:var(--ink); color:#F4F1EB; }
  .vb-feat-sec .vb-sec-tag { color:var(--teal-lt); }
  .vb-feat-sec .vb-sec-h { color:#F4F1EB; }
  .vb-feat-sec .vb-sec-p { color:rgba(244,241,235,.5); }
  .vb-feat-grid { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid rgba(244,241,235,.1); margin-top:50px; }
  .vb-feat-item { padding:38px 34px; border-right:1px solid rgba(244,241,235,.08); border-bottom:1px solid rgba(244,241,235,.08); transition:background .2s; cursor:default; }
  .vb-feat-item:nth-child(3n) { border-right:none; }
  .vb-feat-item:nth-child(4),.vb-feat-item:nth-child(5),.vb-feat-item:nth-child(6) { border-bottom:none; }
  .vb-feat-item:hover { background:rgba(244,241,235,.04); }
  .vb-feat-num { font-family:var(--fm); font-size:11px; color:rgba(244,241,235,.22); margin-bottom:16px; letter-spacing:.08em; }
  .vb-feat-title { font-family:var(--fd); font-size:17px; font-weight:700; margin-bottom:9px; color:#F4F1EB; }
  .vb-feat-desc { font-size:13.5px; color:rgba(244,241,235,.48); line-height:1.65; }

  /* HOW IT WORKS */
  .vb-how-sec { border-top:1px solid var(--rule); }
  .vb-steps { display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid var(--rule); margin-top:50px; }
  .vb-step { padding:38px 34px; border-right:1px solid var(--rule); }
  .vb-step:last-child { border-right:none; }
  .vb-step-n { font-family:var(--fd); font-size:70px; font-weight:800; color:rgba(0,0,0,.055); line-height:1; margin-bottom:10px; letter-spacing:-0.05em; }
  .vb-step-t { font-family:var(--fd); font-size:16px; font-weight:700; margin-bottom:8px; }
  .vb-step-d { font-size:13.5px; color:var(--muted); line-height:1.6; }

  /* SCHOOLS */
  .vb-schools-sec { border-top:1px solid var(--rule); }
  .vb-schools-wrap { display:grid; grid-template-columns:1fr 1.8fr; gap:60px; align-items:start; }
  .vb-school-row { display:flex; align-items:flex-start; gap:14px; padding:18px 0; border-bottom:1px solid var(--rule); transition:all .2s; cursor:default; }
  .vb-school-row:first-child { border-top:1px solid var(--rule); }
  .vb-school-row:hover .vb-sarrow { transform:translateX(4px); color:var(--teal); }
  .vb-scode { font-family:var(--fm); font-size:12px; font-weight:500; color:var(--teal); min-width:44px; padding-top:2px; }
  .vb-sinfo { flex:1; }
  .vb-sname { font-family:var(--fd); font-size:15px; font-weight:700; margin-bottom:2px; }
  .vb-sdepts { font-size:12.5px; color:var(--muted); }
  .vb-sarrow { color:var(--muted); font-size:15px; padding-top:2px; transition:all .2s; }
  .vb-na-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:13px; margin-top:30px; }
  .vb-na-card { background:var(--card); border:1px solid var(--rule); border-radius:12px; padding:18px 16px; }
  .vb-na-icon { font-size:22px; margin-bottom:7px; }
  .vb-na-n { font-family:var(--fd); font-size:13px; font-weight:700; margin-bottom:3px; }
  .vb-na-u { font-size:12px; color:var(--muted); }

  /* DEMO */
  .vb-demo-sec { background:var(--card); border-top:1px solid var(--rule); }
  .vb-cred-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-top:34px; }
  .vb-cred-card { border:1.5px solid var(--rule); border-radius:13px; padding:18px; background:var(--paper); transition:all .2s; cursor:default; }
  .vb-cred-card:hover { border-color:var(--teal); transform:translateY(-2px); }
  .vb-cred-role { font-family:var(--fd); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:9px; display:flex; align-items:center; gap:5px; }
  .vb-cdot { width:6px; height:6px; border-radius:50%; }
  .vb-cred-name { font-family:var(--fd); font-size:14px; font-weight:700; margin-bottom:6px; }
  .vb-cred-d { font-family:var(--fm); font-size:11px; color:var(--muted); background:rgba(0,0,0,.04); padding:5px 8px; border-radius:6px; margin-bottom:4px; word-break:break-all; }

  /* QUICKSTART */
  .vb-qs-sec { background:var(--ink); color:#F4F1EB; }
  .vb-qs-sec .vb-sec-tag { color:var(--teal-lt); }
  .vb-qs-sec .vb-sec-h { color:#F4F1EB; }
  .vb-cmd { background:rgba(244,241,235,.06); border:1px solid rgba(244,241,235,.1); border-radius:13px; padding:26px 30px; margin-top:30px; font-family:var(--fm); font-size:13px; color:rgba(244,241,235,.7); line-height:2.2; }
  .vb-cc { color:rgba(244,241,235,.28); }
  .vb-cd { color:var(--teal-lt); font-weight:500; }
  .vb-ck { color:#F0A030; }
  .vb-ct { color:rgba(244,241,235,.85); }

  /* FOOTER */
  .vb-footer { border-top:1px solid var(--rule); padding:34px 52px; display:flex; align-items:center; justify-content:space-between; }
  .vb-flogo { font-family:var(--fd); font-size:15px; font-weight:800; }
  .vb-flogo span { color:var(--teal); }
  .vb-fcopy { font-size:12px; color:var(--muted); }
  .vb-fstack { display:flex; gap:7px; flex-wrap:wrap; }
  .vb-pill { font-family:var(--fm); font-size:11px; background:rgba(0,0,0,.06); padding:4px 10px; border-radius:100px; color:var(--muted); }

  /* SCROLL REVEAL */
  .vb-r { opacity:0; transform:translateY(18px); transition:opacity .6s ease, transform .6s ease; }
  .vb-r.vb-in { opacity:1; transform:none; }

  /* RESPONSIVE */
  @media(max-width:900px){
    .vb-nav { padding:14px 22px; }
    .vb-nav-links a:not(.vb-nav-cta) { display:none; }
    .vb-hero { padding:0 22px 44px; }
    .vb-hero-bottom { flex-direction:column; align-items:flex-start; }
    .vb-stats { grid-template-columns:1fr 1fr; }
    .vb-stat { padding:26px 22px; }
    .vb-inner { padding:60px 22px; }
    .vb-roles-wrap { grid-template-columns:1fr; }
    .vb-roles-intro { padding:44px 22px; border-right:none; border-bottom:1px solid var(--rule); }
    .vb-feat-grid { grid-template-columns:1fr; }
    .vb-steps { grid-template-columns:1fr 1fr; }
    .vb-schools-wrap { grid-template-columns:1fr; gap:28px; }
    .vb-cred-grid { grid-template-columns:1fr 1fr; }
    .vb-na-grid { grid-template-columns:1fr; }
    .vb-footer { flex-direction:column; gap:14px; align-items:flex-start; padding:26px 22px; }
  }
`;

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function VoiceBoxLanding() {
  const { setPage } = useApp();

  useEffect(() => {
    // Inject styles
    const styleTag = document.createElement("style");
    styleTag.id = "vb-styles";
    styleTag.textContent = css;
    if (!document.getElementById("vb-styles")) document.head.appendChild(styleTag);

    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = (i % 4) * 75 + "ms";
          entry.target.classList.add("vb-in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });

    document.querySelectorAll(".vb-r").forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      document.getElementById("vb-styles")?.remove();
    };
  }, []);

  return (
    <div className="vb-root">

      {/* ── NAV ── */}
      <nav className="vb-nav">
        <div className="vb-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="vb-logo-mark">📢</div>
          Voice<span>Box</span>
        </div>
        <div className="vb-nav-links">
          <a href="#roles"        onClick={(e) => { e.preventDefault(); scrollTo("roles"); }}>Roles</a>
          <a href="#features"     onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>Features</a>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo("how-it-works"); }}>How It Works</a>
          <a href="#schools"      onClick={(e) => { e.preventDefault(); scrollTo("schools"); }}>Structure</a>
          <a href="#demo"         onClick={(e) => { e.preventDefault(); scrollTo("demo"); }}>Demo</a>
          {/* auth links */}
          <a href="#" onClick={(e) => { e.preventDefault(); setPage("login"); }} className="vb-nav-cta">Login</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setPage("register"); }} className="vb-nav-cta">Register</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="vb-hero">
        <div className="vb-hero-bg">VOICE</div>
        <div className="vb-hero-tag">
          <div className="vb-dot" />
          Laikipia University · Internal Platform
        </div>
        <h1>
          Every voice<br />
          <em>deserves to be</em> heard.
        </h1>
        <div className="vb-hero-bottom">
          <p className="vb-hero-sub">
            A structured complaint and suggestion platform for{" "}
            <strong>students, staff, and administrators</strong> across all schools
            and departments. Transparent, scoped, and anonymous when you need it.
          </p>
          <div className="vb-hero-btns">
            <button className="vb-btn-p" onClick={() => setPage("login")}>Get Started →</button>
            <button className="vb-btn-s" onClick={() => scrollTo("features")}>Explore Features</button>
          </div>
        </div>
        <div className="vb-hero-rule" />
      </header>

      {/* ── STATS ── */}
      <div className="vb-stats vb-r">
        {[
          ["4", "+", "Schools of Study"],
          ["11", "+", "Academic Departments"],
          ["4", "",  "User Roles & Scopes"],
          ["100", "%", "Optional Anonymity"],
        ].map(([n, suffix, label]) => (
          <div className="vb-stat" key={label}>
            <div className="vb-stat-n">{n}<span>{suffix}</span></div>
            <div className="vb-stat-l">{label}</div>
          </div>
        ))}
      </div>

      {/* ── ROLES ── */}
      <section id="roles" className="vb-section">
        <div className="vb-roles-wrap">
          <div className="vb-roles-intro vb-r">
            <span className="vb-sec-tag">/ 01 — Roles</span>
            <h2 className="vb-sec-h">Four roles.<br />One platform.</h2>
            <p className="vb-sec-p">
              Each user sees only what they need to — scoped by school, department,
              or personal inbox. Privacy and hierarchy built-in from the ground up.
            </p>
          </div>
          <div className="vb-roles-grid">
            {[
              { icon:"🏫", ri:"vb-ri-t", card:"vb-tc", name:"School Admin", uid:"SAD-XXX-XXXX", desc:"Oversees all complaints and users across their entire school. Can view department-level data, generate reports, and message staff about specific issues." },
              { icon:"🏬", ri:"vb-ri-a", card:"vb-ac", name:"Dept Admin",   uid:"DAD-XXX-XXXX", desc:"HoD or senior lecturer who manages their department's complaints plus a personal inbox as a lecturer. Bridges school-level and dept-level visibility." },
              { icon:"🛠️", ri:"vb-ri-b", card:"vb-tc", name:"Staff",        uid:"STF-XXX-XXXX", desc:"Lecturers and non-academic staff who receive complaints directed at them. Can reply, update status, and access the department chat room." },
              { icon:"🎓", ri:"vb-ri-g", card:"vb-ac", name:"Student",      uid:"STU-XXX-XXXXX", desc:"Enrolled students who submit complaints or suggestions to any staff member. Can choose to stay fully anonymous — identity hidden from the recipient." },
            ].map((r) => (
              <div className={`vb-role-card ${r.card} vb-r`} key={r.name}>
                <div className={`vb-ri ${r.ri}`}>{r.icon}</div>
                <div className="vb-role-n">{r.name}</div>
                <div className="vb-role-uid">{r.uid}</div>
                <div className="vb-role-d">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="vb-section vb-feat-sec">
        <div className="vb-inner">
          <span className="vb-sec-tag vb-r">/ 02 — Features</span>
          <h2 className="vb-sec-h vb-r">Everything you need.<br />Nothing you don't.</h2>
          <p className="vb-sec-p vb-r">Built for a real university environment — not a generic help-desk template.</p>
          <div className="vb-feat-grid">
            {[
              ["01", "🎭 True Anonymity",        "Students submit fully anonymous complaints. Recipients see no name or UID. Admins retain a private reveal for oversight — never shown publicly."],
              ["02", "🎯 Targeted Submission",   "Every complaint must be directed at a specific person — school → department → individual. No vague reports lost in a void. Accountability built in."],
              ["03", "🔒 Scoped Visibility",     "School admins see only their school. Dept admins see only their department. Staff see only their inbox. No cross-school data leakage by design."],
              ["04", "💬 Live Chat Rooms",       "Department and school-level chat rooms, role-scoped. School admins broadcast across all departments. Students only see their own department's room."],
              ["05", "📊 Admin Reports",         "Resolution rates, category breakdowns, department comparisons, priority heat maps — one-click reports for school and dept admins."],
              ["06", "🏛️ Non-Academic Units",   "Directorates, Support Units (incl. Administrative Staff and Academic & Student Affairs), and Farm Department — all supported as complaint targets."],
            ].map(([num, title, desc]) => (
              <div className="vb-feat-item vb-r" key={num}>
                <div className="vb-feat-num">{num}</div>
                <div className="vb-feat-title">{title}</div>
                <div className="vb-feat-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="vb-section vb-how-sec">
        <div className="vb-inner">
          <span className="vb-sec-tag vb-r">/ 03 — Process</span>
          <h2 className="vb-sec-h vb-r">From frustration<br />to resolution.</h2>
          <div className="vb-steps">
            {[
              ["01", "Register & Sign In",  "Create your account as a student, staff, or admin. Admins enter their activation code during sign-up to verify their elevated role."],
              ["02", "Select Your Target",  "Navigate to the school → department → specific person. You must select an individual — no ambiguous reports allowed."],
              ["03", "Submit & Track",      "Write your complaint or suggestion, choose priority, decide if you want anonymity. Track from Open → In Progress → Resolved."],
              ["04", "Get a Response",      "The assigned lecturer replies directly in the thread. Admins can send private notes to staff about specific cases without the student seeing."],
            ].map(([num, title, desc]) => (
              <div className="vb-step vb-r" key={num}>
                <div className="vb-step-n">{num}</div>
                <div className="vb-step-t">{title}</div>
                <div className="vb-step-d">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCHOOLS ── */}
      <section id="schools" className="vb-section vb-schools-sec">
        <div className="vb-inner">
          <div className="vb-schools-wrap">
            <div>
              <span className="vb-sec-tag vb-r">/ 04 — Structure</span>
              <h2 className="vb-sec-h vb-r">The whole<br />university,<br />mapped.</h2>
              <p className="vb-sec-p vb-r">Every school, department, and non-academic unit at Laikipia University is built in — no manual configuration needed.</p>
              <div className="vb-na-grid vb-r">
                {[
                  { icon:"🏛️", name:"Directorates",  units:"TVET, Quality Assurance, Research, Planning, Corporate Affairs" },
                  { icon:"🔧", name:"Support Units",  units:"Library, Medical, Administrative Staff, Academic & Student Affairs…" },
                  { icon:"🌾", name:"Farm Dept",      units:"Farm Operations, Farm Management" },
                ].map((u) => (
                  <div className="vb-na-card" key={u.name}>
                    <div className="vb-na-icon">{u.icon}</div>
                    <div className="vb-na-n">{u.name}</div>
                    <div className="vb-na-u">{u.units}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              {[
                { code:"SAT", name:"School of Science & Applied Technology",   depts:"BBS · CHB · MTH · Computing & Informatics · EAS" },
                { code:"EDU", name:"School of Education",                       depts:"Curriculum & Education Management · Agricultural Education" },
                { code:"HDS", name:"School of Humanities & Development Studies",depts:"Literacy & Communication Studies · Social Studies" },
                { code:"SBE", name:"School of Business & Economics",            depts:"Logistics & Business" },
              ].map((s) => (
                <div className="vb-school-row vb-r" key={s.code}>
                  <span className="vb-scode">{s.code}</span>
                  <div className="vb-sinfo">
                    <div className="vb-sname">{s.name}</div>
                    <div className="vb-sdepts">{s.depts}</div>
                  </div>
                  <span className="vb-sarrow">→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO ── */}
      <section id="demo" className="vb-section vb-demo-sec">
        <div className="vb-inner">
          <span className="vb-sec-tag vb-r">/ 05 — Demo Accounts</span>
          <h2 className="vb-sec-h vb-r">Try it right now.</h2>
          <p className="vb-sec-p vb-r">Use any of these seed accounts to explore VoiceBox from every perspective.</p>
          <div className="vb-cred-grid">
            {[
              { dot:"#C4700A", role:"School Admin", name:"Dr. Grace Mwenda",   email:"g.mwenda@laikipia.ac.ke",            pass:"sadmin123",  note:"School of SAT" },
              { dot:"#7C3AED", role:"Dept Admin",   name:"Dr. Samuel Kariuki", email:"s.kariuki@laikipia.ac.ke",           pass:"dadmin123",  note:"Computing & Informatics" },
              { dot:"#2563EB", role:"Staff",         name:"Dr. Peter Omondi",  email:"p.omondi@laikipia.ac.ke",            pass:"staff123",   note:"Mathematics · SAT" },
              { dot:"#16A34A", role:"Student",       name:"Jane Mwangi",       email:"j.mwangi@students.laikipia.ac.ke",   pass:"student123", note:"CIN · SAT" },
            ].map((c) => (
              <div className="vb-cred-card vb-r" key={c.email}>
                <div className="vb-cred-role">
                  <div className="vb-cdot" style={{ background: c.dot }} />
                  {c.role}
                </div>
                <div className="vb-cred-name">{c.name}</div>
                <div className="vb-cred-d">{c.email}</div>
                <div className="vb-cred-d">{c.pass}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>{c.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="vb-footer">
        <div className="vb-flogo">Voice<span>Box</span></div>
        <div className="vb-fcopy">Built for Laikipia University · v5.0</div>
        <div className="vb-fcopy">© 2026 Laikipia University. All rights reserved.</div>
      </footer>

    </div>
  );
}