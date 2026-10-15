/* FSW Ops room — a section inside the full FSW app (test build only). Layout is always LTR; the language switch only changes the words. */
window.FSW_DEFAULTS={newhome:true};
window.FSW_EXTRA={ops:{t:'Ops room',i:'🧭',c:'#1f1a3a',g:'rgba(90,69,196,.32)',sub:'owner · demo data'}};
window.FSW_HOOK=function(A){
"use strict";
const {S,render,store,toast,esc,f3,kmf,deeper}=A;
const $=s=>document.querySelector(s);

/* ---------- DEMO DATA (same shape the night task will write to Firebase) ---------- */
const DEMO={
  meta:{updatedAt:'2026-10-15T03:20:00+04:00'},
  kpi:{week:{revenue:412.3,profit:168.9,delta:0.12}},
  tasks:[
    {id:'t1',title:'Call Mannol supplier about Nissan filters',area:'stock',priority:'high',age:3,done:false},
    {id:'t2',title:'Collect 2 old invoices from Al Riyami (OMR 86)',area:'money',priority:'med',age:1,done:false},
    {id:'t3',title:'Count DOT-4 and G11 coolant',area:'stock',priority:'low',age:0,done:true,by:'Ramesh 09:40'},
    {id:'t4',title:'Fix duplicate vehicle: Camry 2015 has 2 records',area:'data',priority:'low',age:2,done:false,src:'ai'},
    {id:'t5',title:'Reply to Alsharqiya University about invoice #313',area:'money',priority:'high',age:9,done:false},
    {id:'t6',title:'Order 29 mm Brother rolls for the sticker printer',area:'general',priority:'low',age:4,done:false}
  ],
  reminders:[
    {key:'r1',client:'Yahya Alyazeedi',car:'Toyota RAV4 2010',due:-3,kind:'ready'},
    {key:'r2',client:'Mohammad Almakly',car:'Nissan Sunny 2019',due:4,kind:'ready'},
    {key:'r3',client:'Idres Juma',car:'Toyota Corolla 2016',due:-12,kind:'check'},
    {key:'r4',client:'Athra Alyazeedi',car:'Mitsubishi Pajero 2014',due:-1,kind:'ready'},
    {key:'r5',client:'Sultan Almalky',car:'Toyota Land Cruiser 2012',due:2,kind:'flag',flag:'Km on the card looks wrong'},
    {key:'r6',client:'Ibrahim Al Maskari',car:'Hyundai Sonata 2017',due:-20,kind:'ready'}
  ],
  stock:[
    {n:'Nissan Oil Filter 15208 31U0B',q:34,wk:1.9,days:124},{n:'Toyota Oil Filter 90915-YZZD4',q:17,wk:4.1,days:29},
    {n:'Mannol G11 Coolant 5L',q:4,wk:2.2,days:13},{n:'Zic 5W-30 X7',q:553,wk:38,days:102,u:'L'},
    {n:'Toyota 0W-20 SN Plus',q:48,wk:22,days:15,u:'L'},{n:'Mannol Brake Fluid DOT-4',q:21,wk:3.5,days:42},
    {n:'Toyota Oil Filter 90915-YZZN2',q:37,wk:5.2,days:50},{n:'Honda 0W-20',q:2.4,wk:4,days:4,u:'L'},{n:'Castrol Magnatec 5W-30',q:31.5,wk:9,days:24,u:'L'}
  ],
  orders:[
    {vendor:'Suhail Alqanobi (Mannol)',items:[{n:'Mannol G11 Coolant 5L',q:8,p:3.25,pref:1},{n:'Mannol DOT-4 490g',q:10,p:1.0},{n:'Mannol 0W-16 5L',q:4,p:9.5}]},
    {vendor:'Toyota parts (Ibra)',items:[{n:'Toyota 0W-20 SN Plus 4L',q:12,p:11.0,pref:1},{n:'Oil Filter 90915-YZZD4',q:20,p:1.3}]},
    {vendor:'Honda dealer',items:[{n:'Honda 0W-20 4L',q:6,p:11.2}]}
  ],
  money:{due:929.14,over30:3,open:[
    {no:313,client:'Alsharqiya University',car:'Camry 2018',amt:142.5,age:41},{no:389,client:'Yasser Alyazeedi',car:'Hilux 2015',amt:86,age:23},
    {no:351,client:'Sultan Almalky',car:'Land Cruiser 2012',amt:64.25,age:9},{no:864,client:'Anas Alyazeedi',car:'Avalon 2019',amt:21.5,age:4},{no:860,client:'Yahya Alyazeedi',car:'RAV4 2010',amt:14.54,age:5}
  ],debtors:[['Alyazeedi family',486.2],['Alsharqiya University',142.5],['Al Riyami',86]]},
  perf:{weeks:[320,410,380,455,390,470,430,520,480,445,510,412],days:[['Sat',9,98.5,41],['Sun',11,131.2,55],['Mon',7,64.8,27],['Tue',8,71.3,29],['Wed',6,46.5,17]],top:[['Engine oil change',31],['Brake service',6],['Transmission fluid',3],['Coolant',3],['Battery',2]]},
  count:[{n:'Mannol DOT-4 490g',en:'Brake fluid, small bottles'},{n:'Toyota Oil Filter 90915-YZZN2',en:'Small Toyota filter'},{n:'Mannol G11 Coolant 5L',en:'Green coolant'},{n:'Nissan Oil Filter 15208 31U0B',en:'Nissan filter'},{n:'Zic 5W-30 X7 drum',en:'Big drum, read the gauge'}]
};
const D=DEMO;

/* ---------- words (layout never changes; part names, cars, codes stay English) ---------- */
const AR={'Ops room':'غرفة العمليات','Today':'اليوم','Reminders':'التذكيرات','Stock':'المخزون','Orders':'الطلبيات','Money':'الفلوس','Performance':'الأداء','Count':'الجرد','AI':'المساعد',
'Sales this week':'مبيعات الأسبوع','Profit this week':'ربح الأسبوع','Due from customers':'مستحق على الزباين','Parts to order':'قطع لازم تنطلب','To remind':'ينتظرون تذكير','Open tasks':'مهام مفتوحة','vs last week':'عن الأسبوع الماضي',
'Demo data · nothing is saved to the system':'بيانات تجريبية · ما ينحفظ شي في النظام','Updated':'آخر تحديث',
"Today's tasks":'مهام اليوم','Open':'المفتوحة','All':'الكل','Data':'بيانات','General':'عام','Customers':'زباين','Urgent':'عاجل','This week':'هذا الأسبوع','When free':'متى ما تيسر','Done':'تم','done by':'تم بواسطة','from AI review':'من مراجعة المساعد','Add a task for the team…':'أضف مهمة للفريق…','Add':'إضافة','Nothing here.':'ما فيه شي هنا.','Added (demo)':'انضافت (تجريبي)',
'Engine oil reminders':'تذكيرات زيت المحرك','30 days late → next 7 days':'متأخر 30 يوم ← الأسبوع الجاي','Not sent':'لم تُرسل','Sent':'أُرسلت','Needs a check':'تحتاج تأكيد','engine oil':'زيت محرك','Mark sent':'تم الإرسال','Undo':'تراجع','All reminders sent.':'كل التذكيرات أُرسلت.','Check in the system: did he come back?':'تأكد من النظام: هل رجع؟','Demo: message copied.':'تجريبي: الرسالة انسخت.',
'Stock by burn rate':'المخزون حسب سرعة الاستهلاك','red = under 14 days':'أحمر = أقل من 14 يوم','lasts':'يكفي','days':'يوم','Order':'اطلب','/wk':'/أسبوع',
'Suggested orders':'طلبيات مقترحة','cheapest supplier':'المورد الأرخص','items':'أصناف','each':'للواحد','Order total (cost)':'مجموع الطلبية (تكلفة)','Copy message':'نسخ الرسالة','Mark ordered':'تم الطلب','Ordered':'تم الطلب','Order message copied':'رسالة الطلب انسخت',
'Open invoices':'الفواتير المفتوحة','older than 30 days':'أقدم من 30 يوم','Who owes the most':'أكبر المديونيات','of what is due':'من المستحق',
'Sales & profit · 12 weeks':'المبيعات والربح · 12 أسبوع','Sales':'المبيعات','Profit':'الربح','This week, day by day':'هذا الأسبوع يوم بيوم','Day':'اليوم','Invoices':'فواتير','Top services this week':'أكثر الخدمات هذا الأسبوع','jobs':'جوب',
'Daily count':'الجرد اليومي','Count the shelf first, then type the number. The system figure shows after you save.':'عدّ القطعة على الرف أول، بعدين اكتب الرقم. رقم النظام يطلع بعد الحفظ.','How many on the shelf?':'كم على الرف؟','Save':'حفظ','Counted':'العدد','system: — (with live data)':'النظام: — (مع البيانات الحية)','Reset today (demo)':'امسح جرد اليوم (تجريبي)',
'Ask the workshop AI':'اسأل مساعد الورشة','demo answers':'ردود تجريبية','Top 3 things today':'أهم 3 أشياء اليوم','Who owes the most?':'منو عليه أكثر فلوس؟','Order message for Mannol':'رسالة طلب لمانول',"Ask about today's data…":'اسأل عن بيانات اليوم…','Ask':'اسأل','The real version answers from the night report. It needs an AI key (small cost per question).':'النسخة الحقيقية تجاوب من تقرير الليل. تحتاج مفتاح AI (تكلفة بسيطة لكل سؤال).',
'Sat':'السبت','Sun':'الأحد','Mon':'الاثنين','Tue':'الثلاثاء','Wed':'الأربعاء','Thu':'الخميس','Fri':'الجمعة'};
let LANG=store.get('opslang','en');
const T=k=>LANG==='ar'&&AR[k]!=null?AR[k]:k;
const ar=t=>`<bdi dir="auto">${t}</bdi>`;
const due=d=>LANG==='ar'?(d<0?`فات موعده ${-d===1?'يوم':-d===2?'يومين':(-d)+' يوم'}`:d===0?'موعده اليوم':`بعد ${d===1?'يوم':d===2?'يومين':d+' يوم'}`):(d<0?`due ${-d} day${-d>1?'s':''} ago`:d===0?'due today':`due in ${d} day${d>1?'s':''}`);
const age=a=>LANG==='ar'?(a===1?'من يوم':a===2?'من يومين':'من '+a+' أيام'):a+' day'+(a>1?'s':'')+' old';
const dn=()=>store.get('opsdone',{}),sent=()=>store.get('opssent',{}),cnt=()=>store.get('opscount',{}),ord=()=>store.get('opsord',{});
const O={tab:store.get('opstab','today'),f:'open',rf:'todo'};
const TABS=[['today','Today'],['rem','Reminders'],['stock','Stock'],['orders','Orders'],['money','Money'],['perf','Performance'],['count','Count'],['ai','AI']];

function renderOps(m,hd){
  const d=dn();const openTasks=D.tasks.filter(t=>!(d[t.id]??t.done)).length;
  const remTodo=D.reminders.filter(r=>r.kind!=='flag'&&!sent()[r.key]).length;
  const toOrder=D.stock.filter(s=>s.days<=14).length;
  const up=new Date(D.meta.updatedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  const cnts={today:openTasks,rem:remTodo,stock:toOrder,money:D.money.open.length,count:D.count.length};
  m.innerHTML=`<div class="ops">
  <div class="ops-hd"><button class="nh-bk" data-home aria-label="Home">‹</button><div class="ttl"><b>${ar(T('Ops room'))}</b><span>${ar(T('Updated'))} ${up} · <em>${ar(T('Demo data · nothing is saved to the system'))}</em></span></div><button class="lang" data-lang>${LANG==='ar'?'EN':'عربي'}</button></div>
  <div class="ops-kpis">
    <div class="kpi"><b>${f3(D.kpi.week.revenue)}</b><span>${ar(T('Sales this week'))} · OMR</span><em>▲ ${Math.round(D.kpi.week.delta*100)}% ${ar(T('vs last week'))}</em></div>
    <div class="kpi ok"><b>${f3(D.kpi.week.profit)}</b><span>${ar(T('Profit this week'))} · OMR</span></div>
    <div class="kpi org" data-go="money"><b>${f3(D.money.due)}</b><span>${ar(T('Due from customers'))}</span></div>
    <div class="kpi red" data-go="stock"><b>${toOrder}</b><span>${ar(T('Parts to order'))}</span></div>
    <div class="kpi" data-go="rem"><b>${remTodo}</b><span>${ar(T('To remind'))}</span></div>
    <div class="kpi" data-go="today"><b>${openTasks}</b><span>${ar(T('Open tasks'))}</span></div>
  </div>
  <div class="ops-tabs">${TABS.map(([k,l])=>`<button data-otab="${k}" aria-pressed="${O.tab===k}">${ar(T(l))}${cnts[k]?`<span>${cnts[k]}</span>`:''}</button>`).join('')}</div>
  <div class="ops-panel" id="opsPanel"></div></div>`;
  m.querySelector('[data-home]').onclick=()=>{S.sec=null;render();scrollTo(0,0);};
  m.querySelector('[data-lang]').onclick=()=>{LANG=LANG==='ar'?'en':'ar';store.set('opslang',LANG);render();};
  m.querySelectorAll('[data-otab]').forEach(b=>b.onclick=()=>{O.tab=b.dataset.otab;store.set('opstab',O.tab);render();});
  m.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{O.tab=b.dataset.go;store.set('opstab',O.tab);render();});
  ({today:pToday,rem:pRem,stock:pStock,orders:pOrders,money:pMoney,perf:pPerf,count:pCount,ai:pAI})[O.tab]($('#opsPanel'));
}
const sec=(t,r='')=>`<div class="ops-sec"><b>${ar(t)}</b><span>${r}</span></div>`;
const chips=(list,cur,attr)=>`<div class="ops-chips">${list.map(([k,l])=>`<button data-${attr}="${k}" aria-pressed="${cur===k}">${ar(T(l))}</button>`).join('')}</div>`;
const PRI={high:['var(--red)','t-red','Urgent'],med:['var(--warn)','t-warn','This week'],low:['#5a45c4','t-mute','When free']};
const AREA={stock:'Stock',money:'Money',customers:'Customers',data:'Data',general:'General'};
function pToday(p){
  const d=dn();let list=D.tasks.map(t=>Object.assign({},t,{done:d[t.id]??t.done}));
  if(O.f==='open')list=list.filter(t=>!t.done);else if(O.f!=='all')list=list.filter(t=>t.area===O.f);
  list.sort((a,b)=>(a.done-b.done)||(['high','med','low'].indexOf(a.priority)-['high','med','low'].indexOf(b.priority)));
  p.innerHTML=sec(T("Today's tasks"))+chips([['open','Open'],['all','All'],['stock','Stock'],['money','Money'],['data','Data']],O.f,'f')+
  `<div class="ops-list">${list.map(t=>{const [c,tg,tl]=PRI[t.priority];return `<button class="ops-task" data-t="${t.id}" style="--sc:${t.done?'var(--ok)':c}"><i class="${t.done?'on':''}"></i><div><b style="${t.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(t.title)}</b><span>${ar(T(AREA[t.area]||'General'))}${t.done?' · '+ar(T('done by'))+' '+esc(t.by||''):t.age?' · '+ar(age(t.age)):''}${t.src==='ai'?' · '+ar(T('from AI review')):''}</span></div><span class="tag ${t.done?'t-ok':tg}">${ar(T(t.done?'Done':tl))}</span></button>`;}).join('')||`<div class="empty">${ar(T('Nothing here.'))}</div>`}</div>
  <form class="ops-add" id="opsAdd"><input placeholder="${T('Add a task for the team…')}" id="opsNew" autocomplete="off"><button type="submit">${ar(T('Add'))}</button></form>`;
  p.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{O.f=b.dataset.f;render();});
  p.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const x=dn();const t=D.tasks.find(z=>z.id===b.dataset.t);x[t.id]=!(x[t.id]??t.done);store.set('opsdone',x);render();});
  $('#opsAdd').onsubmit=e=>{e.preventDefault();const v=$('#opsNew').value.trim();if(!v)return;D.tasks.unshift({id:'t'+Date.now(),title:v,area:'general',priority:'med',age:0,done:false});toast(T('Added (demo)'));render();};
}
function pRem(p){
  const s=sent();let list=D.reminders.slice();
  if(O.rf==='todo')list=list.filter(r=>!s[r.key]&&r.kind!=='flag');if(O.rf==='sent')list=list.filter(r=>s[r.key]);if(O.rf==='warn')list=list.filter(r=>r.kind!=='ready');
  p.innerHTML=sec(T('Engine oil reminders'),ar(T('30 days late → next 7 days')))+chips([['todo','Not sent'],['sent','Sent'],['warn','Needs a check']],O.rf,'rf')+
  `<div class="ops-list">${list.map(r=>`<div class="ops-card${s[r.key]?' off':''}"><div class="h"><b>${esc(r.client)}</b><span>${ar(due(r.due))}</span></div><span class="sub">${esc(r.car)} · ${ar(T('engine oil'))}</span>
    ${r.kind==='flag'?`<span class="tag t-bad">⛔ ${esc(r.flag)}</span>`:r.kind==='check'?`<span class="tag t-warn">🔎 ${ar(T('Check in the system: did he come back?'))}</span>`:''}
    <div class="acts"><button class="wa" data-wa="${r.key}">WhatsApp</button><button data-sent="${r.key}">${ar(T(s[r.key]?'Undo':'Mark sent'))}</button></div></div>`).join('')||`<div class="empty">${ar(T('All reminders sent.'))} 👌</div>`}</div>`;
  p.querySelectorAll('[data-rf]').forEach(b=>b.onclick=()=>{O.rf=b.dataset.rf;render();});
  p.querySelectorAll('[data-sent]').forEach(b=>b.onclick=()=>{const x=sent();x[b.dataset.sent]=!x[b.dataset.sent];store.set('opssent',x);render();});
  p.querySelectorAll('[data-wa]').forEach(b=>b.onclick=()=>{const r=D.reminders.find(x=>x.key===b.dataset.wa);const msg='السلام عليكم،\nوفقاً لسجلاتنا قد يكون حان موعد تغيير زيت المحرك لسيارتكم '+r.car+'.\nوفي حال أُجريت الخدمة لدينا مؤخراً فنعتذر عن هذا التذكير.\n\nورشة عالم الخدمات السريعة';if(navigator.clipboard)navigator.clipboard.writeText(msg).catch(()=>{});toast(T('Demo: message copied.'));});
}
function pStock(p){
  const rows=D.stock.slice().sort((a,b)=>a.days-b.days);
  p.innerHTML=sec(T('Stock by burn rate'),ar(T('red = under 14 days')))+`<div class="ops-list">${rows.map(r=>{const c=r.days<=14?'var(--bad)':r.days<=30?'var(--warn)':'var(--ok)';const pct=Math.max(4,Math.min(100,r.days/120*100));return `<div class="nh-row"><b>${esc(r.n)}</b><span class="r">${r.q}${r.u==='L'?' L':''}<small>${r.wk}${r.u==='L'?' L':''}${T('/wk')}</small></span><span class="m">${ar(T('lasts'))} ${r.days} ${ar(T('days'))}${r.days<=14?' · <span class="tag t-bad">'+ar(T('Order'))+'</span>':''}</span><div class="nh-bar"><i style="width:${pct}%;background:${c}"></i></div></div>`;}).join('')}</div>`;
}
function pOrders(p){
  const od=ord();
  p.innerHTML=sec(T('Suggested orders'),'⭐ '+ar(T('cheapest supplier')))+`<div class="ops-list">${D.orders.map((o,i)=>{const tot=o.items.reduce((a,x)=>a+(od[o.vendor+'|'+x.n]??x.q)*x.p,0);return `<div class="ops-card${od['sent|'+o.vendor]?' off':''}"><div class="h"><b>${esc(o.vendor)}</b><span>${o.items.length} ${ar(T('items'))}</span></div>
    ${o.items.map(x=>{const k=o.vendor+'|'+x.n;const q=od[k]??x.q;return `<div class="oi"><i class="${q>0?'on':''}" data-tg="${k}"></i><div><b>${esc(x.n)}${x.pref?' ⭐':''}</b><span>${f3(x.p)} ${ar(T('each'))}</span></div><div class="st"><button data-q="${k}|-1">−</button><em>${q}</em><button data-q="${k}|1">+</button></div></div>`;}).join('')}
    <div class="tot"><span>${ar(T('Order total (cost)'))}</span><b>${f3(tot)} OMR</b></div>
    <div class="acts"><button data-msg="${i}">${ar(T('Copy message'))}</button><button class="ok" data-os="${o.vendor}">${ar(T(od['sent|'+o.vendor]?'Ordered':'Mark ordered'))}${od['sent|'+o.vendor]?' ✓':''}</button></div></div>`;}).join('')}</div>`;
  p.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const [v,n,dd]=b.dataset.q.split('|');const k=v+'|'+n;const o=ord();const x=D.orders.find(z=>z.vendor===v).items.find(z=>z.n===n);o[k]=Math.max(0,(o[k]??x.q)+(+dd));store.set('opsord',o);render();});
  p.querySelectorAll('[data-tg]').forEach(b=>b.onclick=()=>{const k=b.dataset.tg;const o=ord();const [v,n]=k.split('|');const x=D.orders.find(z=>z.vendor===v).items.find(z=>z.n===n);o[k]=(o[k]??x.q)>0?0:x.q;store.set('opsord',o);render();});
  p.querySelectorAll('[data-os]').forEach(b=>b.onclick=()=>{const o=ord();o['sent|'+b.dataset.os]=!o['sent|'+b.dataset.os];store.set('opsord',o);render();});
  p.querySelectorAll('[data-msg]').forEach(b=>b.onclick=()=>{const o=D.orders[+b.dataset.msg];const od2=ord();const t='السلام عليكم، نرجو توفير:\n'+o.items.filter(x=>(od2[o.vendor+'|'+x.n]??x.q)>0).map(x=>'• '+x.n+' × '+(od2[o.vendor+'|'+x.n]??x.q)).join('\n')+'\n\nورشة عالم الخدمات السريعة · 9470 2061';if(navigator.clipboard)navigator.clipboard.writeText(t).catch(()=>{});toast(T('Order message copied'));});
}
function chartSvg(vals,vals2){const mx=Math.max(...vals)*1.15;let b='';vals.forEach((v,i)=>{const x=20+i*47;const bh=v/mx*140;b+=`<rect x="${x}" y="${160-bh}" width="18" height="${bh}" rx="4" fill="#ee3a39" opacity=".85"/>`;if(vals2){const ph=vals2[i]/mx*140;b+=`<rect x="${x+20}" y="${160-ph}" width="12" height="${ph}" rx="4" fill="#f27b21"/>`;}});return `<svg viewBox="0 0 600 180">${b}<line x1="10" y1="160" x2="590" y2="160" stroke="#2a2a2e"/></svg>`;}
function pMoney(p){
  const m=D.money;
  p.innerHTML=`<div class="ops-two"><div>${sec(T('Open invoices'),`OMR ${f3(m.due)} · ${m.over30} ${ar(T('older than 30 days'))}`)}
  <div class="ops-card pad0">${m.open.slice().sort((a,b)=>b.age-a.age).map(o=>`<div class="mrow"><div><b>${esc(o.client)}</b><span>#${o.no} · ${esc(o.car)}</span></div><div class="v">${f3(o.amt)}<small style="${o.age>30?'color:var(--bad)':''}">${o.age} ${ar(T('days'))}</small></div></div>`).join('')}</div></div>
  <div>${sec(T('Who owes the most'))}<div class="ops-list">${m.debtors.map(([n,v])=>`<div class="nh-row"><b>${esc(n)}</b><span class="r">${f3(v)}<small>OMR</small></span><span class="m">${Math.round(v/m.due*100)}% ${ar(T('of what is due'))}</span><div class="nh-bar"><i style="width:${Math.round(v/m.due*100)}%;background:var(--orange)"></i></div></div>`).join('')}</div></div></div>`;
}
function pPerf(p){
  const w=D.perf.weeks;const pr=w.map(v=>Math.round(v*0.41));
  p.innerHTML=`<div class="ops-card">${sec(T('Sales & profit · 12 weeks'),`<i class="sw" style="background:#ee3a39"></i>${ar(T('Sales'))} &nbsp; <i class="sw" style="background:#f27b21"></i>${ar(T('Profit'))}`)}${chartSvg(w,pr)}</div>
  <div class="ops-two"><div>${sec(T('This week, day by day'))}<div class="ops-card pad0 tbl"><div class="r h"><span>${ar(T('Day'))}</span><span>${ar(T('Invoices'))}</span><span>${ar(T('Sales'))}</span><span>${ar(T('Profit'))}</span></div>${D.perf.days.map(d=>`<div class="r"><span>${ar(T(d[0]))}</span><span>${d[1]}</span><span>${f3(d[2])}</span><span>${f3(d[3])}</span></div>`).join('')}</div></div>
  <div>${sec(T('Top services this week'))}<div class="ops-list">${D.perf.top.map(([n,c])=>`<div class="nh-row"><b>${esc(n)}</b><span class="r">${c}<small>${ar(T('jobs'))}</small></span><span class="m"></span><div class="nh-bar"><i style="width:${Math.round(c/D.perf.top[0][1]*100)}%;background:var(--red)"></i></div></div>`).join('')}</div></div></div>`;
}
function pCount(p){
  const c=cnt();
  p.innerHTML=sec(T('Daily count')+' · '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}),`${Object.keys(c).length}/${D.count.length}`)+`<p class="hint">${ar(T('Count the shelf first, then type the number. The system figure shows after you save.'))}</p>
  <div class="ops-list">${D.count.map((it,i)=>`<div class="ops-card cnt${c[it.n]!=null?' done':''}"><b>${esc(it.n)}</b><span class="sub">${esc(it.en)}</span>${c[it.n]!=null?`<span class="sub" style="color:var(--ok)">${ar(T('Counted'))}: <b>${c[it.n]}</b> · ${ar(T('system: — (with live data)'))}</span>`:`<div class="row"><input inputmode="decimal" placeholder="${T('How many on the shelf?')}" id="oc${i}"><button data-c="${i}">${ar(T('Save'))}</button></div>`}</div>`).join('')}</div>
  <button class="btn ghost sm" id="occlr">${ar(T('Reset today (demo)'))}</button>`;
  p.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const i=+b.dataset.c;const v=$('#oc'+i).value.trim();if(!v)return;const x=cnt();x[D.count[i].n]=v;store.set('opscount',x);render();});
  $('#occlr').onclick=()=>{store.set('opscount',{});render();};
}
function pAI(p){
  const hist=store.get('opsai',[]);
  p.innerHTML=`<div class="ops-card ai">${sec(T('Ask the workshop AI'),ar(T('demo answers')))}
    <div class="q">${['Top 3 things today','Who owes the most?','Order message for Mannol'].map(q=>`<button data-ask="${esc(q)}">${ar(T(q))}</button>`).join('')}</div>
    <div class="bubs">${hist.map(h=>`<div class="bub${h.me?' me':''}">${esc(h.t)}</div>`).join('')}</div>
    <form id="opsAsk"><input id="opsAskI" placeholder="${T("Ask about today's data…")}" autocomplete="off"><button type="submit">${ar(T('Ask'))}</button></form>
    <p class="hint">${ar(T('The real version answers from the night report. It needs an AI key (small cost per question).'))}</p></div>`;
  const ask=q=>{const h=store.get('opsai',[]);h.push({me:1,t:q});const a=/top|first|today|أهم|اليوم/i.test(q)?'1) Order G11 coolant and Toyota 0W-20 (both under 2 weeks).\n2) Collect invoice #313 from Alsharqiya University (41 days).\n3) Send 4 oil reminders that are ready.':/owe|debt|فلوس/i.test(q)?'Alyazeedi family OMR 486.200 (52%), Alsharqiya University 142.500, Al Riyami 86.000.':/order|mannol|مانول|طلب/i.test(q)?'السلام عليكم، نرجو توفير: G11 ×8، DOT-4 ×10، 0W-16 5L ×4. ورشة عالم الخدمات السريعة':'Demo answer. The live version reads the night report and answers from it.';h.push({t:a});store.set('opsai',h.slice(-8));render();};
  p.querySelectorAll('[data-ask]').forEach(s=>s.onclick=()=>ask(s.dataset.ask));
  $('#opsAsk').onsubmit=e=>{e.preventDefault();const v=$('#opsAskI').value.trim();if(v)ask(v);};
}
window.FSW_SEC={ops:renderOps};
};
