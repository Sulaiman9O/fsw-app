/* ---------- PACKAGES (2.17): the owner builds fixed-price packages (services + parts) with tiers by car
   (cylinders, origin, make, model, engine code, body). The worker picks one at "New car in" and everything is added:
   services, parts, quantities, the price, the checklist. Parts inside a package show on the invoice with their quantity
   only; stock and cost still count. Extra quantity over what is included is added as its own priced line. ---------- */
const ORIGIN={jp:'Japanese',kr:'Korean',us:'American',eu:'European',cn:'Chinese'};
const ORIGIN_MK={jp:['toyota','lexus','nissan','infiniti','honda','acura','mazda','mitsubishi','subaru','suzuki','isuzu','daihatsu'],kr:['hyundai','kia','genesis','ssangyong'],
  us:['chevrolet','gmc','cadillac','ford','lincoln','jeep','dodge','ram','chrysler','tesla','buick','hummer'],
  eu:['mercedesbenz','bmw','audi','volkswagen','porsche','landrover','jaguar','volvo','renault','peugeot','citroen','mini','fiat','skoda','opel','bentley','rollsroyce','ferrari','lamborghini','maserati','astonmartin','alfaromeo'],
  cn:['byd','mg','chery','geely','haval','greatwall','changan','gac','jac','jetour','dongfeng','baic','hongqi','exeed','tank','omoda','jaecoo','zeekr','lynkco','bestune','kaiyi','soueast','maxus','foton']};
const mkK=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
function carOrigin(v){const k=mkK(typeof fixMake==='function'?fixMake(v.make):v.make);const o=(DB.ws.origin||{})[k];if(o)return o;return Object.keys(ORIGIN_MK).find(x=>ORIGIN_MK[x].includes(k))||'';}
function carCyl(v){const e=String((typeof effEng==='function'?effEng(v):v.engine)||'');let m=e.match(/(\d{1,2})\s*cyl/i)||e.match(/\b[VLIWH](\d{1,2})\b/i);if(m)return +m[1];
  const c=typeof engCodeX==='function'&&engCodeX(v);if(c&&typeof ENGSPEC!=='undefined'){const s=ENGSPEC[mkK(c)];if(s&&s.cyl)return +s.cyl;}return 0;}
const pkgSizeOf=v=>{try{return sizeOf(v);}catch(e){return null;}};
/* does a tier fit this car? null = no; {score} = yes; {need:'engine'} = only the cylinders are unknown */
function tierFit(t,v){const c=t.cond||{};let s=0,need=false;
  if(c.make){if(mkK(fixMake(v.make))!==mkK(fixMake(c.make)))return null;s+=8;}
  if(c.model){if(baseModel(v.model)!==baseModel(c.model))return null;s+=16;}
  if(c.y0&&(+v.year||0)<+c.y0)return null;if(c.y1&&(+v.year||9999)>+c.y1)return null;if(c.y0||c.y1)s+=1;
  if(c.eng){const ec=mkK(engCodeX(v));if(!ec)need=true;else if(ec!==mkK(c.eng))return null;s+=32;}
  if(c.origin){if(carOrigin(v)!==c.origin)return null;s+=4;}
  if(c.cyl){const n=carCyl(v);if(!n)need=true;else if(n!==+c.cyl)return null;s+=2;}
  if(c.body!=null&&c.body!==''){const z=pkgSizeOf(v);if(z!=null&&z!==+c.body)return null;s+=1;}
  return need?{need:'engine',score:s}:{score:s};}
function pkgFor(p,v){if(!v||!p.tiers||!p.tiers.length)return {none:1};let best=null,need=null;
  p.tiers.forEach((t,i)=>{const f=tierFit(t,v);if(!f)return;if(f.need){if(!need||f.score>need.score)need={t,score:f.score};return;}if(!best||f.score>best.score)best={t,score:f.score};});
  if(need&&(!best||need.score>best.score))return {need:'engine'};return best?{tier:best.t}:{none:1};}
const pkgOffer=(p,t,ts)=>{ts=ts||now();return (p.offers||[]).find(o=>(!o.tier||o.tier===t.id)&&(!o.from||ts>=new Date(o.from+'T00:00').getTime())&&(!o.to||ts<=new Date(o.to+'T23:59:59').getTime()));};
const pkgPrice=(p,t,ts)=>{const base=+t.price||0;const o=pkgOffer(p,t,ts);if(!o)return {price:base,base};const pr=o.type==='pct'?Math.max(0,base*(1-(+o.val||0)/100)):Math.max(0,+o.val||0);return {price:Math.round(pr*1000)/1000,base,offer:o};};
/* agency oil: car make → oil brand (owner edits). Filled once from the oils in stock with the same name */
const OILBRAND0={lexus:['lexus','toyota'],toyota:['toyota'],nissan:['nissan'],infiniti:['nissan'],honda:['honda'],mercedesbenz:['mercedes'],chevrolet:['ac delco','acdelco'],gmc:['ac delco','acdelco'],cadillac:['ac delco','acdelco'],ford:['motorcraft','ford'],lincoln:['motorcraft','ford'],mitsubishi:['mitsubishi'],mazda:['mazda'],hyundai:['hyundai','kia'],kia:['kia','hyundai'],subaru:['subaru']};
const oilBrands=()=>[...new Set(DB.parts.filter(p=>p.cat==='Engine oil').map(p=>brandOf(p)))].sort();
function agencyOilFill(){DB.ws.agencyOil=DB.ws.agencyOil||{};if(DB.ws.agencyOilV)return;const B=oilBrands();
  Object.entries(OILBRAND0).forEach(([mk,L])=>{if(DB.ws.agencyOil[mk])return;const b=B.find(x=>L.some(w=>x.toLowerCase().startsWith(w)));if(b)DB.ws.agencyOil[mk]=b;});DB.ws.agencyOilV=1;save();}
