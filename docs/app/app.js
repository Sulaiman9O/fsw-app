window.FSW_APP_NAME="1.0.4";
(function(){
"use strict";
const BASE=window.FSW_BASE||'https://raw.githubusercontent.com/Sulaiman9O/fsw-app/main/docs/';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f3=n=>(Math.round(n*1000)/1000).toFixed(3);
const nrm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const store={get(k,d){try{const v=localStorage.getItem('fsw_'+k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem('fsw_'+k,JSON.stringify(v));}catch(e){}}};

document.body.insertAdjacentHTML('beforeend',"<svg width=\"0\" height=\"0\" style=\"position:absolute\" aria-hidden=\"true\">\n  <symbol id=\"i-calc\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"2\"/><path d=\"M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0\"/></symbol>\n  <symbol id=\"i-bell\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M6 16V11a6 6 0 0 1 12 0v5l2 2H4z\"/><path d=\"M10 21h4\"/></symbol>\n  <symbol id=\"i-list\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M9 6h11M9 12h11M9 18h11\"/><circle cx=\"4.5\" cy=\"6\" r=\"1\"/><circle cx=\"4.5\" cy=\"12\" r=\"1\"/><circle cx=\"4.5\" cy=\"18\" r=\"1\"/></symbol>\n  <symbol id=\"i-gear\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1\"/></symbol>\n  <symbol id=\"i-filter\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"6\" y=\"4\" width=\"12\" height=\"16\" rx=\"3\"/><path d=\"M6 8h12M9 4v16M12 4v16M15 4v16\"/></symbol>\n  <symbol id=\"i-wrench\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z\"/></symbol>\n  <symbol id=\"i-drop\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z\"/></symbol>\n  <symbol id=\"i-check\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M9 4h6v3H9z\"/><rect x=\"5\" y=\"5\" width=\"14\" height=\"16\" rx=\"2\"/><path d=\"M9 13l2 2 4-4\"/></symbol>\n  <symbol id=\"i-air\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7\"/></symbol>\n  <symbol id=\"i-gearbox\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M6 4v16M12 4v16M18 4v8H6\"/></symbol>\n  <symbol id=\"i-brake\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M4 12a8 8 0 0 1 4-7\"/></symbol>\n  <symbol id=\"i-plug\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M12 2v4M9 6h6v5H9zM10 11v6l2 3 2-3v-6\"/></symbol>\n  <symbol id=\"i-belt\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"7\" cy=\"12\" r=\"4\"/><circle cx=\"18\" cy=\"8\" r=\"3\"/><path d=\"M7 8l11-3M7 16l11-5\"/></symbol>\n  <symbol id=\"i-send\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"><path d=\"M21 3L3 10.5l7 2.5 2.5 7z\"/><path d=\"M10 13l11-10\"/></symbol>\n  <symbol id=\"i-can\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"><path d=\"M7 5h7l3 3v12H7z\"/><path d=\"M14 5V3h-4v2M10 12h4\"/></symbol>\n  <symbol id=\"i-car\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"><path d=\"M3 15l2-6h14l2 6v4H3z\"/><circle cx=\"7.5\" cy=\"16.5\" r=\"1\"/><circle cx=\"16.5\" cy=\"16.5\" r=\"1\"/></symbol>\n</svg>"+'<div id="root"></div><div class="toast" id="toast" hidden></div>');
const bootEl=document.getElementById('boot');if(bootEl)bootEl.remove();

/* ---------- users: stored on this device only ---------- */
const COLORS=['#ee3a39','#2563c9','#2e9d3a','#c98a00','#5a45c4','#0f8f8a'];
async function hashPin(pin){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('fsw:'+pin));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}catch(e){return 'p:'+pin;}}
const users=()=>store.get('users',[]);
const saveUsers=u=>store.set('users',u);

/* ---------- extra services ---------- */
const EXTRAS=[{id:'insp',name:'Maintenance check',ar:'فحص الصيانة',icon:'i-check',price:{0:5,1:5}}];
const LOGOS=()=>store.get('logos',{});
const VCOL={'0W-16':'--v016','0W-20':'--v020','5W-30':'--v530','5W-40':'--v540','10W-40':'--v1040','20W-50':'--v2050','15W-40':'--v1540'};
const vc=v=>'var('+(VCOL[v]||'--vx')+')';
const MONO={Toyota:'#c8102e',Lexus:'#1f2937',Nissan:'#4b5563',Honda:'#b91c1c',Chevrolet:'#b8860b',GMC:'#9f1239',Ford:'#1e40af',Hyundai:'#0c4a6e',Kia:'#334155',Mazda:'#374151',Mitsubishi:'#dc2626',Subaru:'#1d4ed8',BYD:'#0f766e','Mercedes-Benz':'#111827',MG:'#7f1d1d',Jeep:'#3f6212',RAM:'#18181b',Infiniti:'#44403c',Genesis:'#292524',Suzuki:'#1e3a8a'};

/* ---------- data: saved copy, bundled copy, then online ---------- */
let D=null,SPECS={},GROUPS=[],CARS={};
const TR=[[/ستة سلندر/g,'6-cyl'],[/أربع سلندر/g,'4-cyl'],[/تيربو هايبرد/g,'Turbo Hybrid'],[/هايبرد/g,'Hybrid'],[/تيربو/g,'Turbo'],[/ديزل/g,'Diesel'],[/بنزين/g,'Petrol'],[/إيكوبوست/g,'EcoBoost'],[/قبل/g,'before'],[/وبعد/g,'+']];
const en=s=>TR.reduce((a,[r,t])=>a.replace(r,t),String(s)).replace(/\s{2,}/g,' ').trim();
const bk=s=>{let b=(String(s).toLowerCase().replace(/[^a-z ]/g,' ').trim().split(/\s+/)[0])||'';if(b==='senfinco')b='senfineco';if(b==='can'||b==='canroyal')b='canroyal';if(b==='ac')b='acdelco';return b;};
const tc=s=>s.length<=3?s.toUpperCase():s.replace(/(^|[\s-])\w/g,c=>c.toUpperCase());
const MK_FIX={chevloret:'Chevrolet',chevorlet:'Chevrolet','general motors':'Chevrolet',mercedes:'Mercedes-Benz',kia:'Kia',gmc:'GMC',byd:'BYD',mg:'MG',ram:'RAM'};
const MD_FIX={'lexus|570':'LX 570','lexus|600':'LX 600','byd|seal ev':'Seal','byd|qin':'Qin Plus','nissan|xterra':'X-Terra','ford|mustang gt':'Mustang','toyota|land cruiser 200 series':'Land Cruiser 200','toyota|camry gle':'Camry'};
function useData(d){
  D=d;SPECS=d.specs||{};GROUPS=d.groups||[];CARS={};
  const add=(mk,md)=>{const k=mk+'|'+md;return CARS[k]||(CARS[k]={mk,md,n:0,suv:0,suvN:0,rows:[],oil:{},fil:{},eng:[]});};
  for(const c of D.cars||[]){
    let mk=MK_FIX[c[0].toLowerCase()]||tc(c[0]);let md=c[1];
    if(/^(uzj|clyn)|^(lexus|truck|460|es 460)$/i.test(md)||mk==='Sedan')continue;
    md=MD_FIX[(mk+'|'+md).toLowerCase()]||md;
    const e=add(mk,md);e.n+=c[2];e.suv+=c[3]*c[2];e.suvN+=c[2];e.rows.push(...c[4]);
    (c[5]||[]).forEach(([k,n])=>e.oil[k]=(e.oil[k]||0)+n);(c[6]||[]).forEach(([k,n])=>e.fil[k]=(e.fil[k]||0)+n);
  }
  for(const [mk,models] of Object.entries(SPECS))for(const [md,engs] of Object.entries(models)){
    const ex=Object.values(CARS).find(x=>x.mk.toLowerCase()===mk.toLowerCase()&&x.md.toLowerCase()===md.toLowerCase());
    (ex||add(mk,md)).eng=engs;
  }
}
async function loadData(){
  let saved=store.get('data',null),bundled=null;
  try{bundled=await fetch('data/prices.json',{cache:'no-store'}).then(r=>r.json());}catch(e){}
  const pick=[saved,bundled].filter(Boolean).sort((a,b)=>new Date(b.asof)-new Date(a.asof))[0];
  if(pick)useData(pick);
}
async function syncData(force){
  const last=store.get('lastCheck',0);
  if(!force&&Date.now()-last<3*3600e3)return false;
  try{
    const d=await fetch(BASE+'data/prices.json?t='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw 0;return r.json();});
    store.set('lastCheck',Date.now());
    if(!D||new Date(d.asof)>new Date(D.asof)){store.set('data',d);useData(d);return true;}
    return 'same';
  }catch(e){return null;}
}

