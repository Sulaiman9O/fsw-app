/* ---------- RECIPES: the app learns from past invoices what each car takes for an oil change
   (filter, oil viscosity, litres) and adds it by itself. It can switch to the maker's recommendation.
   The same knowledge checks job cards for mistakes (no filter, odd litres, unusual filter or oil, low price). ---------- */
const RCP_MIN=3;              /* invoices needed before a model / engine recipe is trusted (the car's own history needs 1) */
const RCP_HALF=180*864e5;     /* newer invoices count more: weight halves every 6 months */
const nrmK=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const TRIM_RX=/\b(le|se|xle|xse|gl|gls|glx|gli|xli|sr|sv|sl|s|sport|limited|platinum|hybrid|lx|ex|exl|touring|base|gx|gxr|vx|vxr|sahara|lite|ltd|premium|grande)\b/g;
const baseModel=m=>lc(m).replace(TRIM_RX,' ').replace(/\s+/g,' ').trim();
/* a car typed without an engine gets the model's engine when the model has only one for that year */
/* layouts and sizes are not engine codes: V6 on a Jeep and V6 on a Lexus share nothing */
const NOT_CODE=/^([VIWLHB]|L4|I4)\d{1,2}$|^\d{1,2}V$|^\d\.\d[LT]?$|^\d{3,4}(CC|ML)$|^G\d$|^(4WD|2WD|AWD|4X4|4X2)$/;
const hasCode=e=>String(e||'').toUpperCase().split(/[\s·,/()]+/).some(x=>/^[0-9A-Z]{2,}(-[A-Z]{2,4})?$/.test(x)&&/\d/.test(x)&&/[A-Z]/.test(x)&&!/^\d\.\dL$/.test(x)&&!/^\d+CYL$/.test(x)&&!/^DM-?I$/.test(x)&&!NOT_CODE.test(x));
const dispTxt=e=>{const m=lc(e).match(/(\d\.\d)\s*(?:l|t)?\b/);return m?m[1]:'';};
/* engines typed by a VIN decoder: "2GR-FE | Displacement: 3.5L | Configuration: V-Shaped | Cylinders: 6 | Fuel: Gasoline" -> "3.5L 6 cyl · 2GR-FE" */
function cleanEng(e){e=String(e||'');if(!/displacement:|cylinders:|configuration:/i.test(e))return e;const P=e.split('|').map(x=>x.trim());const code=P.find(x=>!/:/.test(x)&&x)||'';
  const d=(e.match(/displacement:\s*([\d.]+)\s*l/i)||[])[1];const c=(e.match(/cylinders:\s*(\d+)/i)||[])[1];const head=[d?(+d).toFixed(1)+'L':'',c?c+' cyl':''].filter(Boolean).join(' ');return [head,code].filter(Boolean).join(' · ');}
const EFFC={k:'',m:new Map(),ev:new Map()};const effReset=()=>{const k=DB.jobs.length+':'+DB.vehicles.length+':'+DB.parts.length;if(EFFC.k!==k){EFFC.k=k;EFFC.m.clear();EFFC.ev.clear();}};
function effEng(v){if(!v)return '';effReset();const ck=v.id+'|'+v.engine+'|'+v.make+'|'+v.model+'|'+v.year;if(EFFC.m.has(ck))return EFFC.m.get(ck);const r=effEng0(v);EFFC.m.set(ck,r);return r;}
function effEng0(v){if(!v)return '';let own=cleanEng(v.engine);if(!/\d/.test(own.replace(/configuration|cylinders|displacement|fuel|[:|]/gi,'')))own='';if(own&&(hasCode(own)||/electric/i.test(own)))return own;if(!v.make||!v.model||typeof carEngines!=='function')return own;
  try{let E=carEngines(v.make,v.model,v.year).L.filter(e=>e.yr!=='added by you');const d=dispTxt(own);if(d)E=E.filter(e=>dispTxt(e.n)===d);return E.length===1?E[0].n:own;}catch(e){return own;}}
const isEV=v=>{if(!v)return false;effReset();const ck=v.id+'|'+v.engine+'|'+v.model+'|'+v.year;if(EFFC.ev.has(ck))return EFFC.ev.get(ck);const e=effEng(v);const r=/electric|\bev\b/i.test(e)&&!/hybrid|phev|dm-?i|range/i.test(e)&&!DB.jobs.some(j=>j.veh===v.id&&oilParts(j).oils.length);EFFC.ev.set(ck,r);return r;};
const dispOf=v=>dispTxt(effEng(v));
function engCodeX(v){const e=String(effEng(v)).toUpperCase();const t=e.split(/[\s·,/]+/).find(x=>/^[0-9A-Z]{2,}(-[A-Z]{2,4})?$/.test(x)&&/\d/.test(x)&&/[A-Z]/.test(x)&&!/^\d\.\dL$/.test(x)&&!/^\d+CYL$/.test(x)&&!NOT_CODE.test(x));return t||'';}
/* keys from most exact to most general */
/* same model and year come before the model in general: one model changes filter between generations (Camry 2.5: D1 up to 2017, N2 from 2018).
   'mmdy'/'mmy' are one year; the query also tries the years next to it (y±1, then y±2) before the model in general */
function rcpKeys(v,ix){if(!v)return [];const mk=lc(v.make).trim(),md=baseModel(v.model),d=dispOf(v),ec=engCodeX(v),y=+v.year||0;const out=[['veh',v.id,1]];
  if(md&&y>1950){const ys=ix?[[y]]:[[y],[y-1,y,y+1],[y-2,y-1,y,y+1,y+2]];if(d)ys.forEach(Y=>out.push(['mmdy',Y.map(z=>mk+'|'+md+'|'+d+'|'+z),2]));ys.forEach(Y=>out.push(['mmy',Y.map(z=>mk+'|'+md+'|'+z),2]));}
  if(md&&d)out.push(['mmd',mk+'|'+md+'|'+d,RCP_MIN]);if(ec)out.push(['eng',ec,RCP_MIN]);if(md&&!d)out.push(['mm',mk+'|'+md,RCP_MIN]);if(d)out.push(['md',mk+'|'+d,RCP_MIN]);return out;}
