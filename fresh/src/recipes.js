/* ---------- RECIPES: the app learns from past invoices what each car takes for an oil change
   (filter, oil viscosity, litres) and adds it by itself. It can switch to the maker's recommendation.
   The same knowledge checks job cards for mistakes (no filter, odd litres, unusual filter or oil, low price). ---------- */
const RCP_MIN=3;              /* invoices needed before a model / engine recipe is trusted (the car's own history needs 1) */
const RCP_HALF=180*864e5;     /* newer invoices count more: weight halves every 6 months */
const nrmK=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const TRIM_RX=/\b(le|se|xle|xse|gl|gls|glx|gli|xli|sr|sv|sl|s|sport|limited|platinum|hybrid|lx|ex|exl|touring|base|gx|gxr|vx|vxr|sahara|lite|ltd|premium|grande)\b/g;
const baseModel=m=>lc(m).replace(TRIM_RX,' ').replace(/\s+/g,' ').trim();
/* a car typed without an engine gets the model's engine when the model has only one for that year */
function effEng(v){if(!v)return '';if(v.engine)return v.engine;if(!v.make||!v.model||typeof carEngines!=='function')return '';try{const E=carEngines(v.make,v.model,v.year).L.filter(e=>e.yr!=='added by you');return E.length===1?E[0].n:'';}catch(e){return '';}}
const isEV=v=>/electric|\bev\b/i.test(effEng(v))&&!/hybrid|phev|dm-?i|range/i.test(effEng(v));
const dispOf=v=>{const m=lc(effEng(v)).match(/(\d\.\d)\s*l/);return m?m[1]:'';};
function engCodeX(v){const e=String(effEng(v)).toUpperCase();const t=e.split(/[\s·,/]+/).find(x=>/^[0-9A-Z]{2,}(-[A-Z]{2,4})?$/.test(x)&&/\d/.test(x)&&/[A-Z]/.test(x)&&!/^\d\.\dL$/.test(x)&&!/^\d+CYL$/.test(x));return t||'';}
/* keys from most exact to most general */
function rcpKeys(v){if(!v)return [];const mk=lc(v.make).trim(),md=baseModel(v.model),d=dispOf(v),ec=engCodeX(v);const out=[['veh',v.id,1]];
  if(md&&d)out.push(['mmd',mk+'|'+md+'|'+d,RCP_MIN]);if(ec)out.push(['eng',ec,RCP_MIN]);if(md&&!d)out.push(['mm',mk+'|'+md,RCP_MIN]);if(d)out.push(['md',mk+'|'+d,RCP_MIN]);return out;}
