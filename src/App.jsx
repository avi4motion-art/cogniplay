// CogniPlay v6.1 — expanded all data: 40 animals, 40 trivia, 30 numbers, 50 rooms
import { useState, useEffect, useRef, useCallback } from "react";

// ── Audio — Web Audio API (עובד באפליקציה אמיתית, לא ב-artifact) ─────────────
const _play = (notes) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const go = () => {
      notes.forEach(({freq,delay=0,dur=0.2,type="sine",vol=0.55})=>{
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);
        o.type=type;o.frequency.value=freq;
        const t=ctx.currentTime+delay;
        g.gain.setValueAtTime(vol,t);
        g.gain.exponentialRampToValueAtTime(0.001,t+dur);
        o.start(t);o.stop(t+dur+0.05);
      });
      const total=Math.max(...notes.map(n=>(n.delay||0)+(n.dur||0.2)))+0.2;
      setTimeout(()=>{try{ctx.close();}catch(e){}},total*1000);
    };
    if(ctx.state==="suspended")ctx.resume().then(go);else go();
  } catch(e) {}
};
const playClick   = ()=>_play([{freq:800,dur:.08,vol:.5}]);
const playCorrect = ()=>_play([{freq:523,dur:.18,vol:.6},{freq:659,delay:.16,dur:.18,vol:.6},{freq:784,delay:.32,dur:.18,vol:.6},{freq:1047,delay:.5,dur:.3,vol:.55}]);
const playWrong   = ()=>_play([{freq:300,dur:.18,type:"sawtooth",vol:.5},{freq:220,delay:.2,dur:.25,type:"sawtooth",vol:.45}]);
const playDone    = ()=>_play([{freq:523,dur:.14,vol:.6},{freq:659,delay:.15,dur:.14,vol:.6},{freq:784,delay:.3,dur:.14,vol:.6},{freq:1047,delay:.45,dur:.2,vol:.6},{freq:1319,delay:.66,dur:.4,vol:.55}]);
const playStart   = ()=>_play([{freq:392,dur:.12,vol:.55},{freq:523,delay:.13,dur:.12,vol:.55},{freq:659,delay:.27,dur:.12,vol:.55},{freq:784,delay:.41,dur:.35,vol:.6}]);



// ── TTS — קול עברי אמיתי ────────────────────────────────────────────────────
const _tts = (text, lang="he") => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang === "he" ? "he-IL" : "en-US";
        u.rate = 0.85;
        u.pitch = 1.0;
        u.volume = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const best = lang==="he"
          ? (voices.find(v=>v.lang==="he-IL") || voices.find(v=>v.lang.startsWith("he")))
          : (voices.find(v=>v.lang==="en-US") || voices.find(v=>v.lang.startsWith("en")));
        if (best) u.voice = best;
        window.speechSynthesis.speak(u);
      } catch(e) {}
    }, 600);
  } catch(e) {}
};

// פידבק קולי מלא
const speakCorrect  = (lang) => {
  const msgs = lang==="he"
    ? ["מצוין!", "כל הכבוד!", "נכון מאוד!", "יפה מאוד!", "מעולה!"]
    : ["Correct!", "Well done!", "Excellent!", "Great job!", "Perfect!"];
  _tts(msgs[Math.floor(Math.random()*msgs.length)], lang);
};
const speakWrong = (lang) => {
  _tts(lang==="he" ? "כמעט! נסה שוב" : "Almost! Try again", lang);
};
const speakDailyStart = (lang, name, gender="m") => {
  const f = gender==="f";
  const msgs = lang==="he" ? [
    `כל הכבוד${name?" "+name:""}! זה הזמן שלך לזרוח!`,
    `בואו נתחיל${name?" "+name:""}! המוח שלך מוכן!`,
    `היום יהיה נהדר${name?" "+name:""}! בהצלחה!`,
    `קדימה${name?" "+name:""}! 10 דקות לבריאות המוח!`,
    f ? `את מדהימה${name?" "+name:""}! קדימה לאתגר!` : `אתה מדהים${name?" "+name:""}! קדימה לאתגר!`,
  ] : [
    `Let's go${name?" "+name:""}! Time to shine!`,
    `Ready${name?" "+name:""}? Let's keep that mind sharp!`,
    `Great to see you${name?" "+name:""}! Let's begin!`,
  ];
  setTimeout(() => _tts(msgs[Math.floor(Math.random()*msgs.length)], lang), 600);
};
const speakDailyDone = (lang, name, gender="m") => {
  const f = gender==="f";
  const msgs = lang==="he" ? [
    `כל הכבוד${name?" "+name:""}! עשית עבודה מדהימה היום!`,
    f ? `וואו${name?" "+name:""}! את כוכבת!` : `וואו${name?" "+name:""}! אתה כוכב!`,
    f ? `אני כל כך גאה בך${name?" "+name:""}!` : `אני כל כך גאה בך${name?" "+name:""}!`,
    `${name?name+",":""}היום עשית משהו נפלא לבריאות המוח שלך!`,
    f ? `מדהימה${name?" "+name:""}! המשיכי כך!` : `מדהים${name?" "+name:""}! המשיכי כך!`,
  ] : [
    `Amazing${name?" "+name:""}! You did a wonderful job today!`,
    `Well done${name?" "+name:""}! Your brain worked hard!`,
    `I'm so proud of you${name?" "+name:""}!`,
  ];
  setTimeout(() => _tts(msgs[Math.floor(Math.random()*msgs.length)], lang), 400);
};
const speakGreeting = (lang, name, gender="m") => {
  const f = gender==="f";
  if (name) {
    const msg = lang==="he"
      ? (f ? `היי ${name}! ברוכה הבאה!` : `היי ${name}! ברוך הבא!`)
      : `Hey ${name}! Welcome!`;
    _tts(msg, lang);
  }
};

// ── פידבק ויזואלי — event-based toast ───────────────────────────────────────
const _toastListeners = [];
const onToast = (fn) => { _toastListeners.push(fn); return ()=>{ const i=_toastListeners.indexOf(fn); if(i>-1)_toastListeners.splice(i,1); }; };
const showToast = (text, color="#FF9F43") => { _toastListeners.forEach(fn=>fn({text,color})); };

function ToastOverlay() {
  const [toast, setToast] = useState(null);
  useEffect(()=>{
    const unsub = onToast(t=>{ setToast(t); setTimeout(()=>setToast(null),2000); });
    return unsub;
  },[]);
  if(!toast) return null;
  return (
    <div style={{
      position:"fixed", top:80, left:"50%",
      transform:"translateX(-50%)",
      background:"white", borderRadius:20, padding:"14px 28px",
      fontFamily:"Fredoka,sans-serif", fontSize:24, fontWeight:700,
      textAlign:"center", zIndex:9999,
      boxShadow:"0 4px 24px rgba(0,0,0,.15)",
      border:`3px solid ${toast.color}`, color:toast.color,
      maxWidth:"80vw", pointerEvents:"none",
      animation:"popIn .2s ease",
    }}>
      {toast.text}
    </div>
  );
}

const rnd = a => a[Math.floor(Math.random()*a.length)];
const GOOD_HE = ["מצוין","כל הכבוד","נכון","יפה מאוד","מעולה","ממש טוב","נהדר"];
const GOOD_EN = ["Correct","Well done","Excellent","Great","Perfect","Wonderful"];
const BAD_HE  = ["כמעט","לא נורא, נסה שוב","כמעט הגעת, נסה שוב"];
const BAD_EN  = ["Almost","Not quite, try again","Good try"];

const sayCorrect = l => {
  playCorrect();
  const word = l==="he" ? GOOD_HE[Math.floor(Math.random()*GOOD_HE.length)] : GOOD_EN[Math.floor(Math.random()*GOOD_EN.length)];
  showToast(word + " ! 🎉", "#1DD1A1");
  _tts(word, l);
};
const sayWrong = l => {
  playWrong();
  const word = l==="he" ? BAD_HE[Math.floor(Math.random()*BAD_HE.length)] : BAD_EN[Math.floor(Math.random()*BAD_EN.length)];
  showToast(word + " 💪", "#FF6B6B");
  _tts(word, l);
};
const sayDone = l => { playDone(); };
const sayDailyStart = (l, n) => {
  playStart();
  setTimeout(()=>showToast(n?(l==="he"?`בהצלחה ${n}! 🚀`:`Good luck ${n}! 🚀`):(l==="he"?"בהצלחה! 🚀":"Good luck! 🚀"), "#FF9F43"), 850);
  speakDailyStart(l, n);
};
const sayDailyDone  = (l, n, msg) => {
  playDone();
  setTimeout(()=>showToast(msg||(n?(l==="he"?`כל הכבוד ${n}! 🎊`:`Well done ${n}! 🎊`):(l==="he"?"כל הכבוד! 🎊":"Well done! 🎊")), "#FF9F43"), 500);
  speakDailyDone(l, n);
};