/* ---------- state ---------- */
const S={user:null,tab:'quote',make:null,model:null,year:null,eng:null,visc:null,picked:new Set(),labOn:true,suv:0,fi:null,L:null,extras:new Set(),own:false,disc:0,discMode:'amt',sheet:null};
const isAdmin=()=>S.user&&S.user.role==='admin';
const car=()=>S.make&&S.model?CARS[S.make+'|'+S.model]:null;

/* ---------- calculation ---------- */
const prettyOil=d=>d.replace(/\b(Motor|Engine)\s+Oil\b/ig,'').replace(/\b\d+\s*l(trs?)?\b/ig,'').replace(/\(.*?\)/g,'').replace(/\b(F\/S|S\/S|S\/L)\b/g,'').replace(/\b\d{4,}(\/\d{4,})?\b/g,'').replace(/\s{2,}/g,' ').trim();
const filterName=f=>f[0].replace(/Oil Filter/i,'').replace(/\s{2,}/g,' ').trim();
function findFilter(code){if(!code)return -1;const c=nrm(code);let i=D.filters.findIndex(f=>f[1]===c);if(i<0)i=D.filters.findIndex(f=>nrm(f[0]).includes(c)||(c.length>6&&c.includes(f[1])));return i;}
function enginesFor(c){if(!c||!c.eng.length)return [];const y=S.year;return y?c.eng.filter(e=>y>=e[1]&&y<=e[2]):c.eng;}
function histRow(c,L){let rows=c.rows.filter(r=>r[1]>=2.5);if(L)rows=rows.filter(r=>Math.abs(r[1]-L)<=0.8).concat(rows.filter(r=>Math.abs(r[1]-L)>0.8).map(r=>[...r,'far']));const y=S.year||0;const yd=r=>r[0]?Math.abs(r[0]-y):99;rows.sort((a,b)=>(a[4]==='far')-(b[4]==='far')||(y?yd(a)-yd(b):b[0]-a[0]));return rows[0]||null;}
function filterRanks(c,recCode){const rec=findFilter(recCode);const ok=new Set();Object.keys(c.fil).forEach(k=>{const i=findFilter(k);if(i>=0)ok.add(i);});if(rec>=0){const code=D.filters[rec][1];GROUPS.forEach(g=>{if(g.includes(code))g.forEach(x=>{const i=findFilter(x);if(i>=0)ok.add(i);});});}ok.delete(rec);return {rec,ok};}
const stockViscs=()=>[...new Set(D.oils.map(o=>o[1]).filter(Boolean))].sort((a,b)=>parseInt(a)-parseInt(b)||a.localeCompare(b));
function defaultVisc(c,eng){const vs=stockViscs();if(eng&&eng[5]&&vs.includes(eng[4]))return eng[4];const t={};Object.entries(c.oil).forEach(([k,n])=>{const v=k.split('|')[1];if(vs.includes(v))t[v]=(t[v]||0)+n;});const top=Object.entries(t).sort((a,b)=>b[1]-a[1])[0];if(top)return top[0];if(eng&&vs.includes(eng[4]))return eng[4];return '5W-30';}
function scenario(){
  const c=car();if(!c)return null;const engs=enginesFor(c);
  const eng=engs.length===1?engs[0]:(S.eng!=null&&engs[S.eng]?engs[S.eng]:null);
  const hr=histRow(c,eng?eng[3]:0);
  const fr=filterRanks(c,hr?hr[3]:'');
  const L=S.L||(eng?eng[3]:(hr?hr[1]:0));
  const fi=S.fi!=null?S.fi:fr.rec;
  const visc=S.visc||defaultVisc(c,eng);
  return {c,eng,hr,fr,L,fi,visc};
}
function extrasTotal(){let t=0;S.extras.forEach(id=>{const e=EXTRAS.find(x=>x.id===id);if(e)t+=e.price[S.suv]||0;});return t;}
function lineFor(sc,o,i){
  const oilCost=S.own?0:sc.L*o[2];
  const f=sc.fi>=0?D.filters[sc.fi]:null;const fp=f?f[2]:0;
  const lab=S.labOn?D.lab[S.suv]:0;const ex=extrasTotal();
  const sub=oilCost+fp+lab+ex;
  const disc=S.disc?(S.discMode==='pct'?sub*S.disc/100:Math.min(S.disc,sub)):0;
  const total=Math.max(0,sub-disc);
  const used=sc.c.oil[bk(o[0])+'|'+o[1]]||0;
  return {i,o,name:prettyOil(o[0]),visc:o[1],per:o[2],stock:o[3],rank:o[4]==null?99:o[4],oil:oilCost,fp,lab,ex,disc,total,used};
}
function oilList(sc){
  const rows=D.oils.map((o,i)=>[o,i]).filter(([o])=>o[1]===sc.visc).map(([o,i])=>lineFor(sc,o,i));
  if(!rows.length)return rows;
  const inStock=rows.filter(r=>r.stock>=sc.L);
  const best=(inStock.length?inStock:rows).reduce((a,b)=>b.rank<a.rank?b:a);
  const rest=rows.filter(r=>r!==best).sort((a,b)=>(b.stock>0)-(a.stock>0)||b.used-a.used||a.total-b.total);
  best.top=true;const mu=rest.find(r=>r.used>0);if(mu)mu.mostUsed=true;else if(best.used>0)best.mostUsed=true;
  return [best,...rest];
}

