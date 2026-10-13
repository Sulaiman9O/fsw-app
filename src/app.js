(function(){
"use strict";
const BASE=window.FSW_BASE||'https://raw.githubusercontent.com/Sulaiman9O/fsw-app/main/docs/';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f3=n=>(Math.round(n*1000)/1000).toFixed(3);
const nrm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const store={get(k,d){try{const v=localStorage.getItem('fsw_'+k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem('fsw_'+k,JSON.stringify(v));}catch(e){}}};

document.body.insertAdjacentHTML('beforeend',__SVG__+'<div id="root"></div><div class="toast" id="toast" hidden></div>');
const bootEl=document.getElementById('boot');if(bootEl)bootEl.remove();

/* ---------- users: stored on this device only ---------- */
const COLORS=['#ee3a39','#2563c9','#2e9d3a','#c98a00','#5a45c4','#0f8f8a'];
async function hashPin(pin){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('fsw:'+pin));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}catch(e){return 'p:'+pin;}}
/* ---------- shared data (Firebase): users, pictures, history ---------- */
const FB_CFG={apiKey:"AIzaSyAVQKq_pYmZxH-F2dfh97PKimPZGT22Hgo",authDomain:"fsw-app-2b544.firebaseapp.com",projectId:"fsw-app-2b544",storageBucket:"fsw-app-2b544.firebasestorage.app",messagingSenderId:"936194077597",appId:"1:936194077597:web:32c63c2943b2ce91657574"};
const MEM={logos:null,carpics:null,users:null,hist:null};
const SYNC={db:null,state:'off',start:Date.now(),usersLoaded:false};
const enc=k=>encodeURIComponent(k).replace(/\./g,'%2E');
const dec=k=>decodeURIComponent(k);
const users=()=>MEM.users||store.get('users',[]);
function saveUsers(list){
  const old=users();store.set('users',list);
  if(SYNC.db){const col=SYNC.db.collection('users');
    list.forEach(u=>col.doc(u.id).set(u).catch(()=>{}));
    old.filter(o=>!list.find(u=>u.id===o.id)).forEach(o=>col.doc(o.id).delete().catch(()=>{}));
  }
  if(MEM.users)MEM.users=list;
}

/* ---------- extra services ---------- */
const EXTRAS=[{id:'insp',name:'Maintenance check',ar:'فحص الصيانة',icon:'i-check',price:{0:5,1:5}}];
const LOGOS=()=>Object.assign({},MEM.logos||store.get('logos_cache',{}),store.get('logos',{}));
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
  let saved=window.FSW_TEST_DATA||store.get('data',null),bundled=null;
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
  const histL=hr&&hr[4]!=='far'?hr[1]:(!eng&&hr?hr[1]:0);
  const specL=eng?eng[3]:0;
  const L=S.L||histL||specL;
  const fi=S.fi!=null?S.fi:fr.rec;
  const visc=S.visc||defaultVisc(c,eng);
  return {c,eng,hr,fr,L,fi,visc,histL,specL};
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

/* ---------- images ---------- */
const LOGO_IMG='data:image/png;base64,__LOGO__';
const EMBLEM_IMG='data:image/png;base64,__EMBLEM__';
const CARPICS=()=>Object.assign({},store.get('carpics',{}),MEM.carpics||{});
const isSuv=c=>c&&c.suvN&&c.suv*2>=c.suvN;
function carPic(c){const p=c?CARPICS()[c.mk+'|'+c.md]:null;return p?`<img class="photo" src="${p}" alt="">`:`<svg viewBox="0 0 200 120"><use href="#${isSuv(c)?'suvR':'sedanR'}"/></svg>`;}
function shrinkImage(file,maxW,type,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,maxW/im.width);const c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL(type,0.82));};im.src=r.result;};r.readAsDataURL(file);}

function prepCarPhoto(file,cb){shrinkImage(file,800,'image/jpeg',cb);} /* keep the whole photo; it fades into the card */
function trimLogo(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
  let d;try{d=x.getImageData(0,0,c.width,c.height).data;}catch(e){d=null;}
  let x0=c.width,y0=c.height,x1=-1,y1=-1;
  if(d)for(let y=0;y<c.height;y++)for(let i=0;i<c.width;i++){const k=(y*c.width+i)*4;const a=d[k+3];const wh=d[k]>235&&d[k+1]>235&&d[k+2]>235;if(a>20&&!wh){if(i<x0)x0=i;if(i>x1)x1=i;if(y<y0)y0=y;if(y>y1)y1=y;}}
  if(x1<0){x0=0;y0=0;x1=c.width-1;y1=c.height-1;}
  const w=x1-x0+1,h=y1-y0+1,S=160,pad=8,s=Math.min((S-pad*2)/w,(S-pad*2)/h);
  const o=document.createElement('canvas');o.width=S;o.height=S;const ox=o.getContext('2d');ox.fillStyle='#fff';ox.fillRect(0,0,S,S);
  ox.imageSmoothingQuality='high';ox.drawImage(c,x0,y0,w,h,(S-w*s)/2,(S-h*s)/2,w*s,h*s);cb(o.toDataURL('image/png'));};im.src=r.result;};r.readAsDataURL(file);}

/* ---------- pin pad ---------- */
function pad(){return `<div class="pad">${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k=>k===''?'<span></span>':`<button class="key${k==='⌫'?' ghost':''}" data-k="${k}" aria-label="${k==='⌫'?'Delete':k}">${k}</button>`).join('')}</div>`;}
function dots(n){return `<div class="dots">${[0,1,2,3].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</div>`;}
function bindPad(onDigit){document.querySelectorAll('.pad button').forEach(b=>b.onclick=()=>onDigit(b.dataset.k));}