const keyLabel=(k,v,id)=>esc(keyLabel0(k,v,id));
const keyLabel0=(k,v,id)=>k==='veh'?T_('this car'):(k==='mmdy'||k==='mmy')?(v.make+' '+baseModel(v.model).replace(/\b\w/g,c=>c.toUpperCase())+(k==='mmdy'?' '+dispOf(v)+'L':'')+' '+v.year+(Array.isArray(id)&&id.length>1?' ±'+((id.length-1)/2):'')):k==='mmd'?(v.make+' '+baseModel(v.model).replace(/\b\w/g,c=>c.toUpperCase())+' '+dispOf(v)+'L'):k==='eng'?engCodeX(v):k==='mm'?(v.make+' '+v.model):(v.make+' '+dispOf(v)+'L');
/* what an item is */
let RPM=null;
function rcpParts(){if(RPM&&RPM.n===DB.parts.length&&RPM.ref===DB.parts)return RPM;const num={},name={};DB.parts.forEach(p=>{if(p.num)num[nrmK(p.num)]=p;name[nrmK(p.name)]=p;});return RPM={n:DB.parts.length,ref:DB.parts,num,name};}
const pnToks=t=>(String(t||'').toUpperCase().match(/[A-Z0-9][A-Z0-9-]{3,}/g)||[]).map(nrmK).filter(x=>x.length>=4&&/\d/.test(x)&&!/^\d{1,2}w\d{2}$/.test(x)&&!/^\d+(ltrs?|l|ml|gm|w)$/.test(x));
function partOfItem(i){if(i.ref){const p=byId('parts',i.ref);if(p)return p;}const M=rcpParts();const d=(i.num&&M.num[nrmK(i.num)])||M.name[nrmK(i.d)]||(/genuine/i.test(i.d||'')&&M.name[nrmK(String(i.d).replace(/\s*genuine\b/i,''))]);if(d)return d;
  if(!M.tok){M.tok={};DB.parts.forEach(p=>{if(/duplicate/i.test(p.name))return;new Set([...pnToks(p.num),...pnToks(p.name)]).forEach(t=>(M.tok[t]=M.tok[t]||[]).push(p));});}
  const sc=new Map();new Set([...pnToks(i.num),...pnToks(i.d)]).forEach(t=>{const L=M.tok[t]||[];if(L.length>3)return;L.forEach(p=>sc.set(p,(sc.get(p)||0)+1));});
  let best=null,bs=0,tie=false;sc.forEach((n,p)=>{if(n>bs){best=p;bs=n;tie=false;}else if(n===bs)tie=true;});return best&&!tie?best:null;}
const isOilSvc=i=>i.k!=='part'&&(i.tag==='oil'||/engine oil change|oil change|oil service|تغيير زيت المحرك/i.test(i.d||''))&&!/gear|transmission|atf|cvt|differential|transfer|brake/i.test(i.d||'');
const isFilterI=(i,p)=>i.k==='part'&&(p?p.cat==='Oil filters':/oil filter/i.test(i.d||''))&&!/a\/t|atf|transmission|cvt/i.test((p&&p.name)||i.d||'');
const isOilI=(i,p)=>i.k==='part'&&(p?p.cat==='Engine oil':/(motor|engine) oil|\b\d{1,2}\s*w\s*-?\s*\d{2}\b/i.test(i.d||''))&&!/gear|atf|cvt|transmission|flush|\b(75|80|85)w/i.test((p&&p.name)||i.d||'');
const viscTxt=s=>{const m=String(s||'').match(/(\d{1,2})\s*w\s*-?\s*(\d{2})/i);return m?m[1]+'W-'+m[2]:'';};
/* learn: one pass over the jobs, cached until the jobs change */
let RCP_IDX=null;
function rcpStamp(){let m=0;DB.jobs.forEach(j=>{if(j.t>m)m=j.t;});return DB.jobs.length+'|'+m+'|'+DB.parts.length;}
function oilParts(j){const r={svc:null,filters:[],oils:[]};(j.items||[]).forEach((i,ix)=>{if(i.pend)return;if(isOilSvc(i)){r.svc=r.svc||ix;return;}const p=partOfItem(i);if(isFilterI(i,p))r.filters.push({i,p,ix});else if(isOilI(i,p))r.oils.push({i,p,ix});});return r;}
function rcpIndex(){const st=rcpStamp();if(RCP_IDX&&RCP_IDX.st===st)return RCP_IDX.m;const m={},now0=now();
  DB.jobs.forEach(j=>{if(j.stage==='estimate'||j.returned)return;const v=byId('vehicles',j.veh);if(!v)return;const o=oilParts(j);if(o.svc==null&&!(o.filters.length&&o.oils.length))return;
    const w=Math.pow(0.5,Math.max(0,now0-(j.t||now0))/RCP_HALF);const litres=o.oils.reduce((a,x)=>a+(+x.i.q||0),0);const visc=o.oils.map(x=>viscTxt((x.p&&x.p.name)||x.i.d)).find(Boolean)||'';
    rcpKeys(v,1).forEach(([k,id])=>{const K=k+':'+(Array.isArray(id)?id[0]:id);const e=m[K]=m[K]||{n:0,w:0,f:{},vi:{},oil:{},q:[]};e.n++;e.w+=w;
      o.filters.forEach(x=>{const fid=x.p?'p:'+x.p.id:'n:'+nrmK(x.i.num||x.i.d);const f=e.f[fid]=e.f[fid]||{w:0,n:0,label:(x.p&&x.p.name)||x.i.d,num:(x.p&&x.p.num)||x.i.num||'',pid:x.p&&x.p.id};f.w+=w;f.n++;f.t=Math.max(f.t||0,j.t||0);});
      if(visc){e.vi[visc]=(e.vi[visc]||0)+w;}
      o.oils.forEach(x=>{if(x.p)e.oil[x.p.id]=(e.oil[x.p.id]||0)+w;});
      if(litres>=2&&litres<=12)e.q.push([litres,w]);});});
  RCP_IDX={st,m};return m;}
