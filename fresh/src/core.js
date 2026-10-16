/* ---------- core: storage, helpers ---------- */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f3=n=>(Math.round((+n||0)*1000)/1000).toFixed(3);
const kmf=n=>(+n||0).toLocaleString('en-US');
const uid=p=>(p||'x')+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const now=()=>Date.now();
const dayKey=t=>new Date(t).toLocaleDateString('en-CA',{timeZone:'Asia/Muscat'});
const today=()=>dayKey(now());
const fmtD=t=>new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Muscat'});
const fmtDs=t=>new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'Asia/Muscat'});
const hm=t=>new Date(t).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Muscat'});
const ago=t=>{const d=Math.floor((now()-t)/864e5);return d<=0?'today':d===1?'1 day':d+' days';};
const num=v=>{const n=parseFloat(String(v).replace(/[^\d.\-]/g,''));return isNaN(n)?0:n;};
const waNum=t=>{let d=(t||'').replace(/\D/g,'');if(d.length===8)d='968'+d;return d;};
async function hashPin(pin){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('ws:'+pin));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}catch(e){return 'p:'+pin;}}
let tt;function toast(s){const t=$('#toast');t.textContent=s;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2400);}
const KEY='ws_db_v1';
function blankDB(){return {v:1,ws:null,users:[],services:[],pcats:DEFAULT_PART_CATS.slice(),ecats:DEFAULT_EXP_CATS.slice(),parts:[],vendors:[],pos:[],customers:[],vehicles:[],jobs:[],reminders:[],expenses:[],closes:[],counts:[],steps:{},canned:[],insp:JSON.parse(JSON.stringify(DEFAULT_INSP)),backups:0,openingCash:0};}
let DB=(()=>{try{const s=localStorage.getItem(KEY);if(s)return Object.assign(blankDB(),JSON.parse(s));}catch(e){}return blankDB();})();
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB));}catch(e){toast('Storage full. Make a backup and remove old photos.');}}
const COLORS=['#ee3a39','#2a78d6','#1f8f4e','#f27b21','#8b5cf6','#0ea5a4','#c2410c'];
const initials=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const ROLE={owner:'Owner',manager:'Manager',worker:'Worker'};
const can={
  cost:()=>S.user&&S.user.role==='owner',
  discount:()=>S.user&&S.user.role!=='worker',
  money:()=>S.user&&S.user.role!=='worker',
  del:()=>S.user&&S.user.role==='owner',
  settings:()=>S.user&&S.user.role==='owner',
  invoice:()=>S.user&&S.user.role!=='worker'
};
/* lookups */
const byId=(list,id)=>DB[list].find(x=>x.id===id);
const custOf=j=>byId('customers',j.cust)||{};
const vehOf=j=>byId('vehicles',j.veh)||{};
const carName=v=>v?[v.make,v.model,v.year].filter(Boolean).join(' '):'';
/* job maths */
function jobTotals(j){let parts=0,labour=0,cost=0,passOut=0,owe=0;const ow={};(j.items||[]).forEach(it=>{if(it.pend)return;const q=+it.q||0,a=q*(+it.p||0);if(it.k==='part'){parts+=a;cost+=q*(+it.cost||0);}else labour+=a;
    const o=it.out;if(o&&o.who){let x=0;if(o.mode==='pass'){passOut+=a;x=a;}else if(o.mode==='share'){x=Math.max(0,a-q*(+o.amt||0));cost+=x;}else{x=q*(+o.amt||0);cost+=x;}owe+=x;ow[o.who]=(ow[o.who]||0)+x;}});
  const sub=parts+labour;let disc=+j.disc||0;if(j.discPct)disc=sub*(+j.discPct)/100;disc=Math.min(disc,sub);const total=Math.max(0,sub-disc);const paid=(j.pays||[]).reduce((a,p)=>a+(+p.amt||0),0);const sales=Math.max(0,total-passOut);
  return {parts,labour,sub,disc,total,paid,due:Math.max(0,total-paid),cost,passOut,owe,ow,sales,profit:sales-cost};}
const STAGE={estimate:['Estimate','#8b7bff'],new:['New','var(--red)'],work:['Working','var(--orange)'],ready:['Ready','var(--ok)'],done:['Done','var(--dim)']};
const isInvoiced=j=>!!(j.inv&&!j.inv.void);
const openJobs=()=>DB.jobs.filter(j=>j.stage!=='done'&&j.stage!=='estimate');
const dueInvoices=()=>DB.jobs.filter(j=>isInvoiced(j)&&jobTotals(j).due>0.0005);
const lowParts=()=>DB.parts.filter(p=>(+p.reorder||0)>0&&(+p.stock||0)<=(+p.reorder||0));
