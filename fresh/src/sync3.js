/* ---------- SYNC v3 (switch: localStorage ws_sync3 = 1) ----------
   The online copy decides. Every change made here becomes an OPERATION: one record, how it was before and after.
   An operation is sent inside a transaction that reads the online record and applies ONLY what changed here
   (three-way merge), so a newer change made on another device is never undone and an old copy can never come back.
   Unsent operations stay on the device (outbox) and survive closing the app. Nothing is ever sent "all again".
   What comes from online is laid over by this device's unsent operations, so nothing typed here disappears. */
const S3={on:false,seen:null,out:[],busy:false,inflight:null,retry:0,timer:0,saveT:0,sent:0,got:0,okAt:0};
const sync3On=()=>{try{return localStorage.getItem('ws_sync3')==='1';}catch(e){return false;}};
/* a trial can use its own collections (rec_t3 / kv_t3) next to the real ones */
const S3C=t=>{let p='';try{p=localStorage.getItem('ws_sync3_col')||'';}catch(e){}return t+p;};
const S3isObj=x=>x&&typeof x==='object'&&!Array.isArray(x);
/* b = before (here), m = after (here), s = online now. Only what changed here is applied to the online value. */
function merge3(b,m,s,key){const J=JSON.stringify;
  if(J(m)===J(b))return s;if(s===undefined&&b===undefined)return m;if(J(s)===J(b))return m;if(J(m)===J(s))return m;
  /* stock: both devices took parts out → both counts are kept (online + what changed here) */
  if(key==='stock'&&typeof m==='number'&&typeof s==='number'&&typeof b==='number')return Math.round((s+(m-b))*1000)/1000;
  if((key==='nextInv'||key==='nextJob')&&typeof m==='number'&&typeof s==='number')return Math.max(m,s);
  if(Array.isArray(m)&&Array.isArray(s))return m3list(Array.isArray(b)?b:[],m,s);
  if(S3isObj(m)&&S3isObj(s)){const B=S3isObj(b)?b:{},o={};new Set([...Object.keys(s),...Object.keys(m),...Object.keys(B)]).forEach(k=>{const v=merge3(B[k],m[k],s[k],k);if(v!==undefined)o[k]=v;});return o;}
  return m;}
const S3P=v=>v==null?undefined:JSON.parse(v);
/* ---- outbox ---- */
function s3SaveNow(){clearTimeout(S3.saveT);try{metaPut('outbox3',JSON.stringify(S3.out)).catch(()=>{});}catch(e){}}
function s3Save(){clearTimeout(S3.saveT);S3.saveT=setTimeout(()=>{metaPut('outbox3',JSON.stringify(S3.out)).catch(()=>{});},150);}
/* the outbox kept on the device is read once, when the app opens (later it lives in memory and is written back) */
async function s3LoadOut(){if(S3.loaded)return;S3.loaded=1;let L=[];try{L=JSON.parse((await metaGet('outbox3'))||'[]')||[];}catch(e){L=[];}if(L.length)S3.out=L.concat(S3.out);}
function s3Add(t,k,b,m){/* the same record changed again before it was sent: one operation, from the first "before" to the last "after" */
  for(let i=S3.out.length-1;i>=0;i--){const o=S3.out[i];if(o.t===t&&o.k===k&&o!==S3.inflight){o.m=m;s3Save();return;}}
  S3.out.push({t,k,b,m,at:Date.now()});s3Save();}
/* what changed here since last time → operations */
function s3Diff(){const snap=snapshot();if(!S3.seen){S3.seen=snap;return 0;}let n=0;
  ['kv','rec'].forEach(t=>{const a=S3.seen[t],b=snap[t];b.forEach((v,k)=>{const o=a.get(k);if(o!==v){s3Add(t,k,o==null?null:o,v);n++;}});a.forEach((v,k)=>{if(!b.has(k)){s3Add(t,k,v,null);n++;}});});
  S3.seen=snap;return n;}