const keyLabel=(k,v)=>k==='veh'?T_('this car'):k==='mmd'?(v.make+' '+baseModel(v.model).replace(/\b\w/g,c=>c.toUpperCase())+' '+dispOf(v)+'L'):k==='eng'?engCodeX(v):k==='mm'?(v.make+' '+v.model):(v.make+' '+dispOf(v)+'L');
/* what an item is */
let RPM=null;
function rcpParts(){if(RPM&&RPM.n===DB.parts.length&&RPM.ref===DB.parts)return RPM;const num={},name={};DB.parts.forEach(p=>{if(p.num)num[nrmK(p.num)]=p;name[nrmK(p.name)]=p;});return RPM={n:DB.parts.length,ref:DB.parts,num,name};}
function partOfItem(i){if(i.ref){const p=byId('parts',i.ref);if(p)return p;}const M=rcpParts();return (i.num&&M.num[nrmK(i.num)])||M.name[nrmK(i.d)]||null;}
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
    rcpKeys(v).forEach(([k,id])=>{const K=k+':'+id;const e=m[K]=m[K]||{n:0,w:0,f:{},vi:{},oil:{},q:[]};e.n++;e.w+=w;
      o.filters.forEach(x=>{const fid=x.p?'p:'+x.p.id:'n:'+nrmK(x.i.num||x.i.d);const f=e.f[fid]=e.f[fid]||{w:0,n:0,label:(x.p&&x.p.name)||x.i.d,num:(x.p&&x.p.num)||x.i.num||'',pid:x.p&&x.p.id};f.w+=w;f.n++;});
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
const BRAND={lexus:'toyota',toyota:'toyota',nissan:'nissan',infiniti:'nissan',honda:'honda',mazda:'mazda',mitsubishi:'mitsubishi',hyundai:'kia hyundai',kia:'kia hyundai',subaru:'subaru',gmc:'gm',chevrolet:'gm',cadillac:'gm',ford:'ford',lincoln:'ford',dodge:'chrysler',jeep:'chrysler',chrysler:'chrysler',ram:'chrysler',mercedes:'mercedes',bmw:'bmw',byd:'byd'};
/* the recipe for a car. mode 'usual' = what we always do; 'maker' = the maker's recommendation */
function oilRecipe(v,mode){if(!v)return null;const I=rcpIndex();const keys=rcpKeys(v);const pick=fn=>{for(const [k,id,min] of keys){const e=I[k+':'+id];if(e&&e.n>=min){const r=fn(e);if(r)return {r,k,n:e.n};}}return null;};
  const F=pick(e=>{const t=Object.entries(e.f).sort((a,b)=>b[1].w-a[1].w);return t.length?t:null;});
  const VI=pick(e=>topOf(e.vi));const Q=pick(e=>e.q.length?wMedian(e.q):0);const OI=pick(e=>topOf(e.oil));
  const M=rcpParts();const fPart=f=>f&&(f.pid&&byId('parts',f.pid)||(f.num&&M.num[nrmK(f.num)])||M.name[nrmK(f.label)]||null);
  let filter=null,fsrc=null;if(F){const lst=F.r.map(x=>x[1]);fsrc={k:F.k,n:F.n};
    if(mode==='maker'){const mf=makerFilter(v);if(mf){filter=mf;fsrc={maker:1};}else{const b=BRAND[lc(v.make).trim()];filter=b&&lst.map(fPart).find(p=>p&&lc(p.name).startsWith(b))||null;}}
    if(!filter)filter=lst.map(fPart).find(p=>p&&(+p.stock||0)>0)||lst.map(fPart).find(Boolean)||null;
    if(!filter)fsrc.missing=lst[0].label;}
  if(!filter&&mode==='maker'){const mf=makerFilter(v);if(mf){filter=mf;fsrc={maker:1};}}
  const sp=specOf(v);let visc='',qty=0,vsrc=null,qsrc=null;
  if(mode==='maker'&&sp){visc=sp.visc[0];vsrc={maker:1,own:sp.own};if(sp.cap){qty=sp.cap;qsrc={maker:1,own:sp.own};}}
  if(!visc&&VI){visc=VI.r[0];vsrc={k:VI.k,n:VI.n};}
  if(!qty&&Q){qty=Q.r;qsrc={k:Q.k,n:Q.n};}
  if(!visc&&sp){visc=sp.visc[0];vsrc={maker:1};}
  if(!qty){qty=sp&&sp.cap||guessLitres('oil',v);qsrc=sp&&sp.cap?{maker:1}:{guess:1};}
  const oil=visc?oilFor(visc,OI&&OI.r[0],mode==='maker'?BRAND[lc(v.make).trim()]:''):null;
  if(!filter&&!visc)return null;
  return {mode,filter,fsrc,visc,vsrc,qty:Math.round(qty*10)/10,qsrc,oil,spec:sp};}
/* put the recipe into the job: the oil-change service, the filter and the oil. Items added by the recipe carry grp:'rxoil' so a switch replaces them */
/* the maker's filter numbers matched against the parts list (part number or the number inside the name) */
function makerFilterNums(v){const sp=specOf(v);return sp?[...(sp.filter||[]),...(sp.xref||[])].map(nrmK).filter(x=>x.length>=4):[];}
function filterIsMaker(p,v){const ns=makerFilterNums(v);if(!ns.length||!p)return null;const a=nrmK(p.num),b=nrmK(p.name);return ns.some(n=>a===n||b.includes(n)||(a.length>=6&&n.includes(a)));}
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
const srcTxt=(s,v)=>!s?'':s.maker?(s.own?T_('your maker values'):T_('maker recommendation')):s.guess?T_('engine size'):T_('from '+s.n+' visits')+' · '+keyLabel(s.k,v);
function rxBar(j){if(!j.rx||!j.rx.oil||isInvoiced(j)||!(j.items||[]).some(i=>i.grp==='rxoil'))return '';const v=vehOf(j);const m=j.rx.oil.mode;const R=oilRecipe(v,m)||{};const sp=specOf(v);
  return `<div class="rxbar"><div class="rh"><b>🛢 ${T_('Oil change')}</b><div class="chips" data-notr><button data-rxm="usual" aria-pressed="${m!=='maker'}">${T_('Usual')}</button><button data-rxm="maker" aria-pressed="${m==='maker'}" ${sp?'':'disabled'}>${T_('Maker')}</button></div></div>
   <span class="sub">${R.visc?`${esc(R.visc)} · ${srcTxt(R.vsrc,v)}`:''}${R.qty?` · ${R.qty} L`:''}${R.fsrc?` · ${T_('filter')}: ${srcTxt(R.fsrc,v)}`:''}${R.fsrc&&R.fsrc.missing?` · ⚠️ ${esc(R.fsrc.missing)} ${T_('is not in the parts list')}`:''}${!sp?` · ${T_('no maker data for this car')}`:''}${sp&&(sp.filter||[]).length&&!makerFilter(v)?` · ⚠️ ${T_('maker filter not in the parts list')}: ${esc(sp.filter.join(' / '))}`:''}</span>
   ${can.settings()?`<button class="lnk" id="rxspec">${T_('Maker values for this car')} ›</button>`:''}</div>`;}
function rxBind(j){$$('[data-rxm]').forEach(b=>b.onclick=()=>{const m=b.dataset.rxm;if(j.rx&&j.rx.oil&&j.rx.oil.mode===m)return;applyOilRecipe(j,m);save();render();});
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
  if(o.filters.length&&o.filters[0].p&&filterIsMaker(o.filters[0].p,v)===false){const sp=specOf(v);if(sp&&sp.conf==='high')out.push(['warn',T_('The filter is not the maker number')+' ('+(sp.filter||[]).slice(0,2).join(' / ')+')']);}
  const custOil=(j.items||[]).some(i=>i.custPart)||/own oil|brought|زيت(ه| العميل)|يجيب زيته/i.test(j.notes||'');
  if(has&&!o.filters.length)out.push(['bad',T_('Oil change without an oil filter')]);
  if(has&&!o.oils.length&&!custOil)out.push(['bad',T_('Oil change without engine oil')]);
  if(!has&&o.filters.length&&o.oils.length)out.push(['warn',T_('Oil and filter without the oil-change service (labour)')]);
  if(o.oils.length||o.filters.length){const R=oilRecipe(v,'usual');const sp=specOf(v);
    if(R){const lit=o.oils.reduce((a,x)=>a+(+x.i.q||0),0);if(lit&&R.qsrc&&!R.qsrc.guess&&Math.abs(lit-R.qty)>Math.max(1,R.qty*0.25))out.push(['warn',T_(lit+' litres; usually '+R.qty+' litres for this car')]);
      const vis=o.oils.map(x=>viscTxt((x.p&&x.p.name)||x.i.d)).find(Boolean);const ok=[R.vsrc&&!R.vsrc.maker?R.visc:'',...(sp?sp.visc:[])].filter(Boolean);
      if(vis&&ok.length&&!ok.includes(vis))out.push(['warn',T_('Oil '+vis+' is not the usual or the maker viscosity')+' ('+ok.join(' / ')+')']);
      if(R.fsrc&&o.filters.length){const I=rcpIndex();const e=I[R.fsrc.k+':'+rcpKeys(v).find(k=>k[0]===R.fsrc.k)[1]];const fx=o.filters[0];const fid=fx.p?'p:'+fx.p.id:'n:'+nrmK(fx.i.num||fx.i.d);
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
  if(/^ELECTRIC/.test(e))return '⚡ '+T_('electric · no engine oil');if(!es)return '';return '🛢 '+[es.oil_l?es.oil_l+' L':'',(es.visc||[]).join(' / '),(es.filter||[])[0]?T_('filter')+' '+es.filter[0]:''].filter(Boolean).join(' · ');}