const topOf=o=>Object.entries(o).sort((a,b)=>b[1]-a[1])[0];
const wMedian=L=>{if(!L.length)return 0;const s=L.slice().sort((a,b)=>a[0]-b[0]);const half=s.reduce((a,x)=>a+x[1],0)/2;let c=0;for(const x of s){c+=x[1];if(c>=half)return x[0];}return s[s.length-1][0];};
/* the maker's recommendation: viscosity first choice, other allowed, litres with filter. Values are general data: the owner can correct them (stored in DB.spec) */
const SPEC0=[
 ['toyota',/camry|rav4|rav 4|avalon|es ?250/,'2.5',2018,0,['0W-20','0W-16'],4.5],
 ['toyota',/camry|rav4|rav 4|venza/,'2.5',2007,2017,['0W-20','5W-30'],4.4],
 ['toyota',/./,'3.5',2007,0,['0W-20','5W-30'],6.1],
 ['lexus',/./,'3.5',2007,0,['0W-20','5W-30'],6.1],
 ['toyota',/fj|prado|land cruiser|4runner|hilux|fortuner/,'4.0',2003,0,['5W-30','0W-20'],5.2],
 ['toyota',/land cruiser|sequoia|tundra/,'4.6',2008,0,['0W-20','5W-30'],7.5],
 ['toyota',/land cruiser|sequoia|tundra/,'5.7',2007,0,['0W-20','5W-30'],7.9],
 ['lexus',/lx|gx/,'5.7',2008,0,['0W-20','5W-30'],7.9],
 ['toyota',/corolla|c-hr/,'1.8',2008,0,['0W-20','5W-30'],4.2],
 ['toyota',/hilux|prado|innova|fortuner/,'2.7',2004,0,['5W-30','10W-30'],5.5],
 ['nissan',/altima|x-trail|xtrail|rogue/,'2.5',2007,2018,['5W-30','0W-20'],4.6],
 ['nissan',/altima/,'2.5',2019,0,['0W-20','5W-30'],4.8],
 ['nissan',/maxima|pathfinder|altima|murano/,'3.5',2004,0,['5W-30','0W-20'],4.7],
 ['nissan',/patrol|armada/,'5.6',2010,0,['5W-30','0W-20'],6.5],
 ['hyundai',/sonata|santa fe|tucson/,'2.4',2009,0,['5W-30','5W-20'],4.8],
 ['kia',/optima|sorento|sportage/,'2.4',2009,0,['5W-30','5W-20'],4.8],
 ['honda',/accord|cr-v|crv/,'2.4',2003,0,['0W-20','5W-20'],4.2],
 ['subaru',/./,'2.5',2011,0,['0W-20','5W-30'],4.8],
 ['ford',/f-150|f150|expedition/,'3.5',2011,0,['5W-30','5W-20'],5.7],
 ['gmc',/./,'6.2',2014,0,['0W-20','5W-30'],7.6],['chevrolet',/./,'6.2',2014,0,['0W-20','5W-30'],7.6],
 ['gmc',/./,'5.3',2014,0,['0W-20','5W-30'],7.6],['chevrolet',/./,'5.3',2014,0,['0W-20','5W-30'],7.6],
 ['ram',/./,'5.7',2009,0,['5W-20','5W-30'],6.6],['dodge',/./,'5.7',2009,0,['5W-20','5W-30'],6.6],
 ['mitsubishi',/outlander|lancer|asx/,'2.4',2007,0,['0W-20','5W-30'],4.3]];
function specOf(v){if(!v)return null;const mk=lc(v.make).trim(),md=lc(v.model),d=dispOf(v),y=+v.year||0;
  const own=(DB.spec||{})[mk+'|'+baseModel(v.model)+'|'+d];if(own)return Object.assign({own:true},own);
  const es=typeof ENGSPEC!=='undefined'&&ENGSPEC[nrmK(engCodeX(v))];if(es&&(es.visc||[]).length)return {visc:es.visc,cap:es.oil_l||0,filter:es.filter||[],xref:es.xref||[],conf:es.conf,code:engCodeX(v),src:es.src};
  const r=SPEC0.find(s=>s[0]===mk&&s[1].test(md)&&s[2]===d&&(!y||((!s[3]||y>=s[3])&&(!s[4]||y<=s[4]))));return r?{visc:r[5],cap:r[6]}:null;}
/* pick an oil from stock with this viscosity: the usual one if it is in stock, else the one with most stock; for the maker, prefer the maker's own brand */
function oilFor(visc,usual,mkBrand){const L=DB.parts.filter(p=>p.cat==='Engine oil'&&viscTxt(p.name)===visc);if(!L.length)return null;
  const inS=p=>(+p.stock||0)>0;const u=usual&&L.find(p=>p.id===usual);
  if(mkBrand){const b=L.filter(p=>lc(p.name).startsWith(mkBrand));const bi=b.find(inS)||b[0];if(bi&&inS(bi))return bi;}
  if(u&&inS(u))return u;return L.filter(inS).sort((a,b)=>(+b.stock||0)-(+a.stock||0))[0]||u||L[0];}
/* a filter of another make is never suggested from other cars' invoices (a Nissan filter for a Ford came from a mixed-up group) */
const FBRAND={toyota:'toyota',lexus:'toyota',nissan:'nissan',infiniti:'nissan',renault:'nissan',gm:'gm',acdelco:'gm',ac:'gm',chevrolet:'gm',gmc:'gm',ford:'ford',motorcraft:'ford',lincoln:'ford',mazda:'mazda',kia:'kia',hyundai:'kia',chrysler:'chrysler',mopar:'chrysler',jeep:'chrysler',dodge:'chrysler',ram:'chrysler',mercedes:'mercedes','mercedes-benz':'mercedes',honda:'honda',acura:'honda',subaru:'subaru',mitsubishi:'mitsubishi',byd:'byd',suzuki:'suzuki',mg:'mg',bmw:'bmw',chery:'chery',geely:'geely',changan:'changan',haval:'haval',gwm:'haval'};
const FCROSS={ford:['mazda'],mazda:['ford'],nissan:['renault']};
const mkFam=s=>{s=lc(s).trim().replace(/chevloret|chevorlet|chevrolate/,'chevrolet').replace(/^general motors$/,'gm');return FBRAND[s]||FBRAND[s.split(/[\s-]/)[0]]||'';};
function filterBrandOk(p,v){if(!p||!v)return true;const a=mkFam(String(p.name||'').split(/\s+/)[0]),b=mkFam(v.make);if(!a||!b)return true;return a===b||(FCROSS[b]||[]).includes(a);}
const BRAND={lexus:'toyota',toyota:'toyota',nissan:'nissan',infiniti:'nissan',honda:'honda',mazda:'mazda',mitsubishi:'mitsubishi',hyundai:'kia hyundai',kia:'kia hyundai',subaru:'subaru',gmc:'gm',chevrolet:'gm',cadillac:'gm',ford:'ford',lincoln:'ford',dodge:'chrysler',jeep:'chrysler',chrysler:'chrysler',ram:'chrysler',mercedes:'mercedes',bmw:'bmw',byd:'byd'};
/* the recipe for a car. mode 'usual' = what we always do; 'maker' = the maker's recommendation */
/* one entry for a key; a list of years is merged into one */
function rcpEnt(I,k,id){if(!Array.isArray(id))return I[k+':'+id];const L=id.map(x=>I[k+':'+x]).filter(Boolean);if(L.length<2)return L[0];
  const e={n:0,w:0,f:{},vi:{},oil:{},q:[]};L.forEach(x=>{e.n+=x.n;e.w+=x.w;Object.entries(x.f).forEach(([fid,f])=>{const g=e.f[fid]=e.f[fid]||Object.assign({},f,{w:0,n:0,t:0});g.w+=f.w;g.n+=f.n;g.t=Math.max(g.t||0,f.t||0);});
    Object.entries(x.vi).forEach(([a,b])=>e.vi[a]=(e.vi[a]||0)+b);Object.entries(x.oil).forEach(([a,b])=>e.oil[a]=(e.oil[a]||0)+b);e.q.push(...x.q);});return e;}
