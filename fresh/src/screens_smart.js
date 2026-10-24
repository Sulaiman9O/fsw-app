/* ---------- SMART SERVICES: each service has a "recipe"; compare options side by side and add the right parts ---------- */
const RX={
 oil:{t:'Engine oil change',ic:'🛢',cat:['Engine oil'],liq:1,filter:['Oil filters'],grade:1,def:4.5},
 gear:{t:'Gearbox oil',ic:'⚙️',cat:['Gearbox oil'],liq:1,def:4},
 coolant:{t:'Coolant',ic:'❄️',cat:['Coolant'],liq:1,def:5},
 plugs:{t:'Spark plugs',ic:'🔥',cat:['Spark plugs'],cyl:1},
 pads:{t:'Brake pads',ic:'🛑',cat:['Brake pads'],fit:1},
 battery:{t:'Battery',ic:'🔋',cat:['Batteries'],last:1}};
const GRADE={mineral:['Mineral',5000],semi:['Semi synthetic',7000],full:['Full synthetic',10000]};
function gradeOf(p){if(p.grade)return p.grade;const n=lc(p.name);if(/semi/.test(n))return 'semi';if(/mineral|20w-?50|15w-?40|20w-?40/.test(n))return 'mineral';if(/full|fully|synth|0w-?|5w-?(20|30|40)/.test(n))return 'full';return '';}
function rxGuess(s){const n=lc(s.name);if(s.tag==='oil'||/engine oil/.test(n))return 'oil';if(s.tag==='gear'||/gearbox oil|atf/.test(n))return 'gear';if(/spark plug/.test(n))return 'plugs';if(/brake pads/.test(n))return 'pads';if(/battery replace|new battery/.test(n))return 'battery';if(/coolant|radiator flush/.test(n))return 'coolant';return '';}
const rxOf=s=>s&&(s.rx!==undefined?s.rx:rxGuess(s));
const smartOk=s=>sx('smart')&&!!rxOf(s)&&!!RX[rxOf(s)];
const engCode=v=>{const e=(v&&v.engine)||'';const m=e.split('·').pop().trim();return m||e;};
const learnKey=(k,v)=>k+'|'+(engCode(v)||mkKey((v&&v.make)+' '+(v&&v.model)));
function learned(k,v){const L=((DB.learn||{})[learnKey(k,v)]||[]).slice(-5);if(!L.length)return null;const s=L.slice().sort((a,b)=>a-b);return s[Math.floor(s.length/2)];}
function learn(k,v,q){if(!q||!v)return;DB.learn=DB.learn||{};const key=learnKey(k,v);(DB.learn[key]=DB.learn[key]||[]).push(q);if(DB.learn[key].length>10)DB.learn[key].shift();}
function guessLitres(k,v){const R=RX[k];const e=lc(v&&v.engine);const d=parseFloat((e.match(/(\d\.\d)l/)||[])[1])||0;if(k==='oil'){if(!d)return R.def;if(/v8|8 cyl/.test(e))return d>5?7.5:6.5;if(d<=1.3)return 3.2;if(d<=1.6)return 3.7;if(d<=2.0)return 4.2;if(d<=2.7)return 4.5;if(d<=3.0)return 5.5;return 6;}return R.def;}
function cylOf(v){const e=lc(v&&v.engine);const m=e.match(/(\d+)\s*cyl/)||e.match(/v(\d+)/)||e.match(/flat\s*(\d)/);return m?+m[1]:4;}
const pastRefs=(v,cats)=>{const o={};DB.jobs.filter(j=>j.veh===(v&&v.id)).sort((a,b)=>a.t-b.t).forEach(j=>(j.items||[]).forEach(i=>{const p=i.ref&&byId('parts',i.ref);if(p&&cats.includes(p.cat))o[p.id]=j.t;}));return o;};
function pickFilter(R,v){if(!R.filter)return null;const F=DB.parts.filter(p=>R.filter.includes(p.cat));const fit=F.filter(p=>fitsCar(p,v));let f=fit.find(p=>(+p.stock||0)>0)||fit[0];
  if(f&&(+f.stock||0)<=0){const a=(f.alts||[]).map(i=>byId('parts',i)).find(x=>x&&(+x.stock||0)>0);if(a)return {p:a,alt:f};}
  return f?{p:f}:null;}