/* ---- sending ---- */
function s3Timeout(p,ms){let to;return Promise.race([p,new Promise((_,no)=>{to=setTimeout(()=>no(new Error('send timeout')),ms);})]).finally(()=>clearTimeout(to));}
async function s3Tx(op){const ref=wsRef().collection(S3C(op.t)).doc(recDocId(op.k)),ts=firebase.firestore.FieldValue.serverTimestamp(),d=syncDev();
  await FBS.runTransaction(async tr=>{const doc=await tr.get(ref);const x=doc.exists?doc.data():null;const sv=x&&!x.del?x.v:null;let out;
    if(op.m==null)out=null;                              /* deleted here */
    else if(sv==null)out=(x&&x.del&&op.b!=null)?undefined:op.m;   /* new here → as is; deleted online while changed here → stays deleted */
    else out=JSON.stringify(merge3(S3P(op.b),JSON.parse(op.m),JSON.parse(sv)));
    op.out=out===undefined?sv:out;if(out===undefined||(out===sv&&sv!=null)||(out==null&&sv==null))return;
    if(out&&out.length+op.k.length>9e5)throw new Error('too large: '+op.k.split('\u0001')[0]);
    tr.set(ref,out==null?{k:op.k,del:true,t:ts,d}:{k:op.k,v:out,t:ts,d});});}
function s3Status(){const n=S3.out.length;if(!S3.on)return;if(n){if(SYNC.status==='ok')SYNC.status='sending';}else if(SYNC.status!=='err'||!S3.retry)SYNC.status='ok';}
async function s3Send(){if(S3.busy||!S3.on||!SYNC.user)return;S3.busy=true;let sent=0;
  try{while(S3.on&&S3.out.length){const op=S3.out[0];S3.inflight=op;
      try{await s3Timeout(s3Tx(op),SYNC.commitMs||25000);}
      catch(e){const msg=String(e&&e.message||e);
        if(/too large/.test(msg)){trail('SYNC-ERR','send: '+msg);S3.out.shift();continue;}
        SYNC.status='err';SYNC.err=msg;trail('SYNC-ERR','send: '+msg);S3.retry=Math.min(60000,(S3.retry||2500)*2);
        if(/send timeout/.test(msg)){try{await FBS.disableNetwork();await FBS.enableNetwork();}catch(x){}}
        clearTimeout(S3.timer);S3.timer=setTimeout(()=>s3Send(),S3.retry);break;}
      S3.inflight=null;S3.out.shift();s3Save();sent++;S3.retry=0;
      /* this device now holds what is online for that record (+ anything still waiting) */
      try{if(s3Apply(op.t,op.k,op.out==null?null:op.out))flushNow();}catch(e){}}
  }finally{S3.inflight=null;S3.busy=false;}
  if(sent){S3.sent+=sent;SYNC.sent=(SYNC.sent||0)+sent;SYNC.lastAt=Date.now();trail('sync','sent '+sent);}
  if(!S3.out.length){SYNC.status='ok';SYNC.err='';S3.okAt=Date.now();}try{syncBadge();}catch(e){}}
/* changes are turned into operations ALWAYS (also while not connected or stopped), so an offline change is never forgotten */
function s3PushNow(){if(S3.seen&&!S3.diffed)s3Diff();S3.diffed=0;if(!S3.on)return Promise.resolve();s3Status();s3Send();return Promise.resolve();}
/* ---- receiving: online value, with this device's unsent operations laid over it ---- */
function s3Local(t,k,v,mine){let val=v;S3.out.forEach(op=>{if(op.t!==t||op.k!==k)return;if(mine&&op===S3.inflight)return;/* my own write already holds it */
    if(op.m==null)val=null;else if(val==null)val=op.b==null?op.m:val;else val=JSON.stringify(merge3(S3P(op.b),JSON.parse(op.m),JSON.parse(val)));});return val;}
