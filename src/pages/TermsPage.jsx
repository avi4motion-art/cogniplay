import { useState } from "react";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Heebo:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--sun:#FF9F43;--green:#1DD1A1;--sky:#54A0FF;--coral:#FF6B6B;--bg:#FFFBF5;--dark:#2D2A26;--muted:#8B7E74}
body{background:var(--bg);font-family:'Heebo',sans-serif;color:var(--dark);direction:rtl}
nav{background:rgba(255,251,245,.95);border-bottom:2px solid #F0E4D8;padding:0 24px;position:sticky;top:0;z-index:100}
.nav-inner{max-width:900px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:68px}
.nav-logo{font-family:'Fredoka',sans-serif;font-size:28px;font-weight:700;color:var(--dark);text-decoration:none}
.nav-logo span{color:var(--sun)}
.back-link{color:var(--muted);text-decoration:none;font-weight:600;font-size:16px}
.hero{background:var(--dark);padding:60px 24px;text-align:center;color:white}
.hero h1{font-family:'Fredoka',sans-serif;font-size:42px;font-weight:700;margin-bottom:10px}
.hero p{font-size:16px;opacity:.65;font-weight:600}
.main{max-width:860px;margin:0 auto;padding:48px 24px}
.toc{background:white;border:2.5px solid #F0E4D8;border-radius:20px;padding:24px 28px;margin-bottom:40px}
.toc h3{font-family:'Fredoka',sans-serif;font-size:18px;font-weight:600;margin-bottom:14px;color:var(--dark)}
.toc ul{list-style:none;display:flex;flex-direction:column;gap:8px}
.toc a{color:var(--sky);font-weight:600;font-size:15px;text-decoration:none}
.toc a:hover{text-decoration:underline}
.section-block{margin-bottom:40px;scroll-margin-top:100px}
.section-block h2{font-family:'Fredoka',sans-serif;font-size:26px;font-weight:700;color:var(--dark);margin-bottom:14px;padding-right:16px;border-right:4px solid var(--sun)}
.section-block p,.section-block li{font-size:16px;line-height:1.8;color:#3D3A36;font-weight:500;margin-bottom:10px}
.section-block ul,.section-block ol{padding-right:20px;margin-bottom:10px}
.highlight-box{background:#FFF8E1;border:2px solid #FFD54F;border-radius:16px;padding:18px 22px;margin:16px 0;font-size:15px;font-weight:600;color:#5D4037;line-height:1.7}
.legal-box{background:#FEF2F2;border:2px solid #FECACA;border-radius:16px;padding:18px 22px;margin:16px 0;font-size:15px;font-weight:600;color:#7F1D1D;line-height:1.7}
.divider{border:none;border-top:2px solid #F0E4D8;margin:32px 0}
footer{background:var(--dark);color:rgba(255,255,255,.5);padding:32px 24px;text-align:center;font-size:13px;font-weight:600}
footer a{color:rgba(255,255,255,.5);text-decoration:none;margin:0 12px}
`;

const sections = [
  {
    id: "wellness",
    title: "1. אופי השירות",
    content: (
      <>
        <div className="highlight-box">
          ⚕️ <strong>CogniPlay היא אפליקציית Wellness בלבד</strong> — כלי לתמיכה בפעילות קוגניטיבית
          בחיי היומיום. היא אינה מכשיר רפואי (Medical Device), אינה מאבחנת מחלה, ואינה מחליפה
          טיפול רפואי, ייעוץ רפואי, אבחנה, פסיכיאטרית, נוירולוגית, או כל ייעוץ מקצועי אחר.
        </div>
        <p>השימוש באפליקציה אינו יוצר יחסי רופא-מטופל. לכל שאלה רפואית, פנה לרופא המטפל שלך.</p>
        <p>CogniPlay אינה מבטיחה ואינה מתחייבת לתוצאה בריאותית כלשהי. המחקרים המצוטטים הם מחקרים עצמאיים שאינם מאשרים ישירות את CogniPlay.</p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "2. זכאות ושימוש",
    content: (
      <>
        <ul>
          <li>השירות מיועד לשימוש אישי, לא מסחרי.</li>
          <li>משתמשים מתחת לגיל 18 זקוקים להסכמת הורה או אפוטרופוס.</li>
          <li>שימוש בשם אחר או מתן מידע כוזב אסור.</li>
          <li>לא ניתן להעביר חשבון לאחר.</li>
        </ul>
      </>
    ),
  },
  {
    id: "data",
    title: "3. פרטיות ונתונים",
    content: (
      <>
        <p>CogniPlay אוספת נתוני שימוש כדי לשפר את השירות ולספק דוחות למשפחה וצוות רפואי מורשה (בהסכמת המשתמש בלבד).</p>
        <ul>
          <li>הנתונים מוצפנים ומאוחסנים בשרתים מאובטחים.</li>
          <li>לא נמכור את מידעך האישי לצד שלישי.</li>
          <li>תוכל לבקש מחיקת נתונים בכל עת בפנייה אלינו.</li>
          <li>דוחות לרופא נשלחים רק בהסכמה מפורשת של המשתמש.</li>
        </ul>
        <p>לפרטים מלאים, ראה את <a href="/privacy" style={{ color: "var(--sky)" }}>מדיניות הפרטיות</a>.</p>
      </>
    ),
  },
  {
    id: "content",
    title: "4. תוכן ואחריות",
    content: (
      <>
        <div className="legal-box">
          ⚠️ השימוש ב-CogniPlay הוא על אחריות המשתמש בלבד. CogniPlay לא תישא באחריות לכל נזק
          ישיר, עקיף, מקרי, או תוצאתי הנובע מהשימוש באפליקציה.
        </div>
        <ul>
          <li>אסור להשתמש בשירות לפעילות בלתי חוקית.</li>
          <li>אסור לנסות לפרוץ, לשנות, או להנדס לאחור את האפליקציה.</li>
          <li>CogniPlay שומרת לעצמה את הזכות לשנות, להשעות, או להפסיק שירות בכל עת.</li>
        </ul>
      </>
    ),
  },
  {
    id: "payment",
    title: "5. תשלום ומנויים",
    content: (
      <>
        <div className="highlight-box">
          💚 CogniPlay חינמית לחלוטין כרגע. אם בעתיד יתווסף מנוי בתשלום, המשתמשים יקבלו הודעה מראש ויוכלו להמשיך להשתמש בגרסה החינמית.
        </div>
        <ul>
          <li>ביטול מנוי ניתן בכל עת ללא קנס, לפחות 24 שעות לפני תחילת תקופת החיוב הבאה.</li>
          <li>החזרים ייבחנו לפי שיקול דעת CogniPlay.</li>
          <li>מחירים עשויים להשתנות עם הודעה מראש של 30 יום.</li>
        </ul>
      </>
    ),
  },
  {
    id: "changes",
    title: "6. שינויים בתנאים",
    content: (
      <>
        <p>CogniPlay רשאית לשנות תנאים אלו. שינויים מהותיים יפורסמו 30 יום מראש. המשך שימוש לאחר השינוי מהווה הסכמה לתנאים החדשים.</p>
      </>
    ),
  },
  {
    id: "law",
    title: "7. שיפוט ודין חל",
    content: (
      <>
        <p>תנאי שימוש אלה כפופים לדיני מדינת ישראל. כל סכסוך יידון בבתי המשפט המוסמכים בתל אביב-יפו.</p>
      </>
    ),
  },
  {
    id: "contact",
    title: "8. יצירת קשר",
    content: (
      <>
        <p>לשאלות, בקשות מחיקת נתונים, או פנייה בנוגע לתנאים:</p>
        <p><strong>דוא״ל:</strong> <a href="mailto:hello@cogniplay.co.il" style={{ color: "var(--sky)" }}>hello@cogniplay.co.il</a></p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <style>{css}</style>
      <nav>
        <div className="nav-inner">
          <a href="/" className="nav-logo">Cogni<span>Play</span></a>
          <a href="/" className="back-link">← חזרה</a>
        </div>
      </nav>

      <div className="hero">
        <h1>תנאי שימוש</h1>
        <p>עודכן לאחרונה: מאי 2026 | בתוקף מ-18 במאי 2026</p>
      </div>

      <div className="main">
        <div className="toc">
          <h3>📋 תוכן עניינים</h3>
          <ul>
            {sections.map(s => (
              <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>
            ))}
          </ul>
        </div>

        <p style={{ fontSize: 16, color: "var(--muted)", marginBottom: 32, fontWeight: 600, lineHeight: 1.7 }}>
          ברוכים הבאים ל-CogniPlay. השימוש באפליקציה מהווה הסכמה לתנאים אלה.
          קרא אותם בקפידה — הם מסבירים מה CogniPlay יכולה ומה לא יכולה לעשות עבורך.
        </p>

        {sections.map((s, i) => (
          <div key={s.id}>
            <div id={s.id} className="section-block">
              <h2>{s.title}</h2>
              {s.content}
            </div>
            {i < sections.length - 1 && <hr className="divider" />}
          </div>
        ))}
      </div>

      <footer>
        <p style={{ marginBottom: 12, color: "rgba(255,255,255,.7)", fontFamily: "'Fredoka',sans-serif", fontSize: 20, fontWeight: 700 }}>
          Cogni<span style={{ color: "#FF9F43" }}>Play</span>
        </p>
        <a href="/">בית</a>
        <a href="/research">מחקרים</a>
        <a href="/privacy">פרטיות</a>
        <br/><br/>
        <span>© 2025 CogniPlay · wellness app · לא מכשיר רפואי</span>
      </footer>
    </>
  );
}
