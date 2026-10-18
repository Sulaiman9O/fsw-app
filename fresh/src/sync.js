/* ---------- ONLINE SYNC (Firebase): every phone that signs in with the workshop account shares the same data.
   Each customer, car, job, part… is its own online record. A change on one phone is sent within seconds and
   shows on the others. Without internet the app keeps working and sends the changes when the internet is back. ---------- */
const FB_CONFIG={apiKey:"AIzaSyA_j9-62srvQvpUn7XDUGDRfVrwpIwpxC0",authDomain:"fsw-workshop-7e4ab.firebaseapp.com",projectId:"fsw-workshop-7e4ab",storageBucket:"fsw-workshop-7e4ab.firebasestorage.app",messagingSenderId:"851513368367",appId:"1:851513368367:web:764883bc15828373388bda"}; /* public app settings, not a password; the data is protected by Firestore rules */
const fbCfg=()=>window.__FB_TEST_CFG||FB_CONFIG;
const SYNC={on:false,user:null,unsub:[],last:null,dev:'',timer:0,busy:false,uiDirty:false,status:'off',err:'',pushQ:Promise.resolve(),got:0,sent:0,lastAt:0};
const syncReady=()=>!!(fbCfg()&&window.firebase&&firebase.initializeApp);
function syncDev(){if(SYNC.dev)return SYNC.dev;try{SYNC.dev=localStorage.getItem('ws_dev')||'';if(!SYNC.dev){SYNC.dev='d'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);localStorage.setItem('ws_dev',SYNC.dev);}}catch(e){SYNC.dev='d'+Math.random().toString(36).slice(2,9);}return SYNC.dev;}
let FBA=null,FBS=null;
function fbInit(){if(!syncReady())return false;if(FBA)return true;
  try{firebase.initializeApp(fbCfg());FBA=firebase.auth();FBS=firebase.firestore();
    /* no online-copy cache on the phone: the app's own locked database already keeps everything. Remove an old cache once. */
    SYNC.ready=Promise.resolve();try{if(localStorage.getItem('ws_fbc0')!=='1'&&FBS.clearPersistence)SYNC.ready=FBS.clearPersistence().then(()=>{try{localStorage.setItem('ws_fbc0','1');}catch(e){}}).catch(()=>{});}catch(e){}
    FBA.onAuthStateChanged(u=>{SYNC.user=u;if(u&&localStorage.getItem('ws_sync')==='1')syncStart();else syncStop();try{if(S.r==='settings')render();}catch(e){}});return true;}
  catch(e){SYNC.err=String(e&&e.message||e);return false;}}
/* each workshop account has its own space: ws/{account id}. Selling = each workshop signs in with its own account */
const wsRef=()=>FBS.collection('ws').doc(SYNC.user.uid);
const recDocId=key=>encodeURIComponent(key).replace(/\./g,'%2E').slice(0,1400);
/* ---- local → online ---- */
function syncSnap(){return snapshot();}
function syncPush(){if(!SYNC.on||!SYNC.user)return;clearTimeout(SYNC.timer);SYNC.timer=setTimeout(syncPushNow,400);}
function syncPushNow(){if(!SYNC.on)return SYNC.pushQ;SYNC.pushQ=SYNC.pushQ.then(async()=>{const a=SYNC.last,b=syncSnap();const ops=[];
    b.kv.forEach((v,k)=>{if(!a||a.kv.get(k)!==v)ops.push(['kv',k,v]);});if(a)a.kv.forEach((v,k)=>{if(!b.kv.has(k))ops.push(['kv',k,null]);});
    b.rec.forEach((v,k)=>{if(!a||a.rec.get(k)!==v)ops.push(['rec',k,v]);});if(a)a.rec.forEach((v,k)=>{if(!b.rec.has(k))ops.push(['rec',k,null]);});
    if(!ops.length)return;const ts=firebase.firestore.FieldValue.serverTimestamp(),d=syncDev();
    try{for(let i=0;i<ops.length;i+=400){const bt=FBS.batch();ops.slice(i,i+400).forEach(([t,k,v])=>{const ref=wsRef().collection(t).doc(recDocId(k));bt.set(ref,v==null?{k,del:true,t:ts,d}:{k,v,t:ts,d});});await bt.commit();}
      SYNC.last=b;syncSaveLast();SYNC.sent+=ops.length;SYNC.lastAt=Date.now();SYNC.status='ok';}
    catch(e){SYNC.status='err';SYNC.err=String(e&&e.message||e);}}).catch(()=>{});return SYNC.pushQ;}
