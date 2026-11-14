/* ---------- TRAIL: what each device did, step by step — every tap (which button, on which screen), every screen it went to,
   every message and error, and how the online sync was doing. So when someone says "something went wrong", we can read
   what happened instead of asking for every detail. Kept on the device (last 1500 steps) and online (30 days, in ws/{uid}/trail,
   never in the shop data that syncs). NOT kept: what is typed in the boxes (only which box), the PIN keys, passwords. ---------- */
const TRAIL={buf:[],q:[],max:1500,up:0,tm:0};
(function(){try{TRAIL.buf=JSON.parse(localStorage.getItem('ws_trail')||'[]');}catch(e){}try{TRAIL.q=JSON.parse(localStorage.getItem('ws_trail_q')||'[]');}catch(e){}
  if(!Array.isArray(TRAIL.buf))TRAIL.buf=[];if(!Array.isArray(TRAIL.q))TRAIL.q=[];})();
function trSave(){try{localStorage.setItem('ws_trail',JSON.stringify(TRAIL.buf));localStorage.setItem('ws_trail_q',JSON.stringify(TRAIL.q));}catch(e){}}
function trScr(){try{let s=S.r||'';const id=S.p&&S.p.id;if(id){const j=byId('jobs',id);s+=j?' #'+j.no+(j.inv?' inv'+j.inv.no:'')+' '+id:' '+id;}if(S.sheet||document.getElementById('sheet'))s+=' [sheet]';return s;}catch(e){return '';}}
function trail(k,txt){try{const e=[Date.now(),k,String(txt==null?'':txt).replace(/\s+/g,' ').trim().slice(0,180),trScr(),(S.user&&S.user.name)||''];
  TRAIL.buf.push(e);TRAIL.q.push(e);if(TRAIL.buf.length>TRAIL.max)TRAIL.buf.splice(0,TRAIL.buf.length-TRAIL.max);if(TRAIL.q.length>4000)TRAIL.q.splice(0,TRAIL.q.length-4000);
  clearTimeout(TRAIL.tm);TRAIL.tm=setTimeout(trSave,800);}catch(x){}}
/* the name of what was tapped: its id, its data-…, and its words (never the value typed in a box) */
function trLabel(el){const a=[];if(el.id)a.push('#'+el.id);
  if(el.dataset)Object.keys(el.dataset).slice(0,3).forEach(k=>a.push(k+'='+String(el.dataset[k]).slice(0,40)));
  const tag=el.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'){const l=el.closest('label');a.push((el.type||tag.toLowerCase())+(el.placeholder?' «'+el.placeholder.slice(0,30)+'»':'')+(l?' «'+(l.innerText||'').slice(0,40)+'»':''));if(el.type==='checkbox')a.push(el.checked?'☑':'☐');}
  else{const t=(el.getAttribute('aria-label')||el.innerText||el.title||'').replace(/\s+/g,' ').trim();if(t)a.push('«'+t.slice(0,60)+'»');}
  return a.join(' ');}
document.addEventListener('click',e=>{try{const t=e.target;if(!t||!t.closest)return;
  if(t.closest('.key,.pin,.pinpad,#pin,.numpad .k'))return trail('tap','key');           /* PIN / number keys: never which one */
  let el=t.closest('button,a,label,select,input,textarea,summary,[data-go],[role="button"],.mitem,.chip,.tab');
  if(!el){el=t;for(let i=0;i<4&&el&&el!==document.body;i++){if(el.dataset&&Object.keys(el.dataset).length||el.id)break;el=el.parentElement;}}
  if(!el||el===document.body)return;if((el.tagName==='INPUT'||el.tagName==='TEXTAREA')&&el.type!=='checkbox'&&el.type!=='radio')return trail('focus',trLabel(el));
  trail('tap',trLabel(el));}catch(x){}},true);
document.addEventListener('change',e=>{try{const el=e.target;if(!el||!el.tagName)return;let v='';if(el.type==='checkbox'||el.type==='radio')v=el.checked?' ☑':' ☐';else if(el.tagName==='SELECT')v=' → '+String(el.value).slice(0,30);else if(el.type==='file')v=' ('+((el.files||[]).length)+' file)';
  trail('edit',trLabel(el)+v);}catch(x){}},true);