const agencyBrand=v=>(DB.ws.agencyOil||{})[mkK(fixMake(v.make))]||'';
/* one package line resolved for this car: which part/service and how many */
function pkgItemFor(it,v,R){if(it.k==='svc'){const s=byId('services',it.ref);return s?{k:'labour',ref:s.id,d:s.name,ar:s.ar||'',tag:s.tag,war:s.war||'',min:+s.min||0}:null;}
  let p=null;if(it.k==='part')p=byId('parts',it.ref);
  else if(it.auto==='filter')p=(R&&R.filter)||makerFilter(v)||(typeof fitsFilter==='function'?fitsFilter(v):null);
  else if(it.auto==='oilUsual')p=R&&R.oil;
  else if(it.auto==='oilAgency'){const b=agencyBrand(v);if(b){const vs=[R&&R.visc,...((R&&R.spec&&R.spec.visc)||[])].filter(Boolean);const L=DB.parts.filter(x=>x.cat==='Engine oil'&&brandOf(x)===b);
      for(const vi of vs){const m=L.filter(x=>viscTxt(x.name)===vi);if(m.length){p=m.find(x=>(+x.stock||0)>0)||m[0];break;}}if(!p&&!vs.length)p=L.find(x=>(+x.stock||0)>0)||L[0]||null;}if(!p)p=R&&R.oil;}
  return p?{k:'part',ref:p.id,d:p.name,num:p.num||'',u:p.unit==='L'?'L':'',cost:+p.cost||0,part:p}:null;}
const AUTO_T={filter:'Oil filter for the car',oilUsual:'Engine oil · usual for the car',oilAgency:'Engine oil · agency brand'};
function pkgLabel(it){if(it.k==='svc'){const s=byId('services',it.ref);return s?s.name:'(deleted service)';}if(it.k==='part'){const p=byId('parts',it.ref);return p?p.name:'(deleted part)';}return T_(AUTO_T[it.auto]||it.auto);}
/* build the lines for a car; nothing is added when something is missing */
function pkgBuild(p,v,opt){opt=opt||{};const F=pkgFor(p,v);if(!F.tier)return F;const t=F.tier;const R=oilRecipe(v,'usual');const inst=uid('pk');const P=pkgPrice(p,t);const miss=[],short=[];
  const head={k:'pkg',pkg:p.id,tier:t.id,inst,d:p.name,ar:p.ar||'',desc:p.desc||'',q:1,u:'',p:P.price,p0:P.base,offer:P.offer?P.offer.id:'',lockP:true,by:S.user?S.user.name:''};
  const mem=[];(p.items||[]).forEach(it=>{const r=pkgItemFor(it,v,R);if(!r){miss.push(pkgLabel(it));return;}const ov=(t.q||{})[it.id]||{};
    let q=it.qm==='car'?(it.auto&&it.auto.startsWith('oil')?(R&&R.qty)||(R&&R.spec&&R.spec.cap)||guessLitres('oil',v):1):(+ov.q||+it.q||1);
    const incl=ov.incl!=null&&ov.incl!==''?+ov.incl:(+it.incl||0),extra=ov.extra!=null&&ov.extra!==''?+ov.extra:(+it.extra||0);
    const m=Object.assign({},r,{q:Math.round(q*10)/10,p:0,inPkg:inst,pid:it.id,incl,extra,lockP:true,by:head.by});delete m.part;
    if(r.part&&(+r.part.stock||0)<m.q-0.0001){const a=(r.part.alts||[]).map(x=>byId('parts',x)).find(x=>x&&(+x.stock||0)>=m.q);if(a){m.ref=a.id;m.d=a.name;m.num=a.num||'';m.cost=+a.cost||0;m.swapped=r.part.name;}else short.push(r.part.name);}
    mem.push(m);});
  if(miss.length&&!opt.force)return {missing:miss,tier:t};
  const add=(p.addons||[]).filter(a=>(opt.addons||[]).includes(a.id)).map(a=>({k:'labour',d:a.name,ar:a.ar||'',q:1,u:'',p:+a.price||0,addon:a.id,ofPkg:inst,by:head.by}));
  const lines=[head,...mem];pkgExtras(lines,inst);return {tier:t,lines:lines.concat(add),short,price:P,inst};}
/* extra over the included quantity: one priced line per item */
function pkgExtras(items,inst){for(let i=items.length-1;i>=0;i--)if(items[i].pkgx===inst)items.splice(i,1);
  let at=items.map((x,i)=>x.inPkg===inst?i:-1).filter(i=>i>=0).pop();if(at==null)return;
  items.filter(x=>x.inPkg===inst&&+x.incl>0&&+x.extra>0&&(+x.q||0)>+x.incl+0.0001).forEach(x=>{const n=Math.round(((+x.q)-(+x.incl))*100)/100;
    items.splice(++at,0,{k:'labour',d:'Extra '+n+(x.u?' '+x.u:'')+' · '+x.d,ar:'زيادة '+n+(x.u==='L'?' لتر':''),q:n,u:x.u||'',p:+x.extra,pkgx:inst,lockP:true});});}
function pkgSyncAll(j){const before=JSON.stringify(j.items);[...new Set((j.items||[]).filter(i=>i.k==='pkg').map(i=>i.inst))].forEach(inst=>pkgExtras(j.items,inst));
  /* lines whose package header was removed go with it */
  const live=new Set(j.items.filter(i=>i.k==='pkg').map(i=>i.inst));j.items=j.items.filter(i=>!(i.inPkg&&!live.has(i.inPkg))&&!(i.pkgx&&!live.has(i.pkgx)));
  if(JSON.stringify(j.items)!==before)save();}
function pkgApply(j,v,sel){const p=byId('pkgs',sel.id);if(!p)return false;const B=pkgBuild(p,v,{addons:sel.addons||[]});if(!B.lines){toast(B.need?T_('Choose the engine of the car first'):T_('This package does not fit this car'));return false;}
  j.items=(j.items||[]).concat(B.lines);if(p.insp&&!j.insp){const t=(DB.insp||[]).find(x=>x.id===p.insp);if(t)j.insp={name:t.name,items:t.items.slice(),r:{}};}
  logJ(j,'Package '+p.name+' · '+f3(B.price.price)+(B.price.offer?' (offer, was '+f3(B.price.base)+')':''));
  if(B.short.length)toast(T_('Not enough in stock')+': '+B.short.join(', '));return true;}
