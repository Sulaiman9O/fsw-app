/* ---------- core: storage, helpers ---------- */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f3=n=>(Math.round((+n||0)*1000)/1000).toFixed(3);
const NF0=new Intl.NumberFormat('en-US');const kmf=n=>NF0.format(+n||0);
const uid=p=>(p||'x')+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const now=()=>Date.now();
/* date formatters are made once: making one is slow, and lists format hundreds of dates */
const DTF=o=>new Intl.DateTimeFormat(o[0],Object.assign({timeZone:'Asia/Muscat'},o[1]));const F_DK=DTF(['en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}]),F_D=DTF(['en-GB',{day:'numeric',month:'short',year:'numeric'}]),F_DS=DTF(['en-GB',{day:'numeric',month:'short'}]),F_HM=DTF(['en-GB',{hour:'2-digit',minute:'2-digit'}]);
const tOk=t=>{const n=typeof t==='number'?t:(t==null||t===''?NaN:+new Date(t));return isFinite(n)?n:null;};
const dayKey=t=>{const n=tOk(t);return n==null?'':F_DK.format(n);};
const today=()=>dayKey(now());
const fmtD=t=>{const n=tOk(t);return n==null?'':F_D.format(n);};
const fmtDs=t=>{const n=tOk(t);return n==null?'':F_DS.format(n);};
const hm=t=>{const n=tOk(t);return n==null?'':F_HM.format(n);};
const ago=t=>{const d=Math.floor((now()-t)/864e5);return d<=0?'today':d===1?'1 day':d+' days';};
/* numbers typed with an Arabic keyboard: ٠-٩ / ۰-۹ digits and ٫ decimal point */
const isCreditM=m=>/^(credit|on credit|آجل|اجل|دين)$/i.test(String(m||'').trim());
const num=v=>{const s=String(v==null?'':v).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٫/g,'.').replace(/[٬,]/g,'');const n=parseFloat(s.replace(/[^\d.\-]/g,''));return isNaN(n)?0:n;};
const waNum=t=>{let d=(t||'').replace(/\D/g,'');if(d.length===8)d='968'+d;return d;};
async function hashPin(pin){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('ws:'+pin));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}catch(e){return 'p:'+pin;}}
let tt;function toast(s){const t=$('#toast');t.textContent=s;const was=t.hidden;t.hidden=false;if(was&&window.motionOn&&motionOn())gsap.fromTo(t,{y:20,opacity:0},{y:0,opacity:1,duration:.25,ease:'power2.out',clearProps:'transform,opacity'});clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2400);}
const KEY='ws_db_v1';
function blankDB(){return {v:1,ws:null,users:[],services:[],pcats:DEFAULT_PART_CATS.slice(),ecats:DEFAULT_EXP_CATS.slice(),parts:[],vendors:[],pos:[],customers:[],vehicles:[],jobs:[],reminders:[],expenses:[],closes:[],counts:[],steps:{},canned:[],insp:JSON.parse(JSON.stringify(DEFAULT_INSP)),backups:0,openingCash:0};}
let DB=(()=>{try{const s=localStorage.getItem(KEY);if(s)return Object.assign(blankDB(),JSON.parse(s));}catch(e){}return blankDB();})();
const COLORS=['#ee3a39','#2a78d6','#1f8f4e','#f27b21','#8b5cf6','#0ea5a4','#c2410c'];
const initials=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const ROLE={owner:'Owner',manager:'Manager',worker:'Worker'};
const PERMS=[
 ['jobs','Work','Open jobs and estimates, add services and parts',1,1],
 ['cust','Customers','Customers, cars and reminders',1,1],
 ['invoice','Invoices','Make invoices, take payments, return invoices',0,1],
 ['discount','Discounts','Give discounts and lower prices',0,1],
 ['money','Money','Money page: amounts due and today',0,1],
 ['exp','Expenses','See and add expenses',0,1],
 ['close','Daily close','Count the cash drawer',0,1],
 ['reports','Reports','Sales and top items',0,1],
 ['cost','Costs & profit','See cost prices and profit',0,0],
 ['stock','Stock','Parts and stock',1,1],
 ['checks','Invoice checks','Warnings about wrong items on job cards',1,1],
 ['vendors','Suppliers','Suppliers and supplier orders',1,1],
 ['count','Daily count','Count 5 parts a day',1,1],
 ['svcEdit','Services','Change services, groups and prices',0,0],
 ['del','Delete','Delete jobs, parts, orders',0,0],
 ['settings','Settings','Settings, lists, messages and users',0,0]];