function oilRecipe(v,mode){if(!v)return null;const I=rcpIndex();const keys=rcpKeys(v);const pick=fn=>{for(const [k,id,min] of keys){const e=rcpEnt(I,k,id);if(e&&e.n>=min){const r=fn(e);if(r)return {r,k,id,n:e.n};}}return null;};
  const VI=pick(e=>topOf(e.vi));const Q=pick(e=>e.q.length?wMedian(e.q):0);const OI=pick(e=>topOf(e.oil));
  const M=rcpParts();const fPart=f=>f&&(f.pid&&byId('parts',f.pid)||(f.num&&M.num[nrmK(f.num)])||M.name[nrmK(f.label)]||null);
  /* the usual filter: the car's own latest one, else the one used most on the same model/engine. A generic name that matches no part
     ("Toyota Oil Filter (P)") passes to the next, broader group. The usual filter is kept even when out of stock (its alternative is used if one is in stock). */
  let filter=null,fsrc=null,missing='',fopts=[];
  for(const [k,id,min] of keys){const e=rcpEnt(I,k,id);if(!e||e.n<min)continue;const t=Object.values(e.f);if(!t.length)continue;
    t.sort((a,b)=>k==='veh'?((b.t||0)-(a.t||0)):(k==='mmdy'||k==='mmy')?((b.n-a.n)||(b.w-a.w)):(b.w-a.w));let p=null,lab='';for(const f of t){const x=fPart(f);if(x&&(k==='veh'||filterBrandOk(x,v))){p=x;break;}if(!x){lab=f.label;break;}}if(p){filter=p;fsrc={k,id,n:e.n};fopts=t.map(f=>({p:fPart(f),n:f.n})).filter(x=>x.p&&(k==='veh'||filterBrandOk(x.p,v)));break;}if(!missing&&lab)missing=lab;}
  if(mode==='maker'){const mf=makerFilter(v);if(mf){filter=mf;fsrc={maker:1};}}
  if(filter&&(+filter.stock||0)<=0){const a=(filter.alts||[]).map(x=>byId('parts',x)).find(x=>x&&(+x.stock||0)>0);if(a){fsrc=Object.assign({},fsrc,{alt:filter.name});filter=a;}}
  if(!filter&&missing)fsrc={missing};
  const sp=specOf(v);let visc='',qty=0,vsrc=null,qsrc=null;
  /* litres you set yourself win over everything: for this car, or for every car of this model and engine */
  if(+v.oilQ>0){qty=+v.oilQ;qsrc={car:1};}else if(sp&&sp.own&&sp.cap){qty=sp.cap;qsrc={maker:1,own:1};}
  if(mode==='maker'&&sp){visc=sp.visc[0];vsrc={maker:1,own:sp.own};if(sp.cap&&!qty){qty=sp.cap;qsrc={maker:1,own:sp.own};}}
  if(!visc&&VI){visc=VI.r[0];vsrc={k:VI.k,n:VI.n};}
  if(!qty&&Q){qty=Q.r;qsrc={k:Q.k,n:Q.n};}
  if(!visc&&sp){visc=sp.visc[0];vsrc={maker:1};}
  if(!qty){qty=sp&&sp.cap||guessLitres('oil',v);qsrc=sp&&sp.cap?{maker:1}:{guess:1};}
  const oil=visc?oilFor(visc,OI&&OI.r[0],mode==='maker'?BRAND[lc(v.make).trim()]:''):null;
  if(!filter&&!visc)return null;
  return {mode,filter,fsrc,fopts,visc,vsrc,qty:Math.round(qty*10)/10,qsrc,oil,spec:sp};}
/* put the recipe into the job: the oil-change service, the filter and the oil. Items added by the recipe carry grp:'rxoil' so a switch replaces them */
/* the maker's filter numbers matched against the parts list (part number or the number inside the name) */
function makerFilterNums(v){const sp=specOf(v);return sp?[...(sp.filter||[]),...(sp.xref||[])].map(nrmK).filter(x=>x.length>=4):[];}
function filterIsMaker(p,v){const ns=makerFilterNums(v);if(!ns.length||!p)return null;const a=nrmK(p.num),b=nrmK(p.name);return ns.some(n=>a===n||b.includes(n)||(a.length>=6&&n.includes(a)));}
/* every filter that has been on this car or its model/year (most used first), then the ones whose "fits" list names it: spin-on filters often have several that fit */
function filterOpts(v,rec){const seen=new Set(),out=[];const add=(p,n,why)=>{if(!p||seen.has(p.id)||p.cat!=='Oil filters')return;seen.add(p.id);out.push({p,n:n||0,why});};
  ((rec&&rec.fopts)||[]).forEach(x=>add(x.p,x.n,'inv'));const mf=makerFilter(v);if(mf)add(mf,0,'maker');
  DB.parts.filter(p=>p.cat==='Oil filters'&&typeof fitsCar==='function'&&fitsCar(p,v)&&filterBrandOk(p,v)).forEach(p=>add(p,0,'fits'));return out;}