/* cost / profit of one package on a job */
function pkgMoney(j,inst){let rev=0,cost=0;(j.items||[]).forEach(i=>{if(i.inst===inst||i.pkgx===inst){rev+=(+i.q||0)*(+i.p||0);}if(i.inPkg===inst&&i.k==='part')cost+=(+i.q||0)*(+i.cost||0);});return {rev,cost,profit:rev-cost};}

/* ---------- job screen: package lines, no price edits inside a package ---------- */
(function(){const J=SCREENS.job;SCREENS.job=m=>{const j=byId('jobs',S.p.id);if(j&&!isInvoiced(j))try{pkgSyncAll(j);}catch(e){}J(m);
  if(!j)return;(j.items||[]).forEach((it,i)=>{const b=m.querySelector(`[data-it="${i}"]`);if(!b)return;
    if(it.k==='pkg'){b.classList.add('pkh');const s=b.querySelector('small');if(s)s.innerHTML=`📦 ${T_('Package')}${it.p0&&Math.abs(it.p0-it.p)>0.0005?' · <s>'+f3(it.p0)+'</s>':''}${can.cost()?' · '+T_('profit')+' '+f3(pkgMoney(j,it.inst).profit):''}`;}
    else if(it.inPkg){b.classList.add('pkm');const r=b.querySelector(':scope > b');if(r)r.innerHTML=`<small class="pkin">${T_('In package')}</small>`;const s=b.querySelector('small');if(s)s.innerHTML=(it.k==='part'?T_('Part'):T_('Labour'))+(it.num?' · <bdi dir="ltr" data-notr>'+esc(it.num)+'</bdi>':'')+' · '+(+it.q)+(it.u?' '+esc(it.u):'')+(+it.incl?' · '+T_('included')+' '+it.incl:'');}});};})();
(function(){const E=editItemSheet;window.editItemSheet=editItemSheet=function(j,i,isNew){const it=j.items[i];if(!it)return;
  if(it.k==='pkg'){const p=byId('pkgs',it.pkg)||{};const M=pkgMoney(j,it.inst);
    openSheet(`<h3>📦 ${esc(it.d)}</h3>${it.desc?`<p class="hint">${esc(it.desc)}</p>`:''}<div class="card"><div class="jb-r"><div>${T_('Package price')}${it.p0&&Math.abs(it.p0-it.p)>0.0005?` <s>${f3(it.p0)}</s>`:''}</div><b>${f3(it.p)}</b></div>${can.cost()?`<div class="jb-r"><div>${T_('Cost of parts')}</div><b>${f3(M.cost)}</b></div><div class="jb-r tot"><div>${T_('Profit')}</div><b>${f3(M.profit)}</b></div>`:''}</div>
      <p class="hint">${T_('The package price cannot be changed. Change a quantity by tapping its line; extra over what is included is added by itself.')}</p><button class="btn ghost jb-del" id="pkdel">${T_('Remove the package')}</button>`,el=>{
      el.querySelector('#pkdel').onclick=()=>{j.items=j.items.filter(x=>x.inst!==it.inst&&x.inPkg!==it.inst&&x.pkgx!==it.inst&&x.ofPkg!==it.inst);logJ(j,'Package removed · '+it.d);save();closeSheet();render();};});return;}
  if(it.inPkg||it.pkgx){if(it.pkgx){toast(T_('Extra is counted by itself from the quantity'));return;}
    openSheet(`<h3>${esc(it.d)}</h3><p class="hint">${T_('In package')} · ${it.incl?T_('included')+' '+it.incl+(it.u?' '+esc(it.u):'')+(it.extra?' · '+T_('each extra')+' '+f3(it.extra):''):''}</p>
      <label class="field-l">${T_('Qty')}${it.u?' ('+esc(it.u)+')':''}<input class="field" id="pkq" inputmode="decimal" value="${+it.q}"></label><button class="btn" id="pkok">${T_('Save')}</button>`,el=>{
      el.querySelector('#pkok').onclick=()=>{const q=num($('#pkq').value);if(!(q>0)){toast(T_('Type the quantity'));return;}it.q=q;pkgExtras(j.items,it.inPkg);logJ(j,'Package qty · '+it.d+' → '+q);save();closeSheet();render();};});return;}
  return E(j,i,isNew);};})();
/* the long-press menu: inside a package only the quantity and swap make sense */
(function(){const IM=itemMenu;window.itemMenu=itemMenu=function(j,i){const it=j.items[i];if(it&&(it.k==='pkg'||it.inPkg||it.pkgx)&&!isInvoiced(j)){editItemSheet(j,i);return;}return IM(j,i);};})();