function smartOptions(j,s){const k=rxOf(s),R=RX[k],v=vehOf(j);const parts=DB.parts.filter(p=>R.cat.includes(p.cat));
  let qty=R.liq?(learned(k,v)||guessLitres(k,v)):R.cyl?cylOf(v):1;const qSrc=R.liq?(learned(k,v)?'learned':'guess'):R.cyl?'cylinders':'';
  const fitting=parts.filter(p=>fitsCar(p,v));const useFit=(R.fit||R.cyl)&&fitting.length;let L=useFit?fitting:parts;
  const past=pastRefs(v,R.cat);const lab=svcPrice(s,v);const fl=pickFilter(R,v);
  const opts=L.map(p=>{const g=R.grade?gradeOf(p):'';const q=R.liq?qty:R.cyl?qty:(R.fit?(p.unit==='set'?1:1):1);const partT=r3(q*(+p.price||0));const fT=fl?(+fl.p.price||0):0;
    const total=r3(partT+fT+lab);const cost=r3(q*(+p.cost||0)+(fl?(+fl.p.cost||0):0));const next=g&&GRADE[g]?GRADE[g][1]:0;
    return {p,g,q,partT,fT,total,profit:r3(total-cost),next,last:!!past[p.id],out:(+p.stock||0)<q-0.0001,fits:fitsCar(p,v)};});
  const ord={mineral:1,semi:2,full:3,'':4};opts.sort((a,b)=>(ord[a.g]-ord[b.g])||(a.total-b.total));
  const perKm=opts.filter(o=>o.next).map(o=>o.total/o.next);const best=perKm.length?Math.min(...perKm):0;opts.forEach(o=>o.bestKm=o.next&&Math.abs(o.total/o.next-best)<1e-9&&perKm.length>1);
  return {k,R,v,qty,qSrc,lab,fl,opts,useFit};}
const r3=x=>Math.round(x*1000)/1000;
/* oil viscosity from the name: "5w30", "5W-30" -> "5W-30" */
const viscOf=p=>{const m=String(p&&p.name||'').match(/(\d{1,2})\s*w\s*-?\s*(\d{2})/i);return m?m[1]+'W-'+m[2]:'';};
/* which viscosity this car usually takes: its own last oil, else the most used on the same engine / model in your jobs */
function carVisc(v){if(!v)return '';const hit={};const mine=[];const ek=engCode(v),mk=lc((v.make||'')+' '+(v.model||''));
  DB.jobs.slice().sort((a,b)=>a.t-b.t).forEach(j=>{const jv=byId('vehicles',j.veh);if(!jv)return;const same=jv.id===v.id,near=(ek&&engCode(jv)===ek)||lc((jv.make||'')+' '+(jv.model||''))===mk;if(!same&&!near)return;
    (j.items||[]).forEach(i=>{const p=i.ref&&byId('parts',i.ref);if(!p||!RX.oil.cat.includes(p.cat))return;const x=viscOf(p);if(!x)return;if(same)mine.push(x);else hit[x]=(hit[x]||0)+1;});});
  if(mine.length)return mine[mine.length-1];const b=Object.entries(hit).sort((a,b)=>b[1]-a[1])[0];return b?b[0]:'';}