/* ---------- pin pad ---------- */
function pad(){return `<div class="pad">${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k=>k===''?'<span></span>':`<button data-k="${k}" aria-label="${k==='⌫'?'Delete':k}">${k}</button>`).join('')}</div>`;}
function dots(n){return `<div class="dots">${[0,1,2,3].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</div>`;}
function bindPad(onDigit){document.querySelectorAll('.pad button').forEach(b=>b.onclick=()=>onDigit(b.dataset.k));}

/* ---------- first start: create owner ---------- */
let setup={step:'name',name:'Sulaiman',pin:'',pin1:''};
function renderSetup(){
  const st=setup;
  let body='';
  if(st.step==='name')body=`<p>Welcome. Set up this device.</p><p style="opacity:1;font-weight:700">Owner name</p><input class="field" id="oname" value="${esc(st.name)}" autocomplete="off"><button class="btn" id="next" style="width:100%">Next</button>`;
  else body=`<p style="opacity:1;font-weight:700">${st.step==='pin'?'Choose owner PIN (4 numbers)':'Enter the PIN again'}</p>${dots(st.pin.length)}${pad()}<div class="err" id="err"></div>`;
  $('#root').innerHTML=`<div class="login"><div class="in"><div class="logo"><i></i>FSW</div>${body}</div></div>`;
  if(st.step==='name'){$('#next').onclick=()=>{st.name=$('#oname').value.trim()||'Owner';st.step='pin';renderSetup();};return;}
  bindPad(async k=>{
    if(k==='⌫')st.pin=st.pin.slice(0,-1);else if(st.pin.length<4)st.pin+=k;
    if(st.pin.length===4){
      if(st.step==='pin'){st.pin1=st.pin;st.pin='';st.step='pin2';renderSetup();return;}
      if(st.pin!==st.pin1){st.pin='';st.step='pin';renderSetup();$('#err').textContent='PINs did not match. Try again.';return;}
      const u={id:'owner',name:st.name,role:'admin',pin:await hashPin(st.pin),color:COLORS[0]};
      saveUsers([u]);S.user=u;store.set('user',u.id);render();return;
    }
    renderSetup();
  });
}