/* ---------- invoice: the package with its parts and quantities, one price ---------- */
(function(){const IH=invoiceHtml;window.invoiceHtml=invoiceHtml=function(j,print){const P=(j.items||[]).filter(i=>i.k==='pkg');if(!P.length)return IH(j,print);
  const inPk=i=>i.k==='pkg'||i.inPkg||i.pkgx;const rest=Object.assign({},j,{items:(j.items||[]).filter(i=>!inPk(i))});let h=IH(rest,print);
  const T=jobTotals(j);let n=(rest.items||[]).filter(i=>!i.pend).length;
  const rows=P.map(pk=>{n++;const mem=j.items.filter(i=>i.inPkg===pk.inst),ex=j.items.filter(i=>i.pkgx===pk.inst);
    return `<tr class="pkh"><td class="n">${n}</td><td><b>${esc(pk.d)}</b>${pk.ar?`<div class="ar" style="font-size:2.7mm;color:#444">${esc(pk.ar)}</div>`:''}${pk.desc?`<div style="font-size:2.4mm;color:#555">${esc(pk.desc)}</div>`:''}</td><td class="q">1</td><td class="u">${pk.p0&&Math.abs(pk.p0-pk.p)>0.0005?`<s style="color:#888">${f3(pk.p0)}</s> `:''}${f3(pk.p)}</td><td class="a">${f3(pk.p)}</td></tr>`+
      mem.map(i=>`<tr class="pkm"><td></td><td style="padding-inline-start:5mm">· ${esc(i.d)}${i.ar?` <span class="ar" style="color:#555">${esc(i.ar)}</span>`:''}</td><td class="q">${+i.q}${i.u?' '+esc(i.u):''}</td><td colspan="2" class="a" style="color:#666;font-size:2.6mm">Included · ضمن الباقة</td></tr>`).join('')+
      ex.map(i=>`<tr><td></td><td style="padding-inline-start:5mm">${esc(i.d)}${i.ar?` <span class="ar" style="color:#555">${esc(i.ar)}</span>`:''}</td><td class="q">${+i.q}${i.u?' '+esc(i.u):''}</td><td class="u">${f3(i.p)}</td><td class="a">${f3(i.q*i.p)}</td></tr>`).join('');}).join('');
  h=h.replace('<tbody>',`<tbody><tr class="grp"><td colspan="5">Packages · <span class="ar0">باقات</span></td></tr>${rows}`);
  /* totals from the whole job */
  const R=jobTotals(rest);const fx=x=>f3(x);h=h.replace(`<span>${fx(R.total)} ${DB.ws.currency}</span>`,`<span>${fx(T.total)} ${DB.ws.currency}</span>`);
  if(R.paid!==T.paid||R.due!==T.due){h=h.replace(`<div><span>Due</span><span>${fx(R.due)}</span></div>`,`<div><span>Due</span><span>${fx(T.due)}</span></div>`);}
  h=h.replace(/<div><span>Parts<\/span><span>[^<]*<\/span><\/div><div><span>Labour<\/span><span>[^<]*<\/span><\/div>/,'');
  h=h.replace('<div class="inv-paid">PAID · مدفوع</div>','');if(T.due<=0.0005&&T.total>0&&!j.returned)h=h.replace('<div class="inv-ft">','<div class="inv-paid">PAID · مدفوع</div><div class="inv-ft">');
  return h;};})();
/* checks: the owner sees when a package sells under its minimum profit */
(function(){const JC=jobChecks;window.jobChecks=jobChecks=function(j){const out=JC((j.items||[]).some(i=>i.inPkg||i.k==='pkg')?Object.assign({},j,{items:j.items.map(i=>i.inPkg||i.k==='pkg'||i.pkgx?Object.assign({},i,{free:true}):i)}):j);if(!can.cost())return out;(j.items||[]).filter(i=>i.k==='pkg').forEach(pk=>{const p=byId('pkgs',pk.pkg);if(!p||!(+p.minProfit>0))return;const M=pkgMoney(j,pk.inst);if(M.profit<+p.minProfit-0.0005)out.push(['warn',T_('Package profit is low')+': '+esc(pk.d)+' · '+f3(M.profit)+' / '+f3(p.minProfit)]);});return out;};})();

/* ---------- New car in: choose a package ---------- */
function pkgPickHtml(N,v){const L=(DB.pkgs||[]).filter(p=>p.on!==false&&(p.tiers||[]).length);if(!L.length||!v||!v.make)return '';const sel=N.pkg||{};
  const rows=L.map(p=>{const F=pkgFor(p,v);if(F.none)return '';if(F.need)return `<button class="row pkr" data-pkeng="1"><div><b>📦 ${esc(p.name)}</b><span>${T_('Choose the engine of the car first')}</span></div><span class="v">⚙️</span></button>`;
    const P=pkgPrice(p,F.tier);const on=sel.id===p.id;return `<button class="row pkr${on?' selr':''}" data-pk="${p.id}"><div><b>📦 ${esc(I18N.lang==='ar'&&p.ar?p.ar:p.name)}</b><span>${esc(F.tier.name||tierName(F.tier))}${P.offer?' · <s>'+f3(P.base)+'</s>':''}</span></div><span class="v">${f3(P.price)}${on?' ✓':''}</span></button>`;}).filter(Boolean);
  if(!rows.length)return `${sec('Package')}<p class="hint">${T_('No package fits this car.')}</p>`;
  const p=sel.id&&byId('pkgs',sel.id);
  return `${sec('Package',sel.id?'<button class="lnk" id="pkclr">'+T_('No package')+'</button>':'')}<div class="list">${rows.join('')}</div>
   ${p&&(p.addons||[]).length?`<div class="chips pkadd">${p.addons.map(a=>`<button data-pka="${a.id}" aria-pressed="${(sel.addons||[]).includes(a.id)}">＋ ${esc(I18N.lang==='ar'&&a.ar?a.ar:a.name)} · ${f3(a.price)}</button>`).join('')}</div>`:''}`;}
(function(){const NJ=SCREENS.newjob;SCREENS.newjob=m=>{NJ(m);const N=S.p.n;if(!N)return;const v=N.vehId&&byId('vehicles',N.vehId)||(N.make?{id:'_n',make:N.make,model:N.model,year:N.year,engine:N.engine}:null);
  const go2=$('#ngo');if(!go2||!v)return;const box=document.createElement('div');box.id='npk';box.innerHTML=pkgPickHtml(N,v);const est=$('#nest');(est?est.closest('label'):go2).before(box);
  box.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{N.pkg=N.pkg&&N.pkg.id===b.dataset.pk?null:{id:b.dataset.pk,addons:[]};render();});
  box.querySelectorAll('[data-pka]').forEach(b=>b.onclick=()=>{const a=N.pkg.addons=N.pkg.addons||[];const k=b.dataset.pka;const i=a.indexOf(k);if(i>=0)a.splice(i,1);else a.push(k);b.setAttribute('aria-pressed',i<0);});
  const cl=box.querySelector('#pkclr');if(cl)cl.onclick=()=>{N.pkg=null;render();};
  box.querySelectorAll('[data-pkeng]').forEach(b=>b.onclick=()=>{const cur=N.vehId?byId('vehicles',N.vehId):N;carPicker({make:cur.make,model:cur.model,year:cur.year,engine:''},r=>{if(N.vehId){const vv=byId('vehicles',N.vehId);Object.assign(vv,{make:r.make,model:r.model,year:r.year||vv.year,engine:r.engine});save();}else Object.assign(N,r);render();});});
  /* opening the job adds the package */
  const old=go2.onclick;go2.onclick=()=>{const want=N.pkg;const n0=DB.jobs.length;old();if(!want)return;const j=DB.jobs.length>n0?DB.jobs[DB.jobs.length-1]:null;if(!j)return;
    const vv=byId('vehicles',j.veh);if(pkgApply(j,vv,want)){save();N.pkg=null;render();}};};})();

