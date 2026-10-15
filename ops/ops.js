(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f3=n=>(Math.round(n*1000)/1000).toFixed(3);
const kmf=n=>(+n||0).toLocaleString('en-US');
const EM='__EMBLEM__';
const store={get(k,d){try{const v=localStorage.getItem('ops_'+k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem('ops_'+k,JSON.stringify(v));}catch(e){}}};
let tt;function toast(s){const t=$('#toast');t.textContent=s;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2400);}

/* ---------- DEMO DATA (shape = what the night task will write to Firebase later) ---------- */
const DEMO={
  meta:{updatedAt:'2026-10-15T03:20:00+04:00',demo:true},
  kpi:{week:{revenue:412.3,profit:168.9,delta:0.12},due:929.14,toOrder:7,remind:12},
  tasks:[
    {id:'t1',title:'Call Mannol supplier: Nissan filters',area:'stock',priority:'high',age:3,done:false},
    {id:'t2',title:'Collect 2 old invoices: Al Riyami (OMR 86)',area:'money',priority:'med',age:1,done:false},
    {id:'t3',title:'Count DOT-4 and G11 coolant',area:'stock',priority:'low',age:0,done:true,by:'Ramesh 09:40'},
    {id:'t4',title:'Fix duplicate vehicle: Camry 2015 (2 records)',area:'data',priority:'low',age:2,done:false,src:'ai'},
    {id:'t5',title:'Reply to Alsharqiya University about invoice #313',area:'money',priority:'high',age:9,done:false},
    {id:'t6',title:'Order 29 mm Brother rolls for the sticker printer',area:'general',priority:'low',age:4,done:false}
  ],
  reminders:[
    {key:'r1',client:'Yahya Alyazeedi',car:'Toyota RAV4 2010',due:-3,kind:'ready',phone:'968XXXXXXXX'},
    {key:'r2',client:'Mohammad Almakly',car:'Nissan Sunny 2019',due:4,kind:'ready'},
    {key:'r3',client:'Idres Juma',car:'Toyota Corolla 2016',due:-12,kind:'check'},
    {key:'r4',client:'Athra Alyazeedi',car:'Mitsubishi Pajero 2014',due:-1,kind:'ready'},
    {key:'r5',client:'Sultan Almalky',car:'Toyota Land Cruiser 2012',due:2,kind:'flag',flag:'Km on the card looks wrong (12,000 less than last visit)'},
    {key:'r6',client:'Ibrahim Al Maskari',car:'Hyundai Sonata 2017',due:-20,kind:'ready'}
  ],
  stock:[
    {n:'Nissan Oil Filter 15208 31U0B',q:34,wk:1.9,days:124},
    {n:'Toyota Oil Filter 90915-YZZD4',q:17,wk:4.1,days:29},
    {n:'Mannol G11 Coolant 5L',q:4,wk:2.2,days:13},
    {n:'Zic 5W-30 X7 (L)',q:553,wk:38,days:102,u:'L'},
    {n:'Toyota 0W-20 SN Plus (L)',q:48,wk:22,days:15,u:'L'},
    {n:'Mannol Brake Fluid DOT-4',q:21,wk:3.5,days:42},
    {n:'Toyota Oil Filter 90915-YZZN2',q:37,wk:5.2,days:50},
    {n:'Honda 0W-20 (L)',q:2.4,wk:4,days:4,u:'L'},
    {n:'Castrol Magnatec 5W-30 (L)',q:31.5,wk:9,days:24,u:'L'}
  ],
  orders:[
    {vendor:'Suhail Alqanobi (Mannol)',items:[{n:'Mannol G11 Coolant 5L',q:8,p:3.25,pref:1},{n:'Mannol DOT-4 490g',q:10,p:1.0},{n:'Mannol 0W-16 5L',q:4,p:9.5}]},
    {vendor:'Toyota parts (Ibra)',items:[{n:'Toyota 0W-20 SN Plus 4L',q:12,p:11.0,pref:1},{n:'Oil Filter 90915-YZZD4',q:20,p:1.3}]},
    {vendor:'Honda dealer',items:[{n:'Honda 0W-20 4L',q:6,p:11.2}]}
  ],
  money:{due:929.14,over30:3,open:[
    {no:313,client:'Alsharqiya University',car:'Camry 2018',amt:142.5,age:41},
    {no:389,client:'Yasser Alyazeedi',car:'Hilux 2015',amt:86,age:23},
    {no:351,client:'Sultan Almalky',car:'Land Cruiser 2012',amt:64.25,age:9},
    {no:864,client:'Anas Alyazeedi',car:'Avalon 2019',amt:21.5,age:4},
    {no:860,client:'Yahya Alyazeedi',car:'RAV4 2010',amt:14.54,age:5}
  ],debtors:[['Alyazeedi family',486.2],['Alsharqiya University',142.5],['Al Riyami',86]]},
  perf:{weeks:[320,410,380,455,390,470,430,520,480,445,510,412],days:[['Sat',9,98.5,41],['Sun',11,131.2,55],['Mon',7,64.8,27],['Tue',8,71.3,29],['Wed',6,46.5,17]],top:[['Engine oil change',31],['Brake service',6],['Transmission fluid',3],['Coolant',3],['Battery',2]]},
  count:[{n:'Mannol DOT-4 490g',en:'Brake fluid, small bottles'},{n:'Toyota Oil Filter 90915-YZZN2',en:'Small Toyota filter'},{n:'Mannol G11 Coolant 5L',en:'Green coolant'},{n:'Nissan Oil Filter 15208 31U0B',en:'Nissan filter'},{n:'Zic 5W-30 X7 drum (L)',en:'Big drum, read the gauge'}]
};
let D=DEMO;
/* ---------- language (dashboard only; part names, codes and cars stay in English) ---------- */
const AR={'Ops room':'غرفة العمليات','Lock':'قفل','Today':'اليوم','Reminders':'التذكيرات','Stock':'المخزون','Orders':'الطلبيات','Money':'الفلوس','Performance':'الأداء','Count':'الجرد','AI':'المساعد',
'Sales this week · OMR':'مبيعات الأسبوع · ر.ع','Profit this week · OMR':'ربح الأسبوع · ر.ع','Due from customers':'مستحق على الزباين','Parts to order now':'قطع لازم تنطلب','Customers to remind':'زباين ينتظرون تذكير','Open tasks':'مهام مفتوحة','vs last week':'عن الأسبوع الماضي',
'DEMO DATA · NOTHING IS SAVED TO THE SYSTEM':'بيانات تجريبية · ما ينحفظ شي في النظام',
"Today's tasks":'مهام اليوم','Open':'المفتوحة','All':'الكل','Data':'بيانات','General':'عام','Customers':'زباين','Urgent':'عاجل','This week':'هذا الأسبوع','When free':'متى ما تيسر','Done':'تم','done':'تم','done by':'تم بواسطة','day old':'يوم','days old':'أيام','from AI review':'من مراجعة المساعد','Add a task for the team…':'أضف مهمة للفريق…','Add':'إضافة','Nothing here.':'ما فيه شي هنا.','Added (demo)':'انضافت (تجريبي)',
'Engine oil reminders':'تذكيرات زيت المحرك','30 days late → next 7 days':'متأخر 30 يوم ← الأسبوع الجاي','Not sent':'لم تُرسل','Sent':'أُرسلت','Needs a check':'تحتاج تأكيد','engine oil':'زيت محرك','Mark sent':'تم الإرسال','Undo sent':'تراجع','All reminders sent. 👌':'كل التذكيرات أُرسلت 👌','Check in the system: did he come back?':'تأكد من النظام: هل رجع؟','due today':'موعده اليوم','Demo: message copied. Real numbers come with the live data.':'تجريبي: الرسالة انسخت. الأرقام الحقيقية مع البيانات الحية.',
'Stock · by burn rate':'المخزون · حسب سرعة الاستهلاك','red = under 14 days':'أحمر = أقل من 14 يوم','lasts':'يكفي','days':'يوم','Order':'اطلب','/wk':'/أسبوع',
'Suggested orders':'طلبيات مقترحة','cheapest supplier':'المورد الأرخص','items':'أصناف','each':'للواحد','Order total (cost)':'مجموع الطلبية (تكلفة)','Copy message':'نسخ الرسالة','Mark ordered':'تم الطلب','Ordered ✓':'تم الطلب ✓','Order message copied':'رسالة الطلب انسخت',
'Open invoices':'الفواتير المفتوحة','older than 30 days':'أقدم من 30 يوم','Who owes the most':'أكبر المديونيات','of what is due':'من المستحق',
'Sales & profit · 12 weeks':'المبيعات والربح · 12 أسبوع','Sales':'المبيعات','Profit':'الربح','This week, day by day':'هذا الأسبوع يوم بيوم','Day':'اليوم','Invoices':'فواتير','Top services this week':'أكثر الخدمات هذا الأسبوع','jobs':'جوب',
'Daily count':'الجرد اليومي','Count the shelf first, then type the number. The system figure shows after you save.':'عدّ القطعة على الرف أول، بعدين اكتب الرقم. رقم النظام يطلع بعد الحفظ.','How many on the shelf?':'كم على الرف؟','Save':'حفظ','Counted:':'العدد:','system: — (comes with live data)':'النظام: — (مع البيانات الحية)',"Reset today's count (demo)":'امسح جرد اليوم (تجريبي)',
'Ask the workshop AI':'اسأل مساعد الورشة','demo answers':'ردود تجريبية','Top 3 things today':'أهم 3 أشياء اليوم','Who owes the most?':'منو عليه أكثر فلوس؟','Order message for Mannol':'رسالة طلب لمانول',"Ask about today's data…":'اسأل عن بيانات اليوم…','Ask':'اسأل','In the real version this answers from the night report. It needs an AI key (small cost per question).':'في النسخة الحقيقية يجاوب من تقرير الليل. يحتاج مفتاح AI (تكلفة بسيطة لكل سؤال).',
'Owner only. Test PIN: 1 2 3 4':'للمالك بس. الرقم التجريبي: 1 2 3 4','Wrong PIN':'الرقم غلط','Sat':'السبت','Sun':'الأحد','Mon':'الاثنين','Tue':'الثلاثاء','Wed':'الأربعاء','Thu':'الخميس','Fri':'الجمعة'};
let LANG=store.get('lang','en');
const T=k=>LANG==='ar'&&AR[k]!=null?AR[k]:k;
const dueTxtL=d=>LANG==='ar'?(d<0?`فات موعده ${-d===1?'يوم':-d===2?'يومين':(-d)+' يوم'}`:d===0?'موعده اليوم':`بعد ${d===1?'يوم':d===2?'يومين':d+' يوم'}`):(d<0?`due ${-d} day${-d>1?'s':''} ago`:d===0?'due today':`due in ${d} day${d>1?'s':''}`);
const ageTxt=a=>LANG==='ar'?(a===1?'من يوم':a===2?'من يومين':'من '+a+' أيام'):a+' day'+(a>1?'s':'')+' old';

/* ---------- state ---------- */
const S={tab:'today',filter:'open',remF:'todo',unlocked:store.get('unlocked',false),pin:''};
const TABS=[['today','Today'],['rem','Reminders'],['stock','Stock'],['orders','Orders'],['money','Money'],['perf','Performance'],['count','Count'],['ai','AI']];
const doneTasks=()=>store.get('done',{});const sentRem=()=>store.get('sent',{});const counts=()=>store.get('counts',{});const ordered=()=>store.get('ordered',{});

function render(){
  if(!S.unlocked){renderPin();return;}
  const up=new Date(D.meta.updatedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  document.documentElement.lang=LANG;document.documentElement.dir=LANG==='ar'?'rtl':'ltr';
  const lb=`<button class="lang" data-lang>${LANG==='ar'?'EN':'عربي'}</button>`;
  $('#root').innerHTML=`<div class="shell">
    <header class="top"><img class="em" src="${EM}" alt=""><span class="t">${T('Ops room')}</span><div class="me">${lb}<span style="color:var(--ok)">● ${up}</span><span class="av me">S</span></div></header>
    <nav class="rail"><img class="em" src="${EM}" alt="FSW"><button class="navb" aria-current="page"><svg><use href="#i-home"/></svg>${T('Ops room')}</button><button class="navb" data-lock><svg><use href="#i-gear"/></svg>${T('Lock')}</button>${lb}<span class="av me">S</span></nav>
    <main id="main"></main>
    <nav class="bottom"><div class="in" style="grid-template-columns:repeat(2,1fr)"><button class="navb" aria-current="page"><svg><use href="#i-home"/></svg>${T('Ops room')}</button><button class="navb" data-lock><svg><use href="#i-gear"/></svg>${T('Lock')}</button></div></nav></div>`;
  document.querySelectorAll('[data-lock]').forEach(b=>b.onclick=()=>{S.unlocked=false;store.set('unlocked',false);render();});
  document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{LANG=LANG==='ar'?'en':'ar';store.set('lang',LANG);render();});
  const m=$('#main');
  const dn=doneTasks();const openTasks=D.tasks.filter(t=>!(dn[t.id]??t.done)).length;
  const remTodo=D.reminders.filter(r=>r.kind!=='flag'&&!sentRem()[r.key]).length;
  const toOrder=D.stock.filter(s=>s.days<=14).length;
  m.innerHTML=`<div class="demo">${T('DEMO DATA · NOTHING IS SAVED TO THE SYSTEM')}</div>
  <div class="ops-kpis">
    <div class="kpi"><b>${f3(D.kpi.week.revenue)}</b><span>${T('Sales this week · OMR')}</span><em class="tr">▲ ${Math.round(D.kpi.week.delta*100)}% ${T('vs last week')}</em></div>
    <div class="kpi ok"><b>${f3(D.kpi.week.profit)}</b><span>${T('Profit this week · OMR')}</span></div>
    <div class="kpi org" data-go="money"><b>${f3(D.money.due)}</b><span>${T('Due from customers')}</span></div>
    <div class="kpi red" data-go="stock"><b>${toOrder}</b><span>${T('Parts to order now')}</span></div>
    <div class="kpi" data-go="rem"><b>${remTodo}</b><span>${T('Customers to remind')}</span></div>
    <div class="kpi" data-go="today"><b>${openTasks}</b><span>${T('Open tasks')}</span></div>
  </div>
  <div class="chips" id="tabs">${TABS.map(([k,l])=>`<button data-tab="${k}" aria-pressed="${S.tab===k}">${T(l)}${k==='today'?` <span>${openTasks}</span>`:k==='rem'?` <span>${remTodo}</span>`:k==='stock'?` <span>${toOrder}</span>`:k==='money'?` <span>${D.money.open.length}</span>`:k==='count'?` <span>${D.count.length}</span>`:''}</button>`).join('')}</div>
  <div id="panel"></div>`;
  m.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;store.set('tab',S.tab);render();});
  m.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.go;render();});
  ({today:pToday,rem:pRem,stock:pStock,orders:pOrders,money:pMoney,perf:pPerf,count:pCount,ai:pAI})[S.tab]($('#panel'));
}

