/* ---------- WHAT'S NEW + guided tours (Arabic text, layout stays LTR) ---------- */
const NEWS=[
 {v:'1.4.0',ic:'🎉',t:'شرح الجديد داخل البرنامج',d:'بعد كل تحديث يطلع لك وش الجديد، وزر «وريني» ياخذك لمكان كل ميزة ويشرحها خطوة خطوة.',tour:[
  {go:'more',sel:'[data-go="news"]',t:'🎉 من هنا تفتح <b>What\'s new</b> في أي وقت، وتعيد الشرح لأي نسخة.'},
  {t:'بعد كل تحديث، أول ما يدخل المالك يطلع له وش الجديد. اضغط <b>Next</b> و<b>Back</b> للتنقل، و<b>Skip</b> للخروج.'}]},
 {v:'1.3.0',ic:'🛢',t:'أدوات المخزون العشر',d:'سجل حركة القطعة، الباركود، السعر من التكلفة، سعر كل مورد، البدائل، تناسب السيارات، القطع الراكدة، قيمة المخزون، الاستلام الجزئي، ومكان القطعة.',tour:[
  {go:'stock',sel:'[data-go="stocktools"]',t:'من هنا تفتح <b>Stock tools</b>: تشغّل أو تطفي كل أداة، وتحدد نسبة الربح لكل تصنيف.'},
  {go:'stocktools',sel:'[data-sx="moves"]',up:'.lrow',t:'كل أداة لها زر. لو طفيتها تختفي بس، وما تنمسح بياناتها.'},
  {go:'stocktools',sel:'[data-mu]',up:'.lrow',t:'اكتب نسبة الربح لكل تصنيف (مثلاً 50). البرنامج يقترح سعر البيع من التكلفة.'},
  {go:'stock',sel:'#pscan',t:'📷 صوّر باركود القطعة وتطلع لك مباشرة. لو ما لها قطعة يسألك تسويها جديدة.'},
  {go:'stock',sel:'[data-go="slow"]',t:'🐢 القطع اللي ما انباعت من مدة، وكم فلوس واقفة فيها.'},
  {go:'stock',sel:'[data-go="stockval"]',t:'💰 قيمة المخزون بالتكلفة وبسعر البيع، حسب التصنيف.'},
  {go:'stock',open:()=>partSheet(),sel:'#psug,#pco',t:'لما تكتب <b>التكلفة</b> يطلع زر يقترح سعر البيع حسب نسبة الربح.'},
  {go:'stock',open:()=>partSheet(),sel:'#ploc',t:'📍 مكان القطعة في الورشة (رف A3). يطلع في أمر العمل والجرد.'},
  {go:'stock',open:()=>partSheet(),sel:'#pfit',t:'🚗 اكتب السيارات اللي تركب عليها. في أمر عمل لنفس السيارة تطلع القطعة فوق مع كلمة <b>fits</b>.'},
  {go:'stock',open:()=>partSheet(),sel:'#paltadd',t:'🔁 اربط القطعة ببديلها. لو خلصت، يقترح البديل الموجود في أمر العمل.'},
  {go:'stock',open:()=>partSheet(),sel:'#pvp',t:'🚚 سعر كل مورد. يتسجل بروحه لما تستلم طلب، ويقولك مين أرخص.'},
  {go:'vendors',sel:'[data-go^="po:"],#poadd',t:'📦 في طلب المورد اضغط <b>Received</b> واكتب كم وصل فعلاً. الباقي يظل مفتوح.'},
  {t:'📜 افتح أي قطعة في المخزون وانزل تحت: تلقى <b>History</b> فيه كل دخول وخروج للقطعة، ومين سواه.'}]},
 {v:'1.2.0',ic:'💬',t:'طلبات الموردين، الرسائل، الصلاحيات',d:'قطعة جديدة من داخل الطلب، كتابة الكمية بالكيبورد، تعديل رسائل الواتساب، وصلاحيات كل موظف.',tour:[
  {go:'vendors',sel:'#poadd,[data-go^="po:"]',t:'افتح طلب مورد. في قائمة <b>Add a part</b> فيه خيار <b>✏️ New part</b>: تسوي القطعة وتنضاف للطلب مباشرة.'},
  {go:'vendors',sel:'#poadd,[data-go^="po:"]',t:'الكمية في الطلب تكتبها بالكيبورد. اضغط على الرقم واكتب.'},
  {go:'msgs',sel:'[data-mk="ready"]',t:'💬 هنا تعدّل نص كل رسالة واتساب. الكلمات بين { } يعبيها البرنامج، وتشوف معاينة قبل الحفظ.'},
  {go:'users',sel:'[data-ue]',t:'👥 افتح أي موظف وشغّل أو طفّ كل صلاحية. اللي تطفيه يختفي من شاشته كلها.'}]},
 {v:'1.1.0',ic:'🗂',t:'القوائم والخدمات',d:'تعديل كل القوائم من داخل التطبيق، أقسام الخدمات، السعر حسب حجم السيارة، خدمة في ورشة ثانية، والتحديث التلقائي.',tour:[
  {go:'lists',sel:'[data-go="list:scat"]',t:'🗂 <b>Lists</b>: كل قوائم البرنامج. تضيف وتغيّر الاسم وترتب بالأسهم وتحذف.'},
  {go:'lists',sel:'#lnew',t:'＋ تسوي قائمة خاصة فيك، مثل الورش الشريكة أو العدد.'},
  {go:'svc',sel:'.chips',t:'الخدمات مقسمة حسب الأقسام. تضغط القسم عشان تشوف خدماته بس.'},
  {go:'svc',open:()=>svcSheet(DB.services[0]),sel:'.szg',t:'السعر لكل حجم سيارة. في أمر العمل تختار الحجم والسعر يتغير.'},
  {go:'svc',open:()=>svcSheet(DB.services[0]),sel:'#smin',t:'⏱ مدة الشغل: تطلع كاقتراح لوقت التسليم. وجنبها الضمان اللي يطلع في الفاتورة.'},
  {go:'svc',open:()=>svcSheet(DB.services[0]),sel:'.obox',t:'🏪 خدمة تنعمل في ورشة ثانية: تختار ما تنحسب عندك، أو تاخذ نسبة، أو تدفع لهم.'},
  {go:'money',sel:'[data-go="outw"]',t:'🏪 هنا تشوف كم عليك لكل ورشة ثانية، وتسجّل لما تدفع لهم.'},
  {go:'more',sel:'#verh',t:'رقم النسخة هنا. البرنامج يتحدث بروحه لما يكون فيه نت.'}]}];