/* ---------- Builder (owner) ---------- */
const tierName=t=>{const c=t.cond||{};return [c.make,c.model,c.y0||c.y1?(c.y0||'')+'–'+(c.y1||''):'',c.eng,c.origin?T_(ORIGIN[c.origin]):'',c.cyl?c.cyl+' '+T_('cyl'):'',c.body!=null&&c.body!==''?DB.sizes[+c.body]:''].filter(Boolean).join(' · ')||T_('All cars');};
function pkgStats(){const st={};DB.jobs.forEach(j=>{if(j.returned||j.stage==='estimate'||!isInvoiced(j))return;(j.items||[]).filter(i=>i.k==='pkg').forEach(pk=>{const M=pkgMoney(j,pk.inst);const s=st[pk.pkg]=st[pk.pkg]||{n:0,rev:0,cost:0,low:[]};s.n++;s.rev+=M.rev;s.cost+=M.cost;
  const p=byId('pkgs',pk.pkg);if(p&&+p.minProfit>0&&M.profit<+p.minProfit-0.0005)s.low.push({j,profit:M.profit});});});return st;}
SCREENS.pkgs=m=>{if(!can.settings()){go('home');return;}agencyOilFill();const st=pkgStats();
  m.innerHTML=head('Packages',`<button class="lnk" id="pkmore" aria-label="More">⋯</button><button class="lnk" id="pknew">＋ ${T_('Package')}</button>`)+
  `<details class="pmore pkhelp" ${DB.pkgs.length?'':'open'}><summary>❓ ${T_('How packages work')}</summary><ol class="pkhow">
   <li>${T_('Tap ＋ Package and type its name.')}</li><li>${T_('Under “What is inside” add the service and the parts. For oil and filter choose “by the car”: the app picks the right ones for each car.')}</li>
   <li>${T_('Under “Tiers and prices” add a few tiers, e.g. Japanese 4 cylinders, Japanese 6 cylinders. One tier covers every car that fits it — no need to add cars one by one.')}</li>
   <li>${T_('Save. At New car in, after choosing the car, its packages show with their price. Tap one, then Open job card.')}</li></ol></details>`+
  (DB.pkgs.length?`<div class="list">${DB.pkgs.map(p=>{const s=st[p.id]||{n:0,rev:0,cost:0,low:[]};return `<button class="row" data-pkg="${p.id}"><div><b>${p.on===false?'⏸ ':''}📦 ${esc(I18N.lang==='ar'&&p.ar?p.ar:p.name)}</b><span>${(p.tiers||[]).length} ${T_('tiers')} · ${(p.items||[]).length} ${T_('items')} · ${T_('sold')} ${s.n}${can.cost()&&s.n?' · '+T_('profit')+' '+f3(s.rev-s.cost):''}${s.low.length?' · <span class="tg tgr">'+s.low.length+' '+T_('low profit')+'</span>':''}</span></div><span class="v">›</span></button>`;}).join('')}</div>`
   :empty('📦','No packages yet. Tap <b>＋ Package</b> to build your first one.'))+
  (DB.pkgs.length&&Object.keys(st).length?sec('Report')+`<div class="card"><table class="pkrep"><tr><th>${T_('Package')}</th><th>${T_('Sold')}</th><th>${T_('Revenue')}</th>${can.cost()?`<th>${T_('Cost')}</th><th>${T_('Profit')}</th>`:''}</tr>${DB.pkgs.filter(p=>st[p.id]).map(p=>{const s=st[p.id];return `<tr><td>${esc(p.name)}</td><td>${s.n}</td><td>${f3(s.rev)}</td>${can.cost()?`<td>${f3(s.cost)}</td><td>${f3(s.rev-s.cost)}</td>`:''}</tr>`;}).join('')}</table></div>`:'');
  $('#pknew').onclick=()=>{const p={id:uid('pkg'),name:'',ar:'',desc:'',on:true,items:[],tiers:[],addons:[],offers:[],t:now()};DB.pkgs.push(p);save();go('pkg',{id:p.id});};
  $$('[data-pkg]').forEach(b=>b.onclick=()=>go('pkg',{id:b.dataset.pkg}));
  $('#pkmore').onclick=()=>actionSheet(T_('Packages'),'',[{ic:'🛢',t:'Agency oil by make',s:'Oil',fn:agencyOilSheet}]);};
function agencyOilSheet(){agencyOilFill();const B=oilBrands();const used=[...new Set(DB.vehicles.map(v=>fixMake(v.make)).filter(Boolean))].sort();const A=DB.ws.agencyOil;
  openSheet(`<h3>🛢 ${T_('Agency oil by make')}</h3><p class="hint">${T_('Used by packages with “Engine oil · agency brand”. The oil with the car’s viscosity is taken from this brand.')}</p>
   <div class="list">${used.map(mk=>`<div class="row"><div><b>${esc(mk)}</b></div><select class="field sm" data-ao="${esc(mkK(mk))}"><option value="">—</option>${B.map(b=>`<option ${A[mkK(mk)]===b?'selected':''}>${esc(b)}</option>`).join('')}</select></div>`).join('')}</div>`,el=>{
   el.querySelectorAll('[data-ao]').forEach(s=>s.onchange=()=>{if(s.value)A[s.dataset.ao]=s.value;else delete A[s.dataset.ao];save();});});}
