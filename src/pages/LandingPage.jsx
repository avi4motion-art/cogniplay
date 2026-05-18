import { useState, useEffect } from "react";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Heebo:wght@400;500;600;700;800;900&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
:root{
  --sun:#FF9F43;--green:#1DD1A1;--sky:#54A0FF;--coral:#FF6B6B;
  --bg:#FFFBF5;--dark:#2D2A26;--muted:#8B7E74;
}
html{scroll-behavior:smooth}
body{background:var(--bg);font-family:'Heebo',sans-serif;color:var(--dark);direction:rtl}

/* NAV */
nav{position:sticky;top:0;z-index:100;background:rgba(255,251,245,0.92);backdrop-filter:blur(12px);border-bottom:2px solid #F0E4D8;padding:0 24px}
.nav-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:68px}
.nav-logo{font-family:'Fredoka',sans-serif;font-size:28px;font-weight:700;color:var(--dark)}
.nav-logo span{color:var(--sun)}
.nav-links{display:flex;gap:32px;list-style:none}
.nav-links a{text-decoration:none;color:var(--muted);font-weight:600;font-size:16px;transition:color .2s}
.nav-links a:hover{color:var(--sun)}
.nav-cta{background:var(--sun);color:white;border:none;border-radius:14px;padding:12px 24px;font-family:'Fredoka',sans-serif;font-size:18px;font-weight:600;cursor:pointer;box-shadow:0 4px 0 #D4820A;transition:transform .15s}
.nav-cta:active{transform:translateY(2px)}

/* HERO */
.hero{max-width:1100px;margin:0 auto;padding:80px 24px 60px;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:#FFF0DC;border:2px solid #FFD49A;border-radius:50px;padding:8px 18px;font-size:14px;font-weight:700;color:#A0670A;margin-bottom:24px}
.hero-badge-dot{width:8px;height:8px;background:var(--sun);border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.4)}}
.hero h1{font-family:'Fredoka',sans-serif;font-size:58px;font-weight:700;line-height:1.1;margin-bottom:20px;color:var(--dark)}
.hero h1 .highlight{color:var(--sun)}
.hero p{font-size:20px;color:var(--muted);line-height:1.7;margin-bottom:32px;font-weight:500}
.hero-btns{display:flex;gap:14px;flex-wrap:wrap}
.btn-primary{background:var(--sun);color:white;border:none;border-radius:16px;padding:18px 32px;font-family:'Fredoka',sans-serif;font-size:22px;font-weight:600;cursor:pointer;box-shadow:0 5px 0 #D4820A;transition:transform .15s,box-shadow .15s;text-decoration:none;display:inline-block}
.btn-primary:active,.btn-primary:hover{transform:translateY(2px);box-shadow:0 3px 0 #D4820A}
.btn-secondary{background:white;color:var(--dark);border:2.5px solid #E8E0D8;border-radius:16px;padding:18px 32px;font-family:'Fredoka',sans-serif;font-size:22px;font-weight:600;cursor:pointer;box-shadow:0 5px 0 #D5C9BF;transition:transform .15s;text-decoration:none;display:inline-block}
.btn-secondary:hover{transform:translateY(2px);box-shadow:0 3px 0 #D5C9BF}

/* HERO VISUAL */
.hero-visual{position:relative}
.phone-frame{background:white;border-radius:40px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.12),0 0 0 3px #F0E4D8;max-width:300px;margin:0 auto}
.phone-screen{background:var(--bg);border-radius:28px;overflow:hidden}
.phone-header{background:linear-gradient(135deg,var(--sun),var(--coral));padding:20px;text-align:center;color:white}
.phone-header h3{font-family:'Fredoka',sans-serif;font-size:22px;font-weight:700}
.phone-header p{font-size:13px;opacity:.85;font-weight:600;margin-top:4px}
.phone-games{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px}
.phone-game{background:white;border-radius:16px;padding:14px 10px;text-align:center;border:2px solid #F0E4D8}
.phone-game .icon{font-size:28px;display:block;margin-bottom:6px}
.phone-game .label{font-family:'Fredoka',sans-serif;font-size:14px;font-weight:600;color:var(--dark)}
.floating-badge{position:absolute;background:white;border-radius:16px;padding:10px 16px;box-shadow:0 8px 32px rgba(0,0,0,.12);border:2px solid #F0E4D8;font-weight:700;font-size:14px;animation:floatAnim 3s ease-in-out infinite}
.fb-1{top:-20px;left:-30px;animation-delay:0s}
.fb-2{bottom:40px;left:-40px;animation-delay:1s}
.fb-3{top:40px;right:-30px;animation-delay:1.5s}
@keyframes floatAnim{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}

/* STATS STRIP */
.stats-strip{background:white;border-top:2px solid #F0E4D8;border-bottom:2px solid #F0E4D8;padding:32px 24px}
.stats-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}
.stat-num{font-family:'Fredoka',sans-serif;font-size:42px;font-weight:700;color:var(--sun)}
.stat-label{font-size:15px;color:var(--muted);font-weight:600;margin-top:4px}

/* HOW */
.section{max-width:1100px;margin:0 auto;padding:80px 24px}
.section-tag{display:inline-block;background:#E8F7FF;color:#1464B4;border-radius:50px;padding:6px 16px;font-size:14px;font-weight:700;margin-bottom:16px}
.section h2{font-family:'Fredoka',sans-serif;font-size:42px;font-weight:700;margin-bottom:12px;line-height:1.2}
.section-sub{font-size:18px;color:var(--muted);font-weight:500;margin-bottom:48px;max-width:560px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:32px}
.step{text-align:center;padding:32px 24px;background:white;border-radius:28px;border:2.5px solid #F0E4D8;transition:transform .2s,box-shadow .2s}
.step:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.08)}
.step-num{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Fredoka',sans-serif;font-size:24px;font-weight:700;color:white;margin:0 auto 16px}
.step-icon{font-size:48px;display:block;margin-bottom:14px}
.step h3{font-family:'Fredoka',sans-serif;font-size:22px;font-weight:600;margin-bottom:10px}
.step p{color:var(--muted);font-size:16px;line-height:1.6;font-weight:500}

/* GAMES GRID */
.games-bg{background:white;border-top:2px solid #F0E4D8;border-bottom:2px solid #F0E4D8;padding:80px 24px}
.games-inner{max-width:1100px;margin:0 auto}
.games-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-top:48px}
.game-tile{background:var(--bg);border-radius:22px;padding:20px 14px;text-align:center;border:2.5px solid #F0E4D8;transition:transform .2s,border-color .2s}
.game-tile:hover{transform:translateY(-4px);border-color:var(--sun)}
.game-tile .g-icon{font-size:36px;display:block;margin-bottom:10px}
.game-tile .g-name{font-family:'Fredoka',sans-serif;font-size:16px;font-weight:600;color:var(--dark)}
.game-tile .g-desc{font-size:12px;color:var(--muted);margin-top:4px;font-weight:600}

/* RESEARCH TEASER */
.research-section{max-width:1100px;margin:0 auto;padding:80px 24px}
.research-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:48px}
.r-card{border-radius:24px;padding:28px;border:2.5px solid #F0E4D8;background:white;transition:transform .2s}
.r-card:hover{transform:translateY(-4px)}
.r-tag{font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;opacity:.8}
.r-percent{font-family:'Fredoka',sans-serif;font-size:56px;font-weight:700;line-height:1;margin-bottom:8px}
.r-title{font-size:16px;font-weight:700;color:var(--dark);margin-bottom:8px}
.r-source{font-size:13px;color:var(--muted);font-weight:600}
.r-card-sun{border-color:#FFD49A}
.r-card-green{border-color:#6BE8C4}
.r-card-sky{border-color:#90CAF9}

/* FAMILY */
.family-section{background:linear-gradient(135deg,#FFF3E0,#FFE8D8);border-top:2px solid #FFD49A;border-bottom:2px solid #FFD49A;padding:80px 24px}
.family-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.family-features{display:flex;flex-direction:column;gap:20px;margin-top:32px}
.f-feat{display:flex;gap:16px;align-items:flex-start}
.f-feat-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.f-feat-text h4{font-family:'Fredoka',sans-serif;font-size:18px;font-weight:600;margin-bottom:4px}
.f-feat-text p{font-size:15px;color:var(--muted);font-weight:500;line-height:1.5}
.report-preview{background:white;border-radius:24px;padding:24px;border:2.5px solid #FFD49A;box-shadow:0 12px 40px rgba(255,159,67,.15)}
.rep-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #F0E4D8}
.rep-logo{font-family:'Fredoka',sans-serif;font-size:20px;font-weight:700;color:var(--dark)}
.rep-logo span{color:var(--sun)}
.rep-date{font-size:13px;color:var(--muted);font-weight:600}
.rep-stat{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F0E4D8}
.rep-stat:last-child{border-bottom:none}
.rep-stat-label{font-size:14px;font-weight:600;color:var(--dark)}
.rep-bar-wrap{display:flex;align-items:center;gap:10px}
.rep-bar{height:8px;border-radius:4px;background:var(--sun)}
.rep-val{font-family:'Fredoka',sans-serif;font-size:16px;font-weight:700;color:var(--sun)}

/* TESTIMONIALS */
.test-section{max-width:1100px;margin:0 auto;padding:80px 24px}
.test-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:48px}
.test-card{background:white;border-radius:24px;padding:28px;border:2.5px solid #F0E4D8}
.test-stars{font-size:18px;margin-bottom:12px}
.test-text{font-size:16px;color:var(--dark);line-height:1.7;font-weight:500;margin-bottom:20px}
.test-author{display:flex;align-items:center;gap:12px}
.test-avatar{width:44px;height:44px;border-radius:50%;font-size:22px;display:flex;align-items:center;justify-content:center;background:#FFF0DC}
.test-name{font-weight:700;font-size:15px;color:var(--dark)}
.test-role{font-size:13px;color:var(--muted);font-weight:600}

/* CTA */
.cta-section{padding:80px 24px}
.cta-box{max-width:700px;margin:0 auto;text-align:center;background:linear-gradient(135deg,var(--sun),var(--coral));border-radius:36px;padding:60px 48px;color:white}
.cta-box h2{font-family:'Fredoka',sans-serif;font-size:46px;font-weight:700;margin-bottom:16px}
.cta-box p{font-size:20px;opacity:.9;margin-bottom:36px;line-height:1.6;font-weight:500}
.btn-white{background:white;color:var(--sun);border:none;border-radius:16px;padding:18px 36px;font-family:'Fredoka',sans-serif;font-size:24px;font-weight:700;cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.15);transition:transform .15s;display:inline-block;text-decoration:none}
.btn-white:hover{transform:translateY(2px)}
.cta-note{font-size:15px;opacity:.75;margin-top:16px;font-weight:600}

/* FOOTER */
footer{background:var(--dark);color:rgba(255,255,255,.6);padding:40px 24px;text-align:center}
.footer-logo{font-family:'Fredoka',sans-serif;font-size:24px;font-weight:700;color:white;margin-bottom:12px}
.footer-logo span{color:var(--sun)}
.footer-links{display:flex;gap:24px;justify-content:center;margin:20px 0;flex-wrap:wrap}
.footer-links a{color:rgba(255,255,255,.6);text-decoration:none;font-size:14px;font-weight:600;transition:color .2s}
.footer-links a:hover{color:white}
.footer-legal{font-size:13px;color:rgba(255,255,255,.4);margin-top:16px;line-height:1.6}

/* DISCLAIMER */
.disclaimer{background:#FFF8E1;border:2px solid #FFD54F;border-radius:16px;padding:16px 24px;max-width:800px;margin:0 auto 32px;text-align:center;font-size:14px;color:#795548;font-weight:600;line-height:1.6}

@media(max-width:768px){
  .hero{grid-template-columns:1fr;padding:40px 16px}
  .hero h1{font-size:38px}
  .hero-visual{display:none}
  .stats-inner{grid-template-columns:1fr 1fr}
  .steps{grid-template-columns:1fr}
  .games-grid{grid-template-columns:repeat(2,1fr)}
  .research-cards{grid-template-columns:1fr}
  .family-inner{grid-template-columns:1fr}
  .test-grid{grid-template-columns:1fr}
  .nav-links{display:none}
}
`;

const games = [
  { icon: "🔍", name: "מה השתנה?", desc: "תצפית חדה" },
  { icon: "🎵", name: "שירים ישנים", desc: "זיכרון מוזיקלי" },
  { icon: "🧩", name: "זיכרון", desc: "מצא זוגות" },
  { icon: "🔢", name: "מספרים", desc: "חשיבה כמותית" },
  { icon: "🏠", name: "חדרים", desc: "זיכרון מרחבי" },
  { icon: "🌍", name: "שאלות ידע", desc: "ידע כללי" },
  { icon: "🔤", name: "סדר", desc: "מיון וסיווג" },
  { icon: "⚡", name: "מהירות", desc: "עיבוד מהיר" },
  { icon: "🎶", name: "קצב", desc: "תזמון ומוזיקה" },
  { icon: "🤖", name: "CogniBot", desc: "שיחה חכמה" },
];

const researchData = [
  {
    tag: "מחקר ACTIVE",
    percent: "29%",
    title: "ירידה בסיכון לדמנציה",
    source: "New England Journal of Medicine",
    className: "r-card-sun",
    color: "var(--sun)",
  },
  {
    tag: "Cochrane CST",
    percent: "+2",
    title: "נקודות MMSE (בדיקת קוגניציה)",
    source: "Cochrane Database of Systematic Reviews",
    className: "r-card-green",
    color: "var(--green)",
  },
  {
    tag: "The Lancet",
    percent: "60%",
    title: "עלייה בסיכון מבדידות חברתית",
    source: "The Lancet Commission on Dementia",
    className: "r-card-sky",
    color: "var(--sky)",
  },
];

const testimonials = [];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{css}</style>

      {/* NAV */}
      <nav style={{ boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,.08)" : "none" }}>
        <div className="nav-inner">
          <div className="nav-logo">Cogni<span>Play</span></div>
          <ul className="nav-links">
            <li><a href="#how">איך זה עובד</a></li>
            <li><a href="#games">משחקים</a></li>
            <li><a href="#research">מחקר</a></li>
            <li><a href="#family">למשפחה</a></li>
          </ul>
          <button className="nav-cta" onClick={() => window.location.href="#cta"}>
            התחל בחינם
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div>
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            מבוסס על מחקרים קליניים מובילים
          </div>
          <h1>
            שמור על המוח <span className="highlight">חד ושמח</span> כל יום
          </h1>
          <p>
            10 משחקים קוגניטיביים מגוונים, בעברית, בכפתורים גדולים — מיועד לגיל השלישי.
            משפחה מחוברת, סיכום התקדמות, ו-CogniBot שמלווה אותך.
          </p>
          <div className="hero-btns">
            <a href="#cta" className="btn-primary">▶  התחל עכשיו — בחינם</a>
            <a href="#research" className="btn-secondary">ראה את המחקרים</a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-badge fb-1">🎉 היום: 3/5 משחקים!</div>
          <div className="floating-badge fb-2">🔥 7 ימים ברצף</div>
          <div className="floating-badge fb-3">⭐ 340 נקודות</div>
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-header">
                <h3>CogniPlay 🧠</h3>
                <p>שלום שרה! מוכנה לאתגר?</p>
              </div>
              <div className="phone-games">
                {[["🔍","מה השתנה?"],["🎵","שירים"],["🧩","זיכרון"],["🔢","מספרים"]].map(([icon,name]) => (
                  <div key={name} className="phone-game">
                    <span className="icon">{icon}</span>
                    <div className="label">{name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="stats-strip">
        <div className="stats-inner">
          {[["חדש! 🚀","אפליקציה חדשה"],["10","משחקים מגוונים"],["29%*","ירידה בסיכון — מחקר ACTIVE"],["חינם","ללא כרטיס אשראי"]].map(([num, label]) => (
            <div key={label}>
              <div className="stat-num">{num}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" className="section">
        <div className="section-tag">איך זה עובד</div>
        <h2>3 דקות ביום — טוב למוח</h2>
        <p className="section-sub">לא צריך ידע טכנולוגי. רק לחיצות גדולות ופשוטות.</p>
        <div className="steps">
          {[
            { num: 1, color: "var(--sun)", icon: "👤", title: "יוצרים פרופיל", text: "מגדירים שם, שפה, ורמת קושי. לוקח 2 דקות." },
            { num: 2, color: "var(--green)", icon: "🎮", title: "משחקים כל יום", text: "אתגר יומי + משחקים חופשיים. 10 דקות מספיקות." },
            { num: 3, color: "var(--sky)", icon: "📊", title: "מעקב והתקדמות", text: "המשפחה רואה התקדמות ויכולה לשתף עם הרופא המטפל." },
          ].map(({ num, color, icon, title, text }) => (
            <div key={num} className="step">
              <div className="step-num" style={{ background: color }}>{num}</div>
              <span className="step-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* GAMES */}
      <div id="games" className="games-bg">
        <div className="games-inner">
          <div className="section-tag">המשחקים</div>
          <h2>10 משחקים לכל אזור במוח</h2>
          <p className="section-sub" style={{ marginBottom: 0 }}>
            זיכרון, שפה, תשומת לב, מוזיקה, קצב, ידע כללי — כיסוי מלא.
          </p>
          <div className="games-grid">
            {games.map(({ icon, name, desc }) => (
              <div key={name} className="game-tile">
                <span className="g-icon">{icon}</span>
                <div className="g-name">{name}</div>
                <div className="g-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RESEARCH */}
      <div id="research" className="research-section">
        <div className="section-tag">מבוסס מחקר</div>
        <h2>הבסיס המדעי</h2>
        <p className="section-sub">
          CogniPlay מבוסס על מחקרים עצמאיים peer-reviewed בכתבי העת המובילים בעולם.
        </p>
        <div className="disclaimer">
          ⚕️ CogniPlay היא אפליקציית Wellness לתמיכה בפעילות קוגניטיבית, ולא מכשיר רפואי.
          אינה מחליפה אבחנה, טיפול, או ייעוץ של רופא.
        </div>
        <div className="research-cards">
          {researchData.map(({ tag, percent, title, source, className, color }) => (
            <div key={tag} className={`r-card ${className}`}>
              <div className="r-tag" style={{ color }}>{tag}</div>
              <div className="r-percent" style={{ color }}>{percent}</div>
              <div className="r-title">{title}</div>
              <div className="r-source">{source}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a href="/research" className="btn-secondary" style={{ display: "inline-block" }}>
            קרא את כל המחקרים →
          </a>
        </div>
      </div>

      {/* FAMILY REPORT */}
      <div id="family" className="family-section">
        <div className="family-inner">
          <div>
            <div className="section-tag">למשפחה ולרופא</div>
            <h2>כולם מחוברים, כולם רגועים</h2>
            <div className="family-features">
              {[
                { icon: "📊", bg: "#FFF0DC", title: "דוח חודשי לרופא", text: "PDF מקצועי עם גרפים, ציונים, ומגמות — ניתן לשלוח ישירות לרופא." },
                { icon: "👨‍👩‍👧", bg: "#E0FFF6", title: "חיבור משפחתי", text: "בני משפחה יכולים לראות התקדמות ולשלוח עידוד." },
                { icon: "🤖", bg: "#E3F2FD", title: "CogniBot", text: "צ׳אטבוט חברותי שמשוחח, מספר, ומלווה — מונע בדידות." },
              ].map(({ icon, bg, title, text }) => (
                <div key={title} className="f-feat">
                  <div className="f-feat-icon" style={{ background: bg }}>{icon}</div>
                  <div className="f-feat-text">
                    <h4>{title}</h4>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="report-preview">
            <div className="rep-header">
              <div className="rep-logo">Cogni<span>Play</span></div>
              <div className="rep-date">מאי 2025</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--dark)", marginBottom: 14 }}>
              דוח חודשי — שרה לוי
            </div>
            {[
              { label: "ימי פעילות", val: "24/30", width: 80 },
              { label: "ממוצע ציון", val: "78%", width: 78 },
              { label: "שיפור מהחודש הקודם", val: "+12%", width: 62 },
              { label: "משחק מועדף", val: "שירים 🎵", width: null },
            ].map(({ label, val, width }) => (
              <div key={label} className="rep-stat">
                <span className="rep-stat-label">{label}</span>
                <div className="rep-bar-wrap">
                  {width && <div className="rep-bar" style={{ width: width + "px" }}></div>}
                  <span className="rep-val">{val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TESTIMONIALS — יתווספו ביקורות אמיתיות בקרוב */}
      <div className="test-section">
        <div className="section-tag">מה אומרים</div>
        <h2>היה הראשון לשתף! 🌟</h2>
        <p style={{color:"var(--muted)",fontSize:18,fontWeight:600,marginTop:12,marginBottom:40,textAlign:"center"}}>
          CogniPlay חדשה ורעננה — ועדיין מחכה לביקורת הראשונה שלך.<br/>
          נשמח לשמוע מה חשבת!
        </p>
        <div style={{textAlign:"center"}}>
          <a href="mailto:hello@cogniplay.co.il?subject=הביקורת שלי על CogniPlay" className="btn-secondary" style={{display:"inline-block"}}>
            ✉️ שלח לנו את החוויה שלך
          </a>
        </div>
      </div>

      {/* CTA */}
      <div id="cta" className="cta-section">
        <div className="cta-box">
          <h2>מתחילים היום 🧠</h2>
          <p>חינם לחלוטין. ללא כרטיס אשראי. מוכן תוך 2 דקות.</p>
          <a href="/app" className="btn-white">▶  התחל לשחק עכשיו</a>
          <p className="cta-note">גרסת אינטרנט · iOS · Android · ללא הורדה חובה</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">Cogni<span>Play</span></div>
        <p style={{ fontSize: 14, marginBottom: 4 }}>אימון קוגניטיבי לגיל השלישי</p>
        <div className="footer-links">
          <a href="/research">מחקרים</a>
          <a href="/terms">תנאי שימוש</a>
          <a href="/privacy">פרטיות</a>
          <a href="/contact">צור קשר</a>
        </div>
        <div className="footer-legal">
          CogniPlay היא אפליקציית wellness ואינה מכשיר רפואי (Medical Device). אינה מאבחנת, מטפלת, או מבטיחה תוצאה רפואית כלשהי.<br/>
          * נתון 29% מתייחס למחקר ACTIVE (Willis et al., NEJM 2017) על אימון מהירות עיבוד — לא נבדק על CogniPlay ספציפית.<br/>
          © 2025 CogniPlay
        </div>
      </footer>
    </>
  );
}
