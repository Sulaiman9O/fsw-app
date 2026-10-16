const lastJob=()=>{const j=DB.jobs.slice().sort((a,b)=>b.t-a.t)[0];return j?['job',{id:j.id}]:null;};
const lastInv=()=>{const j=DB.jobs.filter(isInvoiced).sort((a,b)=>b.inv.t-a.inv.t)[0];return j?['inv',{id:j.id}]:null;};
/* ---------- WHAT'S NEW + guided tours (Arabic text, layout stays LTR) ---------- */
const NEWS=[
 {v:'1.7.0',ic:'✨',t:'الخدمات الذكية',d:'تغيير الزيت يعرض الخيارات جنب بعض مع الفلتر المناسب والأجرة والكيلومتر الجاي. نفس الشي للبواجي والفحمات والبطارية وزيت القير والرديتر. البرنامج يتعلم كمية الزيت لكل محرك.',tour:[
  {go:lastJob,sel:'#jadd',t:'✨ في الشغلة اضغط <b>Add service or part</b> واختر <b>Engine oil change</b>: تطلع لك الخيارات جنب بعض.',alt:'سوّ شغلة جديدة وأضف تغيير زيت عشان تشوف الخيارات.'},
  {t:'كل خيار فيه: الزيت × اللترات، والفلتر اللي يناسب السيارة، والأجرة، والكيلومتر الجاي (عادي 5,000، نص صناعي 7,000، صناعي 10,000). الكرت الأخضر هو اختيار الزبون المرة الماضية.'},
  {t:'📤 زر <b>Send options</b> يرسل الخيارات للزبون بالواتساب، ويرد برقم الخيار.'},
  {go:'stock',open:()=>partSheet({cat:'Engine oil',unit:'L'},null,true),sel:'#pgr',t:'🛢 حدد نوع كل زيت هنا (أغلبها يتعرف بروحه من الاسم).'},
  {go:'stocktools',sel:'[data-sx="smart"]',up:'.lrow',t:'لو ما عجبتك، طفّها من هنا وترجع الإضافة العادية.'}]},
 {v:'1.6.0',ic:'🚗',t:'قاعدة بيانات السيارات والمحركات',d:'68 ماركة وأكثر من 2000 موديل، ومحركات أشهر السيارات في الخليج. تكتب toy تطلع تويوتا، وسياراتك الأكثر استخداماً تطلع فوق.',tour:[
  {go:'newjob',sel:'#ncp',t:'🚗 اضغط هنا واكتب أول حروف الماركة (toy أو تويوتا). بعدها تختار الموديل، والسنة، والمحرك.'},
  {go:'newjob',sel:'#ncp',t:'⚙️ المحركات تتفلتر حسب السنة. لو المحرك مو موجود، اكتبه مرة وحدة ويتحفظ لنفس الموديل.'},
  {t:'⭐ الماركات والموديلات والمحركات اللي تستخدمها كثير تطلع أول القائمة بروحها.'},
  {go:'stock',sel:'#padd',t:'💡 في القطعة، خانة «Fits these cars» تقبل رمز المحرك بعد (مثل 2AR-FE)، فالفلتر يطلع «fits» لأي سيارة فيها نفس المحرك.'}]},
 {v:'1.5.0',ic:'🧪',t:'بيانات تجريبية',d:'5 زبائن وهميين مع سياراتهم، 3 موردين، 15 قطعة بأسعار وهمية، وشغلات وفواتير للتجربة. كلها عليها 🧪 وتنحذف بضغطة.',tour:[
  {go:'settings',sel:'#sdemo,#sdemox',t:'🧪 من هنا تضيف البيانات التجريبية أو تحذفها. كل اسم عليه 🧪 يعني وهمي.'},
  {go:'home',sel:'.demob',t:'طول ما البيانات التجريبية موجودة، يطلع هذا الشريط فوق عشان ما تنساها. زر <b>Remove</b> يحذفها كلها وبياناتك الحقيقية تبقى.'}]},
 {v:'1.4.1',ic:'📘',t:'شرح التطبيق كامل',d:'تختار: الجديد بس، أو شرح التطبيق كامل من البداية، أو جزء واحد منه.',tour:[
  {go:'news',sel:'.card.news.full',t:'📘 هنا الشرح الكامل. تقدر تشغّله كله، أو تختار جزء واحد من الأزرار تحت.'}]},
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
  <div class="card news full"><div class="h"><b>📘 <span dir="rtl">شرح التطبيق كامل</span></b><span>${FULL.reduce((a,c)=>a+c.steps.length,0)} steps</span></div><span class="sub ar" dir="rtl">من البداية: الرئيسية، السيارة الجديدة، الشغلة، الفاتورة، العملاء، المخزون، الفلوس، والإعدادات. أو اختر جزء بس.</span>
   <button class="btn sm" id="tfull">▶ الشرح كامل · Full tour</button><div class="chips">${FULL.map((c,i)=>`<button data-ch="${i}">${c.ic} <span dir="rtl">${c.t}</span></button>`).join('')}</div></div>
  ${sec('New in each version')}
  ${NEWS.map(n=>`<div class="card news${un.has(n.v)?' nw':''}"><div class="h"><b>${n.ic} <span dir="rtl">${n.t}</span></b><span>${n.v}${un.has(n.v)?' · <b style="color:var(--red2)">NEW</b>':''}</span></div><span class="sub ar" dir="rtl">${n.d}</span><button class="btn sm" data-tour="${n.v}">▶ وريني · Show me (${n.tour.length})</button></div>`).join('')}`;
  $$('[data-tour]').forEach(b=>b.onclick=()=>startTour(NEWS.find(n=>n.v===b.dataset.tour)));
  $('#tfull').onclick=()=>startFull();$$('[data-ch]').forEach(b=>b.onclick=()=>startFull([FULL[+b.dataset.ch]]));};
function markNewsSeen(){DB.seenNews=window.WS_VN||NEWS[0].v;save();}
function showNewsPrompt(first){const un=newsUnseen();if(!S.user||!(S.user.role==='owner'||perm('settings')))return;if(!first&&!un.length)return;
  openSheet(`<h3>${first?'👋 Welcome':'🎉 New in version '+esc(window.WS_VN||un[0].v)}</h3>
   <p class="ar" dir="rtl" style="margin:0;line-height:1.6">${first?'تبي البرنامج يوريك وين كل شي وكيف تستخدمه؟':'وش تبي البرنامج يشرح لك؟'}</p>
   <div class="pick2">${first?'':`<button class="pk" id="nwnew"><span>🎉</span><b dir="rtl">الجديد بس</b><small>New things only · ${un.reduce((a,n)=>a+n.tour.length,0)} steps</small></button>`}
    <button class="pk" id="nwfull"><span>📘</span><b dir="rtl">شرح التطبيق كامل</b><small>Whole app · ${FULL.reduce((a,c)=>a+c.steps.length,0)} steps</small></button></div>
   ${first?'':`<div class="field-l">What's new</div>`+un.map(n=>`<div class="card"><b dir="rtl" class="ar">${n.ic} ${n.t}</b><span class="sub ar" dir="rtl">${n.d}</span></div>`).join('')}
   ${!hasDemo()?`<button class="btn ghost" id="nwdemo">🧪 Add test data to try the app</button>`:''}
   <button class="btn ghost" id="nwl">Later</button>`,el=>{const dm=el.querySelector('#nwdemo');if(dm)dm.onclick=()=>{loadDemo();dm.remove();};
    const n1=el.querySelector('#nwnew');if(n1)n1.onclick=()=>{closeSheet();startTour({tour:un.slice().reverse().flatMap(n=>n.tour)});};
    el.querySelector('#nwfull').onclick=()=>{closeSheet();startFull();};
    el.querySelector('#nwl').onclick=()=>{markNewsSeen();closeSheet();toast('Find it any time: More → What\'s new');};});}
/* tour runner */
let TOUR=null;
function startTour(n){if(!n)return;markNewsSeen();const steps=n.tour.filter(s=>{if(typeof s.go==='function'){const t=s.go();return t?routeOk(t[0]):!!s.alt;}return !s.go||routeOk(s.go);});TOUR={steps,i:0};runStep();}
function endTour(){TOUR=null;const o=$('#tour');if(o)o.remove();closeSheet();}
function runStep(){if(!TOUR)return;const s=TOUR.steps[TOUR.i];if(!s){endTour();go('news');toast('Done ✓');return;}
  closeSheet();let tgt=typeof s.go==='function'?s.go():s.go?[s.go,{}]:null;if(typeof s.go==='function'&&!tgt){drawTour({t:s.alt||s.t},null);return;}
  if(tgt&&(S.r!==tgt[0]||JSON.stringify(S.p)!==JSON.stringify(tgt[1])))go(tgt[0],tgt[1]);else if(tgt)render();
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
/* ---------- full app tour, by chapter ---------- */
const FULL=[
 {ic:'🏠',t:'الرئيسية',steps:[
  {go:'home',sel:'[data-go="search"]',t:'🔎 ابحث عن أي سيارة أو عميل: برقم اللوحة أو الهاتف أو الاسم أو رقم الشغلة.'},
  {go:'home',sel:'.bigbtn',t:'🚗 أهم زر: <b>New car in</b>. كل سيارة تدخل الورشة تبدأ من هنا.'},
  {go:'home',sel:'.setupbar',t:'✅ خطوات تجهيز الورشة المئة. كمّلها بالتدريج، وبعضها ينصح بروحه.'},
  {go:'home',sel:'.kpis3',t:'أرقام سريعة: كم فلوس لك عند الزبائن، وكم قطعة تحتاج تطلبها، وكم تذكير مستحق.'},
  {go:'home',sel:'div.grp',t:'الأقسام الأربعة: الشغل، العملاء، المخزون، الفلوس. تحت كل قسم ملخص.'},
  {go:'home',sel:'.bottom .navb[data-nav="more"],.rail .navb[data-nav="more"]',t:'☰ <b>More</b>: كل باقي البرنامج: الخدمات، الموردين، التقارير، الإعدادات، والشرح.'}]},
 {ic:'🚗',t:'سيارة جديدة',steps:[
  {go:'newjob',sel:'#nphone',t:'اكتب رقم الزبون. لو موجود قبل، البرنامج يعرفه ويطلع سياراته.'},
  {go:'newjob',sel:'#nplate,#nmake',t:'اكتب اللوحة والماركة والموديل والكيلومتر.'},
  {go:'newjob',sel:'#nest',up:'label',t:'لو الزبون يبي سعر بس قبل الشغل، اختر <b>Estimate only</b> (تقدير سعر).'},
  {go:'newjob',sel:'#ngo',t:'اضغط وتنفتح الشغلة.'}]},
 {ic:'🔧',t:'الشغلة (أمر العمل)',steps:[
  {go:lastJob,sel:'.jb-steps',t:'مراحل الشغلة: جديدة ← قيد العمل ← جاهزة ← مسلّمة.',alt:'افتح أي شغلة تشوف هذا. سوّ سيارة جديدة أول.'},
  {go:lastJob,sel:'#jnext',t:'الزر الأخضر ينقلك للمرحلة الجاية. أول مرة يسألك كم بتاخذ وقت.'},
  {go:lastJob,sel:'#jadd',t:'＋ أضف خدمة أو قطعة. تختار حجم السيارة، والخدمات اللي تستخدمها كثير تطلع فوق.'},
  {go:lastJob,sel:'#jdisc',t:'الخصم: بمبلغ أو نسبة (للمالك والمدير).'},
  {go:lastJob,sel:'#jinsp',t:'📋 الفحص: أخضر وأصفر وأحمر لكل بند.'},
  {go:lastJob,sel:'#jsendest,#jinv',t:'أرسل التقدير بالواتساب، أو سوّ الفاتورة. الفاتورة تنقص القطع من المخزون.'},
  {go:lastJob,sel:'#jstk',t:'🏷 ستيكر الزيت: زيت المكينة أو زيت القير، مع الكيلومتر الجاي.'}]},
 {ic:'🧾',t:'الفاتورة والدفع',steps:[
  {go:lastInv,sel:'[data-pay]',t:'اختر طريقة الدفع واكتب المبلغ. تقدر تدفع على دفعات.',alt:'لما تسوي أول فاتورة تشوف هذا الجزء.'},
  {go:lastInv,sel:'#iwa',t:'أرسل الفاتورة بالواتساب، أو اطبعها.'},
  {go:lastInv,sel:'#iret',t:'إرجاع الفاتورة يرجّع القطع للمخزون (للمالك).'}]},
 {ic:'👥',t:'العملاء والتذكيرات',steps:[
  {go:'cust',sel:'.ops-sec',t:'🔔 فوق التذكيرات المستحقة: زيت المكينة وزيت القير. ترسلها بالواتساب بضغطة.'},
  {go:'cust',sel:'#main .field',t:'ابحث عن أي عميل وافتح ملفه: سياراته وزياراته وكم عليه.'}]},
 {ic:'🛢',t:'المخزون والموردين',steps:[
  {go:'stock',sel:'#padd',t:'＋ أضف قطعة: الاسم والرقم والتصنيف والسعر والتكلفة والكمية.'},
  {go:'stock',sel:'#plow',t:'القطع اللي وصلت لحد الطلب. من هنا تسوي طلب مورد بضغطة.'},
  {go:'stock',sel:'[data-go="count"]',t:'📦 الجرد اليومي: البرنامج يختار 5 قطع كل يوم تعدّها.'},
  {go:'vendors',sel:'#vadd',t:'🚚 أضف الموردين، وسوّ لهم طلبات وأرسلها بالواتساب.'}]},
 {ic:'💰',t:'الفلوس',steps:[
  {go:'money',sel:'.kpis2',t:'كم فلوس عند الزبائن، ومبيعات آخر 7 أيام.'},
  {go:'money',sel:'[data-go="close"]',t:'🔒 إغلاق اليوم: تعدّ الكاش في الدرج والبرنامج يقارنه بالمتوقع.'},
  {go:'money',sel:'[data-go="exp"]',t:'🧾 المصاريف: إيجار ورواتب وكهرباء وغيرها.'},
  {go:'money',sel:'[data-go="reports"]',t:'📊 التقارير: المبيعات والربح وأكثر الخدمات والقطع.'}]},
 {ic:'⚙️',t:'التخصيص والإعدادات',steps:[
  {go:'more',sel:'[data-go="lists"]',t:'🗂 القوائم: الأقسام والتصنيفات والأحجام وطرق الدفع وقوائمك.'},
  {go:'more',sel:'[data-go="msgs"]',t:'💬 نص رسائل الواتساب.'},
  {go:'more',sel:'[data-go="users"]',t:'👥 الموظفين وصلاحية كل واحد.'},
  {go:'settings',sel:'#sbk',t:'⬇️ مهم: النسخة الاحتياطية. البيانات في هذا الجهاز بس، فخذ نسخة كل أسبوع.'},
  {go:'more',sel:'[data-go="news"]',t:'🎉 والشرح هذا كله تلقاه هنا في أي وقت.'}]}];
function startFull(chs){startTour({tour:(chs||FULL).flatMap(c=>c.steps)});}
