/* ---------- JOB ---------- */
const NEXT={estimate:['new','Customer agreed → job card'],new:['work','Start work'],work:['ready','Car is ready'],ready:['done','Delivered']};
function logJ(j,t){j.log.push([now(),t+' · '+S.user.name]);}
SCREENS.job=m=>{
  const j=byId('jobs',S.p.id);if(!j){go('work');return;}
  const v=vehOf(j),c=custOf(j),T=jobTotals(j),[sl,sc]=STAGE[j.stage];const nx=NEXT[j.stage];
  const stages=['new','work','ready','done'];const si=stages.indexOf(j.stage);
  m.innerHTML=head((j.stage==='estimate'?'Estimate':'Job')+' #'+j.no,`<span class="tag" style="background:${sc};color:#000">${sl}</span>`)+`
  <div class="card"><div class="h"><b>${esc(carName(v)||'Car')} ${v.plate?`<span class="pl">${esc(v.plate)}</span>`:''}</b><button class="lnk" data-go="custd:${c.id}">${esc(c.name||'')} ›</button></div>
   <span class="sub">${c.phone?esc(c.phone)+' · ':''}${j.km?kmf(j.km)+' km · ':''}opened ${hm(j.t)} by ${esc(j.by)}${j.eta&&j.stage==='work'?' · ready ~'+hm(j.eta):''}</span></div>
  ${j.stage!=='estimate'?`<div class="jb-steps">${stages.map((s,i)=>`<div class="${i<=si?'on':''}" style="--sc:${STAGE[s][1]}"><i></i><span>${STAGE[s][0]}</span></div>`).join('')}</div>`:''}
  ${nx?`<button class="btn okb" id="jnext">${nx[1]}</button>`:''}
  ${sec('Services & parts',`${(j.items||[]).length} items`)}
  <div class="jb-list">${(j.items||[]).map((it,i)=>`<button class="jb-r it${it.pend?' pend':''}" data-it="${i}"><div>${esc(it.d)}<small>${it.k==='part'?'Part':'Labour'}${it.num?' · '+esc(it.num):''}${it.q!==1||it.u?' · '+(+it.q)+(it.u?' '+esc(it.u):'')+' × '+f3(it.p):''}${it.outside?' · bought outside':''}</small></div><b>${it.pend?'Price?':f3(it.q*it.p)}</b></button>`).join('')}
   ${!isInvoiced(j)?`<button class="jb-r add" id="jadd"><div>＋ Add service or part</div></button>`:''}
   ${T.disc?`<div class="jb-r"><div>Discount${j.discPct?` (${j.discPct}%)`:''}</div><b>−${f3(T.disc)}</b></div>`:''}
   <div class="jb-r tot"><div>Total<small>Parts ${f3(T.parts)} · Labour ${f3(T.labour)}${can.cost()&&T.parts?` · profit ${f3(T.profit)}`:''}</small></div><b>${f3(T.total)} ${DB.ws.currency}</b></div></div>
  ${!isInvoiced(j)&&can.discount()?`<button class="btn ghost sm" id="jdisc">Discount</button>`:''}
  ${sec('Inspection',j.insp?`${Object.values(j.insp.r||{}).filter(x=>x==='bad').length} red · ${Object.values(j.insp.r||{}).filter(x=>x==='warn').length} yellow`:'')}
  ${j.insp?`<button class="row" id="jinsp"><div><b>${esc(j.insp.name)}</b><span>${Object.keys(j.insp.r||{}).length}/${j.insp.items.length} checked</span></div><span class="v">Open ›</span></button>`:`<button class="btn ghost sm" id="jinsp">＋ Start an inspection</button>`}
  <label class="field-l">Notes<textarea class="field" id="jnotes" rows="2" placeholder="What the customer said, what we found…">${esc(j.notes||'')}</textarea></label>
  <div class="two">${j.stage==='estimate'?`<button class="btn ghost" id="jsendest">📤 Send estimate</button>`:isInvoiced(j)?`<button class="btn ghost" data-go="inv:${j.id}">🧾 Invoice #${j.inv.no}</button>`:can.invoice()?`<button class="btn ghost" id="jinv">🧾 Make invoice</button>`:`<span></span>`}
   <button class="btn ghost" id="jstk">🏷️ Sticker</button></div>
  ${c.phone&&(j.stage==='ready'||j.stage==='done')?`<button class="btn wa" id="jwa">WhatsApp: car is ready</button>`:''}
  ${sec('Timeline')}<div class="jb-log">${j.log.slice().reverse().map(l=>`<div><span>${hm(l[0])}</span>${esc(l[1])}</div>`).join('')}</div>
  ${can.del()&&!isInvoiced(j)?`<button class="btn ghost jb-del" id="jdel">Delete ${j.stage==='estimate'?'estimate':'job'}</button>`:''}`;
  const nb=$('#jnext');if(nb)nb.onclick=()=>{
    if(j.stage==='estimate'){j.stage='new';j.fromEst=true;logJ(j,'Customer agreed');save();render();return;}
    if(j.stage==='new'){const mins=(j.items||[]).reduce((a,i)=>a+(+i.min||0)*(i.k==='part'?0:Math.max(1,Math.round(+i.q||1))),0);openSheet(`<h3>How long will it take?</h3>${mins?`<p class="hint">The services on this job take about <b>${mins>=60?Math.floor(mins/60)+' h '+(mins%60?mins%60+' min':''):mins+' min'}</b>.</p>`:''}<div class="chips big">${mins?`<button data-eta="${mins}">≈ ${mins>=60?(Math.round(mins/6)/10)+' h':mins+' min'} (services)</button>`:''}${[[30,'30 min'],[60,'1 hour'],[120,'2 hours'],[180,'3 hours'],[1440,'Tomorrow']].map(([x,l])=>`<button data-eta="${x}">${l}</button>`).join('')}</div>`,el=>el.querySelectorAll('[data-eta]').forEach(b=>b.onclick=()=>{const x=+b.dataset.eta;j.eta=x>=1440?new Date(new Date().setHours(33,0,0,0)).getTime():now()+x*60e3;j.stage='work';logJ(j,'Working · ETA '+b.textContent);save();closeSheet();render();}));return;}
    if(j.stage==='ready'&&!isInvoiced(j)&&can.invoice()){toast('Make the invoice first');return;}
    j.stage=nx[0];logJ(j,STAGE[nx[0]][0]);if(j.stage==='done')makeReminders(j);save();render();};
  const ad=$('#jadd');if(ad)ad.onclick=()=>addItemSheet(j);
  $$('[data-it]').forEach(b=>b.onclick=()=>{if(isInvoiced(j)){toast('Invoice made. Return it to change items.');return;}editItemSheet(j,+b.dataset.it);});
  const ds=$('#jdisc');if(ds)ds.onclick=()=>openSheet(`<h3>Discount</h3><div class="in2"><input class="field" id="dam" inputmode="decimal" placeholder="Amount (${DB.ws.currency})" value="${j.discPct?'':j.disc||''}"><input class="field" id="dpc" inputmode="decimal" placeholder="or %" value="${j.discPct||''}"></div><button class="btn" id="dok">Save</button>`,el=>el.querySelector('#dok').onclick=()=>{const p=num($('#dpc').value),a=num($('#dam').value);j.discPct=p||0;j.disc=p?0:a;logJ(j,'Discount '+(p?p+'%':f3(a)));save();closeSheet();render();});
  $('#jnotes').onchange=e=>{j.notes=e.target.value;save();};
  $('#jinsp').onclick=()=>{if(j.insp)inspSheet(j);else openSheet(`<h3>Choose a checklist</h3><div class="list">${DB.insp.map(t=>`<button class="row" data-ti="${t.id}"><div><b>${esc(t.name)}</b><span>${t.items.length} items</span></div><span class="v">›</span></button>`).join('')}</div>`,el=>el.querySelectorAll('[data-ti]').forEach(b=>b.onclick=()=>{const t=DB.insp.find(x=>x.id===b.dataset.ti);j.insp={name:t.name,items:t.items.slice(),r:{}};logJ(j,'Inspection started');save();inspSheet(j);}));};
  const se=$('#jsendest');if(se)se.onclick=()=>shareText(c.phone,docText(j,'estimate'));
  const iv=$('#jinv');if(iv)iv.onclick=()=>makeInvoice(j);
  $('#jstk').onclick=()=>stickerSheet(j);
  const wa=$('#jwa');if(wa)wa.onclick=()=>shareText(c.phone,msg('ready',jobVars(j)));
  const dl=$('#jdel');if(dl)dl.onclick=()=>confirmSheet('Delete '+(j.stage==='estimate'?'estimate':'job')+' #'+j.no+'?','Delete',()=>{DB.jobs=DB.jobs.filter(x=>x!==j);save();go('work');});
};
function shareText(phone,t){const u='https://wa.me/'+(phone?waNum(phone):'')+'?text='+encodeURIComponent(t);try{location.href=u;}catch(e){}if(navigator.clipboard)navigator.clipboard.writeText(t).catch(()=>{});}
function jobVars(j){const v=vehOf(j),c=custOf(j),T=jobTotals(j);const cur=DB.ws.currency==='OMR'?'ر.ع':DB.ws.currency;
  return {name:c.name||'',car:carName(v),plate:v.plate||'',no:j.inv&&!j.inv.void?j.inv.no:j.no,date:fmtD(j.inv?j.inv.t:j.t),
    items:(j.items||[]).filter(i=>!i.pend).map(i=>'• '+(i.ar||i.d)+(i.q!==1||i.u?' '+(+i.q)+(i.u?' '+i.u:'')+' × '+f3(i.p):'')+': '+f3(i.q*i.p)).join('\n')+(T.disc?'\nخصم: −'+f3(T.disc):''),
    total:f3(T.total)+' '+cur,paid:f3(T.paid)+' '+cur,due:f3(T.due)+' '+cur,km:j.km?kmf(j.km):'',warranty:DB.ws.warranty||''};}
function docText(j,kind){const x=jobVars(j);if(kind==='estimate')x.no=j.no;return msg(kind,x);}
/* add / edit items */
function svcUse(){const u={};DB.jobs.forEach(j=>(j.items||[]).forEach(i=>{if(i.ref)u[i.ref]=(u[i.ref]||0)+1;}));return u;}
function svcItem(s,v){return {k:'labour',ref:s.id,d:s.name,ar:s.ar||'',q:1,u:'',p:svcPrice(s,v),tag:s.tag,war:s.war||'',min:+s.min||0,comm:+s.comm||0,by:S.user.name,lockP:!!s.lockP,from:!!s.from,out:s.out&&s.out.who?Object.assign({},s.out):null};}
function addItemSheet(j){
  let q='';const v=vehOf(j);const use=svcUse();
  const draw=el=>{const ql=q.toLowerCase();const f=x=>!ql||x.toLowerCase().includes(ql);const sz=sizeOf(v);
    el.querySelector('#asz').innerHTML=DB.sizes.map((n,k)=>`<button data-sz="${k}" aria-pressed="${k===sz}">${esc(n)}</button>`).join('');
    const sv=DB.services.filter(s=>!s.hidden&&f(s.name+' '+(s.ar||'')+' '+s.cat)).sort((a,b)=>(use[b.id]||0)-(use[a.id]||0));const ps=DB.parts.filter(p=>f(p.name+' '+(p.num||'')+' '+p.cat));const cj=DB.canned.filter(c=>f(c.name));
    el.querySelector('#alist').innerHTML=
     (cj.length?`<div class="lbl">Canned jobs</div>`+cj.map(c=>`<button class="opt" data-cj="${c.id}"><div class="tx"><b>${esc(c.name)}</b><span>${c.items.length} items</span></div><span class="v">${f3(c.items.reduce((a,i)=>a+i.q*i.p,0))}</span></button>`).join(''):'')+
     (sv.length?`<div class="lbl">Services${!ql&&Object.keys(use).length?' · most used first':''}</div>`+sv.slice(0,ql?60:16).map(s=>`<button class="opt" data-sv="${s.id}"><div class="tx"><b>${scatIc(s.cat)} ${esc(s.name)}</b><span>${esc(s.cat)}${s.min?' · '+s.min+' min':''}${s.out&&s.out.who?' · at '+esc(s.out.who):''}${(s.parts||[]).length?' · + '+s.parts.length+' parts':''}</span></div><span class="v">${s.from?'<small>from</small>':''}${f3(svcPrice(s,v))}</span></button>`).join(''):'')+
     (ps.length?`<div class="lbl">Parts</div>`+ps.slice(0,60).map(p=>`<button class="opt" data-pt="${p.id}"><div class="tx"><b>${esc(p.name)}</b><span>${esc(p.num||p.cat)} · ${+p.stock>0?(+p.stock)+(p.unit==='L'?' L':'')+' in stock':'out of stock'}</span></div><span class="v">${f3(p.price)}${p.unit==='L'?'<small>/L</small>':''}</span></button>`).join(''):DB.parts.length?'':`<p class="hint">No parts yet. Add them in Stock, or use “Something else”.</p>`);
    el.querySelectorAll('[data-sz]').forEach(b=>b.onclick=()=>{v.size=+b.dataset.sz;save();draw(el);});
    el.querySelectorAll('[data-sv]').forEach(b=>b.onclick=()=>{const s=byId('services',b.dataset.sv);j.items.push(svcItem(s,v));const at=j.items.length-1;
      (s.parts||[]).forEach(x=>{const pt=byId('parts',x.ref);if(pt)j.items.push({k:'part',ref:pt.id,d:pt.name,num:pt.num,q:+x.q||1,u:pt.unit==='L'?'L':'',p:+pt.price,cost:+pt.cost||0});});
      logJ(j,'Added '+s.name);save();if(s.from){editItemSheet(j,at);return;}closeSheet();render();});
    el.querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>{const p=byId('parts',b.dataset.pt);j.items.push({k:'part',ref:p.id,d:p.name,num:p.num,q:1,u:p.unit==='L'?'L':'',p:+p.price,cost:+p.cost||0});save();editItemSheet(j,j.items.length-1,true);});
    el.querySelectorAll('[data-cj]').forEach(b=>b.onclick=()=>{const c=DB.canned.find(x=>x.id===b.dataset.cj);c.items.forEach(i=>j.items.push(Object.assign({},i)));logJ(j,'Added '+c.name);save();closeSheet();render();});};
  openSheet(`<h3>Add to ${j.stage==='estimate'?'estimate':'job'} #${j.no}</h3><div class="field-l">Car size</div><div class="chips" id="asz"></div><input class="field" id="aq" placeholder="Search services and parts" autocomplete="off"><button class="btn ghost sm" id="acust">✏️ Something else (type name and price)</button><div id="alist"></div>`,el=>{
    el.querySelector('#aq').oninput=e=>{q=e.target.value;draw(el);};
    el.querySelector('#acust').onclick=()=>{j.items.push({k:'part',d:'',q:1,u:'',p:0,cost:0,neu:1,by:S.user.name});editItemSheet(j,j.items.length-1,true);};
    draw(el);});
}
const isSuv=v=>/land cruiser|patrol|prado|fortuner|pajero|tahoe|yukon|suburban|lx|gx|range|x5|x7|gle|q7|explorer|expedition|sequoia|armada|4runner|fj|tundra|sierra|silverado|ram|f-150/i.test((v&&v.model)||'');
const isPickup=v=>/hilux|pickup|pick-up|navara|d-max|dmax|l200|triton|ranger|tacoma/i.test((v&&v.model)||'');
function sizeOf(v){const n=DB.sizes.length;if(v&&v.size!=null&&v.size<n)return v.size;const g=x=>{const i=DB.sizes.findIndex(s=>s.toLowerCase()===x);return i<0?null:i;};
  if(isPickup(v)&&g('pickup')!=null)return g('pickup');if(isSuv(v)&&g('suv')!=null)return g('suv');return g('sedan')!=null?g('sedan'):0;}