SCREENS.pkg=m=>{const p=byId('pkgs',S.p.id);if(!p||!can.settings()){go('pkgs');return;}p.items=p.items||[];p.tiers=p.tiers||[];p.addons=p.addons||[];p.offers=p.offers||[];
  const qmT=it=>it.qm==='car'?T_('by the car'):(+it.q||1)+'';
  m.innerHTML=head(esc(p.name||p.ar||T_('New package')),`<button class="lnk" id="pkdup">${T_('Copy')}</button>`)+`
  <label class="field-l">${T_('Name')} (English)<input class="field" id="pn1" value="${esc(p.name)}"></label>
  <label class="field-l">الاسم بالعربي<input class="field ar" dir="rtl" id="pn2" value="${esc(p.ar||'')}"></label>
  <label class="field-l">${T_('Description for the customer (on the invoice)')}<textarea class="field" id="pn3" rows="2">${esc(p.desc||'')}</textarea></label>
  <label class="chk"><input type="checkbox" id="pon" ${p.on!==false?'checked':''}> ${T_('On (workers can choose it)')}</label>
  ${sec('What is inside',`${p.items.length}`)}
  <div class="list">${p.items.map((it,i)=>`<button class="row" data-pi="${i}"><div><b>${it.k==='svc'?'🛠':it.k==='part'?'🔩':'✨'} ${esc(pkgLabel(it))}</b><span>${T_('Qty')} ${qmT(it)}${+it.incl?' · '+T_('included')+' '+it.incl+' · '+T_('each extra')+' '+f3(it.extra):''}</span></div><span class="v">›</span></button>`).join('')||'<p class="hint">'+T_('Nothing yet.')+'</p>'}</div>
  <div class="chips"><button id="pa-s">＋ ${T_('Service')}</button><button id="pa-p">＋ ${T_('Fixed part')}</button><button id="pa-o">＋ ${T_('Oil by the car')}</button><button id="pa-f">＋ ${T_('Filter by the car')}</button></div>
  ${sec('Tiers and prices',`${p.tiers.length}`)}
  <p class="hint">${T_('The most exact tier wins: engine code, then model, make, origin, cylinders, body.')}</p>
  <div class="list">${p.tiers.map((t,i)=>`<button class="row" data-pt="${i}"><div><b>${esc(t.name||tierName(t))}</b><span>${t.name?esc(tierName(t)):''}${(p.offers||[]).some(o=>!o.tier||o.tier===t.id)?(t.name?' · ':'')+'🏷 '+T_('Offer'):''}</span></div><span class="v">${f3(t.price)}</span></button>`).join('')||'<p class="hint">'+T_('Add at least one tier, e.g. 4 cylinders.')+'</p>'}</div>
  <button class="btn ghost sm" id="pa-t">＋ ${T_('Tier')}</button>
  ${sec('Checklist')}
  <select class="field" id="pinsp"><option value="">${T_('None')}</option>${(DB.insp||[]).map(t=>`<option value="${t.id}" ${p.insp===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select>
  ${sec('Optional add-ons',`${p.addons.length}`)}
  <div class="list">${p.addons.map((a,i)=>`<button class="row" data-pad="${i}"><div><b>＋ ${esc(a.name)}</b><span>${esc(a.ar||'')}</span></div><span class="v">${f3(a.price)}</span></button>`).join('')}</div><button class="btn ghost sm" id="pa-a">＋ ${T_('Add-on')}</button>
  ${sec('Offers',`${p.offers.length}`)}
  <div class="list">${p.offers.map((o,i)=>`<button class="row" data-po="${i}"><div><b>🏷 ${o.type==='pct'?(+o.val)+'%':f3(o.val)}</b><span>${o.tier?esc((p.tiers.find(t=>t.id===o.tier)||{}).name||tierName(p.tiers.find(t=>t.id===o.tier)||{})):T_('All tiers')} · ${esc(o.from||'…')} → ${esc(o.to||'…')}</span></div><span class="v">›</span></button>`).join('')}</div><button class="btn ghost sm" id="pa-of">＋ ${T_('Offer')}</button>
  ${can.cost()?`<label class="field-l">${T_('Warn me when profit on a car is under')} (${DB.ws.currency})<input class="field" id="pmin" inputmode="decimal" value="${p.minProfit?f3(p.minProfit):''}"></label>`:''}
  <button class="btn" id="psave">${T_('Save')}</button><button class="btn ghost jb-del" id="pdel">${T_('Delete package')}</button>`;
  const keep=()=>{p.name=$('#pn1').value.trim()||$('#pn2').value.trim()||'Package';p.ar=$('#pn2').value.trim();p.desc=$('#pn3').value.trim();p.on=$('#pon').checked;p.insp=$('#pinsp').value;const mn=$('#pmin');if(mn)p.minProfit=num(mn.value);};
  const redo=()=>{keep();save();render();};
  $('#psave').onclick=()=>{keep();save();toast(T_('Saved'));go('pkgs');};
  $('#pdel').onclick=()=>confirmSheet(T_('Delete this package? Old invoices keep it.'),T_('Delete package'),()=>{DB.pkgs=DB.pkgs.filter(x=>x!==p);save();go('pkgs');});
  $('#pkdup').onclick=()=>{keep();const c=JSON.parse(JSON.stringify(p));c.id=uid('pkg');c.name=p.name+' (copy)';c.t=now();const idm={};c.items.forEach(it=>{const o=it.id;it.id=uid('pi');idm[o]=it.id;});c.tiers.forEach(t=>{const tq={};Object.entries(t.q||{}).forEach(([k,v])=>{if(idm[k])tq[idm[k]]=v;});t.q=tq;const o=t.id;t.id=uid('pt');c.offers.forEach(of=>{if(of.tier===o)of.tier=t.id;});});DB.pkgs.push(c);save();go('pkg',{id:c.id});toast(T_('Copied'));};
  const pickFrom=(title,L,fn)=>openSheet(`<h3>${title}</h3><input class="field" id="pfq" placeholder="${T_('Search')}"><div class="list" id="pfl">${L.map(x=>`<button class="row" data-pf="${x.id}" data-s="${esc((x.name+' '+(x.ar||'')+' '+(x.num||'')).toLowerCase())}"><div><b>${esc(x.name)}</b><span>${esc(x.ar||x.num||x.cat||'')}</span></div><span class="v">${x.price!=null?f3(x.price):''}</span></button>`).join('')}</div>`,el=>{
    const q=el.querySelector('#pfq');q.oninput=()=>{const s=q.value.toLowerCase().trim();el.querySelectorAll('[data-pf]').forEach(b=>b.hidden=!!s&&!b.dataset.s.includes(s));};el.querySelectorAll('[data-pf]').forEach(b=>b.onclick=()=>{closeSheet();fn(b.dataset.pf);});});
  $('#pa-s').onclick=()=>{keep();pickFrom(T_('Choose a service'),DB.services.filter(s=>!s.hidden).map(s=>({id:s.id,name:s.name,ar:s.ar,price:s.p[0]})),id=>{p.items.push({id:uid('pi'),k:'svc',ref:id,qm:'fixed',q:1});redo();});};
  $('#pa-p').onclick=()=>{keep();pickFrom(T_('Choose a part'),DB.parts,id=>{const pt=byId('parts',id);p.items.push({id:uid('pi'),k:'part',ref:id,qm:'fixed',q:pt&&pt.unit==='L'?4:1});redo();});};
  $('#pa-o').onclick=()=>{keep();actionSheet(T_('Oil by the car'),'',[{ic:'🛢',t:AUTO_T.oilAgency,d:'Brand from the agency oil table, viscosity from the car',fn:()=>{p.items.push({id:uid('pi'),k:'auto',auto:'oilAgency',qm:'car'});redo();}},{ic:'🛢',t:AUTO_T.oilUsual,d:'The oil you usually put in this car',fn:()=>{p.items.push({id:uid('pi'),k:'auto',auto:'oilUsual',qm:'car'});redo();}}]);};
  $('#pa-f').onclick=()=>{keep();p.items.push({id:uid('pi'),k:'auto',auto:'filter',qm:'fixed',q:1});redo();};
  $$('[data-pi]').forEach(b=>b.onclick=()=>{keep();const it=p.items[+b.dataset.pi];const oil=it.auto&&it.auto.startsWith('oil')||(it.k==='part'&&(byId('parts',it.ref)||{}).unit==='L');
    openSheet(`<h3>${esc(pkgLabel(it))}</h3>
     <div class="field-l">${T_('Quantity')}</div><div class="chips"><button data-qm="fixed" aria-pressed="${it.qm!=='car'}">${T_('Fixed number')}</button>${oil?`<button data-qm="car" aria-pressed="${it.qm==='car'}">${T_('By the car (litres from the engine)')}</button>`:''}</div>
     <div id="qmf" ${it.qm==='car'?'hidden':''}><input class="field" id="piq" inputmode="decimal" value="${+it.q||1}"></div>
     <div class="in2"><label class="field-l">${T_('Included in the price')}<input class="field" id="pii" inputmode="decimal" value="${it.incl||''}" placeholder="${T_('e.g. 5')}"></label><label class="field-l">${T_('Price of each extra')}<input class="field" id="pix" inputmode="decimal" value="${it.extra?f3(it.extra):''}"></label></div>
     <p class="hint">${T_('Leave “included” empty if there is no extra charge.')}</p><button class="btn" id="piok">${T_('Save')}</button><button class="btn ghost jb-del" id="pirm">${T_('Remove')}</button>`,el=>{
     let qm=it.qm||'fixed';el.querySelectorAll('[data-qm]').forEach(x=>x.onclick=()=>{qm=x.dataset.qm;el.querySelectorAll('[data-qm]').forEach(y=>y.setAttribute('aria-pressed',y===x));el.querySelector('#qmf').hidden=qm==='car';});
     el.querySelector('#piok').onclick=()=>{it.qm=qm;it.q=num($('#piq').value)||1;it.incl=num($('#pii').value);it.extra=num($('#pix').value);closeSheet();redo();};
     el.querySelector('#pirm').onclick=()=>{p.items.splice(+b.dataset.pi,1);p.tiers.forEach(t=>{if(t.q)delete t.q[it.id];});closeSheet();redo();};});});
  const tierSheet=t=>{const isNew=!t;t=t||{id:uid('pt'),name:'',cond:{},price:0,q:{}};const c=t.cond=t.cond||{};t.q=t.q||{};const mks=carMakes('').slice(0,60).map(o=>o.m[0]);
    openSheet(`<h3>${isNew?T_('New tier'):esc(t.name||tierName(t))}</h3>
     <div class="field-l">${T_('Cylinders')}</div><div class="chips" id="tc">${['',4,6,8].map(x=>`<button data-cy="${x}" aria-pressed="${String(c.cyl||'')===String(x)}">${x||T_('Any')}</button>`).join('')}</div>
     <div class="field-l">${T_('Origin')}</div><div class="chips" id="to">${[['',T_('Any')],...Object.entries(ORIGIN).map(([k,v])=>[k,T_(v)])].map(([k,l])=>`<button data-or="${k}" aria-pressed="${(c.origin||'')===k}">${l}</button>`).join('')}</div>
     <div class="field-l">${T_('Body')}</div><div class="chips" id="tb">${[['',T_('Any')],...DB.sizes.map((z,i)=>[String(i),z])].map(([k,l])=>`<button data-bd="${k}" aria-pressed="${String(c.body??'')===k}">${esc(l)}</button>`).join('')}</div>
     <div class="in2"><label class="field-l">${T_('Make')}<input class="field" id="tmk" list="tmkl" value="${esc(c.make||'')}"></label><label class="field-l">${T_('Model')}<input class="field" id="tmo" value="${esc(c.model||'')}"></label></div><datalist id="tmkl">${mks.map(x=>`<option>${esc(x)}</option>`).join('')}</datalist>
     <div class="in2"><label class="field-l">${T_('Engine code')}<input class="field" id="ten" value="${esc(c.eng||'')}" placeholder="V35A"></label><label class="field-l">${T_('Years')}<div class="row2"><input class="field" id="ty0" inputmode="numeric" value="${esc(c.y0||'')}" placeholder="2015"><input class="field" id="ty1" inputmode="numeric" value="${esc(c.y1||'')}" placeholder="2025"></div></label></div>
     <label class="field-l">${T_('Name (optional)')}<input class="field" id="tnm" value="${esc(t.name||'')}"></label>
     <label class="field-l">${T_('Package price for this tier')} (${DB.ws.currency})<input class="field" id="tpr" inputmode="decimal" value="${t.price?f3(t.price):''}"></label>
     ${p.items.length?`<details class="pmore"><summary>${T_('Quantities for this tier')}</summary>${p.items.map(it=>{const o=t.q[it.id]||{};return `<div class="field-l">${esc(pkgLabel(it))}</div><div class="in2">${it.qm==='car'?`<span class="hint">${T_('Qty')}: ${T_('by the car')}</span>`:`<input class="field" data-tq="${it.id}" inputmode="decimal" placeholder="${T_('Qty')} ${+it.q||1}" value="${o.q||''}">`}<input class="field" data-ti="${it.id}" inputmode="decimal" placeholder="${T_('Included')} ${it.incl||'—'}" value="${o.incl??''}"></div>`;}).join('')}</details>`:''}
     <button class="btn" id="tok">${T_('Save')}</button>${isNew?'':`<button class="btn ghost jb-del" id="trm">${T_('Remove')}</button>`}`,el=>{
     const chip=(sel,attr,key)=>el.querySelectorAll(sel+' ['+attr+']').forEach(b=>b.onclick=()=>{c[key]=b.getAttribute(attr);if(c[key]==='')delete c[key];el.querySelectorAll(sel+' ['+attr+']').forEach(x=>x.setAttribute('aria-pressed',x===b));});
     chip('#tc','data-cy','cyl');chip('#to','data-or','origin');chip('#tb','data-bd','body');
     el.querySelector('#tok').onclick=()=>{const v=id=>el.querySelector(id).value.trim();['make','model','eng','y0','y1'].forEach((k,i)=>{const x=v(['#tmk','#tmo','#ten','#ty0','#ty1'][i]);if(x)c[k]=k==='make'?fixMake(x):x;else delete c[k];});
       t.name=v('#tnm');t.price=num(v('#tpr'));if(!(t.price>0)){toast(T_('Type the package price for this tier'));return;}
       el.querySelectorAll('[data-tq]').forEach(i=>{const o=t.q[i.dataset.tq]=t.q[i.dataset.tq]||{};if(i.value!=='')o.q=num(i.value);else delete o.q;});
       el.querySelectorAll('[data-ti]').forEach(i=>{const o=t.q[i.dataset.ti]=t.q[i.dataset.ti]||{};if(i.value!=='')o.incl=num(i.value);else delete o.incl;});
       if(isNew)p.tiers.push(t);closeSheet();redo();};
     const rm=el.querySelector('#trm');if(rm)rm.onclick=()=>{p.tiers=p.tiers.filter(x=>x!==t);p.offers=p.offers.filter(o=>o.tier!==t.id);closeSheet();redo();};});};
  $('#pa-t').onclick=()=>{keep();tierSheet();};$$('[data-pt]').forEach(b=>b.onclick=()=>{keep();tierSheet(p.tiers[+b.dataset.pt]);});
  const addonSheet=a=>{const isNew=!a;a=a||{id:uid('pa'),name:'',ar:'',price:0};openSheet(`<h3>${T_('Add-on')}</h3><input class="field" id="an" placeholder="${T_('Name')} (Car wash)" value="${esc(a.name)}"><input class="field ar" dir="rtl" id="aa" placeholder="غسيل السيارة" value="${esc(a.ar||'')}"><label class="field-l">${T_('Price')}<input class="field" id="ap" inputmode="decimal" value="${a.price?f3(a.price):''}"></label><button class="btn" id="aok">${T_('Save')}</button>${isNew?'':`<button class="btn ghost jb-del" id="arm">${T_('Remove')}</button>`}`,el=>{
    el.querySelector('#aok').onclick=()=>{a.name=$('#an').value.trim();a.ar=$('#aa').value.trim();a.price=num($('#ap').value);if(!a.name){toast(T_('Type a name'));return;}if(isNew)p.addons.push(a);closeSheet();redo();};
    const rm=el.querySelector('#arm');if(rm)rm.onclick=()=>{p.addons=p.addons.filter(x=>x!==a);closeSheet();redo();};});};
  $('#pa-a').onclick=()=>{keep();addonSheet();};$$('[data-pad]').forEach(b=>b.onclick=()=>{keep();addonSheet(p.addons[+b.dataset.pad]);});
  const offerSheet=o=>{const isNew=!o;o=o||{id:uid('po'),type:'pct',val:0,tier:'',from:today(),to:''};openSheet(`<h3>🏷 ${T_('Offer')}</h3>
    <div class="chips" id="oty"><button data-ot="pct" aria-pressed="${o.type==='pct'}">${T_('Percent off')}</button><button data-ot="price" aria-pressed="${o.type==='price'}">${T_('Fixed price')}</button></div>
    <input class="field" id="ov" inputmode="decimal" value="${o.val||''}" placeholder="10">
    <select class="field" id="ot"><option value="">${T_('All tiers')}</option>${p.tiers.map(t=>`<option value="${t.id}" ${o.tier===t.id?'selected':''}>${esc(t.name||tierName(t))}</option>`).join('')}</select>
    <div class="in2"><label class="field-l">${T_('From')}<input class="field" type="date" id="of" value="${esc(o.from||'')}"></label><label class="field-l">${T_('To')}<input class="field" type="date" id="oto" value="${esc(o.to||'')}"></label></div>
    <button class="btn" id="ook">${T_('Save')}</button>${isNew?'':`<button class="btn ghost jb-del" id="orm">${T_('Remove')}</button>`}`,el=>{
    let ty=o.type;el.querySelectorAll('[data-ot]').forEach(b=>b.onclick=()=>{ty=b.dataset.ot;el.querySelectorAll('[data-ot]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
    el.querySelector('#ook').onclick=()=>{o.type=ty;o.val=num($('#ov').value);o.tier=$('#ot').value;o.from=$('#of').value;o.to=$('#oto').value;if(!(o.val>0)){toast(T_('Type the offer'));return;}if(isNew)p.offers.push(o);closeSheet();redo();};
    const rm=el.querySelector('#orm');if(rm)rm.onclick=()=>{p.offers=p.offers.filter(x=>x!==o);closeSheet();redo();};});};
  $('#pa-of').onclick=()=>{keep();if(!p.tiers.length){toast(T_('Add a tier first'));return;}offerSheet();};$$('[data-po]').forEach(b=>b.onclick=()=>{keep();offerSheet(p.offers[+b.dataset.po]);});};