/* ---------- first start: create owner ---------- */
let setup={step:'name',name:'Sulaiman',pin:'',pin1:''};
function renderSetup(){
  const st=setup;let body='';
  if(st.step==='name')body=`<h2>Set up this device</h2><p>Owner name</p><input class="field" id="oname" value="${esc(st.name)}" autocomplete="off"><button class="btn" id="next">Next</button>`;
  else body=`<h2>${st.step==='pin'?'Choose owner PIN (4 numbers)':'Enter the PIN again'}</h2>${dots(st.pin.length)}${pad()}<div class="err" id="err"></div>`;
  $('#root').innerHTML=`<div class="login"><div class="in"><img class="logo" src="${LOGO_IMG}" alt="Fast Service World">${body}</div></div>`;
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
  if(!us.length&&navigator.onLine&&!SYNC.usersLoaded&&Date.now()-SYNC.start<9000){$('#root').innerHTML=`<div class="login"><div class="in"><img class="logo" src="${LOGO_IMG}" alt="Fast Service World"><p>Connecting…</p></div></div>`;setTimeout(()=>{if(!S.user)renderLogin();},1500);return;}
  if(!us.length){renderSetup();return;}
  if(us.length===1&&!pickUser)pickUser=us[0].id;
  $('#root').innerHTML=`<div class="login"><div class="in">
    <img class="logo" src="${LOGO_IMG}" alt="Fast Service World">
    <h2>Who is working today?</h2>
    <div class="people">${us.map(u=>`<button class="person${pickUser===u.id?' sel':''}" data-u="${u.id}"><span class="av">${initials(u.name)}</span>${esc(u.name)}<small>${u.role==='admin'?'Owner':'Staff'}</small></button>`).join('')}</div>
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
const TABS_OLD=[['quote','i-calc','Oil price'],['rem','i-bell','Reminders'],['hist','i-list','History'],['set','i-gear','Settings']];
const TABS_NEW=[['home','i-home','Home'],['quote','i-calc','Oil price'],['hist','i-list','History'],['set','i-gear','Settings']];
/* "New home (test)": owner turns it on per device in Settings. Off = the app as before. */
const newHome=()=>store.get('newhome',false);
const TABS_NOW=()=>newHome()?TABS_NEW:TABS_OLD;
function navButtons(){return TABS_NOW().map(([k,ic,l])=>`<button class="navb" data-tab="${k}" ${S.tab===k?'aria-current="page"':''}><svg><use href="#${ic}"/></svg>${l}${k==='rem'?'<span class="soon">SOON</span>':''}</button>`).join('');}
function render(){
  if(!S.user){renderLogin();return;}
  if(!D){$('#root').innerHTML='<div class="empty" style="padding-top:80px">No prices on this device yet. Connect to the internet and open the app again.</div>';return;}
  const when=new Date(D.asof).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'Asia/Muscat'});
  if(S.tab==='home'&&!newHome())S.tab='quote';
  const title={home:S.sec?SECS[S.sec].t:'FSW',quote:'Oil Price',rem:'Reminders',hist:'History',set:'Settings'}[S.tab];
  const y=window.scrollY;
  $('#root').innerHTML=`<div class="shell">
    <header class="top"><img class="em" src="${EMBLEM_IMG}" alt=""><span class="t">${title}</span><div class="me"><span>Prices<br>${when}</span><span class="av me">${initials(S.user.name)}</span></div></header>
    <nav class="rail"><img class="em" src="${EMBLEM_IMG}" alt="FSW">${navButtons()}<span class="av me" title="${esc(S.user.name)}">${initials(S.user.name)}</span></nav>
    <main id="main"></main>
    <nav class="bottom"><div class="in">${navButtons()}</div></nav></div>`;
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{if(S.tab!==b.dataset.tab)deeper();S.tab=b.dataset.tab;if(S.tab==='home'){S.sec=null;S.job=null;}render();scrollTo(0,0);});
  ({home:renderHome,quote:renderQuote,rem:renderRem,hist:renderHist,set:renderSet})[S.tab]();
  if(S.keepScroll){scrollTo(0,y);S.keepScroll=false;}
  if(S.sheet)renderSheet();
}
function rerender(){S.keepScroll=true;render();}
function renderQuote(){
  const m=$('#main');const c=car();
  const crumbs=S.make?`<div class="crumbs"><button class="crumb" data-clr="make">${esc(S.make)} <span>✕</span></button>${S.model?`<button class="crumb" data-clr="model">${esc(S.model)} <span>✕</span></button>`:''}${S.year!=null?`<button class="crumb" data-clr="year">${S.year||'Year ?'} <span>✕</span></button>`:''}</div>`:'';
  m.classList.remove('has-dock');
  let h='';
  if(!S.make){
    const mk={};Object.values(CARS).forEach(x=>mk[x.mk]=(mk[x.mk]||0)+x.n);const lg=LOGOS();
    const list=Object.entries(mk).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
    h=`<div class="lbl"><b>1</b>Car make</div><div class="grid">${list.map(([k,n],i)=>`<button class="mk${i<2?' hot':''}" data-mk="${esc(k)}">${lg[k]?`<span class="badge"><img src="${lg[k]}" alt=""></span>`:`<span class="mono">${esc(k.replace('Mercedes-Benz','MB').slice(0,3).toUpperCase())}</span>`}${esc(k)}${n?`<span class="cnt">${n} cars</span>`:''}</button>`).join('')}</div>`;
  } else if(!S.model){
    const pics=CARPICS();
    h=crumbs+`<div class="lbl"><b>2</b>Model</div><div class="models">${Object.values(CARS).filter(x=>x.mk===S.make).sort((a,b)=>b.n-a.n||a.md.localeCompare(b.md)).map(x=>`<div class="md"><button data-md="${esc(x.md)}" style="display:grid;text-align:left"><div class="pic">${carPic(x)}</div><div class="nm"><b>${esc(x.md)}</b>${x.n?`<span>${x.n}</span>`:''}</div></button>${isAdmin()?`<label class="cam" title="Add photo"><svg><use href="#i-cam"/></svg><input type="file" accept="image/*" data-pic="${esc(x.mk+'|'+x.md)}" hidden></label>`:''}</div>`).join('')}</div>${isAdmin()?'<p class="hint">Tap the camera on a model to add its photo.</p>':''}`;
  } else if(S.year==null){
    const ys=new Set(c.rows.map(r=>r[0]).filter(Boolean));
    let yb='';for(let y=new Date().getFullYear()+1;y>=1995;y--)yb+=`<button class="yr${ys.has(y)?' hist':''}" data-yr="${y}">${y}</button>`;
    h=crumbs+`<div class="lbl"><b>3</b>Year</div><div class="years"><button class="yr wide" data-yr="0">Don’t know</button>${yb}</div><p class="hint">Red dot = this year was serviced here before.</p>`;
  } else {
    const engs=enginesFor(c);
    if(engs.length>=2&&S.eng==null){
      h=crumbs+`<div class="lbl"><b>4</b>Engine</div><div class="engs">${engs.map((e,i)=>`<button class="eng" data-en="${i}">${esc(en(e[0]))}<small class="num">${e[3]} L · ${e[4]}</small></button>`).join('')}</div>`;
    } else { m.classList.add('has-dock');m.innerHTML=crumbs+quoteBody();bindQuote();bindCrumbs();return; }
  }
  m.innerHTML=h;bindCrumbs();
  m.querySelectorAll('[data-mk]').forEach(b=>b.onclick=()=>{deeper();S.make=b.dataset.mk;render();scrollTo(0,0);});
  m.querySelectorAll('[data-md]').forEach(b=>b.onclick=()=>{deeper();S.model=b.dataset.md;S.suv=isSuv(car())?1:0;render();scrollTo(0,0);});
  m.querySelectorAll('[data-yr]').forEach(b=>b.onclick=()=>{deeper();S.year=+b.dataset.yr;S.eng=null;resetQuote();render();scrollTo(0,0);});
  m.querySelectorAll('[data-en]').forEach(b=>b.onclick=()=>{deeper();S.eng=+b.dataset.en;resetQuote();render();scrollTo(0,0);});
  m.querySelectorAll('[data-pic]').forEach(inp=>inp.onchange=()=>{const f=inp.files[0];if(!f)return;prepCarPhoto(f,url=>{putPic('carpics',inp.dataset.pic,url);toast('Photo saved');rerender();});});
}
function bindCrumbs(){document.querySelectorAll('[data-clr]').forEach(b=>b.onclick=()=>{const k=b.dataset.clr;if(k==='make'){S.make=null;S.model=null;S.year=null;}if(k==='model'){S.model=null;S.year=null;}if(k==='year'){S.year=null;}S.eng=null;resetQuote();S.extras.clear();S.disc=0;S.own=false;S.labOn=true;render();scrollTo(0,0);});}
function resetQuote(){S.visc=null;S.picked.clear();S.fi=null;S.L=null;}
function quoteBody(){
  const sc=scenario();
  const list=sc.L?oilList(sc):[];
  if(!S.picked.size&&list.length)S.picked.add(list[0].i);
  const engRec=sc.eng?sc.eng[4]:null;
  const notes=[];
  if(!sc.L)notes.push('No oil quantity known for this car. Set the litres.');
  if(sc.eng&&sc.eng[5])notes.push('Maker allows '+sc.eng[4]+' only for this engine.');
  if(sc.fi<0)notes.push('Oil filter not known. Pick it in Filter.');
  if(!sc.eng&&sc.c.n<3&&sc.L)notes.push('Little history for this model. Check the litres.');
  const sub=[sc.eng?en(sc.eng[0]):'',sc.L?sc.L+' L':'',S.suv?'SUV':'Sedan'].filter(Boolean).join(' · ');
  return `<div class="q">
    <section class="q-main">
      <div class="hero"><div class="pic">${carPic(sc.c)}</div><div><b>${esc(sc.c.md)}${S.year?' '+S.year:''}</b><span>${esc(sub)}</span></div></div>
      <div class="visc">${stockViscs().map(v=>`<button class="vc${v===sc.visc?' sel':''}" style="--vc:${vc(v)}" data-v="${v}">${v}${v===engRec?' ✓':''}</button>`).join('')}</div>
      ${notes.map(n=>`<div class="note">⚠ ${esc(n)}</div>`).join('')}
      <div class="oils">${list.length?list.map(x=>oilCard(x,sc)).join(''):(sc.L?`<div class="empty"><svg><use href="#i-can"/></svg>No ${sc.visc} oil in stock.</div>`:'')}</div>
    </section>
    <aside class="q-side${isAdmin()?'':' no-disc'}">${sideBody(sc)}</aside>
  </div>`;
}
function oilCard(x,sc){
  const low=x.stock<=0?'<span class="tag t-bad">Out of stock</span>':(x.stock<sc.L?`<span class="tag t-warn">Only ${x.stock} L left</span>`:`<span class="tag t-mute">${Math.round(x.stock)} L</span>`);
  return `<button class="oil${S.picked.has(x.i)?' sel':''}" style="--vc:${vc(x.visc)}" data-oil="${x.i}" aria-pressed="${S.picked.has(x.i)}">
    <span class="check">✓</span>
    <div class="nm">${esc(x.name)}<div class="tags">${x.top?'<span class="tag t-red">Recommended</span>':''}${x.mostUsed?'<span class="tag t-ok">Most used</span>':''}${low}</div></div>
    <div class="tot">${f3(x.total)}<small>OMR</small></div>
    <div class="brk">${S.own?'<span>Customer oil</span>':`<span>${sc.L} L × ${f3(x.per)} = <b>${f3(x.oil)}</b></span>`}<span>Filter <b>${f3(x.fp)}</b></span><span>Labour <b>${f3(x.lab)}</b></span>${x.ex?`<span>Services <b>${f3(x.ex)}</b></span>`:''}${x.disc?`<span>Discount <b>−${f3(x.disc)}</b></span>`:''}</div>
  </button>`;
}
function sideBody(sc){
  const f=sc.fi>=0?D.filters[sc.fi]:null;
  const sel=sc.L?oilList(sc).filter(x=>S.picked.has(x.i)):[];
  const one=sel.length===1;
  return `<div class="job">
      <div class="jr"><div class="k">Litres<small>${S.L?'changed':(sc.histL?'our usual':'catalog')}</small>${sc.specL&&sc.specL!==sc.L?`<button class="cat" data-cat="${sc.specL}">Catalog ${sc.specL} L</button>`:''}${S.L&&sc.histL&&sc.histL!==sc.L&&sc.histL!==sc.specL?`<button class="cat" data-cat="${sc.histL}">Our usual ${sc.histL} L</button>`:''}</div><div class="ctl"><div class="stp"><button data-l="-0.1" aria-label="Less">−</button><span class="v num">${sc.L||0}</span><button data-l="0.1" aria-label="More">+</button></div></div></div>
      <div class="jr" data-sheet="filter" role="button" tabindex="0"><div class="k">Filter ›<small>${f?esc(filterName(f)):'None'}${f&&f[3]<=0?' · OUT':''}</small></div><div class="ctl"><span class="v">${f3(f?f[2]:0)}</span></div></div>
      <div class="jr"><div class="k">Labour<small>${S.labOn?f3(D.lab[S.suv])+' added':'removed'}</small></div><div class="ctl"><div class="seg"><button data-suv="0" aria-pressed="${!S.suv}">Sedan</button><button data-suv="1" aria-pressed="${!!S.suv}">SUV</button></div><button class="sw" role="switch" aria-checked="${S.labOn}" aria-label="Labour on or off" data-lab></button></div></div>
      <div class="jr"><div class="k">Customer oil<small>${S.own?'Yes, no oil charge':'No'}</small></div><div class="ctl"><button class="sw" role="switch" aria-checked="${S.own}" aria-label="Customer brings oil" data-own></button></div></div>
    </div>
    ${EXTRAS.map(e=>`<button class="svc${S.extras.has(e.id)?' sel':''}" data-ex="${e.id}"><svg><use href="#${e.icon}"/></svg>${esc(e.name)}<span class="v">${S.extras.has(e.id)?'✓ ':'+'}${f3(e.price[S.suv])}</span></button>`).join('')}
    ${isAdmin()?`<div class="disc"><div style="display:flex;align-items:center;gap:10px"><span class="lbl" style="flex:1">Discount</span><div class="seg"><button data-dm="amt" aria-pressed="${S.discMode==='amt'}">OMR</button><button data-dm="pct" aria-pressed="${S.discMode==='pct'}">%</button></div></div>
      <div class="row">${(S.discMode==='amt'?[0,0.5,1,2,3]:[0,5,10,15,20]).map(d=>`<button data-d="${d}" aria-pressed="${S.disc===d}">${d?(S.discMode==='amt'?'−'+f3(d):'−'+d+'%'):'None'}</button>`).join('')}</div></div>`:''}
    ${sel.length?`<div class="total"><div><div class="l">${one?'Total':sel.length+' options'}</div><div class="big">${one?f3(sel[0].total):f3(Math.min(...sel.map(s=>s.total)))+'+'}<small>OMR</small></div></div>${one&&newHome()?`<button class="send job" id="job"><svg><use href="#i-wrench"/></svg>Start job</button>`:''}<button class="send" id="send"><svg><use href="#i-send"/></svg>Send</button></div>`:''}`;
}
function bindQuote(){
  const m=$('#main');
  m.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{S.visc=b.dataset.v;S.picked.clear();rerender();});
  m.querySelectorAll('[data-oil]').forEach(b=>b.onclick=()=>{const i=+b.dataset.oil;S.picked.has(i)?S.picked.delete(i):S.picked.add(i);rerender();});
  m.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const sc=scenario();S.L=Math.max(1,Math.round(((sc.L||4)+parseFloat(b.dataset.l))*10)/10);rerender();});
  m.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{const sc=scenario();const v=+b.dataset.cat;S.L=(v===sc.histL&&!S.L)?null:v;if(v===sc.histL)S.L=null;rerender();});
  m.querySelectorAll('[data-suv]').forEach(b=>b.onclick=()=>{S.suv=+b.dataset.suv;rerender();});
  m.querySelectorAll('[data-lab]').forEach(b=>b.onclick=()=>{S.labOn=!S.labOn;rerender();});
  m.querySelectorAll('[data-own]').forEach(b=>b.onclick=()=>{S.own=!S.own;rerender();});
  m.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>{const id=b.dataset.ex;S.extras.has(id)?S.extras.delete(id):S.extras.add(id);rerender();});
  m.querySelectorAll('[data-dm]').forEach(b=>b.onclick=()=>{S.discMode=b.dataset.dm;S.disc=0;rerender();});
  m.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{S.disc=+b.dataset.d;rerender();});
  m.querySelectorAll('[data-sheet]').forEach(b=>{b.onclick=()=>{deeper();S.sheet=b.dataset.sheet;renderSheet();};b.onkeydown=e=>{if(e.key==='Enter')b.click();};});
  const s=$('#send');if(s)s.onclick=()=>{deeper();S.sheet='msg';renderSheet();};
  const j=$('#job');if(j)j.onclick=()=>{deeper();S.sheet='job';renderSheet();};
}
function selectedLines(){const sc=scenario();if(!sc||!sc.L)return [];return oilList(sc).filter(x=>S.picked.has(x.i));}
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
    const opt=(i,mark)=>{const f=i>=0?F[i]:null;return `<button class="opt${sc.fi===i?' sel':''}" data-fi="${i}"><span style="width:22px;font-weight:700;color:var(--ok)">${mark}</span><div class="tx"><b>${f?esc(filterName(f)):'No filter'}</b>${f?`<span>${f[3]>0?f[3]+' in stock':'Out of stock'}</span>`:''}</div>${f?`<span class="v">${f3(f[2])}</span>`:''}</button>`;};
    let h='<h3>Oil filter</h3>';
    if(fr.rec>=0)h+=opt(fr.rec,'★');
    [...fr.ok].forEach(i=>h+=opt(i,'✓'));
    h+=opt(-1,'');
    h+='<div class="lbl" style="margin-top:6px">All filters</div>'+F.map((f,i)=>i).filter(i=>i!==fr.rec&&!fr.ok.has(i)).sort((a,b)=>F[a][0].localeCompare(F[b][0])).map(i=>opt(i,'')).join('');
    el.innerHTML=`<div class="pnl">${h}${close}</div>`;
    el.querySelectorAll('[data-fi]').forEach(b=>b.onclick=()=>{S.fi=+b.dataset.fi;closeSheet();rerender();});
  } else if(S.sheet==='msg'){
    const msg=message();
    el.innerHTML=`<div class="pnl"><h3>Message to customer</h3><pre class="msg" id="msgtx">${esc(msg)}</pre>
      <button class="btn" id="wa"><svg><use href="#i-send"/></svg>Open WhatsApp</button>
      <button class="btn ghost" id="cp">Copy text</button>${close}</div>`;
    $('#wa').onclick=()=>{saveHist();location.href='https://wa.me/?text='+encodeURIComponent(msg);};
    $('#cp').onclick=async()=>{saveHist();try{await navigator.clipboard.writeText(msg);toast('Copied. Paste in WhatsApp.');}catch(e){const r=document.createRange();r.selectNodeContents($('#msgtx'));const s=getSelection();s.removeAllRanges();s.addRange(r);toast('Select and copy the text');}};
  }
  else if(S.sheet==='job'){
    const sc=scenario();const x=selectedLines()[0];if(!x){closeSheet();return;}
    const car=sc.c.mk+' '+sc.c.md+(S.year?' '+S.year:'');
    const rows=[[x.name+(x.name.includes(x.visc)?'':' '+x.visc),S.own?'Customer oil':sc.L+' L',S.own?0:x.oil],['Oil filter',sc.fi>=0&&D.filters[sc.fi]?filterName(D.filters[sc.fi]):'None',x.fp]];
    if(x.lab)rows.push(['Labour',S.suv?'SUV':'Sedan',x.lab]);
    [...S.extras].forEach(i=>{const e=EXTRAS.find(z=>z.id===i);rows.push([e.name,'',e.price[S.suv]]);});
    if(x.disc)rows.push(['Discount','',-x.disc]);
    const jt='Job: '+car+'\n'+rows.map(r=>'- '+r[0]+(r[1]?' ('+r[1]+')':'')+': '+f3(r[2])).join('\n')+'\nTotal: '+f3(x.total)+' OMR\nBy: '+S.user.name;
    el.innerHTML=`<div class="pnl"><div class="jb-test">TEST · CLEARED WHEN THE APP CLOSES</div><h3>New job</h3>
      <div class="jb-car"><svg><use href="#i-car"/></svg><div><b>${esc(car)}</b><span>${sc.L} L oil · ${S.suv?'SUV':'Sedan'}</span></div></div>
      <div class="jb-list">${rows.map(r=>`<div class="jb-r"><div>${esc(r[0])}${r[1]?`<small>${esc(r[1])}</small>`:''}</div><b>${r[2]<0?'−'+f3(-r[2]):f3(r[2])}</b></div>`).join('')}<div class="jb-r tot"><div>Total</div><b>${f3(x.total)} OMR</b></div></div>
      <label class="jb-ph" id="jbph"><input type="file" accept="image/*" capture="environment" hidden id="jbcam"><svg><use href="#i-cam"/></svg><span>Photo of ملكية</span></label>
      <div class="jb-in"><input inputmode="numeric" placeholder="Km now" id="jbkm"><input inputmode="tel" placeholder="Customer phone" id="jbtel"></div>
      <button class="btn okb" id="jbgo"><svg><use href="#i-check"/></svg>Create job</button>
      <button class="btn ghost" id="jbcp">Copy for job card</button>${close}</div>`;
    $('#jbcam').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const ph=$('#jbph');ph.classList.add('has');ph.style.backgroundImage='url('+r.result+')';ph.querySelector('span').textContent='Photo taken';};r.readAsDataURL(f);};
    let jbPhoto=null;$('#jbcam').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;shrinkPhoto(f,u=>jbPhoto=u);});
    $('#jbgo').onclick=()=>{
      const km=parseInt(($('#jbkm').value||'').replace(/\D/g,''))||0;const tel=($('#jbtel').value||'').replace(/[^\d+]/g,'');
      const now=Date.now();const j={id:'j'+now,no:JOBNO++,car,c:sc.c,suv:S.suv,rows,total:x.total,oil:rows[0][0],L:S.own?0:sc.L,km,tel,photo:jbPhoto,by:S.user.name,t:now,stage:'new',log:[[now,'Created by '+S.user.name]]};
      JOBS.unshift(j);closeSheet();resetQuote();S.make=null;S.model=null;S.year=null;S.eng=null;S.extras.clear();S.disc=0;
      S.tab='home';S.sec='jobs';S.job=j.id;render();scrollTo(0,0);toast('Job #'+j.no+' created');};
    $('#jbcp').onclick=async()=>{const km=$('#jbkm').value.trim();const t=jt+(km?'\nKm: '+km:'');try{await navigator.clipboard.writeText(t);toast('Copied');}catch(e){toast('Could not copy');}};
  }
  else if(S.sheet==='stk'){renderStk(el,close);}
  const cb=el.querySelector('[data-close]');if(cb)cb.onclick=closeSheet;
}
function saveHist(){
  const sc=scenario();const sel=selectedLines();if(!sel.length)return;
  const item={id:'h'+Date.now()+Math.random().toString(36).slice(2,6),t:Date.now(),by:S.user.name,car:sc.c.mk+' '+sc.c.md+(S.year?' '+S.year:''),L:sc.L,oils:sel.map(x=>x.name+' '+x.visc),total:sel[0].total};
  if(SYNC.db){SYNC.db.collection('hist').doc(item.id).set(item).catch(()=>{});if(MEM.hist)MEM.hist.unshift(item);}
  else{const h=store.get('hist',[]);h.unshift(item);store.set('hist',h.slice(0,200));}
}
function renderHist(){
  const h=MEM.hist?MEM.hist.concat(store.get('hist',[])).sort((a,b)=>b.t-a.t):store.get('hist',[]);
  $('#main').innerHTML=`<div class="lbl">Quotes sent</div>${h.length?`<div class="hist">${h.map(x=>`<div class="hi"><b>${esc(x.car)}</b><span>${esc(x.oils.join(' · '))} · ${x.L} L</span><span>${new Date(x.t).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Muscat'})} · ${esc(x.by)}</span><span class="tot">${f3(x.total)}</span></div>`).join('')}</div>`:`<div class="empty"><svg><use href="#i-list"/></svg>No quotes yet. Every quote you send is saved here.</div>`}`;
}
function renderRem(){
  $('#main').innerHTML=`<div class="empty" style="padding-top:60px"><svg><use href="#i-bell"/></svg><b style="color:#fff;font-size:1.1rem">Oil change reminders</b>Coming next. Customers due this week, with a WhatsApp button for each.</div>`;
}

/* ---------- settings ---------- */
let tapCount=0,tapTimer,addUser=null,pinCh=null;
function pinBox(){
  const who=users().find(u=>u.id===pinCh.id)||{name:''};
  const title=pinCh.step==='old'?'Enter your current PIN':pinCh.step==='new'?(pinCh.self?'Choose your new PIN':'New PIN for '+esc(who.name)):'Enter the new PIN again';
  return `<div class="card" id="pinbox" style="padding:16px 14px"><div style="display:grid;gap:14px;justify-items:center"><b>${title}</b>${dots(pinCh.buf.length)}${pad()}<div class="err" id="pinerr">${pinCh.err||''}</div><button class="small-btn" id="pinCancel">Cancel</button></div></div>`;
}
function bindPinChange(){
  const my=$('#mypin');if(my)my.onclick=()=>{addUser=null;pinCh={id:S.user.id,self:true,step:'old',buf:''};renderSet();const b=$('#pinbox');if(b)b.scrollIntoView({block:'center'});};
  document.querySelectorAll('[data-pinuser]').forEach(b=>b.onclick=()=>{addUser=null;pinCh={id:b.dataset.pinuser,self:false,step:'new',buf:''};renderSet();const x=$('#pinbox');if(x)x.scrollIntoView({block:'center'});});
  if(!pinCh)return;
  $('#pinCancel').onclick=()=>{pinCh=null;renderSet();};
  bindPad(async k=>{
    pinCh.err='';
    if(k==='⌫')pinCh.buf=pinCh.buf.slice(0,-1);else if(pinCh.buf.length<4)pinCh.buf+=k;
    if(pinCh.buf.length===4){
      const h=await hashPin(pinCh.buf);const buf=pinCh.buf;pinCh.buf='';
      if(pinCh.step==='old'){const me=users().find(u=>u.id===pinCh.id);if(me&&me.pin===h)pinCh.step='new';else pinCh.err='Wrong PIN. Try again.';}
      else if(pinCh.step==='new'){pinCh.newPin=buf;pinCh.step='new2';}
      else{if(buf!==pinCh.newPin){pinCh.step='new';pinCh.err='PINs did not match. Try again.';}
        else{const list=users().map(u=>u.id===pinCh.id?Object.assign({},u,{pin:h}):u);saveUsers(list);if(S.user.id===pinCh.id)S.user=list.find(u=>u.id===pinCh.id);toast('PIN changed');pinCh=null;}}
    }
    renderSet();const b=$('#pinbox');if(b)b.scrollIntoView({block:'center'});
  });
}
function renderSet(){
  const dt=new Date(D.asof);const us=users();
  const jr=(ic,b,s,right)=>`<div class="jr"><span class="ic">${ic}</span><div class="k">${b}<small>${s}</small></div>${right||''}</div>`;
  $('#main').innerHTML=`<div class="card">
    ${jr(`<span class="av me">${initials(S.user.name)}</span>`,esc(S.user.name),isAdmin()?'Owner':'Staff')}
    <div id="pricesRow">${jr('<svg><use href="#i-calc"/></svg>','Prices from the system',dt.toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Muscat'}),'<span class="tag t-ok">On this device</span>')}</div>
    ${jr('<svg><use href="#i-can"/></svg>',`${D.oils.length} oils · ${D.filters.length} filters · ${Object.keys(CARS).length} car models`,'Works with no internet. Updates every morning.')}
    ${jr('<svg><use href="#i-gear"/></svg>',esc(appVersion()),'Updates install by themselves')}
    ${jr('<svg><use href="#i-list"/></svg>','Shared with all devices',SYNC.state==='on'?(navigator.onLine?'Connected':'Offline · will sync when back online'):SYNC.state==='loading'?'Connecting…':'Not connected yet · needs internet',SYNC.state==='on'?'<span class="tag t-ok">On</span>':'<span class="tag t-warn">Off</span>')}
  </div>
  <div id="hiddenRefresh" hidden><button class="btn ghost" id="refresh">Update prices now</button></div>
  ${isAdmin()?`<div class="lbl">Users on this device</div>
  <div class="card">${us.map(u=>jr(`<span class="av${u.role==='admin'?' me':''}">${initials(u.name)}</span>`,esc(u.name),u.role==='admin'?'Owner':'Staff',u.role!=='admin'?`<button class="small-btn" data-pinuser="${u.id}">PIN</button> <button class="small-btn" data-rmuser="${u.id}">Remove</button>`:'')).join('')}
    <div style="padding:10px 0">${addUser?(addUser.step==='name'?`<div style="display:grid;gap:10px"><input class="field" id="uname" placeholder="Worker name" autocomplete="off"><button class="btn" id="uNext">Next</button></div>`:`<div style="display:grid;gap:12px;justify-items:center"><b>PIN for ${esc(addUser.name)}</b>${dots(addUser.pin.length)}${pad()}</div>`):`<button class="small-btn" id="addU">+ Add worker</button>`}</div>
  </div>
  <div class="lbl">Car make pictures</div>
  <div class="card">${[...new Set(Object.values(CARS).map(x=>x.mk))].sort().map(k=>{const lg=LOGOS()[k];return jr(lg?`<span class="badge sm"><img src="${lg}" alt=""></span>`:`<span class="num" style="font-size:.8rem">${esc(k.slice(0,3).toUpperCase())}</span>`,esc(k),lg?'Picture added':'No picture',`<label class="small-btn">${lg?'Change':'Add'}<input type="file" accept="image/*" data-logo="${esc(k)}" hidden></label>${lg?`<button class="small-btn" data-rmlogo="${esc(k)}" aria-label="Remove">✕</button>`:''}`);}).join('')}</div>`:''}
  ${isAdmin()?`<div class="lbl">Try new things</div><div class="card"><div class="jr"><span class="ic"><svg><use href="#i-home"/></svg></span><div class="k">New home (test)<small>Section tiles. Only on this device. Turn off to go back.</small></div><button class="sw" role="switch" aria-checked="${newHome()}" aria-label="New home test" id="nhSw"></button></div></div>`:''}
  ${pinCh?pinBox():''}
  <button class="btn ghost" id="mypin">Change my PIN</button>
  <button class="btn ghost" id="logout">Change user</button>`;
  bindPinChange();
  const nh=$('#nhSw');if(nh)nh.onclick=()=>{const v=!newHome();store.set('newhome',v);S.sec=null;toast(v?'New home on':'New home off');render();};
  $('#pricesRow').onclick=()=>{tapCount++;clearTimeout(tapTimer);tapTimer=setTimeout(()=>tapCount=0,1500);if(tapCount>=5){$('#hiddenRefresh').hidden=false;tapCount=0;}};
  $('#refresh').onclick=async()=>{toast('Checking…');const r=await syncData(true);toast(r===true?'Prices updated':r==='same'?'Prices already up to date':'No internet. Try later.');if(r===true)render();};
  $('#logout').onclick=()=>{S.user=null;store.set('user',null);pickUser=null;render();};
  if(!isAdmin())return;
  const a=$('#addU');if(a)a.onclick=()=>{pinCh=null;addUser={step:'name',name:'',pin:''};renderSet();const i=$('#uname');if(i)i.focus();};
  const n=$('#uNext');if(n)n.onclick=()=>{const v=$('#uname').value.trim();if(!v)return;addUser.name=v;addUser.step='pin';renderSet();};
  if(addUser&&addUser.step==='pin')bindPad(async k=>{
    if(k==='⌫')addUser.pin=addUser.pin.slice(0,-1);else if(addUser.pin.length<4)addUser.pin+=k;
    if(addUser.pin.length===4){const all=users();all.push({id:'u'+Date.now(),name:addUser.name,role:'staff',pin:await hashPin(addUser.pin),color:COLORS[all.length%COLORS.length]});saveUsers(all);toast(addUser.name+' added');addUser=null;}
    renderSet();});
  document.querySelectorAll('[data-rmuser]').forEach(b=>b.onclick=()=>{if(b.dataset.armed){saveUsers(users().filter(u=>u.id!==b.dataset.rmuser));renderSet();}else{b.dataset.armed=1;b.textContent='Tap again';}});
  document.querySelectorAll('[data-logo]').forEach(inp=>inp.onchange=()=>{const f=inp.files[0];if(!f)return;trimLogo(f,url=>{putPic('logos',inp.dataset.logo,url);toast('Picture saved');rerender();});});
  document.querySelectorAll('[data-rmlogo]').forEach(b=>b.onclick=()=>{delPic('logos',b.dataset.rmlogo);rerender();});
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

/* ---------- New home (test): section tiles ---------- */
const SECS={
 jobs:{t:'Jobs',i:'🔧',c:'#3a1a1a',g:'rgba(238,58,57,.25)'},
 cars:{t:'Cars',i:'🚗',c:'#1a2a3a',g:'rgba(37,99,201,.28)'},
 check:{t:'Check',i:'✅',c:'#1a3a26',g:'rgba(60,207,125,.22)'},
 stock:{t:'Stock',i:'🛢',c:'#3a2a10',g:'rgba(242,123,33,.25)'},
 remind:{t:'Reminders',i:'🔔',c:'#2a1a3a',g:'rgba(90,69,196,.28)'},
 inv:{t:'Invoices',i:'🧾',c:'#3a3410',g:'rgba(201,138,0,.25)'}
};
function stockRows(){
  const oils=D.oils.map(o=>({n:prettyOil(o[0])+(prettyOil(o[0]).includes(o[1])?'':' '+o[1]),v:o[1],q:o[3],u:'L',low:o[3]<10}));
  const fil=D.filters.map(f=>({n:filterName(f),v:'',q:f[3],u:'pcs',low:f[3]<3}));
  return oils.concat(fil);
}
function renderHome(){
  const m=$('#main');
  if(!S.sec){
    const low=stockRows().filter(r=>r.low).length;
    const n={stock:low,jobs:JOBS.filter(j=>j.stage!=='done').length,remind:REMS.length};
    m.innerHTML=`<div class="nh-hello"><b>Hello ${esc(S.user.name.split(' ')[0])}</b><span>${new Date().toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'Asia/Muscat'})}</span></div>
    <button class="nh-tile wide" data-go-quote><span class="ic" style="--tc:#3a1a1a">🧮</span><div><b>Oil price</b><span>Pick a car, send the price</span></div><span class="n">›</span></button>
    <div class="nh-tiles">${Object.entries(SECS).map(([k,s])=>`<button class="nh-tile" data-sec="${k}" style="--tc:${s.c};--glow:${s.g}"><span class="ic">${s.i}</span>${n[k]?`<span class="n">${n[k]}</span>`:''}<div><b>${s.t}</b><span>${k==='stock'?(low?low+' low':'all good'):k==='jobs'?(n.jobs?n.jobs+' open':'test · no jobs'):k==='remind'?(REMS.length?REMS.length+' saved':'test · none yet'):'coming soon'}</span></div></button>`).join('')}</div>
    <p class="hint">Test home. Turn it off in Settings to go back.</p>`;
    m.querySelector('[data-go-quote]').onclick=()=>{deeper();S.tab='quote';render();scrollTo(0,0);};
    m.querySelectorAll('[data-sec]').forEach(b=>b.onclick=()=>{deeper();S.sec=b.dataset.sec;render();scrollTo(0,0);});
    return;
  }
  const hd=`<div class="nh-head"><button class="nh-bk" data-home aria-label="Home">‹</button><b>${SECS[S.sec].t}</b></div>`;
  if(S.sec==='stock'){
    const q=(S.stq||'').toLowerCase();
    const rows=stockRows().filter(r=>!q||r.n.toLowerCase().includes(q)).sort((a,b)=>(b.low-a.low)||a.n.localeCompare(b.n));
    m.innerHTML=hd+`<input class="field" id="stq" placeholder="Search oil or filter" value="${esc(S.stq||'')}" autocomplete="off">
    <div class="nh-list">${rows.map(r=>{const max=r.u==='L'?60:20;const p=Math.max(3,Math.min(100,Math.round(r.q/max*100)));const c=r.q<=0?'var(--bad)':r.low?'var(--warn)':'var(--ok)';return `<div class="nh-row"><b>${esc(r.n)}</b><span class="r">${r.q}<small>${r.u}</small></span><span class="m">${r.u==='L'?'by litre':'by piece'}${r.low?` · <span class="tag ${r.q<=0?'t-bad':'t-warn'}">${r.q<=0?'Out':'Low'}</span>`:''}</span><div class="nh-bar"><i style="width:${p}%;background:${c}"></i></div></div>`;}).join('')}</div>`;
    const i=$('#stq');i.oninput=()=>{S.stq=i.value;const pos=i.value.length;render();const j=$('#stq');j.focus();try{j.setSelectionRange(pos,pos);}catch(e){}};
  } else if(S.sec==='jobs'){renderJobs(m,hd);
  } else if(S.sec==='remind'){renderRems(m,hd);
  } else {
    const what={jobs:'Open jobs by stage, and new jobs built from the car history.',cars:'One search for plate, phone or name, with history and what is due.',check:'Green, yellow and red checks with photos.',remind:'Who is due, with a WhatsApp button and the sticker print.',inv:'Unpaid first, and one tap for cash, card or transfer.'}[S.sec];
    m.innerHTML=hd+`<div class="empty"><span style="font-size:2.4rem">${SECS[S.sec].i}</span><b style="color:#fff;font-size:1.05rem">${SECS[S.sec].t} · coming soon</b>${what}<br>This needs customer data from the system, so it comes after device approval.</div>`;
  }
  const h=m.querySelector('[data-home]');if(h)h.onclick=()=>{S.sec=null;render();scrollTo(0,0);};
}

/* ---------- Android back gesture: step back inside the app ---------- */
function deeper(){if(CapApp)return;try{history.pushState({fsw:Date.now()},'');}catch(e){}}

/* ---------- Jobs, sticker, reminders (TEST: kept in memory only, cleared when the app closes) ---------- */
const JOBS=[];const REMS=[];let JOBNO=1;
const EMB_B='data:image/png;base64,__EMB_B__';const LOGO_B='data:image/png;base64,__LOGO_B__';
const STAGES=[['new','New','var(--red)'],['work','Working','var(--orange)'],['ready','Ready','var(--ok)'],['done','Delivered','var(--dim)']];
const stg=k=>STAGES.find(x=>x[0]===k);
const hm=t=>new Date(t).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Muscat'});
const fmtD=d=>new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Muscat'});
const kmf=n=>(+n||0).toLocaleString('en-US');
const waNum=t=>{let d=(t||'').replace(/\D/g,'');if(d.length===8)d='968'+d;return d;};
const testBar='<div class="jb-test">TEST · CLEARED WHEN THE APP CLOSES</div>';
function shrinkPhoto(f,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1280/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.8));};im.src=r.result;};r.readAsDataURL(f);}
function jobText(j){return 'Job #'+j.no+': '+j.car+'\n'+j.rows.map(r=>'- '+r[0]+(r[1]?' ('+r[1]+')':'')+': '+f3(r[2])).join('\n')+'\nTotal: '+f3(j.total)+' OMR'+(j.km?'\nKm: '+kmf(j.km):'')+(j.tel?'\nPhone: '+j.tel:'')+'\nBy: '+j.by;}
function setStage(j,k){j.stage=k;j.log.push([Date.now(),stg(k)[1]+' · '+S.user.name]);if(k==='done'&&!REMS.some(r=>r.job===j.id))addRem(j,5000,6);}
function addRem(j,step,months){const n=new Date();n.setMonth(n.getMonth()+months);const old=REMS.find(r=>r.job===j.id);const r={job:j.id,car:j.car,tel:j.tel,oil:j.oil,km:j.km,nextKm:j.km?j.km+step:0,next:n.getTime(),t:Date.now()};if(old)Object.assign(old,r);else REMS.push(r);}
async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Copied');}catch(e){toast('Could not copy');}}
function renderJobs(m,hd){
  const j=S.job&&JOBS.find(x=>x.id===S.job);
  if(!j){
    S.job=null;const f=S.jf||'open';
    const cnt=k=>JOBS.filter(x=>k==='open'?x.stage!=='done':x.stage===k).length;
    const list=JOBS.filter(x=>f==='open'?x.stage!=='done':x.stage===f);
    m.innerHTML=hd+testBar+`<div class="jb-chips">${[['open','Open']].concat(STAGES.map(x=>[x[0],x[1]])).map(([k,l])=>`<button data-jf="${k}" aria-pressed="${f===k}">${l}<span>${cnt(k)}</span></button>`).join('')}</div>
    <button class="btn okb" data-newjob><svg><use href="#i-calc"/></svg>New job from a price</button>
    ${list.length?`<div class="nh-list">${list.map(x=>{const s=stg(x.stage);return `<button class="jb-item" data-job="${x.id}" style="--sc:${s[2]}"><div class="no">#${x.no}</div><div class="tx"><b>${esc(x.car)}</b><span>${esc(x.oil)}${x.L?' · '+x.L+' L':''}</span><span>${hm(x.t)} · ${esc(x.by)}</span></div><div class="rt"><b>${f3(x.total)}</b><span class="st">${s[1]}</span></div></button>`;}).join('')}</div>`
      :`<div class="empty"><span style="font-size:2.2rem">🔧</span>${JOBS.length?'Nothing here.':'No jobs yet. Pick a car in Oil price, choose the oil, then tap <b>Start job</b>.'}</div>`}`;
    m.querySelectorAll('[data-jf]').forEach(b=>b.onclick=()=>{S.jf=b.dataset.jf;render();});
    m.querySelector('[data-newjob]').onclick=()=>{deeper();S.tab='quote';render();scrollTo(0,0);};
    m.querySelectorAll('[data-job]').forEach(b=>b.onclick=()=>{deeper();S.job=b.dataset.job;render();scrollTo(0,0);});
  } else {
    const si=STAGES.findIndex(x=>x[0]===j.stage);const nx=STAGES[si+1];
    const act={new:'Start work',work:'Car is ready',ready:'Delivered to customer'}[j.stage];
    const rem=REMS.find(r=>r.job===j.id);
    m.innerHTML=`<div class="nh-head"><button class="nh-bk" data-back aria-label="Back">‹</button><b>Job #${j.no}</b><span class="tag" style="margin-left:auto;background:${stg(j.stage)[2]};color:#000">${stg(j.stage)[1]}</span></div>${testBar}
    <div class="jb-car"><div class="pic">${carPic(j.c)}</div><div><b>${esc(j.car)}</b><span>${j.suv?'SUV':'Sedan'}${j.km?' · '+kmf(j.km)+' km':''}</span></div></div>
    <div class="jb-steps">${STAGES.map((x,i)=>`<div class="${i<=si?'on':''}" style="--sc:${x[2]}"><i></i><span>${x[1]}</span></div>`).join('')}</div>
    ${act?`<button class="btn okb" data-next>${act}</button>`:''}
    ${j.photo?`<img class="jb-photo" src="${j.photo}" alt="ملكية">`:`<label class="jb-ph"><input type="file" accept="image/*" capture="environment" hidden id="jbcam2"><svg><use href="#i-cam"/></svg><span>Add photo of ملكية</span></label>`}
    <div class="jb-list">${j.rows.map(r=>`<div class="jb-r"><div>${esc(r[0])}${r[1]?`<small>${esc(r[1])}</small>`:''}</div><b>${r[2]<0?'−'+f3(-r[2]):f3(r[2])}</b></div>`).join('')}<div class="jb-r tot"><div>Total</div><b>${f3(j.total)} OMR</b></div></div>
    <div class="jb-list"><div class="jb-r"><div>Km now</div><input class="jb-kmin" id="jkm" inputmode="numeric" value="${j.km||''}" placeholder="—"></div><div class="jb-r"><div>Phone</div><input class="jb-kmin" id="jtel" inputmode="tel" value="${esc(j.tel||'')}" placeholder="—"></div>${rem?`<div class="jb-r"><div>Next service<small>${kmf(rem.nextKm)} km</small></div><b>${fmtD(rem.next)}</b></div>`:''}</div>
    <div class="jb-two"><button class="btn ghost" data-stk>🖨 Sticker</button><button class="btn ghost" data-copy>Copy for job card</button></div>
    ${j.tel&&(j.stage==='ready'||j.stage==='done')?`<button class="btn ghost" data-wa><svg><use href="#i-send"/></svg>WhatsApp: car is ready</button>`:''}
    <div class="lbl" style="margin-top:4px">Timeline</div>
    <div class="jb-log">${j.log.slice().reverse().map(l=>`<div><span>${hm(l[0])}</span>${esc(l[1])}</div>`).join('')}</div>
    <button class="btn ghost jb-del" data-del>Delete job</button>`;
    m.querySelector('[data-back]').onclick=()=>{S.job=null;render();scrollTo(0,0);};
    const nb=m.querySelector('[data-next]');if(nb)nb.onclick=()=>{setStage(j,nx[0]);toast(nx[1]);rerender();};
    const c2=$('#jbcam2');if(c2)c2.onchange=e=>{const f=e.target.files[0];if(f)shrinkPhoto(f,u=>{j.photo=u;j.log.push([Date.now(),'Photo added']);rerender();});};
    $('#jkm').onchange=e=>{j.km=parseInt(e.target.value.replace(/\D/g,''))||0;const r=REMS.find(x=>x.job===j.id);if(r){r.km=j.km;}rerender();};
    $('#jtel').onchange=e=>{j.tel=e.target.value.replace(/[^\d+]/g,'');const r=REMS.find(x=>x.job===j.id);if(r)r.tel=j.tel;rerender();};
    m.querySelector('[data-stk]').onclick=()=>{deeper();S.stk={job:j.id,tpl:(S.stk&&S.stk.tpl)||'A',step:5000,months:6};S.sheet='stk';renderSheet();};
    m.querySelector('[data-copy]').onclick=()=>copyText(jobText(j));
    const wa=m.querySelector('[data-wa]');if(wa)wa.onclick=()=>{location.href='https://wa.me/'+waNum(j.tel)+'?text='+encodeURIComponent('السلام عليكم،\nسيارتكم '+j.car+' جاهزة للاستلام.\nالمبلغ: '+f3(j.total)+' ر.ع\nورشة عالم الخدمات السريعة');};
    const d=m.querySelector('[data-del]');d.onclick=()=>{if(d.dataset.armed){JOBS.splice(JOBS.indexOf(j),1);S.job=null;render();toast('Job deleted');}else{d.dataset.armed=1;d.textContent='Tap again to delete';}};
  }
  const h=m.querySelector('[data-home]');if(h)h.onclick=()=>{S.sec=null;render();scrollTo(0,0);};
}
const STK_SIZES={A:[62,29,'Small strip'],B:[62,50,'Standard'],C:[62,62,'Square'],D:[29,90,'Tall']};
/* paper names the Brother print screen offers (inches) */
const STK_PAPER={A:[2.4,1.1],B:[2.4,3.9],C:[2.4,3.9],D:[1.1,3.5]};
function stickerHtml(t,d){
  const nk=kmf(d.nextKm),done=fmtD(Date.now()),next=fmtD(d.next),oil=esc(d.oil),km=kmf(d.km);
  if(t==='A')return `<div class="stk sA"><img src="${EMB_B}" alt=""><div><div class="t"><span>NEXT SERVICE</span><span class="ar">الصيانة القادمة</span></div><div class="k d">${next}</div><div class="k km">${d.nextKm?nk+' km':'—'}</div><div class="o"><span>${oil}</span><span>Done ${done}</span></div></div></div>`;
  if(t==='B')return `<div class="stk sB"><img src="${LOGO_B}" alt=""><div class="bar"><span>NEXT SERVICE</span><span class="ar">الصيانة القادمة</span></div><div class="two"><div class="bx"><small><span>DATE</span><span class="ar">التاريخ</span></small><span class="k">${next}</span></div><div class="bx"><small><span>KM</span><span class="ar">الكيلومتر</span></small><span class="k">${d.nextKm?nk:'—'}</span></div></div><div class="ft"><span>${oil}</span><span>${done}${d.km?' · '+km+' km':''}</span></div></div>`;
  if(t==='C')return `<div class="stk sC"><img src="${EMB_B}" alt=""><div class="h ar">موعد تغيير الزيت القادم<small>NEXT OIL CHANGE</small></div><div class="big"><div><span class="k">${next}</span><small>DATE · التاريخ</small></div><i></i><div><span class="k">${d.nextKm?nk:'—'}</span><small>KM · كم</small></div></div><div class="o">${oil} · Done ${done}${d.km?' at '+km+' km':''}</div><div class="nm ar">ورشة عالم الخدمات السريعة</div></div>`;
  return `<div class="stk sD"><img src="${EMB_B}" alt=""><div class="bar">NEXT SERVICE</div><div class="ar" style="font-size:2.6mm">الصيانة القادمة</div><div><div class="lb">DATE</div><div class="k">${next.replace(' 20',' ’')}</div></div><div><hr><div class="lb" style="margin-top:1.6mm">KM</div><div class="k">${d.nextKm?nk:'—'}</div></div><div class="o">${oil}<br>Done ${done}${d.km?'<br>'+km+' km':''}</div></div>`;
}
function stkCss(){if(!$('#stkcss')){const st=document.createElement('style');st.id='stkcss';st.textContent=__STKCSS__;document.head.appendChild(st);}}
function renderStk(el,close){
  stkCss();const k=S.stk;const j=JOBS.find(x=>x.id===k.job);if(!j){closeSheet();return;}
  const n=new Date();n.setMonth(n.getMonth()+k.months);
  const d={oil:j.oil,km:j.km,nextKm:j.km?j.km+k.step:0,next:n.getTime()};
  const sc={A:1,B:1,C:.9,D:.75}[k.tpl];
  el.innerHTML=`<div class="pnl"><h3>Service sticker · Job #${j.no}</h3>
    <div class="stk-pv"><div style="transform:scale(${sc});transform-origin:center">${stickerHtml(k.tpl,d)}</div></div>
    <div class="jb-chips">${Object.entries(STK_SIZES).map(([t,v])=>`<button data-tpl="${t}" aria-pressed="${k.tpl===t}">${t}<span>${v[0]}×${v[1]}</span></button>`).join('')}</div>
    ${j.km?'':`<div class="jb-in" style="grid-template-columns:1fr"><input inputmode="numeric" placeholder="Km now (for the next km)" id="skm"></div>`}
    <div class="jb-chips">${[5000,7500,10000].map(v=>`<button data-step="${v}" aria-pressed="${k.step===v}">+${kmf(v)} km</button>`).join('')}${[3,6].map(v=>`<button data-mon="${v}" aria-pressed="${k.months===v}">${v} months</button>`).join('')}</div>
    <p class="hint" style="margin:0">Brother QL-820NWB · ${k.tpl==='D'?'needs a 29 mm roll':'DK-22113 · 62 mm roll'}<br>In the print screen pick paper <b style="color:#fff">${STK_PAPER[k.tpl][0]}" x ${STK_PAPER[k.tpl][1]}"</b>${k.tpl==='B'||k.tpl==='C'?' (prints 100 mm long)':''}</p>
    <button class="btn" id="stkgo">🖨 Print sticker</button>${close}</div>`;
  el.querySelectorAll('[data-tpl]').forEach(b=>b.onclick=()=>{k.tpl=b.dataset.tpl;renderSheet();});
  el.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{k.step=+b.dataset.step;renderSheet();});
  el.querySelectorAll('[data-mon]').forEach(b=>b.onclick=()=>{k.months=+b.dataset.mon;renderSheet();});
  const skm=$('#skm');if(skm)skm.onchange=()=>{j.km=parseInt(skm.value.replace(/\D/g,''))||0;renderSheet();};
  $('#stkgo').onclick=()=>{
    addRem(j,k.step,k.months);j.log.push([Date.now(),'Sticker '+k.tpl+' · next '+fmtD(d.next)]);
    const [w,h]=STK_SIZES[k.tpl];const [pw,ph]=STK_PAPER[k.tpl];
    const z=Math.min(1,(pw*25.4-1)/w,(ph*25.4-1)/h).toFixed(3);
    const doc='<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:0}html,body{margin:0;padding:0;background:#fff;height:0;overflow:hidden}'+__STKCSS__+'.stk{box-shadow:none!important;border-radius:0!important;background:#fff!important}.pg{position:fixed;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center}.pg>div{transform:scale('+z+');transform-origin:center}</style></head><body><div class="pg"><div>'+stickerHtml(k.tpl,d)+'</div></div></body></html>';
    const P=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.FswPrint;
    if(!P){toast('Reminder saved. Printing needs the new app version.');closeSheet();rerender();return;}
    P.printHtml({html:doc,widthMm:pw*25.4,heightMm:ph*25.4,name:'FSW sticker'}).then(()=>{closeSheet();rerender();}).catch(e=>toast('Could not print: '+(e&&e.message||e)));
  };
}
function renderRems(m,hd){
  const list=REMS.slice().sort((a,b)=>a.next-b.next);
  m.innerHTML=hd+testBar+(list.length?`<div class="nh-list">${list.map((r,i)=>`<div class="nh-row"><b>${esc(r.car)}</b><span class="r">${fmtD(r.next).replace(/ \d{4}$/,'')}<small>${r.nextKm?kmf(r.nextKm)+' km':''}</small></span><span class="m">${esc(r.oil)}${r.tel?' · '+esc(r.tel):' · no phone'}</span>${r.tel?`<button class="btn ghost jb-wa" data-rw="${i}"><svg><use href="#i-send"/></svg>Remind on WhatsApp</button>`:''}</div>`).join('')}</div>`
    :`<div class="empty"><span style="font-size:2.2rem">🔔</span>No reminders yet. A reminder is saved when a job is delivered or a sticker is printed.</div>`);
  m.querySelectorAll('[data-rw]').forEach(b=>b.onclick=()=>{const r=list[+b.dataset.rw];location.href='https://wa.me/'+waNum(r.tel)+'?text='+encodeURIComponent('السلام عليكم،\nنذكركم بموعد تغيير زيت سيارتكم '+r.car+' بتاريخ '+fmtD(r.next)+(r.nextKm?' أو عند '+kmf(r.nextKm)+' كم':'')+'.\nورشة عالم الخدمات السريعة');});
  const h=m.querySelector('[data-home]');if(h)h.onclick=()=>{S.sec=null;render();scrollTo(0,0);};
}

