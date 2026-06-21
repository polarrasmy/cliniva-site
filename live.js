/* Cliniva — "live system" engine: real-time activity ticker, ticking KPIs,
   green/red flashes, and synthesized sounds (Web Audio, no external files).
   Makes the demo feel like a live trading floor. Self-contained. */
(function(){
  "use strict";
  if(window.__clinivaLive) return; window.__clinivaLive=true;

  var EM="#0F5F56", EM3="#34C7B5", GREEN="#1A8A44", RED="#D9534F", INK="#111827";

  /* ---------- styles ---------- */
  var css=""
  +".clv-live{position:fixed;bottom:20px;left:20px;width:288px;max-width:calc(100vw - 40px);background:"+INK+";color:#e6edf3;border-radius:14px;"
  +"box-shadow:0 24px 60px -22px rgba(0,0,0,.6);z-index:99990;overflow:hidden;font-family:'Tajawal',system-ui,sans-serif;border:1px solid #243042}"
  +".clv-lh{display:flex;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid #243042;font-size:12.5px;font-weight:800}"
  +".clv-dot{width:9px;height:9px;border-radius:50%;background:"+EM3+";box-shadow:0 0 0 0 rgba(52,199,181,.6);animation:clvp 1.8s infinite}"
  +"@keyframes clvp{0%{box-shadow:0 0 0 0 rgba(52,199,181,.55)}70%{box-shadow:0 0 0 9px rgba(52,199,181,0)}100%{box-shadow:0 0 0 0 rgba(52,199,181,0)}}"
  +".clv-mute{margin-inline-start:auto;background:none;border:0;color:#8b97a6;font-size:15px;cursor:pointer}"
  +".clv-feed{max-height:230px;overflow:hidden;padding:6px}"
  +".clv-ev{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:9px;font-size:12px;margin-bottom:3px;animation:clvin .45s cubic-bezier(.2,.8,.2,1)}"
  +"@keyframes clvin{from{opacity:0;transform:translateY(-10px) scale(.97)}to{opacity:1;transform:none}}"
  +".clv-ev .ci{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}"
  +".clv-ev.good{background:rgba(26,138,68,.12)}.clv-ev.good .ci{background:rgba(26,138,68,.22);color:#5ecf8f}"
  +".clv-ev.bad{background:rgba(217,83,79,.12)}.clv-ev.bad .ci{background:rgba(217,83,79,.22);color:#f59a97}"
  +".clv-ev .tx{flex:1;line-height:1.35}.clv-ev .tx small{display:block;color:#8b97a6;font-size:10px}"
  +".clv-ev .tm{font-size:9.5px;color:#6b7785;font-family:Inter}"
  +".clv-flash{animation:clvfl 1s ease}@keyframes clvfl{0%{background:rgba(26,138,68,.35);border-radius:6px}100%{background:transparent}}"
  +".clv-flash-bad{animation:clvflb 1s ease}@keyframes clvflb{0%{background:rgba(217,83,79,.35);border-radius:6px}100%{background:transparent}}"
  +".clv-livebadge{display:inline-flex;align-items:center;gap:5px}";
  var st=document.createElement("style");st.appendChild(document.createTextNode(css));document.head.appendChild(st);

  /* ---------- panel ---------- */
  var panel=document.createElement("div");panel.className="clv-live";
  var h=document.createElement("div");h.className="clv-lh";
  var dot=document.createElement("span");dot.className="clv-dot";h.appendChild(dot);
  h.appendChild(document.createTextNode("النشاط المباشر"));
  var mute=document.createElement("button");mute.className="clv-mute";mute.textContent="🔊";mute.title="الصوت";h.appendChild(mute);
  var feed=document.createElement("div");feed.className="clv-feed";
  panel.appendChild(h);panel.appendChild(feed);document.body.appendChild(panel);

  /* ---------- sound (Web Audio, synthesized) ---------- */
  var AC=null, muted=false;
  function unlock(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(AC&&AC.state==="suspended")AC.resume(); }
  document.addEventListener("click",unlock,{once:false});
  mute.onclick=function(e){ e.stopPropagation(); muted=!muted; mute.textContent=muted?"🔇":"🔊"; unlock(); };
  function ding(good){
    if(muted||!AC) return;
    try{
      var t=AC.currentTime;
      var o=AC.createOscillator(), g=AC.createGain();
      o.type="sine";
      if(good){ o.frequency.setValueAtTime(660,t); o.frequency.exponentialRampToValueAtTime(990,t+.09); }
      else{ o.frequency.setValueAtTime(300,t); o.frequency.exponentialRampToValueAtTime(180,t+.12); }
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(good?.12:.16,t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+(good?.18:.24));
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+.3);
    }catch(e){}
  }

  /* ---------- events ---------- */
  var GOOD=[
    {i:"🆕",t:"حجز جديد",s:["فرع جميرا","فرع مارينا","فرع دبي هيلز","الرياض — العليا"]},
    {i:"📞",t:"مكالمة تم الرد",s:["مركز الاتصال AI","استقبال جميرا"]},
    {i:"💰",t:"دفعة وصلت",s:["﷼2,400 · Mada","﷼450 · Apple Pay","﷼14,500 · Tamara"]},
    {i:"⭐",t:"تقييم 5 نجوم",s:["د. أحمد","د. طارق","د. سارة"]},
    {i:"✅",t:"تأكيد موعد",s:["واتساب آلي","المساعد الذكي"]},
    {i:"🤝",t:"إحالة جديدة",s:["سفير: سارة","سفير: خالد"]}
  ];
  var BAD=[
    {i:"⚠️",t:"مكالمة فائتة — استُرجعت",s:["AI ردّ عليها 24/7"]},
    {i:"🔴",t:"عدم حضور",s:["مارينا — تذكير اتبعت"]}
  ];
  var now=14*3600;
  function tm(){ now+=Math.floor(40+Math.random()*200); var hh=Math.floor(now/3600)%24, mm=Math.floor(now/60)%60; return ("0"+(hh%12||12)).slice(-2)+":"+("0"+mm).slice(-2)+(hh<12?" ص":" م"); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function pushEvent(){
    var bad=Math.random()<0.14;
    var e=bad?pick(BAD):pick(GOOD);
    var row=document.createElement("div");row.className="clv-ev "+(bad?"bad":"good");
    var ci=document.createElement("div");ci.className="ci";ci.textContent=e.i;row.appendChild(ci);
    var tx=document.createElement("div");tx.className="tx";tx.appendChild(document.createTextNode(e.t));
    var sm=document.createElement("small");sm.textContent=pick(e.s);tx.appendChild(sm);row.appendChild(tx);
    var tmEl=document.createElement("div");tmEl.className="tm";tmEl.textContent=tm();row.appendChild(tmEl);
    feed.insertBefore(row,feed.firstChild);
    while(feed.children.length>5)feed.removeChild(feed.lastChild);
    ding(!bad);
    if(!bad) tickKPI();
  }

  /* ---------- ticking KPI (the "stock market" number going up) ---------- */
  function tickKPI(){
    if(Math.random()<0.45) return;
    var el=document.getElementById("k_book")||document.querySelector(".kpi .n.teal,.kpi .n.em,.mk .n.em,.kpi .n");
    if(!el)return;
    var raw=(el.textContent||"").replace(/[^\d]/g,"");
    if(!raw)return;
    el.textContent=String(parseInt(raw,10)+1);
    el.classList.remove("clv-flash");void el.offsetWidth;el.classList.add("clv-flash");
  }

  /* ---------- run loop ---------- */
  function loop(){ pushEvent(); setTimeout(loop, 3500+Math.random()*4500); }
  // seed a couple instantly so it looks alive on open
  setTimeout(function(){ pushEvent(); setTimeout(pushEvent,900); setTimeout(loop,2600); }, 600);
})();