/* ---- online → local ---- */
function applyRemote(t,k,v){
  if(SYNC.last){const m=t==='rec'?SYNC.last.rec:SYNC.last.kv;if(v==null)m.delete(k);else m.set(k,v);}
  if(t==='rec'){const [c,id]=k.split('\u0001');if(!REC_KEYS.includes(c))return;const arr=DB[c]=DB[c]||[];const i=arr.findIndex(x=>String(x.id||x._k)===id);
    if(v==null){if(i>=0)arr.splice(i,1);}else{const o=JSON.parse(v);if(i>=0)arr[i]=o;else arr.push(o);}}
  else if(k.startsWith('#order:')){const c=k.slice(7);if(v==null)return;const ids=JSON.parse(v),arr=DB[c]||[],by=new Map(arr.map(x=>[String(x.id||x._k),x]));
    const out=ids.map(id=>by.get(id)).filter(Boolean);arr.forEach(x=>{if(!ids.includes(String(x.id||x._k)))out.push(x);});DB[c]=out;}
  else{const val=v==null?undefined:JSON.parse(v);
    if(k==='ws'&&val&&DB.ws&&(+val.resetAt||0)<=(+DB.ws.resetAt||0)){val.nextInv=Math.max(+val.nextInv||0,+DB.ws.nextInv||0);val.nextJob=Math.max(+val.nextJob||0,+DB.ws.nextJob||0);}
    if(val===undefined)delete DB[k];else DB[k]=val;}}
const tsGet=()=>{try{return +localStorage.getItem('ws_sync_ts')||0;}catch(e){return 0;}};
const tsSet=v=>{try{if(v>tsGet())localStorage.setItem('ws_sync_ts',String(v));}catch(e){}};
/* only changes since the last time this phone looked (keeps Firebase free-plan reads low) */
function syncListen(){syncUnlisten();SYNC.unsub.push(wsRef().collection('meta').onSnapshot(qs=>{qs.forEach(d=>{if(d.id==='reset'){const at=+((d.data()||{}).at)||0;if(at>sinceGet()&&DB.ws)wipeLocal(T_('All data was deleted from another device. Sign in again or set up the workshop.'));}});},()=>{}));const since=firebase.firestore.Timestamp.fromMillis(Math.max(0,tsGet()-120000));
  ['kv','rec'].forEach(t=>{SYNC.unsub.push(wsRef().collection(t).where('t','>',since).onSnapshot(qs=>{let n=0;const me=syncDev();
    qs.docChanges().forEach(ch=>{const x=ch.doc.data();if(ch.type==='removed'||ch.doc.metadata.hasPendingWrites)return;if(x.t&&x.t.toMillis)tsSet(x.t.toMillis());if(x.d===me)return;if(SYNC.last&&SYNC.last[t]&&SYNC.last[t].get(x.k)==='\u0000old'&&x.k!=='ws')return;
      applyRemote(t,x.k,x.del?null:x.v);n++;});
    if(!n)return;SYNC.got+=n;SYNC.lastAt=Date.now();SYNC.status='ok';{const ch=fixDupNumbers();_flushNow0();syncSaveLast();if(ch)syncPush();}uiRefresh();},e=>{SYNC.status='err';SYNC.err=String(e&&e.message||e);}));});}
