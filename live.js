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
  +".clv-mute{background:none;border:0;color:#8b97a6;font-size:15px;cursor:pointer;padding:0 3px;line-height:1}.clv-mute:hover{color:#fff}"
  +".clv-feed{max-height:266px;overflow-y:auto;overflow-x:hidden;padding:6px;transition:max-height .32s ease}"
  +".clv-feed::-webkit-scrollbar{width:4px}.clv-feed::-webkit-scrollbar-thumb{background:#2a3645;border-radius:2px}"
  +".clv-live.collapsed .clv-feed{max-height:0;padding-top:0;padding-bottom:0}"
  +".clv-ev{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:9px;font-size:12px;margin-bottom:3px;animation:clvin .45s cubic-bezier(.2,.8,.2,1)}"
  +"@keyframes clvin{0%{opacity:0;transform:translateY(-10px) scale(.97);box-shadow:0 0 0 0 transparent}45%{box-shadow:0 0 20px rgba(52,199,181,.5)}100%{opacity:1;transform:none;box-shadow:0 0 0 0 transparent}}"
  +".clv-ev .ci{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}"
  +".clv-ev.good{background:rgba(26,138,68,.12)}.clv-ev.good .ci{background:rgba(26,138,68,.22);color:#5ecf8f;box-shadow:0 0 11px rgba(94,207,143,.65)}"
  +".clv-ev.bad{background:rgba(217,83,79,.12)}.clv-ev.bad .ci{background:rgba(217,83,79,.22);color:#f59a97;box-shadow:0 0 11px rgba(245,154,151,.65)}"
  +".clv-ev:first-child .ci{animation:clvglow 2.4s ease-in-out infinite}"
  +"@keyframes clvglow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}"
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
  var ttl=document.createElement("span");ttl.textContent="النشاط المباشر";ttl.style.flex="1";h.appendChild(ttl);
  var coll=document.createElement("button");coll.className="clv-mute";coll.textContent="–";coll.title="إخفاء / إظهار";
  coll.onclick=function(ev){ev.stopPropagation();panel.classList.toggle("collapsed");coll.textContent=panel.classList.contains("collapsed")?"+":"–";};
  h.appendChild(coll);
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
    {i:"💰",t:"دفعة وصلت",s:["﷼2,400 · Mada","﷼450 · Apple Pay","﷼14,500 · Tamara","﷼1,200 · Mada","﷼8,000 · Tabby","﷼600 · Apple Pay","﷼26,000 · Tamara","﷼3,400 · Mada"]},
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

  /* ---------- LIVE REVENUE — the money the owner gets addicted to (persists, never resets to 0) ---------- */
  var REV_KEY="cliniva_rev_live";
  function dayKey(){var d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();}
  function loadRev(){try{var o=JSON.parse(localStorage.getItem(REV_KEY)||"null");if(o&&o.day===dayKey())return o.total;}catch(e){}return 312400;}
  function saveRev(t){try{localStorage.setItem(REV_KEY,JSON.stringify({day:dayKey(),total:t}));}catch(e){}}
  var revTotal=loadRev();
  function curRS(){var c=(document.getElementById("cur")||{}).value||"SAR";var R={SAR:1,AED:0.979,USD:0.2667,QAR:0.971,KWD:0.0819,BHD:0.1003,EGP:13.07},S={SAR:"﷼",AED:"د.إ",USD:"$",QAR:"ر.ق",KWD:"د.ك",BHD:"د.ب",EGP:"ج.م"};return {r:R[c]||1,s:S[c]||"﷼"};}
  function fmtRev(n){var ci=curRS();return ci.s+Math.round(n*ci.r).toLocaleString("en-US");}
  function paintRev(){var el=document.getElementById("liveRev");if(el)el.textContent=fmtRev(revTotal);}
  function addRevenue(amount){
    var el=document.getElementById("liveRev");
    var from=revTotal,to=revTotal+amount;revTotal=to;saveRev(to);
    if(!el)return;
    var t0=null,dur=850;
    function step(ts){if(t0===null)t0=ts;var p=Math.min(1,(ts-t0)/dur);var v=from+(to-from)*(1-Math.pow(1-p,3));el.textContent=fmtRev(v);if(p<1)requestAnimationFrame(step);else el.textContent=fmtRev(to);}
    requestAnimationFrame(step);
    el.style.transition="color .3s";el.style.color="#16a34a";setTimeout(function(){el.style.color="";},650);
    try{var r=el.getBoundingClientRect();var f=document.createElement("div");f.textContent="+"+fmtRev(amount);f.style.cssText="position:fixed;left:"+(r.left+8)+"px;top:"+(r.top-2)+"px;color:#16a34a;font-weight:900;font-size:16px;font-family:Tajawal,sans-serif;z-index:99999;pointer-events:none;transition:1.2s cubic-bezier(.2,.8,.2,1);opacity:1";document.body.appendChild(f);requestAnimationFrame(function(){f.style.transform="translateY(-40px)";f.style.opacity="0";});setTimeout(function(){if(f.parentNode)f.parentNode.removeChild(f);},1250);}catch(e){}
  }
  paintRev();

  function pushEvent(){
    var bad=Math.random()<0.14;
    var e=bad?pick(BAD):pick(GOOD);
    var row=document.createElement("div");row.className="clv-ev "+(bad?"bad":"good");
    var ci=document.createElement("div");ci.className="ci";ci.textContent=e.i;row.appendChild(ci);
    var tx=document.createElement("div");tx.className="tx";tx.appendChild(document.createTextNode(e.t));
    var sub=pick(e.s);var sm=document.createElement("small");sm.textContent=sub;tx.appendChild(sm);row.appendChild(tx);
    var tmEl=document.createElement("div");tmEl.className="tm";tmEl.textContent=tm();row.appendChild(tmEl);
    feed.insertBefore(row,feed.firstChild);
    while(feed.children.length>14)feed.removeChild(feed.lastChild);
    ding(!bad);
    if(!bad) tickKPI();
    if(e.t==="دفعة وصلت"){var amt=parseInt(sub.replace(/[^\d]/g,''),10)||0;if(amt)addRevenue(amt);}
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

  /* ---------- REAL booking → real notification + live automation ---------- */
  var seenBk={};
  try{(JSON.parse(localStorage.getItem("cliniva_bookings")||"[]")).forEach(function(b){if(b&&b.id)seenBk[b.id]=1;});}catch(e){}
  document.addEventListener("click",function(){ try{ if("Notification" in window && Notification.permission==="default") Notification.requestPermission(); }catch(e){} },{once:true});
  function sp(s,sz,col){ var e=document.createElement("span"); e.textContent=s; if(sz)e.style.fontSize=sz+"px"; if(col)e.style.color=col; return e; }
  function onRealBooking(){
    var b; try{ var a=JSON.parse(localStorage.getItem("cliniva_bookings")||"[]"); b=a[a.length-1]; }catch(e){ return; }
    if(!b||!b.id||seenBk[b.id]) return; seenBk[b.id]=1;
    ding(true); setTimeout(function(){ding(true);},150);
    try{ if("Notification" in window && Notification.permission==="granted") new Notification("Cliniva — حجز جديد ✅",{body:(b.name||"مريض")+" · "+(b.service||"")+" "+(b.day||"")+" "+(b.time||"")}); }catch(e){}
    var t=document.createElement("div");
    t.style.cssText="position:fixed;top:18px;left:50%;transform:translateX(-50%) translateY(-16px);opacity:0;z-index:100000;background:"+INK+";color:#fff;border:1px solid #34C7B5;border-radius:14px;width:344px;max-width:92vw;box-shadow:0 26px 60px -18px rgba(0,0,0,.6);font-family:'Tajawal',sans-serif;overflow:hidden;transition:.35s cubic-bezier(.2,.8,.2,1)";
    var head=document.createElement("div");head.style.cssText="display:flex;align-items:center;gap:10px;padding:13px 15px;background:rgba(52,199,181,.14);border-bottom:1px solid #243042";
    head.appendChild(sp("🔔",19));
    var ht=document.createElement("div");ht.style.flex="1";
    var hb=document.createElement("div");hb.style.cssText="font-weight:900;font-size:14px";hb.textContent="حجز حقيقي جديد!";
    var hs=document.createElement("div");hs.style.cssText="font-size:11.5px;color:#9fb6c4;margin-top:1px";hs.textContent=(b.name||"مريض")+" · "+(b.service||"")+" · "+(b.day||"")+" "+(b.time||"");
    ht.appendChild(hb);ht.appendChild(hs);head.appendChild(ht);t.appendChild(head);
    var steps=document.createElement("div");steps.style.cssText="padding:10px 15px 13px";
    var cap=document.createElement("div");cap.style.cssText="font-size:10.5px;color:#6b7785;font-weight:700;margin-bottom:7px";cap.textContent="⚡ الأوتوميشن بيشتغل...";steps.appendChild(cap);
    t.appendChild(steps);document.body.appendChild(t);
    requestAnimationFrame(function(){t.style.opacity="1";t.style.transform="translateX(-50%) translateY(0)";});
    var seq=["📲 تأكيد واتساب اتبعت","⏰ تذكير قبل 24 ساعة اتجدول","🗓️ اتسجّل في التقويم المركزي","📊 الإيراد والتقارير اتحدّثوا"];
    seq.forEach(function(s,i){ setTimeout(function(){
      var r=document.createElement("div");r.style.cssText="display:flex;align-items:center;gap:8px;font-size:12px;color:#cbd3dd;padding:4px 0;opacity:0;transition:.3s";
      var ck=sp("⏳",13);r.appendChild(ck);r.appendChild(document.createTextNode(s));steps.appendChild(r);
      requestAnimationFrame(function(){r.style.opacity="1";});
      setTimeout(function(){ck.textContent="✅";ck.style.color="#5ecf8f";ding(true);},520);
    }, 350+i*780); });
    setTimeout(function(){t.style.opacity="0";t.style.transform="translateX(-50%) translateY(-16px)";setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},400);}, 350+seq.length*780+2800);
  }
  window.addEventListener("cliniva-booked",onRealBooking);
  window.addEventListener("storage",function(e){ if(!e||e.key===null||e.key==="cliniva_bookings") onRealBooking(); });

  /* ---------- run loop ---------- */
  function loop(){ pushEvent(); setTimeout(loop, 3500+Math.random()*4500); }
  // seed a couple instantly so it looks alive on open
  setTimeout(function(){ pushEvent(); setTimeout(pushEvent,900); setTimeout(loop,2600); }, 600);
})();