/* ---------- login ---------- */
let pinBuf='',pickUser=null;
function initials(n){const p=String(n).trim().split(/\s+/);return esc((p[0]||'?')[0]+(p[1]?p[1][0]:''));}
function renderLogin(){
  const us=users();
  if(!us.length){renderSetup();return;}
  if(us.length===1&&!pickUser)pickUser=us[0].id;
  $('#root').innerHTML=`<div class="login"><div class="in">
    <div class="logo"><i></i>FSW</div>
    <p>Fast Service World · Ibra</p>
    <div class="people">${us.map(u=>`<button class="person${pickUser===u.id?' sel':''}" data-u="${u.id}"><span class="avatar" style="background:${u.color}">${initials(u.name)}</span>${esc(u.name)}<small>${u.role==='admin'?'Owner':'Staff'}</small></button>`).join('')}</div>
    ${pickUser?dots(pinBuf.length)+pad():'<p>Tap your name</p>'}
    <div class="err" id="err"></div>
  </div></div>`;
  document.querySelectorAll('.person').forEach(b=>b.onclick=()=>{pickUser=b.dataset.u;pinBuf='';renderLogin();});
  bindPad(async k=>{
    if(k==='⌫')pinBuf=pinBuf.slice(0,-1);else if(pinBuf.length<4)pinBuf+=k;
    if(pinBuf.length===4){const u=users().find(x=>x.id===pickUser);const h=await hashPin(pinBuf);pinBuf='';
      if(u&&u.pin===h){S.user=u;store.set('user',u.id);render();return;}
      renderLogin();$('#err').textContent='Wrong PIN. Try again.';return;}
    renderLogin();
  });
}