function goBackStep(){
  if(!S.user)return false;
  if(S.sheet){closeSheet();return true;}
  if(S.tab==='home'&&S.sec==='jobs'&&S.job){S.job=null;render();scrollTo(0,0);return true;}
  if(S.tab==='home'&&S.sec){S.sec=null;render();scrollTo(0,0);return true;}
  const startTab=newHome()?'home':'quote';
  if(S.tab!=='quote'&&S.tab!==startTab){S.tab=startTab;render();scrollTo(0,0);return true;}
  if(S.tab==='quote'&&newHome()&&!S.make){S.tab='home';render();scrollTo(0,0);return true;}
  const c=car();
  if(S.year!=null&&c&&enginesFor(c).length>=2&&S.eng!=null){S.eng=null;resetQuote();}
  else if(S.year!=null){S.year=null;S.eng=null;resetQuote();}
  else if(S.model){S.model=null;}
  else if(S.make){S.make=null;}
  else return false;
  render();scrollTo(0,0);return true;
}
const CapApp=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
if(CapApp&&CapApp.addListener){try{CapApp.addListener('backButton',()=>{if(!goBackStep())CapApp.exitApp();});}catch(e){}}
else window.addEventListener('popstate',()=>{goBackStep();});

/* ---------- sync engine ---------- */
function putPic(col,key,url){
  const loc=store.get(col,{});
  if(col==='logos'){const lc=store.get('logos_cache',{});lc[key]=url;store.set('logos_cache',lc);}
  if(SYNC.db){SYNC.db.collection(col).doc(enc(key)).set({img:url,t:Date.now(),by:S.user?S.user.name:''}).catch(()=>{});MEM[col]=Object.assign({},MEM[col]||{},{[key]:url});if(loc[key]){delete loc[key];store.set(col,loc);}}
  else{loc[key]=url;try{localStorage.setItem('fsw_'+col,JSON.stringify(loc));}catch(e){toast('Storage full. Connect to the internet to share pictures.');}}
}
function delPic(col,key){
  if(col==='logos'){const lc=store.get('logos_cache',{});if(lc[key]){delete lc[key];store.set('logos_cache',lc);}}
  const loc=store.get(col,{});if(loc[key]){delete loc[key];store.set(col,loc);}
  if(MEM[col]&&MEM[col][key]){const m=Object.assign({},MEM[col]);delete m[key];MEM[col]=m;}
  if(SYNC.db)SYNC.db.collection(col).doc(enc(key)).delete().catch(()=>{});
}
let rTimer;
function liveRender(){clearTimeout(rTimer);rTimer=setTimeout(()=>{
  if(S.sheet)return;
  if(!S.user){if(!pinBuf)renderLogin();return;}
  if(S.tab==='set'&&addUser)return;
  rerender();},250);}