/* ---------- PIN (owner only) ---------- */
function renderPin(){
  document.documentElement.lang=LANG;document.documentElement.dir=LANG==='ar'?'rtl':'ltr';
  $('#root').innerHTML=`<div class="pin"><button class="lang" data-lang style="position:fixed;top:14px;right:14px">${LANG==='ar'?'EN':'عربي'}</button><img class="em" src="${EM}" alt=""><h2>${T('Ops room')}</h2><p class="hint">${T('Owner only. Test PIN: 1 2 3 4')}</p>
    <div class="dots">${[0,1,2,3].map(i=>`<i class="${S.pin.length>i?'on':''}"></i>`).join('')}</div>
    <div class="pad">${['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k=>k?`<button data-k="${k}">${k}</button>`:'<span></span>').join('')}</div></div>`;
  document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{LANG=LANG==='ar'?'en':'ar';store.set('lang',LANG);renderPin();});
  document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(k==='⌫')S.pin=S.pin.slice(0,-1);else if(S.pin.length<4)S.pin+=k;
    if(S.pin.length===4){if(S.pin==='1234'){S.unlocked=true;store.set('unlocked',true);S.pin='';render();return;}toast(T('Wrong PIN'));S.pin='';}
    renderPin();});
}

/* ---------- panels ---------- */
const PRI={high:['var(--red)','t-red','Urgent'],med:['var(--warn)','t-warn','This week'],low:['#5a45c4','t-mute','When free']};
const AREA={stock:'Stock',money:'Money',customers:'Customers',data:'Data',general:'General'};
function pToday(p){
  const dn=doneTasks();
  let list=D.tasks.map(t=>Object.assign({},t,{done:dn[t.id]??t.done}));
  if(S.filter==='open')list=list.filter(t=>!t.done);else if(S.filter!=='all')list=list.filter(t=>t.area===S.filter);
  list.sort((a,b)=>(a.done-b.done)||(['high','med','low'].indexOf(a.priority)-['high','med','low'].indexOf(b.priority)));
  p.innerHTML=`<div class="sec-h"><b>${T("Today's tasks")}</b><span></span></div>
  <div class="chips">${[['open','Open'],['all','All'],['stock','Stock'],['money','Money'],['data','Data']].map(([k,l])=>`<button data-f="${k}" aria-pressed="${S.filter===k}">${T(l)}</button>`).join('')}</div>
  <div class="nh-list">${list.map(t=>{const [c,tg,tl]=PRI[t.priority];return `<button class="task" data-t="${t.id}" style="--sc:${t.done?'var(--ok)':c}"><i class="${t.done?'on':''}"></i><div><b style="${t.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(t.title)}</b><span>${T(AREA[t.area]||'General')}${t.done?(t.by?' · '+T('done by')+' '+esc(t.by):' · '+T('done')):t.age?' · '+ageTxt(t.age):''}${t.src==='ai'?' · '+T('from AI review'):''}</span></div><span class="tg ${t.done?'t-ok':tg}">${t.done?T('Done'):T(tl)}</span></button>`;}).join('')||`<div class="empty">${T('Nothing here.')}</div>`}</div>
  <form class="jb-in" id="addT" style="grid-template-columns:1fr auto"><input placeholder="${T('Add a task for the team…')}" id="newT" autocomplete="off"><button class="btn okb sm" type="submit" style="width:auto;padding:0 16px">${T('Add')}</button></form>`;
  p.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.filter=b.dataset.f;render();});
  p.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const d=doneTasks();const t=D.tasks.find(x=>x.id===b.dataset.t);d[t.id]=!(d[t.id]??t.done);store.set('done',d);render();});
  $('#addT').onsubmit=e=>{e.preventDefault();const v=$('#newT').value.trim();if(!v)return;D.tasks.unshift({id:'t'+Date.now(),title:v,area:'general',priority:'med',age:0,done:false});toast(T('Added (demo)'));render();};
}
function pRem(p){
  const sent=sentRem();
  let list=D.reminders.slice();
  if(S.remF==='todo')list=list.filter(r=>!sent[r.key]&&r.kind!=='flag');if(S.remF==='sent')list=list.filter(r=>sent[r.key]);if(S.remF==='warn')list=list.filter(r=>r.kind!=='ready');
  const dueTxt=dueTxtL;
  p.innerHTML=`<div class="sec-h"><b>${T('Engine oil reminders')}</b><span class="hint">${T('30 days late → next 7 days')}</span></div>
  <div class="chips">${[['todo','Not sent'],['sent','Sent'],['warn','Needs a check']].map(([k,l])=>`<button data-f="${k}" aria-pressed="${S.remF===k}">${T(l)}</button>`).join('')}</div>
  <div class="nh-list">${list.map(r=>`<div class="rem${sent[r.key]?' off':''}"><div class="h"><b>${esc(r.client)}</b><span>${dueTxt(r.due)}</span></div><span style="font-size:.78rem;color:var(--muted)">${esc(r.car)} · ${T('engine oil')}</span>
    ${r.kind==='flag'?`<div class="tag t-bad" style="justify-self:start">⛔ ${esc(r.flag)}</div>`:r.kind==='check'?`<div class="tag t-warn" style="justify-self:start">🔎 ${T('Check in the system: did he come back?')}</div>`:''}
    <div class="acts"><button class="wa" data-wa="${r.key}">WhatsApp</button><button data-sent="${r.key}">${sent[r.key]?T('Undo sent'):T('Mark sent')}</button></div></div>`).join('')||`<div class="empty">${T('All reminders sent. 👌')}</div>`}</div>`;
  p.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.remF=b.dataset.f;render();});
  p.querySelectorAll('[data-sent]').forEach(b=>b.onclick=()=>{const s=sentRem();s[b.dataset.sent]=!s[b.dataset.sent];store.set('sent',s);render();});
  p.querySelectorAll('[data-wa]').forEach(b=>b.onclick=()=>{const r=D.reminders.find(x=>x.key===b.dataset.wa);const msg='السلام عليكم،\nوفقاً لسجلاتنا قد يكون حان موعد تغيير زيت المحرك لسيارتكم '+r.car+'.\nوفي حال أُجريت الخدمة لدينا مؤخراً فنعتذر عن هذا التذكير.\n\nورشة عالم الخدمات السريعة';navigator.clipboard&&navigator.clipboard.writeText(msg).catch(()=>{});toast(T('Demo: message copied. Real numbers come with the live data.'));});
}
function pStock(p){
  const rows=D.stock.slice().sort((a,b)=>a.days-b.days);
  p.innerHTML=`<div class="sec-h"><b>${T('Stock · by burn rate')}</b><span class="hint">${T('red = under 14 days')}</span></div><div class="nh-list">${rows.map(r=>{const c=r.days<=14?'var(--bad)':r.days<=30?'var(--warn)':'var(--ok)';const pct=Math.max(4,Math.min(100,r.days/120*100));return `<div class="nh-row"><b>${esc(r.n)}</b><span class="r">${r.q}<small>${r.wk}${r.u==='L'?' L':''}${T('/wk')}</small></span><span class="m">${T('lasts')} ${r.days} ${T('days')}${r.days<=14?' · <span class="tag t-bad">'+T('Order')+'</span>':''}</span><div class="nh-bar"><i style="width:${pct}%;background:${c}"></i></div></div>`;}).join('')}</div>`;
}
function pOrders(p){
  const od=ordered();
  p.innerHTML=`<div class="sec-h"><b>${T('Suggested orders')}</b><span class="hint">⭐ ${T('cheapest supplier')}</span></div><div class="nh-list">${D.orders.map((o,i)=>{const tot=o.items.reduce((a,x)=>a+(od[o.vendor+'|'+x.n]===0?0:(od[o.vendor+'|'+x.n]??x.q)*x.p),0);return `<div class="ord${od['sent|'+o.vendor]?' off':''}"><div class="h"><b>${esc(o.vendor)}</b><span>${o.items.length} ${T('items')}</span></div>
    ${o.items.map(x=>{const k=o.vendor+'|'+x.n;const q=od[k]??x.q;return `<div class="oi"><i class="${q>0?'on':''}" data-tg="${k}"></i><div><b>${esc(x.n)}${x.pref?' ⭐':''}</b><span>${f3(x.p)} ${T('each')}</span></div><div class="st"><button data-q="${k}|-1">−</button><em>${q}</em><button data-q="${k}|1">+</button></div></div>`;}).join('')}
    <div class="tot"><span>${T('Order total (cost)')}</span><b>${f3(tot)} OMR</b></div>
    <div class="jb-two"><button class="btn ghost sm" data-msg="${i}">${T('Copy message')}</button><button class="btn okb sm" data-ordsent="${o.vendor}">${od['sent|'+o.vendor]?T('Ordered ✓'):T('Mark ordered')}</button></div></div>`;}).join('')}</div>`;
  p.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const [v,n,d]=b.dataset.q.split('|');const k=v+'|'+n;const o=ordered();const x=D.orders.find(z=>z.vendor===v).items.find(z=>z.n===n);o[k]=Math.max(0,(o[k]??x.q)+(+d));store.set('ordered',o);render();});
  p.querySelectorAll('[data-tg]').forEach(b=>b.onclick=()=>{const k=b.dataset.tg;const o=ordered();const [v,n]=k.split('|');const x=D.orders.find(z=>z.vendor===v).items.find(z=>z.n===n);o[k]=(o[k]??x.q)>0?0:x.q;store.set('ordered',o);render();});
  p.querySelectorAll('[data-ordsent]').forEach(b=>b.onclick=()=>{const o=ordered();o['sent|'+b.dataset.ordsent]=!o['sent|'+b.dataset.ordsent];store.set('ordered',o);render();});
  p.querySelectorAll('[data-msg]').forEach(b=>b.onclick=()=>{const o=D.orders[+b.dataset.msg];const od2=ordered();const t='السلام عليكم، نرجو توفير:\n'+o.items.filter(x=>(od2[o.vendor+'|'+x.n]??x.q)>0).map(x=>'• '+x.n+' × '+(od2[o.vendor+'|'+x.n]??x.q)).join('\n')+'\n\nورشة عالم الخدمات السريعة · 9470 2061';navigator.clipboard&&navigator.clipboard.writeText(t).catch(()=>{});toast(T('Order message copied'));});
}
function chartSvg(vals,vals2){const mx=Math.max(...vals)*1.15;let b='';vals.forEach((v,i)=>{const x=20+i*47;const bh=v/mx*140;b+=`<rect x="${x}" y="${160-bh}" width="18" height="${bh}" rx="4" fill="#ee3a39" opacity=".85"/>`;if(vals2){const ph=vals2[i]/mx*140;b+=`<rect x="${x+20}" y="${160-ph}" width="12" height="${ph}" rx="4" fill="#f27b21"/>`;}});return `<svg viewBox="0 0 600 180">${b}<line x1="10" y1="160" x2="590" y2="160" stroke="#2a2a2e"/></svg>`;}
function pMoney(p){
  const m=D.money;
  p.innerHTML=`<div class="two-col"><div class="col"><div class="sec-h"><b>${T('Open invoices')}</b><a>OMR ${f3(m.due)} · ${m.over30} ${T('older than 30 days')}</a></div>
  <div class="jb-list" style="padding:0 12px;display:block">${m.open.sort((a,b)=>b.age-a.age).map(o=>`<div class="money-row"><b>${esc(o.client)}</b><span>#${o.no} · ${esc(o.car)}</span><span class="v">${f3(o.amt)}<small style="${o.age>30?'color:var(--bad)':''}">${o.age} ${T('days')}</small></span></div>`).join('')}</div></div>
  <div class="col"><div class="sec-h"><b>${T('Who owes the most')}</b><span></span></div><div class="nh-list">${m.debtors.map(([n,v])=>`<div class="nh-row"><b>${esc(n)}</b><span class="r">${f3(v)}<small>OMR</small></span><span class="m">${Math.round(v/m.due*100)}% ${T('of what is due')}</span><div class="nh-bar"><i style="width:${Math.round(v/m.due*100)}%;background:var(--orange)"></i></div></div>`).join('')}</div></div></div>`;
}
function pPerf(p){
  const w=D.perf.weeks;const pr=w.map(v=>Math.round(v*0.41));
  p.innerHTML=`<div class="chart"><div class="sec-h"><b>${T('Sales & profit · 12 weeks')}</b><span style="font-size:.72rem;color:var(--muted)"><i style="display:inline-block;width:10px;height:10px;background:#ee3a39;border-radius:2px"></i> ${T('Sales')} &nbsp;<i style="display:inline-block;width:10px;height:10px;background:#f27b21;border-radius:2px"></i> ${T('Profit')}</span></div>${chartSvg(w,pr)}</div>
  <div class="two-col"><div class="col"><div class="sec-h"><b>${T('This week, day by day')}</b><span></span></div><div class="tbl"><div class="r h"><span>${T('Day')}</span><span>${T('Invoices')}</span><span>${T('Sales')}</span><span>${T('Profit')}</span></div>${D.perf.days.map(d=>`<div class="r"><span>${T(d[0])}</span><span>${d[1]}</span><span>${f3(d[2])}</span><span>${f3(d[3])}</span></div>`).join('')}</div></div>
  <div class="col"><div class="sec-h"><b>${T('Top services this week')}</b><span></span></div><div class="nh-list">${D.perf.top.map(([n,c])=>`<div class="nh-row"><b>${esc(n)}</b><span class="r">${c}<small>${T('jobs')}</small></span><span class="m"></span><div class="nh-bar"><i style="width:${Math.round(c/D.perf.top[0][1]*100)}%;background:var(--red)"></i></div></div>`).join('')}</div></div></div>`;
}
function pCount(p){
  const c=counts();
  p.innerHTML=`<div class="sec-h"><b>${T('Daily count')} · ${new Date().toLocaleDateString(LANG==='ar'?'ar-OM':'en-GB',{day:'numeric',month:'short'})}</b><span class="hint">${Object.keys(c).length}/${D.count.length} ${T('done')}</span></div>
  <p class="hint">${T('Count the shelf first, then type the number. The system figure shows after you save.')}</p>
  <div class="nh-list">${D.count.map((it,i)=>`<div class="cnt${c[it.n]!=null?' done':''}"><b>${esc(it.n)}</b><span>${esc(it.en)}</span>${c[it.n]!=null?`<span style="color:var(--ok)">${T('Counted:')} <b>${c[it.n]}</b> · ${T('system: — (comes with live data)')}</span>`:`<div class="row"><input inputmode="decimal" placeholder="${T('How many on the shelf?')}" id="c${i}"><button data-c="${i}">${T('Save')}</button></div>`}</div>`).join('')}</div>
  <button class="btn ghost sm" id="cclr">${T("Reset today's count (demo)")}</button>`;
  p.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const i=+b.dataset.c;const v=$('#c'+i).value.trim();if(!v)return;const cc=counts();cc[D.count[i].n]=v;store.set('counts',cc);render();});
  $('#cclr').onclick=()=>{store.set('counts',{});render();};
}
function pAI(p){
  const hist=store.get('ai',[]);
  p.innerHTML=`<div class="ai"><div class="sec-h"><b>${T('Ask the workshop AI')}</b><span style="font-size:.72rem;color:var(--muted)">${T('demo answers')}</span></div>
    <div class="q">${['Top 3 things today','Who owes the most?','Order message for Mannol'].map(q=>`<span data-ask="${esc(q)}">${esc(T(q))}</span>`).join('')}</div>
    <div style="display:grid;gap:8px">${hist.map(h=>`<div class="bub${h.me?' me':''}">${esc(h.t)}</div>`).join('')}</div>
    <form id="askF"><input id="askI" placeholder="${T("Ask about today's data…")}" autocomplete="off"><button type="submit">${T('Ask')}</button></form>
    <p class="hint" style="margin:0">${T('In the real version this answers from the night report. It needs an AI key (small cost per question).')}</p></div>`;
  const ask=q=>{const h=store.get('ai',[]);h.push({me:1,t:q});const a=/top|first|today/i.test(q)?'1) Order G11 coolant and Toyota 0W-20 (both under 2 weeks).\n2) Collect invoice #313 from Alsharqiya University (41 days).\n3) Send 4 oil reminders that are ready.':/owe|debt|فلوس/i.test(q)?'Alyazeedi family OMR 486.200 (52%), Alsharqiya University 142.500, Al Riyami 86.000.':/order|mannol/i.test(q)?'السلام عليكم، نرجو توفير: G11 ×8، DOT-4 ×10، 0W-16 5L ×4. ورشة عالم الخدمات السريعة':'Demo answer: the live version reads the night report and answers from it.';h.push({t:a});store.set('ai',h.slice(-8));render();};
  p.querySelectorAll('[data-ask]').forEach(s=>s.onclick=()=>ask(s.dataset.ask));
  $('#askF').onsubmit=e=>{e.preventDefault();const v=$('#askI').value.trim();if(v)ask(v);};
}

/* ---------- start ---------- */
S.tab=store.get('tab','today');
render();
const CapApp=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
if(CapApp&&CapApp.addListener)CapApp.addListener('backButton',()=>{if(S.unlocked&&S.tab!=='today'){S.tab='today';render();}else CapApp.exitApp();});
})();