/* ---------- app shell ---------- */
function render(){
  if(!S.user){renderLogin();return;}
  if(!D){$('#root').innerHTML='<div class="empty" style="padding-top:80px">No prices on this device yet. Connect to the internet and open the app again.</div>';return;}
  const dt=new Date(D.asof);
  const when=dt.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'Asia/Muscat'});
  $('#root').innerHTML=`<div class="shell">
    <header class="top"><div class="logo"><i></i>FSW</div>
      <div class="who"><div class="sync">Prices<br><span class="num">${when}</span></div><span class="avatar" style="background:${S.user.color}">${initials(S.user.name)}</span></div></header>
    <main id="main"></main>
    ${S.tab==='quote'?'<div class="paybar" id="paybar"></div>':''}
    <nav class="bottom"><div class="in">
      ${[['quote','i-calc','Oil price'],['rem','i-bell','Reminders'],['hist','i-list','History'],['set','i-gear','Settings']].map(([k,ic,l])=>`<button data-tab="${k}" ${S.tab===k?'aria-current="page"':''}><svg><use href="#${ic}"/></svg>${l}${k==='rem'?'<span class="soon">SOON</span>':''}</button>`).join('')}
    </div></nav></div>`;
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;render();});
  ({quote:renderQuote,rem:renderRem,hist:renderHist,set:renderSet})[S.tab]();
  if(S.sheet)renderSheet();
}
function tile(html,attrs,cls){return `<button class="tile ${cls||''}" ${attrs}>${html}</button>`;}
function renderQuote(){
  const m=$('#main');const c=car();
  const crumbs=S.make?`<div class="crumbs"><button class="crumb" data-clr="make">${esc(S.make)} <span>✕</span></button>${S.model?`<button class="crumb" data-clr="model">${esc(S.model)} <span>✕</span></button>`:''}${S.year!=null?`<button class="crumb" data-clr="year"><span class="num">${S.year||'Year ?'}</span> <span>✕</span></button>`:''}</div>`:'';
  let h='';
  if(!S.make){
    const mk={};Object.values(CARS).forEach(x=>mk[x.mk]=(mk[x.mk]||0)+x.n);const lg=LOGOS();
    h=`<h2><span class="n">1</span>Car make</h2><div class="grid">${Object.entries(mk).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([k])=>tile((lg[k]?`<img src="${lg[k]}" alt="" style="width:44px;height:44px;object-fit:contain">`:`<span class="mono" style="background:${MONO[k]||'#444'}">${esc(k.replace('Mercedes-Benz','MB').slice(0,3).toUpperCase())}</span>`)+esc(k),`data-mk="${esc(k)}"`)).join('')}</div>`;
  } else if(!S.model){
    h=crumbs+`<h2><span class="n">2</span>Model</h2><div class="grid">${Object.values(CARS).filter(x=>x.mk===S.make).sort((a,b)=>b.n-a.n||a.md.localeCompare(b.md)).map(x=>tile(`<svg width="26" height="26" style="opacity:.55"><use href="#i-car"/></svg>${esc(x.md)}`,`data-md="${esc(x.md)}"`)).join('')}</div>`;
  } else if(S.year==null){
    const ys=new Set(c.rows.map(r=>r[0]).filter(Boolean));
    let yb='';for(let y=new Date().getFullYear()+1;y>=1995;y--)yb+=tile(String(y),`data-yr="${y}"`,'y'+(ys.has(y)?' hist':''));
    h=crumbs+`<h2><span class="n">3</span>Year</h2><div class="grid years">${tile('Don’t know','data-yr="0"','wide')}${yb}</div><p style="margin:0;color:var(--muted);font-size:.85rem">Red dot = this year was serviced here before.</p>`;
  } else {
    const engs=enginesFor(c);
    if(engs.length>=2&&S.eng==null){
      h=crumbs+`<h2><span class="n">4</span>Engine</h2><div class="grid" style="grid-template-columns:1fr 1fr">${engs.map((e,i)=>tile(`${esc(en(e[0]))}<small class="num">${e[3]} L · ${e[4]}</small>`,`data-en="${i}"`)).join('')}</div>`;
    } else { m.innerHTML=crumbs+quoteBody();bindQuote();bindCrumbs();renderPay();return; }
  }
  m.innerHTML=h;bindCrumbs();
  m.querySelectorAll('[data-mk]').forEach(b=>b.onclick=()=>{S.make=b.dataset.mk;render();scrollTo(0,0);});
  m.querySelectorAll('[data-md]').forEach(b=>b.onclick=()=>{S.model=b.dataset.md;const cc=car();S.suv=cc.suvN&&cc.suv*2>=cc.suvN?1:0;render();scrollTo(0,0);});
  m.querySelectorAll('[data-yr]').forEach(b=>b.onclick=()=>{S.year=+b.dataset.yr;S.eng=null;resetQuote();render();scrollTo(0,0);});
  m.querySelectorAll('[data-en]').forEach(b=>b.onclick=()=>{S.eng=+b.dataset.en;resetQuote();render();scrollTo(0,0);});
}
function bindCrumbs(){document.querySelectorAll('[data-clr]').forEach(b=>b.onclick=()=>{const k=b.dataset.clr;if(k==='make'){S.make=null;S.model=null;S.year=null;}if(k==='model'){S.model=null;S.year=null;}if(k==='year'){S.year=null;}S.eng=null;resetQuote();S.extras.clear();S.disc=0;S.own=false;S.labOn=true;render();});}
function resetQuote(){S.visc=null;S.picked.clear();S.fi=null;S.L=null;}
function quoteBody(){
  const sc=scenario();
  if(!sc.L)return `<div class="empty"><svg><use href="#i-drop"/></svg>No oil quantity known for this car. Set litres below.</div>`+settingsCard(sc);
  const list=oilList(sc);
  if(!S.picked.size&&list.length)S.picked.add(list[0].i);
  const engRec=sc.eng?sc.eng[4]:null;
  const notes=[];
  if(sc.eng&&sc.eng[5])notes.push('Maker allows '+sc.eng[4]+' only for this engine.');
  if(sc.fi<0)notes.push('Oil filter not known. Pick it below.');
  if(!sc.eng&&sc.c.n<3)notes.push('Little history for this model. Check the litres.');
  return `
  ${sc.eng?`<div style="color:var(--muted);font-weight:600">Engine: ${esc(en(sc.eng[0]))}</div>`:''}
  <div class="vchips">${stockViscs().map(v=>`<button class="vchip${v===sc.visc?' sel':''}" style="--vc:${vc(v)}" data-v="${v}">${v}${v===engRec?' <span class="rec">✓</span>':''}</button>`).join('')}</div>
  ${notes.map(n=>`<div class="note">⚠ ${esc(n)}</div>`).join('')}
  <div style="display:grid;gap:10px">${list.length?list.map(x=>oilCard(x,sc)).join(''):`<div class="empty"><svg><use href="#i-can"/></svg>No ${sc.visc} oil in stock.</div>`}</div>
  ${settingsCard(sc)}
  <h2>Add service</h2>
  <div class="extras">${EXTRAS.map(e=>`<button class="ex${S.extras.has(e.id)?' sel':''}" data-ex="${e.id}"><svg><use href="#${e.icon}"/></svg><div><b>${esc(e.name)}</b><span class="num">+${f3(e.price[S.suv])}</span></div></button>`).join('')}</div>
  ${isAdmin()?`<h2>Discount <span class="tag t-red">Owner only</span></h2>
  <div class="card"><div class="seg" style="justify-self:start"><button data-dm="amt" aria-pressed="${S.discMode==='amt'}">OMR</button><button data-dm="pct" aria-pressed="${S.discMode==='pct'}">%</button></div>
  <div class="disc">${(S.discMode==='amt'?[0,0.5,1,2,3]:[0,5,10,15,20]).map(d=>`<button data-d="${d}" aria-pressed="${S.disc===d}">${d?(S.discMode==='amt'?'−'+f3(d):'−'+d+'%'):'None'}</button>`).join('')}</div></div>`:''}`;
}
function oilCard(x,sc){
  const low=x.stock<=0?'<span class="tag t-bad">Out of stock</span>':(x.stock<sc.L?`<span class="tag t-warn">Only ${x.stock} L left</span>`:`<span class="tag t-mute">${Math.round(x.stock)} L in stock</span>`);
  return `<button class="oil${S.picked.has(x.i)?' sel':''}" style="--vc:${vc(x.visc)}" data-oil="${x.i}" aria-pressed="${S.picked.has(x.i)}">
    <span class="check">✓</span>
    <div class="nm">${esc(x.name)}<div class="tags">${x.top?'<span class="tag t-red">Recommended</span>':''}${x.mostUsed?'<span class="tag t-ok">Most used</span>':''}${low}</div></div>
    <div class="tot num">${f3(x.total)}<small>OMR</small></div>
    <div class="brk">${S.own?'<span>Customer oil</span>':`<span><b>${sc.L}</b> L × ${f3(x.per)} = <b>${f3(x.oil)}</b></span>`}<span>Filter <b>${f3(x.fp)}</b></span><span>Labour <b>${f3(x.lab)}</b></span>${x.ex?`<span>Services <b>${f3(x.ex)}</b></span>`:''}${x.disc?`<span>Discount <b>−${f3(x.disc)}</b></span>`:''}</div>
  </button>`;
}
function settingsCard(sc){
  const f=sc.fi>=0?D.filters[sc.fi]:null;
  return `<div class="card">
    <div class="row"><span class="ic"><svg><use href="#i-drop"/></svg></span><div class="tx"><b>Litres</b><span>${S.L?'changed':'from past jobs'}</span></div>
      <div class="seg"><button data-l="-0.5" aria-label="Less">−</button><span class="val num" style="min-width:52px;text-align:center;align-self:center">${sc.L||0}</span><button data-l="0.5" aria-label="More">+</button></div></div>
    <div class="row" data-sheet="filter" role="button" tabindex="0"><span class="ic"><svg><use href="#i-filter"/></svg></span><div class="tx"><b>Oil filter ›</b><span>${f?esc(filterName(f)):'None'} ${f&&f[3]<=0?'<span class="tag t-bad">Out</span>':''}</span></div><span class="val num">${f3(f?f[2]:0)}</span></div>
    <div class="row"><span class="ic"><svg><use href="#i-wrench"/></svg></span><div class="tx"><b>Labour</b><span>${S.labOn?'added':'removed'}</span></div>
      <div class="seg"><button data-suv="0" aria-pressed="${!S.suv}">Sedan</button><button data-suv="1" aria-pressed="${!!S.suv}">SUV</button></div>
      <button class="sw" role="switch" aria-checked="${S.labOn}" aria-label="Labour on/off" data-lab></button></div>
    <div class="row"><span class="ic"><svg><use href="#i-can"/></svg></span><div class="tx"><b>Customer brings oil</b><span>no oil charge</span></div><button class="sw" role="switch" aria-checked="${S.own}" aria-label="Customer brings oil" data-own></button></div>
  </div>`;
}
function bindQuote(){
  const m=$('#main');
  m.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{S.visc=b.dataset.v;S.picked.clear();render();});
  m.querySelectorAll('[data-oil]').forEach(b=>b.onclick=()=>{const i=+b.dataset.oil;S.picked.has(i)?S.picked.delete(i):S.picked.add(i);render();});
  m.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const sc=scenario();S.L=Math.max(1,Math.round(((sc.L||4)+parseFloat(b.dataset.l))*10)/10);render();});
  m.querySelectorAll('[data-suv]').forEach(b=>b.onclick=()=>{S.suv=+b.dataset.suv;render();});
  m.querySelectorAll('[data-lab]').forEach(b=>b.onclick=()=>{S.labOn=!S.labOn;render();});
  m.querySelectorAll('[data-own]').forEach(b=>b.onclick=()=>{S.own=!S.own;render();});
  m.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>{const id=b.dataset.ex;S.extras.has(id)?S.extras.delete(id):S.extras.add(id);render();});
  m.querySelectorAll('[data-dm]').forEach(b=>b.onclick=()=>{S.discMode=b.dataset.dm;S.disc=0;render();});
  m.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{S.disc=+b.dataset.d;render();});
  m.querySelectorAll('[data-sheet]').forEach(b=>{b.onclick=()=>{S.sheet=b.dataset.sheet;renderSheet();};b.onkeydown=e=>{if(e.key==='Enter')b.click();};});
}
function selectedLines(){const sc=scenario();if(!sc||!sc.L)return [];return oilList(sc).filter(x=>S.picked.has(x.i));}
function renderPay(){
  const p=$('#paybar');if(!p)return;const sel=selectedLines();
  if(!sel.length){p.innerHTML='';return;}
  const one=sel.length===1;
  p.innerHTML=`<div class="in"><div class="box"><div><div class="lbl">${one?'Total':sel.length+' options'}</div><div class="big num">${one?f3(sel[0].total):f3(Math.min(...sel.map(s=>s.total)))+'+'}</div></div>
    <button class="btn" id="send"><svg><use href="#i-send"/></svg>Send to customer</button></div></div>`;
  $('#send').onclick=()=>{S.sheet='msg';renderSheet();};
}
function message(){
  const sc=scenario();const sel=selectedLines();if(!sel.length)return '';
  let t='السلام عليكم،\nسعر تغيير زيت المحرك لسيارة '+sc.c.mk+' '+sc.c.md+(S.year?' '+S.year:'')+' ('+sc.L+' لتر):\n';
  sel.forEach((x,k)=>{t+='\n'+(k+1)+') '+x.name+(x.name.includes(x.visc)?'':' '+x.visc)+'\n';
    t+='   '+(S.own?'':'الزيت '+f3(x.oil)+' + ')+'الفلتر '+f3(x.fp)+(x.lab?' + الأجرة '+f3(x.lab):'')+'\n';
    if(x.ex)t+='   '+[...S.extras].map(i=>EXTRAS.find(e=>e.id===i).ar).join('، ')+' '+f3(x.ex)+'\n';
    if(x.disc)t+='   خصم '+f3(x.disc)+'\n';
    t+='   المجموع: '+f3(x.total)+' ر.ع\n';});
  return t+'\nورشة عالم الخدمات السريعة';
}
function closeSheet(){S.sheet=null;const el=$('#sheet');if(el)el.remove();}
function renderSheet(){
  let el=$('#sheet');if(!el){el=document.createElement('div');el.id='sheet';el.className='sheet';document.body.appendChild(el);}
  el.onclick=e=>{if(e.target===el)closeSheet();};
  const close='<button class="btn ghost" data-close>Close</button>';
  if(S.sheet==='filter'){
    const sc=scenario();const F=D.filters;const fr=sc.fr;
    const opt=(i,mark)=>{const f=i>=0?F[i]:null;return `<button class="opt${sc.fi===i?' sel':''}" data-fi="${i}"><span style="width:26px;font-weight:700;color:var(--ok)">${mark}</span><div class="tx"><b>${f?esc(filterName(f)):'No filter'}</b>${f?`<span>${f[3]>0?f[3]+' in stock':'Out of stock'}</span>`:''}</div>${f?`<span class="val num">${f3(f[2])}</span>`:''}</button>`;};
    let h='<h3>Oil filter</h3>';
    if(fr.rec>=0)h+=opt(fr.rec,'★');
    [...fr.ok].forEach(i=>h+=opt(i,'✓'));
    h+=opt(-1,'');
    h+='<h2>All filters</h2>'+F.map((f,i)=>i).filter(i=>i!==fr.rec&&!fr.ok.has(i)).sort((a,b)=>F[a][0].localeCompare(F[b][0])).map(i=>opt(i,'')).join('');
    el.innerHTML=`<div class="pnl">${h}${close}</div>`;
    el.querySelectorAll('[data-fi]').forEach(b=>b.onclick=()=>{S.fi=+b.dataset.fi;closeSheet();render();});
  } else if(S.sheet==='msg'){
    const msg=message();
    el.innerHTML=`<div class="pnl"><h3>Message to customer</h3><pre class="msg" id="msgtx">${esc(msg)}</pre>
      <button class="btn" id="wa"><svg><use href="#i-send"/></svg>Open WhatsApp</button>
      <button class="btn ghost" id="cp">Copy text</button>${close}</div>`;
    $('#wa').onclick=()=>{saveHist();location.href='https://wa.me/?text='+encodeURIComponent(msg);};
    $('#cp').onclick=async()=>{saveHist();try{await navigator.clipboard.writeText(msg);toast('Copied. Paste in WhatsApp.');}catch(e){const r=document.createRange();r.selectNodeContents($('#msgtx'));const s=getSelection();s.removeAllRanges();s.addRange(r);toast('Select and copy the text');}};
  }
  const cb=el.querySelector('[data-close]');if(cb)cb.onclick=closeSheet;
}
function saveHist(){
  const sc=scenario();const sel=selectedLines();if(!sel.length)return;
  const h=store.get('hist',[]);
  h.unshift({t:Date.now(),by:S.user.name,car:sc.c.mk+' '+sc.c.md+(S.year?' '+S.year:''),L:sc.L,oils:sel.map(x=>x.name+' '+x.visc),total:sel[0].total});
  store.set('hist',h.slice(0,200));
}
function renderHist(){
  const h=store.get('hist',[]);
  $('#main').innerHTML=`<h2>Quotes sent</h2>${h.length?`<div class="hist">${h.map(x=>`<div class="hi"><b>${esc(x.car)}</b><span>${esc(x.oils.join(' · '))} · ${x.L} L</span><span>${new Date(x.t).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Muscat'})} · ${esc(x.by)}</span><span class="tot num">${f3(x.total)}</span></div>`).join('')}</div>`:`<div class="empty"><svg><use href="#i-list"/></svg>No quotes yet. Every quote you send is saved here.</div>`}`;
}
function renderRem(){
  $('#main').innerHTML=`<div class="empty" style="padding-top:60px"><svg><use href="#i-bell"/></svg><b style="color:var(--ink);font-size:1.1rem">Oil change reminders</b>Coming next. Customers due this week, with a WhatsApp button for each.</div>`;
}