function syncUnlisten(){SYNC.unsub.forEach(f=>{try{f();}catch(e){}});SYNC.unsub=[];}
function uiRefresh(){const busy=S.sheet||(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));if(busy){SYNC.uiDirty=true;return;}try{render();}catch(e){}}
setInterval(()=>{if(SYNC.uiDirty&&!S.sheet&&!(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))){SYNC.uiDirty=false;try{render();}catch(e){}}},1200);
/* ---- start / stop ---- */
const sinceGet=()=>{try{return +localStorage.getItem('ws_sync_since')||0;}catch(e){return 0;}};
const sinceSet=()=>{try{localStorage.setItem('ws_sync_since',String(Date.now()));}catch(e){}};
async function resetAt(){try{const r=await wsRef().collection('meta').doc('reset').get();return r.exists?(+((r.data()||{}).at)||0):0;}catch(e){return 0;}}
/* the workshop was deleted from another device: this device's copy belongs to the deleted workshop, so it is removed too */
async function wipeLocal(msg){syncStop();try{['ws_sync','ws_sync_seeded','ws_sync_last','ws_sync_ts','ws_sync_since'].forEach(k=>localStorage.removeItem(k));}catch(e){}
  try{await FBA.signOut();}catch(e){}try{localStorage.removeItem(KEY);}catch(e){}DB=blankDB();save();await flushNow();S.user=null;Object.assign(OB,{step:0,name:'',phone:'',addr:'',owner:'',pin:'',pin1:''});closeSheet();render();if(msg)toast(msg);}
async function syncStart(){if(SYNC.on||!SYNC.user)return;SYNC.on=true;try{await SYNC.ready;}catch(e){}SYNC.status='starting';SYNC.last=null;
  try{const ra=await resetAt();
    if(ra&&ra>sinceGet()&&DB.ws){await wipeLocal(T_('All data was deleted from another device. Sign in again or set up the workshop.'));return;}
    const any=await wsRef().collection('kv').limit(1).get(),seeded=localStorage.getItem('ws_sync_seeded')==='1';
    if(any.empty){if(DB.ws){SYNC.last=null;await syncPushNow();sinceSet();}}   /* online copy is empty: send everything from this device */
    else if(!seeded){await syncPull();sinceSet();}                              /* first time on this device: take the online data */
    else{SYNC.last=syncLoadLast();await syncCatchUp();await syncPushNow();}
    localStorage.setItem('ws_sync_seeded','1');
    syncListen();SYNC.status='ok';}catch(e){SYNC.status='err';SYNC.err=String(e&&e.message||e);}
  try{if(S.r==='settings')render();}catch(e){}}
/* on start: take what other phones changed while this one was closed BEFORE sending, so old copies do not overwrite newer ones */
async function syncCatchUp(){const since=firebase.firestore.Timestamp.fromMillis(Math.max(0,tsGet()-120000));const me=syncDev();let n=0;
  for(const t of ['kv','rec']){const q=await wsRef().collection(t).where('t','>',since).get();const L=SYNC.last&&SYNC.last[t];q.forEach(doc=>{const x=doc.data();if(x.t&&x.t.toMillis)tsSet(x.t.toMillis());if(x.d===me)return;if(L&&L.get(x.k)==='\u0000old'&&x.k!=='ws')return;/* changed here while offline: this phone's change is sent */applyRemote(t,x.k,x.del?null:x.v);n++;});}
  if(n){SYNC.got+=n;const ch=fixDupNumbers();_flushNow0();syncSaveLast();if(ch)syncPush();}}