/* screens, sheets, messages */
(function(){const G=go;window.go=go=function(r,p){trail('go',r+(p&&p.id?' '+p.id:'')+(p&&p.f?' f='+p.f:''));return G.apply(this,arguments);};
  const B=back;window.back=back=function(){trail('back','');return B.apply(this,arguments);};
  const O=openSheet;window.openSheet=openSheet=function(h){try{const m=/<h3[^>]*>([\s\S]*?)<\/h3>/.exec(h||'');trail('sheet',m?m[1].replace(/<[^>]+>/g,''):'');}catch(e){}return O.apply(this,arguments);};
  const C=closeSheet;window.closeSheet=closeSheet=function(){if(document.getElementById('sheet'))trail('sheet-close','');return C.apply(this,arguments);};
  const T=toast;window.toast=toast=function(s){trail('msg',s);return T.apply(this,arguments);};
  if(typeof confirmSheet==='function'){const K=confirmSheet;window.confirmSheet=confirmSheet=function(q){trail('ask',q);return K.apply(this,arguments);};}
  if(typeof printHtml==='function'){const P=printHtml;window.printHtml=printHtml=function(d,w,h,n){trail('print',(n||'')+' '+w+'x'+h);return P.apply(this,arguments);};}
  if(typeof shareText==='function'){const W=shareText;window.shareText=shareText=function(ph,t){trail('whatsapp',(ph?'to '+ph+' · ':'')+String(t||'').slice(0,60));return W.apply(this,arguments);};}
  if(typeof save==='function'){let last=0;const Sv=save;window.save=save=function(){const n=Date.now();if(n-last>4000){last=n;trail('save','');}return Sv.apply(this,arguments);};}})();
/* errors */
addEventListener('error',e=>trail('ERROR',(e.message||'')+' @'+String(e.filename||'').split('/').pop()+':'+(e.lineno||'')+':'+(e.colno||'')));
addEventListener('unhandledrejection',e=>{const r=e.reason;trail('ERROR','promise: '+(r&&(r.stack||r.message)||String(r)).slice(0,170));});
(function(){const E=console.error;console.error=function(){try{trail('console',Array.from(arguments).map(x=>x&&x.message||String(x)).join(' '));}catch(e){}return E.apply(this,arguments);};})();
/* the app and the network */
document.addEventListener('visibilitychange',()=>{trail(document.hidden?'app-hidden':'app-shown','');if(document.hidden){trSave();trailUp();}});
addEventListener('pagehide',()=>{trail('app-closed','');trSave();});
addEventListener('online',()=>trail('net','online'));addEventListener('offline',()=>trail('net','offline'));
trail('open','v'+(window.WS_VN||'')+' '+(window.CapApp?'app':'web')+' '+innerWidth+'x'+innerHeight);
/* online: one small document per device per 10 minutes; also the sync health of this device */
const trKey=()=>new Date(Date.now()+4*3600e3).toISOString().slice(0,16).replace(/[-T:]/g,'').slice(0,11);  /* yyyymmddhhm (Oman time, 10-minute bucket) */
async function trailUp(){if(TRAIL.up||!TRAIL.q.length)return;if(!(window.SYNC&&SYNC.on&&SYNC.user&&window.firebase))return;TRAIL.up=1;
  const part=TRAIL.q.slice(0,300);
  try{const FV=firebase.firestore.FieldValue;const ua=navigator.userAgent;
    await wsRef().collection('trail').doc(syncDev()+'_'+trKey()).set({dev:syncDev(),v:window.WS_VN||'',app:!!window.CapApp,os:/Android/.test(ua)?'Android':/iPhone|iPad/.test(ua)?'iOS':/Windows/.test(ua)?'Windows':/Mac/.test(ua)?'Mac':'other',
      scr:innerWidth+'x'+innerHeight,u:(S.user&&S.user.name)||'',t:FV.serverTimestamp(),sync:{st:SYNC.status||'',err:String(SYNC.err||'').slice(0,200),got:SYNC.got||0,lastGot:SYNC.gotAt||0,sent:SYNC.sent||0,since:(typeof tsGet==='function'?tsGet():0)},
      e:FV.arrayUnion.apply(FV,part.map(x=>JSON.stringify(x)))},{merge:true});
    TRAIL.q.splice(0,part.length);trSave();}catch(e){TRAIL.err=String(e&&e.message||e);}
  TRAIL.up=0;if(TRAIL.q.length&&!TRAIL.err)setTimeout(trailUp,3000);TRAIL.err='';
  /* once a day: this device's own steps older than 30 days are deleted */
  try{const day=trKey().slice(0,8);if(localStorage.getItem('ws_trail_gc')!==day){localStorage.setItem('ws_trail_gc',day);
    const cut=new Date(Date.now()+4*3600e3-30*864e5).toISOString().slice(0,10).replace(/-/g,'');const me=syncDev();
    const qs=await wsRef().collection('trail').orderBy(firebase.firestore.FieldPath.documentId()).startAt(me+'_').endBefore(me+'_'+cut).limit(200).get();qs.forEach(d=>d.ref.delete());}}catch(e){}}
setInterval(trailUp,90000);setTimeout(trailUp,15000);
/* 🐞 reports carry the last 60 steps */
(function(){if(typeof bugSnap!=='function')return;const BS=bugSnap;window.bugSnap=bugSnap=function(){const o=BS.apply(this,arguments);try{o.dev=syncDev();o.steps=TRAIL.buf.slice(-60).map(e=>new Date(e[0]+4*3600e3).toISOString().slice(11,19)+' '+e[1]+' '+e[2]+' | '+e[3]);}catch(e){}return o;};})();