/* last resort: a filter whose "fits" list (built from the invoices) names this car */
function fitsFilter(v){if(!v||typeof fitsCar!=='function')return null;const L=DB.parts.filter(p=>p.cat==='Oil filters'&&fitsCar(p,v)&&filterBrandOk(p,v));return L.find(p=>(+p.stock||0)>0)||L[0]||null;}
function makerFilter(v){const ns=makerFilterNums(v);if(!ns.length)return null;const L=DB.parts.filter(p=>p.cat==='Oil filters'&&filterIsMaker(p,v));return L.find(p=>(+p.stock||0)>0)||L[0]||null;}
function applyOilRecipe(j,mode,svc){const v=vehOf(j);const R=oilRecipe(v,mode);if(!R)return null;
  j.items=(j.items||[]).filter(i=>i.grp!=='rxoil');
  if(!(j.items||[]).some(isOilSvc)){const s=svc||DB.services.find(s=>rxOf(s)==='oil');if(s){const it=svcItem(s,v);it.grp='rxoil';j.items.push(it);}}
  if(R.filter&&!(j.items.some(i=>isFilterI(i,partOfItem(i))))){const p=R.filter;j.items.push({k:'part',ref:p.id,d:p.name,num:p.num,q:1,u:p.unit==='L'?'L':'',p:+p.price,cost:+p.cost||0,grp:'rxoil',by:S.user.name});}
  if(R.oil&&!(j.items.some(i=>isOilI(i,partOfItem(i))))){const p=R.oil;j.items.push({k:'part',ref:p.id,d:p.name,num:p.num,q:R.qty,u:'L',p:+p.price,cost:+p.cost||0,grp:'rxoil',by:S.user.name});}
  j.rx=j.rx||{};j.rx.oil={mode,at:now()};logJ(j,(mode==='maker'?'Maker recommendation':'Usual oil change')+' added · '+[R.filter&&R.filter.name,R.oil&&(R.qty+' L '+R.oil.name)].filter(Boolean).join(' + '));return R;}
/* called when a service or part is added: an oil-change service, an oil filter or an engine oil brings the rest by itself */
function rxAuto(j,added){if(!sx('smart')||isInvoiced(j))return null;const v=vehOf(j);if(!v||isEV(v))return null;
  const o=oilParts(j);const trig=added&&(isOilSvc(added)||isFilterI(added,partOfItem(added))||isOilI(added,partOfItem(added)));if(!trig)return null;
  if(o.svc!=null&&o.filters.length&&o.oils.length)return null;
  const mode=(DB.ws.rxMode)||'usual';return applyOilRecipe(j,mode);}
const srcTxt=(s,v)=>s&&s.car?T_('set for this car'):!s||(!s.k&&!s.maker&&!s.guess)?'':s.maker?(s.own?T_('your maker values'):T_('maker recommendation')):s.guess?T_('engine size'):T_('from '+s.n+' visits')+' · '+keyLabel(s.k,v,s.id);
function rxBar(j){if(!j.rx||!j.rx.oil||isInvoiced(j)||!(j.items||[]).some(i=>i.grp==='rxoil'))return '';const v=vehOf(j);const m=j.rx.oil.mode;const R=oilRecipe(v,m)||{};const sp=specOf(v);
  return `<div class="rxbar"><div class="rh"><b>🛢 ${T_('Oil change')}</b><div class="chips" data-notr><button data-rxm="usual" aria-pressed="${m!=='maker'}">${T_('Usual')}</button><button data-rxm="maker" aria-pressed="${m==='maker'}" ${sp?'':'disabled'}>${T_('Maker')}</button></div></div>
   <span class="sub">${R.visc?`${esc(R.visc)} · ${srcTxt(R.vsrc,v)}`:''}${m==='maker'&&sp&&sp.conf==='low'?` (${T_('not confirmed')})`:''}${R.qty?` · ${R.qty} L`:''}${R.fsrc?` · ${T_('filter')}: ${srcTxt(R.fsrc,v)}`:''}${R.fsrc&&R.fsrc.missing?` · ⚠️ ${esc(R.fsrc.missing)} ${T_('is not in the parts list')}`:''}${!sp?` · ${T_('no maker data for this car')}`:''}${sp&&(sp.filter||[]).length&&!makerFilter(v)?` · ⚠️ ${T_('maker filter not in the parts list')}: ${esc(sp.filter.join(' / '))}`:''}</span>
   <button class="lnk" id="rxqty">✏️ ${T_('Set the litres for this car')}</button>
   ${R.qsrc&&R.qsrc.guess?`<div class="guess">⚠️ ${T_('Litres are a guess for this car: check them. The app learns them from this invoice.')}</div>`:''}
   <div class="rxf">${can.settings()?`<button class="lnk" id="rxspec">${T_('Maker values for this car')} ›</button>`:''}<button class="lnk rxx" id="rxx">✕ ${T_('Remove oil change')}</button></div></div>`;}