const css = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Nunito:wght@600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#FFF8F0;font-family:'Nunito',sans-serif}
.app{max-width:430px;min-height:100vh;margin:0 auto;background:#FFF8F0}
.screen{min-height:100vh;padding:20px 18px 32px;animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.back-btn{background:white;border:2.5px solid #E8E0D8;border-radius:12px;padding:10px 16px;font-size:15px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;color:#2D2A26}
.score-pill{background:#FF9F43;color:white;border-radius:50px;padding:8px 16px;font-weight:900;font-size:17px;font-family:'Fredoka',sans-serif}
.btn{border:none;border-radius:18px;padding:18px 24px;font-size:19px;font-weight:800;font-family:'Fredoka',sans-serif;cursor:pointer;width:100%;margin-top:10px;letter-spacing:.3px}
.btn:active{transform:translateY(2px)}
.btn-sun{background:#FF9F43;color:white;box-shadow:0 5px 0 #F08000}
.btn-sky{background:#54A0FF;color:white;box-shadow:0 5px 0 #2E7DD4}
.btn-green{background:#1DD1A1;color:white;box-shadow:0 5px 0 #10AB83}
.btn-ghost{background:white;color:#2D2A26;box-shadow:0 5px 0 #D5C9BF;border:2.5px solid #E8E0D8}
.opt{background:white;border:2.5px solid #E8E0D8;border-radius:16px;padding:16px 20px;font-size:18px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;width:100%;margin-bottom:10px;text-align:right;color:#2D2A26;display:block;transition:border-color .15s}
.opt-ltr{text-align:left}
.opt-correct{background:#EDFFF8;border-color:#1DD1A1;color:#0A6B4F;animation:popIn .35s ease}
.opt-wrong{background:#FFF0F0;border-color:#FF6B6B;color:#9B2626;animation:shake .35s ease}
.opt-reveal{background:#EDFFF8;border-color:#1DD1A1;color:#0A6B4F}
.card{background:white;border-radius:24px;padding:22px;box-shadow:0 4px 20px rgba(0,0,0,.07);margin-bottom:14px}
.card-sun{background:linear-gradient(135deg,#FFF3E0,#FFE0B2);border:2.5px solid #FFD08A}
.card-sky{background:linear-gradient(135deg,#E3F2FD,#BBDEFB);border:2.5px solid #90CAF9}
.card-green{background:linear-gradient(135deg,#E0FFF6,#B2F5E0);border:2.5px solid #6BE8C4}
.prog-wrap{background:#E8E0D8;border-radius:99px;height:10px;overflow:hidden;margin:6px 0}
.prog-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#FF9F43,#FF6B6B);transition:width .6s ease}
.daily-hero{background:linear-gradient(135deg,#FF9F43,#FF6B6B);border-radius:28px;padding:24px 20px;margin-bottom:16px;color:white;cursor:pointer}
.daily-title{font-size:26px;font-weight:900;font-family:'Fredoka',sans-serif;margin-bottom:6px}
.daily-sub{font-size:15px;font-weight:600;opacity:.9}
.streak-badge{background:rgba(255,255,255,.25);border-radius:50px;padding:5px 12px;font-size:13px;font-weight:800;display:inline-block;margin-bottom:8px}
.game-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.game-card{background:white;border-radius:22px;padding:18px 14px;cursor:pointer;transition:transform .15s;border:2.5px solid transparent;text-align:center;box-shadow:0 3px 12px rgba(0,0,0,.06)}
.game-card:active{transform:scale(.95)}
.gc-icon{font-size:36px;display:block;margin-bottom:8px}
.gc-label{font-size:15px;font-weight:800;color:#2D2A26;font-family:'Fredoka',sans-serif}
.gc-sub{font-size:12px;font-weight:600;color:#8B7E74;margin-top:2px}
.mem-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}
.mem-card{aspect-ratio:1;border-radius:16px;border:none;font-size:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.mem-hidden{background:#E8E0D8}
.mem-shown{background:#FFF3E0;border:3px solid #FF9F43}
.mem-matched{background:#EDFFF8;border:3px solid #1DD1A1}
.speed-area{min-height:200px;background:#F5F0EB;border-radius:22px;display:flex;align-items:center;justify-content:center;margin:16px 0}
.seq-box{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin:16px 0}
.seq-num{width:52px;height:52px;border-radius:14px;background:white;border:2.5px solid #E8E0D8;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;font-family:'Fredoka',sans-serif}
.seq-q{background:#FFF3E0;border-color:#FF9F43;color:#F08000;font-size:26px}
.seq-arr{font-size:16px;color:#8B7E74;font-weight:700}
.num-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.num-btn{background:white;border:3px solid #E8E0D8;border-radius:20px;padding:22px;font-size:30px;font-weight:900;font-family:'Fredoka',sans-serif;cursor:pointer;color:#2D2A26;transition:all .15s}
.num-btn:active{transform:scale(.94)}
.num-correct{background:#EDFFF8;border-color:#1DD1A1;animation:popIn .35s ease}
.num-wrong{background:#FFF0F0;border-color:#FF6B6B}
.num-reveal{background:#EDFFF8;border-color:#1DD1A1}
.room-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.room-btn{background:white;border:3px solid #E8E0D8;border-radius:20px;padding:20px 12px;cursor:pointer;font-family:'Nunito',sans-serif;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .15s}
.room-btn:active{transform:scale(.95)}
.room-correct{background:#EDFFF8;border-color:#1DD1A1}
.room-wrong{background:#FFF0F0;border-color:#FF6B6B}
.room-reveal{background:#EDFFF8;border-color:#1DD1A1}
.clue-box{background:#FFF8F0;border:2px solid #F0DDB8;border-radius:14px;padding:12px 16px;margin-bottom:8px;font-size:16px;font-weight:700;color:#2D2A26}
.clue-new{border-color:#FF9F43;background:#FFF3E0}
.lang-btn{background:white;border:2.5px solid #E8E0D8;border-radius:18px;padding:18px 20px;font-size:20px;font-weight:700;cursor:pointer;width:100%;margin-bottom:12px;display:flex;align-items:center;gap:14px;font-family:'Nunito',sans-serif;transition:all .2s}
.lang-btn.sel,.lang-btn:hover{border-color:#FF9F43;background:#FFF8F0}
.app-title{font-family:'Fredoka',sans-serif;font-size:42px;font-weight:700;color:#2D2A26}
.app-title span{color:#FF9F43}
h2.st{font-family:'Fredoka',sans-serif;font-size:24px;font-weight:600;color:#2D2A26;margin-bottom:4px}
.pl{font-size:14px;color:#8B7E74;font-weight:700;margin-bottom:14px}
.big-e{font-size:72px;text-align:center;display:block;margin:12px 0;animation:float 2s ease-in-out infinite}
.rhythm-circle{width:160px;height:160px;border-radius:50%;margin:16px auto;display:flex;align-items:center;justify-content:center;font-size:60px;transition:background .1s,box-shadow .1s;border:5px solid transparent}
.rh-idle{background:#F5F0EB}
.rh-play{background:#FF9F43;box-shadow:0 0 0 16px rgba(255,159,67,.2)}
.rh-input{background:#EBF5FF;border-color:#54A0FF;cursor:pointer}
.rh-good{background:#EDFFF8;border-color:#1DD1A1}
.rh-ok{background:#FFF8E0;border-color:#FF9F43}
.rh-miss{background:#FFF0F0;border-color:#FF6B6B}
.chat-wrap{display:flex;flex-direction:column;height:100vh;max-width:430px;margin:0 auto;background:#FFF8F0}
.chat-hdr{padding:16px 18px;background:white;border-bottom:2px solid #F0E8E0;display:flex;align-items:center;gap:12px;flex-shrink:0}
.chat-msgs{flex:1;overflow-y:auto;padding:16px}
.bubble-bot{background:white;border:2px solid #F0E8E0;border-radius:20px 20px 20px 4px;padding:14px 18px;max-width:80%;font-size:17px;line-height:1.5;font-weight:600;margin-bottom:12px}
.bubble-user{background:#54A0FF;color:white;border-radius:20px 20px 4px 20px;padding:14px 18px;max-width:80%;font-size:17px;line-height:1.5;font-weight:600;margin-bottom:12px;margin-left:auto}
.chat-in-area{padding:12px 16px;background:white;border-top:2px solid #F0E8E0;display:flex;gap:10px;flex-shrink:0}
.chat-in{flex:1;border:2.5px solid #E8E0D8;border-radius:16px;padding:14px 16px;font-size:17px;font-family:'Nunito',sans-serif;outline:none;background:#FFF8F0}
.chat-send{background:#FF9F43;border:none;border-radius:14px;padding:14px 18px;font-size:20px;cursor:pointer}
`;

// ── Data ─────────────────────────────────────────────────────────────────────
const shuffle = a => [...a].sort(() => Math.random() - 0.5);
const pick = (a, n) => shuffle(a).slice(0, n);

const T = {
  he:{dir:"rtl",back:"חזרה",playAgain:"שוב 🔄",menu:"תפריט",correct:"מצוין! 🎉",almost:"כמעט! 💪",done:"סיימנו! 🎊",dailyTitle:"האתגר היומי",dailySub:"10 דקות לשמור על המוח חד",streak:"ימים ברצף",chooseGame:"מה משחקים היום?",speed:"מהירות",memory:"זיכרון",language:"שפה",music:"מוזיקה",numbers:"מספרים",sorting:"מיון",trivia:"ידע",together:"ביחד",family:"דוח",chat:"שיחה",whatChanged:"מה השתנה?",whichRoom:"לאיזה חדר?",clueBtn:"רמז נוסף"},
  en:{dir:"ltr",back:"Back",playAgain:"Again 🔄",menu:"Menu",correct:"Correct! 🎉",almost:"Almost! 💪",done:"Done! 🎊",dailyTitle:"Daily Challenge",dailySub:"10 minutes to keep your mind sharp",streak:"day streak",chooseGame:"What shall we play?",speed:"Speed",memory:"Memory",language:"Language",music:"Music",numbers:"Numbers",sorting:"Sorting",trivia:"Trivia",together:"Together",family:"Report",chat:"Chat",whatChanged:"What changed?",whichRoom:"Which room?",clueBtn:"Next clue"},
};

const EMOJI_SETS=[["🍎","🐱","🌺","🏠","⭐","🌙"],["🦋","🎈","🍋","🐶","🌈","🎵"],["🐸","🍓","🚂","🌵","🎸","🦁"],["🍕","🐘","🌊","🎩","🍦","🦅"],["🌸","🐠","🎪","🍇","🚀","🦊"],["🏆","🌻","🐧","🍒","🎭","🦋"],["🍰","🐻","🌴","🎺","🦄","🌮"],["🐝","🍑","🚁","🌍","🎯","🦜"]];
const SPEED_HE=[{a:["🍎","🐱","🌺","🏠"],b:["🍎","🐶","🌺","🏠"],opts:["🐱 חתול","🏠 בית","🐶 כלב","🌺 פרח"],ans:"🐶 כלב"},{a:["⭐","🌙","☀️","🌈"],b:["⭐","🌙","🌧️","🌈"],opts:["⭐ כוכב","🌙 ירח","🌧️ גשם","☀️ שמש"],ans:"🌧️ גשם"},{a:["🍕","🎸","🐘","🚗"],b:["🍕","🎸","🦁","🚗"],opts:["🍕 פיצה","🎸 גיטרה","🦁 אריה","🚗 מכונית"],ans:"🦁 אריה"},{a:["🌸","🐠","🎩","🍇"],b:["🌸","🐠","🎩","🍓"],opts:["🌸 פרח","🐠 דג","🍓 תות","🍇 ענבים"],ans:"🍓 תות"},{a:["🚀","🦊","🎪","🍦"],b:["🚀","🐺","🎪","🍦"],opts:["🚀 רקטה","🦊 שועל","🐺 זאב","🎪 קרקס"],ans:"🐺 זאב"},{a:["🏆","🌻","🎺","🍒"],b:["🏆","🌻","🥁","🍒"],opts:["🏆 גביע","🌻 חמנייה","🎺 חצוצרה","🥁 תוף"],ans:"🥁 תוף"},{a:["🐝","🍑","🚁","🌍"],b:["🦋","🍑","🚁","🌍"],opts:["🐝 דבורה","🦋 פרפר","🍑 אפרסק","🚁 מסוק"],ans:"🦋 פרפר"},{a:["🎯","🦜","🍰","🌊"],b:["🎯","🦜","🍩","🌊"],opts:["🎯 מטרה","🦜 תוכי","🍰 עוגה","🍩 דונאט"],ans:"🍩 דונאט"}];
const SPEED_EN=[{a:["🍎","🐱","🌺","🏠"],b:["🍎","🐶","🌺","🏠"],opts:["🐱 Cat","🏠 House","🐶 Dog","🌺 Flower"],ans:"🐶 Dog"},{a:["⭐","🌙","☀️","🌈"],b:["⭐","🌙","🌧️","🌈"],opts:["⭐ Star","🌙 Moon","🌧️ Rain","☀️ Sun"],ans:"🌧️ Rain"},{a:["🍕","🎸","🐘","🚗"],b:["🍕","🎸","🦁","🚗"],opts:["🍕 Pizza","🎸 Guitar","🦁 Lion","🚗 Car"],ans:"🦁 Lion"},{a:["🌸","🐠","🎩","🍇"],b:["🌸","🐠","🎩","🍓"],opts:["🌸 Flower","🐠 Fish","🍓 Strawberry","🍇 Grapes"],ans:"🍓 Strawberry"},{a:["🚀","🦊","🎪","🍦"],b:["🚀","🐺","🎪","🍦"],opts:["🚀 Rocket","🦊 Fox","🐺 Wolf","🎪 Circus"],ans:"🐺 Wolf"},{a:["🏆","🌻","🎺","🍒"],b:["🏆","🌻","🥁","🍒"],opts:["🏆 Trophy","🌻 Sunflower","🎺 Trumpet","🥁 Drum"],ans:"🥁 Drum"},{a:["🐝","🍑","🚁","🌍"],b:["🦋","🍑","🚁","🌍"],opts:["🐝 Bee","🦋 Butterfly","🍑 Peach","🚁 Helicopter"],ans:"🦋 Butterfly"}];
const SENTENCES={
he:[
  {p:"שבת ___",a:"שלום",o:["שלום","טובה","קדושה","נעימה"]},
  {p:"שנה טובה ו___",a:"מתוקה",o:["מתוקה","שמחה","ארוכה","בריאה"]},
  {p:"בתיאבון ו___",a:"לבריאות",o:["לבריאות","בהצלחה","תודה","חיים"]},
  {p:"מזל טוב ו___",a:"בהצלחה",o:["בהצלחה","שמחה","ברכות","אמן"]},
  {p:"לילה טוב ו___",a:"שינה מתוקה",o:["שינה מתוקה","בוקר טוב","ערב טוב","יום טוב"]},
  {p:"ירושלים של ___",a:"זהב",o:["זהב","שלום","אור","כסף"]},
  {p:"הבה נגילה הבה נגילה ו___",a:"נשמחה",o:["נשמחה","נרנן","נשיר","נרקד"]},
  {p:"כל העולם כולו גשר ___ מאוד",a:"צר",o:["צר","רחב","ארוך","גבוה"]},
  {p:"עם ישראל ___",a:"חי",o:["חי","שר","חזק","אחד"]},
  {p:"דודי לי ואני ___",a:"לו",o:["לו","לה","לך","לנו"]},
  {p:"חנוכה חנוכה חג יפה כל ___",a:"כך",o:["כך","זה","מאוד","כה"]},
  {p:"שמע ישראל ה׳ אלוהינו ה׳ ___",a:"אחד",o:["אחד","גדול","אמת","שלום"]},
  {p:"אם אין קמח אין ___",a:"תורה",o:["תורה","לחם","מים","שלום"]},
  {p:"ואהבת לרעך ___",a:"כמוך",o:["כמוך","כנפשך","כאחיך","כלבבך"]},
  {p:"סביבון סוב סוב ___",a:"סוב",o:["סוב","טוב","עוד","חג"]},
  {p:"לכה דודי לקראת ___ נקבלה",a:"כלה",o:["כלה","שבת","נשמה","אור"]},
  {p:"כל ישראל ערבים זה ___",a:"בזה",o:["בזה","לזה","עם זה","כזה"]},
  {p:"על כל אלה שמור נא לי ___",a:"אלי",o:["אלי","אלה","עלי","אמי"]},
  {p:"הנה מה טוב ומה נעים שבת אחים גם ___",a:"יחד",o:["יחד","אחד","שם","כן"]},
  {p:"בשנה הבאה בירושלים ___",a:"הבנויה",o:["הבנויה","השלמה","החדשה","העתיקה"]},
  {p:"לו יהי כל שנבקש לו ___",a:"יהי",o:["יהי","יבוא","ייתן","יחלום"]},
  {p:"ארץ זבת חלב ו___",a:"דבש",o:["דבש","יין","שמן","מים"]},
  {p:"דרור יקרא לבן עם ___",a:"בת",o:["בת","אם","אב","אח"]},
  {p:"תנו לשמש לעלות לבוקר ___",a:"להאיר",o:["להאיר","לזרוח","לצאת","לשיר"]},
  {p:"אני מאמין באמונה ___",a:"שלמה",o:["שלמה","חזקה","גדולה","עמוקה"]},
  {p:"כבד את אביך ואת ___",a:"אמך",o:["אמך","אחיך","רעך","בנך"]},
  {p:"לא בחיל ולא בכוח כי אם ברוחי אמר ___",a:"ה׳",o:["ה׳","האל","אדוני","שמים"]},
  {p:"ראש השנה בא לו ראש השנה ___",a:"בא",o:["בא","היה","עבר","הגיע"]},
  {p:"תפוח בדבש נאכל שנה טובה ___",a:"נקבל",o:["נקבל","נשיר","נשחק","נחגוג"]},
  {p:"תפוח בדבש נאכל שנה טובה ___",a:"נקבל",o:["נקבל","נשיר","נשחק","נחגוג"]},
],
en:[
  {p:"Better safe than ___",a:"sorry",o:["sorry","late","lost","done"]},
  {p:"An apple a day keeps the ___ away",a:"doctor",o:["doctor","dentist","cold","flu"]},
  {p:"The early bird catches the ___",a:"worm",o:["worm","fish","bug","prize"]},
  {p:"Every cloud has a silver ___",a:"lining",o:["lining","light","side","edge"]},
  {p:"All that glitters is not ___",a:"gold",o:["gold","silver","good","real"]},
  {p:"A stitch in time saves ___",a:"nine",o:["nine","time","all","much"]},
  {p:"Two heads are better than ___",a:"one",o:["one","none","two","three"]},
  {p:"Actions speak louder than ___",a:"words",o:["words","thoughts","feelings","ideas"]},
  {p:"Where there's a will there's a ___",a:"way",o:["way","chance","hope","dream"]},
  {p:"You are my sunshine, my only ___",a:"sunshine",o:["sunshine","darling","love","light"]},
  {p:"Twinkle twinkle little ___, how I wonder what you are",a:"star",o:["star","moon","light","sun"]},
  {p:"Somewhere over the ___",a:"rainbow",o:["rainbow","mountains","clouds","sky"]},
  {p:"What a wonderful ___",a:"world",o:["world","life","day","time"]},
  {p:"You'll never walk ___",a:"alone",o:["alone","away","back","home"]},
  {p:"Yesterday, all my troubles seemed so far ___",a:"away",o:["away","gone","past","done"]},
  {p:"Old MacDonald had a farm, E-I-E-I-___",a:"O",o:["O","A","E","U"]},
  {p:"The wheels on the bus go round and ___",a:"round",o:["round","down","up","fast"]},
  {p:"If you're happy and you know it clap your ___",a:"hands",o:["hands","feet","knees","head"]},
  {p:"Row row row your boat gently down the ___",a:"stream",o:["stream","river","lake","sea"]},
  {p:"My bonnie lies over the ___ my bonnie lies over the sea",a:"ocean",o:["ocean","river","mountain","sea"]},
  {p:"Que sera sera whatever will be will ___",a:"be",o:["be","go","come","stay"]},
  {p:"Moon river wider than a ___",a:"mile",o:["mile","river","dream","smile"]},
  {p:"Let it be let it be whisper words of ___",a:"wisdom",o:["wisdom","comfort","kindness","peace"]},
  {p:"Stand by me oh stand by ___",a:"me",o:["me","her","him","you"]},
  {p:"Happy birthday to you happy birthday to ___",a:"you",o:["you","me","us","all"]},
  {p:"A penny saved is a penny ___",a:"earned",o:["earned","saved","spent","lost"]},
  {p:"Look before you ___",a:"leap",o:["leap","walk","run","go"]},
  {p:"Don't count your chickens before they ___",a:"hatch",o:["hatch","grow","arrive","come"]},
  {p:"Good night sleep ___",a:"tight",o:["tight","well","long","sound"]},
  {p:"Thank you very ___",a:"much",o:["much","well","kind","good"]},
]};
const SONGS={
he:[
  {l:"בשנה הבאה נשב על המרפסת ונספור ציפורים ___",a:"נודדות",o:["נודדות","שרות","טסות","עפות"],t:"בשנה הבאה",e:"🕊️"},
  {l:"אי אבדה הדרך אל הכפר הדרך בה רציתי לשוב ___",a:"בחזרה",o:["בחזרה","הביתה","אליה","שוב"],t:"הדרך אל הכפר",e:"🌾"},
  {l:"זה סימן שאתה ___ כמו יום אביב בהיר",a:"צעיר",o:["צעיר","ילד","חי","שמח"],t:"סימן שאתה צעיר",e:"🌸"},
  {l:"השמש ידם בין עזה לרפיח ירח ילבין על פסגת ___",a:"החרמון",o:["החרמון","הגליל","הכרמל","הנגב"],t:"פרחים בקנה",e:"🌺"},
  {l:"אל השמש הזאת לרוחות העזות כי הים לכולנו ___",a:"פתוח",o:["פתוח","שייך","קרוב","חופשי"],t:"בוא אלינו לים",e:"🌊"},
  {l:"אין לי ארץ אחרת גם אם אדמתי ___",a:"בוערת",o:["בוערת","רועדת","בוכה","שורפת"],t:"אין לי ארץ אחרת",e:"🇮🇱"},
  {l:"שלום לך ארץ נהדרת עבדך הדל נושא לך שיר ___",a:"מזמור",o:["מזמור","ותפילה","ושיר","ושבח"],t:"שלום לך ארץ נהדרת",e:"🌿"},
  {l:"תנו לשמש לעלות לבוקר ___",a:"להאיר",o:["להאיר","לזרוח","לצאת","לשיר"],t:"שיר לשלום",e:"☮️"},
  {l:"מי ידע שכך יהיה שבכמה לילות ללא ___",a:"אמא",o:["אמא","שינה","אור","חום"],t:"מי ידע שכך יהיה",e:"🌙"},
  {l:"אני רוצה שתדעי זה מכאן עד הסוף בטוב וברע אני אמשיך ___",a:"לאהוב",o:["לאהוב","להיות","ללכת","לחיות"],t:"עד סוף העולם",e:"❤️"},
  {l:"שבחי ירושלים את אדוני הללי אלוהיך ___",a:"ציון",o:["ציון","ישראל","עמו","עיר"],t:"שבחי ירושלים",e:"🕍"},
  {l:"אויר הרים צלול כיין וריח ___",a:"אורנים",o:["אורנים","פרחים","עצים","הרים"],t:"ירושלים של זהב",e:"🏔️"},
  {l:"עוף גוזל חתוך את ___",a:"השמיים",o:["השמיים","האוויר","הרוח","הענן"],t:"עוף גוזל",e:"🦅"},
  {l:"שמור נא עלינו כמו ילדים שמור נא ואל ___",a:"תעזוב",o:["תעזוב","תלך","תשכח","תרחק"],t:"תפילה",e:"🙏"},
  {l:"לעולם בעקבות השמש לעולם בעקבות ___",a:"האור",o:["האור","החום","השמש","הדרך"],t:"לעולם בעקבות השמש",e:"☀️"},
  {l:"מלאך מטיל בשמים מלאך מבקש ___",a:"כוכבים",o:["כוכבים","שלום","חלומות","עננים"],t:"גבריאל",e:"✨"},
  {l:"זה השיר שסבא שר אותו לאבא והיום ___",a:"אני",o:["אני","אתה","אנחנו","הוא"],t:"חי",e:"🎵"},
  {l:"בתשרי נתן הדקל פרי שחום ___",a:"נחמד",o:["נחמד","וטוב","ויפה","ומתוק"],t:"שנים עשר ירחים",e:"📅"},
  {l:"הלוואי ומענן תרד עלינו קשת הלוואי שלעולם הזה יש ___",a:"תקנה",o:["תקנה","שלום","תקווה","אור"],t:"הלוואי",e:"🌈"},
  {l:"כבר אחרי חצות עוד לא כיבו את ___",a:"הירח",o:["הירח","הכוכבים","השמש","האור"],t:"כבר אחרי חצות",e:"🌙"},
  {l:"אני נולדתי לשלום שרק ___",a:"יגיע",o:["יגיע","יבוא","יהיה","ימצא"],t:"נולדתי לשלום",e:"🕊️"},
  {l:"ים השיבולים שמסביב על גליו לשוט יצא ___",a:"הרוח",o:["הרוח","הגל","הציפור","הזמן"],t:"ים השיבולים",e:"🌾"},
  {l:"קח מקל קח תרמיל בוא איתי אל ___",a:"הגליל",o:["הגליל","ההר","הכנרת","הים"],t:"קח מקל קח תרמיל",e:"🎒"},
  {l:"ימי החנוכה חנוכת מקדשנו בגיל ובשמחה ממלאים את ___",a:"ליבנו",o:["ליבנו","חיינו","עולמנו","ביתנו"],t:"ימי החנוכה",e:"🕎"},
  {l:"חנוכיה לי יש צוחקת בה ___",a:"האש",o:["האש","האור","הלהבה","הנר"],t:"חנוכיה לי יש",e:"🕎"},
  {l:"באנו חושך לגרש בידינו אור ___",a:"ואש",o:["ואש","ושיר","ונר","ואור"],t:"באנו חושך לגרש",e:"🕯️"},
  {l:"וביושר לבב שוב תהיי ענווה ונכנעת כאחד ___",a:"האדם",o:["האדם","הדשאים","הפרחים","הצמחים"],t:"את תלכי בשדה",e:"🌿"},
  {l:"ירושלים של זהב ושל נחושת ושל ___",a:"אור",o:["אור","שמים","שיר","כסף"],t:"ירושלים של זהב",e:"🕍"},
  {l:"הבה נגילה הבה נגילה ו___",a:"נשמחה",o:["נשמחה","נרנן","נשיר","נרקד"],t:"הבה נגילה",e:"🎊"},
  {l:"לו יהי כל שנבקש לו ___",a:"יהי",o:["יהי","יבוא","ייתן","יחלום"],t:"לו יהי",e:"🕊️"},
  {l:"כל העולם כולו גשר ___ מאוד",a:"צר",o:["צר","רחב","ארוך","גבוה"],t:"גשר צר מאוד",e:"🌉"},
  {l:"עם ישראל ___",a:"חי",o:["חי","שר","חזק","אחד"],t:"עם ישראל חי",e:"✡️"},
  {l:"הנה מה טוב ומה נעים שבת אחים גם ___",a:"יחד",o:["יחד","אחד","שם","כן"],t:"הנה מה טוב",e:"🤝"},
  {l:"חנוכה חנוכה חג יפה כל ___",a:"כך",o:["כך","זה","מאוד","כה"],t:"חנוכה",e:"🕎"},
  {l:"דודי לי ואני ___",a:"לו",o:["לו","לה","לך","לנו"],t:"דודי לי",e:"💛"},
  {l:"על כל אלה שמור נא לי ___",a:"אלי",o:["אלי","אלה","עלי","אמי"],t:"על כל אלה",e:"🌿"},
  {l:"אני מאמין באמונה ___",a:"שלמה",o:["שלמה","חזקה","גדולה","עמוקה"],t:"אני מאמין",e:"🌟"},
  {l:"סביבון סוב סוב ___",a:"סוב",o:["סוב","טוב","עוד","חג"],t:"סביבון",e:"🕎"},
  {l:"שמע ישראל ה'אלוהינו ה'___",a:"אחד",o:["אחד","גדול","אמת","שלום"],t:"שמע ישראל",e:"📜"},
  {l:"שבת שלום שבת שלום שבת שבת ___",a:"שלום",o:["שלום","טובה","קדושה","שמחה"],t:"שבת שלום",e:"🕯️"},
  {l:"תפוח בדבש נאכל שנה טובה ___",a:"נקבל",o:["נקבל","נשיר","נחגוג","נשמח"],t:"תפוח בדבש",e:"🍯"},
  {l:"אם אשכחך ירושלים תשכח ___",a:"ימיני",o:["ימיני","שמאלי","עיני","פי"],t:"אם אשכחך",e:"🕍"},
  {l:"פרפר נחמד פרפר נחמד עוף עוף אל ה___",a:"שדה",o:["שדה","פרח","עץ","שמים"],t:"פרפר נחמד",e:"🦋"},
  {l:"בשנה הבאה בירושלים ___",a:"הבנויה",o:["הבנויה","השלמה","החדשה","העתיקה"],t:"בשנה הבאה בירושלים",e:"🕍"},
  {l:"שיר המעלות בשוב ה'את שיבת ___",a:"ציון",o:["ציון","ירושלים","ישראל","עמו"],t:"שיר המעלות",e:"🏔️"},
],
en:[
  {l:"You are my sunshine, my only ___",a:"sunshine",o:["sunshine","darling","love","light"],t:"You Are My Sunshine",e:"☀️"},
  {l:"Twinkle twinkle little ___, how I wonder what you are",a:"star",o:["star","moon","light","sun"],t:"Twinkle Twinkle",e:"⭐"},
  {l:"Somewhere over the ___",a:"rainbow",o:["rainbow","mountains","clouds","sky"],t:"Over the Rainbow",e:"🌈"},
  {l:"What a wonderful ___",a:"world",o:["world","life","day","time"],t:"Wonderful World",e:"🌍"},
  {l:"You'll never walk ___",a:"alone",o:["alone","away","back","home"],t:"You'll Never Walk Alone",e:"🤝"},
  {l:"Yesterday, all my troubles seemed so far ___",a:"away",o:["away","gone","past","done"],t:"Yesterday",e:"💛"},
  {l:"Let it be let it be whisper words of ___",a:"wisdom",o:["wisdom","comfort","kindness","peace"],t:"Let It Be",e:"🕊️"},
  {l:"Stand by me oh stand by ___",a:"me",o:["me","her","him","you"],t:"Stand By Me",e:"🌟"},
  {l:"Moon river wider than a ___",a:"mile",o:["mile","river","dream","smile"],t:"Moon River",e:"🌙"},
  {l:"Old MacDonald had a farm E-I-E-I-___",a:"O",o:["O","A","E","U"],t:"Old MacDonald",e:"🐄"},
  {l:"The wheels on the bus go round and ___",a:"round",o:["round","down","up","fast"],t:"Wheels on the Bus",e:"🚌"},
  {l:"If you're happy and you know it clap your ___",a:"hands",o:["hands","feet","knees","head"],t:"If You're Happy",e:"👏"},
  {l:"My bonnie lies over the ___ my bonnie lies over the sea",a:"ocean",o:["ocean","river","mountain","sea"],t:"My Bonnie",e:"🌊"},
  {l:"Que sera sera whatever will be will ___",a:"be",o:["be","go","come","stay"],t:"Que Sera Sera",e:"🎶"},
  {l:"Happy birthday to you happy birthday to ___",a:"you",o:["you","me","us","all"],t:"Happy Birthday",e:"🎂"},
  {l:"Oh when the saints go marching ___",a:"in",o:["in","out","by","up"],t:"When the Saints Go Marching In",e:"🎺"},
  {l:"Swing low sweet chariot coming for to carry me ___",a:"home",o:["home","away","back","free"],t:"Swing Low Sweet Chariot",e:"🎵"},
  {l:"Danny boy the pipes the pipes are ___",a:"calling",o:["calling","playing","ringing","singing"],t:"Danny Boy",e:"🍀"},
  {l:"Take me out to the ball game take me out to the ___",a:"crowd",o:["crowd","park","game","show"],t:"Take Me Out to the Ball Game",e:"⚾"},
  {l:"My favorite things raindrops on roses and whiskers on ___",a:"kittens",o:["kittens","puppies","bunnies","babies"],t:"My Favorite Things",e:"🌹"},
]};
const TRIVIA={
he:[
  {type:"q",q:"מי היה ראש הממשלה הראשון של ישראל?",a:"דוד בן גוריון",o:["דוד בן גוריון","חיים וייצמן","משה שרת","לוי אשכול"],e:"📜"},
  {type:"q",q:"באיזו שנה קמה מדינת ישראל?",a:"1948",o:["1948","1947","1949","1950"],e:"🇮🇱"},
  {type:"q",q:"מי כתבה את 'ירושלים של זהב'?",a:"נעמי שמר",o:["נעמי שמר","שולמית אלוני","יורם טהרלב","חיים חפר"],e:"🎵"},
  {type:"q",q:"מי הייתה ראשת הממשלה הראשונה של ישראל?",a:"גולדה מאיר",o:["גולדה מאיר","שולמית אלוני","לאה רבין","מרים בן פורת"],e:"👩‍💼"},
  {type:"q",q:"כמה ימים נמשכה מלחמת ששת הימים?",a:"6",o:["6","7","12","3"],e:"🎖️"},
  {type:"q",q:"מהי עיר הבירה של ישראל?",a:"ירושלים",o:["ירושלים","תל אביב","חיפה","באר שבע"],e:"🕍"},
  {type:"q",q:"מי שר שיר לשלום לפני הירצחו?",a:"יצחק רבין",o:["יצחק רבין","שמעון פרס","מנחם בגין","אהוד ברק"],e:"🕊️"},
  {type:"q",q:"באיזה ים שוחים בקלות כי המים מלוחים?",a:"ים המלח",o:["ים המלח","הכינרת","ים סוף","הים התיכון"],e:"🏊"},
  {type:"q",q:"מי חתם על הסכם השלום עם מצרים?",a:"מנחם בגין",o:["מנחם בגין","יצחק שמיר","אריאל שרון","יצחק רבין"],e:"✌️"},
  {type:"q",q:"איזה פרי הוא סמל ראש השנה?",a:"תפוח בדבש",o:["תפוח בדבש","רימון","תמר","ענבים"],e:"🍎"},
  {type:"q",q:"מה שמו של ההמנון הלאומי של ישראל?",a:"התקווה",o:["התקווה","שיר השירים","דגל הארץ","עם ישראל חי"],e:"🎵"},
  {type:"q",q:"כמה שבטים היו לישראל?",a:"12",o:["12","10","13","7"],e:"📜"},
  {type:"q",q:"מי בנה את בית המקדש הראשון?",a:"שלמה המלך",o:["שלמה המלך","דוד המלך","שאול","יהושע"],e:"🕍"},
  {type:"q",q:"באיזה חג אוכלים מצות?",a:"פסח",o:["פסח","שבועות","סוכות","פורים"]  ,e:"🍞"},
  {type:"q",q:"כמה נרות בחנוכייה?",a:"9",o:["9","8","7","10"],e:"🕎"},
  {type:"q",q:"מה שם הנהר הגדול ביותר בישראל?",a:"הירדן",o:["הירדן","הירקון","הכישון","הזרקא"],e:"🌊"},
  {type:"q",q:"באיזה עיר נמצא הכותל המערבי?",a:"ירושלים",o:["ירושלים","חברון","בית לחם","יריחו"],e:"🕍"},
  {type:"q",q:"כמה ימים חג הסוכות?",a:"7",o:["7","8","5","9"],e:"🌿"},
  {type:"q",q:"מי היה המלך הראשון של ישראל?",a:"שאול",o:["שאול","דוד","שלמה","יהושע"],e:"👑"},
  {type:"q",q:"באיזה ים נמצאת אילת?",a:"ים סוף",o:["ים סוף","ים המלח","הים התיכון","הכינרת"],e:"🌊"},
  {type:"q",q:"מה גובה הר חרמון בערך?",a:"2800 מטר",o:["2800 מטר","1200 מטר","3500 מטר","500 מטר"],e:"⛰️"},
  {type:"q",q:"איזה עיר היא הגדולה ביותר בישראל?",a:"ירושלים",o:["ירושלים","תל אביב","חיפה","ראשון לציון"],e:"🏙️"},
  {type:"q",q:"כמה שנים ביובל?",a:"50",o:["50","40","25","100"],e:"📅"},
  {type:"q",q:"מה שם הכינרת בעברית עתיקה?",a:"ים כנרת",o:["ים כנרת","ים גנוסר","ים טבריה","ים גלילי"],e:"💧"},
  {type:"q",q:"מי כתב את ההגדה של פסח?",a:"חכמים שונים לדורותיהם",o:["חכמים שונים לדורותיהם","משה רבנו","דוד המלך","עזרא הסופר"],e:"📜"},
  {type:"q",q:"כמה שנות גלות היו בבבל?",a:"70",o:["70","40","100","50"],e:"📜"},
  {type:"q",q:"מי היה הנביא שהוציא את ישראל ממצרים?",a:"משה",o:["משה","אהרון","יהושע","כלב"],e:"🌊"},
  {type:"q",q:"באיזה חג אוכלים מאכלי חלב?",a:"שבועות",o:["שבועות","פסח","חנוכה","פורים"],e:"🧀"},
  {type:"q",q:"כמה מגילות יש בתנ"ך?",a:"24",o:["24","39","22","27"],e:"📖"},
  {type:"q",q:"מה שם הנשיא הראשון של ישראל?",a:"חיים וייצמן",o:["חיים וייצמן","דוד בן גוריון","יצחק בן צבי","זלמן שזר"],e:"🇮🇱"},
  {type:"clues",clues:["שיחק בסרט 'כנר על הגג' בעולם","שחקן ישראלי עם פרסים בינלאומיים","שמו חיים"],a:"חיים טופול",o:["חיים טופול","שייקה אופיר","אבי גרייניק","ישראל פוליאקוב"],e:"🎭"},
  {type:"clues",clues:["נקרא 'הזמר הישראלי הגדול'","שר 'הו לה לה' ו'צייד'","נפטר ב-2013"],a:"אריק אינשטיין",o:["אריק אינשטיין","שלמה ארצי","יהורם גאון","מאיר אריאל"],e:"🎸"},
  {type:"clues",clues:["מדינאי עם כיפה שחורה על עין","שר ביטחון במלחמת ששת הימים","נולד בקיבוץ דגניה"],a:"משה דיין",o:["משה דיין","יגאל אלון","אריאל שרון","עזר וייצמן"],e:"🎖️"},
  {type:"clues",clues:["שחקנית ישראלית מפורסמת","כיכבה בסרטים קלאסיים ישראליים","שמה מזכיר עיר ועץ"],a:"גילה אלמגור",o:["גילה אלמגור","חנה מרון","דליה פרידלנד","נורית גלרון"],e:"🌹"},
  {type:"clues",clues:["ראש ממשלה ישראלי","זכה בפרס נובל לשלום","נרצח ב-1995"],a:"יצחק רבין",o:["יצחק רבין","שמעון פרס","אהוד ברק","יצחק שמיר"],e:"🕊️"},
  {type:"clues",clues:["זמרת ישראלית אגדית","שרה 'אני חי'","נפטרה צעירה"],a:"אופירה חזה",o:["אופירה חזה","יפה ירקוני","שושנה דמארי","נורית גלרון"],e:"🎤"},
  {type:"clues",clues:["שחקן כדורגל ישראלי","שיחק בצרפת ובספרד","כינויו 'הנמר'"],a:"ערן זהבי",o:["ערן זהבי","יוסי בניון","אבי נמני","רוני רוזנטל"],e:"⚽"},
  {type:"clues",clues:["סופר ישראלי זוכה פרס","כתב 'מר מאני'","ספריו תורגמו לעשרות שפות"],a:"א.ב. יהושע",o:["א.ב. יהושע","עמוס עוז","דוד גרוסמן","משה שמיר"],e:"📚"},
  {type:"clues",clues:["עיר בצפון ישראל","נמצאת על הכרמל","נמל הגדול בישראל"],a:"חיפה",o:["חיפה","עכו","נהריה","טבריה"],e:"🚢"},
  {type:"clues",clues:["חג יהודי","אוכלים אוזני המן","מחפשים משלוח מנות"],a:"פורים",o:["פורים","חנוכה","פסח","שבועות"],e:"🎭"},
],en:[
  {type:"q",q:"Who was the first US President?",a:"George Washington",o:["George Washington","John Adams","Thomas Jefferson","Benjamin Franklin"],e:"🇺🇸"},
  {type:"q",q:"In which year did World War II end?",a:"1945",o:["1945","1944","1946","1943"],e:"🎖️"},
  {type:"q",q:"Who painted the Mona Lisa?",a:"Leonardo da Vinci",o:["Leonardo da Vinci","Michelangelo","Raphael","Rembrandt"],e:"🎨"},
  {type:"q",q:"What is the capital city of France?",a:"Paris",o:["Paris","London","Rome","Berlin"],e:"🗼"},
  {type:"q",q:"Which planet is closest to the sun?",a:"Mercury",o:["Mercury","Venus","Earth","Mars"],e:"🌍"},
  {type:"q",q:"How many days are in a leap year?",a:"366",o:["366","365","364","367"],e:"📅"},
  {type:"q",q:"What ocean is the largest in the world?",a:"Pacific",o:["Pacific","Atlantic","Indian","Arctic"],e:"🌊"},
  {type:"q",q:"In which year did man first land on the moon?",a:"1969",o:["1969","1965","1972","1960"],e:"🌙"},
  {type:"q",q:"Who wrote Romeo and Juliet?",a:"Shakespeare",o:["Shakespeare","Dickens","Austen","Tolstoy"],e:"📚"},
  {type:"q",q:"What is the largest country in the world by area?",a:"Russia",o:["Russia","Canada","China","USA"],e:"🌍"},
  {type:"clues",clues:["British PM in WWII","Famous for V for Victory sign","Said 'We shall never surrender'"],a:"Winston Churchill",o:["Winston Churchill","Franklin Roosevelt","Charles de Gaulle","Dwight Eisenhower"],e:"🎖️"},
  {type:"clues",clues:["Silent film comedian","Wore small mustache, carried cane","His character: 'The Tramp'"],a:"Charlie Chaplin",o:["Charlie Chaplin","Buster Keaton","Harold Lloyd","Stan Laurel"],e:"🎩"},
  {type:"clues",clues:["Called the King of Rock and Roll","Famous for his hip movements","Songs include 'Hound Dog' and 'Jailhouse Rock'"],a:"Elvis Presley",o:["Elvis Presley","Chuck Berry","Jerry Lee Lewis","Buddy Holly"],e:"🕺"},
  {type:"clues",clues:["Physicist, Theory of Relativity","Famous for E=mc²","Wild white hair, violin player"],a:"Albert Einstein",o:["Albert Einstein","Isaac Newton","Nikola Tesla","Charles Darwin"],e:"🧠"},
  {type:"clues",clues:["Hollywood actress, 1950s icon","Sang Happy Birthday to President Kennedy","Famous for her beauty and blonde hair"],a:"Marilyn Monroe",o:["Marilyn Monroe","Audrey Hepburn","Grace Kelly","Elizabeth Taylor"],e:"⭐"},
]};
const NUMBERS=[
  {s:[1,2,3,4,"?"],a:5,o:[5,6,7,8],d:"easy"},
  {s:[2,4,6,8,"?"],a:10,o:[9,10,11,12],d:"easy"},
  {s:[5,10,15,20,"?"],a:25,o:[23,24,25,26],d:"easy"},
  {s:[1,3,5,7,"?"],a:9,o:[8,9,10,11],d:"easy"},
  {s:[10,8,6,4,"?"],a:2,o:[1,2,3,4],d:"easy"},
  {s:[3,6,9,12,"?"],a:15,o:[13,14,15,16],d:"easy"},
  {s:[20,15,10,5,"?"],a:0,o:[0,1,2,3],d:"medium"},
  {s:[100,90,80,70,"?"],a:60,o:[55,60,65,70],d:"medium"},
  {s:[1,2,4,8,"?"],a:16,o:[12,14,16,18],d:"medium"},
  {s:[7,14,21,28,"?"],a:35,o:[30,33,35,42],d:"medium"},
  {s:[2,5,8,11,"?"],a:14,o:[12,13,14,15],d:"medium"},
  {s:[1,4,9,16,"?"],a:25,o:[20,23,25,30],d:"hard"},
  {s:[50,45,40,35,"?"],a:30,o:[28,29,30,31],d:"medium"},
  {s:[1,1,2,3,"?"],a:5,o:[4,5,6,7],d:"hard"},
  {s:[4,8,12,16,"?"],a:20,o:[18,19,20,21],d:"easy"},
  {s:[25,50,75,100,"?"],a:125,o:[120,125,130,115],d:"medium"},
  {s:[10,20,30,40,"?"],a:50,o:[45,50,55,60],d:"easy"},
  {s:[64,32,16,8,"?"],a:4,o:[2,4,6,8],d:"hard"},
  {s:[1,8,27,64,"?"],a:125,o:[100,125,150,216],d:"hard"},
  {s:[3,7,11,15,"?"],a:19,o:[17,18,19,20],d:"medium"},
  {s:[5,4,3,2,"?"],a:1,o:[0,1,2,3],d:"easy"},
  {s:[2,3,5,8,"?"],a:13,o:[11,12,13,14],d:"hard"},
  {s:[9,18,27,36,"?"],a:45,o:[42,44,45,48],d:"medium"},
  {s:[1000,500,250,125,"?"],a:62.5,o:[60,62.5,65,70],d:"hard"},
  {s:[11,22,33,44,"?"],a:55,o:[50,55,60,66],d:"medium"},
  {s:[2,6,18,54,"?"],a:162,o:[108,126,162,216],d:"hard"},
  {s:[100,81,64,49,"?"],a:36,o:[32,36,40,42],d:"hard"},
  {s:[5,10,20,40,"?"],a:80,o:[60,70,80,100],d:"medium"},
  {s:[15,12,9,6,"?"],a:3,o:[0,1,2,3],d:"easy"},
  {s:[1,2,4,7,11,"?"],a:16,o:[14,15,16,17],d:"hard"},
];
const ROOMS_HE=[{n:"מטבח",e:"🍳"},{n:"חדר שינה",e:"🛏️"},{n:"אמבטיה",e:"🚿"},{n:"סלון",e:"🛋️"}];
const ROOMS_EN=[{n:"Kitchen",e:"🍳"},{n:"Bedroom",e:"🛏️"},{n:"Bathroom",e:"🚿"},{n:"Living Room",e:"🛋️"}];
const ROOM_ITEMS={he:[
  {i:"🍳 מחבת",r:"מטבח"},{i:"🛏️ מיטה",r:"חדר שינה"},{i:"🧴 שמפו",r:"אמבטיה"},
  {i:"📺 טלוויזיה",r:"סלון"},{i:"🥄 כף",r:"מטבח"},{i:"🛋️ ספה",r:"סלון"},
  {i:"🪥 מברשת שיניים",r:"אמבטיה"},{i:"🧸 בובה",r:"חדר שינה"},{i:"🍽️ צלחת",r:"מטבח"},
  {i:"🪞 מראה",r:"אמבטיה"},{i:"📚 ספרים",r:"סלון"},{i:"💤 כרית",r:"חדר שינה"},
  {i:"🫖 קומקום",r:"מטבח"},{i:"🧼 סבון",r:"אמבטיה"},{i:"🎵 רמקול",r:"סלון"},
  {i:"🧊 מקרר",r:"מטבח"},{i:"🪑 כורסא",r:"סלון"},{i:"⏰ שעון מעורר",r:"חדר שינה"},
  {i:"🧂 מלח",r:"מטבח"},{i:"📰 עיתון",r:"סלון"},{i:"🪒 גילוח",r:"אמבטיה"},
  {i:"🥘 סיר",r:"מטבח"},{i:"🖼️ ציור",r:"סלון"},{i:"🛁 אמבטיה",r:"אמבטיה"},
  {i:"🌹 אגרטל",r:"סלון"},{i:"🍬 ממתקים",r:"סלון"},{i:"🧺 סל כביסה",r:"אמבטיה"},
  {i:"🍵 כוס תה",r:"מטבח"},{i:"🛌 שמיכה",r:"חדר שינה"},{i:"🧹 מטאטא",r:"מטבח"},
  {i:"💡 מנורה",r:"סלון"},{i:"🪴 עציץ",r:"סלון"},{i:"🧃 מיץ",r:"מטבח"},
  {i:"🪟 וילון",r:"חדר שינה"},{i:"🚿 מקלחת",r:"אמבטיה"},{i:"🍴 מזלג",r:"מטבח"},
  {i:"📷 מצלמה",r:"סלון"},{i:"🧦 גרביים",r:"חדר שינה"},{i:"🫙 צנצנת",r:"מטבח"},
  {i:"🪆 בובת נוי",r:"סלון"},{i:"🛁 ספוג",r:"אמבטיה"},{i:"🍳 טוסטר",r:"מטבח"},
  {i:"📖 ספר",r:"חדר שינה"},{i:"🧴 קרם",r:"אמבטיה"},{i:"☕ מכונת קפה",r:"מטבח"},
  {i:"🖥️ מחשב",r:"סלון"},{i:"🧻 נייר טואלט",r:"אמבטיה"},{i:"🍷 כוס יין",r:"סלון"},
  {i:"🌡️ מד חום",r:"אמבטיה"},{i:"🫕 מחבת גריל",r:"מטבח"},
],en:[
  {i:"🍳 Frying pan",r:"Kitchen"},{i:"🛏️ Bed",r:"Bedroom"},{i:"🧴 Shampoo",r:"Bathroom"},
  {i:"📺 Television",r:"Living Room"},{i:"🥄 Spoon",r:"Kitchen"},{i:"🛋️ Sofa",r:"Living Room"},
  {i:"🪥 Toothbrush",r:"Bathroom"},{i:"🧸 Teddy bear",r:"Bedroom"},{i:"🍽️ Plate",r:"Kitchen"},
  {i:"🪞 Mirror",r:"Bathroom"},{i:"📚 Books",r:"Living Room"},{i:"💤 Pillow",r:"Bedroom"},
  {i:"🫖 Kettle",r:"Kitchen"},{i:"🧼 Soap",r:"Bathroom"},{i:"🎵 Speaker",r:"Living Room"},
  {i:"🧊 Refrigerator",r:"Kitchen"},{i:"🪑 Armchair",r:"Living Room"},{i:"⏰ Alarm clock",r:"Bedroom"},
  {i:"🧂 Salt",r:"Kitchen"},{i:"📰 Newspaper",r:"Living Room"},{i:"🪒 Razor",r:"Bathroom"},
  {i:"🥘 Pot",r:"Kitchen"},{i:"🖼️ Painting",r:"Living Room"},{i:"🛁 Bathtub",r:"Bathroom"},
  {i:"🌹 Vase",r:"Living Room"},{i:"🧺 Laundry basket",r:"Bathroom"},{i:"🍵 Tea cup",r:"Kitchen"},
  {i:"🛌 Blanket",r:"Bedroom"},{i:"💡 Lamp",r:"Living Room"},{i:"🪴 Plant",r:"Living Room"},
  {i:"🍴 Fork",r:"Kitchen"},{i:"📷 Camera",r:"Living Room"},{i:"🧦 Socks",r:"Bedroom"},
  {i:"🫙 Jar",r:"Kitchen"},{i:"📖 Book",r:"Bedroom"},{i:"🧴 Cream",r:"Bathroom"},
  {i:"☕ Coffee machine",r:"Kitchen"},{i:"🖥️ Computer",r:"Living Room"},{i:"🧻 Toilet paper",r:"Bathroom"},
  {i:"🍷 Wine glass",r:"Living Room"},{i:"🌡️ Thermometer",r:"Bathroom"},{i:"🍳 Toaster",r:"Kitchen"},
]};
const RHYTHMS=[{p:[350,350,350],l:"•  •  •"},{p:[600,250,250,600],l:"—  •  •  —"},{p:[250,250,700,250],l:"•  •  —  •"},{p:[450,450,250,250,250],l:"—  —  •  •  •"},{p:[350,700,350],l:"•  —  •"}];

const DAILY_TIPS = {
  he: [
    {icon:"😴", tip:"שינה של 7-9 שעות בלילה מפחיתה סיכון לדמנציה ב-30%"},
    {icon:"🚶", tip:"30 דקות הליכה ביום משפרות זיכרון ותפקוד מוחי"},
    {icon:"🫐", tip:"אוכמניות, אגוזים ואבוקדו מגנים על תאי המוח"},
    {icon:"💧", tip:"שתייה של 8 כוסות מים ביום חיונית לתפקוד המוח"},
    {icon:"🧩", tip:"לימוד משהו חדש כל יום בונה 'רזרבה קוגניטיבית'"},
    {icon:"👥", tip:"קשרים חברתיים מפחיתים סיכון לדמנציה ב-45%"},
    {icon:"🎵", tip:"האזנה למוזיקה אהובה מחזקת זיכרון רגשי"},
    {icon:"🧘", tip:"10 דקות מדיטציה ביום מפחיתות דלקת במוח"},
    {icon:"📖", tip:"קריאה יומית מחזקת את הרשתות הנוירולוגיות"},
    {icon:"🌳", tip:"15 דקות בחוץ ביום מגבירות ויטמין D ומגנות על המוח"},
    {icon:"🍅", tip:"תזונה ים-תיכונית מפחיתה סיכון לאלצהיימר ב-35%"},
    {icon:"✍️", tip:"כתיבת יומן מחזקת זיכרון אפיזודי"},
    {icon:"🎯", tip:"לשחק משחקים כמו אלה שכאן — 10 דקות ביום — מועיל קלינית!"},
    {icon:"🤝", tip:"שיחה עם אנשים אהובים מפחיתה בדידות ומגנה על המוח"},
    {icon:"🥦", tip:"ירקות ירוקים כמו ברוקולי ותרד עשירים בחומרים המגנים על המוח"},
    {icon:"🎨", tip:"יצירה אמנותית — ציור, סריגה, בישול — מפעילה אזורים ייחודיים במוח"},
    {icon:"🚴", tip:"פעילות גופנית סדירה מגדילה נפח ההיפוקמפוס — מרכז הזיכרון"},
    {icon:"☕", tip:"1-2 כוסות קפה ביום קשורות לסיכון נמוך יותר לאלצהיימר"},
    {icon:"🌊", tip:"שחייה משלבת פעילות גופנית וקואורדינציה — מצוינת למוח"},
    {icon:"🎭", tip:"צפייה בתיאטרון, קולנוע ואמנות מפעילה רשתות רגשיות ויצירתיות"},
    {icon:"🧠", tip:"למד שיר חדש בעל פה — אחת הפעילויות הטובות ביותר לזיכרון"},
    {icon:"🌸", tip:"גינון מפחית מתח, מגביר תנועה, ומחבר לטבע — שלישיית מנצחים"},
    {icon:"📞", tip:"התקשר לחבר ישן — חיבורים חברתיים פעילים מגנים על המוח"},
    {icon:"🍳", tip:"בישול מתכון חדש משלב תכנון, זיכרון, ויצירתיות — מצוין למוח"},
    {icon:"🌅", tip:"צפה בשקיעה בחוץ — האור הטבעי מסנכרן את השעון הביולוגי שלך"},
    {icon:"💃", tip:"ריקוד — גם בבית — משלב מוזיקה, תנועה וזיכרון מוטורי"},
    {icon:"🎲", tip:"שחמט, שש-בש, ופאזלים — משחקי אסטרטגיה מפעילים חשיבה מתוכננת"},
    {icon:"🍵", tip:"תה ירוק עשיר בנוגדי חמצון המגנים על תאי המוח"},
    {icon:"😂", tip:"צחוק מפחית קורטיזול ומגביר אנדורפינים — טוב למוח ולנפש!"},
    {icon:"🙏", tip:"תרגיל כפיים: ספור אחורה מ-100 ב-7 — מאמן ריכוז וחישוב"},
    {icon:"🌻", tip:"הביטו בתמונות ישנות — זיכרון חזותי מגרה רשתות נוסטלגיה במוח"},
    {icon:"🎸", tip:"לנגן כלי נגינה — גם בסיסי — הוא אחד האימונים הטובים ביותר למוח"},
  ],
  en: [
    {icon:"😴", tip:"7-9 hours of sleep per night reduces dementia risk by 30%"},
    {icon:"🚶", tip:"30 minutes of walking daily improves memory and brain function"},
    {icon:"🫐", tip:"Blueberries, walnuts and avocado protect brain cells"},
    {icon:"💧", tip:"Drinking 8 glasses of water daily is vital for brain function"},
    {icon:"🧩", tip:"Learning something new every day builds 'cognitive reserve'"},
    {icon:"👥", tip:"Social connections reduce dementia risk by 45%"},
    {icon:"🎵", tip:"Listening to favorite music strengthens emotional memory"},
    {icon:"🧘", tip:"10 minutes of meditation daily reduces brain inflammation"},
    {icon:"📖", tip:"Daily reading strengthens neurological networks"},
    {icon:"🌳", tip:"15 minutes outdoors daily boosts Vitamin D and protects the brain"},
    {icon:"🍅", tip:"Mediterranean diet reduces Alzheimer's risk by 35%"},
    {icon:"✍️", tip:"Keeping a journal strengthens episodic memory"},
    {icon:"🎯", tip:"Playing games like these — 10 minutes daily — is clinically proven!"},
    {icon:"🤝", tip:"Talking with loved ones reduces loneliness and protects the brain"},
    {icon:"🥦", tip:"Green vegetables like broccoli and spinach protect brain cells"},
    {icon:"🎨", tip:"Creative activities — painting, knitting, cooking — activate unique brain areas"},
    {icon:"🚴", tip:"Regular exercise grows the hippocampus — your brain's memory center"},
    {icon:"☕", tip:"1-2 cups of coffee daily is linked to lower Alzheimer's risk"},
    {icon:"😂", tip:"Laughter reduces cortisol and boosts endorphins — great for brain and soul!"},
    {icon:"🎲", tip:"Chess, puzzles, and strategy games activate planning and memory"},
    {icon:"💃", tip:"Dancing combines music, movement and motor memory — wonderful for the brain"},
    {icon:"📞", tip:"Call an old friend — active social connections protect the brain"},
  ],
};

// ── Lang Screen ───────────────────────────────────────────────────────────────
function LangScreen({ onSelect }) {
  const [sel, setSel] = useState(null);
  return (
    <div className="screen" style={{display:"flex",flexDirection:"column",justifyContent:"center",minHeight:"100vh"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <h1 className="app-title">Cogni<span>Play</span></h1>
        <p style={{fontSize:16,color:"#8B7E74",fontWeight:600,marginTop:6}}>🧠 משחקים שמחזקים את המוח</p>
      </div>
      {[{c:"he",f:"🇮🇱",l:"עברית"},{c:"en",f:"🇺🇸",l:"English"},{c:"ar",f:"🇸🇦",l:"العربية",dis:true},{c:"ru",f:"🇷🇺",l:"Русский",dis:true}].map(x=>(
        <button key={x.c} className={`lang-btn${sel===x.c?" sel":""}`} style={{opacity:x.dis?.4:1}} onClick={()=>!x.dis&&setSel(x.c)} disabled={x.dis}>
          <span style={{fontSize:30}}>{x.f}</span><span style={{flex:1}}>{x.l}</span>
          {x.dis&&<span style={{fontSize:12,color:"#8B7E74"}}>בקרוב</span>}
        </button>
      ))}
      <button className="btn btn-sun" style={{marginTop:24}} onClick={()=>sel&&onSelect(sel)} disabled={!sel}>
        {sel?(sel==="he"?"בואו נתחיל! →":"Let's Go! →"):"↑ בחרו שפה"}
      </button>
    </div>
  );
}

// ── Menu ──────────────────────────────────────────────────────────────────────
function MenuScreen({ t, lang, streak, name, onSelect }) {
  const isHe = lang==="he";
  const games=[{id:"speed",e:"⚡",c:"#FFF3E0",l:t.speed,s:isHe?"מה השתנה?":"What changed?"},{id:"memory",e:"🃏",c:"#E3F2FD",l:t.memory,s:isHe?"מצא זוגות":"Find pairs"},{id:"language",e:"💬",c:"#E8F5E9",l:t.language,s:isHe?"השלם":"Complete"},{id:"music",e:"🎵",c:"#F3E5F5",l:t.music,s:isHe?"שירים":"Songs"},{id:"trivia",e:"🏆",c:"#FFF8E1",l:t.trivia,s:isHe?"ידע ישראלי":"Quiz"},{id:"numbers",e:"🔢",c:"#E0F7FA",l:t.numbers,s:isHe?"סדרות":"Sequences"},{id:"sorting",e:"🏠",c:"#FCE4EC",l:t.sorting,s:isHe?"לאיזה חדר?":"Which room?"},{id:"animal",e:"🐾",c:"#F1F8E9",l:isHe?"בעלי חיים":"Animals",s:isHe?"מי זה?":"Who's this?"},{id:"together",e:"👥",c:"#FFF9C4",l:t.together,s:isHe?"עם משפחה":"With family"},{id:"chat",e:"🤖",c:"#E8F5E9",l:t.chat,s:"CogniBot"},{id:"family",e:"📊",c:"#F5F5F5",l:t.family,s:isHe?"מעקב":"Track"}];
  const greeting = name ? (isHe ? `שלום, ${name}! 👋` : `Hello, ${name}! 👋`) : (isHe?"שלום! 👋":"Hello! 👋");
  return (
    <div className="screen" style={{direction:t.dir}}>
      <p style={{fontSize:18,fontWeight:800,color:"#FF9F43",marginBottom:12}}>{greeting}</p>
      <div className="daily-hero" onClick={()=>onSelect("daily")}>
        <div className="streak-badge">🔥 {streak} {t.streak}</div>
        <div className="daily-title">☀️ {t.dailyTitle}</div>
        <div className="daily-sub">{t.dailySub}</div>
        <button className="btn btn-ghost" style={{marginTop:12,fontSize:16,padding:"12px 20px"}} onClick={e=>{e.stopPropagation();onSelect("daily");}}>
          {isHe?"התחל אתגר! →":"Start Challenge! →"}
        </button>
      </div>
      <p style={{fontSize:15,fontWeight:800,color:"#8B7E74",marginBottom:12}}>{t.chooseGame}</p>
      <div className="game-grid">
        {games.map(g=>(
          <div key={g.id} className="game-card" style={{background:g.c}} onClick={()=>onSelect(g.id)}>
            <span className="gc-icon">{g.e}</span>
            <div className="gc-label">{g.l}</div>
            <div className="gc-sub">{g.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Name Screen ───────────────────────────────────────────────────────────────
function NameScreen({ lang, onDone }) {
  const isHe = lang==="he";
  const [name, setName] = useState("");
  const [gender, setGender] = useState(null); // "m" | "f"
  return (
    <div className="screen" style={{direction:T[lang].dir,display:"flex",flexDirection:"column",justifyContent:"center",minHeight:"100vh"}}>
      <span className="big-e">👋</span>
      <h2 style={{fontFamily:"Fredoka,sans-serif",fontSize:30,textAlign:"center",marginBottom:8}}>
        {isHe?"איך קוראים לך?":"What's your name?"}
      </h2>
      <p style={{fontSize:16,color:"#8B7E74",fontWeight:600,textAlign:"center",marginBottom:24}}>
        {isHe?"כדי שנוכל לקרוא לך בשם 😊":"So we can greet you personally 😊"}
      </p>
      <input
        value={name}
        onChange={e=>setName(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&name.trim()&&gender&&onDone(name.trim(),gender)}
        placeholder={isHe?"שם פרטי...":"Your name..."}
        style={{border:"2.5px solid #E8E0D8",borderRadius:16,padding:"18px 20px",fontSize:22,fontFamily:"Nunito,sans-serif",outline:"none",background:"white",textAlign:"center",width:"100%",marginBottom:16,direction:T[lang].dir}}
        autoFocus
      />
      {isHe && (
        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <button onClick={()=>setGender("f")} style={{
            flex:1,padding:"16px",fontSize:20,fontWeight:800,borderRadius:16,cursor:"pointer",fontFamily:"Fredoka,sans-serif",border:`2.5px solid ${gender==="f"?"#FF9F43":"#E8E0D8"}`,background:gender==="f"?"#FFF3E0":"white",color:gender==="f"?"#F08000":"#2D2A26"
          }}>👩 נקבה</button>
          <button onClick={()=>setGender("m")} style={{
            flex:1,padding:"16px",fontSize:20,fontWeight:800,borderRadius:16,cursor:"pointer",fontFamily:"Fredoka,sans-serif",border:`2.5px solid ${gender==="m"?"#54A0FF":"#E8E0D8"}`,background:gender==="m"?"#E3F2FD":"white",color:gender==="m"?"#1464B4":"#2D2A26"
          }}>👨 זכר</button>
        </div>
      )}
      <button className="btn btn-sun" onClick={()=>{onDone(name.trim(), gender||"m");}} disabled={isHe&&!gender}>
        {isHe?"בואו נתחיל! →":"Let's Go! →"}
      </button>
      <button className="btn btn-ghost" onClick={()=>onDone("", gender||"m")} style={{fontSize:15}}>
        {isHe?"דלג":"Skip"}
      </button>
    </div>
  );
}
// ── Daily Challenge ──────────────────────────────────────────────────────────
// buildDailySteps defined outside component to avoid recreation
function buildDailySteps(lang) {
  return [
    {game:"speed",    data:shuffle(lang==="he"?SPEED_HE:SPEED_EN).slice(0,3)},
    {game:"language", data:shuffle(SENTENCES[lang]).slice(0,3)},
    {game:"music",    data:shuffle(SONGS[lang]).slice(0,3)},
    {game:"animal",   data:shuffle(lang==="he"?ANIMALS_HE:ANIMALS_EN).slice(0,2)},
    {game:"trivia",   data:shuffle(TRIVIA[lang]).slice(0,3)},
    {game:"numbers",  data:shuffle(NUMBERS).slice(0,2)},
    {game:"sorting",  data:shuffle(ROOM_ITEMS[lang]).slice(0,3)},
  ];
}

function DailyChallenge({ t, lang, name, gender="m", onBack, onComplete }) {
  const isHe = lang==="he";
  const isRtl = T[lang].dir==="rtl";

  // ALL hooks declared at top - never conditionally
  const [started,   setStarted]   = useState(false);
  const [steps]     = useState(()=>buildDailySteps(lang));
  const [stepIdx,   setStepIdx]   = useState(0);
  const [qIdx,      setQIdx]      = useState(0);
  const [score,     setScore]     = useState(0);
  const [isDone,    setIsDone]    = useState(false);
  const [chosen,    setChosen]    = useState(null);
  const [phase,     setPhase]     = useState("before");
  const [clueLevel, setClueLevel] = useState(0);
  const msgIdx = useRef(Math.floor(Math.random()*7));

  const si   = Math.min(stepIdx, steps.length-1);
  const qi   = Math.min(qIdx, steps[si].data.length-1);
  const step = steps[si];
  const item = step.data[qi];
  const total = steps.reduce((s,x)=>s+x.data.length, 0);
  const doneCount = steps.slice(0,si).reduce((s,x)=>s+x.data.length, 0) + qi;
  const pct = Math.round((doneCount/total)*100);
  const gameEmoji = {speed:"⚡",language:"💬",music:"🎵",trivia:"🏆",numbers:"🔢",sorting:"🏠"};

  useEffect(()=>{
    if(!started) return;
    setChosen(null); setClueLevel(0); setPhase("before");
  },[si, qi]); // eslint-disable-line

  useEffect(()=>{
    if(!started || step.game!=="speed" || isDone || chosen) return;
    if(phase==="before"){const x=setTimeout(()=>setPhase("img1"),700); return()=>clearTimeout(x);}
    if(phase==="img1")  {const x=setTimeout(()=>setPhase("img2"),1800);return()=>clearTimeout(x);}
    if(phase==="img2")  {const x=setTimeout(()=>setPhase("ans"), 900); return()=>clearTimeout(x);}
  },[phase, step.game, isDone, chosen, started]);

  const advance = (pts) => {
    setScore(s=>s+pts);
    const nq = qIdx+1;
    if(nq >= step.data.length){
      const ns = stepIdx+1;
      if(ns >= steps.length) setIsDone(true);
      else { setStepIdx(ns); setQIdx(0); }
    } else setQIdx(nq);
  };

  const pick2 = (opt, ans) => {
    if(chosen) return;
    playClick();
    setChosen(opt);
    if(opt===ans) sayCorrect(lang); else sayWrong(lang);
    setTimeout(()=>advance(opt===ans?10:0), 1100);
  };

  const optBtn = (opt, ans) => {
    let cls = `opt${isRtl?"":" opt-ltr"}`;
    if(chosen===opt) cls += opt===ans?" opt-correct":" opt-wrong";
    else if(chosen&&opt===ans) cls += " opt-reveal";
    return <button key={opt} className={cls} onClick={()=>pick2(opt,ans)}>{opt}</button>;
  };

  const tipIdx = useRef(Math.floor(Math.random()*14));
  const tip = DAILY_TIPS[lang][tipIdx.current % DAILY_TIPS[lang].length];

  // Start screen
  if(!started) return(
    <div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center",minHeight:"100vh"}}>
      <span style={{fontSize:72,display:"block",marginBottom:12}}>☀️</span>
      <h2 style={{fontFamily:"Fredoka,sans-serif",fontSize:28,marginBottom:6}}>
        {name ? (isHe?`שלום ${name}! 👋`:`Hello ${name}! 👋`) : (isHe?"שלום! 👋":"Hello! 👋")}
      </h2>
      {/* טיפ יומי */}
      <div style={{background:"#FFF8F0",border:"2px solid #FFD08A",borderRadius:18,padding:"14px 18px",margin:"14px 0 20px",textAlign:"center"}}>
        <p style={{fontSize:22,marginBottom:6}}>{tip.icon}</p>
        <p style={{fontSize:14,fontWeight:700,color:"#2D2A26",lineHeight:1.5}}>{isHe?"💡 טיפ בריאות יומי:":"💡 Daily Health Tip:"}</p>
        <p style={{fontSize:15,fontWeight:600,color:"#8B7E74",lineHeight:1.5,marginTop:4}}>{tip.tip}</p>
      </div>
      <button className="btn btn-sun" style={{fontSize:20,padding:"18px"}} onClick={()=>{
        playStart();
        speakDailyStart(lang, name, gender);
        showToast(name?(isHe?`בהצלחה ${name}! 🚀`:`Good luck ${name}! 🚀`):(isHe?"בהצלחה! 🚀":"Good luck! 🚀"), "#FF9F43");
        // המתן 3 שניות לפני שמתחילות השאלות
        setTimeout(()=>setStarted(true), 3000);
      }}>
        {isHe?"בואו נתחיל! 🚀":"Let's Go! 🚀"}
      </button>
      <button className="btn btn-ghost" style={{marginTop:8,fontSize:16}} onClick={onBack}>{t.back}</button>
    </div>
  );

  // Encouragement messages
  const encHe = [
    `כל הכבוד${name?" "+name:""}! סיימת את האתגר היומי שלך!`,
    `מדהים${name?" "+name:""}! המוח שלך עבד קשה היום!`,
    `ממש התרגשתי ממך${name?" "+name:""}! כל הכבוד!`,
    `${name?name+",":" "}היום עשית משהו נפלא לבריאות המוח שלך!`,
    `עשית עבודה נפלאה${name?" "+name:""}! המשיכי כך!`,
    `${name||"כל הכבוד"}! הצלחת לסיים את האתגר היומי!`,
    `איזה יום נפלא${name?" "+name:""}! כל הכבוד על ההתמדה!`,
  ];
  const encEn = [
    `Well done${name?" "+name:""}! You completed your daily challenge!`,
    `Amazing${name?" "+name:""}! Your brain worked hard today!`,
    `I'm so proud of you${name?" "+name:""}! Keep it up!`,
    `${name?name+",":" "}today you did something great for your brain!`,
    `Wonderful job${name?" "+name:""}! You finished the daily challenge!`,
    `${name||"You"} are absolutely wonderful! Well done!`,
    `Fantastic${name?" "+name:""}! See you tomorrow!`,
  ];
  const msg = isHe ? encHe[msgIdx.current%encHe.length] : encEn[msgIdx.current%encEn.length];

  if(isDone) return(
    <div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <span className="big-e">🎊</span>
      <p style={{fontSize:22,fontWeight:900,color:"#2D2A26",lineHeight:1.4,marginBottom:12}}>{msg}</p>
      <p style={{fontSize:16,color:"#8B7E74",fontWeight:700,marginBottom:24}}>
        {isHe?`ניקוד: ${score} 🌟`:`Score: ${score} 🌟`}
      </p>
      <button className="btn btn-sun" onClick={()=>{
        playDone();
        const doneMsg = msg;
        setTimeout(()=>showToast(doneMsg, "#FF9F43"), 500);
        setTimeout(()=>speakDailyDone(lang, name, gender), 1000);
        setTimeout(()=>onComplete(score), 3200);
      }}>
        {isHe?"חזרה לתפריט 🏠":"Back to Menu 🏠"}
      </button>
    </div>
  );

  // Render question
  const renderQ = () => {
    if(step.game==="speed") return(
      <div>
        <p style={{fontSize:18,fontWeight:800,textAlign:"center",marginBottom:12,color:"#2D2A26"}}>
          {phase==="before"?"...":phase==="img1"?(isHe?"זכור...":"Remember..."):phase==="img2"?(isHe?"מה השתנה?":"What changed?"):t.whatChanged}
        </p>
        <div className="speed-area">
          <div style={{display:"flex",gap:16,fontSize:44,justifyContent:"center"}}>
            {phase==="img1"&&item.a.map((e,i)=><span key={i}>{e}</span>)}
            {phase==="img2"&&item.b.map((e,i)=><span key={i}>{e}</span>)}
            {(phase==="before"||phase==="ans")&&<span style={{color:"#DDD",fontSize:30}}>• • • •</span>}
          </div>
        </div>
        {phase==="ans"&&item.opts.map(o=>optBtn(o,item.ans))}
      </div>
    );
    if(step.game==="language") return(
      <div>
        <div className="card card-sun" style={{textAlign:"center",marginBottom:14}}><p style={{fontSize:21,fontWeight:900,lineHeight:1.5}}>{item.p}</p></div>
        {shuffle(item.o).map(o=>optBtn(o,item.a))}
      </div>
    );
    if(step.game==="music") return(
      <div>
        <div className="card card-sun" style={{textAlign:"center",marginBottom:14}}>
          <span style={{fontSize:40}}>{item.e}</span>
          <p style={{fontSize:12,color:"#8B7E74",fontWeight:700,margin:"4px 0 8px"}}>🎵 {item.t}</p>
          <p style={{fontSize:20,fontWeight:900,lineHeight:1.5}}>{item.l}</p>
        </div>
        {shuffle(item.o).map(o=>optBtn(o,item.a))}
      </div>
    );
    if(step.game==="trivia"){
      const isClue=item.type==="clues";
      return(
        <div>
          <div className="card card-sun" style={{textAlign:"center",marginBottom:14}}>
            <span style={{fontSize:44}}>{item.e}</span>
            {!isClue&&<p style={{fontSize:19,fontWeight:900,marginTop:8,lineHeight:1.4}}>{item.q}</p>}
            {isClue&&item.clues.slice(0,clueLevel+1).map((c,i)=>(
              <div key={i} className={`clue-box${i===clueLevel?" clue-new":""}`}>{i+1}. {c}</div>
            ))}
            {isClue&&clueLevel<2&&!chosen&&(
              <button onClick={()=>setClueLevel(l=>l+1)} style={{background:"none",border:"2px solid #FF9F43",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",marginTop:8,color:"#F08000",fontFamily:"Nunito,sans-serif"}}>+ {t.clueBtn}</button>
            )}
          </div>
          {shuffle(item.o).map(o=>optBtn(o,item.a))}
        </div>
      );
    }
    if(step.game==="numbers"){
      const df={easy:{he:"קל",en:"Easy",c:"#1DD1A1"},medium:{he:"בינוני",en:"Medium",c:"#FF9F43"},hard:{he:"מאתגר",en:"Challenge",c:"#FF6B6B"}};
      const d=df[item.d]||df.easy;
      return(
        <div>
          <div className="card card-sky" style={{textAlign:"center",marginBottom:14}}>
            <span style={{fontSize:11,fontWeight:800,color:d.c,display:"block",marginBottom:6}}>● {isHe?d.he:d.en}</span>
            <div className="seq-box">
              {item.s.map((n,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:3}}><div className={`seq-num${n==="?"?" seq-q":""}`}>{n}</div>{i<item.s.length-1&&<span className="seq-arr">→</span>}</div>))}
            </div>
            <p style={{fontSize:16,fontWeight:800,marginTop:8}}>{isHe?"מה הבא?":"What's next?"}</p>
          </div>
          <div className="num-grid">
            {item.o.map(opt=>{let cls="num-btn";if(chosen===opt)cls+=opt===item.a?" num-correct":" num-wrong";else if(chosen!==null&&opt===item.a)cls+=" num-reveal";return <button key={opt} className={cls} onClick={()=>pick2(opt,item.a)}>{opt}</button>;})}
          </div>
        </div>
      );
    }
    if(step.game==="sorting"){
      const rooms=isHe?ROOMS_HE:ROOMS_EN;
      return(
        <div>
          <div className="card card-green" style={{textAlign:"center",marginBottom:14}}>
            <p style={{fontSize:44,marginBottom:6}}>{item.i.split(" ")[0]}</p>
            <p style={{fontSize:20,fontWeight:900}}>{item.i}</p>
            <p style={{fontSize:14,color:"#8B7E74",fontWeight:600,marginTop:4}}>{t.whichRoom}</p>
          </div>
          <div className="room-grid">
            {rooms.map(room=>{let cls="room-btn";if(chosen===room.n)cls+=room.n===item.r?" room-correct":" room-wrong";else if(chosen&&room.n===item.r)cls+=" room-reveal";return(<button key={room.n} className={cls} onClick={()=>pick2(room.n,item.r)}><span style={{fontSize:30}}>{room.e}</span><span style={{fontSize:13,fontWeight:800,color:"#2D2A26"}}>{room.n}</span></button>);})}
          </div>
        </div>
      );
    }
    if(step.game==="animal"){
      const [imgLoaded, setImgLoaded] = [false, ()=>{}]; // simple fallback
      return(
        <div>
          <div style={{borderRadius:20,overflow:"hidden",marginBottom:14,height:200,background:"#F5F0EB",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            <span style={{fontSize:70,position:"absolute"}}>{item.emoji}</span>
            <img src={item.img} alt="animal" style={{width:"100%",height:200,objectFit:"cover",borderRadius:20}}
              onError={e=>{e.target.style.display="none";}}
            />
          </div>
          <p style={{textAlign:"center",fontSize:20,fontWeight:800,marginBottom:14}}>
            {isHe?"מה בעל החיים הזה?":"What animal is this?"}
          </p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {shuffle(item.opts).map(opt=>optBtn(opt,item.name))}
          </div>
        </div>
      );
    }
    return null;
  };

  return(
    <div className="screen" style={{direction:t.dir}}>
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>{t.back}</button>
        <div className="score-pill">⭐ {score}</div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:14,fontWeight:700,color:"#8B7E74"}}>{gameEmoji[step.game]} {t[step.game]}</span>
          <span style={{fontSize:14,fontWeight:700,color:"#8B7E74"}}>{doneCount}/{total}</span>
        </div>
        <div className="prog-wrap"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
      </div>
      {renderQ()}
    </div>
  );
}


// ── Speed Game ────────────────────────────────────────────────────────────────
function SpeedGame({ t, lang, onBack }) {
  const [pool]   = useState(()=>shuffle(lang==="he"?SPEED_HE:SPEED_EN));
  const [phase,   setPhase]  = useState("before");
  const [round,   setRound]  = useState(0);
  const [score,   setScore]  = useState(0);
  const [chosen,  setChosen] = useState(null);
  const [done,    setDone]   = useState(false);
  const total=5; const cur=pool[round%pool.length]; const isRtl=T[lang].dir==="rtl";
  useEffect(()=>{
    if(done)return;
    if(phase==="before"){const x=setTimeout(()=>setPhase("img1"),600);return()=>clearTimeout(x);}
    if(phase==="img1"){const x=setTimeout(()=>setPhase("img2"),2000);return()=>clearTimeout(x);}
    if(phase==="img2"){const x=setTimeout(()=>setPhase("ans"),1000);return()=>clearTimeout(x);}
  },[phase,done]);
  const handle=(opt)=>{if(chosen)return;playClick();setChosen(opt);if(opt===cur.ans){setScore(s=>s+10);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{setChosen(null);if(round+1>=total){setDone(true);sayDone(lang);}else{setRound(r=>r+1);setPhase("before");}},1200);};
  if(done)return(<div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">⚡</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {score}/{total*10}</p><button className="btn btn-sun" onClick={()=>{setRound(0);setScore(0);setDone(false);setPhase("before");setChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
  return(<div className="screen" style={{direction:t.dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">⚡ {t.speed}</h2><p className="pl">{round+1}/{total}</p><div className="speed-area"><div style={{display:"flex",gap:16,fontSize:46,justifyContent:"center"}}>{phase==="img1"&&cur.a.map((e,i)=><span key={i}>{e}</span>)}{phase==="img2"&&cur.b.map((e,i)=><span key={i}>{e}</span>)}{(phase==="before"||phase==="ans")&&<span style={{color:"#DDD",fontSize:32}}>• • • •</span>}</div></div><p style={{textAlign:"center",fontSize:16,fontWeight:700,color:"#8B7E74",marginBottom:12}}>{phase==="before"?" ":phase==="img1"?(lang==="he"?"זכור...":"Remember..."):phase==="img2"?(lang==="he"?"מה השתנה?":"What changed?"):t.whatChanged}</p>{phase==="ans"&&shuffle(cur.opts).map(opt=>{let cls=`opt${isRtl?"":" opt-ltr"}`;if(chosen===opt)cls+=opt===cur.ans?" opt-correct":" opt-wrong";else if(chosen&&opt===cur.ans)cls+=" opt-reveal";return <button key={opt} className={cls} onClick={()=>handle(opt)}>{opt}</button>;})}</div>);
}

// ── Memory Game ───────────────────────────────────────────────────────────────
function MemoryGame({ t, lang, onBack }) {
  const mk=()=>{const s=EMOJI_SETS[Math.floor(Math.random()*EMOJI_SETS.length)];return shuffle([...s,...s]).map((e,i)=>({id:i,e,st:"hidden"}));};
  const [cards,setCards]=useState(mk);const [fl,setFl]=useState([]);const [score,setScore]=useState(0);const [moves,setMoves]=useState(0);
  const matched=cards.filter(c=>c.st==="matched").length;const done=matched===cards.length;
  const flip=(id)=>{if(fl.length===2)return;const card=cards.find(c=>c.id===id);if(card.st!=="hidden")return;const nc=cards.map(c=>c.id===id?{...c,st:"shown"}:c);setCards(nc);const nf=[...fl,id];setFl(nf);if(nf.length===2){setMoves(m=>m+1);const[a,b]=nf.map(fid=>nc.find(c=>c.id===fid));if(a.e===b.e){setTimeout(()=>{setCards(p=>p.map(c=>nf.includes(c.id)?{...c,st:"matched"}:c));setFl([]);setScore(s=>s+10);},500);}else{setTimeout(()=>{setCards(p=>p.map(c=>nf.includes(c.id)?{...c,st:"hidden"}:c));setFl([]);},900);}}};
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">🃏 {t.memory}</h2>{done?(<div style={{textAlign:"center",marginTop:32}}><span className="big-e">🎊</span><p style={{fontSize:18,fontWeight:800,marginBottom:16}}>{t.done} — {moves} {lang==="he"?"מהלכים":"moves"}</p><button className="btn btn-sun" onClick={()=>{setCards(mk());setFl([]);setScore(0);setMoves(0);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>):(<div className="mem-grid">{cards.map(card=>(<button key={card.id} className={`mem-card mem-${card.st}`} onClick={()=>flip(card.id)}>{card.st!=="hidden"?card.e:""}</button>))}</div>)}</div>);
}

// ── Language Game ─────────────────────────────────────────────────────────────
function LanguageGame({ t, lang, onBack }) {
  const all=SENTENCES[lang];const isRtl=T[lang].dir==="rtl";
  const [pool,setPool]=useState(()=>shuffle(all).slice(0,6));const [idx,setIdx]=useState(0);const [chosen,setChosen]=useState(null);const [score,setScore]=useState(0);const [done,setDone]=useState(false);
  const cur=pool[idx];
  const handle=(opt)=>{if(chosen)return;playClick();setChosen(opt);if(opt===cur.a){setScore(s=>s+10);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{if(idx+1<pool.length){setIdx(i=>i+1);setChosen(null);}else{setDone(true);sayDone(lang);}},1200);};
  if(done)return(<div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🎊</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {score}/{pool.length*10}</p><button className="btn btn-green" onClick={()=>{setPool(shuffle(all).slice(0,6));setIdx(0);setScore(0);setDone(false);setChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
  return(<div className="screen" style={{direction:t.dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">💬 {t.language}</h2><p className="pl">{idx+1}/{pool.length}</p><div className="card card-green" style={{textAlign:"center",marginBottom:14}}><p style={{fontSize:24,fontWeight:900,lineHeight:1.5}}>{cur.p}</p></div>{shuffle(cur.o).map(opt=>{let cls=`opt${isRtl?"":" opt-ltr"}`;if(chosen===opt)cls+=opt===cur.a?" opt-correct":" opt-wrong";else if(chosen&&opt===cur.a)cls+=" opt-reveal";return <button key={opt} className={cls} onClick={()=>handle(opt)}>{opt}</button>;})}</div>);
}

// ── Music Game ────────────────────────────────────────────────────────────────
const RHYTHM_MAX=5;
function MusicGame({ t, lang, onBack }) {
  const isRtl=T[lang].dir==="rtl";const allSongs=SONGS[lang];
  const [mode,setMode]=useState("menu");
  const [songPool,setSongPool]=useState(()=>shuffle(allSongs));const [songIdx,setSongIdx]=useState(0);const [sChosen,setSChosen]=useState(null);const [sScore,setSScore]=useState(0);
  const [rRound,setRRound]=useState(0);const [rPhase,setRPhase]=useState("idle");const [rBeat,setRBeat]=useState(false);const [rTaps,setRTaps]=useState(0);const [rScore,setRScore]=useState(0);const [rResult,setRResult]=useState(null);const [rDone,setRDone]=useState(false);
  const tapsRef=useRef([]);const patRef=useRef([]);const ctxRef=useRef(null);
  const SONGS_N=6;const sDone=songIdx>=SONGS_N;const cur=songPool[songIdx%songPool.length];
  const getCtx=useCallback(()=>{if(!ctxRef.current||ctxRef.current.state==="closed")ctxRef.current=new(window.AudioContext||window.webkitAudioContext)();if(ctxRef.current.state==="suspended")ctxRef.current.resume();return ctxRef.current;},[]);
  const handleSong=(opt)=>{if(sChosen)return;playClick();setSChosen(opt);if(opt===cur.a){setSScore(s=>s+10);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{setSChosen(null);setSongIdx(i=>i+1);},1400);};
  const playRhythm=useCallback(()=>{const{p:pat}=RHYTHMS[rRound%RHYTHMS.length];patRef.current=pat;setRPhase("playing");setRBeat(false);setRTaps(0);tapsRef.current=[];setRResult(null);try{const ctx=getCtx();let at=ctx.currentTime+0.2,vm=200;pat.forEach(dur=>{const t1=at,f1=vm;const o1=ctx.createOscillator(),g1=ctx.createGain();o1.connect(g1);g1.connect(ctx.destination);o1.type="square";o1.frequency.value=520;g1.gain.setValueAtTime(0.6,t1);g1.gain.exponentialRampToValueAtTime(.001,t1+.22);o1.start(t1);o1.stop(t1+.24);const o2=ctx.createOscillator(),g2=ctx.createGain();o2.connect(g2);g2.connect(ctx.destination);o2.type="sine";o2.frequency.value=160;g2.gain.setValueAtTime(0.7,t1);g2.gain.exponentialRampToValueAtTime(.001,t1+.16);o2.start(t1);o2.stop(t1+.18);setTimeout(()=>{setRBeat(true);setTimeout(()=>setRBeat(false),240);},f1);at+=(dur+160)/1000;vm+=dur+160;});setTimeout(()=>setRPhase("input"),vm+350);}catch(e){setTimeout(()=>setRPhase("input"),2500);}},[rRound,getCtx]);
  const playTap=useCallback(()=>{try{const ctx=getCtx();if(ctx.state==="suspended")ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type="triangle";o.frequency.value=280;const now=ctx.currentTime;g.gain.setValueAtTime(0.7,now);g.gain.exponentialRampToValueAtTime(.001,now+.2);o.start(now);o.stop(now+.2);}catch(e){}},[getCtx]);
  const handleTap=()=>{if(rPhase!=="input")return;playTap();const now=Date.now();tapsRef.current=[...tapsRef.current,now];const taps=tapsRef.current,pat=patRef.current;setRTaps(taps.length);if(taps.length>=pat.length){const tg=taps.slice(1).map((x,i)=>x-taps[i]),bg=pat.slice(1).map((d,i)=>pat[i]+160+d);let good=0;tg.forEach((g,i)=>{if(!bg[i])return;const r=g/bg[i];if(r>.4&&r<1.6)good++;});const pct=tg.length>0?good/tg.length:1;const res=pct>=.6?"good":pct>=.3?"ok":"miss";const pts=res==="good"?10:res==="ok"?5:0;setTimeout(()=>{setRResult(res);setRScore(s=>s+pts);setRPhase("result");setTimeout(()=>{setRResult(null);setRPhase("idle");if(rRound+1>=RHYTHM_MAX)setRDone(true);else setRRound(r=>r+1);},1800);},400);}};
  const curR=RHYTHMS[rRound%RHYTHMS.length];
  const circCls=`rhythm-circle ${rBeat?"rh-play":rPhase==="input"?"rh-input":rPhase==="result"?`rh-${rResult||"idle"}`:"rh-idle"}`;
  if(mode==="menu")return(<div className="screen" style={{direction:t.dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button></div><h2 className="st">🎵 {t.music}</h2><div className="card card-sun" style={{textAlign:"center",cursor:"pointer",marginBottom:14}} onClick={()=>setMode("songs")}><span style={{fontSize:44,display:"block",marginBottom:8}}>🎤</span><p style={{fontSize:18,fontWeight:800}}>{lang==="he"?"השלם את השיר":"Complete the song"}</p></div><div className="card card-green" style={{textAlign:"center",cursor:"pointer"}} onClick={()=>setMode("rhythm")}><span style={{fontSize:44,display:"block",marginBottom:8}}>🥁</span><p style={{fontSize:18,fontWeight:800}}>{lang==="he"?"חיקוי קצב":"Rhythm Echo"}</p></div></div>);
  if(mode==="songs"){if(sDone)return(<div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🎤</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {sScore}/{SONGS_N*10}</p><button className="btn btn-sun" onClick={()=>{setSongPool(shuffle(allSongs));setSongIdx(0);setSScore(0);setSChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={()=>setMode("menu")}>{t.back}</button></div>);return(<div className="screen" style={{direction:t.dir}}><div className="topbar"><button className="back-btn" onClick={()=>setMode("menu")}>{t.back}</button><div className="score-pill">⭐ {sScore}</div></div><h2 className="st">🎤 {lang==="he"?"השלם את השיר":"Complete the song"}</h2><p className="pl">{songIdx+1}/{SONGS_N}</p><div className="card card-sun" style={{textAlign:"center",marginBottom:14}}><span style={{fontSize:44}}>{cur.e}</span><p style={{fontSize:12,color:"#8B7E74",fontWeight:700,margin:"4px 0 8px"}}>🎵 {cur.t}</p><p style={{fontSize:21,fontWeight:900,lineHeight:1.5}}>{cur.l}</p></div>{shuffle(cur.o).map(opt=>{let cls=`opt${isRtl?"":" opt-ltr"}`;if(sChosen===opt)cls+=opt===cur.a?" opt-correct":" opt-wrong";else if(sChosen&&opt===cur.a)cls+=" opt-reveal";return <button key={opt} className={cls} onClick={()=>handleSong(opt)}>{opt}</button>;})}</div>);}
  if(rDone)return(<div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🥁</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {rScore}/{RHYTHM_MAX*10}</p><button className="btn btn-sun" onClick={()=>{setRRound(0);setRScore(0);setRDone(false);setRPhase("idle");setRResult(null);setRTaps(0);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={()=>setMode("menu")}>{t.back}</button></div>);
  return(<div className="screen" style={{direction:t.dir}}><div className="topbar"><button className="back-btn" onClick={()=>setMode("menu")}>{t.back}</button><div className="score-pill">⭐ {rScore}</div></div><h2 className="st">🥁 {lang==="he"?"חיקוי קצב":"Rhythm Echo"}</h2><p className="pl">{rRound+1}/{RHYTHM_MAX}</p><div className="card card-sun" style={{textAlign:"center",marginBottom:14}}><p style={{fontSize:22,letterSpacing:4,fontWeight:800}}>{curR.l}</p><p style={{fontSize:13,color:"#8B7E74",fontWeight:600,marginTop:6}}>{rPhase==="idle"?(lang==="he"?"הקצב שתשמע":"Pattern to hear"):rPhase==="playing"?(lang==="he"?"מקשיב...":"Listen..."):rPhase==="input"?`${lang==="he"?"הקש!":"Tap!"} ${rTaps}/${curR.p.length}`:rResult==="good"?"🎯 "+(lang==="he"?"מצוין!":"Excellent!"):rResult==="ok"?"👍 "+(lang==="he"?"כמעט!":"Almost!"):"💪 "+(lang==="he"?"נסה שוב":"Try again")}</p></div><div style={{textAlign:"center",margin:"16px 0"}}><div className={circCls} onClick={handleTap}>{rPhase==="idle"?"🥁":rPhase==="playing"?(rBeat?"💥":"🎵"):rPhase==="input"?"👆":rResult==="good"?"🎉":rResult==="ok"?"👍":"🔄"}</div></div>{rPhase==="idle"&&<button className="btn btn-sun" onClick={()=>{getCtx();playRhythm();}}>{lang==="he"?"▶ הפעל קצב":"▶ Play Rhythm"}</button>}</div>);
}

// ── Numbers Game ──────────────────────────────────────────────────────────────
function NumbersGame({ t, lang, onBack }) {
  const [pool]=useState(()=>shuffle(NUMBERS).slice(0,6));const [idx,setIdx]=useState(0);const [chosen,setChosen]=useState(null);const [score,setScore]=useState(0);const [done,setDone]=useState(false);
  const item=pool[idx];const df={easy:{he:"קל",en:"Easy",c:"#1DD1A1"},medium:{he:"בינוני",en:"Medium",c:"#FF9F43"},hard:{he:"מאתגר",en:"Challenge",c:"#FF6B6B"}};const d=df[item?.d||"easy"];const isHe=lang==="he";
  const handle=(opt)=>{if(chosen!==null)return;playClick();setChosen(opt);if(opt===item.a){setScore(s=>s+10);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{setChosen(null);if(idx+1>=pool.length){setDone(true);sayDone(lang);}else setIdx(i=>i+1);},1400);};
  if(done)return(<div className="screen" style={{direction:T[lang].dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🔢</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {score}/{pool.length*10}</p><button className="btn btn-sky" onClick={()=>{setIdx(0);setScore(0);setDone(false);setChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">🔢 {t.numbers}</h2><p className="pl">{idx+1}/{pool.length}</p><div className="card card-sky" style={{textAlign:"center",marginBottom:18}}><span style={{fontSize:11,fontWeight:800,color:d.c,display:"block",marginBottom:6}}>● {isHe?d.he:d.en}</span><div className="seq-box">{item.s.map((n,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:3}}><div className={`seq-num${n==="?"?" seq-q":""}`}>{n}</div>{i<item.s.length-1&&<span className="seq-arr">→</span>}</div>))}</div><p style={{fontSize:16,fontWeight:800,marginTop:10}}>{isHe?"מה הבא?":"What's next?"}</p></div><div className="num-grid">{item.o.map(opt=>{let cls="num-btn";if(chosen===opt)cls+=opt===item.a?" num-correct":" num-wrong";else if(chosen!==null&&opt===item.a)cls+=" num-reveal";return <button key={opt} className={cls} onClick={()=>handle(opt)}>{opt}</button>;})}</div></div>);
}

// ── Sorting Game ──────────────────────────────────────────────────────────────
function SortingGame({ t, lang, onBack }) {
  const rooms=lang==="he"?ROOMS_HE:ROOMS_EN;const all=ROOM_ITEMS[lang];
  const [items]=useState(()=>shuffle(all).slice(0,8));const [idx,setIdx]=useState(0);const [chosen,setChosen]=useState(null);const [score,setScore]=useState(0);const [done,setDone]=useState(false);
  const cur=items[idx];
  const handle=(rn)=>{if(chosen)return;playClick();setChosen(rn);if(rn===cur.r){setScore(s=>s+10);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{setChosen(null);if(idx+1>=items.length){setDone(true);sayDone(lang);}else setIdx(i=>i+1);},1400);};
  if(done)return(<div className="screen" style={{direction:T[lang].dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🏠</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {score}/{items.length*10}</p><button className="btn btn-green" onClick={()=>{setIdx(0);setScore(0);setDone(false);setChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">🏠 {t.sorting}</h2><p className="pl">{idx+1}/{items.length}</p><div className="card card-green" style={{textAlign:"center",marginBottom:18}}><p style={{fontSize:44,marginBottom:6}}>{cur.i.split(" ")[0]}</p><p style={{fontSize:20,fontWeight:900}}>{cur.i}</p><p style={{fontSize:14,color:"#8B7E74",fontWeight:600,marginTop:4}}>{t.whichRoom}</p></div><div className="room-grid">{rooms.map(room=>{let cls="room-btn";if(chosen===room.n)cls+=room.n===cur.r?" room-correct":" room-wrong";else if(chosen&&room.n===cur.r)cls+=" room-reveal";return(<button key={room.n} className={cls} onClick={()=>handle(room.n)}><span style={{fontSize:30}}>{room.e}</span><span style={{fontSize:13,fontWeight:800,color:"#2D2A26"}}>{room.n}</span></button>);})}</div></div>);
}

// ── Trivia Game ───────────────────────────────────────────────────────────────
function TriviaGame({ t, lang, onBack }) {
  const all=TRIVIA[lang];const isRtl=T[lang].dir==="rtl";
  const [cards,setCards]=useState(()=>shuffle(all).slice(0,6));const [idx,setIdx]=useState(0);const [chosen,setChosen]=useState(null);const [score,setScore]=useState(0);const [done,setDone]=useState(false);const [clue,setClue]=useState(0);
  useEffect(()=>{setClue(0);setChosen(null);},[idx]);
  const card=cards[idx];const pts=card?.type==="clues"?[10,7,4][clue]:10;
  const handle=(opt)=>{if(chosen)return;playClick();setChosen(opt);if(opt===card.a){setScore(s=>s+pts);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{if(idx+1>=cards.length){setDone(true);sayDone(lang);}else{setIdx(i=>i+1);}},1600);};
  if(done)return(<div className="screen" style={{direction:T[lang].dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🏆</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {score}</p><button className="btn btn-sun" onClick={()=>{setCards(shuffle(all).slice(0,6));setIdx(0);setScore(0);setDone(false);setChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">🏆 {t.trivia}</h2><p className="pl">{idx+1}/{cards.length}</p><div className="card card-sun" style={{textAlign:"center",marginBottom:14}}><span style={{fontSize:44}}>{card.e}</span>{card.type==="q"&&<p style={{fontSize:19,fontWeight:900,marginTop:8,lineHeight:1.4}}>{card.q}</p>}{card.type==="clues"&&(<><p style={{fontSize:12,fontWeight:800,color:"#A29BFE",marginTop:8,marginBottom:8}}>{t.clueBtn} <span style={{color:"#FF9F43"}}>({pts} pts)</span></p>{card.clues.slice(0,clue+1).map((c,i)=>(<div key={i} className={`clue-box${i===clue?" clue-new":""}`}>{i+1}. {c}</div>))}{clue<2&&!chosen&&(<button onClick={()=>setClue(l=>l+1)} style={{background:"none",border:"2px solid #FF9F43",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",marginTop:8,color:"#F08000",fontFamily:"Nunito,sans-serif"}}>+ {t.clueBtn}</button>)}</>)}</div>{shuffle(card.o).map(opt=>{let cls=`opt${isRtl?"":" opt-ltr"}`;if(chosen===opt)cls+=opt===card.a?" opt-correct":" opt-wrong";else if(chosen&&opt===card.a)cls+=" opt-reveal";return <button key={opt} className={cls} onClick={()=>handle(opt)}>{opt}</button>;})}{chosen&&<div style={{borderRadius:14,padding:14,textAlign:"center",fontSize:18,fontWeight:800,marginTop:10,background:chosen===card.a?"#EDFFF8":"#FFF0F0",color:chosen===card.a?"#0A6B4F":"#9B2626"}}>{chosen===card.a?`✓ ${t.correct} (+${pts})`:`${t.almost} — ${card.a}`}</div>}</div>);
}

// ── Together ──────────────────────────────────────────────────────────────────
function TogetherGame({ t, lang, onBack }) {
  const prompts=lang==="he"?["ספר לי על זיכרון ילדות שאתה אוהב","מה היית אוכל כשהיית ילד/ה?","איזה שיר אהבת לשיר?","ספר על מקום שאהבת לבקר בו","מה היית עושה בשבת עם המשפחה?","מה היה החלום שלך כשהיית צעיר/ה?","ספר על מורה שאתה זוכר/ת","מה היית קונה בחנות הממתקים?"]:["Tell me about a happy childhood memory","What food did you love as a child?","What was your favorite song?","Tell me about a place you loved to visit","What did you do on weekends with family?","What was your dream when you were young?","Tell me about a teacher you remember","What was your favorite childhood game?"];
  const [idx,setIdx]=useState(0);
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">👥 {t.together}</div></div><h2 className="st">👥 {t.together}</h2><p style={{fontSize:15,color:"#8B7E74",fontWeight:600,marginBottom:20}}>{lang==="he"?"שאל את יקירך:":"Ask your loved one:"}</p><div className="card" style={{background:"linear-gradient(135deg,#F3E5F5,#E1BEE7)",border:"2.5px solid #CE93D8",textAlign:"center",marginBottom:20}}><p style={{fontSize:24,fontWeight:800,lineHeight:1.5,color:"#2D2A26"}}>💬 {prompts[idx]}</p></div><p style={{textAlign:"center",fontSize:14,color:"#8B7E74",fontWeight:600,marginBottom:16}}>{lang==="he"?"הקשיבו, שאלו, הנאו ביחד ❤️":"Listen, ask more, enjoy together ❤️"}</p><button className="btn" style={{background:"#A29BFE",boxShadow:"0 5px 0 #7B6FD0",color:"white"}} onClick={()=>setIdx(i=>(i+1)%prompts.length)}>{lang==="he"?"שאלה הבאה →":"Next question →"}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
}

// ── Chat Game — עם onboarding אישי ───────────────────────────────────────────
const CHAT_ONBOARDING = {
  he: [
    {
      key: "birthYear",
      q: "באיזה עשור נולדת?",
      emoji: "🎂",
      opts: ["שנות ה-30","שנות ה-40","שנות ה-50","שנות ה-60","שנות ה-70+"],
    },
    {
      key: "hobbies",
      q: "מה אוהבים לעשות?",
      emoji: "❤️",
      opts: ["מוזיקה 🎵","גינון 🌱","בישול 🍳","קריאה 📚","טיולים 🚶","משפחה 👨‍👩‍👧"],
      multi: true,
    },
    {
      key: "topics",
      q: "על מה כיף לדבר?",
      emoji: "💬",
      opts: ["זיכרונות מהעבר 📸","ילדים ונכדים 👶","חדשות ישראל 📰","בישול ומתכונים 🍲","טיפים לבריאות 💊","ספורט ⚽"],
      multi: true,
    },
  ],
  en: [
    {
      key: "birthYear",
      q: "What decade were you born?",
      emoji: "🎂",
      opts: ["1930s","1940s","1950s","1960s","1970s+"],
    },
    {
      key: "hobbies",
      q: "What do you enjoy doing?",
      emoji: "❤️",
      opts: ["Music 🎵","Gardening 🌱","Cooking 🍳","Reading 📚","Walking 🚶","Family 👨‍👩‍👧"],
      multi: true,
    },
    {
      key: "topics",
      q: "What's fun to talk about?",
      emoji: "💬",
      opts: ["Old memories 📸","Children & grandchildren 👶","News & world 📰","Cooking & recipes 🍲","Health tips 💊","Sports ⚽"],
      multi: true,
    },
  ],
};

function buildSystemPrompt(lang, name, profile) {
  const isHe = lang === "he";
  const n = name || (isHe ? "החבר/ה שלי" : "my friend");
  const decade = profile.birthYear || (isHe ? "שנות ה-50" : "the 1950s");
  const hobbies = (profile.hobbies || []).join(", ") || (isHe ? "ללא העדפה" : "various things");
  const topics  = (profile.topics  || []).join(", ") || (isHe ? "ללא העדפה" : "various topics");

  if (isHe) return `אתה CogniBot — חבר AI חם, סבלני ואוהד לאנשים מבוגרים.
המשתמש שלך הוא ${n}, נולד/ה בסביבות ${decade}, אוהב/ת: ${hobbies}, אוהב/ת לדבר על: ${topics}.
כללים חשובים:
- דבר בעברית פשוטה וברורה, משפטים קצרים
- שאל שאלה אחת בלבד בכל פעם, מותאמת לתחומי העניין שלו/ה
- התייחס לשם ${n} מדי פעם כדי שירגיש/תרגיש אישי
- עורר זיכרונות מתקופת ה-${decade} — שירים, אירועים, מנהגים
- אם אוהב/ת מוזיקה — שאל על שירים מהעבר
- אם אוהב/ת בישול — שאל על מתכונים ומאכלי ילדות
- אם אוהב/ת משפחה — שאל על ילדים, נכדים, זיכרונות משפחתיים
- תגובות קצרות — 2-3 משפטים לכל היותר
- תמיד חם, מעודד, סבלני — לעולם אל תמהר`;

  return `You are CogniBot — a warm, patient, caring AI friend for elderly people.
Your user is ${n}, born around ${decade}, enjoys: ${hobbies}, loves talking about: ${topics}.
Important rules:
- Speak in simple, clear English with short sentences
- Ask only ONE question at a time, tailored to their interests
- Use the name ${n} occasionally to make it feel personal
- Evoke memories from ${decade} — songs, events, customs
- If they like music — ask about songs from the past
- If they like cooking — ask about childhood recipes
- If they like family — ask about children, grandchildren, family memories
- Keep responses to 2-3 sentences maximum
- Always warm, encouraging, patient — never rush`;
}

function ChatOnboarding({ lang, name, onDone }) {
  const isHe = lang === "he";
  const steps = CHAT_ONBOARDING[lang];
  const [stepIdx, setStepIdx] = useState(0);
  const [profile, setProfile] = useState({});
  const [selected, setSelected] = useState([]);
  const step = steps[stepIdx];

  const toggleOpt = (opt) => {
    if (!step.multi) {
      setSelected([opt]);
    } else {
      setSelected(prev =>
        prev.includes(opt) ? prev.filter(x=>x!==opt) : [...prev, opt]
      );
    }
  };

  const next = () => {
    const val = step.multi ? selected : selected[0];
    const newProfile = { ...profile, [step.key]: val };
    setProfile(newProfile);
    setSelected([]);
    if (stepIdx + 1 >= steps.length) {
      onDone(newProfile);
    } else {
      setStepIdx(i => i+1);
    }
  };

  return (
    <div className="screen" style={{direction:T[lang].dir,display:"flex",flexDirection:"column"}}>
      <div style={{textAlign:"center",marginBottom:8}}>
        <span style={{fontSize:13,fontWeight:700,color:"#8B7E74"}}>
          {stepIdx+1}/{steps.length}
        </span>
        <div style={{display:"flex",gap:6,justifyContent:"center",margin:"8px 0 20px"}}>
          {steps.map((_,i)=>(
            <div key={i} style={{width:40,height:6,borderRadius:99,background:i<=stepIdx?"#FF9F43":"#E8E0D8",transition:"background .3s"}}/>
          ))}
        </div>
      </div>
      <div className="card card-sun" style={{textAlign:"center",marginBottom:20}}>
        <span style={{fontSize:52,display:"block",marginBottom:8}}>{step.emoji}</span>
        <p style={{fontSize:22,fontWeight:900,lineHeight:1.4}}>{step.q}</p>
        {step.multi && <p style={{fontSize:13,color:"#8B7E74",fontWeight:600,marginTop:6}}>
          {isHe?"אפשר לבחור כמה":"Choose as many as you like"}
        </p>}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",marginBottom:20}}>
        {step.opts.map(opt=>(
          <button key={opt} onClick={()=>toggleOpt(opt)} style={{
            background:selected.includes(opt)?"#FF9F43":"white",
            color:selected.includes(opt)?"white":"#2D2A26",
            border:`2.5px solid ${selected.includes(opt)?"#FF9F43":"#E8E0D8"}`,
            borderRadius:50, padding:"12px 20px",
            fontSize:16, fontWeight:700, cursor:"pointer",
            fontFamily:"Nunito,sans-serif", transition:"all .2s",
          }}>{opt}</button>
        ))}
      </div>
      <button className="btn btn-sun" onClick={next} disabled={selected.length===0} style={{opacity:selected.length?1:0.5}}>
        {stepIdx+1<steps.length ? (isHe?"הבא →":"Next →") : (isHe?"בואו נדבר! 💬":"Let's chat! 💬")}
      </button>
    </div>
  );
}

function ChatGame({ t, lang, name, onBack }) {
  const isRtl = T[lang].dir==="rtl";
  const isHe  = lang==="he";
  const [stage, setStage]   = useState("onboard"); // onboard | chat
  const [profile, setProfile] = useState(null);
  const [msgs,   setMsgs]   = useState([]);
  const [input,  setInput]  = useState("");
  const [loading,setLoading]= useState(false);
  const bottomRef = useRef(null);

  const startChat = async (prof) => {
    setProfile(prof);
    setStage("chat");
    setLoading(true);
    const sys = buildSystemPrompt(lang, name, prof);
    const hello = isHe ? "שלום" : "Hello";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:200,system:sys,messages:[{role:"user",content:hello}]})
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text || (isHe?"שלום! איך אפשר לעזור?":"Hello! How can I help?");
      setMsgs([{role:"assistant",content:reply}]);
      
    } catch(e) {
      setMsgs([{role:"assistant",content:isHe?"שלום! שמח לדבר איתך 😊":"Hello! Happy to chat with you 😊"}]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nm = {role:"user",content:text};
    const history = [...msgs, nm];
    setMsgs(history);
    setInput("");
    setLoading(true);
    const sys = buildSystemPrompt(lang, name, profile||{});
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:200,system:sys,messages:history})
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text || (isHe?"סליחה, נסה שוב":"Sorry, try again");
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
      
    } catch(e) {
      setMsgs(p=>[...p,{role:"assistant",content:isHe?"אופס! נסה שוב 🙂":"Oops! Try again 🙂"}]);
    }
    setLoading(false);
  };

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading]);

  if (stage==="onboard") return (
    <div>
      <div style={{padding:"16px 18px 0",direction:T[lang].dir}}>
        <button className="back-btn" onClick={onBack}>{t.back}</button>
        <p style={{textAlign:"center",fontSize:20,fontWeight:900,fontFamily:"Fredoka,sans-serif",marginTop:12,marginBottom:4}}>
          🤖 CogniBot
        </p>
        <p style={{textAlign:"center",fontSize:14,color:"#8B7E74",fontWeight:600,marginBottom:16}}>
          {isHe?"כמה שאלות קצרות כדי להכיר אותך":"A few quick questions to get to know you"}
        </p>
      </div>
      <ChatOnboarding lang={lang} name={name} onDone={startChat} />
    </div>
  );

  return (
    <div className="chat-wrap">
      <div className="chat-hdr">
        <button className="back-btn" onClick={onBack}>{t.back}</button>
        <span style={{fontSize:28}}>🤖</span>
        <div>
          <p style={{fontSize:17,fontWeight:900,fontFamily:"Fredoka,sans-serif"}}>CogniBot</p>
          <p style={{fontSize:12,color:"#1DD1A1",fontWeight:700}}>● {isHe?"מחובר":"Online"}</p>
        </div>
        {profile && (
          <div style={{marginRight:"auto",fontSize:12,color:"#8B7E74",fontWeight:600,textAlign:"right"}}>
            {(profile.hobbies||[]).slice(0,2).join(" · ")}
          </div>
        )}
      </div>
      <div className="chat-msgs">
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?(isRtl?"flex-start":"flex-end"):(isRtl?"flex-end":"flex-start"),marginBottom:12}}>
            {m.role==="assistant"&&<span style={{fontSize:22,alignSelf:"flex-end",marginLeft:isRtl?0:8,marginRight:isRtl?8:0}}>🤖</span>}
            <div className={m.role==="user"?"bubble-user":"bubble-bot"}>{m.content}</div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",justifyContent:isRtl?"flex-end":"flex-start"}}>
            <span style={{fontSize:22,marginLeft:isRtl?0:8,marginRight:isRtl?8:0}}>🤖</span>
            <div className="bubble-bot">•••</div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div className="chat-in-area">
        <input className="chat-in" value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleSend()}
          placeholder={isHe?"כתוב כאן...":"Type here..."} dir={T[lang].dir}/>
        <button className="chat-send" onClick={handleSend} disabled={loading||!input.trim()}>→</button>
      </div>
    </div>
  );

}
// ── Family Dashboard ──────────────────────────────────────────────────────────
function FamilyDash({ t, lang, onBack }) {
  const isHe=lang==="he";const WD=[{d:"א",s:72},{d:"ב",s:78},{d:"ג",s:75},{d:"ד",s:82},{d:"ה",s:80},{d:"ו",s:85},{d:"ש",s:88}];const mx=Math.max(...WD.map(d=>d.s));const MD=[{l:isHe?"מהירות":"Speed",v:84,c:"#FF9F43"},{l:isHe?"זיכרון":"Memory",v:76,c:"#54A0FF"},{l:isHe?"שפה":"Language",v:91,c:"#1DD1A1"}];
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><span style={{fontSize:16,fontWeight:800}}>📊 {t.family}</span></div><div className="card" style={{background:"#EDFFF8",border:"2px solid #1DD1A1",marginBottom:14}}><p style={{fontSize:14,fontWeight:800,color:"#0A6B4F"}}>✅ {isHe?"שיחקה 4 פעמים השבוע! 🎉":"Played 4 times this week! 🎉"}</p></div><div className="card" style={{marginBottom:14}}><p style={{fontSize:15,fontWeight:800,marginBottom:10}}>{isHe?"ציון יומי":"Daily score"}</p><div style={{display:"flex",alignItems:"flex-end",gap:8,height:90}}>{WD.map((d,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:"100%",borderRadius:"8px 8px 0 0",background:d.s>=80?"#1DD1A1":"#FF9F43",height:`${(d.s/mx)*80}px`}}/><span style={{fontSize:12,fontWeight:700,color:"#8B7E74"}}>{d.d}</span></div>))}</div></div><div className="card" style={{marginBottom:14}}><p style={{fontSize:15,fontWeight:800,marginBottom:12}}>{isHe?"לפי תחום":"By domain"}</p>{MD.map(m=>(<div key={m.l} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><span style={{fontSize:13,fontWeight:700,width:60,color:"#2D2A26"}}>{m.l}</span><div style={{flex:1,background:"#EEE",borderRadius:99,height:10,overflow:"hidden"}}><div style={{width:`${m.v}%`,height:"100%",borderRadius:99,background:m.c}}/></div><span style={{fontSize:13,fontWeight:900,width:30,textAlign:"right"}}>{m.v}</span></div>))}</div></div>);
}

// ── Animal Quiz Game ──────────────────────────────────────────────────────────
function AnimalGame({ t, lang, onBack }) {
  const all = lang==="he" ? ANIMALS_HE : ANIMALS_EN;
  const isHe = lang==="he";
  const [animals] = useState(()=>shuffle(all).slice(0,7));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [opts, setOpts] = useState(()=>shuffle(animals[0].opts));
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const cur = animals[idx];

  const next = (correct) => {
    setTimeout(()=>{
      setChosen(null);
      const ni = idx+1;
      if(ni >= animals.length){ setDone(true); playDone(); }
      else { setIdx(ni); setOpts(shuffle(animals[ni].opts)); }
    }, 1200);
  };

  const handle = (opt) => {
    if(chosen) return;
    playClick();
    setChosen(opt);
    if(opt===cur.name){ setScore(s=>s+10); sayCorrect(lang); }
    else sayWrong(lang);
    next(opt===cur.name);
  };

  if(done) return(
    <div className="screen" style={{direction:T[lang].dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <span className="big-e">🐾</span>
      <p style={{fontSize:26,fontWeight:900,marginBottom:8}}>{t.done}</p>
      <p style={{fontSize:20,color:"#8B7E74",fontWeight:700,marginBottom:24}}>⭐ {score}/{animals.length*10}</p>
      <button className="btn btn-sun" onClick={()=>{setIdx(0);setScore(0);setDone(false);setChosen(null);setOpts(shuffle(animals[0].opts));}}>{t.playAgain}</button>
      <button className="btn btn-ghost" onClick={onBack}>{t.menu}</button>
    </div>
  );

  return(
    <div className="screen" style={{direction:T[lang].dir}}>
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>{t.back}</button>
        <div className="score-pill">⭐ {score}</div>
      </div>
      <h2 style={{fontFamily:"Fredoka,sans-serif",fontSize:24,marginBottom:4}}>
        🐾 {isHe?"זהה את בעל החיים":"Identify the Animal"}
      </h2>
      <p style={{fontSize:14,color:"#8B7E74",fontWeight:700,marginBottom:14}}>{idx+1}/{animals.length}</p>

      <div style={{borderRadius:24,marginBottom:18,height:220,background:"linear-gradient(135deg,#FFF3E0,#FFE0B2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:130,lineHeight:1}}>{cur.emoji}</span>
      </div>

      <p style={{textAlign:"center",fontSize:20,fontWeight:800,color:"#2D2A26",marginBottom:14}}>
        {isHe?"מה בעל החיים הזה?":"What animal is this?"}
      </p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {opts.map(opt=>{
          const isPicked=chosen===opt, isCorrect=opt===cur.name;
          let bg="white",border="#E8E0D8",color="#2D2A26";
          if(isPicked&&isCorrect){bg="#EDFFF8";border="#1DD1A1";}
          else if(isPicked&&!isCorrect){bg="#FFF0F0";border="#FF6B6B";}
          else if(chosen&&isCorrect){bg="#EDFFF8";border="#1DD1A1";}
          return(
            <button key={opt} onClick={()=>handle(opt)} style={{
              background:bg,border:`2.5px solid ${border}`,borderRadius:16,
              padding:"18px 10px",fontSize:18,fontWeight:800,cursor:"pointer",
              fontFamily:"Nunito,sans-serif",color,transition:"background .2s,border .2s",
            }}>{opt}</button>
          );
        })}
      </div>
    </div>
  );
}


// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("lang");
  const [lang,   setLang]   = useState("he");
  const [streak, setStreak] = useState(7);
  const [name,   setName]   = useState("");
  const [gender, setGender] = useState("m"); // "m" | "f"
  const t = T[lang] || T.he;
  return (
    <>
      <style>{css}</style>
      <div className="app" style={{direction:t.dir}}>
        <ToastOverlay />
        {screen==="lang"    && <LangScreen onSelect={l=>{setLang(l);setScreen("name");}} />}
        {screen==="name"    && <NameScreen lang={lang} onDone={(n,g)=>{
          setName(n);
          setGender(g||"m");
          if(n) {
            playStart();
            setTimeout(()=>showToast(lang==="he"?`היי ${n}! 🎉`:`Hey ${n}! 🎉`, "#FF9F43"), 400);
            setTimeout(()=>speakGreeting(lang, n, g||"m"), 800);
          }
          setScreen("menu");
        }} />}
        {screen==="menu"    && <MenuScreen t={t} lang={lang} streak={streak} name={name} onSelect={setScreen} />}
        {screen==="daily"   && <DailyChallenge t={t} lang={lang} name={name} gender={gender} onBack={()=>setScreen("menu")} onComplete={()=>{setStreak(s=>s+1);setScreen("menu");}} />}
        {screen==="speed"   && <SpeedGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="memory"  && <MemoryGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="language"&& <LanguageGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="music"   && <MusicGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="numbers" && <NumbersGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="sorting" && <SortingGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="animal"  && <AnimalGame  t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="trivia"  && <TriviaGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="together"&& <TogetherGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="chat"    && <ChatGame t={t} lang={lang} name={name} onBack={()=>setScreen("menu")} />}
        {screen==="family"  && <FamilyDash t={t} lang={lang} onBack={()=>setScreen("menu")} />}
      </div>
    </>
  );
}const ANIMALS_HE = [
  {emoji:"🐕",name:"כלב",opts:["כלב","חתול","שועל","ארנב"]},
  {emoji:"🐈",name:"חתול",opts:["חתול","כלב","ארנב","שועל"]},
  {emoji:"🐘",name:"פיל",opts:["פיל","ג'ירפה","קרנף","היפופוטם"]},
  {emoji:"🦒",name:"ג'ירפה",opts:["ג'ירפה","פיל","גמל","זברה"]},
  {emoji:"🦁",name:"אריה",opts:["אריה","נמר","זאב","דוב"]},
  {emoji:"🐼",name:"פנדה",opts:["פנדה","דוב","קואלה","ארנב"]},
  {emoji:"🐇",name:"ארנב",opts:["ארנב","חתול","עכבר","שועל"]},
  {emoji:"🦊",name:"שועל",opts:["שועל","זאב","כלב","חתול"]},
  {emoji:"🐢",name:"צב",opts:["צב","צפרדע","נחש","לטאה"]},
  {emoji:"🐸",name:"צפרדע",opts:["צפרדע","לטאה","נחש","צב"]},
  {emoji:"🦋",name:"פרפר",opts:["פרפר","דבורה","זבוב","יתוש"]},
  {emoji:"🐄",name:"פרה",opts:["פרה","סוס","חמור","עז"]},
  {emoji:"🐧",name:"פינגווין",opts:["פינגווין","ברווז","יונה","עורב"]},
  {emoji:"🦓",name:"זברה",opts:["זברה","סוס","חמור","פרה"]},
  {emoji:"🐊",name:"תנין",opts:["תנין","לטאה","נחש","צב"]},
  {emoji:"🦅",name:"נשר",opts:["נשר","יונה","עורב","ינשוף"]},
  {emoji:"🐬",name:"דולפין",opts:["דולפין","לוויתן","כריש","כלב ים"]},
  {emoji:"🦁",name:"נמר",opts:["נמר","אריה","יגואר","פנתר"]},
  {emoji:"🐺",name:"זאב",opts:["זאב","שועל","כלב","נמר"]},
  {emoji:"🦘",name:"קנגורו",opts:["קנגורו","קואלה","וואלבי","ארנב"]},
  {emoji:"🦔",name:"קיפוד",opts:["קיפוד","עכבר","שפן","חולד"]},
  {emoji:"🐦",name:"ציפור",opts:["ציפור","עטלף","ינשוף","אנק"]},
  {emoji:"🦆",name:"ברווז",opts:["ברווז","יונה","עורב","תוכי"]},
  {emoji:"🐓",name:"תרנגול",opts:["תרנגול","ברווז","יונה","אווז"]},
  {emoji:"🐑",name:"כבש",opts:["כבש","עז","פרה","סוס"]},
  {emoji:"🐐",name:"עז",opts:["עז","כבש","פרה","חמור"]},
  {emoji:"🐖",name:"חזיר",opts:["חזיר","כבש","עז","פרה"]},
  {emoji:"🐴",name:"סוס",opts:["סוס","חמור","פרה","כבש"]},
  {emoji:"🦒",name:"גמל",opts:["גמל","ג'ירפה","פיל","קרנף"]},
  {emoji:"🦏",name:"קרנף",opts:["קרנף","פיל","היפופוטם","תנין"]},
  {emoji:"🦛",name:"היפופוטם",opts:["היפופוטם","קרנף","פיל","תנין"]},
  {emoji:"🐒",name:"קוף",opts:["קוף","גורילה","שימפנזה","ארנב"]},
  {emoji:"🦜",name:"תוכי",opts:["תוכי","יונה","עורב","ברווז"]},
  {emoji:"🦉",name:"ינשוף",opts:["ינשוף","עורב","נשר","עטלף"]},
  {emoji:"🐝",name:"דבורה",opts:["דבורה","צרעה","פרפר","זבוב"]},
  {emoji:"🦈",name:"כריש",opts:["כריש","דולפין","לוויתן","דג"]},
  {emoji:"🐠",name:"דג טרופי",opts:["דג טרופי","כריש","דולפין","צב ים"]},
  {emoji:"🦎",name:"לטאה",opts:["לטאה","נחש","צב","תנין"]},
  {emoji:"🐍",name:"נחש",opts:["נחש","לטאה","תנין","צב"]},
  {emoji:"🦟",name:"יתוש",opts:["יתוש","דבורה","זבוב","פרפר"]},
];
const ANIMALS_EN = [
  {emoji:"🐕",name:"Dog",opts:["Dog","Cat","Fox","Rabbit"]},
  {emoji:"🐈",name:"Cat",opts:["Cat","Dog","Rabbit","Fox"]},
  {emoji:"🐘",name:"Elephant",opts:["Elephant","Giraffe","Rhino","Hippo"]},
  {emoji:"🦒",name:"Giraffe",opts:["Giraffe","Elephant","Camel","Zebra"]},
  {emoji:"🦁",name:"Lion",opts:["Lion","Tiger","Wolf","Bear"]},
  {emoji:"🐼",name:"Panda",opts:["Panda","Bear","Koala","Rabbit"]},
  {emoji:"🐇",name:"Rabbit",opts:["Rabbit","Cat","Mouse","Fox"]},
  {emoji:"🦊",name:"Fox",opts:["Fox","Wolf","Dog","Cat"]},
  {emoji:"🐢",name:"Turtle",opts:["Turtle","Frog","Snake","Lizard"]},
  {emoji:"🐸",name:"Frog",opts:["Frog","Lizard","Snake","Turtle"]},
  {emoji:"🦋",name:"Butterfly",opts:["Butterfly","Bee","Fly","Dragonfly"]},
  {emoji:"🐄",name:"Cow",opts:["Cow","Horse","Donkey","Goat"]},
  {emoji:"🐧",name:"Penguin",opts:["Penguin","Duck","Dove","Crow"]},
  {emoji:"🦓",name:"Zebra",opts:["Zebra","Horse","Donkey","Cow"]},
  {emoji:"🐊",name:"Crocodile",opts:["Crocodile","Lizard","Snake","Turtle"]},
  {emoji:"🦅",name:"Eagle",opts:["Eagle","Dove","Crow","Owl"]},
  {emoji:"🐬",name:"Dolphin",opts:["Dolphin","Whale","Shark","Seal"]},
  {emoji:"🦘",name:"Kangaroo",opts:["Kangaroo","Koala","Wallaby","Rabbit"]},
  {emoji:"🦔",name:"Hedgehog",opts:["Hedgehog","Mouse","Hamster","Rat"]},
  {emoji:"🦆",name:"Duck",opts:["Duck","Dove","Crow","Parrot"]},
  {emoji:"🐑",name:"Sheep",opts:["Sheep","Goat","Cow","Horse"]},
  {emoji:"🐖",name:"Pig",opts:["Pig","Sheep","Goat","Cow"]},
  {emoji:"🐴",name:"Horse",opts:["Horse","Donkey","Cow","Sheep"]},
  {emoji:"🦏",name:"Rhino",opts:["Rhino","Elephant","Hippo","Crocodile"]},
  {emoji:"🐒",name:"Monkey",opts:["Monkey","Gorilla","Chimp","Rabbit"]},
  {emoji:"🦜",name:"Parrot",opts:["Parrot","Dove","Crow","Duck"]},
  {emoji:"🦉",name:"Owl",opts:["Owl","Crow","Eagle","Bat"]},
  {emoji:"🐝",name:"Bee",opts:["Bee","Wasp","Butterfly","Fly"]},
  {emoji:"🦈",name:"Shark",opts:["Shark","Dolphin","Whale","Fish"]},
  {emoji:"🦎",name:"Lizard",opts:["Lizard","Snake","Turtle","Crocodile"]},
];
 CogniPlay v6.0 — animal game rebuilt from scratch
import { useState, useEffect, useRef, useCallback } from "react";

// ── Audio — Web Audio API (עובד באפליקציה אמיתית, לא ב-artifact) ─────────────
const _play = (notes) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const go = () => {
      notes.forEach(({freq,delay=0,dur=0.2,type="sine",vol=0.55})=>{
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);
        o.type=type;o.frequency.value=freq;
        const t=ctx.currentTime+delay;
        g.gain.setValueAtTime(vol,t);
        g.gain.exponentialRampToValueAtTime(0.001,t+dur);
        o.start(t);o.stop(t+dur+0.05);
      });
      const total=Math.max(...notes.map(n=>(n.delay||0)+(n.dur||0.2)))+0.2;
      setTimeout(()=>{try{ctx.close();}catch(e){}},total*1000);
    };
    if(ctx.state==="suspended")ctx.resume().then(go);else go();
  } catch(e) {}
};
const playClick   = ()=>_play([{freq:800,dur:.08,vol:.5}]);
const playCorrect = ()=>_play([{freq:523,dur:.18,vol:.6},{freq:659,delay:.16,dur:.18,vol:.6},{freq:784,delay:.32,dur:.18,vol:.6},{freq:1047,delay:.5,dur:.3,vol:.55}]);
const playWrong   = ()=>_play([{freq:300,dur:.18,type:"sawtooth",vol:.5},{freq:220,delay:.2,dur:.25,type:"sawtooth",vol:.45}]);
const playDone    = ()=>_play([{freq:523,dur:.14,vol:.6},{freq:659,delay:.15,dur:.14,vol:.6},{freq:784,delay:.3,dur:.14,vol:.6},{freq:1047,delay:.45,dur:.2,vol:.6},{freq:1319,delay:.66,dur:.4,vol:.55}]);
const playStart   = ()=>_play([{freq:392,dur:.12,vol:.55},{freq:523,delay:.13,dur:.12,vol:.55},{freq:659,delay:.27,dur:.12,vol:.55},{freq:784,delay:.41,dur:.35,vol:.6}]);



// ── TTS — קול עברי אמיתי ────────────────────────────────────────────────────
const _tts = (text, lang="he") => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang === "he" ? "he-IL" : "en-US";
        u.rate = 0.85;
        u.pitch = 1.0;
        u.volume = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const best = lang==="he"
          ? (voices.find(v=>v.lang==="he-IL") || voices.find(v=>v.lang.startsWith("he")))
          : (voices.find(v=>v.lang==="en-US") || voices.find(v=>v.lang.startsWith("en")));
        if (best) u.voice = best;
        window.speechSynthesis.speak(u);
      } catch(e) {}
    }, 600);
  } catch(e) {}
};

// פידבק קולי מלא
const speakCorrect  = (lang) => {
  const msgs = lang==="he"
    ? ["מצוין!", "כל הכבוד!", "נכון מאוד!", "יפה מאוד!", "מעולה!"]
    : ["Correct!", "Well done!", "Excellent!", "Great job!", "Perfect!"];
  _tts(msgs[Math.floor(Math.random()*msgs.length)], lang);
};
const speakWrong = (lang) => {
  _tts(lang==="he" ? "כמעט! נסה שוב" : "Almost! Try again", lang);
};
const speakDailyStart = (lang, name, gender="m") => {
  const f = gender==="f";
  const msgs = lang==="he" ? [
    `כל הכבוד${name?" "+name:""}! זה הזמן שלך לזרוח!`,
    `בואו נתחיל${name?" "+name:""}! המוח שלך מוכן!`,
    `היום יהיה נהדר${name?" "+name:""}! בהצלחה!`,
    `קדימה${name?" "+name:""}! 10 דקות לבריאות המוח!`,
    f ? `את מדהימה${name?" "+name:""}! קדימה לאתגר!` : `אתה מדהים${name?" "+name:""}! קדימה לאתגר!`,
  ] : [
    `Let's go${name?" "+name:""}! Time to shine!`,
    `Ready${name?" "+name:""}? Let's keep that mind sharp!`,
    `Great to see you${name?" "+name:""}! Let's begin!`,
  ];
  setTimeout(() => _tts(msgs[Math.floor(Math.random()*msgs.length)], lang), 600);
};
const speakDailyDone = (lang, name, gender="m") => {
  const f = gender==="f";
  const msgs = lang==="he" ? [
    `כל הכבוד${name?" "+name:""}! עשית עבודה מדהימה היום!`,
    f ? `וואו${name?" "+name:""}! את כוכבת!` : `וואו${name?" "+name:""}! אתה כוכב!`,
    f ? `אני כל כך גאה בך${name?" "+name:""}!` : `אני כל כך גאה בך${name?" "+name:""}!`,
    `${name?name+",":""}היום עשית משהו נפלא לבריאות המוח שלך!`,
    f ? `מדהימה${name?" "+name:""}! המשיכי כך!` : `מדהים${name?" "+name:""}! המשיכי כך!`,
  ] : [
    `Amazing${name?" "+name:""}! You did a wonderful job today!`,
    `Well done${name?" "+name:""}! Your brain worked hard!`,
    `I'm so proud of you${name?" "+name:""}!`,
  ];
  setTimeout(() => _tts(msgs[Math.floor(Math.random()*msgs.length)], lang), 400);
};
const speakGreeting = (lang, name, gender="m") => {
  const f = gender==="f";
  if (name) {
    const msg = lang==="he"
      ? (f ? `היי ${name}! ברוכה הבאה!` : `היי ${name}! ברוך הבא!`)
      : `Hey ${name}! Welcome!`;
    _tts(msg, lang);
  }
};

// ── פידבק ויזואלי — event-based toast ───────────────────────────────────────
const _toastListeners = [];
const onToast = (fn) => { _toastListeners.push(fn); return ()=>{ const i=_toastListeners.indexOf(fn); if(i>-1)_toastListeners.splice(i,1); }; };
const showToast = (text, color="#FF9F43") => { _toastListeners.forEach(fn=>fn({text,color})); };

function ToastOverlay() {
  const [toast, setToast] = useState(null);
  useEffect(()=>{
    const unsub = onToast(t=>{ setToast(t); setTimeout(()=>setToast(null),2000); });
    return unsub;
  },[]);
  if(!toast) return null;
  return (
    <div style={{
      position:"fixed", top:80, left:"50%",
      transform:"translateX(-50%)",
      background:"white", borderRadius:20, padding:"14px 28px",
      fontFamily:"Fredoka,sans-serif", fontSize:24, fontWeight:700,
      textAlign:"center", zIndex:9999,
      boxShadow:"0 4px 24px rgba(0,0,0,.15)",
      border:`3px solid ${toast.color}`, color:toast.color,
      maxWidth:"80vw", pointerEvents:"none",
      animation:"popIn .2s ease",
    }}>
      {toast.text}
    </div>
  );
}

const rnd = a => a[Math.floor(Math.random()*a.length)];
const GOOD_HE = ["מצוין","כל הכבוד","נכון","יפה מאוד","מעולה","ממש טוב","נהדר"];
const GOOD_EN = ["Correct","Well done","Excellent","Great","Perfect","Wonderful"];
const BAD_HE  = ["כמעט","לא נורא, נסה שוב","כמעט הגעת, נסה שוב"];
const BAD_EN  = ["Almost","Not quite, try again","Good try"];

const sayCorrect = l => {
  playCorrect();
  const word = l==="he" ? GOOD_HE[Math.floor(Math.random()*GOOD_HE.length)] : GOOD_EN[Math.floor(Math.random()*GOOD_EN.length)];
  showToast(word + " ! 🎉", "#1DD1A1");
  _tts(word, l);
};
const sayWrong = l => {
  playWrong();
  const word = l==="he" ? BAD_HE[Math.floor(Math.random()*BAD_HE.length)] : BAD_EN[Math.floor(Math.random()*BAD_EN.length)];
  showToast(word + " 💪", "#FF6B6B");
  _tts(word, l);
};
const sayDone = l => { playDone(); };
const sayDailyStart = (l, n) => {
  playStart();
  setTimeout(()=>showToast(n?(l==="he"?`בהצלחה ${n}! 🚀`:`Good luck ${n}! 🚀`):(l==="he"?"בהצלחה! 🚀":"Good luck! 🚀"), "#FF9F43"), 850);
  speakDailyStart(l, n);
};
const sayDailyDone  = (l, n, msg) => {
  playDone();
  setTimeout(()=>showToast(msg||(n?(l==="he"?`כל הכבוד ${n}! 🎊`:`Well done ${n}! 🎊`):(l==="he"?"כל הכבוד! 🎊":"Well done! 🎊")), "#FF9F43"), 500);
  speakDailyDone(l, n);
};


const css = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Nunito:wght@600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#FFF8F0;font-family:'Nunito',sans-serif}
.app{max-width:430px;min-height:100vh;margin:0 auto;background:#FFF8F0}
.screen{min-height:100vh;padding:20px 18px 32px;animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.back-btn{background:white;border:2.5px solid #E8E0D8;border-radius:12px;padding:10px 16px;font-size:15px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;color:#2D2A26}
.score-pill{background:#FF9F43;color:white;border-radius:50px;padding:8px 16px;font-weight:900;font-size:17px;font-family:'Fredoka',sans-serif}
.btn{border:none;border-radius:18px;padding:18px 24px;font-size:19px;font-weight:800;font-family:'Fredoka',sans-serif;cursor:pointer;width:100%;margin-top:10px;letter-spacing:.3px}
.btn:active{transform:translateY(2px)}
.btn-sun{background:#FF9F43;color:white;box-shadow:0 5px 0 #F08000}
.btn-sky{background:#54A0FF;color:white;box-shadow:0 5px 0 #2E7DD4}
.btn-green{background:#1DD1A1;color:white;box-shadow:0 5px 0 #10AB83}
.btn-ghost{background:white;color:#2D2A26;box-shadow:0 5px 0 #D5C9BF;border:2.5px solid #E8E0D8}
.opt{background:white;border:2.5px solid #E8E0D8;border-radius:16px;padding:16px 20px;font-size:18px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;width:100%;margin-bottom:10px;text-align:right;color:#2D2A26;display:block;transition:border-color .15s}
.opt-ltr{text-align:left}
.opt-correct{background:#EDFFF8;border-color:#1DD1A1;color:#0A6B4F;animation:popIn .35s ease}
.opt-wrong{background:#FFF0F0;border-color:#FF6B6B;color:#9B2626;animation:shake .35s ease}
.opt-reveal{background:#EDFFF8;border-color:#1DD1A1;color:#0A6B4F}
.card{background:white;border-radius:24px;padding:22px;box-shadow:0 4px 20px rgba(0,0,0,.07);margin-bottom:14px}
.card-sun{background:linear-gradient(135deg,#FFF3E0,#FFE0B2);border:2.5px solid #FFD08A}
.card-sky{background:linear-gradient(135deg,#E3F2FD,#BBDEFB);border:2.5px solid #90CAF9}
.card-green{background:linear-gradient(135deg,#E0FFF6,#B2F5E0);border:2.5px solid #6BE8C4}
.prog-wrap{background:#E8E0D8;border-radius:99px;height:10px;overflow:hidden;margin:6px 0}
.prog-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#FF9F43,#FF6B6B);transition:width .6s ease}
.daily-hero{background:linear-gradient(135deg,#FF9F43,#FF6B6B);border-radius:28px;padding:24px 20px;margin-bottom:16px;color:white;cursor:pointer}
.daily-title{font-size:26px;font-weight:900;font-family:'Fredoka',sans-serif;margin-bottom:6px}
.daily-sub{font-size:15px;font-weight:600;opacity:.9}
.streak-badge{background:rgba(255,255,255,.25);border-radius:50px;padding:5px 12px;font-size:13px;font-weight:800;display:inline-block;margin-bottom:8px}
.game-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.game-card{background:white;border-radius:22px;padding:18px 14px;cursor:pointer;transition:transform .15s;border:2.5px solid transparent;text-align:center;box-shadow:0 3px 12px rgba(0,0,0,.06)}
.game-card:active{transform:scale(.95)}
.gc-icon{font-size:36px;display:block;margin-bottom:8px}
.gc-label{font-size:15px;font-weight:800;color:#2D2A26;font-family:'Fredoka',sans-serif}
.gc-sub{font-size:12px;font-weight:600;color:#8B7E74;margin-top:2px}
.mem-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}
.mem-card{aspect-ratio:1;border-radius:16px;border:none;font-size:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.mem-hidden{background:#E8E0D8}
.mem-shown{background:#FFF3E0;border:3px solid #FF9F43}
.mem-matched{background:#EDFFF8;border:3px solid #1DD1A1}
.speed-area{min-height:200px;background:#F5F0EB;border-radius:22px;display:flex;align-items:center;justify-content:center;margin:16px 0}
.seq-box{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin:16px 0}
.seq-num{width:52px;height:52px;border-radius:14px;background:white;border:2.5px solid #E8E0D8;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;font-family:'Fredoka',sans-serif}
.seq-q{background:#FFF3E0;border-color:#FF9F43;color:#F08000;font-size:26px}
.seq-arr{font-size:16px;color:#8B7E74;font-weight:700}
.num-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.num-btn{background:white;border:3px solid #E8E0D8;border-radius:20px;padding:22px;font-size:30px;font-weight:900;font-family:'Fredoka',sans-serif;cursor:pointer;color:#2D2A26;transition:all .15s}
.num-btn:active{transform:scale(.94)}
.num-correct{background:#EDFFF8;border-color:#1DD1A1;animation:popIn .35s ease}
.num-wrong{background:#FFF0F0;border-color:#FF6B6B}
.num-reveal{background:#EDFFF8;border-color:#1DD1A1}
.room-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.room-btn{background:white;border:3px solid #E8E0D8;border-radius:20px;padding:20px 12px;cursor:pointer;font-family:'Nunito',sans-serif;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .15s}
.room-btn:active{transform:scale(.95)}
.room-correct{background:#EDFFF8;border-color:#1DD1A1}
.room-wrong{background:#FFF0F0;border-color:#FF6B6B}
.room-reveal{background:#EDFFF8;border-color:#1DD1A1}
.clue-box{background:#FFF8F0;border:2px solid #F0DDB8;border-radius:14px;padding:12px 16px;margin-bottom:8px;font-size:16px;font-weight:700;color:#2D2A26}
.clue-new{border-color:#FF9F43;background:#FFF3E0}
.lang-btn{background:white;border:2.5px solid #E8E0D8;border-radius:18px;padding:18px 20px;font-size:20px;font-weight:700;cursor:pointer;width:100%;margin-bottom:12px;display:flex;align-items:center;gap:14px;font-family:'Nunito',sans-serif;transition:all .2s}
.lang-btn.sel,.lang-btn:hover{border-color:#FF9F43;background:#FFF8F0}
.app-title{font-family:'Fredoka',sans-serif;font-size:42px;font-weight:700;color:#2D2A26}
.app-title span{color:#FF9F43}
h2.st{font-family:'Fredoka',sans-serif;font-size:24px;font-weight:600;color:#2D2A26;margin-bottom:4px}
.pl{font-size:14px;color:#8B7E74;font-weight:700;margin-bottom:14px}
.big-e{font-size:72px;text-align:center;display:block;margin:12px 0;animation:float 2s ease-in-out infinite}
.rhythm-circle{width:160px;height:160px;border-radius:50%;margin:16px auto;display:flex;align-items:center;justify-content:center;font-size:60px;transition:background .1s,box-shadow .1s;border:5px solid transparent}
.rh-idle{background:#F5F0EB}
.rh-play{background:#FF9F43;box-shadow:0 0 0 16px rgba(255,159,67,.2)}
.rh-input{background:#EBF5FF;border-color:#54A0FF;cursor:pointer}
.rh-good{background:#EDFFF8;border-color:#1DD1A1}
.rh-ok{background:#FFF8E0;border-color:#FF9F43}
.rh-miss{background:#FFF0F0;border-color:#FF6B6B}
.chat-wrap{display:flex;flex-direction:column;height:100vh;max-width:430px;margin:0 auto;background:#FFF8F0}
.chat-hdr{padding:16px 18px;background:white;border-bottom:2px solid #F0E8E0;display:flex;align-items:center;gap:12px;flex-shrink:0}
.chat-msgs{flex:1;overflow-y:auto;padding:16px}
.bubble-bot{background:white;border:2px solid #F0E8E0;border-radius:20px 20px 20px 4px;padding:14px 18px;max-width:80%;font-size:17px;line-height:1.5;font-weight:600;margin-bottom:12px}
.bubble-user{background:#54A0FF;color:white;border-radius:20px 20px 4px 20px;padding:14px 18px;max-width:80%;font-size:17px;line-height:1.5;font-weight:600;margin-bottom:12px;margin-left:auto}
.chat-in-area{padding:12px 16px;background:white;border-top:2px solid #F0E8E0;display:flex;gap:10px;flex-shrink:0}
.chat-in{flex:1;border:2.5px solid #E8E0D8;border-radius:16px;padding:14px 16px;font-size:17px;font-family:'Nunito',sans-serif;outline:none;background:#FFF8F0}
.chat-send{background:#FF9F43;border:none;border-radius:14px;padding:14px 18px;font-size:20px;cursor:pointer}
`;

// ── Data ─────────────────────────────────────────────────────────────────────
const shuffle = a => [...a].sort(() => Math.random() - 0.5);
const pick = (a, n) => shuffle(a).slice(0, n);

const T = {
  he:{dir:"rtl",back:"חזרה",playAgain:"שוב 🔄",menu:"תפריט",correct:"מצוין! 🎉",almost:"כמעט! 💪",done:"סיימנו! 🎊",dailyTitle:"האתגר היומי",dailySub:"10 דקות לשמור על המוח חד",streak:"ימים ברצף",chooseGame:"מה משחקים היום?",speed:"מהירות",memory:"זיכרון",language:"שפה",music:"מוזיקה",numbers:"מספרים",sorting:"מיון",trivia:"ידע",together:"ביחד",family:"דוח",chat:"שיחה",whatChanged:"מה השתנה?",whichRoom:"לאיזה חדר?",clueBtn:"רמז נוסף"},
  en:{dir:"ltr",back:"Back",playAgain:"Again 🔄",menu:"Menu",correct:"Correct! 🎉",almost:"Almost! 💪",done:"Done! 🎊",dailyTitle:"Daily Challenge",dailySub:"10 minutes to keep your mind sharp",streak:"day streak",chooseGame:"What shall we play?",speed:"Speed",memory:"Memory",language:"Language",music:"Music",numbers:"Numbers",sorting:"Sorting",trivia:"Trivia",together:"Together",family:"Report",chat:"Chat",whatChanged:"What changed?",whichRoom:"Which room?",clueBtn:"Next clue"},
};

const EMOJI_SETS=[["🍎","🐱","🌺","🏠","⭐","🌙"],["🦋","🎈","🍋","🐶","🌈","🎵"],["🐸","🍓","🚂","🌵","🎸","🦁"],["🍕","🐘","🌊","🎩","🍦","🦅"],["🌸","🐠","🎪","🍇","🚀","🦊"],["🏆","🌻","🐧","🍒","🎭","🦋"],["🍰","🐻","🌴","🎺","🦄","🌮"],["🐝","🍑","🚁","🌍","🎯","🦜"]];
const SPEED_HE=[{a:["🍎","🐱","🌺","🏠"],b:["🍎","🐶","🌺","🏠"],opts:["🐱 חתול","🏠 בית","🐶 כלב","🌺 פרח"],ans:"🐶 כלב"},{a:["⭐","🌙","☀️","🌈"],b:["⭐","🌙","🌧️","🌈"],opts:["⭐ כוכב","🌙 ירח","🌧️ גשם","☀️ שמש"],ans:"🌧️ גשם"},{a:["🍕","🎸","🐘","🚗"],b:["🍕","🎸","🦁","🚗"],opts:["🍕 פיצה","🎸 גיטרה","🦁 אריה","🚗 מכונית"],ans:"🦁 אריה"},{a:["🌸","🐠","🎩","🍇"],b:["🌸","🐠","🎩","🍓"],opts:["🌸 פרח","🐠 דג","🍓 תות","🍇 ענבים"],ans:"🍓 תות"},{a:["🚀","🦊","🎪","🍦"],b:["🚀","🐺","🎪","🍦"],opts:["🚀 רקטה","🦊 שועל","🐺 זאב","🎪 קרקס"],ans:"🐺 זאב"},{a:["🏆","🌻","🎺","🍒"],b:["🏆","🌻","🥁","🍒"],opts:["🏆 גביע","🌻 חמנייה","🎺 חצוצרה","🥁 תוף"],ans:"🥁 תוף"},{a:["🐝","🍑","🚁","🌍"],b:["🦋","🍑","🚁","🌍"],opts:["🐝 דבורה","🦋 פרפר","🍑 אפרסק","🚁 מסוק"],ans:"🦋 פרפר"},{a:["🎯","🦜","🍰","🌊"],b:["🎯","🦜","🍩","🌊"],opts:["🎯 מטרה","🦜 תוכי","🍰 עוגה","🍩 דונאט"],ans:"🍩 דונאט"}];
const SPEED_EN=[{a:["🍎","🐱","🌺","🏠"],b:["🍎","🐶","🌺","🏠"],opts:["🐱 Cat","🏠 House","🐶 Dog","🌺 Flower"],ans:"🐶 Dog"},{a:["⭐","🌙","☀️","🌈"],b:["⭐","🌙","🌧️","🌈"],opts:["⭐ Star","🌙 Moon","🌧️ Rain","☀️ Sun"],ans:"🌧️ Rain"},{a:["🍕","🎸","🐘","🚗"],b:["🍕","🎸","🦁","🚗"],opts:["🍕 Pizza","🎸 Guitar","🦁 Lion","🚗 Car"],ans:"🦁 Lion"},{a:["🌸","🐠","🎩","🍇"],b:["🌸","🐠","🎩","🍓"],opts:["🌸 Flower","🐠 Fish","🍓 Strawberry","🍇 Grapes"],ans:"🍓 Strawberry"},{a:["🚀","🦊","🎪","🍦"],b:["🚀","🐺","🎪","🍦"],opts:["🚀 Rocket","🦊 Fox","🐺 Wolf","🎪 Circus"],ans:"🐺 Wolf"},{a:["🏆","🌻","🎺","🍒"],b:["🏆","🌻","🥁","🍒"],opts:["🏆 Trophy","🌻 Sunflower","🎺 Trumpet","🥁 Drum"],ans:"🥁 Drum"},{a:["🐝","🍑","🚁","🌍"],b:["🦋","🍑","🚁","🌍"],opts:["🐝 Bee","🦋 Butterfly","🍑 Peach","🚁 Helicopter"],ans:"🦋 Butterfly"}];
const SENTENCES={
he:[
  {p:"שבת ___",a:"שלום",o:["שלום","טובה","קדושה","נעימה"]},
  {p:"שנה טובה ו___",a:"מתוקה",o:["מתוקה","שמחה","ארוכה","בריאה"]},
  {p:"בתיאבון ו___",a:"לבריאות",o:["לבריאות","בהצלחה","תודה","חיים"]},
  {p:"מזל טוב ו___",a:"בהצלחה",o:["בהצלחה","שמחה","ברכות","אמן"]},
  {p:"לילה טוב ו___",a:"שינה מתוקה",o:["שינה מתוקה","בוקר טוב","ערב טוב","יום טוב"]},
  {p:"ירושלים של ___",a:"זהב",o:["זהב","שלום","אור","כסף"]},
  {p:"הבה נגילה הבה נגילה ו___",a:"נשמחה",o:["נשמחה","נרנן","נשיר","נרקד"]},
  {p:"כל העולם כולו גשר ___ מאוד",a:"צר",o:["צר","רחב","ארוך","גבוה"]},
  {p:"עם ישראל ___",a:"חי",o:["חי","שר","חזק","אחד"]},
  {p:"דודי לי ואני ___",a:"לו",o:["לו","לה","לך","לנו"]},
  {p:"חנוכה חנוכה חג יפה כל ___",a:"כך",o:["כך","זה","מאוד","כה"]},
  {p:"שמע ישראל ה׳ אלוהינו ה׳ ___",a:"אחד",o:["אחד","גדול","אמת","שלום"]},
  {p:"אם אין קמח אין ___",a:"תורה",o:["תורה","לחם","מים","שלום"]},
  {p:"ואהבת לרעך ___",a:"כמוך",o:["כמוך","כנפשך","כאחיך","כלבבך"]},
  {p:"סביבון סוב סוב ___",a:"סוב",o:["סוב","טוב","עוד","חג"]},
  {p:"לכה דודי לקראת ___ נקבלה",a:"כלה",o:["כלה","שבת","נשמה","אור"]},
  {p:"כל ישראל ערבים זה ___",a:"בזה",o:["בזה","לזה","עם זה","כזה"]},
  {p:"על כל אלה שמור נא לי ___",a:"אלי",o:["אלי","אלה","עלי","אמי"]},
  {p:"הנה מה טוב ומה נעים שבת אחים גם ___",a:"יחד",o:["יחד","אחד","שם","כן"]},
  {p:"בשנה הבאה בירושלים ___",a:"הבנויה",o:["הבנויה","השלמה","החדשה","העתיקה"]},
  {p:"לו יהי כל שנבקש לו ___",a:"יהי",o:["יהי","יבוא","ייתן","יחלום"]},
  {p:"ארץ זבת חלב ו___",a:"דבש",o:["דבש","יין","שמן","מים"]},
  {p:"דרור יקרא לבן עם ___",a:"בת",o:["בת","אם","אב","אח"]},
  {p:"תנו לשמש לעלות לבוקר ___",a:"להאיר",o:["להאיר","לזרוח","לצאת","לשיר"]},
  {p:"אני מאמין באמונה ___",a:"שלמה",o:["שלמה","חזקה","גדולה","עמוקה"]},
  {p:"כבד את אביך ואת ___",a:"אמך",o:["אמך","אחיך","רעך","בנך"]},
  {p:"לא בחיל ולא בכוח כי אם ברוחי אמר ___",a:"ה׳",o:["ה׳","האל","אדוני","שמים"]},
  {p:"ראש השנה בא לו ראש השנה ___",a:"בא",o:["בא","היה","עבר","הגיע"]},
  {p:"תפוח בדבש נאכל שנה טובה ___",a:"נקבל",o:["נקבל","נשיר","נשחק","נחגוג"]},
  {p:"תפוח בדבש נאכל שנה טובה ___",a:"נקבל",o:["נקבל","נשיר","נשחק","נחגוג"]},
],
en:[
  {p:"Better safe than ___",a:"sorry",o:["sorry","late","lost","done"]},
  {p:"An apple a day keeps the ___ away",a:"doctor",o:["doctor","dentist","cold","flu"]},
  {p:"The early bird catches the ___",a:"worm",o:["worm","fish","bug","prize"]},
  {p:"Every cloud has a silver ___",a:"lining",o:["lining","light","side","edge"]},
  {p:"All that glitters is not ___",a:"gold",o:["gold","silver","good","real"]},
  {p:"A stitch in time saves ___",a:"nine",o:["nine","time","all","much"]},
  {p:"Two heads are better than ___",a:"one",o:["one","none","two","three"]},
  {p:"Actions speak louder than ___",a:"words",o:["words","thoughts","feelings","ideas"]},
  {p:"Where there's a will there's a ___",a:"way",o:["way","chance","hope","dream"]},
  {p:"You are my sunshine, my only ___",a:"sunshine",o:["sunshine","darling","love","light"]},
  {p:"Twinkle twinkle little ___, how I wonder what you are",a:"star",o:["star","moon","light","sun"]},
  {p:"Somewhere over the ___",a:"rainbow",o:["rainbow","mountains","clouds","sky"]},
  {p:"What a wonderful ___",a:"world",o:["world","life","day","time"]},
  {p:"You'll never walk ___",a:"alone",o:["alone","away","back","home"]},
  {p:"Yesterday, all my troubles seemed so far ___",a:"away",o:["away","gone","past","done"]},
  {p:"Old MacDonald had a farm, E-I-E-I-___",a:"O",o:["O","A","E","U"]},
  {p:"The wheels on the bus go round and ___",a:"round",o:["round","down","up","fast"]},
  {p:"If you're happy and you know it clap your ___",a:"hands",o:["hands","feet","knees","head"]},
  {p:"Row row row your boat gently down the ___",a:"stream",o:["stream","river","lake","sea"]},
  {p:"My bonnie lies over the ___ my bonnie lies over the sea",a:"ocean",o:["ocean","river","mountain","sea"]},
  {p:"Que sera sera whatever will be will ___",a:"be",o:["be","go","come","stay"]},
  {p:"Moon river wider than a ___",a:"mile",o:["mile","river","dream","smile"]},
  {p:"Let it be let it be whisper words of ___",a:"wisdom",o:["wisdom","comfort","kindness","peace"]},
  {p:"Stand by me oh stand by ___",a:"me",o:["me","her","him","you"]},
  {p:"Happy birthday to you happy birthday to ___",a:"you",o:["you","me","us","all"]},
  {p:"A penny saved is a penny ___",a:"earned",o:["earned","saved","spent","lost"]},
  {p:"Look before you ___",a:"leap",o:["leap","walk","run","go"]},
  {p:"Don't count your chickens before they ___",a:"hatch",o:["hatch","grow","arrive","come"]},
  {p:"Good night sleep ___",a:"tight",o:["tight","well","long","sound"]},
  {p:"Thank you very ___",a:"much",o:["much","well","kind","good"]},
]};
const SONGS={
he:[
  {l:"בשנה הבאה נשב על המרפסת ונספור ציפורים ___",a:"נודדות",o:["נודדות","שרות","טסות","עפות"],t:"בשנה הבאה",e:"🕊️"},
  {l:"אי אבדה הדרך אל הכפר הדרך בה רציתי לשוב ___",a:"בחזרה",o:["בחזרה","הביתה","אליה","שוב"],t:"הדרך אל הכפר",e:"🌾"},
  {l:"זה סימן שאתה ___ כמו יום אביב בהיר",a:"צעיר",o:["צעיר","ילד","חי","שמח"],t:"סימן שאתה צעיר",e:"🌸"},
  {l:"השמש ידם בין עזה לרפיח ירח ילבין על פסגת ___",a:"החרמון",o:["החרמון","הגליל","הכרמל","הנגב"],t:"פרחים בקנה",e:"🌺"},
  {l:"אל השמש הזאת לרוחות העזות כי הים לכולנו ___",a:"פתוח",o:["פתוח","שייך","קרוב","חופשי"],t:"בוא אלינו לים",e:"🌊"},
  {l:"אין לי ארץ אחרת גם אם אדמתי ___",a:"בוערת",o:["בוערת","רועדת","בוכה","שורפת"],t:"אין לי ארץ אחרת",e:"🇮🇱"},
  {l:"שלום לך ארץ נהדרת עבדך הדל נושא לך שיר ___",a:"מזמור",o:["מזמור","ותפילה","ושיר","ושבח"],t:"שלום לך ארץ נהדרת",e:"🌿"},
  {l:"תנו לשמש לעלות לבוקר ___",a:"להאיר",o:["להאיר","לזרוח","לצאת","לשיר"],t:"שיר לשלום",e:"☮️"},
  {l:"מי ידע שכך יהיה שבכמה לילות ללא ___",a:"אמא",o:["אמא","שינה","אור","חום"],t:"מי ידע שכך יהיה",e:"🌙"},
  {l:"אני רוצה שתדעי זה מכאן עד הסוף בטוב וברע אני אמשיך ___",a:"לאהוב",o:["לאהוב","להיות","ללכת","לחיות"],t:"עד סוף העולם",e:"❤️"},
  {l:"שבחי ירושלים את אדוני הללי אלוהיך ___",a:"ציון",o:["ציון","ישראל","עמו","עיר"],t:"שבחי ירושלים",e:"🕍"},
  {l:"אויר הרים צלול כיין וריח ___",a:"אורנים",o:["אורנים","פרחים","עצים","הרים"],t:"ירושלים של זהב",e:"🏔️"},
  {l:"עוף גוזל חתוך את ___",a:"השמיים",o:["השמיים","האוויר","הרוח","הענן"],t:"עוף גוזל",e:"🦅"},
  {l:"שמור נא עלינו כמו ילדים שמור נא ואל ___",a:"תעזוב",o:["תעזוב","תלך","תשכח","תרחק"],t:"תפילה",e:"🙏"},
  {l:"לעולם בעקבות השמש לעולם בעקבות ___",a:"האור",o:["האור","החום","השמש","הדרך"],t:"לעולם בעקבות השמש",e:"☀️"},
  {l:"מלאך מטיל בשמים מלאך מבקש ___",a:"כוכבים",o:["כוכבים","שלום","חלומות","עננים"],t:"גבריאל",e:"✨"},
  {l:"זה השיר שסבא שר אותו לאבא והיום ___",a:"אני",o:["אני","אתה","אנחנו","הוא"],t:"חי",e:"🎵"},
  {l:"בתשרי נתן הדקל פרי שחום ___",a:"נחמד",o:["נחמד","וטוב","ויפה","ומתוק"],t:"שנים עשר ירחים",e:"📅"},
  {l:"הלוואי ומענן תרד עלינו קשת הלוואי שלעולם הזה יש ___",a:"תקנה",o:["תקנה","שלום","תקווה","אור"],t:"הלוואי",e:"🌈"},
  {l:"כבר אחרי חצות עוד לא כיבו את ___",a:"הירח",o:["הירח","הכוכבים","השמש","האור"],t:"כבר אחרי חצות",e:"🌙"},
  {l:"אני נולדתי לשלום שרק ___",a:"יגיע",o:["יגיע","יבוא","יהיה","ימצא"],t:"נולדתי לשלום",e:"🕊️"},
  {l:"ים השיבולים שמסביב על גליו לשוט יצא ___",a:"הרוח",o:["הרוח","הגל","הציפור","הזמן"],t:"ים השיבולים",e:"🌾"},
  {l:"קח מקל קח תרמיל בוא איתי אל ___",a:"הגליל",o:["הגליל","ההר","הכנרת","הים"],t:"קח מקל קח תרמיל",e:"🎒"},
  {l:"ימי החנוכה חנוכת מקדשנו בגיל ובשמחה ממלאים את ___",a:"ליבנו",o:["ליבנו","חיינו","עולמנו","ביתנו"],t:"ימי החנוכה",e:"🕎"},
  {l:"חנוכיה לי יש צוחקת בה ___",a:"האש",o:["האש","האור","הלהבה","הנר"],t:"חנוכיה לי יש",e:"🕎"},
  {l:"באנו חושך לגרש בידינו אור ___",a:"ואש",o:["ואש","ושיר","ונר","ואור"],t:"באנו חושך לגרש",e:"🕯️"},
  {l:"וביושר לבב שוב תהיי ענווה ונכנעת כאחד ___",a:"האדם",o:["האדם","הדשאים","הפרחים","הצמחים"],t:"את תלכי בשדה",e:"🌿"},
  {l:"ירושלים של זהב ושל נחושת ושל ___",a:"אור",o:["אור","שמים","שיר","כסף"],t:"ירושלים של זהב",e:"🕍"},
  {l:"הבה נגילה הבה נגילה ו___",a:"נשמחה",o:["נשמחה","נרנן","נשיר","נרקד"],t:"הבה נגילה",e:"🎊"},
  {l:"לו יהי כל שנבקש לו ___",a:"יהי",o:["יהי","יבוא","ייתן","יחלום"],t:"לו יהי",e:"🕊️"},
  {l:"כל העולם כולו גשר ___ מאוד",a:"צר",o:["צר","רחב","ארוך","גבוה"],t:"גשר צר מאוד",e:"🌉"},
  {l:"עם ישראל ___",a:"חי",o:["חי","שר","חזק","אחד"],t:"עם ישראל חי",e:"✡️"},
  {l:"הנה מה טוב ומה נעים שבת אחים גם ___",a:"יחד",o:["יחד","אחד","שם","כן"],t:"הנה מה טוב",e:"🤝"},
  {l:"חנוכה חנוכה חג יפה כל ___",a:"כך",o:["כך","זה","מאוד","כה"],t:"חנוכה",e:"🕎"},
  {l:"דודי לי ואני ___",a:"לו",o:["לו","לה","לך","לנו"],t:"דודי לי",e:"💛"},
  {l:"על כל אלה שמור נא לי ___",a:"אלי",o:["אלי","אלה","עלי","אמי"],t:"על כל אלה",e:"🌿"},
  {l:"אני מאמין באמונה ___",a:"שלמה",o:["שלמה","חזקה","גדולה","עמוקה"],t:"אני מאמין",e:"🌟"},
  {l:"סביבון סוב סוב ___",a:"סוב",o:["סוב","טוב","עוד","חג"],t:"סביבון",e:"🕎"},
  {l:"שמע ישראל ה'אלוהינו ה'___",a:"אחד",o:["אחד","גדול","אמת","שלום"],t:"שמע ישראל",e:"📜"},
  {l:"שבת שלום שבת שלום שבת שבת ___",a:"שלום",o:["שלום","טובה","קדושה","שמחה"],t:"שבת שלום",e:"🕯️"},
  {l:"תפוח בדבש נאכל שנה טובה ___",a:"נקבל",o:["נקבל","נשיר","נחגוג","נשמח"],t:"תפוח בדבש",e:"🍯"},
  {l:"אם אשכחך ירושלים תשכח ___",a:"ימיני",o:["ימיני","שמאלי","עיני","פי"],t:"אם אשכחך",e:"🕍"},
  {l:"פרפר נחמד פרפר נחמד עוף עוף אל ה___",a:"שדה",o:["שדה","פרח","עץ","שמים"],t:"פרפר נחמד",e:"🦋"},
  {l:"בשנה הבאה בירושלים ___",a:"הבנויה",o:["הבנויה","השלמה","החדשה","העתיקה"],t:"בשנה הבאה בירושלים",e:"🕍"},
  {l:"שיר המעלות בשוב ה'את שיבת ___",a:"ציון",o:["ציון","ירושלים","ישראל","עמו"],t:"שיר המעלות",e:"🏔️"},
],
en:[
  {l:"You are my sunshine, my only ___",a:"sunshine",o:["sunshine","darling","love","light"],t:"You Are My Sunshine",e:"☀️"},
  {l:"Twinkle twinkle little ___, how I wonder what you are",a:"star",o:["star","moon","light","sun"],t:"Twinkle Twinkle",e:"⭐"},
  {l:"Somewhere over the ___",a:"rainbow",o:["rainbow","mountains","clouds","sky"],t:"Over the Rainbow",e:"🌈"},
  {l:"What a wonderful ___",a:"world",o:["world","life","day","time"],t:"Wonderful World",e:"🌍"},
  {l:"You'll never walk ___",a:"alone",o:["alone","away","back","home"],t:"You'll Never Walk Alone",e:"🤝"},
  {l:"Yesterday, all my troubles seemed so far ___",a:"away",o:["away","gone","past","done"],t:"Yesterday",e:"💛"},
  {l:"Let it be let it be whisper words of ___",a:"wisdom",o:["wisdom","comfort","kindness","peace"],t:"Let It Be",e:"🕊️"},
  {l:"Stand by me oh stand by ___",a:"me",o:["me","her","him","you"],t:"Stand By Me",e:"🌟"},
  {l:"Moon river wider than a ___",a:"mile",o:["mile","river","dream","smile"],t:"Moon River",e:"🌙"},
  {l:"Old MacDonald had a farm E-I-E-I-___",a:"O",o:["O","A","E","U"],t:"Old MacDonald",e:"🐄"},
  {l:"The wheels on the bus go round and ___",a:"round",o:["round","down","up","fast"],t:"Wheels on the Bus",e:"🚌"},
  {l:"If you're happy and you know it clap your ___",a:"hands",o:["hands","feet","knees","head"],t:"If You're Happy",e:"👏"},
  {l:"My bonnie lies over the ___ my bonnie lies over the sea",a:"ocean",o:["ocean","river","mountain","sea"],t:"My Bonnie",e:"🌊"},
  {l:"Que sera sera whatever will be will ___",a:"be",o:["be","go","come","stay"],t:"Que Sera Sera",e:"🎶"},
  {l:"Happy birthday to you happy birthday to ___",a:"you",o:["you","me","us","all"],t:"Happy Birthday",e:"🎂"},
  {l:"Oh when the saints go marching ___",a:"in",o:["in","out","by","up"],t:"When the Saints Go Marching In",e:"🎺"},
  {l:"Swing low sweet chariot coming for to carry me ___",a:"home",o:["home","away","back","free"],t:"Swing Low Sweet Chariot",e:"🎵"},
  {l:"Danny boy the pipes the pipes are ___",a:"calling",o:["calling","playing","ringing","singing"],t:"Danny Boy",e:"🍀"},
  {l:"Take me out to the ball game take me out to the ___",a:"crowd",o:["crowd","park","game","show"],t:"Take Me Out to the Ball Game",e:"⚾"},
  {l:"My favorite things raindrops on roses and whiskers on ___",a:"kittens",o:["kittens","puppies","bunnies","babies"],t:"My Favorite Things",e:"🌹"},
]};
const RHYTHMS=[{p:[350,350,350],l:"•  •  •"},{p:[600,250,250,600],l:"—  •  •  —"},{p:[250,250,700,250],l:"•  •  —  •"},{p:[450,450,250,250,250],l:"—  —  •  •  •"},{p:[350,700,350],l:"•  —  •"}];

const DAILY_TIPS = {
  he: [
    {icon:"😴", tip:"שינה של 7-9 שעות בלילה מפחיתה סיכון לדמנציה ב-30%"},
    {icon:"🚶", tip:"30 דקות הליכה ביום משפרות זיכרון ותפקוד מוחי"},
    {icon:"🫐", tip:"אוכמניות, אגוזים ואבוקדו מגנים על תאי המוח"},
    {icon:"💧", tip:"שתייה של 8 כוסות מים ביום חיונית לתפקוד המוח"},
    {icon:"🧩", tip:"לימוד משהו חדש כל יום בונה 'רזרבה קוגניטיבית'"},
    {icon:"👥", tip:"קשרים חברתיים מפחיתים סיכון לדמנציה ב-45%"},
    {icon:"🎵", tip:"האזנה למוזיקה אהובה מחזקת זיכרון רגשי"},
    {icon:"🧘", tip:"10 דקות מדיטציה ביום מפחיתות דלקת במוח"},
    {icon:"📖", tip:"קריאה יומית מחזקת את הרשתות הנוירולוגיות"},
    {icon:"🌳", tip:"15 דקות בחוץ ביום מגבירות ויטמין D ומגנות על המוח"},
    {icon:"🍅", tip:"תזונה ים-תיכונית מפחיתה סיכון לאלצהיימר ב-35%"},
    {icon:"✍️", tip:"כתיבת יומן מחזקת זיכרון אפיזודי"},
    {icon:"🎯", tip:"לשחק משחקים כמו אלה שכאן — 10 דקות ביום — מועיל קלינית!"},
    {icon:"🤝", tip:"שיחה עם אנשים אהובים מפחיתה בדידות ומגנה על המוח"},
    {icon:"🥦", tip:"ירקות ירוקים כמו ברוקולי ותרד עשירים בחומרים המגנים על המוח"},
    {icon:"🎨", tip:"יצירה אמנותית — ציור, סריגה, בישול — מפעילה אזורים ייחודיים במוח"},
    {icon:"🚴", tip:"פעילות גופנית סדירה מגדילה נפח ההיפוקמפוס — מרכז הזיכרון"},
    {icon:"☕", tip:"1-2 כוסות קפה ביום קשורות לסיכון נמוך יותר לאלצהיימר"},
    {icon:"🌊", tip:"שחייה משלבת פעילות גופנית וקואורדינציה — מצוינת למוח"},
    {icon:"🎭", tip:"צפייה בתיאטרון, קולנוע ואמנות מפעילה רשתות רגשיות ויצירתיות"},
    {icon:"🧠", tip:"למד שיר חדש בעל פה — אחת הפעילויות הטובות ביותר לזיכרון"},
    {icon:"🌸", tip:"גינון מפחית מתח, מגביר תנועה, ומחבר לטבע — שלישיית מנצחים"},
    {icon:"📞", tip:"התקשר לחבר ישן — חיבורים חברתיים פעילים מגנים על המוח"},
    {icon:"🍳", tip:"בישול מתכון חדש משלב תכנון, זיכרון, ויצירתיות — מצוין למוח"},
    {icon:"🌅", tip:"צפה בשקיעה בחוץ — האור הטבעי מסנכרן את השעון הביולוגי שלך"},
    {icon:"💃", tip:"ריקוד — גם בבית — משלב מוזיקה, תנועה וזיכרון מוטורי"},
    {icon:"🎲", tip:"שחמט, שש-בש, ופאזלים — משחקי אסטרטגיה מפעילים חשיבה מתוכננת"},
    {icon:"🍵", tip:"תה ירוק עשיר בנוגדי חמצון המגנים על תאי המוח"},
    {icon:"😂", tip:"צחוק מפחית קורטיזול ומגביר אנדורפינים — טוב למוח ולנפש!"},
    {icon:"🙏", tip:"תרגיל כפיים: ספור אחורה מ-100 ב-7 — מאמן ריכוז וחישוב"},
    {icon:"🌻", tip:"הביטו בתמונות ישנות — זיכרון חזותי מגרה רשתות נוסטלגיה במוח"},
    {icon:"🎸", tip:"לנגן כלי נגינה — גם בסיסי — הוא אחד האימונים הטובים ביותר למוח"},
  ],
  en: [
    {icon:"😴", tip:"7-9 hours of sleep per night reduces dementia risk by 30%"},
    {icon:"🚶", tip:"30 minutes of walking daily improves memory and brain function"},
    {icon:"🫐", tip:"Blueberries, walnuts and avocado protect brain cells"},
    {icon:"💧", tip:"Drinking 8 glasses of water daily is vital for brain function"},
    {icon:"🧩", tip:"Learning something new every day builds 'cognitive reserve'"},
    {icon:"👥", tip:"Social connections reduce dementia risk by 45%"},
    {icon:"🎵", tip:"Listening to favorite music strengthens emotional memory"},
    {icon:"🧘", tip:"10 minutes of meditation daily reduces brain inflammation"},
    {icon:"📖", tip:"Daily reading strengthens neurological networks"},
    {icon:"🌳", tip:"15 minutes outdoors daily boosts Vitamin D and protects the brain"},
    {icon:"🍅", tip:"Mediterranean diet reduces Alzheimer's risk by 35%"},
    {icon:"✍️", tip:"Keeping a journal strengthens episodic memory"},
    {icon:"🎯", tip:"Playing games like these — 10 minutes daily — is clinically proven!"},
    {icon:"🤝", tip:"Talking with loved ones reduces loneliness and protects the brain"},
    {icon:"🥦", tip:"Green vegetables like broccoli and spinach protect brain cells"},
    {icon:"🎨", tip:"Creative activities — painting, knitting, cooking — activate unique brain areas"},
    {icon:"🚴", tip:"Regular exercise grows the hippocampus — your brain's memory center"},
    {icon:"☕", tip:"1-2 cups of coffee daily is linked to lower Alzheimer's risk"},
    {icon:"😂", tip:"Laughter reduces cortisol and boosts endorphins — great for brain and soul!"},
    {icon:"🎲", tip:"Chess, puzzles, and strategy games activate planning and memory"},
    {icon:"💃", tip:"Dancing combines music, movement and motor memory — wonderful for the brain"},
    {icon:"📞", tip:"Call an old friend — active social connections protect the brain"},
  ],
};

// ── Lang Screen ───────────────────────────────────────────────────────────────
function LangScreen({ onSelect }) {
  const [sel, setSel] = useState(null);
  return (
    <div className="screen" style={{display:"flex",flexDirection:"column",justifyContent:"center",minHeight:"100vh"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <h1 className="app-title">Cogni<span>Play</span></h1>
        <p style={{fontSize:16,color:"#8B7E74",fontWeight:600,marginTop:6}}>🧠 משחקים שמחזקים את המוח</p>
      </div>
      {[{c:"he",f:"🇮🇱",l:"עברית"},{c:"en",f:"🇺🇸",l:"English"},{c:"ar",f:"🇸🇦",l:"العربية",dis:true},{c:"ru",f:"🇷🇺",l:"Русский",dis:true}].map(x=>(
        <button key={x.c} className={`lang-btn${sel===x.c?" sel":""}`} style={{opacity:x.dis?.4:1}} onClick={()=>!x.dis&&setSel(x.c)} disabled={x.dis}>
          <span style={{fontSize:30}}>{x.f}</span><span style={{flex:1}}>{x.l}</span>
          {x.dis&&<span style={{fontSize:12,color:"#8B7E74"}}>בקרוב</span>}
        </button>
      ))}
      <button className="btn btn-sun" style={{marginTop:24}} onClick={()=>sel&&onSelect(sel)} disabled={!sel}>
        {sel?(sel==="he"?"בואו נתחיל! →":"Let's Go! →"):"↑ בחרו שפה"}
      </button>
    </div>
  );
}

// ── Menu ──────────────────────────────────────────────────────────────────────
function MenuScreen({ t, lang, streak, name, onSelect }) {
  const isHe = lang==="he";
  const games=[{id:"speed",e:"⚡",c:"#FFF3E0",l:t.speed,s:isHe?"מה השתנה?":"What changed?"},{id:"memory",e:"🃏",c:"#E3F2FD",l:t.memory,s:isHe?"מצא זוגות":"Find pairs"},{id:"language",e:"💬",c:"#E8F5E9",l:t.language,s:isHe?"השלם":"Complete"},{id:"music",e:"🎵",c:"#F3E5F5",l:t.music,s:isHe?"שירים":"Songs"},{id:"trivia",e:"🏆",c:"#FFF8E1",l:t.trivia,s:isHe?"ידע ישראלי":"Quiz"},{id:"numbers",e:"🔢",c:"#E0F7FA",l:t.numbers,s:isHe?"סדרות":"Sequences"},{id:"sorting",e:"🏠",c:"#FCE4EC",l:t.sorting,s:isHe?"לאיזה חדר?":"Which room?"},{id:"animal",e:"🐾",c:"#F1F8E9",l:isHe?"בעלי חיים":"Animals",s:isHe?"מי זה?":"Who's this?"},{id:"together",e:"👥",c:"#FFF9C4",l:t.together,s:isHe?"עם משפחה":"With family"},{id:"chat",e:"🤖",c:"#E8F5E9",l:t.chat,s:"CogniBot"},{id:"family",e:"📊",c:"#F5F5F5",l:t.family,s:isHe?"מעקב":"Track"}];
  const greeting = name ? (isHe ? `שלום, ${name}! 👋` : `Hello, ${name}! 👋`) : (isHe?"שלום! 👋":"Hello! 👋");
  return (
    <div className="screen" style={{direction:t.dir}}>
      <p style={{fontSize:18,fontWeight:800,color:"#FF9F43",marginBottom:12}}>{greeting}</p>
      <div className="daily-hero" onClick={()=>onSelect("daily")}>
        <div className="streak-badge">🔥 {streak} {t.streak}</div>
        <div className="daily-title">☀️ {t.dailyTitle}</div>
        <div className="daily-sub">{t.dailySub}</div>
        <button className="btn btn-ghost" style={{marginTop:12,fontSize:16,padding:"12px 20px"}} onClick={e=>{e.stopPropagation();onSelect("daily");}}>
          {isHe?"התחל אתגר! →":"Start Challenge! →"}
        </button>
      </div>
      <p style={{fontSize:15,fontWeight:800,color:"#8B7E74",marginBottom:12}}>{t.chooseGame}</p>
      <div className="game-grid">
        {games.map(g=>(
          <div key={g.id} className="game-card" style={{background:g.c}} onClick={()=>onSelect(g.id)}>
            <span className="gc-icon">{g.e}</span>
            <div className="gc-label">{g.l}</div>
            <div className="gc-sub">{g.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Name Screen ───────────────────────────────────────────────────────────────
function NameScreen({ lang, onDone }) {
  const isHe = lang==="he";
  const [name, setName] = useState("");
  const [gender, setGender] = useState(null); // "m" | "f"
  return (
    <div className="screen" style={{direction:T[lang].dir,display:"flex",flexDirection:"column",justifyContent:"center",minHeight:"100vh"}}>
      <span className="big-e">👋</span>
      <h2 style={{fontFamily:"Fredoka,sans-serif",fontSize:30,textAlign:"center",marginBottom:8}}>
        {isHe?"איך קוראים לך?":"What's your name?"}
      </h2>
      <p style={{fontSize:16,color:"#8B7E74",fontWeight:600,textAlign:"center",marginBottom:24}}>
        {isHe?"כדי שנוכל לקרוא לך בשם 😊":"So we can greet you personally 😊"}
      </p>
      <input
        value={name}
        onChange={e=>setName(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&name.trim()&&gender&&onDone(name.trim(),gender)}
        placeholder={isHe?"שם פרטי...":"Your name..."}
        style={{border:"2.5px solid #E8E0D8",borderRadius:16,padding:"18px 20px",fontSize:22,fontFamily:"Nunito,sans-serif",outline:"none",background:"white",textAlign:"center",width:"100%",marginBottom:16,direction:T[lang].dir}}
        autoFocus
      />
      {isHe && (
        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <button onClick={()=>setGender("f")} style={{
            flex:1,padding:"16px",fontSize:20,fontWeight:800,borderRadius:16,cursor:"pointer",fontFamily:"Fredoka,sans-serif",border:`2.5px solid ${gender==="f"?"#FF9F43":"#E8E0D8"}`,background:gender==="f"?"#FFF3E0":"white",color:gender==="f"?"#F08000":"#2D2A26"
          }}>👩 נקבה</button>
          <button onClick={()=>setGender("m")} style={{
            flex:1,padding:"16px",fontSize:20,fontWeight:800,borderRadius:16,cursor:"pointer",fontFamily:"Fredoka,sans-serif",border:`2.5px solid ${gender==="m"?"#54A0FF":"#E8E0D8"}`,background:gender==="m"?"#E3F2FD":"white",color:gender==="m"?"#1464B4":"#2D2A26"
          }}>👨 זכר</button>
        </div>
      )}
      <button className="btn btn-sun" onClick={()=>{onDone(name.trim(), gender||"m");}} disabled={isHe&&!gender}>
        {isHe?"בואו נתחיל! →":"Let's Go! →"}
      </button>
      <button className="btn btn-ghost" onClick={()=>onDone("", gender||"m")} style={{fontSize:15}}>
        {isHe?"דלג":"Skip"}
      </button>
    </div>
  );
}
// ── Daily Challenge ──────────────────────────────────────────────────────────
// buildDailySteps defined outside component to avoid recreation
function buildDailySteps(lang) {
  return [
    {game:"speed",    data:shuffle(lang==="he"?SPEED_HE:SPEED_EN).slice(0,3)},
    {game:"language", data:shuffle(SENTENCES[lang]).slice(0,3)},
    {game:"music",    data:shuffle(SONGS[lang]).slice(0,3)},
    {game:"animal",   data:shuffle(lang==="he"?ANIMALS_HE:ANIMALS_EN).slice(0,2)},
    {game:"trivia",   data:shuffle(TRIVIA[lang]).slice(0,3)},
    {game:"numbers",  data:shuffle(NUMBERS).slice(0,2)},
    {game:"sorting",  data:shuffle(ROOM_ITEMS[lang]).slice(0,3)},
  ];
}

function DailyChallenge({ t, lang, name, gender="m", onBack, onComplete }) {
  const isHe = lang==="he";
  const isRtl = T[lang].dir==="rtl";

  // ALL hooks declared at top - never conditionally
  const [started,   setStarted]   = useState(false);
  const [steps]     = useState(()=>buildDailySteps(lang));
  const [stepIdx,   setStepIdx]   = useState(0);
  const [qIdx,      setQIdx]      = useState(0);
  const [score,     setScore]     = useState(0);
  const [isDone,    setIsDone]    = useState(false);
  const [chosen,    setChosen]    = useState(null);
  const [phase,     setPhase]     = useState("before");
  const [clueLevel, setClueLevel] = useState(0);
  const msgIdx = useRef(Math.floor(Math.random()*7));

  const si   = Math.min(stepIdx, steps.length-1);
  const qi   = Math.min(qIdx, steps[si].data.length-1);
  const step = steps[si];
  const item = step.data[qi];
  const total = steps.reduce((s,x)=>s+x.data.length, 0);
  const doneCount = steps.slice(0,si).reduce((s,x)=>s+x.data.length, 0) + qi;
  const pct = Math.round((doneCount/total)*100);
  const gameEmoji = {speed:"⚡",language:"💬",music:"🎵",trivia:"🏆",numbers:"🔢",sorting:"🏠"};

  useEffect(()=>{
    if(!started) return;
    setChosen(null); setClueLevel(0); setPhase("before");
  },[si, qi]); // eslint-disable-line

  useEffect(()=>{
    if(!started || step.game!=="speed" || isDone || chosen) return;
    if(phase==="before"){const x=setTimeout(()=>setPhase("img1"),700); return()=>clearTimeout(x);}
    if(phase==="img1")  {const x=setTimeout(()=>setPhase("img2"),1800);return()=>clearTimeout(x);}
    if(phase==="img2")  {const x=setTimeout(()=>setPhase("ans"), 900); return()=>clearTimeout(x);}
  },[phase, step.game, isDone, chosen, started]);

  const advance = (pts) => {
    setScore(s=>s+pts);
    const nq = qIdx+1;
    if(nq >= step.data.length){
      const ns = stepIdx+1;
      if(ns >= steps.length) setIsDone(true);
      else { setStepIdx(ns); setQIdx(0); }
    } else setQIdx(nq);
  };

  const pick2 = (opt, ans) => {
    if(chosen) return;
    playClick();
    setChosen(opt);
    if(opt===ans) sayCorrect(lang); else sayWrong(lang);
    setTimeout(()=>advance(opt===ans?10:0), 1100);
  };

  const optBtn = (opt, ans) => {
    let cls = `opt${isRtl?"":" opt-ltr"}`;
    if(chosen===opt) cls += opt===ans?" opt-correct":" opt-wrong";
    else if(chosen&&opt===ans) cls += " opt-reveal";
    return <button key={opt} className={cls} onClick={()=>pick2(opt,ans)}>{opt}</button>;
  };

  const tipIdx = useRef(Math.floor(Math.random()*14));
  const tip = DAILY_TIPS[lang][tipIdx.current % DAILY_TIPS[lang].length];

  // Start screen
  if(!started) return(
    <div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center",minHeight:"100vh"}}>
      <span style={{fontSize:72,display:"block",marginBottom:12}}>☀️</span>
      <h2 style={{fontFamily:"Fredoka,sans-serif",fontSize:28,marginBottom:6}}>
        {name ? (isHe?`שלום ${name}! 👋`:`Hello ${name}! 👋`) : (isHe?"שלום! 👋":"Hello! 👋")}
      </h2>
      {/* טיפ יומי */}
      <div style={{background:"#FFF8F0",border:"2px solid #FFD08A",borderRadius:18,padding:"14px 18px",margin:"14px 0 20px",textAlign:"center"}}>
        <p style={{fontSize:22,marginBottom:6}}>{tip.icon}</p>
        <p style={{fontSize:14,fontWeight:700,color:"#2D2A26",lineHeight:1.5}}>{isHe?"💡 טיפ בריאות יומי:":"💡 Daily Health Tip:"}</p>
        <p style={{fontSize:15,fontWeight:600,color:"#8B7E74",lineHeight:1.5,marginTop:4}}>{tip.tip}</p>
      </div>
      <button className="btn btn-sun" style={{fontSize:20,padding:"18px"}} onClick={()=>{
        playStart();
        speakDailyStart(lang, name, gender);
        showToast(name?(isHe?`בהצלחה ${name}! 🚀`:`Good luck ${name}! 🚀`):(isHe?"בהצלחה! 🚀":"Good luck! 🚀"), "#FF9F43");
        // המתן 3 שניות לפני שמתחילות השאלות
        setTimeout(()=>setStarted(true), 3000);
      }}>
        {isHe?"בואו נתחיל! 🚀":"Let's Go! 🚀"}
      </button>
      <button className="btn btn-ghost" style={{marginTop:8,fontSize:16}} onClick={onBack}>{t.back}</button>
    </div>
  );

  // Encouragement messages
  const encHe = [
    `כל הכבוד${name?" "+name:""}! סיימת את האתגר היומי שלך!`,
    `מדהים${name?" "+name:""}! המוח שלך עבד קשה היום!`,
    `ממש התרגשתי ממך${name?" "+name:""}! כל הכבוד!`,
    `${name?name+",":" "}היום עשית משהו נפלא לבריאות המוח שלך!`,
    `עשית עבודה נפלאה${name?" "+name:""}! המשיכי כך!`,
    `${name||"כל הכבוד"}! הצלחת לסיים את האתגר היומי!`,
    `איזה יום נפלא${name?" "+name:""}! כל הכבוד על ההתמדה!`,
  ];
  const encEn = [
    `Well done${name?" "+name:""}! You completed your daily challenge!`,
    `Amazing${name?" "+name:""}! Your brain worked hard today!`,
    `I'm so proud of you${name?" "+name:""}! Keep it up!`,
    `${name?name+",":" "}today you did something great for your brain!`,
    `Wonderful job${name?" "+name:""}! You finished the daily challenge!`,
    `${name||"You"} are absolutely wonderful! Well done!`,
    `Fantastic${name?" "+name:""}! See you tomorrow!`,
  ];
  const msg = isHe ? encHe[msgIdx.current%encHe.length] : encEn[msgIdx.current%encEn.length];

  if(isDone) return(
    <div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <span className="big-e">🎊</span>
      <p style={{fontSize:22,fontWeight:900,color:"#2D2A26",lineHeight:1.4,marginBottom:12}}>{msg}</p>
      <p style={{fontSize:16,color:"#8B7E74",fontWeight:700,marginBottom:24}}>
        {isHe?`ניקוד: ${score} 🌟`:`Score: ${score} 🌟`}
      </p>
      <button className="btn btn-sun" onClick={()=>{
        playDone();
        const doneMsg = msg;
        setTimeout(()=>showToast(doneMsg, "#FF9F43"), 500);
        setTimeout(()=>speakDailyDone(lang, name, gender), 1000);
        setTimeout(()=>onComplete(score), 3200);
      }}>
        {isHe?"חזרה לתפריט 🏠":"Back to Menu 🏠"}
      </button>
    </div>
  );

  // Render question
  const renderQ = () => {
    if(step.game==="speed") return(
      <div>
        <p style={{fontSize:18,fontWeight:800,textAlign:"center",marginBottom:12,color:"#2D2A26"}}>
          {phase==="before"?"...":phase==="img1"?(isHe?"זכור...":"Remember..."):phase==="img2"?(isHe?"מה השתנה?":"What changed?"):t.whatChanged}
        </p>
        <div className="speed-area">
          <div style={{display:"flex",gap:16,fontSize:44,justifyContent:"center"}}>
            {phase==="img1"&&item.a.map((e,i)=><span key={i}>{e}</span>)}
            {phase==="img2"&&item.b.map((e,i)=><span key={i}>{e}</span>)}
            {(phase==="before"||phase==="ans")&&<span style={{color:"#DDD",fontSize:30}}>• • • •</span>}
          </div>
        </div>
        {phase==="ans"&&item.opts.map(o=>optBtn(o,item.ans))}
      </div>
    );
    if(step.game==="language") return(
      <div>
        <div className="card card-sun" style={{textAlign:"center",marginBottom:14}}><p style={{fontSize:21,fontWeight:900,lineHeight:1.5}}>{item.p}</p></div>
        {shuffle(item.o).map(o=>optBtn(o,item.a))}
      </div>
    );
    if(step.game==="music") return(
      <div>
        <div className="card card-sun" style={{textAlign:"center",marginBottom:14}}>
          <span style={{fontSize:40}}>{item.e}</span>
          <p style={{fontSize:12,color:"#8B7E74",fontWeight:700,margin:"4px 0 8px"}}>🎵 {item.t}</p>
          <p style={{fontSize:20,fontWeight:900,lineHeight:1.5}}>{item.l}</p>
        </div>
        {shuffle(item.o).map(o=>optBtn(o,item.a))}
      </div>
    );
    if(step.game==="trivia"){
      const isClue=item.type==="clues";
      return(
        <div>
          <div className="card card-sun" style={{textAlign:"center",marginBottom:14}}>
            <span style={{fontSize:44}}>{item.e}</span>
            {!isClue&&<p style={{fontSize:19,fontWeight:900,marginTop:8,lineHeight:1.4}}>{item.q}</p>}
            {isClue&&item.clues.slice(0,clueLevel+1).map((c,i)=>(
              <div key={i} className={`clue-box${i===clueLevel?" clue-new":""}`}>{i+1}. {c}</div>
            ))}
            {isClue&&clueLevel<2&&!chosen&&(
              <button onClick={()=>setClueLevel(l=>l+1)} style={{background:"none",border:"2px solid #FF9F43",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",marginTop:8,color:"#F08000",fontFamily:"Nunito,sans-serif"}}>+ {t.clueBtn}</button>
            )}
          </div>
          {shuffle(item.o).map(o=>optBtn(o,item.a))}
        </div>
      );
    }
    if(step.game==="numbers"){
      const df={easy:{he:"קל",en:"Easy",c:"#1DD1A1"},medium:{he:"בינוני",en:"Medium",c:"#FF9F43"},hard:{he:"מאתגר",en:"Challenge",c:"#FF6B6B"}};
      const d=df[item.d]||df.easy;
      return(
        <div>
          <div className="card card-sky" style={{textAlign:"center",marginBottom:14}}>
            <span style={{fontSize:11,fontWeight:800,color:d.c,display:"block",marginBottom:6}}>● {isHe?d.he:d.en}</span>
            <div className="seq-box">
              {item.s.map((n,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:3}}><div className={`seq-num${n==="?"?" seq-q":""}`}>{n}</div>{i<item.s.length-1&&<span className="seq-arr">→</span>}</div>))}
            </div>
            <p style={{fontSize:16,fontWeight:800,marginTop:8}}>{isHe?"מה הבא?":"What's next?"}</p>
          </div>
          <div className="num-grid">
            {item.o.map(opt=>{let cls="num-btn";if(chosen===opt)cls+=opt===item.a?" num-correct":" num-wrong";else if(chosen!==null&&opt===item.a)cls+=" num-reveal";return <button key={opt} className={cls} onClick={()=>pick2(opt,item.a)}>{opt}</button>;})}
          </div>
        </div>
      );
    }
    if(step.game==="sorting"){
      const rooms=isHe?ROOMS_HE:ROOMS_EN;
      return(
        <div>
          <div className="card card-green" style={{textAlign:"center",marginBottom:14}}>
            <p style={{fontSize:44,marginBottom:6}}>{item.i.split(" ")[0]}</p>
            <p style={{fontSize:20,fontWeight:900}}>{item.i}</p>
            <p style={{fontSize:14,color:"#8B7E74",fontWeight:600,marginTop:4}}>{t.whichRoom}</p>
          </div>
          <div className="room-grid">
            {rooms.map(room=>{let cls="room-btn";if(chosen===room.n)cls+=room.n===item.r?" room-correct":" room-wrong";else if(chosen&&room.n===item.r)cls+=" room-reveal";return(<button key={room.n} className={cls} onClick={()=>pick2(room.n,item.r)}><span style={{fontSize:30}}>{room.e}</span><span style={{fontSize:13,fontWeight:800,color:"#2D2A26"}}>{room.n}</span></button>);})}
          </div>
        </div>
      );
    }
    if(step.game==="animal"){
      const [imgLoaded, setImgLoaded] = [false, ()=>{}]; // simple fallback
      return(
        <div>
          <div style={{borderRadius:20,overflow:"hidden",marginBottom:14,height:200,background:"#F5F0EB",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            <span style={{fontSize:70,position:"absolute"}}>{item.emoji}</span>
            <img src={item.img} alt="animal" style={{width:"100%",height:200,objectFit:"cover",borderRadius:20}}
              onError={e=>{e.target.style.display="none";}}
            />
          </div>
          <p style={{textAlign:"center",fontSize:20,fontWeight:800,marginBottom:14}}>
            {isHe?"מה בעל החיים הזה?":"What animal is this?"}
          </p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {shuffle(item.opts).map(opt=>optBtn(opt,item.name))}
          </div>
        </div>
      );
    }
    return null;
  };

  return(
    <div className="screen" style={{direction:t.dir}}>
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>{t.back}</button>
        <div className="score-pill">⭐ {score}</div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:14,fontWeight:700,color:"#8B7E74"}}>{gameEmoji[step.game]} {t[step.game]}</span>
          <span style={{fontSize:14,fontWeight:700,color:"#8B7E74"}}>{doneCount}/{total}</span>
        </div>
        <div className="prog-wrap"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
      </div>
      {renderQ()}
    </div>
  );
}


// ── Speed Game ────────────────────────────────────────────────────────────────
function SpeedGame({ t, lang, onBack }) {
  const [pool]   = useState(()=>shuffle(lang==="he"?SPEED_HE:SPEED_EN));
  const [phase,   setPhase]  = useState("before");
  const [round,   setRound]  = useState(0);
  const [score,   setScore]  = useState(0);
  const [chosen,  setChosen] = useState(null);
  const [done,    setDone]   = useState(false);
  const total=5; const cur=pool[round%pool.length]; const isRtl=T[lang].dir==="rtl";
  useEffect(()=>{
    if(done)return;
    if(phase==="before"){const x=setTimeout(()=>setPhase("img1"),600);return()=>clearTimeout(x);}
    if(phase==="img1"){const x=setTimeout(()=>setPhase("img2"),2000);return()=>clearTimeout(x);}
    if(phase==="img2"){const x=setTimeout(()=>setPhase("ans"),1000);return()=>clearTimeout(x);}
  },[phase,done]);
  const handle=(opt)=>{if(chosen)return;playClick();setChosen(opt);if(opt===cur.ans){setScore(s=>s+10);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{setChosen(null);if(round+1>=total){setDone(true);sayDone(lang);}else{setRound(r=>r+1);setPhase("before");}},1200);};
  if(done)return(<div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">⚡</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {score}/{total*10}</p><button className="btn btn-sun" onClick={()=>{setRound(0);setScore(0);setDone(false);setPhase("before");setChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
  return(<div className="screen" style={{direction:t.dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">⚡ {t.speed}</h2><p className="pl">{round+1}/{total}</p><div className="speed-area"><div style={{display:"flex",gap:16,fontSize:46,justifyContent:"center"}}>{phase==="img1"&&cur.a.map((e,i)=><span key={i}>{e}</span>)}{phase==="img2"&&cur.b.map((e,i)=><span key={i}>{e}</span>)}{(phase==="before"||phase==="ans")&&<span style={{color:"#DDD",fontSize:32}}>• • • •</span>}</div></div><p style={{textAlign:"center",fontSize:16,fontWeight:700,color:"#8B7E74",marginBottom:12}}>{phase==="before"?" ":phase==="img1"?(lang==="he"?"זכור...":"Remember..."):phase==="img2"?(lang==="he"?"מה השתנה?":"What changed?"):t.whatChanged}</p>{phase==="ans"&&shuffle(cur.opts).map(opt=>{let cls=`opt${isRtl?"":" opt-ltr"}`;if(chosen===opt)cls+=opt===cur.ans?" opt-correct":" opt-wrong";else if(chosen&&opt===cur.ans)cls+=" opt-reveal";return <button key={opt} className={cls} onClick={()=>handle(opt)}>{opt}</button>;})}</div>);
}

// ── Memory Game ───────────────────────────────────────────────────────────────
function MemoryGame({ t, lang, onBack }) {
  const mk=()=>{const s=EMOJI_SETS[Math.floor(Math.random()*EMOJI_SETS.length)];return shuffle([...s,...s]).map((e,i)=>({id:i,e,st:"hidden"}));};
  const [cards,setCards]=useState(mk);const [fl,setFl]=useState([]);const [score,setScore]=useState(0);const [moves,setMoves]=useState(0);
  const matched=cards.filter(c=>c.st==="matched").length;const done=matched===cards.length;
  const flip=(id)=>{if(fl.length===2)return;const card=cards.find(c=>c.id===id);if(card.st!=="hidden")return;const nc=cards.map(c=>c.id===id?{...c,st:"shown"}:c);setCards(nc);const nf=[...fl,id];setFl(nf);if(nf.length===2){setMoves(m=>m+1);const[a,b]=nf.map(fid=>nc.find(c=>c.id===fid));if(a.e===b.e){setTimeout(()=>{setCards(p=>p.map(c=>nf.includes(c.id)?{...c,st:"matched"}:c));setFl([]);setScore(s=>s+10);},500);}else{setTimeout(()=>{setCards(p=>p.map(c=>nf.includes(c.id)?{...c,st:"hidden"}:c));setFl([]);},900);}}};
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">🃏 {t.memory}</h2>{done?(<div style={{textAlign:"center",marginTop:32}}><span className="big-e">🎊</span><p style={{fontSize:18,fontWeight:800,marginBottom:16}}>{t.done} — {moves} {lang==="he"?"מהלכים":"moves"}</p><button className="btn btn-sun" onClick={()=>{setCards(mk());setFl([]);setScore(0);setMoves(0);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>):(<div className="mem-grid">{cards.map(card=>(<button key={card.id} className={`mem-card mem-${card.st}`} onClick={()=>flip(card.id)}>{card.st!=="hidden"?card.e:""}</button>))}</div>)}</div>);
}

// ── Language Game ─────────────────────────────────────────────────────────────
function LanguageGame({ t, lang, onBack }) {
  const all=SENTENCES[lang];const isRtl=T[lang].dir==="rtl";
  const [pool,setPool]=useState(()=>shuffle(all).slice(0,6));const [idx,setIdx]=useState(0);const [chosen,setChosen]=useState(null);const [score,setScore]=useState(0);const [done,setDone]=useState(false);
  const cur=pool[idx];
  const handle=(opt)=>{if(chosen)return;playClick();setChosen(opt);if(opt===cur.a){setScore(s=>s+10);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{if(idx+1<pool.length){setIdx(i=>i+1);setChosen(null);}else{setDone(true);sayDone(lang);}},1200);};
  if(done)return(<div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🎊</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {score}/{pool.length*10}</p><button className="btn btn-green" onClick={()=>{setPool(shuffle(all).slice(0,6));setIdx(0);setScore(0);setDone(false);setChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
  return(<div className="screen" style={{direction:t.dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">💬 {t.language}</h2><p className="pl">{idx+1}/{pool.length}</p><div className="card card-green" style={{textAlign:"center",marginBottom:14}}><p style={{fontSize:24,fontWeight:900,lineHeight:1.5}}>{cur.p}</p></div>{shuffle(cur.o).map(opt=>{let cls=`opt${isRtl?"":" opt-ltr"}`;if(chosen===opt)cls+=opt===cur.a?" opt-correct":" opt-wrong";else if(chosen&&opt===cur.a)cls+=" opt-reveal";return <button key={opt} className={cls} onClick={()=>handle(opt)}>{opt}</button>;})}</div>);
}

// ── Music Game ────────────────────────────────────────────────────────────────
const RHYTHM_MAX=5;
function MusicGame({ t, lang, onBack }) {
  const isRtl=T[lang].dir==="rtl";const allSongs=SONGS[lang];
  const [mode,setMode]=useState("menu");
  const [songPool,setSongPool]=useState(()=>shuffle(allSongs));const [songIdx,setSongIdx]=useState(0);const [sChosen,setSChosen]=useState(null);const [sScore,setSScore]=useState(0);
  const [rRound,setRRound]=useState(0);const [rPhase,setRPhase]=useState("idle");const [rBeat,setRBeat]=useState(false);const [rTaps,setRTaps]=useState(0);const [rScore,setRScore]=useState(0);const [rResult,setRResult]=useState(null);const [rDone,setRDone]=useState(false);
  const tapsRef=useRef([]);const patRef=useRef([]);const ctxRef=useRef(null);
  const SONGS_N=6;const sDone=songIdx>=SONGS_N;const cur=songPool[songIdx%songPool.length];
  const getCtx=useCallback(()=>{if(!ctxRef.current||ctxRef.current.state==="closed")ctxRef.current=new(window.AudioContext||window.webkitAudioContext)();if(ctxRef.current.state==="suspended")ctxRef.current.resume();return ctxRef.current;},[]);
  const handleSong=(opt)=>{if(sChosen)return;playClick();setSChosen(opt);if(opt===cur.a){setSScore(s=>s+10);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{setSChosen(null);setSongIdx(i=>i+1);},1400);};
  const playRhythm=useCallback(()=>{const{p:pat}=RHYTHMS[rRound%RHYTHMS.length];patRef.current=pat;setRPhase("playing");setRBeat(false);setRTaps(0);tapsRef.current=[];setRResult(null);try{const ctx=getCtx();let at=ctx.currentTime+0.2,vm=200;pat.forEach(dur=>{const t1=at,f1=vm;const o1=ctx.createOscillator(),g1=ctx.createGain();o1.connect(g1);g1.connect(ctx.destination);o1.type="square";o1.frequency.value=520;g1.gain.setValueAtTime(0.6,t1);g1.gain.exponentialRampToValueAtTime(.001,t1+.22);o1.start(t1);o1.stop(t1+.24);const o2=ctx.createOscillator(),g2=ctx.createGain();o2.connect(g2);g2.connect(ctx.destination);o2.type="sine";o2.frequency.value=160;g2.gain.setValueAtTime(0.7,t1);g2.gain.exponentialRampToValueAtTime(.001,t1+.16);o2.start(t1);o2.stop(t1+.18);setTimeout(()=>{setRBeat(true);setTimeout(()=>setRBeat(false),240);},f1);at+=(dur+160)/1000;vm+=dur+160;});setTimeout(()=>setRPhase("input"),vm+350);}catch(e){setTimeout(()=>setRPhase("input"),2500);}},[rRound,getCtx]);
  const playTap=useCallback(()=>{try{const ctx=getCtx();if(ctx.state==="suspended")ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type="triangle";o.frequency.value=280;const now=ctx.currentTime;g.gain.setValueAtTime(0.7,now);g.gain.exponentialRampToValueAtTime(.001,now+.2);o.start(now);o.stop(now+.2);}catch(e){}},[getCtx]);
  const handleTap=()=>{if(rPhase!=="input")return;playTap();const now=Date.now();tapsRef.current=[...tapsRef.current,now];const taps=tapsRef.current,pat=patRef.current;setRTaps(taps.length);if(taps.length>=pat.length){const tg=taps.slice(1).map((x,i)=>x-taps[i]),bg=pat.slice(1).map((d,i)=>pat[i]+160+d);let good=0;tg.forEach((g,i)=>{if(!bg[i])return;const r=g/bg[i];if(r>.4&&r<1.6)good++;});const pct=tg.length>0?good/tg.length:1;const res=pct>=.6?"good":pct>=.3?"ok":"miss";const pts=res==="good"?10:res==="ok"?5:0;setTimeout(()=>{setRResult(res);setRScore(s=>s+pts);setRPhase("result");setTimeout(()=>{setRResult(null);setRPhase("idle");if(rRound+1>=RHYTHM_MAX)setRDone(true);else setRRound(r=>r+1);},1800);},400);}};
  const curR=RHYTHMS[rRound%RHYTHMS.length];
  const circCls=`rhythm-circle ${rBeat?"rh-play":rPhase==="input"?"rh-input":rPhase==="result"?`rh-${rResult||"idle"}`:"rh-idle"}`;
  if(mode==="menu")return(<div className="screen" style={{direction:t.dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button></div><h2 className="st">🎵 {t.music}</h2><div className="card card-sun" style={{textAlign:"center",cursor:"pointer",marginBottom:14}} onClick={()=>setMode("songs")}><span style={{fontSize:44,display:"block",marginBottom:8}}>🎤</span><p style={{fontSize:18,fontWeight:800}}>{lang==="he"?"השלם את השיר":"Complete the song"}</p></div><div className="card card-green" style={{textAlign:"center",cursor:"pointer"}} onClick={()=>setMode("rhythm")}><span style={{fontSize:44,display:"block",marginBottom:8}}>🥁</span><p style={{fontSize:18,fontWeight:800}}>{lang==="he"?"חיקוי קצב":"Rhythm Echo"}</p></div></div>);
  if(mode==="songs"){if(sDone)return(<div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🎤</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {sScore}/{SONGS_N*10}</p><button className="btn btn-sun" onClick={()=>{setSongPool(shuffle(allSongs));setSongIdx(0);setSScore(0);setSChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={()=>setMode("menu")}>{t.back}</button></div>);return(<div className="screen" style={{direction:t.dir}}><div className="topbar"><button className="back-btn" onClick={()=>setMode("menu")}>{t.back}</button><div className="score-pill">⭐ {sScore}</div></div><h2 className="st">🎤 {lang==="he"?"השלם את השיר":"Complete the song"}</h2><p className="pl">{songIdx+1}/{SONGS_N}</p><div className="card card-sun" style={{textAlign:"center",marginBottom:14}}><span style={{fontSize:44}}>{cur.e}</span><p style={{fontSize:12,color:"#8B7E74",fontWeight:700,margin:"4px 0 8px"}}>🎵 {cur.t}</p><p style={{fontSize:21,fontWeight:900,lineHeight:1.5}}>{cur.l}</p></div>{shuffle(cur.o).map(opt=>{let cls=`opt${isRtl?"":" opt-ltr"}`;if(sChosen===opt)cls+=opt===cur.a?" opt-correct":" opt-wrong";else if(sChosen&&opt===cur.a)cls+=" opt-reveal";return <button key={opt} className={cls} onClick={()=>handleSong(opt)}>{opt}</button>;})}</div>);}
  if(rDone)return(<div className="screen" style={{direction:t.dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🥁</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {rScore}/{RHYTHM_MAX*10}</p><button className="btn btn-sun" onClick={()=>{setRRound(0);setRScore(0);setRDone(false);setRPhase("idle");setRResult(null);setRTaps(0);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={()=>setMode("menu")}>{t.back}</button></div>);
  return(<div className="screen" style={{direction:t.dir}}><div className="topbar"><button className="back-btn" onClick={()=>setMode("menu")}>{t.back}</button><div className="score-pill">⭐ {rScore}</div></div><h2 className="st">🥁 {lang==="he"?"חיקוי קצב":"Rhythm Echo"}</h2><p className="pl">{rRound+1}/{RHYTHM_MAX}</p><div className="card card-sun" style={{textAlign:"center",marginBottom:14}}><p style={{fontSize:22,letterSpacing:4,fontWeight:800}}>{curR.l}</p><p style={{fontSize:13,color:"#8B7E74",fontWeight:600,marginTop:6}}>{rPhase==="idle"?(lang==="he"?"הקצב שתשמע":"Pattern to hear"):rPhase==="playing"?(lang==="he"?"מקשיב...":"Listen..."):rPhase==="input"?`${lang==="he"?"הקש!":"Tap!"} ${rTaps}/${curR.p.length}`:rResult==="good"?"🎯 "+(lang==="he"?"מצוין!":"Excellent!"):rResult==="ok"?"👍 "+(lang==="he"?"כמעט!":"Almost!"):"💪 "+(lang==="he"?"נסה שוב":"Try again")}</p></div><div style={{textAlign:"center",margin:"16px 0"}}><div className={circCls} onClick={handleTap}>{rPhase==="idle"?"🥁":rPhase==="playing"?(rBeat?"💥":"🎵"):rPhase==="input"?"👆":rResult==="good"?"🎉":rResult==="ok"?"👍":"🔄"}</div></div>{rPhase==="idle"&&<button className="btn btn-sun" onClick={()=>{getCtx();playRhythm();}}>{lang==="he"?"▶ הפעל קצב":"▶ Play Rhythm"}</button>}</div>);
}

// ── Numbers Game ──────────────────────────────────────────────────────────────
function NumbersGame({ t, lang, onBack }) {
  const [pool]=useState(()=>shuffle(NUMBERS).slice(0,6));const [idx,setIdx]=useState(0);const [chosen,setChosen]=useState(null);const [score,setScore]=useState(0);const [done,setDone]=useState(false);
  const item=pool[idx];const df={easy:{he:"קל",en:"Easy",c:"#1DD1A1"},medium:{he:"בינוני",en:"Medium",c:"#FF9F43"},hard:{he:"מאתגר",en:"Challenge",c:"#FF6B6B"}};const d=df[item?.d||"easy"];const isHe=lang==="he";
  const handle=(opt)=>{if(chosen!==null)return;playClick();setChosen(opt);if(opt===item.a){setScore(s=>s+10);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{setChosen(null);if(idx+1>=pool.length){setDone(true);sayDone(lang);}else setIdx(i=>i+1);},1400);};
  if(done)return(<div className="screen" style={{direction:T[lang].dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🔢</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {score}/{pool.length*10}</p><button className="btn btn-sky" onClick={()=>{setIdx(0);setScore(0);setDone(false);setChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">🔢 {t.numbers}</h2><p className="pl">{idx+1}/{pool.length}</p><div className="card card-sky" style={{textAlign:"center",marginBottom:18}}><span style={{fontSize:11,fontWeight:800,color:d.c,display:"block",marginBottom:6}}>● {isHe?d.he:d.en}</span><div className="seq-box">{item.s.map((n,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:3}}><div className={`seq-num${n==="?"?" seq-q":""}`}>{n}</div>{i<item.s.length-1&&<span className="seq-arr">→</span>}</div>))}</div><p style={{fontSize:16,fontWeight:800,marginTop:10}}>{isHe?"מה הבא?":"What's next?"}</p></div><div className="num-grid">{item.o.map(opt=>{let cls="num-btn";if(chosen===opt)cls+=opt===item.a?" num-correct":" num-wrong";else if(chosen!==null&&opt===item.a)cls+=" num-reveal";return <button key={opt} className={cls} onClick={()=>handle(opt)}>{opt}</button>;})}</div></div>);
}

// ── Sorting Game ──────────────────────────────────────────────────────────────
function SortingGame({ t, lang, onBack }) {
  const rooms=lang==="he"?ROOMS_HE:ROOMS_EN;const all=ROOM_ITEMS[lang];
  const [items]=useState(()=>shuffle(all).slice(0,8));const [idx,setIdx]=useState(0);const [chosen,setChosen]=useState(null);const [score,setScore]=useState(0);const [done,setDone]=useState(false);
  const cur=items[idx];
  const handle=(rn)=>{if(chosen)return;playClick();setChosen(rn);if(rn===cur.r){setScore(s=>s+10);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{setChosen(null);if(idx+1>=items.length){setDone(true);sayDone(lang);}else setIdx(i=>i+1);},1400);};
  if(done)return(<div className="screen" style={{direction:T[lang].dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🏠</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {score}/{items.length*10}</p><button className="btn btn-green" onClick={()=>{setIdx(0);setScore(0);setDone(false);setChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">🏠 {t.sorting}</h2><p className="pl">{idx+1}/{items.length}</p><div className="card card-green" style={{textAlign:"center",marginBottom:18}}><p style={{fontSize:44,marginBottom:6}}>{cur.i.split(" ")[0]}</p><p style={{fontSize:20,fontWeight:900}}>{cur.i}</p><p style={{fontSize:14,color:"#8B7E74",fontWeight:600,marginTop:4}}>{t.whichRoom}</p></div><div className="room-grid">{rooms.map(room=>{let cls="room-btn";if(chosen===room.n)cls+=room.n===cur.r?" room-correct":" room-wrong";else if(chosen&&room.n===cur.r)cls+=" room-reveal";return(<button key={room.n} className={cls} onClick={()=>handle(room.n)}><span style={{fontSize:30}}>{room.e}</span><span style={{fontSize:13,fontWeight:800,color:"#2D2A26"}}>{room.n}</span></button>);})}</div></div>);
}

// ── Trivia Game ───────────────────────────────────────────────────────────────
function TriviaGame({ t, lang, onBack }) {
  const all=TRIVIA[lang];const isRtl=T[lang].dir==="rtl";
  const [cards,setCards]=useState(()=>shuffle(all).slice(0,6));const [idx,setIdx]=useState(0);const [chosen,setChosen]=useState(null);const [score,setScore]=useState(0);const [done,setDone]=useState(false);const [clue,setClue]=useState(0);
  useEffect(()=>{setClue(0);setChosen(null);},[idx]);
  const card=cards[idx];const pts=card?.type==="clues"?[10,7,4][clue]:10;
  const handle=(opt)=>{if(chosen)return;playClick();setChosen(opt);if(opt===card.a){setScore(s=>s+pts);sayCorrect(lang);}else sayWrong(lang);setTimeout(()=>{if(idx+1>=cards.length){setDone(true);sayDone(lang);}else{setIdx(i=>i+1);}},1600);};
  if(done)return(<div className="screen" style={{direction:T[lang].dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><span className="big-e">🏆</span><p style={{fontSize:24,fontWeight:900,marginBottom:16}}>{t.done} {score}</p><button className="btn btn-sun" onClick={()=>{setCards(shuffle(all).slice(0,6));setIdx(0);setScore(0);setDone(false);setChosen(null);}}>{t.playAgain}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">⭐ {score}</div></div><h2 className="st">🏆 {t.trivia}</h2><p className="pl">{idx+1}/{cards.length}</p><div className="card card-sun" style={{textAlign:"center",marginBottom:14}}><span style={{fontSize:44}}>{card.e}</span>{card.type==="q"&&<p style={{fontSize:19,fontWeight:900,marginTop:8,lineHeight:1.4}}>{card.q}</p>}{card.type==="clues"&&(<><p style={{fontSize:12,fontWeight:800,color:"#A29BFE",marginTop:8,marginBottom:8}}>{t.clueBtn} <span style={{color:"#FF9F43"}}>({pts} pts)</span></p>{card.clues.slice(0,clue+1).map((c,i)=>(<div key={i} className={`clue-box${i===clue?" clue-new":""}`}>{i+1}. {c}</div>))}{clue<2&&!chosen&&(<button onClick={()=>setClue(l=>l+1)} style={{background:"none",border:"2px solid #FF9F43",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",marginTop:8,color:"#F08000",fontFamily:"Nunito,sans-serif"}}>+ {t.clueBtn}</button>)}</>)}</div>{shuffle(card.o).map(opt=>{let cls=`opt${isRtl?"":" opt-ltr"}`;if(chosen===opt)cls+=opt===card.a?" opt-correct":" opt-wrong";else if(chosen&&opt===card.a)cls+=" opt-reveal";return <button key={opt} className={cls} onClick={()=>handle(opt)}>{opt}</button>;})}{chosen&&<div style={{borderRadius:14,padding:14,textAlign:"center",fontSize:18,fontWeight:800,marginTop:10,background:chosen===card.a?"#EDFFF8":"#FFF0F0",color:chosen===card.a?"#0A6B4F":"#9B2626"}}>{chosen===card.a?`✓ ${t.correct} (+${pts})`:`${t.almost} — ${card.a}`}</div>}</div>);
}

// ── Together ──────────────────────────────────────────────────────────────────
function TogetherGame({ t, lang, onBack }) {
  const prompts=lang==="he"?["ספר לי על זיכרון ילדות שאתה אוהב","מה היית אוכל כשהיית ילד/ה?","איזה שיר אהבת לשיר?","ספר על מקום שאהבת לבקר בו","מה היית עושה בשבת עם המשפחה?","מה היה החלום שלך כשהיית צעיר/ה?","ספר על מורה שאתה זוכר/ת","מה היית קונה בחנות הממתקים?"]:["Tell me about a happy childhood memory","What food did you love as a child?","What was your favorite song?","Tell me about a place you loved to visit","What did you do on weekends with family?","What was your dream when you were young?","Tell me about a teacher you remember","What was your favorite childhood game?"];
  const [idx,setIdx]=useState(0);
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><div className="score-pill">👥 {t.together}</div></div><h2 className="st">👥 {t.together}</h2><p style={{fontSize:15,color:"#8B7E74",fontWeight:600,marginBottom:20}}>{lang==="he"?"שאל את יקירך:":"Ask your loved one:"}</p><div className="card" style={{background:"linear-gradient(135deg,#F3E5F5,#E1BEE7)",border:"2.5px solid #CE93D8",textAlign:"center",marginBottom:20}}><p style={{fontSize:24,fontWeight:800,lineHeight:1.5,color:"#2D2A26"}}>💬 {prompts[idx]}</p></div><p style={{textAlign:"center",fontSize:14,color:"#8B7E74",fontWeight:600,marginBottom:16}}>{lang==="he"?"הקשיבו, שאלו, הנאו ביחד ❤️":"Listen, ask more, enjoy together ❤️"}</p><button className="btn" style={{background:"#A29BFE",boxShadow:"0 5px 0 #7B6FD0",color:"white"}} onClick={()=>setIdx(i=>(i+1)%prompts.length)}>{lang==="he"?"שאלה הבאה →":"Next question →"}</button><button className="btn btn-ghost" onClick={onBack}>{t.menu}</button></div>);
}

// ── Chat Game — עם onboarding אישי ───────────────────────────────────────────
const CHAT_ONBOARDING = {
  he: [
    {
      key: "birthYear",
      q: "באיזה עשור נולדת?",
      emoji: "🎂",
      opts: ["שנות ה-30","שנות ה-40","שנות ה-50","שנות ה-60","שנות ה-70+"],
    },
    {
      key: "hobbies",
      q: "מה אוהבים לעשות?",
      emoji: "❤️",
      opts: ["מוזיקה 🎵","גינון 🌱","בישול 🍳","קריאה 📚","טיולים 🚶","משפחה 👨‍👩‍👧"],
      multi: true,
    },
    {
      key: "topics",
      q: "על מה כיף לדבר?",
      emoji: "💬",
      opts: ["זיכרונות מהעבר 📸","ילדים ונכדים 👶","חדשות ישראל 📰","בישול ומתכונים 🍲","טיפים לבריאות 💊","ספורט ⚽"],
      multi: true,
    },
  ],
  en: [
    {
      key: "birthYear",
      q: "What decade were you born?",
      emoji: "🎂",
      opts: ["1930s","1940s","1950s","1960s","1970s+"],
    },
    {
      key: "hobbies",
      q: "What do you enjoy doing?",
      emoji: "❤️",
      opts: ["Music 🎵","Gardening 🌱","Cooking 🍳","Reading 📚","Walking 🚶","Family 👨‍👩‍👧"],
      multi: true,
    },
    {
      key: "topics",
      q: "What's fun to talk about?",
      emoji: "💬",
      opts: ["Old memories 📸","Children & grandchildren 👶","News & world 📰","Cooking & recipes 🍲","Health tips 💊","Sports ⚽"],
      multi: true,
    },
  ],
};

function buildSystemPrompt(lang, name, profile) {
  const isHe = lang === "he";
  const n = name || (isHe ? "החבר/ה שלי" : "my friend");
  const decade = profile.birthYear || (isHe ? "שנות ה-50" : "the 1950s");
  const hobbies = (profile.hobbies || []).join(", ") || (isHe ? "ללא העדפה" : "various things");
  const topics  = (profile.topics  || []).join(", ") || (isHe ? "ללא העדפה" : "various topics");

  if (isHe) return `אתה CogniBot — חבר AI חם, סבלני ואוהד לאנשים מבוגרים.
המשתמש שלך הוא ${n}, נולד/ה בסביבות ${decade}, אוהב/ת: ${hobbies}, אוהב/ת לדבר על: ${topics}.
כללים חשובים:
- דבר בעברית פשוטה וברורה, משפטים קצרים
- שאל שאלה אחת בלבד בכל פעם, מותאמת לתחומי העניין שלו/ה
- התייחס לשם ${n} מדי פעם כדי שירגיש/תרגיש אישי
- עורר זיכרונות מתקופת ה-${decade} — שירים, אירועים, מנהגים
- אם אוהב/ת מוזיקה — שאל על שירים מהעבר
- אם אוהב/ת בישול — שאל על מתכונים ומאכלי ילדות
- אם אוהב/ת משפחה — שאל על ילדים, נכדים, זיכרונות משפחתיים
- תגובות קצרות — 2-3 משפטים לכל היותר
- תמיד חם, מעודד, סבלני — לעולם אל תמהר`;

  return `You are CogniBot — a warm, patient, caring AI friend for elderly people.
Your user is ${n}, born around ${decade}, enjoys: ${hobbies}, loves talking about: ${topics}.
Important rules:
- Speak in simple, clear English with short sentences
- Ask only ONE question at a time, tailored to their interests
- Use the name ${n} occasionally to make it feel personal
- Evoke memories from ${decade} — songs, events, customs
- If they like music — ask about songs from the past
- If they like cooking — ask about childhood recipes
- If they like family — ask about children, grandchildren, family memories
- Keep responses to 2-3 sentences maximum
- Always warm, encouraging, patient — never rush`;
}

function ChatOnboarding({ lang, name, onDone }) {
  const isHe = lang === "he";
  const steps = CHAT_ONBOARDING[lang];
  const [stepIdx, setStepIdx] = useState(0);
  const [profile, setProfile] = useState({});
  const [selected, setSelected] = useState([]);
  const step = steps[stepIdx];

  const toggleOpt = (opt) => {
    if (!step.multi) {
      setSelected([opt]);
    } else {
      setSelected(prev =>
        prev.includes(opt) ? prev.filter(x=>x!==opt) : [...prev, opt]
      );
    }
  };

  const next = () => {
    const val = step.multi ? selected : selected[0];
    const newProfile = { ...profile, [step.key]: val };
    setProfile(newProfile);
    setSelected([]);
    if (stepIdx + 1 >= steps.length) {
      onDone(newProfile);
    } else {
      setStepIdx(i => i+1);
    }
  };

  return (
    <div className="screen" style={{direction:T[lang].dir,display:"flex",flexDirection:"column"}}>
      <div style={{textAlign:"center",marginBottom:8}}>
        <span style={{fontSize:13,fontWeight:700,color:"#8B7E74"}}>
          {stepIdx+1}/{steps.length}
        </span>
        <div style={{display:"flex",gap:6,justifyContent:"center",margin:"8px 0 20px"}}>
          {steps.map((_,i)=>(
            <div key={i} style={{width:40,height:6,borderRadius:99,background:i<=stepIdx?"#FF9F43":"#E8E0D8",transition:"background .3s"}}/>
          ))}
        </div>
      </div>
      <div className="card card-sun" style={{textAlign:"center",marginBottom:20}}>
        <span style={{fontSize:52,display:"block",marginBottom:8}}>{step.emoji}</span>
        <p style={{fontSize:22,fontWeight:900,lineHeight:1.4}}>{step.q}</p>
        {step.multi && <p style={{fontSize:13,color:"#8B7E74",fontWeight:600,marginTop:6}}>
          {isHe?"אפשר לבחור כמה":"Choose as many as you like"}
        </p>}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",marginBottom:20}}>
        {step.opts.map(opt=>(
          <button key={opt} onClick={()=>toggleOpt(opt)} style={{
            background:selected.includes(opt)?"#FF9F43":"white",
            color:selected.includes(opt)?"white":"#2D2A26",
            border:`2.5px solid ${selected.includes(opt)?"#FF9F43":"#E8E0D8"}`,
            borderRadius:50, padding:"12px 20px",
            fontSize:16, fontWeight:700, cursor:"pointer",
            fontFamily:"Nunito,sans-serif", transition:"all .2s",
          }}>{opt}</button>
        ))}
      </div>
      <button className="btn btn-sun" onClick={next} disabled={selected.length===0} style={{opacity:selected.length?1:0.5}}>
        {stepIdx+1<steps.length ? (isHe?"הבא →":"Next →") : (isHe?"בואו נדבר! 💬":"Let's chat! 💬")}
      </button>
    </div>
  );
}

function ChatGame({ t, lang, name, onBack }) {
  const isRtl = T[lang].dir==="rtl";
  const isHe  = lang==="he";
  const [stage, setStage]   = useState("onboard"); // onboard | chat
  const [profile, setProfile] = useState(null);
  const [msgs,   setMsgs]   = useState([]);
  const [input,  setInput]  = useState("");
  const [loading,setLoading]= useState(false);
  const bottomRef = useRef(null);

  const startChat = async (prof) => {
    setProfile(prof);
    setStage("chat");
    setLoading(true);
    const sys = buildSystemPrompt(lang, name, prof);
    const hello = isHe ? "שלום" : "Hello";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:200,system:sys,messages:[{role:"user",content:hello}]})
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text || (isHe?"שלום! איך אפשר לעזור?":"Hello! How can I help?");
      setMsgs([{role:"assistant",content:reply}]);
      
    } catch(e) {
      setMsgs([{role:"assistant",content:isHe?"שלום! שמח לדבר איתך 😊":"Hello! Happy to chat with you 😊"}]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nm = {role:"user",content:text};
    const history = [...msgs, nm];
    setMsgs(history);
    setInput("");
    setLoading(true);
    const sys = buildSystemPrompt(lang, name, profile||{});
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:200,system:sys,messages:history})
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text || (isHe?"סליחה, נסה שוב":"Sorry, try again");
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
      
    } catch(e) {
      setMsgs(p=>[...p,{role:"assistant",content:isHe?"אופס! נסה שוב 🙂":"Oops! Try again 🙂"}]);
    }
    setLoading(false);
  };

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading]);

  if (stage==="onboard") return (
    <div>
      <div style={{padding:"16px 18px 0",direction:T[lang].dir}}>
        <button className="back-btn" onClick={onBack}>{t.back}</button>
        <p style={{textAlign:"center",fontSize:20,fontWeight:900,fontFamily:"Fredoka,sans-serif",marginTop:12,marginBottom:4}}>
          🤖 CogniBot
        </p>
        <p style={{textAlign:"center",fontSize:14,color:"#8B7E74",fontWeight:600,marginBottom:16}}>
          {isHe?"כמה שאלות קצרות כדי להכיר אותך":"A few quick questions to get to know you"}
        </p>
      </div>
      <ChatOnboarding lang={lang} name={name} onDone={startChat} />
    </div>
  );

  return (
    <div className="chat-wrap">
      <div className="chat-hdr">
        <button className="back-btn" onClick={onBack}>{t.back}</button>
        <span style={{fontSize:28}}>🤖</span>
        <div>
          <p style={{fontSize:17,fontWeight:900,fontFamily:"Fredoka,sans-serif"}}>CogniBot</p>
          <p style={{fontSize:12,color:"#1DD1A1",fontWeight:700}}>● {isHe?"מחובר":"Online"}</p>
        </div>
        {profile && (
          <div style={{marginRight:"auto",fontSize:12,color:"#8B7E74",fontWeight:600,textAlign:"right"}}>
            {(profile.hobbies||[]).slice(0,2).join(" · ")}
          </div>
        )}
      </div>
      <div className="chat-msgs">
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?(isRtl?"flex-start":"flex-end"):(isRtl?"flex-end":"flex-start"),marginBottom:12}}>
            {m.role==="assistant"&&<span style={{fontSize:22,alignSelf:"flex-end",marginLeft:isRtl?0:8,marginRight:isRtl?8:0}}>🤖</span>}
            <div className={m.role==="user"?"bubble-user":"bubble-bot"}>{m.content}</div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",justifyContent:isRtl?"flex-end":"flex-start"}}>
            <span style={{fontSize:22,marginLeft:isRtl?0:8,marginRight:isRtl?8:0}}>🤖</span>
            <div className="bubble-bot">•••</div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div className="chat-in-area">
        <input className="chat-in" value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleSend()}
          placeholder={isHe?"כתוב כאן...":"Type here..."} dir={T[lang].dir}/>
        <button className="chat-send" onClick={handleSend} disabled={loading||!input.trim()}>→</button>
      </div>
    </div>
  );

}
// ── Family Dashboard ──────────────────────────────────────────────────────────
function FamilyDash({ t, lang, onBack }) {
  const isHe=lang==="he";const WD=[{d:"א",s:72},{d:"ב",s:78},{d:"ג",s:75},{d:"ד",s:82},{d:"ה",s:80},{d:"ו",s:85},{d:"ש",s:88}];const mx=Math.max(...WD.map(d=>d.s));const MD=[{l:isHe?"מהירות":"Speed",v:84,c:"#FF9F43"},{l:isHe?"זיכרון":"Memory",v:76,c:"#54A0FF"},{l:isHe?"שפה":"Language",v:91,c:"#1DD1A1"}];
  return(<div className="screen" style={{direction:T[lang].dir}}><div className="topbar"><button className="back-btn" onClick={onBack}>{t.back}</button><span style={{fontSize:16,fontWeight:800}}>📊 {t.family}</span></div><div className="card" style={{background:"#EDFFF8",border:"2px solid #1DD1A1",marginBottom:14}}><p style={{fontSize:14,fontWeight:800,color:"#0A6B4F"}}>✅ {isHe?"שיחקה 4 פעמים השבוע! 🎉":"Played 4 times this week! 🎉"}</p></div><div className="card" style={{marginBottom:14}}><p style={{fontSize:15,fontWeight:800,marginBottom:10}}>{isHe?"ציון יומי":"Daily score"}</p><div style={{display:"flex",alignItems:"flex-end",gap:8,height:90}}>{WD.map((d,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:"100%",borderRadius:"8px 8px 0 0",background:d.s>=80?"#1DD1A1":"#FF9F43",height:`${(d.s/mx)*80}px`}}/><span style={{fontSize:12,fontWeight:700,color:"#8B7E74"}}>{d.d}</span></div>))}</div></div><div className="card" style={{marginBottom:14}}><p style={{fontSize:15,fontWeight:800,marginBottom:12}}>{isHe?"לפי תחום":"By domain"}</p>{MD.map(m=>(<div key={m.l} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><span style={{fontSize:13,fontWeight:700,width:60,color:"#2D2A26"}}>{m.l}</span><div style={{flex:1,background:"#EEE",borderRadius:99,height:10,overflow:"hidden"}}><div style={{width:`${m.v}%`,height:"100%",borderRadius:99,background:m.c}}/></div><span style={{fontSize:13,fontWeight:900,width:30,textAlign:"right"}}>{m.v}</span></div>))}</div></div>);
}

// ── Animal Quiz Game ──────────────────────────────────────────────────────────
function AnimalGame({ t, lang, onBack }) {
  const all = lang==="he" ? ANIMALS_HE : ANIMALS_EN;
  const isHe = lang==="he";
  const [animals] = useState(()=>shuffle(all).slice(0,7));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [opts, setOpts] = useState(()=>shuffle(animals[0].opts));
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const cur = animals[idx];

  const next = (correct) => {
    setTimeout(()=>{
      setChosen(null);
      const ni = idx+1;
      if(ni >= animals.length){ setDone(true); playDone(); }
      else { setIdx(ni); setOpts(shuffle(animals[ni].opts)); }
    }, 1200);
  };

  const handle = (opt) => {
    if(chosen) return;
    playClick();
    setChosen(opt);
    if(opt===cur.name){ setScore(s=>s+10); sayCorrect(lang); }
    else sayWrong(lang);
    next(opt===cur.name);
  };

  if(done) return(
    <div className="screen" style={{direction:T[lang].dir,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <span className="big-e">🐾</span>
      <p style={{fontSize:26,fontWeight:900,marginBottom:8}}>{t.done}</p>
      <p style={{fontSize:20,color:"#8B7E74",fontWeight:700,marginBottom:24}}>⭐ {score}/{animals.length*10}</p>
      <button className="btn btn-sun" onClick={()=>{setIdx(0);setScore(0);setDone(false);setChosen(null);setOpts(shuffle(animals[0].opts));}}>{t.playAgain}</button>
      <button className="btn btn-ghost" onClick={onBack}>{t.menu}</button>
    </div>
  );

  return(
    <div className="screen" style={{direction:T[lang].dir}}>
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>{t.back}</button>
        <div className="score-pill">⭐ {score}</div>
      </div>
      <h2 style={{fontFamily:"Fredoka,sans-serif",fontSize:24,marginBottom:4}}>
        🐾 {isHe?"זהה את בעל החיים":"Identify the Animal"}
      </h2>
      <p style={{fontSize:14,color:"#8B7E74",fontWeight:700,marginBottom:14}}>{idx+1}/{animals.length}</p>

      <div style={{borderRadius:24,marginBottom:18,height:220,background:"linear-gradient(135deg,#FFF3E0,#FFE0B2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:130,lineHeight:1}}>{cur.emoji}</span>
      </div>

      <p style={{textAlign:"center",fontSize:20,fontWeight:800,color:"#2D2A26",marginBottom:14}}>
        {isHe?"מה בעל החיים הזה?":"What animal is this?"}
      </p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {opts.map(opt=>{
          const isPicked=chosen===opt, isCorrect=opt===cur.name;
          let bg="white",border="#E8E0D8",color="#2D2A26";
          if(isPicked&&isCorrect){bg="#EDFFF8";border="#1DD1A1";}
          else if(isPicked&&!isCorrect){bg="#FFF0F0";border="#FF6B6B";}
          else if(chosen&&isCorrect){bg="#EDFFF8";border="#1DD1A1";}
          return(
            <button key={opt} onClick={()=>handle(opt)} style={{
              background:bg,border:`2.5px solid ${border}`,borderRadius:16,
              padding:"18px 10px",fontSize:18,fontWeight:800,cursor:"pointer",
              fontFamily:"Nunito,sans-serif",color,transition:"background .2s,border .2s",
            }}>{opt}</button>
          );
        })}
      </div>
    </div>
  );
}


// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("lang");
  const [lang,   setLang]   = useState("he");
  const [streak, setStreak] = useState(7);
  const [name,   setName]   = useState("");
  const [gender, setGender] = useState("m"); // "m" | "f"
  const t = T[lang] || T.he;
  return (
    <>
      <style>{css}</style>
      <div className="app" style={{direction:t.dir}}>
        <ToastOverlay />
        {screen==="lang"    && <LangScreen onSelect={l=>{setLang(l);setScreen("name");}} />}
        {screen==="name"    && <NameScreen lang={lang} onDone={(n,g)=>{
          setName(n);
          setGender(g||"m");
          if(n) {
            playStart();
            setTimeout(()=>showToast(lang==="he"?`היי ${n}! 🎉`:`Hey ${n}! 🎉`, "#FF9F43"), 400);
            setTimeout(()=>speakGreeting(lang, n, g||"m"), 800);
          }
          setScreen("menu");
        }} />}
        {screen==="menu"    && <MenuScreen t={t} lang={lang} streak={streak} name={name} onSelect={setScreen} />}
        {screen==="daily"   && <DailyChallenge t={t} lang={lang} name={name} gender={gender} onBack={()=>setScreen("menu")} onComplete={()=>{setStreak(s=>s+1);setScreen("menu");}} />}
        {screen==="speed"   && <SpeedGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="memory"  && <MemoryGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="language"&& <LanguageGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="music"   && <MusicGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="numbers" && <NumbersGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="sorting" && <SortingGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="animal"  && <AnimalGame  t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="trivia"  && <TriviaGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="together"&& <TogetherGame t={t} lang={lang} onBack={()=>setScreen("menu")} />}
        {screen==="chat"    && <ChatGame t={t} lang={lang} name={name} onBack={()=>setScreen("menu")} />}
        {screen==="family"  && <FamilyDash t={t} lang={lang} onBack={()=>setScreen("menu")} />}
      </div>
    </>
  );
}
