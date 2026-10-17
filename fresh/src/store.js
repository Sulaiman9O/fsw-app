/* ---------- STORAGE: device database (SQLite) when available, else browser storage ----------
   Data stays in the same DB object in memory. save() only marks it changed; a short moment later the
   changed records are written. In SQLite each customer, car, job, part… is its own row, so a save
   writes only what changed, and there is no 5 MB limit. */
const REC_KEYS=['customers','vehicles','jobs','parts','vendors','pos','reminders','expenses','closes','counts','users','services','canned','insp','moves','audit','outPaid','mlists','scats'];
const STORE={kind:'local',last:null,timer:0,q:Promise.resolve(),err:'',bytes:0};
const SQLP=()=>window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.CapacitorSQLite;
const SQLDB='workshop';
const sq=(fn,o)=>SQLP()[fn](Object.assign({database:SQLDB,readonly:false},o||{}));
function snapshot(){const kv=new Map(),rec=new Map();
  Object.keys(DB).forEach(k=>{const v=DB[k];
    if(REC_KEYS.includes(k)&&Array.isArray(v)){const seen=new Set();const ids=v.map((x,i)=>{if(!x||typeof x!=='object')x={_v:x};if(!x.id&&!x._k)x._k=uid('k');let id=String(x.id||x._k);if(seen.has(id))id+='#'+i;seen.add(id);rec.set(k+'\u0001'+id,JSON.stringify(x));return id;});
      kv.set('#order:'+k,JSON.stringify(ids));}
    else kv.set(k,JSON.stringify(v===undefined?null:v));});
  return {kv,rec};}
function diffSet(a,b){const set=[];
  b.kv.forEach((v,k)=>{if(!a||a.kv.get(k)!==v)set.push({statement:'INSERT OR REPLACE INTO kv(k,v) VALUES(?,?)',values:[k,v]});});
  if(a)a.kv.forEach((v,k)=>{if(!b.kv.has(k))set.push({statement:'DELETE FROM kv WHERE k=?',values:[k]});});
  b.rec.forEach((v,key)=>{if(!a||a.rec.get(key)!==v){const [c,id]=key.split('\u0001');set.push({statement:'INSERT OR REPLACE INTO rec(c,id,v) VALUES(?,?,?)',values:[c,id,v]});}});
  if(a)a.rec.forEach((v,key)=>{if(!b.rec.has(key)){const [c,id]=key.split('\u0001');set.push({statement:'DELETE FROM rec WHERE c=? AND id=?',values:[c,id]});}});
  return set;}
async function sqlOpen(){try{await SQLP().createConnection({database:SQLDB,version:1,encrypted:false,mode:'no-encryption',readonly:false});}catch(e){}
  try{await sq('open');}catch(e){}
  await sq('execute',{statements:'CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY NOT NULL, v TEXT);\nCREATE TABLE IF NOT EXISTS rec(c TEXT NOT NULL, id TEXT NOT NULL, v TEXT, PRIMARY KEY(c,id));',transaction:true,isSQL92:true});}
async function sqlRead(){const rows=r=>((r&&r.values)||[]).filter(x=>x&&!x.ios_columns);
  const kv=rows(await sq('query',{statement:'SELECT k,v FROM kv',values:[],isSQL92:true}));
  if(!kv.length)return null;
  const rec=rows(await sq('query',{statement:'SELECT c,id,v FROM rec',values:[],isSQL92:true}));
  const d=blankDB(),by={};rec.forEach(r=>{(by[r.c]=by[r.c]||{})[r.id]=r.v;});let n=0;
  kv.forEach(r=>{n+=(r.v||'').length;if(r.k.startsWith('#order:')){const c=r.k.slice(7);const ids=JSON.parse(r.v||'[]');d[c]=ids.map(id=>by[c]&&by[c][id]).filter(x=>x!=null).map(s=>{n+=s.length;return JSON.parse(s);});}else d[r.k]=JSON.parse(r.v);});
  STORE.bytes=n;return d;}
const countAll=d=>REC_KEYS.reduce((a,k)=>a+((d[k]||[]).length),0);
async function storeInit(){const flag=(()=>{try{return localStorage.getItem('ws_store');}catch(e){return null;}})();
  if(!SQLP()){if(flag==='sqlite')STORE.err='This copy of the app cannot open the device database. Install the app again from the link.';return;}
  try{await sqlOpen();const d=await sqlRead();
    if(d){DB=d;STORE.kind='sqlite';STORE.last=snapshot();
      try{const m=+localStorage.getItem('ws_moved_at')||0;if(m&&Date.now()-m>7*864e5)localStorage.removeItem(KEY+'_pre_sqlite');}catch(e){}
      return;}
    // first start with the database: move everything from browser storage into it, then check it
    STORE.kind='sqlite';const snap=snapshot();await sq('executeSet',{set:diffSet(null,snap),transaction:true,isSQL92:true});
    const back=await sqlRead();if(!back||countAll(back)!==countAll(DB)||JSON.stringify(back.ws)!==JSON.stringify(DB.ws))throw new Error('check after moving failed');
    STORE.last=snap;
    try{const old=localStorage.getItem(KEY);if(old){localStorage.setItem(KEY+'_pre_sqlite',old);localStorage.removeItem(KEY);}localStorage.setItem('ws_store','sqlite');localStorage.setItem('ws_moved_at',String(Date.now()));}catch(e){}
    if(DB.ws){audit('settings','Data moved to the device database (SQLite) · '+countAll(DB)+' records');flushNow();}
  }catch(e){if(flag==='sqlite'){STORE.err='Device database error: '+(e&&e.message||e);}else{STORE.kind='local';STORE.last=null;}}}
function save(){clearTimeout(STORE.timer);STORE.timer=setTimeout(flushNow,150);}
function flushNow(){clearTimeout(STORE.timer);
  if(STORE.err)return STORE.q;
  if(STORE.kind!=='sqlite'){try{const s=JSON.stringify(DB);localStorage.setItem(KEY,s);STORE.bytes=s.length;}catch(e){toast('Storage full. Make a locked backup now.');}return STORE.q;}
  STORE.q=STORE.q.then(async()=>{const snap=snapshot();const set=diffSet(STORE.last,snap);if(!set.length)return;
    try{for(let i=0;i<set.length;i+=400)await sq('executeSet',{set:set.slice(i,i+400),transaction:true,isSQL92:true});STORE.last=snap;}
    catch(e){toast('Could not save to the device database. Try again.');}}).catch(()=>{});return STORE.q;}
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushNow();});
window.addEventListener('pagehide',()=>flushNow());
function storeLabel(){return STORE.kind==='sqlite'?'Device database (SQLite) · '+countAll(DB)+' records':'Browser storage · '+Math.round((STORE.bytes||JSON.stringify(DB).length)/1024)+' KB of about 5,000 KB';}