function rxCancel(j){j.items=(j.items||[]).filter(i=>i.grp!=='rxoil'&&i.grp!=='rxsvc');if(j.rx)delete j.rx.oil;logJ(j,'Automatic oil change removed');}
/* set the litres by hand: for this car only, or for every car of this model + engine. The next oil change uses it, whatever was sold before */
function qtySheet(v,cur,done){const real=v&&v.id&&v.id!=='_q'&&v.id!=='_n'&&byId('vehicles',v.id);const key=lc(v.make).trim()+'|'+baseModel(v.model)+'|'+dispOf(v);const own=(DB.spec||{})[key];
  openSheet(`<h3>🛢 ${T_('Engine oil litres')}</h3><p class="hint">${T_('With the filter. The next oil change uses this, not what was sold last time.')}</p>
   <input class="field" id="qtl" inputmode="decimal" value="${cur||''}" style="font-size:1.4rem;text-align:center">
   ${real?`<button class="btn" id="qtcar">🚗 ${T_('For this car only')}<small style="display:block;font-weight:500;opacity:.85">${esc(carName(v))}${v.plate?' · '+esc(v.plate):''}</small></button>`:''}
   <button class="btn ${real?'ghost':''}" id="qtmod">📋 ${T_('For every')} ${esc(v.make||'')} ${esc(baseModel(v.model)||'')}${dispOf(v)?' '+esc(dispOf(v))+'L':''}</button>
   ${real&&+real.oilQ||own&&own.cap?`<button class="btn ghost jb-del" id="qtclr">${T_('Remove what I set')}</button>`:''}`,el=>{
    const val=()=>{const x=num(el.querySelector('#qtl').value);if(!(x>0&&x<30)){toast(T_('Type the litres'));return 0;}return Math.round(x*10)/10;};
    const fin=(t)=>{save();closeSheet();toast(t);if(done)done();else render();};
    const c=el.querySelector('#qtcar');if(c)c.onclick=()=>{const x=val();if(!x)return;real.oilQ=x;audit('settings','Oil litres '+x+' for '+carName(real)+' '+(real.plate||''));fin(T_('Saved for this car'));};
    el.querySelector('#qtmod').onclick=()=>{const x=val();if(!x)return;DB.spec=DB.spec||{};const o=DB.spec[key]||{visc:(specOf(v)||{}).visc||[]};o.cap=x;DB.spec[key]=o;audit('settings','Oil litres '+x+' for '+key);fin(T_('Saved for this model'));};
    const cl=el.querySelector('#qtclr');if(cl)cl.onclick=()=>{if(real)delete real.oilQ;if(own){delete own.cap;if(!(own.visc||[]).length)delete DB.spec[key];}fin(T_('Removed'));};
    setTimeout(()=>{const i=el.querySelector('#qtl');i.focus();i.select();},80);});}
function rxBind(j){const rq=$('#rxqty');if(rq)rq.onclick=()=>{const v=vehOf(j);const R=oilRecipe(v,(j.rx&&j.rx.oil&&j.rx.oil.mode)||'usual')||{};
    qtySheet(v,R.qty,()=>{const R2=oilRecipe(v,(j.rx&&j.rx.oil&&j.rx.oil.mode)||'usual');const ol=(j.items||[]).find(i=>i.grp==='rxoil'&&i.k==='part'&&isOilI(i,partOfItem(i)));if(ol&&R2&&R2.qty){ol.q=R2.qty;logJ(j,'Oil litres set to '+R2.qty);save();}render();});};
const rx=$('#rxx');if(rx)rx.onclick=()=>{const md=(j.rx&&j.rx.oil&&j.rx.oil.mode)||'usual';rxCancel(j);save();render();undoBar(T_('Oil change removed'),()=>{applyOilRecipe(j,md);save();render();});};$$('[data-rxm]').forEach(b=>b.onclick=()=>{const m=b.dataset.rxm;if(j.rx&&j.rx.oil&&j.rx.oil.mode===m)return;applyOilRecipe(j,m);save();render();});
  const sp=$('#rxspec');if(sp)sp.onclick=()=>specSheet(vehOf(j));}
/* the owner can write the maker values for a model (they win over the built-in list) */
function specSheet(v){if(!v)return;const key=lc(v.make).trim()+'|'+baseModel(v.model)+'|'+dispOf(v);const s=specOf(v)||{visc:[],cap:''};
  openSheet(`<h3>${T_('Maker values')} · ${esc(v.make)} ${esc(baseModel(v.model))} ${esc(dispOf(v))}L</h3><p class="hint">${T_('Used when you choose “Maker” on a job. They apply to every car of this model and engine.')}</p>
   <label class="field-l">${T_('Viscosity (first is used)')}<input class="field" id="spv" value="${esc((s.visc||[]).join(', '))}" placeholder="0W-20, 5W-30"></label>
   <label class="field-l">${T_('Litres with filter')}<input class="field" id="spc" inputmode="decimal" value="${esc(s.cap||'')}"></label><button class="btn" id="spok">Save</button>`,el=>el.querySelector('#spok').onclick=()=>{
     const vi=el.querySelector('#spv').value.split(/[,،\s]+/).map(viscTxt).filter(Boolean);const cap=parseFloat(el.querySelector('#spc').value)||0;DB.spec=DB.spec||{};
     if(!vi.length&&!cap)delete DB.spec[key];else DB.spec[key]={visc:vi,cap};audit('settings','Maker values '+key);save();closeSheet();render();});}
/* ---------- checks: things that look wrong on a job card ---------- */
function jobChecks(j){const out=[];const v=vehOf(j);if(!v||j.returned)return out;const o=oilParts(j);const has=o.svc!=null;
  if(isEV(v)&&(has||o.oils.length))out.push(['bad',T_('Electric car: it has no engine oil')]);
  if(o.filters.length&&o.filters[0].p&&filterIsMaker(o.filters[0].p,v)===false){const sp=specOf(v);const I=rcpIndex(),fp=o.filters[0].p;const usualSame=rcpKeys(v).some(([k,id])=>{if(k==='veh')return false;const e=rcpEnt(I,k,id);const f=e&&e.f['p:'+fp.id];return f&&f.n>=RCP_MIN;});if(sp&&sp.conf==='high'&&!usualSame)out.push(['warn',T_('The filter is not the maker number')+' ('+(sp.filter||[]).slice(0,2).join(' / ')+')']);}
  const custOil=(j.items||[]).some(i=>i.custPart)||/own oil|brought|زيت(ه| العميل)|يجيب زيته/i.test(j.notes||'');
  if(has&&!o.filters.length)out.push(['bad',T_('Oil change without an oil filter')]);
  if(has&&!o.oils.length&&!custOil)out.push(['bad',T_('Oil change without engine oil')]);
  if(!has&&o.filters.length&&o.oils.length)out.push(['warn',T_('Oil and filter without the oil-change service (labour)')]);
  if(o.oils.length||o.filters.length){const R=oilRecipe(v,'usual');const sp=specOf(v);
    if(R){const lit=Math.round(o.oils.reduce((a,x)=>a+(+x.i.q||0),0)*100)/100;if(lit&&R.qsrc&&!R.qsrc.guess&&Math.abs(lit-R.qty)>Math.max(1,R.qty*0.25))out.push(['warn',T_(lit+' litres; usually '+R.qty+' litres for this car')]);
      const vis=o.oils.map(x=>viscTxt((x.p&&x.p.name)||x.i.d)).find(Boolean);const ok=[R.vsrc&&!R.vsrc.maker?R.visc:'',...(sp?sp.visc:[])].filter(Boolean);
      if(vis&&ok.length&&!ok.includes(vis))out.push(['warn',T_('Oil '+vis+' is not the usual or the maker viscosity')+' ('+ok.join(' / ')+')']);
      if(R.fsrc&&R.fsrc.k&&o.filters.length){const I=rcpIndex();const e=rcpEnt(I,R.fsrc.k,R.fsrc.id);const fx=o.filters[0];const fid=fx.p?'p:'+fx.p.id:'n:'+nrmK(fx.i.num||fx.i.d);
        if(e&&R.fsrc.n>=RCP_MIN&&!e.f[fid]&&!(fx.p&&Object.values(e.f).some(f=>f.num&&nrmK(f.num)===nrmK(fx.p.num))))out.push(['warn',T_('This filter was never used on this car or engine')+' · '+T_('usual')+': '+(R.filter?R.filter.name:R.fsrc.missing||'')]);}}}
  (j.items||[]).forEach(i=>{if(i.pend||i.free||i.custPart)return;if(i.k==='part'){const p=i.ref&&byId('parts',i.ref);if(p&&(+i.p||0)<(+p.price||0)-0.0005)out.push(['warn',T_(i.d+' is below the list price')+' ('+f3(i.p)+' / '+f3(p.price)+')']);}
    else if(!(+i.p>0))out.push(['warn',T_(i.d+' has no price')]);});
  return out;}