/* ---------- settings ---------- */
let tapCount=0,tapTimer,addUser=null;
function renderSet(){
  const dt=new Date(D.asof);const us=users();
  $('#main').innerHTML=`<div class="card">
    <div class="row"><span class="avatar" style="background:${S.user.color};width:42px;height:42px">${initials(S.user.name)}</span><div class="tx"><b>${esc(S.user.name)}</b><span>${isAdmin()?'Owner':'Staff'}</span></div></div>
    <div class="row" id="pricesRow"><span class="ic"><svg><use href="#i-calc"/></svg></span><div class="tx"><b>Prices from ARI</b><span class="num">${dt.toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Muscat'})}</span></div><span class="tag t-ok">On this phone</span></div>
    <div class="row"><span class="ic"><svg><use href="#i-can"/></svg></span><div class="tx"><b>${D.oils.length} oils · ${D.filters.length} filters · ${Object.keys(CARS).length} car models</b><span>Works with no internet. Updates every morning.</span></div></div>
    <div class="row"><span class="ic"><svg><use href="#i-gear"/></svg></span><div class="tx"><b>App version</b><span class="num">${esc(appVersion())}</span></div></div>
  </div>
  <div id="hiddenRefresh" hidden><button class="btn ghost" id="refresh" style="width:100%">Update prices now</button></div>
  ${isAdmin()?`<h2>Users on this device <span class="tag t-red">Owner only</span></h2>
  <div class="card">${us.map(u=>`<div class="row"><span class="avatar" style="background:${u.color};width:42px;height:42px">${initials(u.name)}</span><div class="tx"><b>${esc(u.name)}</b><span>${u.role==='admin'?'Owner':'Staff'}</span></div>${u.role!=='admin'?`<button class="small-btn" data-rmuser="${u.id}">Remove</button>`:''}</div>`).join('')}
    ${addUser?(addUser.step==='name'?`<div style="display:grid;gap:10px"><input class="field" id="uname" placeholder="Worker name" autocomplete="off"><button class="btn" id="uNext">Next</button></div>`:`<div style="display:grid;gap:10px;justify-items:center"><b>PIN for ${esc(addUser.name)}</b>${dots(addUser.pin.length)}${pad()}</div>`):`<button class="small-btn" id="addU">+ Add worker</button>`}
  </div>
  <h2>Car make pictures <span class="tag t-red">Owner only</span></h2>
  <div class="card">${[...new Set(Object.values(CARS).map(x=>x.mk))].sort().map(k=>{const lg=LOGOS()[k];return `<div class="row"><span class="ic">${lg?`<img src="${lg}" alt="" style="width:36px;height:36px;object-fit:contain">`:`<span style="width:36px;height:36px;border-radius:9px;display:grid;place-items:center;color:#fff;font-weight:700;font-size:.8rem;background:${MONO[k]||'#444'}">${esc(k.slice(0,3).toUpperCase())}</span>`}</span><div class="tx"><b>${esc(k)}</b><span>${lg?'Picture added':'No picture'}</span></div><label class="small-btn" style="display:flex;align-items:center;cursor:pointer">${lg?'Change':'Add'}<input type="file" accept="image/*" data-logo="${esc(k)}" hidden></label>${lg?`<button class="small-btn" data-rmlogo="${esc(k)}" aria-label="Remove">✕</button>`:''}</div>`;}).join('')}</div>`:''}
  <button class="btn ghost" id="logout">Change user</button>`;
  $('#pricesRow').onclick=()=>{tapCount++;clearTimeout(tapTimer);tapTimer=setTimeout(()=>tapCount=0,1500);if(tapCount>=5){$('#hiddenRefresh').hidden=false;tapCount=0;}};
  $('#refresh').onclick=async()=>{toast('Checking…');const r=await syncData(true);toast(r===true?'Prices updated':r==='same'?'Prices already up to date':'No internet. Try later.');if(r===true)render();};
  $('#logout').onclick=()=>{S.user=null;store.set('user',null);pickUser=null;render();};
  if(!isAdmin())return;
  const a=$('#addU');if(a)a.onclick=()=>{addUser={step:'name',name:'',pin:''};renderSet();const i=$('#uname');if(i)i.focus();};
  const n=$('#uNext');if(n)n.onclick=()=>{const v=$('#uname').value.trim();if(!v)return;addUser.name=v;addUser.step='pin';renderSet();};
  if(addUser&&addUser.step==='pin')bindPad(async k=>{
    if(k==='⌫')addUser.pin=addUser.pin.slice(0,-1);else if(addUser.pin.length<4)addUser.pin+=k;
    if(addUser.pin.length===4){const all=users();all.push({id:'u'+Date.now(),name:addUser.name,role:'staff',pin:await hashPin(addUser.pin),color:COLORS[all.length%COLORS.length]});saveUsers(all);toast(addUser.name+' added');addUser=null;}
    renderSet();});
  document.querySelectorAll('[data-rmuser]').forEach(b=>b.onclick=()=>{if(b.dataset.armed){saveUsers(users().filter(u=>u.id!==b.dataset.rmuser));renderSet();}else{b.dataset.armed=1;b.textContent='Tap again';}});
  document.querySelectorAll('[data-logo]').forEach(inp=>inp.onchange=()=>{const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');const s=Math.min(1,128/Math.max(im.width,im.height));c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);const l=LOGOS();l[inp.dataset.logo]=c.toDataURL('image/png');store.set('logos',l);toast('Picture saved');render();};im.src=r.result;};r.readAsDataURL(f);});
  document.querySelectorAll('[data-rmlogo]').forEach(b=>b.onclick=()=>{const l=LOGOS();delete l[b.dataset.rmlogo];store.set('logos',l);render();});
}
function appVersion(){
  const n=window.FSW_APP_NAME||window.FSW_VERSION_NAME;
  return n?'Version '+n:'Version 1.0';
}
let tt;function toast(s){const t=$('#toast');t.textContent=s;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2400);}

/* app update notice */
window.addEventListener('fsw-update',e=>{
  if($('.upd'))return;
  document.body.insertAdjacentHTML('beforeend','<div class="upd">Version '+esc((e&&e.detail&&e.detail.name)||'')+' is ready<button id="updNow">Restart</button></div>');
  $('#updNow').onclick=()=>{
    const b=$('#updNow');b.textContent='…';
    try{location.replace(location.origin+'/index.html?r='+Date.now());}catch(e){}
    setTimeout(()=>{try{location.reload();}catch(e){}},400);
    setTimeout(()=>{const u=$('.upd');if(u)u.innerHTML='Close the app and open it again to finish the update.';},2000);
  };
});

/* ---------- start ---------- */
(async()=>{
  await loadData();
  const saved=store.get('user',null);S.user=users().find(u=>u.id===saved)||null;
  render();
  const r=await syncData(false);
  if(r===true&&!S.sheet&&!(S.tab==='set'&&addUser))render();
  setInterval(async()=>{if(await syncData(false)===true&&!S.sheet)render();},30*60e3);
})();
})();