const vnum=s=>(s||'0').split('.').reduce((a,x)=>a*1000+(+x||0),0);
function newsUnseen(){const seen=vnum(DB.seenNews||'0');return NEWS.filter(n=>vnum(n.v)>seen&&vnum(n.v)<=vnum(window.WS_VN||'9.9.9'));}
SCREENS.news=m=>{const un=new Set(newsUnseen().map(n=>n.v));
  m.innerHTML=head('What\'s new')+`<p class="hint ar" dir="rtl">اضغط <b>وريني</b> والبرنامج ياخذك لكل شي جديد خطوة خطوة.</p>
  ${NEWS.map(n=>`<div class="card news${un.has(n.v)?' nw':''}"><div class="h"><b>${n.ic} <span dir="rtl">${n.t}</span></b><span>${n.v}${un.has(n.v)?' · <b style="color:var(--red2)">NEW</b>':''}</span></div><span class="sub ar" dir="rtl">${n.d}</span><button class="btn sm" data-tour="${n.v}">▶ وريني · Show me (${n.tour.length})</button></div>`).join('')}`;
  $$('[data-tour]').forEach(b=>b.onclick=()=>startTour(NEWS.find(n=>n.v===b.dataset.tour)));};
function markNewsSeen(){DB.seenNews=window.WS_VN||NEWS[0].v;save();}
function showNewsPrompt(){const un=newsUnseen();if(!un.length||!S.user||S.user.role!=='owner'&&!perm('settings'))return;
  openSheet(`<h3>🎉 New in version ${esc(window.WS_VN||un[0].v)}</h3>${un.map(n=>`<div class="card"><b dir="rtl" class="ar">${n.ic} ${n.t}</b><span class="sub ar" dir="rtl">${n.d}</span></div>`).join('')}<button class="btn" id="nwgo">▶ وريني وين · Show me</button><button class="btn ghost" id="nwl">Later</button>`,el=>{
    el.querySelector('#nwgo').onclick=()=>{markNewsSeen();closeSheet();startTour(un[un.length-1]&&un.length===1?un[0]:{tour:un.slice().reverse().flatMap(n=>n.tour)});};
    el.querySelector('#nwl').onclick=()=>{markNewsSeen();closeSheet();toast('Find it any time: More → What\'s new');};});}
