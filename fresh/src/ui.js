/* ---------- state + shell ---------- */
const S={user:null,r:'home',p:{},sheet:null,q:''};
const AUTO={
 profile:()=>DB.ws&&DB.ws.name&&DB.ws.phone,logo:()=>DB.ws&&DB.ws.logo,cur:()=>!!DB.ws,vat:()=>DB.ws&&DB.ws.vatDecided,invno:()=>DB.ws&&DB.ws.invStart,warranty:()=>DB.ws&&DB.ws.warranty,
 pay:()=>DB.ws&&DB.ws.pay&&DB.ws.pay.length,cred:()=>DB.ws&&DB.ws.credDays,owner:()=>DB.users.some(u=>u.role==='owner'),manager:()=>DB.users.some(u=>u.role==='manager'),worker:()=>DB.users.some(u=>u.role==='worker'),
 remind:()=>DB.ws&&DB.ws.remMonths,remmsg:()=>DB.ws&&(DB.ws.remMsg||(DB.ws.msgs&&DB.ws.msgs.remind)),backup:()=>DB.backups>=1,backup2:()=>DB.backups>=2,
 svc:()=>DB.ws&&DB.ws.svcReviewed,svcadd:()=>DB.services.some(s=>s.custom),pcat:()=>DB.pcats.length>0,oils:()=>DB.parts.some(p=>p.cat==='Engine oil'),filters:()=>DB.parts.some(p=>p.cat==='Oil filters'),
 pprice:()=>DB.parts.length&&DB.parts.every(p=>+p.price>0),pcost:()=>DB.parts.length&&DB.parts.every(p=>+p.cost>0),reorder:()=>DB.parts.some(p=>+p.reorder>0),vendors:()=>DB.vendors.length,po:()=>DB.pos.length,porec:()=>DB.pos.some(p=>p.status==='received'),
 canned:()=>DB.canned.length,insp:()=>DB.insp.length,expcat:()=>DB.ecats.length,exp:()=>DB.expenses.length,
 cust5:()=>DB.customers.length>=5,job1:()=>DB.jobs.length,est2job:()=>DB.jobs.some(j=>j.fromEst),inv1:()=>DB.jobs.some(isInvoiced),
 pay3:()=>new Set(DB.jobs.flatMap(j=>(j.pays||[]).map(p=>p.m))).size>=3,ret:()=>DB.jobs.some(j=>j.returned),outside:()=>DB.jobs.some(j=>(j.items||[]).some(i=>i.outside)),
 rem1:()=>DB.reminders.length,close1:()=>DB.closes.length,count1:()=>DB.counts.length
};
const stepKey=(w,i)=>w+'-'+i;
function stepDone(w,i,auto){if(DB.steps[stepKey(w,i)])return true;return !!(auto&&AUTO[auto]&&AUTO[auto]());}
function stepsProgress(){let d=0,t=0;STEPS.forEach(([w,,list])=>list.forEach(([,a],i)=>{t++;if(stepDone(w,i,a))d++;}));return [d,t];}

const NAV=[['home','i-home','Home'],['work','i-wrench','Work'],['cust','i-car','Customers'],['more','i-gear','More']];
const navOf=r=>({home:'home',search:'home',work:'work',job:'work',newjob:'work',inv:'work',cust:'cust',custd:'cust'}[r]||'more');
/* screens with no fixed parent (quick price, debts, checks…) go back to where they were opened from */
let GO_BACK=false;
function go(r,p){S.orig=S.orig||{};if(GO_BACK)delete S.orig[S.r];else if(r!==S.r&&S.r)S.orig[r]={r:S.r,p:S.p};S.selJ=null;S.sel=null;if(r!=='newjob')S.pendQuote=null;try{closeQs();}catch(e){}S.r=r;S.p=p||{};S.sheet=null;closeSheet();if(!window.CapApp)try{history.pushState({r},'');}catch(e){}render();scrollTo(0,0);}
function back(){const parent={job:'work',newjob:'work',inv:'job',custd:'cust',part:'stock',po:'vendors',search:'home',list:'lists',menu:'lists',lists:'more',outw:'money',msgs:'more',audit:'more',news:'more',slow:'stock',stockval:'stock',stocktools:'stock'}[S.r];if(S.sheet){closeSheet();return true;}
  if(S.r==='inv'){go('job',{id:S.p.id});return true;}
  if(S.r==='stock'&&S.p.low){go('stock');return true;}
  if(parent){go(parent);return true;}const o=(S.orig||{})[S.r];if(o&&o.r&&o.r!==S.r&&routeOk(o.r)){GO_BACK=true;try{go(o.r,o.p);}finally{GO_BACK=false;}return true;}if(S.r!=='home'){go(NAV.some(n=>n[0]===S.r)?'home':'more');return true;}return false;}