async function loadFB(){
  if(window.firebase&&window.firebase.firestore)return true;
  let code=null;try{code=localStorage.getItem('fsw_fbsdk_10141');}catch(e){}
  if(!code){try{code=await fetch(BASE+'app/fb.js?v=10141',{cache:'no-store'}).then(r=>{if(!r.ok)throw 0;return r.text();});if(code.indexOf('firebase')<0)return false;try{localStorage.setItem('fsw_fbsdk_10141',code);}catch(e){}}catch(e){return false;}}
  const s=document.createElement('script');s.textContent=code;document.head.appendChild(s);
  return !!(window.firebase&&window.firebase.firestore);
}
async function startSync(){
  if(SYNC.state!=='off')return;SYNC.state='loading';
  if(!await loadFB()){SYNC.state='off';setTimeout(startSync,60e3);return;}
  try{
    const fb=window.firebase;fb.initializeApp(FB_CFG);
    const db=fb.firestore();try{await db.enablePersistence({synchronizeTabs:false});}catch(e){}
    await new Promise(res=>{const un=fb.auth().onAuthStateChanged(u=>{un();res(u);});});
    const signIn=()=>fb.auth().currentUser?Promise.resolve():fb.auth().signInAnonymously();
    try{await signIn();}catch(e){SYNC.state='waiting';const retry=()=>signIn().then(()=>{SYNC.state='on';attach(db);}).catch(()=>setTimeout(retry,60e3));window.addEventListener('online',retry,{once:true});setTimeout(retry,60e3);SYNC.db=db;return;}
    SYNC.db=db;SYNC.state='on';attach(db);
  }catch(e){SYNC.state='off';}
}
function attach(db){
  if(SYNC.attached)return;SYNC.attached=true;
  const picCol=col=>db.collection(col).onSnapshot(s=>{const m={};s.forEach(d=>{m[dec(d.id)]=d.data().img;});MEM[col]=m;if(col==='logos')store.set('logos_cache',m);
      if(!s.metadata.fromCache){const loc=store.get(col,{});let ch=false;Object.keys(loc).forEach(k=>{if(!(k in m)){db.collection(col).doc(enc(k)).set({img:loc[k],t:Date.now(),by:S.user?S.user.name:''}).then(()=>{const l2=store.get(col,{});delete l2[k];store.set(col,l2);}).catch(()=>{});}else{delete loc[k];ch=true;}});if(ch)store.set(col,loc);}
      liveRender();},()=>{});
  picCol('logos');picCol('carpics');
  /* keep a copy of the logos on this device so they show instantly at start */
  db.collection('users').onSnapshot(s=>{
    const list=[];s.forEach(d=>list.push(d.data()));
    if(!s.metadata.fromCache&&!SYNC.usersLoaded){SYNC.usersLoaded=true;
      const loc=store.get('users',[]);
      if(!list.length&&loc.length){loc.forEach(u=>db.collection('users').doc(u.id).set(u).catch(()=>{}));return;}
      loc.filter(u=>u.role!=='admin'&&!list.find(r=>r.id===u.id)).forEach(u=>{db.collection('users').doc(u.id).set(u).catch(()=>{});list.push(u);});
    }
    if(!list.length)return;
    list.sort((a,b)=>(a.role==='admin'?0:1)-(b.role==='admin'?0:1)||String(a.id).localeCompare(String(b.id)));
    MEM.users=list;store.set('users',list);
    if(S.user){const me=list.find(u=>u.id===S.user.id);if(!me){S.user=null;store.set('user',null);}else S.user=me;}
    liveRender();
  },()=>{});
  db.collection('hist').orderBy('t','desc').limit(200).onSnapshot(s=>{
    const h=[];s.forEach(d=>h.push(d.data()));MEM.hist=h;
    if(!s.metadata.fromCache){const loc=store.get('hist',[]);if(loc.length){loc.forEach(x=>{const id=x.id||('h'+x.t);db.collection('hist').doc(id).set(Object.assign({id},x)).catch(()=>{});});store.set('hist',[]);}}
    if(S.tab==='hist')liveRender();
  },()=>{});
}