function chkBox(j){if(!perm('checks')||isInvoiced(j)||!(j.items||[]).length)return '';const C=jobChecks(j);if(!C.length)return '';
  return `<div class="chkbox">${C.map(c=>`<div class="ck-${c[0]}">${c[0]==='bad'?'⛔':'⚠️'} ${esc(c[1])}</div>`).join('')}</div>`;}
SCREENS.checks=m=>{if(!perm('checks')){go('home');return;}const days=S.p.days||30,from=now()-days*864e5;
  const L=DB.jobs.filter(j=>j.t>=from&&j.stage!=='estimate'&&(j.items||[]).length).map(j=>({j,c:jobChecks(j)})).filter(x=>x.c.length).sort((a,b)=>b.j.t-a.j.t);
  m.innerHTML=head('Invoice checks')+`<div class="chips" id="ckd">${[7,30,90].map(d=>`<button data-d="${d}" aria-pressed="${d===days}">${T_(d+' days')}</button>`).join('')}</div>
  ${L.length?`<div class="list">${L.map(({j,c})=>`<button class="row ckrow" data-go="job:${j.id}"><div><b>#${j.no} · ${esc(carName(vehOf(j)))}</b><span>${fmtD(j.t)} · ${esc(custOf(j).name||'')}</span>${c.map(x=>`<small class="ck-${x[0]}">${x[0]==='bad'?'⛔':'⚠️'} ${esc(x[1])}</small>`).join('')}</div><span class="v">›</span></button>`).join('')}</div>`:empty('✅','Nothing looks wrong.')}`;
  $$('#ckd [data-d]').forEach(b=>b.onclick=()=>{S.p.days=+b.dataset.d;render();});};

/* short maker data for an engine label, shown in the car picker */
function engSpecTxt(label){if(typeof ENGSPEC==='undefined')return '';const e=String(label||'').toUpperCase();const code=e.split(/[\s·,/]+/).find(x=>ENGSPEC[nrmK(x)]);const es=code&&ENGSPEC[nrmK(code)];
  if(/^ELECTRIC/.test(e))return '⚡ '+T_('electric · no engine oil');if(!es)return '';return '<bdi dir="ltr" data-notr>🛢 '+esc([es.oil_l?es.oil_l+' L':'',(es.visc||[]).join(' / '),(es.filter||[])[0]?'🔩 '+es.filter[0]:''].filter(Boolean).join(' · ')+(es.conf==='low'?' (?)':''))+'</bdi>';}

/* ---------- oil filter "fits" lists rebuilt from the workshop's own invoices (2.12.1): the old lists from the previous
   system were broad and wrong (e.g. D2 claimed every Camry 2002-2017). Applied once per part; edits made later stay ---------- */