window.addEventListener('popstate',()=>{if(!back())try{history.pushState({},'');}catch(e){}});

function logoImg(cls){return DB.ws&&DB.ws.logo?`<img class="${cls}" src="${DB.ws.logo}" alt="">`:`<span class="${cls} wsmark">${esc(initials(DB.ws?DB.ws.name:'W'))}</span>`;}
function render(){
  try{lookApply();langApply();}catch(e){}
  if(!DB.ws){renderOnboard();return;}
  if(!S.user){renderLogin();return;}
  ensureLists();
  const T={quote:'Quick price',checks:'Invoice checks',debts:'Debts',home:DB.ws.name,work:'Work',job:'Job',newjob:'New car in',inv:'Invoice',cust:'Customers',custd:'Customer',stock:'Stock',part:'Part',vendors:'Suppliers',po:'Supplier order',svc:'Services',money:'Money',exp:'Expenses',close:'Daily close',count:'Daily count',reports:'Reports',setup:'Setup · 100 steps',settings:'Settings',users:'Users',more:'More',insp:'Inspections',canned:'Canned jobs',search:'Search',lists:'Lists',list:'Lists',menu:'More menu',outw:'Other workshops',msgs:'Messages',audit:'Activity log',news:'What\'s new',slow:'Slow parts',stockval:'Stock value',stocktools:'Stock tools'};
  const nb=NAV.filter(n=>routeOk(n[0])).map(([k,i,l])=>`<button class="navb" data-nav="${k}" ${navOf(S.r)===k?'aria-current="page"':''}><svg><use href="#${i}"/></svg>${l}</button>`).join('');
  $('#root').innerHTML=`<div class="shell">
   <header class="top">${logoImg('em')}<span class="t">${esc(T[S.r]||'')}</span><div class="me"><span>${new Date().toLocaleDateString('en-GB',{weekday:'short',timeZone:'Asia/Muscat'})}<br>${fmtDs(now())}</span><span class="av me" style="background:${S.user.color}">${initials(S.user.name)}</span></div></header>
   <nav class="rail">${logoImg('em')}${nb}<span class="av me" style="background:${S.user.color}" data-logout title="Log out">${initials(S.user.name)}</span></nav>
   <main id="main"></main>
   <nav class="bottom"><div class="in">${nb}</div></nav></div>`;
  $$('[data-nav]').forEach(b=>b.onclick=()=>go(b.dataset.nav));
  $$('[data-logout]').forEach(b=>b.onclick=()=>{S.user=null;render();});
  const m=$('#main');
  if(!routeOk(S.r)){toast('Not allowed for '+S.user.name);S.r='home';}
  (SCREENS[S.r]||SCREENS.home)(m);
  m.querySelectorAll('[data-go]').forEach(b=>{if(!routeOk(b.dataset.go.split(':')[0]))b.remove();});
  m.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const [r,id]=b.dataset.go.split(':');go(r,id?{id}:{});});
  m.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>back());
  try{motionAfterRender(m);}catch(e){}
  try{attachPress(m);}catch(e){}
}
/* search boxes: hide rows that do not match instead of drawing the screen again (drawing again resets the phone keyboard) */
function liveFilter(inp,sel,after){if(!inp)return;const run=()=>{const q=inp.value.trim().toLowerCase();S.p.q=inp.value;
  document.querySelectorAll(sel).forEach(r=>{const t=((r.dataset.s||'')+' '+r.textContent).toLowerCase();r.hidden=!!q&&!t.includes(q);});if(after)after(q);};
  inp.oninput=run;run();}