function svcPrice(s,v){const k=sizeOf(v);const p=s.p||[0];return +(p[k]!=null&&p[k]!==''?p[k]:p[p.length-1])||0;}
function editItemSheet(j,i,isNew){
  const it=j.items[i];if(!it)return;
  openSheet(`<h3>${isNew&&!it.ref?'New item':'Item'}</h3>
   <input class="field" id="ed" placeholder="Name" value="${esc(it.d)}">
   <div class="chips"><button data-k="part" aria-pressed="${it.k==='part'}">Part</button><button data-k="labour" aria-pressed="${it.k!=='part'}">Labour / service</button></div>
   <div class="in2"><label class="field-l">Qty${it.u?' ('+esc(it.u)+')':''}<input class="field" id="eq" inputmode="decimal" value="${+it.q}"></label><label class="field-l">Price each${it.from?' (starts from '+f3(it.p)+')':''}<input class="field" id="ep" inputmode="decimal" value="${it.pend?'':f3(it.p)}" ${it.lockP&&!can.discount()?'disabled':''}></label></div>
   ${can.cost()&&it.k==='part'?`<label class="field-l">Cost each (owner only)<input class="field" id="ec" inputmode="decimal" value="${it.cost?f3(it.cost):''}"></label>`:''}
   ${!it.ref?`<label class="chk"><input type="checkbox" id="eo" ${it.outside?'checked':''}> Bought outside (not from our stock)</label>`:''}
   <label class="chk"><input type="checkbox" id="epd" ${it.pend?'checked':''}> Ask the owner for the price</label>
   <button class="btn" id="eok">Save</button><button class="btn ghost jb-del" id="edel">Remove</button>`,el=>{
    let k=it.k;el.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{k=b.dataset.k;el.querySelectorAll('[data-k]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
    el.querySelector('#eok').onclick=()=>{const d=$('#ed').value.trim();if(!d){toast('Type a name');return;}it.d=d;it.k=k;it.q=num($('#eq').value)||1;it.pend=$('#epd').checked;it.p=it.pend?0:num($('#ep').value);const ec=$('#ec');if(ec)it.cost=num(ec.value);const eo=$('#eo');if(eo)it.outside=eo.checked;
      if(!can.discount()&&it.ref){const base=it.k==='part'?(byId('parts',it.ref)||{}).price:null;if(base!=null&&it.p<+base-0.0005){it.p=+base;toast('Workers cannot lower prices');}}
      logJ(j,(it.neu?'Added ':'Changed ')+d+(it.pend?' (price pending)':' '+f3(it.q*it.p)));delete it.neu;save();closeSheet();render();};
    el.querySelector('#edel').onclick=()=>{j.items.splice(i,1);logJ(j,'Removed '+(it.d||'item'));save();closeSheet();render();};
    el.querySelector('[data-close]').onclick=()=>{if(it.neu)j.items.splice(i,1);closeSheet();render();};});
}
/* inspection */
function inspSheet(j){const I=j.insp;
  openSheet(`<h3>${esc(I.name)}</h3><p class="hint">Green = good · Yellow = soon · Red = now</p><div class="insp">${I.items.map((x,i)=>`<div class="ir"><span>${esc(x)}</span><div>${['ok','warn','bad'].map(s=>`<button data-ir="${i}:${s}" class="s-${s}${I.r[i]===s?' on':''}"></button>`).join('')}</div></div>`).join('')}</div>
   <button class="btn" id="iok">Done</button>`,el=>{el.querySelectorAll('[data-ir]').forEach(b=>b.onclick=()=>{const [i,s]=b.dataset.ir.split(':');I.r[i]=I.r[i]===s?undefined:s;if(!I.r[i])delete I.r[i];save();el.querySelectorAll(`[data-ir^="${i}:"]`).forEach(x=>x.classList.toggle('on',x.dataset.ir===i+':'+I.r[i]));});
    el.querySelector('#iok').onclick=()=>{const red=Object.entries(I.r).filter(([,s])=>s==='bad').map(([i])=>I.items[i]);if(red.length)logJ(j,'Inspection: red '+red.join(', '));save();closeSheet();render();};});}
/* invoice */
function makeInvoice(j){
  const T=jobTotals(j);if(!(j.items||[]).length){toast('Add services or parts first');return;}
  if((j.items||[]).some(i=>i.pend)){toast('Some items have no price yet');return;}
  confirmSheet(`Make invoice for ${f3(T.total)} ${DB.ws.currency}?<br><small class="hint">Parts from stock will be taken out of the stock.</small>`,'Make invoice',()=>{
    j.inv={no:DB.ws.nextInv++,t:now(),by:S.user.name};(j.items||[]).forEach(it=>{if(it.k==='part'&&it.ref){const p=byId('parts',it.ref);if(p)p.stock=Math.round(((+p.stock||0)-(+it.q||0))*100)/100;}});
    if(j.stage==='new'||j.stage==='work')j.stage='ready';logJ(j,'Invoice #'+j.inv.no);save();go('inv',{id:j.id});});
}
SCREENS.inv=m=>{
  const j=byId('jobs',S.p.id);if(!j||!j.inv){go('work');return;}const T=jobTotals(j),c=custOf(j);
  m.innerHTML=head('Invoice #'+j.inv.no,j.returned?'<span class="tag t-bad">Returned</span>':T.due<=0.0005?'<span class="tag t-ok">Paid</span>':`<span class="tag t-warn">Due ${f3(T.due)}</span>`)+`
  <div class="inv-pv">${invoiceHtml(j)}</div>
  ${!j.returned&&T.due>0.0005&&can.money()?`${sec('Take payment',`due ${f3(T.due)}`)}<div class="chips big">${DB.ws.pay.map(p=>`<button data-pay="${esc(p)}">${esc(p)}</button>`).join('')}</div>`:''}
  ${(j.pays||[]).length?sec('Payments')+`<div class="jb-list">${j.pays.map(p=>`<div class="jb-r"><div>${esc(p.m)}<small>${fmtD(p.t)} ${hm(p.t)} · ${esc(p.by)}</small></div><b>${f3(p.amt)}</b></div>`).join('')}</div>`:''}
  <div class="two"><button class="btn" id="iwa">WhatsApp</button><button class="btn ghost" id="ipr">🖨 Print</button></div>
  <button class="btn ghost" data-go="job:${j.id}">Back to the job</button>
  ${can.del()&&!j.returned?`<button class="btn ghost jb-del" id="iret">Return / cancel invoice</button>`:''}`;
  $$('[data-pay]').forEach(b=>b.onclick=()=>{const mth=b.dataset.pay;openSheet(`<h3>${esc(mth)}</h3><input class="field" id="pam" inputmode="decimal" value="${f3(T.due)}"><button class="btn" id="pok">Save payment</button>`,el=>el.querySelector('#pok').onclick=()=>{const a=Math.min(num($('#pam').value),T.due);if(a<=0)return;j.pays.push({m:mth,amt:a,t:now(),by:S.user.name});logJ(j,'Paid '+f3(a)+' · '+mth);save();closeSheet();render();});});
  $('#iwa').onclick=()=>shareText(c.phone,docText(j,'invoice'));
  $('#ipr').onclick=()=>printHtml('<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:14mm}body{margin:0;font-family:Arial,sans-serif}'+INV_CSS+'</style></head><body>'+invoiceHtml(j,true)+'</body></html>',210,297,'Invoice '+j.inv.no);
  const rt=$('#iret');if(rt)rt.onclick=()=>confirmSheet('Return invoice #'+j.inv.no+'? Parts go back to stock.','Return',()=>{(j.items||[]).forEach(it=>{if(it.k==='part'&&it.ref){const p=byId('parts',it.ref);if(p)p.stock=Math.round(((+p.stock||0)+(+it.q||0))*100)/100;}});j.returned=now();j.inv.void=true;j.pays=[];j.stage='done';logJ(j,'Invoice returned');save();render();});
};
function invoiceHtml(j,print){const v=vehOf(j),c=custOf(j),T=jobTotals(j);let n=0;
  const tr=k=>(j.items||[]).filter(i=>(k==='part'?i.k==='part':i.k!=='part')&&!i.pend).map(i=>{n++;return `<tr><td class="n">${n}</td><td>${esc(i.d)}${i.num?`<small>${esc(i.num)}</small>`:''}${i.ar?`<div class="ar" style="font-size:2.7mm;color:#444">${esc(i.ar)}</div>`:''}${i.war?`<div style="font-size:2.4mm;color:#555">Warranty: ${esc(i.war)}</div>`:''}</td><td class="q">${+i.q}${i.u?' '+esc(i.u):''}</td><td class="u">${f3(i.p)}</td><td class="a">${f3(i.q*i.p)}</td></tr>`;}).join('');
  const pa=tr('part'),la=tr('labour');
  return `<div class="inv"><div class="inv-hd">${DB.ws.logo?`<img src="${DB.ws.logo}" alt="">`:`<b style="font-size:6mm">${esc(DB.ws.name)}</b>`}<div class="inv-ws"><b>${esc(DB.ws.name)}</b><span>${[DB.ws.addr,DB.ws.phone,DB.ws.cr?'CR '+DB.ws.cr:''].filter(Boolean).map(esc).join(' · ')}</span></div></div>
  <div class="inv-ttl"><b>INVOICE <span class="ar">فاتورة</span></b><span>#${j.inv.no} · ${fmtD(j.inv.t)}</span></div>
  <div class="inv-meta"><div><small>Customer</small>${esc(c.name||'—')}</div><div><small>Phone</small>${esc(c.phone||'—')}</div><div><small>Car</small>${esc(carName(v)||'—')}</div><div><small>Plate</small>${esc(v.plate||'—')}</div><div><small>Km</small>${j.km?kmf(j.km):'—'}</div><div><small>VIN</small><span class="mono">${esc(v.vin||'—')}</span></div></div>
  <table class="inv-t"><thead><tr><th>#</th><th>Description</th><th class="q">Qty</th><th class="u">Unit</th><th class="a">${DB.ws.currency}</th></tr></thead><tbody>${pa?`<tr class="grp"><td colspan="5">Parts · <span class="ar0">قطع</span></td></tr>${pa}`:''}${la?`<tr class="grp"><td colspan="5">Labour · <span class="ar0">أجرة</span></td></tr>${la}`:''}</tbody></table>
  <div class="inv-sum">${T.parts&&T.labour?`<div><span>Parts</span><span>${f3(T.parts)}</span></div><div><span>Labour</span><span>${f3(T.labour)}</span></div>`:''}${T.disc?`<div><span>Discount · خصم</span><span>−${f3(T.disc)}</span></div>`:''}<div class="tot"><span>Total <span class="ar">المجموع</span></span><span>${f3(T.total)} ${DB.ws.currency}</span></div>${T.paid?`<div><span>Paid</span><span>${f3(T.paid)}</span></div><div><span>Due</span><span>${f3(T.due)}</span></div>`:''}</div>
  ${j.returned?'<div class="inv-paid">RETURNED · مرتجع</div>':T.due<=0.0005&&T.total>0?`<div class="inv-paid">PAID · مدفوع</div>`:''}
  <div class="inv-ft">${esc(DB.ws.warranty||'Thank you · شكراً لزيارتكم')}</div></div>`;}
function printHtml(doc,w,h,name){const P=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.FswPrint;
  if(P){P.printHtml({html:doc,widthMm:w,heightMm:h,name}).catch(e=>toast('Could not print: '+(e&&e.message||e)));return;}
  const f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0';document.body.appendChild(f);f.contentDocument.open();f.contentDocument.write(doc);f.contentDocument.close();setTimeout(()=>{try{f.contentWindow.print();}catch(e){}setTimeout(()=>f.remove(),1000);},300);}
/* reminders */
function makeReminders(j){const v=vehOf(j);(j.items||[]).forEach(it=>{const s=it.ref&&byId('services',it.ref);const tag=it.tag||(s&&s.tag)||'';
  if(tag==='oil'||tag==='gear'){const mo=tag==='gear'?36:(+DB.ws.remMonths||6),km=tag==='gear'?70000:(+DB.ws.remKm||7000);const d=new Date(j.inv?j.inv.t:now());d.setMonth(d.getMonth()+mo);
    DB.reminders=DB.reminders.filter(r=>!(r.veh===v.id&&r.kind===tag));DB.reminders.push({id:uid('r'),veh:v.id,cust:j.cust,kind:tag,due:d.getTime(),dueKm:j.km?j.km+km:0,job:j.id,sent:0});}});}
function remindersDue(){const t=now(),D=864e5;return DB.reminders.filter(r=>!r.sent&&r.due<=t+7*D&&r.due>=t-31*D);}
/* sticker */
function stickerSheet(j){const v=vehOf(j);const has=k=>(j.items||[]).some(i=>(i.tag||'')===k);let kind=has('gear')&&!has('oil')?'gear':'oil';
  let step=kind==='gear'?70000:(+DB.ws.remKm||7000);
  const draw=el=>{const d=new Date();d.setMonth(d.getMonth()+(kind==='gear'?36:(+DB.ws.remMonths||6)));el.querySelector('#spv').innerHTML=stickerHtml(kind,j.km,j.km?j.km+step:0,d.getTime());
    el.querySelector('#sst').innerHTML=(kind==='gear'?[40000,50000,60000,70000,80000]:[5000,7000,10000]).map(x=>`<button data-s="${x}" aria-pressed="${step===x}">+${x>=40000?x/1000+'k':kmf(x)} km</button>`).join('');
    el.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{step=+b.dataset.s;draw(el);});el.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.kind===kind));};
  openSheet(`<h3>Service sticker</h3><div class="chips"><button data-kind="oil">Engine oil</button><button data-kind="gear">Gearbox oil</button></div><div class="stk-pv" id="spv"></div><div class="chips" id="sst"></div>${j.km?'':`<p class="hint">Add the km on the job to print the next km.</p>`}<button class="btn" id="sgo">🖨 Print sticker</button><p class="hint">In the print screen pick paper 2.4" x 39" (62 mm roll).</p>`,el=>{
    el.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.kind;step=kind==='gear'?70000:(+DB.ws.remKm||7000);draw(el);});draw(el);
    el.querySelector('#sgo').onclick=()=>{const d=new Date();d.setMonth(d.getMonth()+(kind==='gear'?36:(+DB.ws.remMonths||6)));printHtml('<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:0}html,body{margin:0;background:#fff}'+STK_CSS+'</style></head><body>'+stickerHtml(kind,j.km,j.km?j.km+step:0,d.getTime())+'</body></html>',62,990,'Sticker');logJ(j,'Sticker printed');save();};});}
function stickerHtml(kind,km,nk,next){const G=kind==='gear';return `<div class="wstk"><div class="wh">${DB.ws.logo?`<img src="${DB.ws.logo}" alt="">`:''}<b>${esc(DB.ws.name)}</b></div><div class="wbar">${G?'GEARBOX OIL · زيت الجير':'NEXT SERVICE · الصيانة القادمة'}</div><div class="wtwo"><div><small>DATE · التاريخ</small><b>${fmtD(next)}</b></div><em>أو</em><div><small>KM · الكيلومتر</small><b>${nk?kmf(nk):'—'}</b></div></div><div class="wft"><span>${fmtD(now())}${km?' · '+kmf(km)+' km':''}</span><span>${esc(DB.ws.phone||'')}</span></div></div>`;}