/* ---------- look for app updates while the app stays open ---------- */
let lastUpd=0;
async function checkAppUpdate(){
  if(Date.now()-lastUpd<60e3)return;lastUpd=Date.now();
  try{
    const g=u=>fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw 0;return r.text();});
    const rv=JSON.parse(await g(BASE+'app/version.json?t='+Date.now()));
    if(!(rv.v>(window.FSW_CODE_VERSION||0)))return;
    let saved=null;try{saved=JSON.parse(localStorage.getItem('fsw_code')||'null');}catch(e){}
    if(!(saved&&saved.v>=rv.v)){
      const [css,js]=await Promise.all([g(BASE+'app/app.css?v='+rv.v),g(BASE+'app/app.js?v='+rv.v)]);
      if(rv.name&&js.indexOf('window.FSW_APP_NAME="'+rv.name+'"')!==0){lastUpd=Date.now()-50e3;return;} /* server still sending the old file: try again shortly */
      try{localStorage.setItem('fsw_code',JSON.stringify({v:rv.v,name:rv.name,css,js}));}catch(e){return;}
    }
    window.dispatchEvent(new CustomEvent('fsw-update',{detail:rv}));
  }catch(e){}
}
/* if a saved copy is labelled newer than the code inside it, forget the label so it downloads again */
try{const sc=JSON.parse(localStorage.getItem('fsw_code')||'null');if(sc&&sc.name&&window.FSW_APP_NAME&&sc.name!==window.FSW_APP_NAME&&sc.v===window.FSW_CODE_VERSION){sc.v=0;localStorage.setItem('fsw_code',JSON.stringify(sc));window.FSW_CODE_VERSION=0;}}catch(e){}
setTimeout(checkAppUpdate,4000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkAppUpdate();syncData(false).then(r=>{if(r===true&&!S.sheet)rerender();});}});
setInterval(checkAppUpdate,10*60e3);

/* ---------- start ---------- */
startSync();
if(newHome())S.tab='home';
(async()=>{
  await loadData();
  const saved=store.get('user',null);S.user=users().find(u=>u.id===saved)||null;
  render();
  const r=await syncData(false);
  if(r===true&&!S.sheet&&!(S.tab==='set'&&addUser))render();
  setInterval(async()=>{if(await syncData(false)===true&&!S.sheet)render();},30*60e3);
})();
})();