function s3Put(t,k,val){
  if(t==='rec'){const [c,id0]=k.split('\u0001');if(!REC_KEYS.includes(c))return false;const id=String(id0).replace(/#\d+$/,'');const arr=DB[c]=DB[c]||[];const i=arr.findIndex(x=>String(x.id||x._k)===id);
    if(val==null){if(i<0)return false;arr.splice(i,1);return true;}
    const o=JSON.parse(val);if(i>=0){const cur=arr[i];if(JSON.stringify(cur)===val)return false;
      /* same object kept (an open screen holds it): fields replaced in place */
      Object.keys(cur).forEach(f=>{delete cur[f];});Object.assign(cur,o);try{SNAPC.delete(cur);}catch(e){}}else arr.push(o);return true;}
  if(k.startsWith('#order:')){const c=k.slice(7);if(val==null||!REC_KEYS.includes(c))return false;const ids=JSON.parse(val),arr=DB[c]||[],by=new Map(arr.map(x=>[String(x.id||x._k),x]));
    const out=ids.map(id=>by.get(id)).filter(Boolean);arr.forEach(x=>{if(!ids.includes(String(x.id||x._k)))out.push(x);});DB[c]=out;return true;}
  if(REC_KEYS.includes(k))return false;
  if(val==null){if(!(k in DB))return false;delete DB[k];return true;}
  const o=JSON.parse(val);if(JSON.stringify(DB[k])===val)return false;
  if(S3isObj(o)&&S3isObj(DB[k])){const cur=DB[k];Object.keys(cur).forEach(f=>{delete cur[f];});Object.assign(cur,o);}else DB[k]=o;return true;}
function s3Apply(t,k,v,mine){const val=s3Local(t,k,v,mine);const ch=s3Put(t,k,val);
  /* what is now here counts as seen: it is not a change made here */
  if(S3.seen){const m=S3.seen[t];if(val==null)m.delete(k);else m.set(k,val);
    if(t==='rec'&&ch){const c=k.split('\u0001')[0];const ok='#order:'+c,arr=DB[c]||[];m===S3.seen.rec&&S3.seen.kv.set(ok,JSON.stringify(arr.map(x=>String(x.id||x._k))));}}
  return ch;}
function s3Docs(t,docs){let n=0;docs.forEach(x=>{if(x.t&&x.t.toMillis)tsSet(x.t.toMillis());if(!x.k)return;if(s3Apply(t,x.k,x.del?null:x.v,x.d===syncDev()))n++;});return n;}
function s3After(n,how){if(!n)return;S3.got+=n;SYNC.got=(SYNC.got||0)+n;SYNC.lastAt=SYNC.gotAt=Date.now();trail('sync',how+' '+n);
  const ch=fixDupNumbers();flushNow();if(ch)s3PushNow();try{uiRefresh();}catch(e){}}
async function s3CatchUp(){const since=firebase.firestore.Timestamp.fromMillis(Math.max(0,tsGet()-120000));let n=0;
  for(const t of ['kv','rec']){const q=await wsRef().collection(S3C(t)).where('t','>',since).get();const L=[];q.forEach(d=>L.push(d.data()));n+=s3Docs(t,L);}
  s3After(n,'catch-up got');}
function s3Listen(){syncUnlisten();
  SYNC.unsub.push(wsRef().collection('meta').onSnapshot(qs=>{qs.forEach(d=>{if(d.id==='reset'){const at=+((d.data()||{}).at)||0;if(at>sinceGet()&&DB.ws)wipeLocal(T_('All data was deleted from another device. Sign in again or set up the workshop.'));}});},()=>{}));
  const since=firebase.firestore.Timestamp.fromMillis(Math.max(0,tsGet()-120000));
  ['kv','rec'].forEach(t=>{SYNC.unsub.push(wsRef().collection(S3C(t)).where('t','>',since).onSnapshot(qs=>{const L=[];
      qs.docChanges().forEach(ch=>{if(ch.type==='removed'||(ch.doc.metadata&&ch.doc.metadata.hasPendingWrites))return;L.push(ch.doc.data());});
      const n=s3Docs(t,L);if(SYNC.status==='err'&&!S3.retry)SYNC.status=S3.out.length?'sending':'ok';s3After(n,'got');},
    e=>{SYNC.status='err';SYNC.err=String(e&&e.message||e);trail('SYNC-ERR','listen '+t+': '+SYNC.err);syncRelisten(5000);}));});}
/* first time on this device: take the online data as it is */
async function s3Pull(){const d=blankDB();const kv=await wsRef().collection(S3C('kv')).get(),rec=await wsRef().collection(S3C('rec')).get();const by={};let mx=0;
  [kv,rec].forEach(q=>q.forEach(doc=>{const t=doc.data().t;if(t&&t.toMillis)mx=Math.max(mx,t.toMillis());}));
  rec.forEach(doc=>{const x=doc.data();if(x.del)return;const [c,id]=x.k.split('\u0001');(by[c]=by[c]||new Map()).set(id,JSON.parse(x.v));});
  kv.forEach(doc=>{const x=doc.data();if(x.del||x.k.startsWith('#order:'))return;d[x.k]=JSON.parse(x.v);});
  kv.forEach(doc=>{const x=doc.data();if(x.del||!x.k.startsWith('#order:'))return;const c=x.k.slice(7),m=by[c]||new Map(),ids=JSON.parse(x.v);d[c]=ids.map(id=>m.get(id)).filter(Boolean);m.forEach((o,id)=>{if(!ids.includes(id))d[c].push(o);});});
  Object.keys(by).forEach(c=>{if(!d[c]||!d[c].length)d[c]=[...by[c].values()];});
  if(!d.ws)throw new Error('No workshop online yet');DB=d;S3.out=[];s3Save();S3.seen=snapshot();tsSet(mx);flushNow();S.user=null;render();}
async function s3Start(){if(SYNC.on||!SYNC.user)return;SYNC.on=true;S3.on=true;try{await SYNC.ready;}catch(e){}SYNC.status='starting';SYNC.startAt=Date.now();trail('sync','start v3');
  try{await s3LoadOut();
    const ra=await resetAt();if(ra&&ra>sinceGet()&&DB.ws){await wipeLocal(T_('All data was deleted from another device. Sign in again or set up the workshop.'));return;}
    const any=await wsRef().collection(S3C('kv')).limit(1).get(),seeded=localStorage.getItem('ws_sync_seeded')==='1';
    if(!S3.seen)S3.seen=snapshot();else s3Diff();
    /* moving from the old way: records it had not sent yet become operations (once) */
    if(seeded&&localStorage.getItem('ws_sync3_mig')!=='1'){try{const L=await syncLoadLast();if(L)['kv','rec'].forEach(t=>L[t].forEach((v,k)=>{if(v==='\u0000old'){const cur=S3.seen[t].get(k);if(cur!=null)s3Add(t,k,null,cur);}else if(v==='\u0000gone')s3Add(t,k,null,null);}));}catch(e){}localStorage.setItem('ws_sync3_mig','1');}
    if(any.empty){if(DB.ws){['kv','rec'].forEach(t=>S3.seen[t].forEach((v,k)=>s3Add(t,k,null,v)));sinceSet();}}
    else if(!seeded){await s3Pull();sinceSet();}
    else await s3CatchUp();
    localStorage.setItem('ws_sync_seeded','1');localStorage.setItem('ws_sync3_mig','1');try{localStorage.setItem('ws_sync_em',SYNC.user.email||'');}catch(e){}
    s3Listen();SYNC.status=S3.out.length?'sending':'ok';trail('sync','started v3 in '+Math.round((Date.now()-SYNC.startAt)/1000)+' s · '+S3.out.length+' to send');s3Send();}
  catch(e){SYNC.status='err';SYNC.err=String(e&&e.message||e);trail('SYNC-ERR','start: '+SYNC.err);S3.on=true;s3Send();}
  try{if(S.r==='settings')render();}catch(e){}}
function s3Stop(){SYNC.on=false;S3.on=false;syncUnlisten();clearTimeout(S3.timer);if(SYNC.status!=='err')SYNC.status='off';}
if(sync3On()){/* what the device holds when the app opens is the starting point: later changes become operations */
  const _si=storeInit;storeInit=async function(){const r=await _si.apply(this,arguments);try{await s3LoadOut();if(!S3.seen)S3.seen=snapshot();}catch(e){}return r;};
  syncPush=function(){try{if(S3.seen){if(s3Diff())s3SaveNow();S3.diffed=1;}}catch(e){}clearTimeout(SYNC.timer);SYNC.timer=setTimeout(syncPushNow,400);};
  window.addEventListener('pagehide',()=>s3SaveNow());document.addEventListener('visibilitychange',()=>{if(document.hidden)s3SaveNow();});syncStart=s3Start;syncStop=s3Stop;syncPull=s3Pull;syncPushNow=s3PushNow;syncListen=s3Listen;syncCatchUp=s3CatchUp;
  /* a send waiting for a retry goes again as soon as the app or the internet is back */
  window.addEventListener('online',()=>{S3.retry=0;s3Send();});document.addEventListener('visibilitychange',()=>{if(!document.hidden){S3.retry=0;s3Send();}});}