function smartSheet(j,s){let O=smartOptions(j,s),sel=O.opts.findIndex(o=>o.last);if(sel<0)sel=-1;const v=O.v;let fv=O.k==='oil'?carVisc(v):'',fb='',all=false;if(fv&&!O.opts.some(o=>viscOf(o.p)===fv))fv='';
  const draw=()=>{const el=$('#sheet .pnl');if(!el)return;O=Object.assign(O,smartOptionsQ(j,s,O.qty));
    const brand=p=>String(p.name||'').replace(/^🧪\s*/,'').split(/\s+/)[0]||'';
    const base=O.opts.map((o,i)=>({o,i}));const inV=base.filter(x=>!fv||viscOf(x.o.p)===fv);
    const shown=()=>inV.filter(x=>!fb||brand(x.o.p)===fb).sort((a,b)=>(b.o.last-a.o.last)||(b.o.fits-a.o.fits)||(a.o.out-b.o.out)||0);
    const chipsHtml=()=>{if(O.k!=='oil'||O.opts.length<4)return '';const vc={};base.forEach(x=>{const k=viscOf(x.o.p);if(k)vc[k]=(vc[k]||0)+1;});const cv=carVisc(v);const vs=Object.keys(vc).sort((a,b)=>(b===cv)-(a===cv)||vc[b]-vc[a]);
      const bc={};inV.forEach(x=>{const k=brand(x.o.p);if(k)bc[k]=(bc[k]||0)+1;});const bs=Object.keys(bc).sort((a,b)=>bc[b]-bc[a]);
      return (vs.length>1?`<div class="atabs"><button data-fv="" aria-pressed="${!fv}">All ${base.length}</button>${vs.map(k=>`<button data-fv="${k}" aria-pressed="${fv===k}">${k} · ${vc[k]}${k===cv?' ✓':''}</button>`).join('')}</div>`:'')
        +(bs.length>1&&inV.length>5?`<div class="atabs pc"><span>Brand</span><button data-fb="" aria-pressed="${!fb}">All</button>${bs.map(k=>`<button data-fb="${esc(k)}" data-notr aria-pressed="${fb===k}">${esc(k)}</button>`).join('')}</div>`:'');};
    const cur=DB.ws.currency;el.querySelector('#smb').innerHTML=`
    <div class="ctx2"><b>${esc(carName(v)||'Car')}</b>${v.engine?' · '+esc(v.engine):' · <span style="color:var(--warn)">no engine set</span>'}${j.km?'<br>km now '+kmf(j.km):''}</div>
    ${O.R.liq||O.R.cyl?`<div class="qrow"><span>${O.R.liq?'Litres':'How many'} <small>${O.qSrc==='learned'?'· learned from your jobs':O.qSrc==='guess'?'· a guess, check it':O.qSrc==='cylinders'?'· from engine cylinders':''}</small></span><div class="st"><button data-sq="-1">−</button><input class="qin" id="smq" inputmode="decimal" value="${O.qty}"><button data-sq="1">+</button></div></div>`:''}
    ${O.R.filter?`<div class="ctx2">${O.fl?`🧴 Filter: <b>${esc(O.fl.p.name)}</b> · ${f3(O.fl.p.price)}${O.fl.alt?` <span style="color:var(--ok)">(instead of ${esc(O.fl.alt.name)}, out of stock)</span>`:fitsCar(O.fl.p,v)?' <span style="color:var(--ok)">fits ✓</span>':''}`:'🧴 No oil filter marked for this car. Write the car or engine in the filter’s “Fits these cars”.'}</div>`:''}
    ${chipsHtml()}
    ${shown().length?shown().slice(0,all?999:5).map(({o,i})=>`<button class="oc${i===sel?' on':''}${o.last?' last':''}" data-op="${i}">${o.last?'<span class="bd">LAST TIME</span>':o.bestKm?'<span class="bd bk">BEST PER KM</span>':''}
      <div class="t"><b>${o.g?GRADE[o.g][0]+' · ':''}${esc(o.p.name)}</b><em>${f3(o.total)}</em></div>
      <div class="l"><span>${O.R.liq?o.q+' L':o.q+' ×'} ${f3(o.p.price)}${o.out?' · <b style="color:var(--bad)">not enough in stock ('+(+o.p.stock||0)+')</b>':''}</span><span>${f3(o.partT)}</span></div>
      ${o.fT?`<div class="l"><span>Filter</span><span>${f3(o.fT)}</span></div>`:''}<div class="l"><span>Labour · ${esc(s.name)}</span><span>${f3(O.lab)}</span></div>
      <div class="ft">${o.next?`<span class="km">Next: ${j.km?kmf(j.km+o.next)+' · ':''}${kmf(o.next)} km</span>`:''}${O.useFit&&o.fits?'<span class="km ok">fits ✓</span>':''}${showCost()?`<span class="pf">Profit ${f3(o.profit)}</span>`:''}</div></button>`).join('')
      +(!all&&shown().length>5?`<button class="btn ghost sm" id="small">Show all (${shown().length})</button>`:'')
      :`<p class="hint">${O.opts.length?'Nothing with this filter.':`No parts in stock for ${O.R.cat.join(', ')} yet. Add them in Stock, or add the service only.`}</p>`}
    <div class="two"><button class="btn ghost sm" id="smwa">📤 Send options</button><button class="btn ghost sm" id="smonly">Service only</button></div>
    <button class="btn" id="smok" ${sel<0?'disabled':''}>${sel<0?'Tap an option':'Add to the job · '+f3(O.opts[sel].total)+' '+cur}</button>`;
    el.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>{sel=+b.dataset.op;draw();});
    el.querySelectorAll('[data-fv]').forEach(b=>b.onclick=()=>{fv=b.dataset.fv;fb='';all=false;draw();});
    el.querySelectorAll('[data-fb]').forEach(b=>b.onclick=()=>{fb=b.dataset.fb;all=false;draw();});
    const sa=el.querySelector('#small');if(sa)sa.onclick=()=>{all=true;draw();};
    el.querySelectorAll('[data-sq]').forEach(b=>b.onclick=()=>{const st=O.R.liq?0.1:1;O.qty=Math.max(st,Math.round((O.qty+st*(+b.dataset.sq))*10)/10);O.qSrc='';draw();});
    const qi=el.querySelector('#smq');if(qi){qi.onfocus=()=>qi.select();qi.onchange=()=>{const q=num(qi.value);if(q>0){O.qty=q;O.qSrc='';}draw();};}
    el.querySelector('#smonly').onclick=()=>{j.items.push(svcItem(s,v));logJ(j,'Added '+s.name);save();closeSheet();render();};
    el.querySelector('#smwa').onclick=()=>{const c=custOf(j);const cur2=DB.ws.currency==='OMR'?'ر.ع':DB.ws.currency;const nums=['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
      const items=shown().slice(0,all?9:5).map(x=>x.o).map((o,i)=>nums[i]+' '+(o.g?{mineral:'زيت عادي',semi:'زيت شبه صناعي',full:'زيت صناعي'}[o.g]+' · ':'')+o.p.name.replace(/^🧪\s*/,'')+': '+f3(o.total)+' '+cur2+(o.next?'\n   (التغيير القادم بعد '+kmf(o.next)+' كم)':'')+(o.last?' ⭐ اختياركم في المرة السابقة':'')).join('\n');
      shareText(c.phone,msg('options',{name:c.name||'',car:carName(v),plate:v.plate||'',service:s.ar||s.name,items}));};
    const ok=el.querySelector('#smok');if(ok)ok.onclick=()=>{if(sel<0)return;const o=O.opts[sel];const it=svcItem(s,v);if(o.next)it.nextKm=o.next;it.rxk=O.k;it.rxg=o.g;j.items.push(it);
      j.items.push({k:'part',ref:o.p.id,d:o.p.name,num:o.p.num,q:o.q,u:o.p.unit==='L'?'L':'',p:+o.p.price,cost:+o.p.cost||0,rxk:O.k});
      if(O.fl)j.items.push({k:'part',ref:O.fl.p.id,d:O.fl.p.name,num:O.fl.p.num,q:1,u:'',p:+O.fl.p.price,cost:+O.fl.p.cost||0,rxk:O.k});
      if(O.R.liq)learn(O.k,v,o.q);logJ(j,'Added '+s.name+' · '+o.p.name+(O.fl?' + '+O.fl.p.name:''));save();closeSheet();render();toast('Added: service, '+(O.fl?'oil and filter':'parts'));};};
  openSheet(`<h3>${O.R.ic} ${esc(s.name)} · choose</h3><div class="two"><button class="btn ghost sm" id="smman">✋ Choose manually</button><button class="btn ghost sm" id="smx">✕ Cancel</button></div><div id="smb"></div>`,el=>{
    el.querySelector('#smx').onclick=()=>{closeSheet();addItemSheet(j);};
    el.querySelector('#smman').onclick=()=>{j.items.push(svcItem(s,vehOf(j)));logJ(j,'Added '+s.name+' (manual)');save();closeSheet();render();addItemSheet(j,{manual:true,tab:'p:'+RX[rxOf(s)].cat[0]});toast(s.name+' added. Now pick the parts.');};});draw();}
function smartOptionsQ(j,s,q){const O=smartOptions(j,s);if(q&&(O.R.liq||O.R.cyl)){if(Math.abs(q-O.qty)>1e-9)O.qSrc='';O.qty=q;O.opts.forEach(o=>{o.q=q;o.partT=r3(q*(+o.p.price||0));o.total=r3(o.partT+o.fT+O.lab);o.profit=r3(o.total-(q*(+o.p.cost||0)+(O.fl?(+O.fl.p.cost||0):0)));o.out=(+o.p.stock||0)<q-0.0001;});
    const perKm=O.opts.filter(o=>o.next).map(o=>o.total/o.next);const best=perKm.length?Math.min(...perKm):0;O.opts.forEach(o=>o.bestKm=o.next&&Math.abs(o.total/o.next-best)<1e-9&&perKm.length>1);}
  return O;}