/* two phones can give the same invoice or job number while apart. The phone that made the later one renumbers its own. */
function fixDupNumbers(){const me=syncDev();let ch=0;
  const fix=(list,get,setNo,label)=>{const by={};list.forEach(j=>{const k=get(j);if(k)(by[k]=by[k]||[]).push(j);});
    Object.values(by).forEach(L=>{if(L.length<2)return;const tt=j=>label==='Invoice'?(j.inv.t||j.t):j.t;L.sort((a,b)=>(tt(a)-tt(b))||String(a.id).localeCompare(String(b.id)));L.slice(1).forEach(j=>{if(j.dev===me||(j.inv&&j.inv.dev===me&&label==='Invoice')){const old=get(j);setNo(j);(j.log=j.log||[]).push([now(),label+' number changed from '+old+' (the same number was used on another phone)']);ch++;}});});};
  const mxI=()=>DB.jobs.reduce((m,j)=>j.inv?Math.max(m,+j.inv.no||0):m,0),mxJ=()=>DB.jobs.reduce((m,j)=>Math.max(m,+j.no||0),0);
  fix(DB.jobs.filter(j=>j.inv&&!j.inv.void),j=>j.inv.no,j=>{DB.ws.nextInv=Math.max(+DB.ws.nextInv||1,mxI()+1);j.inv.no=DB.ws.nextInv++;},'Invoice');
  fix(DB.jobs,j=>j.no,j=>{DB.ws.nextJob=Math.max(+DB.ws.nextJob||1,mxJ()+1);j.no=DB.ws.nextJob++;},'Job');
  return ch;}
function syncStop(){SYNC.on=false;syncUnlisten();if(SYNC.status!=='err')SYNC.status='off';}
/* replace this phone's data with the online data */
async function syncPull(){const d=blankDB();const kv=await wsRef().collection('kv').get(),rec=await wsRef().collection('rec').get();const by={};let mx=0;[kv,rec].forEach(q=>q.forEach(doc=>{const t=doc.data().t;if(t&&t.toMillis)mx=Math.max(mx,t.toMillis());}));
  rec.forEach(doc=>{const x=doc.data();if(x.del)return;const [c,id]=x.k.split('\u0001');(by[c]=by[c]||new Map()).set(id,JSON.parse(x.v));});
  kv.forEach(doc=>{const x=doc.data();if(x.del||x.k.startsWith('#order:'))return;d[x.k]=JSON.parse(x.v);});
  kv.forEach(doc=>{const x=doc.data();if(x.del||!x.k.startsWith('#order:'))return;const c=x.k.slice(7),m=by[c]||new Map(),ids=JSON.parse(x.v);d[c]=ids.map(id=>m.get(id)).filter(Boolean);m.forEach((o,id)=>{if(!ids.includes(id))d[c].push(o);});});
  Object.keys(by).forEach(c=>{if(!d[c]||!d[c].length)d[c]=[...by[c].values()];});
  if(!d.ws)throw new Error('No workshop online yet');DB=d;SYNC.last=syncSnap();syncSaveLast();tsSet(mx);flushNow();S.user=null;render();}
/* remember what was last sent (as short hashes) so changes made offline, even after closing the app, still go online */
const h32=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
function syncSaveLast(){try{if(!SYNC.last)return;const o={kv:{},rec:{}};SYNC.last.kv.forEach((v,k)=>o.kv[k]=h32(v));SYNC.last.rec.forEach((v,k)=>o.rec[k]=h32(v));localStorage.setItem('ws_sync_last',JSON.stringify(o));}catch(e){}}
function syncLoadLast(){try{const o=JSON.parse(localStorage.getItem('ws_sync_last')||'null');if(!o)return null;const cur=syncSnap(),kv=new Map(),rec=new Map();
    Object.keys(o.kv).forEach(k=>{const v=cur.kv.get(k);kv.set(k,v!=null&&h32(v)===o.kv[k]?v:'\u0000old');});Object.keys(o.rec).forEach(k=>{const v=cur.rec.get(k);rec.set(k,v!=null&&h32(v)===o.rec[k]?v:'\u0000old');});return {kv,rec};}catch(e){return null;}}