const head=(t,right='')=>`<div class="nh-head"><button class="nh-bk" data-back aria-label="Back">‹</button><b>${t}</b>${right?`<span class="hr">${right}</span>`:''}</div>`;
const sec=(t,r='')=>`<div class="ops-sec"><b>${t}</b><span>${r}</span></div>`;
const empty=(ic,t)=>`<div class="empty"><span style="font-size:2rem">${ic}</span><span>${t}</span></div>`;

/* ---------- sheets ---------- */
function openSheet(html,bind){const isNew=!$('#sheet');let el=$('#sheet');if(!el){el=document.createElement('div');el.id='sheet';el.className='sheet';document.body.appendChild(el);}
  el.innerHTML=`<div class="pnl">${html}<button class="btn ghost" data-close>Close</button></div>`;el.onclick=e=>{if(e.target===el)closeSheet();};
  el.querySelector('[data-close]').onclick=closeSheet;S.sheet=true;document.documentElement.classList.add('sheet-open');if(bind)bind(el);if(isNew)try{motionSheetIn(el);}catch(e){}}
function closeSheet(){const el=$('#sheet');if(el){try{motionSheetOut(el);}catch(e){}el.remove();}S.sheet=null;document.documentElement.classList.remove('sheet-open');}
function confirmSheet(msg,yes,onYes){openSheet(`<h3>${msg}</h3><button class="btn" id="cfy">${yes}</button>`,el=>el.querySelector('#cfy').onclick=()=>{closeSheet();onYes();});}

/* ---------- onboarding (first run) ---------- */
const OB={step:0,name:'',phone:'',addr:'',owner:'',pin:'',pin1:''};
function renderOnboard(){
  const st=OB;let body='';
  if(st.step===0)body=`<div class="brandline" data-notr>${window.SF_LOGO||"ShopFlo"}</div><div class="ob-hero"><span class="wsmark big">＋</span><h2>New workshop</h2><p>Set up in 2 minutes. You can change everything later.</p></div>
    <input class="field" id="obn" placeholder="Workshop name" value="${esc(st.name)}" autocomplete="off">
    <input class="field" id="obp" placeholder="Workshop phone" inputmode="tel" value="${esc(st.phone)}">
    <input class="field" id="oba" placeholder="Area / city (optional)" value="${esc(st.addr)}">
    <button class="btn" id="obnext">Next</button>
    ${typeof syncReady==='function'&&fbCfg()?`<div class="ob-or"><span>or</span></div><button class="btn ghost" id="objoin">☁️ I already have a workshop · Sign in</button><p class="hint ob-hint">For a second phone or tablet: sign in with the workshop account and everything comes from the online copy.</p>`:''}
    <div class="chips ob-lang" id="oblang" data-notr><button data-l="en" aria-pressed="${I18N.lang!=='ar'}">English</button><button data-l="ar" aria-pressed="${I18N.lang==='ar'}">العربية</button></div>`;
  else if(st.step===1)body=`<h2>Owner name</h2><p>This is you. You add workers later.</p><input class="field" id="obo" placeholder="Your name" value="${esc(st.owner)}" autocomplete="off"><button class="btn" id="obnext">Next</button>`;
  else body=`<h2>${st.step===2?'Choose your PIN (4 numbers)':'Enter the PIN again'}</h2>${dots(st.pin.length)}${pad()}<div class="err" id="err"></div>`;
  $('#root').innerHTML=`<div class="login"><div class="in">${body}</div></div>`;
  if(st.step===0){$$('#oblang [data-l]').forEach(b=>b.onclick=()=>{try{localStorage.setItem('ws_lang',b.dataset.l);}catch(e){}langApply();renderOnboard();});
    const jn=$('#objoin');if(jn)jn.onclick=joinSheet;
    $('#obnext').onclick=()=>{st.name=$('#obn').value.trim();st.phone=$('#obp').value.trim();st.addr=$('#oba').value.trim();if(!st.name){toast('Type the workshop name');return;}st.step=1;renderOnboard();};return;}
  if(st.step===1){$('#obnext').onclick=()=>{st.owner=$('#obo').value.trim()||'Owner';st.step=2;renderOnboard();};return;}
  bindPad(async k=>{
    if(k==='⌫')st.pin=st.pin.slice(0,-1);else if(st.pin.length<4)st.pin+=k;
    if(st.pin.length===4){
      if(st.step===2){st.pin1=st.pin;st.pin='';st.step=3;renderOnboard();return;}
      if(st.pin!==st.pin1){st.pin='';st.step=2;renderOnboard();$('#err').textContent='PINs did not match. Try again.';return;}
      DB.ws={name:st.name,phone:st.phone,addr:st.addr,logo:'',currency:'OMR',invStart:1001,nextInv:1001,nextJob:1,credDays:30,warranty:'',pay:['Cash','Card','Transfer','Credit'],vat:false,vatDecided:false,lang:(I18N.lang==='ar'?'ar':'en'),remMonths:6,remKm:7000,remMsg:'',svcReviewed:false,created:now()};
      DB.services=DEFAULT_SERVICES.map(([cat,name,a,b,tag])=>({id:uid('s'),cat,name,p:[a,b],tag:tag||''}));
      const u={id:uid('u'),name:st.owner,role:'owner',pin:await hashPin(st.pin),color:COLORS[0]};DB.users=[u];save();S.user=u;DB.seenNews=window.WS_VN||'';save();render();setTimeout(()=>showNewsPrompt(true),400);return;}
    renderOnboard();
  });
}
function pad(){return `<div class="pad">${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k=>k===''?'<span></span>':`<button class="key${k==='⌫'?' ghost':''}" data-k="${k}">${k}</button>`).join('')}</div>`;}
function dots(n){return `<div class="dots">${[0,1,2,3].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</div>`;}
function bindPad(f){$$('.pad button').forEach(b=>b.onclick=()=>f(b.dataset.k));}

