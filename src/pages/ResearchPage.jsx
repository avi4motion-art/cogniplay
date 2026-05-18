import { useState } from "react";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Heebo:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--sun:#FF9F43;--green:#1DD1A1;--sky:#54A0FF;--coral:#FF6B6B;--bg:#FFFBF5;--dark:#2D2A26;--muted:#8B7E74}
body{background:var(--bg);font-family:'Heebo',sans-serif;color:var(--dark);direction:rtl}

nav{background:rgba(255,251,245,.95);backdrop-filter:blur(12px);border-bottom:2px solid #F0E4D8;padding:0 24px;position:sticky;top:0;z-index:100}
.nav-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:68px}
.nav-logo{font-family:'Fredoka',sans-serif;font-size:28px;font-weight:700;color:var(--dark);text-decoration:none}
.nav-logo span{color:var(--sun)}
.back-link{display:flex;align-items:center;gap:8px;color:var(--muted);text-decoration:none;font-weight:600;font-size:16px}

.hero-research{background:linear-gradient(135deg,#1A1A2E,#2D2A5E);padding:80px 24px;text-align:center;color:white}
.hero-research h1{font-family:'Fredoka',sans-serif;font-size:50px;font-weight:700;margin-bottom:16px}
.hero-research p{font-size:20px;opacity:.8;max-width:600px;margin:0 auto 32px;line-height:1.6;font-weight:500}
.star-tag{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:50px;padding:8px 20px;font-size:14px;font-weight:700;margin-bottom:24px;backdrop-filter:blur(8px)}

.disclaimer-box{background:#FFF8E1;border:2.5px solid #FFD54F;border-radius:20px;padding:20px 28px;max-width:860px;margin:40px auto;text-align:center;font-size:15px;color:#795548;font-weight:600;line-height:1.7}

.content{max-width:900px;margin:0 auto;padding:60px 24px}

.filter-tabs{display:flex;gap:10px;margin-bottom:40px;flex-wrap:wrap}
.tab{background:white;border:2px solid #E8E0D8;border-radius:50px;padding:10px 20px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Heebo',sans-serif;transition:all .2s;color:var(--dark)}
.tab.active{background:var(--sun);border-color:var(--sun);color:white}

.study-card{background:white;border-radius:28px;border:2.5px solid #F0E4D8;overflow:hidden;margin-bottom:24px;transition:transform .2s,box-shadow .2s}
.study-card:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.08)}
.study-header{padding:28px 32px 20px;display:flex;gap:24px;align-items:flex-start}
.study-badge{min-width:80px;height:80px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-family:'Fredoka',sans-serif;font-size:28px;font-weight:700;color:white;flex-shrink:0}
.study-meta{flex:1}
.study-type{font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}
.study-title{font-family:'Fredoka',sans-serif;font-size:22px;font-weight:600;color:var(--dark);margin-bottom:8px;line-height:1.3}
.study-journal{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--muted)}
.study-body{padding:0 32px 28px;border-top:2px solid #F0E4D8;margin-top:4px}
.study-body p{font-size:16px;color:var(--dark);line-height:1.75;font-weight:500;margin:20px 0}
.study-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}
.s-stat{background:var(--bg);border-radius:16px;padding:16px;text-align:center;border:2px solid #F0E4D8}
.s-stat-num{font-family:'Fredoka',sans-serif;font-size:28px;font-weight:700}
.s-stat-label{font-size:12px;font-weight:600;color:var(--muted);margin-top:4px}
.study-link{display:inline-flex;align-items:center;gap:6px;color:var(--sky);font-weight:700;font-size:14px;text-decoration:none;margin-top:8px}
.study-link:hover{text-decoration:underline}

.relevance-box{background:#F0FFF8;border:2px solid #6BE8C4;border-radius:16px;padding:16px 20px;margin-top:16px}
.rel-title{font-size:13px;font-weight:700;color:#0A6B4F;margin-bottom:6px}
.rel-text{font-size:14px;color:#1a5245;font-weight:500;line-height:1.6}

.section-divider{text-align:center;padding:48px 0;border-top:2px solid #F0E4D8;margin-top:16px}
.section-divider h2{font-family:'Fredoka',sans-serif;font-size:32px;font-weight:700;margin-bottom:8px}
.section-divider p{font-size:16px;color:var(--muted);font-weight:500;max-width:500px;margin:0 auto}

.cta-strip{background:linear-gradient(135deg,var(--sun),var(--coral));border-radius:28px;padding:48px;text-align:center;color:white;margin:48px 0}
.cta-strip h2{font-family:'Fredoka',sans-serif;font-size:36px;font-weight:700;margin-bottom:12px}
.cta-strip p{font-size:18px;opacity:.9;margin-bottom:28px;font-weight:500}
.btn-white{background:white;color:var(--sun);border:none;border-radius:16px;padding:16px 32px;font-family:'Fredoka',sans-serif;font-size:22px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block}

footer{background:var(--dark);color:rgba(255,255,255,.5);padding:32px 24px;text-align:center;font-size:13px;font-weight:600}
footer a{color:rgba(255,255,255,.5);text-decoration:none;margin:0 12px}
footer a:hover{color:white}

@media(max-width:768px){
  .hero-research h1{font-size:34px}
  .study-stats{grid-template-columns:1fr}
  .study-header{flex-direction:column}
  .content{padding:40px 16px}
}
`;

const studies = [
  {
    id: 1,
    category: "זיכרון",
    badge: "29%",
    badgeColor: "#FF9F43",
    type: "מחקר אקראי מבוקר (RCT)",
    title: "מחקר ACTIVE — Cognitive Training Reduces Dementia Risk",
    journal: "New England Journal of Medicine · 2017",
    summary: `מחקר ACTIVE (Advanced Cognitive Training for Independent and Vital Elderly) עקב אחרי 2,832 מבוגרים במשך 10 שנים. המשתתפים בקבוצת האימון הקוגניטיבי הראו ירידה של 29% בסיכון לדמנציה קלינית לעומת קבוצת הביקורת. זהו אחד המחקרים הגדולים והארוכים שנעשו בתחום.`,
    stats: [
      { num: "2,832", label: "משתתפים" },
      { num: "10 שנים", label: "מעקב" },
      { num: "29%", label: "ירידה בסיכון" },
    ],
    relevance: "CogniPlay מיישמת עקרונות ממחקר ACTIVE: תרגול קוגניטיבי מגוון, עקביות יומית, ומשוב מיידי.",
    link: "https://www.nejm.org/doi/full/10.1056/NEJMoa1715472",
  },
  {
    id: 2,
    category: "קוגניציה",
    badge: "+2",
    badgeColor: "#1DD1A1",
    type: "סקירה שיטתית — Cochrane",
    title: "Cognitive Stimulation Therapy (CST) — Cochrane Review",
    journal: "Cochrane Database of Systematic Reviews · 2023",
    summary: `סקירה שיטתית של 33 מחקרים הבוחנים Cognitive Stimulation Therapy — גישה מבוססת ראיות לשמירה על תפקוד קוגניטיבי. הסקירה מצאה שיפור ממוצע של 2 נקודות בסולם MMSE (Mini Mental State Examination) בקרב משתתפי תכניות CST, לעומת ביקורת. שיפור זה נחשב משמעותי קלינית.`,
    stats: [
      { num: "33", label: "מחקרים" },
      { num: "+2", label: "נקודות MMSE" },
      { num: "CST", label: "שיטה מוכחת" },
    ],
    relevance: "משחקי CogniPlay בנויים על עקרונות CST: עיסוק בנושאים מוכרים, עבודה בקבוצות זיכרון, ותגמול חיובי.",
    link: "https://www.cochranelibrary.com",
  },
  {
    id: 3,
    category: "חברתי",
    badge: "60%",
    badgeColor: "#54A0FF",
    type: "דוח ועדת מומחים",
    title: "בדידות כגורם סיכון לדמנציה — Lancet Commission",
    journal: "The Lancet · 2020",
    summary: `ועדת Lancet בנושא מניעת דמנציה זיהתה 12 גורמי סיכון הניתנים לשינוי, ביניהם בדידות חברתית. המחקר מצא כי בדידות חברתית מעלה את הסיכון לדמנציה ב-60%. חיזוק הקשרים החברתיים הוצג כאחת ההמלצות המרכזיות למניעה.`,
    stats: [
      { num: "12", label: "גורמי סיכון" },
      { num: "60%", label: "עלייה בסיכון מבדידות" },
      { num: "#1", label: "מדיניות מניעה" },
    ],
    relevance: "CogniBot, שיתוף המשפחה, ואתגרים משותפים ב-CogniPlay — כולם מיועדים להפחית בדידות ולחזק קשרים חברתיים.",
    link: "https://www.thelancet.com/commissions/dementia2020",
  },
  {
    id: 4,
    category: "מוזיקה",
    badge: "🎵",
    badgeColor: "#FF6B6B",
    type: "מטא-אנליזה של מחקרים אקראיים",
    title: "Music-Based Interventions and Cognitive Function in Older Adults",
    journal: "Frontiers in Aging Neuroscience · 2024 (9 RCTs, N=625)",
    summary: `מטא-אנליזה שבחנה 9 מחקרים אקראיים מבוקרים (625 משתתפים) מצאה כי התערבויות מוזיקליות שיפרו באופן משמעותי קוגניציה כללית, זיכרון ותפקוד ביצועי בהשוואה לקבוצות ביקורת. ההשפעה על זיכרון הייתה בעלת גודל אפקט של SMD=0.36. המחקר ממליץ על מחקרים נוספים עם מדגמים גדולים יותר.`,
    stats: [
      { num: "9", label: "מחקרים אקראיים" },
      { num: "625", label: "משתתפים" },
      { num: "↑ זיכרון", label: "SMD=0.36" },
    ],
    relevance: "משחק ׳שירים ישנים׳ ב-CogniPlay מבוסס על גישה זו — השלמת מילים לשירים ישראליים מוכרים מפעילה זיכרון ואיזורי מוח מרובים.",
    link: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12669183/",
  },
];

const CATEGORIES = ["הכל", "זיכרון", "קוגניציה", "חברתי", "מוזיקה"];

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState("הכל");
  const [expanded, setExpanded] = useState({});

  const filtered = activeTab === "הכל" ? studies : studies.filter(s => s.category === activeTab);

  return (
    <>
      <style>{css}</style>

      <nav>
        <div className="nav-inner">
          <a href="/" className="nav-logo">Cogni<span>Play</span></a>
          <a href="/" className="back-link">← חזרה לדף הבית</a>
        </div>
      </nav>

      <div className="hero-research">
        <div className="star-tag">🔬 מבוסס מחקר מדעי</div>
        <h1>הבסיס המדעי של CogniPlay</h1>
        <p>
          CogniPlay מושפעת ממחקרים peer-reviewed מובילים בתחום
          האימון הקוגניטיבי. הנה המחקרים שהנחו אותנו.
        </p>
      </div>

      <div style={{ background: "var(--bg)", padding: "0 24px" }}>
        <div className="disclaimer-box">
          ⚕️ <strong>הצהרה חשובה:</strong> CogniPlay היא אפליקציית Wellness — כלי לתמיכה בפעילות קוגניטיבית בחיי היומיום.
          היא אינה מכשיר רפואי, אינה מאבחנת מחלה, ואינה מחליפה טיפול רפואי.
          המחקרים המוצגים כאן הם מחקרים עצמאיים — CogniPlay אינה טוענת ליישם אותם באופן מלא.
          פנה לרופא לקבלת ייעוץ רפואי.
        </div>
      </div>

      <div className="content">
        <div className="filter-tabs">
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`tab ${activeTab === c ? "active" : ""}`}
              onClick={() => setActiveTab(c)}
            >{c}</button>
          ))}
        </div>

        {filtered.map(study => (
          <div key={study.id} className="study-card">
            <div className="study-header">
              <div className="study-badge" style={{ background: study.badgeColor }}>
                {study.badge}
              </div>
              <div className="study-meta">
                <div className="study-type" style={{ color: study.badgeColor }}>{study.type}</div>
                <div className="study-title">{study.title}</div>
                <div className="study-journal">📰 {study.journal}</div>
              </div>
            </div>
            <div className="study-body">
              <div className="study-stats">
                {study.stats.map(({ num, label }) => (
                  <div key={label} className="s-stat">
                    <div className="s-stat-num" style={{ color: study.badgeColor }}>{num}</div>
                    <div className="s-stat-label">{label}</div>
                  </div>
                ))}
              </div>
              <p>{study.summary}</p>
              <div className="relevance-box">
                <div className="rel-title">🔗 הקשר ל-CogniPlay</div>
                <div className="rel-text">{study.relevance}</div>
              </div>
              <br/>
              <a href={study.link} target="_blank" rel="noopener noreferrer" className="study-link">
                🔗 למאמר המקורי (אנגלית) →
              </a>
            </div>
          </div>
        ))}

        <div className="section-divider">
          <h2>יש עוד שאלות על המחקר?</h2>
          <p>CogniBot שמח לענות — שאל אותו ישירות באפליקציה</p>
        </div>

        <div className="cta-strip">
          <h2>רוצה לנסות? 🧠</h2>
          <p>חינם לחלוטין. ללא כרטיס אשראי. תוך 2 דקות.</p>
          <a href="/app" className="btn-white">התחל לשחק →</a>
        </div>
      </div>

      <footer>
        <p style={{ marginBottom: 12, color: "rgba(255,255,255,.7)", fontFamily: "'Fredoka',sans-serif", fontSize: 20, fontWeight: 700 }}>
          Cogni<span style={{ color: "#FF9F43" }}>Play</span>
        </p>
        <a href="/">בית</a>
        <a href="/terms">תנאי שימוש</a>
        <a href="/privacy">פרטיות</a>
        <br/><br/>
        <span>© 2025 CogniPlay · wellness app · לא מכשיר רפואי</span>
      </footer>
    </>
  );
}
