/* Cliniva — floating AI assistant widget (shared across all pages).
   Real guided conversation → actually books → saves to localStorage('cliniva_bookings')
   so the booking shows up live in the dashboard. Safe DOM only (no innerHTML w/ user input). */
(function(){
  "use strict";
  if (window.__clinivaWidget) return; window.__clinivaWidget = true;

  var TEAL="#0E7C7B", TEAL2="#13A8A4", INK="#14202E";
  var SERVICES=["كشف","تنظيف","تقويم","زراعة","تجميل"];
  var DAYS=["النهاردة","بكرة","بعد بكرة"];
  var TIMES=["10:00 ص","12:00 م","4:00 م","7:00 م"];
  var PRICE={ "كشف":"150 درهم","تنظيف":"من 400 درهم","تقويم":"من 9,000 درهم","زراعة":"من 6,500 درهم","تجميل":"من 1,200 درهم" };

  // ---------- styles ----------
  var css = ""
   +".clw-bub{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,"+TEAL2+","+TEAL+");"
   +"box-shadow:0 12px 30px -8px rgba(14,124,123,.65);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:99998;border:none;transition:.2s;font-size:26px}"
   +".clw-bub:hover{transform:scale(1.07)}"
   +".clw-bub .pp{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 0 rgba(19,168,164,.5);animation:clwp 2.2s infinite}"
   +"@keyframes clwp{0%{box-shadow:0 0 0 0 rgba(19,168,164,.45)}70%{box-shadow:0 0 0 16px rgba(19,168,164,0)}100%{box-shadow:0 0 0 0 rgba(19,168,164,0)}}"
   +".clw-panel{position:fixed;bottom:92px;right:20px;width:350px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);background:#fff;border:1px solid #E2EAEA;"
   +"border-radius:18px;box-shadow:0 24px 60px -18px rgba(14,32,46,.4);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:'Tajawal',system-ui,Arial,sans-serif;direction:rtl}"
   +".clw-panel.open{display:flex;animation:clwup .25s ease}"
   +"@keyframes clwup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}"
   +".clw-hd{background:"+INK+";color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}"
   +".clw-hd .av{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,"+TEAL2+","+TEAL+");display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#06201f}"
   +".clw-hd b{font-size:14.5px;display:block}.clw-hd small{font-size:11px;color:#9fc2c0}"
   +".clw-x{margin-inline-start:auto;background:none;border:0;color:#9fc2c0;font-size:20px;cursor:pointer;line-height:1}"
   +".clw-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:9px;background:#F4F8F8}"
   +".clw-m{max-width:84%;padding:9px 13px;border-radius:13px;font-size:13.5px;line-height:1.65}"
   +".clw-m.ai{align-self:flex-start;background:#fff;border:1px solid #E2EAEA;border-bottom-right-radius:4px;color:"+INK+"}"
   +".clw-m.me{align-self:flex-end;background:"+TEAL+";color:#fff;border-bottom-left-radius:4px}"
   +".clw-chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px;background:#F4F8F8}"
   +".clw-chip{background:#fff;border:1.5px solid #BFE0DE;color:"+TEAL+";border-radius:999px;padding:7px 13px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:.15s}"
   +".clw-chip:hover{background:#E8F3F2}"
   +".clw-in{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #E2EAEA;background:#fff}"
   +".clw-in input{flex:1;border:1px solid #E2EAEA;border-radius:11px;padding:10px 12px;font-size:13.5px;font-family:inherit;direction:rtl;outline:none}"
   +".clw-in input:focus{border-color:"+TEAL+"}"
   +".clw-in button{width:42px;border:0;border-radius:11px;background:"+TEAL+";color:#fff;font-size:16px;cursor:pointer}"
   +".clw-ok{background:#E7F6EC;border:1px solid #Bfe6cd;color:#1A8A44;border-radius:12px;padding:10px 12px;font-size:13px;font-weight:700;align-self:stretch}";
  var st=document.createElement("style"); st.appendChild(document.createTextNode(css)); document.head.appendChild(st);

  // ---------- DOM ----------
  var bub=document.createElement("button"); bub.className="clw-bub"; bub.setAttribute("aria-label","Cliniva assistant");
  var pp=document.createElement("span"); pp.className="pp"; bub.appendChild(pp); bub.appendChild(document.createTextNode("🦷"));
  var panel=document.createElement("div"); panel.className="clw-panel";
  var hd=document.createElement("div"); hd.className="clw-hd";
  var av=document.createElement("div"); av.className="av"; av.textContent="Cv"; hd.appendChild(av);
  var hi=document.createElement("div"); var hb=document.createElement("b"); hb.textContent="مساعد Cliniva"; var hs=document.createElement("small"); hs.textContent="يرد ويحجز فورًا · 24/7"; hi.appendChild(hb); hi.appendChild(hs); hd.appendChild(hi);
  var x=document.createElement("button"); x.className="clw-x"; x.textContent="×"; x.onclick=function(){panel.classList.remove("open");}; hd.appendChild(x);
  var msgs=document.createElement("div"); msgs.className="clw-msgs";
  var chips=document.createElement("div"); chips.className="clw-chips";
  var inrow=document.createElement("div"); inrow.className="clw-in";
  var inp=document.createElement("input"); inp.placeholder="اكتب رسالتك...";
  var snd=document.createElement("button"); snd.textContent="➤";
  inrow.appendChild(inp); inrow.appendChild(snd);
  panel.appendChild(hd); panel.appendChild(msgs); panel.appendChild(chips); panel.appendChild(inrow);
  document.body.appendChild(bub); document.body.appendChild(panel);

  // ---------- helpers ----------
  function addMsg(role,text){ var m=document.createElement("div"); m.className="clw-m "+(role==="ai"?"ai":"me");
    String(text).split("\n").forEach(function(l,i){ if(i>0)m.appendChild(document.createElement("br")); m.appendChild(document.createTextNode(l)); });
    msgs.appendChild(m); msgs.scrollTop=msgs.scrollHeight; }
  function setChips(opts){ while(chips.firstChild)chips.removeChild(chips.firstChild);
    (opts||[]).forEach(function(o){ var c=document.createElement("button"); c.className="clw-chip"; c.textContent=o;
      c.onclick=function(){ handle(o); }; chips.appendChild(c); }); }
  function botSay(text,opts){ setTimeout(function(){ addMsg("ai",text); setChips(opts||[]); },420); }
  function okBox(text){ var d=document.createElement("div"); d.className="clw-ok"; d.textContent=text; msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight; }

  // ---------- conversation state machine ----------
  var step="idle", bk={};
  function genId(){ var s=""; for(var i=0;i<4;i++) s+=Math.floor(Math.random()*10); return "CLV-"+s; }
  function saveBooking(b){ var k="cliniva_bookings",a=[]; try{a=JSON.parse(localStorage.getItem(k)||"[]");}catch(e){} a.push(b);
    try{localStorage.setItem(k,JSON.stringify(a));}catch(e){}
    try{window.dispatchEvent(new Event("cliniva-booked"));}catch(e){} }
  function has(t,arr){ for(var i=0;i<arr.length;i++) if(t.indexOf(arr[i])>-1) return arr[i]; return null; }

  function handle(raw){
    var t=(raw||"").trim(); if(!t) return; addMsg("me",t); var low=t.toLowerCase();
    // contextual steps first
    if(step==="service"){ var s=has(t,SERVICES)||t; bk.service=s; step="day"; return botSay("تمام، "+s+" ✨ أنهي يوم يناسبك؟",DAYS); }
    if(step==="day"){ bk.day=has(t,DAYS)||t; step="time"; return botSay("وأنهي وقت؟",TIMES); }
    if(step==="time"){ bk.time=t; step="name"; return botSay("آخر حاجة — اسمك الكريم؟"); setChips([]); }
    if(step==="name"){ bk.name=t; step="done"; bk.id=genId(); bk.via="مساعد AI"; saveBooking(bk);
      setChips([]);
      return botSay("تم الحجز ✅",[]) , setTimeout(function(){
        okBox("رقم الحجز: "+bk.id+"\n"+bk.service+" — "+bk.day+" "+bk.time+"\nباسم: "+bk.name);
        addMsg("ai","📲 اتبعت رسالة تأكيد واتساب.\n👀 وظهر الموعد في داشبورد العيادة دلوقتي — افتح الداشبورد وشوف!");
        setChips(["حجز تاني","شكرًا"]);
      },900);
    }
    // intents
    if(has(low,["حجز","موعد","احجز","أحجز","حجز تاني"])){ step="service"; bk={}; return botSay("يسعدني أحجزلك 🦷 أنهي خدمة؟",SERVICES); }
    if(has(low,["سعر","كام","تكلفة","اسعار","أسعار","فلوس","بكام"])){ var ls=""; for(var k in PRICE) ls+="• "+k+": "+PRICE[k]+"\n"; step="idle";
      return botSay("الأسعار التقريبية:\n"+ls+"الدكتور بيحدد النهائي بعد الكشف.",["أحجز موعد"]); }
    if(has(low,["مواعيد","ساعات","بتفتح","امتى","إمتى","الجمعة","السبت"])){ step="idle"; return botSay("مواعيد العمل: السبت–الخميس 10ص–9م، والجمعة من 2 ظهرًا. تحب أحجزلك؟",["أحجز موعد"]); }
    if(has(low,["ألم","الم","وجع","طوار","مستعجل","ضرس"])){ step="idle"; return botSay("سلامتك 🙏 لو الألم شديد هرتّبلك موعد طوارئ النهاردة وأحوّلك للدكتور. تحب أحجز طوارئ؟",["أحجز طوارئ","أحجز موعد عادي"]); }
    if(has(low,["تجميل","تبييض","عدسات","هوليوود","ابتسامة","فينير"])){ step="service"; bk={service:"تجميل"}; step="day"; return botSay("تجميل الأسنان من أكتر خدماتنا 😍 أنهي يوم يناسبك؟",DAYS); }
    if(has(low,["شكر","تمام","تسلم","حلو"])){ step="idle"; return botSay("العفو 🌟 أنا في خدمتك 24/7 — تحب حاجة تانية؟",["أحجز موعد","الأسعار"]); }
    if(has(low,["طوارئ"])){ step="service"; bk={service:"طوارئ"}; step="day"; return botSay("اتطمن 🙏 أقرب موعد طوارئ — أنهي يوم؟",DAYS); }
    // affirmation fallback
    if(has(low,["اكيد","أكيد","ايوه","أيوه","نعم","ماشي","اوك","ok"])){ step="service"; bk={}; return botSay("تمام! أنهي خدمة تحب تحجزها؟",SERVICES); }
    step="idle";
    return botSay("أنا أساعدك في حجز موعد، الأسعار، المواعيد، أو طوارئ. تحب تبدأ بإيه؟",["أحجز موعد","الأسعار","المواعيد"]);
  }

  snd.onclick=function(){ var v=inp.value; inp.value=""; handle(v); };
  inp.addEventListener("keydown",function(e){ if(e.key==="Enter"){ var v=inp.value; inp.value=""; handle(v); } });
  var started=false;
  bub.onclick=function(){ panel.classList.toggle("open");
    if(panel.classList.contains("open") && !started){ started=true;
      botSay("أهلاً! أنا مساعد Cliniva 🦷\nأقدر أحجزلك موعد في ثواني أو أجاوب استفسارك. تحب نبدأ بإيه؟",["أحجز موعد","الأسعار","المواعيد"]); }
  };
})();