/* ---------- login ---------- */
let pick=null,pinBuf='';
const PINLOCK={n:0,until:0};
function renderLogin(){
  const us=DB.users;if(us.length===1&&!pick)pick=us[0].id;
  $('#root').innerHTML=`<div class="login"><div class="in"><div class="brandline" data-notr>${window.SF_LOGO||"ShopFlo"}</div>${DB.ws.logo?`<img class="logo" src="${DB.ws.logo}" alt="">`:`<div class="ob-hero"><span class="wsmark big">${esc(initials(DB.ws.name))}</span><h2 style="font:400 1.5rem var(--f-brand)">${esc(DB.ws.name)}</h2></div>`}
   <h2>Who is working today?</h2>
   <div class="people">${us.map(u=>`<button class="person${pick===u.id?' sel':''}" data-u="${u.id}"><span class="av" style="${pick===u.id?'':'background:'+u.color}">${initials(u.name)}</span>${esc(u.name)}<small>${ROLE[u.role]}</small></button>`).join('')}</div>
   ${pick?dots(pinBuf.length)+pad():'<p>Tap your name</p>'}<div class="err" id="err"></div></div></div>`;
  $$('.person').forEach(b=>b.onclick=()=>{pick=b.dataset.u;pinBuf='';renderLogin();});
  bindPad(async k=>{if(k==='⌫')pinBuf=pinBuf.slice(0,-1);else if(pinBuf.length<4)pinBuf+=k;
    if(pinBuf.length===4){if(PINLOCK.until>Date.now()){pinBuf='';renderLogin();$('#err').textContent=T_('Too many wrong PINs. Wait '+Math.ceil((PINLOCK.until-Date.now())/1000)+' seconds.');return;}const u=DB.users.find(x=>x.id===pick);const h=await hashPin(pinBuf);pinBuf='';if(u&&u.pin===h){PINLOCK.n=0;S.user=u;audit('login','Logged in');save();S.r='home';render();setTimeout(showNewsPrompt,500);return;}{const S0=S.user;S.user={name:(u&&u.name)||'?'};audit('fail','Wrong PIN for '+((u&&u.name)||'?'));S.user=S0;save();PINLOCK.n++;if(PINLOCK.n>=5){PINLOCK.n=0;PINLOCK.until=Date.now()+30000;}}renderLogin();$('#err').textContent='Wrong PIN. Try again.';try{motionShake(document.querySelector('.dots'));}catch(e){}return;}
    renderLogin();});
}