const FITS_FIX={"Chrysler Oil Filter MO-744":"","Nissan Oil Filter 15208 65F0A":"nissan altima 2017, nissan altima 2019-2020, nissan frontier 2007, nissan maxima 2011, nissan maxima 2016, nissan maxima 2018-2021, nissan versa 2011-2012, renault talisman 2013","Chrysler Oil Filter 05184231AA-001 MO-231":"","GM Oil Filter 19303975 PF48E":"chevrolet traverse 2021","Mercedes Benz Oil Filter A0001802609":"mercedes-benz amg 2011, mercedes c400 2015","BYD Oil Filter 2.0L 12255625-00":"","Chrysler Oil Filter 1-05281090 MO-090":"","Toyota Oil Filter 90915-YZZD2 (S)":"lexus ls 430 2004, toyota avalon 2004, toyota camry 1999, toyota hiace 2013, toyota hilux 2013, toyota hilux 2019, toyota innova 2015","Suzuki Oil Filter":"","Subaru Oil Filter 15208 AA100":"subaru legacy 2010-2013","GM Oil Filter 12706595 PF64":"chevloret suburban 2012, chevloret tahoe 2017, chevrolet tahoe 2015, general motors tahoe 2013, gm sierra 2014, gmc yukon 2006, gmc yukon 2012, gmc yukon 2022","Chrysler Oil Filter 1-04892339AA MO-339":"ram laramie 1500 2017","Toyota Oil Filter 90915-YZZN2 (S)":"lexus rx 350 2025, toyota camry 2017-2025, toyota corolla 2017-2023, toyota land cruiser 300 2025, toyota rav4 2012, toyota rav4 2022, toyota yaris 2017, toyota yaris 2022","BYD Oil Filter 1.5L 16088282-00":"byd k8m 2025, byd qin 2024-2025, byd seal 2025, byd seal ev 2024","GM Oil Filter 19210286 PF52E":"general motors sierra 2015","Toyota Oil Filter 04152-YZZD4 (P)":"lexus es 350 2007, lexus lx 570 2013, toyota land cruiser 200 2010-2019, toyota rav4 2024, toyota sequoia 2012","Kia Hyundai Oil Filter 26350 2J000":"hyundai elantra 2018","GM Oil Filter 55594651 PF2257G":"","Mercedes Benz Oil Filter A2761800009":"mercedes-benz e 300 2016, mercedes-benz e-class 2018, mercedes-benz e-class e350 2013","Ford Oil Filter FL-2062 KU2Z-6731-A (old FT4Z-6731-A)":"ford bronco 2022-2023","Mazda Oil Filter SH01-14-302A":"ford ranger 2012","Toyota Oil Filter 04152-YZZD1 (P)":"lexus es 2017-2018, lexus es 350 2013-2021, lexus ls 350 2018, lexus rx 2017, lexus rx 350 2006, lexus rx 350 2013-2018, lexus rx 350l 2020, toyota avalon 2012-2020, toyota camry 2013-2017, toyota rav4 2010-2012, toyota rav4 2017-2021, toyota sienna 2016, toyota tacoma 2017-2020","Mazda Oil Filter JEYO-14-302A":"mazda bt-50 2008, mazda mazda2 2014, mazda mazda6 2014","GM Oil Filter 19330000 PF63E":"","GM Oil Filter 12731179 PF61E":"","Chrysler Oil Filter 1-68191349AA MO-349":"jeep grand cherokee 2018, jeep wrangler 2018","Honda Oil Filter 15400-RBA-FO1 SD":"honda accord 2018, honda accord 2020-2021","Mercedes Benz Oil Filter A2701800109":"mercedes-benz e-class 2018","Ford Oil Filter FL-500S AA5Z-6714-A":"ford f-150 2018, ford mustang 2015-2017","Ford Oil Filter FL-400S E4FZ-6731-AB":"ford bronco 2021","GM Oil Filter 19355319 PF2129G":"","GM Oil Filter 12605566 PF457G":"chevloret malibu 2012","Toyota Oil Filter 90915-YZZD4 (S)":"lexus gs 300 2004, lexus ls 400 1997-1998, lexus ls 430 2004, toyota fj cruiser 2009, toyota fortuner 2012-2016, toyota hilux 2013, toyota hilux 2022, toyota land cruiser 2006, toyota land cruiser 2015, toyota land cruiser prado 2008, toyota tacoma 2023","Mitsubishi Oil Filter MZ690150":"mitsubishi l200 2021, mitsubishi outlander 2022, mitsubishi pajero 2019, mitsubishi truck 1985","Renault Oil Filter 8200 768 913":"","GM Oil Filter 19210283 PF46E":"","Toyota Oil Filter 01452-YZZD6 (P)":"toyota corolla 2014","Kia Hyundai Oil Filter 26300 35505":"hyundai accent 2012, hyundai accent 2019, hyundai elantra 2016, hyundai sonata 2016-2018, hyundai tucson 2014-2018","Toyota Oil Filter 90915-YZZE2":"lexus lx 600 2023, toyota camry 2002, toyota camry 2007-2011, toyota fortuner 2016, toyota land cruiser 2022, toyota land cruiser 2025, toyota rav4 1999, toyota rav4 2006-2007, toyota sequoia 2023, toyota tacoma 2024, toyota yaris 2006","Mitsubishi Oil Filter MZ690115":"mitsubishi l200 2009, mitsubishi l200 2021, mitsubishi lancer 2011, mitsubishi pajero 2017, mitsubishi xpander 2024","Toyota Oil Filter 90915-YZZE1 (S)":"toyota hilux 2010, toyota land cruiser 300 2021","Toyota Oil Filter 04152-YZZD3 (P)":"lexus es 350 2007, lexus es 350 2017, lexus es 350 2021-2023, lexus gs 350 2017, lexus gx 460 2019-2022, lexus is 350 2018, lexus ls 460 2016, lexus nx 2025, lexus rx 350 2012, lexus rx 350 2019, toyota avalon 2016-2018, toyota camry 2017, toyota camry 2022-2023, toyota fj cruiser 2009-2012, toyota land cruiser 2012, toyota land cruiser 2024, toyota land cruiser 300 2022, toyota land cruiser prado 2020, toyota rav4 2016","Mazda Oil Filter B6Y1-14-302":"mazda 6 2019, mazda cx-9 2014-2017, mazda mazda6 2016-2018, mazda mazda6 2023","Ford Oil Filter FL-910S BE8Z-6731-AB":"","ACDelco Oil Filter PF48 12737086 / 12710960":"chevloret captiva 2020","ACDelco Oil Filter PF63 12707246 / 12735811":"chevloret suburban 2015, gmc yukon 2016","Chrysler Oil Filter 04884899AC-001 MO-899":"","Ford Oil Filter FL-820S F1AZ-6731-BD":"","BYD Oil Filter 2.0L 16844473-00":"byd qin 2025","Chrysler Oil Filter 1-04105409AC MO-409":"","Subaru Oil Filter 15208 AA031":"subaru legacy 2007","Kia Hyundai Oil Filter 26320 3CAA0":"","Nissan Oil Filter 15208 31U0B":"infiniti q50s 2015, infiniti qx80 2016, nissan altima 2005, nissan altima 2012-2022, nissan armada 2007-2013, nissan armada 2020, nissan clynld2d41 2023, nissan maxima 2011, nissan maxima 2017, nissan pathfinder 2002, nissan pathfinder 2015, nissan patrol 2010-2021, nissan rogue 2023, nissan sentra 2015, nissan sunny 2013, nissan x-terra 2023, nissan xterra 2013, renault logan 2010","GM Oil Filter 19210284 PF47E":"chevrolet tahoe 2012","Honda Oil Filter 15400-PLM-A02":"honda accord 2006, honda accord 2011-2017, honda accord 2019-2020"};
function fitsFix(){if(!DB||!DB.parts)return 0;const k=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');const M={};Object.entries(FITS_FIX).forEach(([n,v])=>M[k(n)]=v);let ch=0;
  DB.parts.forEach(p=>{if(p.fitsV>=1||p.cat!=='Oil filters')return;const v=M[k(p.name)];if(v===undefined)return;p.fits=v;p.fitsV=1;ch++;});if(ch)save();return ch;}