/* hook: every local save also goes online */
const _flushNow0=flushNow;flushNow=function(){const r=_flushNow0();try{syncPush();}catch(e){}return r;};
/* ---- settings screen part ---- */
function syncSection(){
  if(!fbCfg())return `<p class="hint">☁️ Online sync is not set up yet. It needs the workshop's Firebase project.</p>`;
  if(!SYNC.user)return `<p class="hint">Sign in with the workshop account on each phone. After that, all phones share the same customers, jobs, stock and services.</p><p class="hint">If the online copy already has data, this phone's data is replaced by it.</p><input class="field" id="syem" type="email" placeholder="Workshop email" autocomplete="username"><input class="field" id="sypw" type="password" placeholder="Workshop password" autocomplete="current-password"><button class="btn" id="syin">☁️ Sign in and sync</button><p class="err" id="syer"></p>`;
  const st={ok:'✅ Synced',starting:'⏳ Starting…',err:'⚠️ Problem: '+esc(SYNC.err),off:'⏸ Off'}[SYNC.status]||SYNC.status;
  return `<div class="card"><div class="h"><b>${st}</b><span>${esc(SYNC.user.email||'')}</span></div><span class="sub">${SYNC.lastAt?'Last change '+fmtDs(SYNC.lastAt)+' · ':''}sent ${SYNC.sent} · received ${SYNC.got}</span></div>
   <div class="two"><button class="btn ghost sm" id="syre">🔄 Sync now</button><button class="btn ghost sm" id="syout">Sign out</button></div>
   <label class="chk"><input type="checkbox" id="symst" ${DB.ws.mainStockOff?'':'checked'}> Daily update from the main system: take the stock too</label>${DB.ws.mainAt?`<p class="hint">Last daily update ${fmtDs(DB.ws.mainAt)}</p>`:''}`;}
function syncBind(){const i=$('#syin');if(i)i.onclick=async()=>{const em=$('#syem').value.trim(),pw=$('#sypw').value;if(!em||!pw)return;if(!fbInit())return;
    try{localStorage.setItem('ws_sync','1');['ws_sync_seeded','ws_sync_last','ws_sync_ts'].forEach(k=>localStorage.removeItem(k));sinceSet();await FBA.signInWithEmailAndPassword(em,pw);audit('settings','Online sync signed in');toast('Signed in. Syncing…');}catch(e){$('#syer').textContent='Could not sign in: '+(e&&e.code||e);}};
  const ms=$('#symst');if(ms)ms.onchange=e=>{DB.ws.mainStockOff=!e.target.checked;save();};
  const r=$('#syre');if(r)r.onclick=async()=>{await syncPushNow();toast('Synced');render();};
  const o=$('#syout');if(o)o.onclick=()=>confirmSheet('Sign out of online sync on this phone? The data stays on the phone.','Sign out',async()=>{localStorage.setItem('ws_sync','0');syncStop();await FBA.signOut();render();});}
/* delete everything in this workshop's online space, then sign this phone out */
async function syncWipeCloud(){if(!SYNC.user||!FBS)return 0;syncStop();let n=0;
  for(const c of ['kv','rec']){for(;;){const q=await wsRef().collection(c).limit(400).get();if(q.empty)break;const bt=FBS.batch();q.forEach(d=>bt.delete(d.ref));await bt.commit();n+=q.size;}}
  await wsRef().collection('meta').doc('reset').set({at:Date.now(),t:firebase.firestore.FieldValue.serverTimestamp(),d:syncDev()});
  try{['ws_sync','ws_sync_seeded','ws_sync_last','ws_sync_ts','ws_sync_since'].forEach(k=>localStorage.removeItem(k));}catch(e){}
  SYNC.last=null;try{await FBA.signOut();}catch(e){}return n;}