const roleDef=(role,k)=>{if(role==='owner')return true;const p=PERMS.find(x=>x[0]===k);return !!(p&&p[role==='manager'?4:3]);};
function permOf(u,k){if(!u)return false;if(u.role==='owner')return true;if(u.perm&&k in u.perm)return !!u.perm[k];return roleDef(u.role,k);}
const perm=k=>permOf(S.user,k);
const can={cost:()=>perm('cost'),discount:()=>perm('discount'),money:()=>perm('money'),del:()=>perm('del'),settings:()=>perm('settings'),invoice:()=>perm('invoice')};
const ROUTE_P={quote:'jobs',checks:'checks',debts:'money',work:'jobs',job:'jobs',newjob:'jobs',inv:'jobs',cust:'cust',custd:'cust',money:'money',outw:'money',exp:'exp',close:'close',reports:'reports',stock:'stock',part:'stock',vendors:'vendors',po:'vendors',count:'count',settings:'settings',users:'settings',lists:'settings',menu:'settings',msgs:'settings',audit:'settings',slow:'stock',stockval:'cost',stocktools:'settings'};
const routeOk=r=>!ROUTE_P[r]||perm(ROUTE_P[r]);
/* lookups */
const byId=(list,id)=>DB[list].find(x=>x.id===id);
const custOf=j=>byId('customers',j.cust)||{};
const vehOf=j=>byId('vehicles',j.veh)||{};
const carName=v=>v?[v.make,v.model,v.year].filter(Boolean).join(' '):'';
/* job maths */
function jobTotals(j){let parts=0,labour=0,cost=0,passOut=0,owe=0;const ow={};(j.items||[]).forEach(it=>{if(it.pend)return;const q=+it.q||0,a=q*(+it.p||0);if(it.k==='part'){parts+=a;cost+=q*(+it.cost||0);}else labour+=a;
    const o=it.out;if(o&&o.who){let x=0;if(o.mode==='pass'){passOut+=a;x=a;}else if(o.mode==='share'){x=Math.max(0,a-q*(+o.amt||0));cost+=x;}else{x=q*(+o.amt||0);cost+=x;}owe+=x;ow[o.who]=(ow[o.who]||0)+x;}});
  const sub=parts+labour;let disc=+j.disc||0;if(j.discPct)disc=sub*(+j.discPct)/100;disc=Math.min(disc,sub);const total=Math.max(0,sub-disc);const paid=(j.pays||[]).reduce((a,p)=>a+(isCreditM(p.m)?0:(+p.amt||0)),0);const sales=Math.max(0,total-passOut);
  return {parts,labour,sub,disc,total,paid,due:Math.max(0,total-paid),cost,passOut,owe,ow,sales,profit:sales-cost};}
const STAGE={estimate:['Estimate','#8b7bff'],new:['New','var(--st-new)'],work:['Working','var(--st-work)'],ready:['Ready','var(--ok)'],done:['Done','var(--dim)']};
const isInvoiced=j=>!!(j.inv&&!j.inv.void);
const openJobs=()=>DB.jobs.filter(j=>j.stage!=='done'&&j.stage!=='estimate');
/* what a customer still owes: unpaid invoices, oldest first */
function custDebt(cid){const t=now();const list=DB.jobs.filter(j=>j.cust===cid&&isInvoiced(j)&&!j.returned).map(j=>({j,due:jobTotals(j).due,days:Math.max(0,Math.floor((t-(j.inv.t||j.t))/864e5))})).filter(x=>x.due>=0.005).sort((a,b)=>(a.j.inv.t||a.j.t)-(b.j.inv.t||b.j.t));
  return {due:list.reduce((a,x)=>a+x.due,0),list};}
const dueInvoices=()=>DB.jobs.filter(j=>isInvoiced(j)&&jobTotals(j).due>0.0005);
const lowParts=()=>DB.parts.filter(p=>(+p.reorder||0)>0&&(+p.stock||0)<=(+p.reorder||0));