/* tour runner */
let TOUR=null;
function startTour(n){if(!n)return;markNewsSeen();const steps=n.tour.filter(s=>!s.go||routeOk(s.go));TOUR={steps,i:0};runStep();}
function endTour(){TOUR=null;const o=$('#tour');if(o)o.remove();closeSheet();}
function runStep(){if(!TOUR)return;const s=TOUR.steps[TOUR.i];if(!s){endTour();go('news');toast('Done ✓');return;}
  closeSheet();if(s.go&&S.r!==s.go)go(s.go);else if(s.go)render();
  if(s.open)try{s.open();}catch(e){}
  setTimeout(()=>{let el=null;if(s.sel)for(const q of s.sel.split(',')){const c=document.querySelector((s.open?'#sheet ':'')+q.trim())||document.querySelector(q.trim());if(c&&c.offsetParent!==null){el=c;break;}}
    if(el&&s.up&&el.closest(s.up))el=el.closest(s.up);
    if(el)el.scrollIntoView({block:'center',behavior:'instant'});
    setTimeout(()=>drawTour(s,el),120);},180);}
function drawTour(s,el){let o=$('#tour');if(!o){o=document.createElement('div');o.id='tour';document.body.appendChild(o);}
  const n=TOUR.steps.length,i=TOUR.i;const r=el?el.getBoundingClientRect():null;const pad=6;
  const hole=r?`<div class="th" style="left:${r.left-pad}px;top:${r.top-pad}px;width:${r.width+pad*2}px;height:${r.height+pad*2}px"></div>`:'<div class="th none"></div>';
  const below=r?(r.bottom+170<innerHeight):true;const top=r?(below?r.bottom+14:Math.max(10,r.top-14)):innerHeight/2;
  o.innerHTML=hole+`<div class="tb ${r?(below?'dn':'upb'):'mid'}" style="${r?(below?'top:'+top+'px':'bottom:'+(innerHeight-top)+'px'):''}"><div class="tt" dir="rtl">${s.t}${s.sel&&!el?'<br><small style="opacity:.7">(هذا الجزء مو ظاهر الحين، ممكن تحتاج تضيف بيانات أول)</small>':''}</div>
    <div class="tn"><button id="tsk">Skip</button><span>${i+1} / ${n}</span>${i?'<button id="tpv">‹ Back</button>':''}<button id="tnx" class="go">${i===n-1?'Done ✓':'Next ›'}</button></div></div>`;
  o.querySelector('#tsk').onclick=endTour;o.querySelector('#tnx').onclick=()=>{TOUR.i++;runStep();};const pv=o.querySelector('#tpv');if(pv)pv.onclick=()=>{TOUR.i--;runStep();};}
window.addEventListener('resize',()=>{if(TOUR)runStep();});