/* first screen of a new phone/tablet: join an existing workshop by signing in (no local workshop yet) */
function joinSheet(){if(!fbInit()){toast('Online sync is not available');return;}
  openSheet(`<h3>☁️ Sign in to your workshop</h3><p class="hint">Use the workshop account. Customers, jobs, stock and services come from the online copy.</p><input class="field" id="jem" type="email" placeholder="Workshop email" autocomplete="username"><input class="field" id="jpw" type="password" placeholder="Workshop password" autocomplete="current-password"><button class="btn" id="jgo">Sign in</button><p class="err" id="jer"></p>`,el=>{
    el.querySelector('#jgo').onclick=async()=>{const em=el.querySelector('#jem').value.trim(),pw=el.querySelector('#jpw').value,er=el.querySelector('#jer');if(!em||!pw)return;
      er.textContent='';const bt=el.querySelector('#jgo');bt.disabled=true;bt.textContent=T_('Signing in…');
      try{try{localStorage.setItem('ws_sync','0');}catch(e){}await SYNC.ready;await FBA.signInWithEmailAndPassword(em,pw);
        const any=await wsRef().collection('kv').limit(1).get();
        if(any.empty){await FBA.signOut();throw {code:T_('This account has no workshop online yet. Set up the workshop on the main phone and turn on online sync there first.')};}
        await syncPull();sinceSet();try{localStorage.setItem('ws_sync_seeded','1');localStorage.setItem('ws_sync','1');}catch(e){}
        closeSheet();SYNC.on=false;syncStart();audit('settings','Joined the workshop by online sign-in');toast('Signed in. Choose your name.');render();}
      catch(e){bt.disabled=false;bt.textContent=T_('Sign in');er.textContent=(e&&e.code&&String(e.code).startsWith('auth/'))?T_('Wrong email or password.'):String(e&&e.code||e&&e.message||e);}};});}
function syncBoot(){if(!fbCfg())return;try{if(localStorage.getItem('ws_sync')==='1')fbInit();}catch(e){}}
/* ---------- daily update from the main shop system: prices, costs and stock of parts (matched by part number) ----------
   o.parts = [[num,name,cat,unit,price,cost,stock,reorder], …]. New part numbers are added. Nothing is deleted. */
function mainUpdate(o){if(!o||!Array.isArray(o.parts))return {err:'bad data'};const norm=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,'');
  const byNum=new Map(),byName=new Map();DB.parts.forEach(p=>{if(p.num)byNum.set(norm(p.num),p);byName.set(norm(p.name),p);});
  let up=0,add=0,st=0;const takeStock=!(DB.ws&&DB.ws.mainStockOff);
  o.parts.forEach(([num,name,cat,unit,price,cost,stock,reorder])=>{let p=(num&&byNum.get(norm(num)))||byName.get(norm(name));
    if(!p){p={id:uid('p'),t:now(),name,num:num||'',cat:cat||'Other',unit:unit||'pc',price:+price||0,cost:+cost||0,stock:+stock||0,reorder:+reorder||0};DB.parts.push(p);if(p.cat&&!DB.pcats.includes(p.cat))DB.pcats.push(p.cat);add++;return;}
    let ch=0;if(+price>0&&+p.price!==+price){p.price=+price;ch=1;}if(cost!=null&&+p.cost!==+cost){p.cost=+cost;ch=1;}if(reorder!=null&&+p.reorder!==+reorder){p.reorder=+reorder;ch=1;}
    if(takeStock&&stock!=null&&Math.abs((+p.stock||0)-(+stock))>1e-9){const d=+stock-(+p.stock||0);p.stock=+stock;(DB.moves=DB.moves||[]).push({t:now(),part:p.id,q:Math.round(d*100)/100,why:'Daily update',ref:'',by:'auto',bal:p.stock});st++;ch=1;}
    if(ch)up++;});
  DB.ws.mainAt=now();audit('import','Daily update: '+up+' parts changed ('+st+' stock), '+add+' new');save();try{render();}catch(e){}return {changed:up,stock:st,added:add};}
