/* ---------- CUSTOMERS ---------- */
function custRow(c){const vs=DB.vehicles.filter(v=>v.cust===c.id);const due=DB.jobs.filter(j=>j.cust===c.id&&isInvoiced(j)).reduce((a,j)=>a+jobTotals(j).due,0);
  return `<button class="row" data-go="custd:${c.id}"><div><b>${esc(c.name)}</b><span>${esc(c.phone||'no phone')} · ${vs.map(v=>esc(carName(v))).join(', ')||'no car'}</span></div><span class="v">${due>0.0005?`<em style="color:var(--warn)">${f3(due)}</em>`:'›'}</span></button>`;}
SCREENS.cust=m=>{
  const rd=remindersDue();const q=(S.p.q||'').toLowerCase();
  const list=DB.customers.filter(c=>!q||[c.name,c.phone].some(x=>(x||'').toLowerCase().includes(q))).sort((a,b)=>b.t-a.t);
  m.innerHTML=head('Customers',`<button class="lnk" id="cadd">＋ Add</button>`)+`
  ${sec('Due for a reminder · '+rd.length,'30 days late → next 7 days')}
  ${rd.length?`<div class="list">${rd.map(r=>{const v=byId('vehicles',r.veh)||{},c=byId('customers',r.cust)||{};const d=Math.round((r.due-now())/864e5);return `<div class="card"><div class="h"><b>${esc(c.name||'')}</b><span>${d<0?'due '+(-d)+' days ago':d===0?'due today':'due in '+d+' days'}</span></div><span class="sub">${esc(carName(v))} · ${r.kind==='gear'?'gearbox oil':'engine oil'}${r.dueKm?' · at '+kmf(r.dueKm)+' km':''}</span><div class="two"><button class="btn wa sm" data-rwa="${r.id}">WhatsApp</button><button class="btn ghost sm" data-rs="${r.id}">Mark sent</button></div></div>`;}).join('')}</div>`:empty('🔔','No reminders due. They are made when a job with an oil service is delivered.')}
  ${sec('All customers · '+DB.customers.length)}
  <input class="field" id="cq" placeholder="Search name or phone" value="${esc(S.p.q||'')}">
  ${list.length?`<div class="list">${list.slice(0,80).map(custRow).join('')}</div>`:empty('👥','No customers yet.')}`;
  const cq=$('#cq');cq.oninput=()=>{S.p.q=cq.value;const pos=cq.value.length;render();const e=$('#cq');e.focus();try{e.setSelectionRange(pos,pos);}catch(x){}};
  $$('[data-rs]').forEach(b=>b.onclick=()=>{const r=DB.reminders.find(x=>x.id===b.dataset.rs);r.sent=now();save();render();});
  $$('[data-rwa]').forEach(b=>b.onclick=()=>{const r=DB.reminders.find(x=>x.id===b.dataset.rwa);const v=byId('vehicles',r.veh)||{},c=byId('customers',r.cust)||{};
    const t=(DB.ws.remMsg||'السلام عليكم،\nوفقاً لسجلاتنا قد يكون حان موعد {service} لسيارتكم {car}.\nوفي حال أُجريت الخدمة مؤخراً فنعتذر عن هذا التذكير.\n\n{workshop}').replace('{service}',r.kind==='gear'?'تغيير زيت الجير':'تغيير زيت المحرك').replace('{car}',carName(v)).replace('{workshop}',DB.ws.name).replace('{name}',c.name||'');shareText(c.phone,t);r.sent=now();save();});
  $('#cadd').onclick=()=>custSheet();
};
function custSheet(c){const isNew=!c;c=c||{};openSheet(`<h3>${isNew?'New customer':'Edit customer'}</h3><input class="field" id="cn" placeholder="Name" value="${esc(c.name||'')}"><input class="field" id="cp" inputmode="tel" placeholder="Phone" value="${esc(c.phone||'')}"><textarea class="field" id="cnt" rows="2" placeholder="Notes">${esc(c.notes||'')}</textarea><button class="btn" id="cok">Save</button>`,el=>el.querySelector('#cok').onclick=()=>{const n=$('#cn').value.trim();if(!n){toast('Type a name');return;}
  if(isNew){c={id:uid('c'),t:now()};DB.customers.push(c);}c.name=n;c.phone=$('#cp').value.replace(/[^\d+]/g,'');c.notes=$('#cnt').value;save();closeSheet();isNew?go('custd',{id:c.id}):render();});}
function vehSheet(cust,v){const isNew=!v;v=v||{};openSheet(`<h3>${isNew?'Add car':'Edit car'}</h3><div class="in3"><input class="field" id="vm" placeholder="Make" value="${esc(v.make||'')}"><input class="field" id="vmo" placeholder="Model" value="${esc(v.model||'')}"><input class="field" id="vy" inputmode="numeric" placeholder="Year" value="${esc(v.year||'')}"></div><div class="in2"><input class="field" id="vp" placeholder="Plate" value="${esc(v.plate||'')}" style="text-transform:uppercase"><input class="field" id="vk" inputmode="numeric" placeholder="Km" value="${v.km||''}"></div><input class="field" id="vv" placeholder="VIN" maxlength="17" value="${esc(v.vin||'')}" style="text-transform:uppercase"><button class="btn" id="vok">Save</button>`,el=>el.querySelector('#vok').onclick=()=>{
  if(isNew){v={id:uid('v'),cust:cust.id,t:now()};DB.vehicles.push(v);}v.make=$('#vm').value.trim();v.model=$('#vmo').value.trim();v.year=$('#vy').value.trim();v.plate=$('#vp').value.trim().toUpperCase();v.km=num($('#vk').value);v.vin=$('#vv').value.trim().toUpperCase();save();closeSheet();render();});}
SCREENS.custd=m=>{
  const c=byId('customers',S.p.id);if(!c){go('cust');return;}const vs=DB.vehicles.filter(v=>v.cust===c.id);const js=DB.jobs.filter(j=>j.cust===c.id).sort((a,b)=>b.t-a.t);
  const spent=js.filter(isInvoiced).reduce((a,j)=>a+jobTotals(j).total,0),due=js.filter(isInvoiced).reduce((a,j)=>a+jobTotals(j).due,0);
  m.innerHTML=head(esc(c.name),`<button class="lnk" id="cedit">Edit</button>`)+`
  <div class="card"><span class="sub">${esc(c.phone||'no phone')}${c.notes?' · '+esc(c.notes):''}</span>${c.phone?`<div class="two"><button class="btn wa sm" id="cwa">WhatsApp</button><a class="btn ghost sm" href="tel:${esc(c.phone)}">Call</a></div>`:''}</div>
  <div class="kpis3">${can.money()?`<div class="kpi"><b>${f3(spent)}</b><span>Spent</span></div><div class="kpi ${due>0?'org':''}"><b>${f3(due)}</b><span>Due</span></div>`:''}<div class="kpi"><b>${js.length}</b><span>Visits</span></div></div>
  ${sec('Cars · '+vs.length,`<button class="lnk" id="vadd">＋ Add car</button>`)}
  <div class="list">${vs.map(v=>`<button class="row" data-ve="${v.id}"><div><b>${esc(carName(v))} ${v.plate?`<span class="pl">${esc(v.plate)}</span>`:''}</b><span>${v.km?kmf(v.km)+' km':''}${v.vin?' · '+esc(v.vin):''}</span></div><span class="v">Edit</span></button>`).join('')||empty('🚗','No cars yet.')}</div>
  ${sec('History · '+js.length)}<div class="list">${js.map(carRow).join('')||empty('🧾','No visits yet.')}</div>
  ${can.del()&&!js.length?`<button class="btn ghost jb-del" id="cdel">Delete customer</button>`:''}`;
  $('#cedit').onclick=()=>custSheet(c);$('#vadd').onclick=()=>vehSheet(c);
  $$('[data-ve]').forEach(b=>b.onclick=()=>vehSheet(c,byId('vehicles',b.dataset.ve)));
  const w=$('#cwa');if(w)w.onclick=()=>shareText(c.phone,'السلام عليكم '+(c.name||'')+'،\n');
  const d=$('#cdel');if(d)d.onclick=()=>confirmSheet('Delete '+esc(c.name)+'?','Delete',()=>{DB.customers=DB.customers.filter(x=>x!==c);DB.vehicles=DB.vehicles.filter(v=>v.cust!==c.id);save();go('cust');});
};
/* ---------- STOCK ---------- */
SCREENS.stock=m=>{
  const q=(S.p.q||'').toLowerCase(),cat=S.p.cat||'';
  const list=DB.parts.filter(p=>(!cat||p.cat===cat)&&(!q||(p.name+' '+(p.num||'')).toLowerCase().includes(q))).sort((a,b)=>a.name.localeCompare(b.name));
  const low=lowParts();const val=DB.parts.reduce((a,p)=>a+(+p.stock||0)*(+p.cost||0),0);
  m.innerHTML=head('Stock',`<button class="lnk" id="padd">＋ Part</button>`)+`
  <div class="kpis3"><div class="kpi"><b>${DB.parts.length}</b><span>Parts</span></div><button class="kpi ${low.length?'red':''}" id="plow"><b>${low.length}</b><span>To order</span></button>${can.cost()?`<div class="kpi"><b>${f3(val)}</b><span>On the shelf (cost)</span></div>`:`<button class="kpi" data-go="count"><b>${countToday().length}</b><span>To count</span></button>`}</div>
  <div class="two"><button class="btn ghost sm" data-go="count">📦 Daily count</button><button class="btn ghost sm" data-go="vendors">🚚 Suppliers & orders</button></div>
  ${low.length?sec('Order now · '+low.length,`<button class="lnk" id="mkpo">Make an order ›</button>`)+`<div class="list">${low.map(partRow).join('')}</div>`:''}
  ${sec('All parts')}
  <input class="field" id="pq" placeholder="Search name or number" value="${esc(S.p.q||'')}">
  <div class="chips">${['',...DB.pcats].map(c=>`<button data-cat="${esc(c)}" aria-pressed="${cat===c}">${c||'All'}</button>`).join('')}</div>
  ${list.length?`<div class="list">${list.map(partRow).join('')}</div>`:empty('🛢',DB.parts.length?'Nothing found.':'No parts yet. Tap <b>＋ Part</b> to add your first one.')}`;
  const pq=$('#pq');pq.oninput=()=>{S.p.q=pq.value;const pos=pq.value.length;render();const e=$('#pq');e.focus();try{e.setSelectionRange(pos,pos);}catch(x){}};
  $$('[data-cat]').forEach(b=>b.onclick=()=>{S.p.cat=b.dataset.cat;render();});
  $('#padd').onclick=()=>partSheet();$$('[data-pe]').forEach(b=>b.onclick=()=>partSheet(byId('parts',b.dataset.pe)));
  const mk=$('#mkpo');if(mk)mk.onclick=()=>newPoFromLow();
};
function partRow(p){const lo=(+p.reorder||0)>0&&(+p.stock||0)<=(+p.reorder||0);return `<button class="row" data-pe="${p.id}"><div><b>${esc(p.name)}</b><span>${esc(p.num||'')}${p.num?' · ':''}${esc(p.cat)} · ${f3(p.price)}${p.unit==='L'?'/L':''}${lo?' · <span class="tag t-bad">Order</span>':''}</span></div><span class="v ${(+p.stock||0)<=0?'bad':''}">${+p.stock||0}<small>${p.unit==='L'?'L':p.unit||'pc'}</small></span></button>`;}
function partSheet(p){const isNew=!p;p=p||{cat:DB.pcats[0],unit:'pc'};
  openSheet(`<h3>${isNew?'New part':'Edit part'}</h3><input class="field" id="pn" placeholder="Name · brand type size (e.g. Toyota Oil Filter 90915-YZZN2)" value="${esc(p.name||'')}"><div class="in2"><input class="field" id="pnum" placeholder="Part number / barcode" value="${esc(p.num||'')}"><select class="field" id="pcat">${DB.pcats.map(c=>`<option ${p.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
   <div class="chips">${[['pc','Piece'],['L','Litre'],['set','Set']].map(([k,l])=>`<button data-u="${k}" aria-pressed="${p.unit===k}">${l}</button>`).join('')}</div>
   <div class="in2"><label class="field-l">Selling price<input class="field" id="ppr" inputmode="decimal" value="${p.price?f3(p.price):''}"></label>${can.cost()?`<label class="field-l">Cost (owner only)<input class="field" id="pco" inputmode="decimal" value="${p.cost?f3(p.cost):''}"></label>`:'<span></span>'}</div>
   <div class="in2"><label class="field-l">In stock<input class="field" id="pst" inputmode="decimal" value="${p.stock||''}" ${isNew||can.del()?'':'disabled'}></label><label class="field-l">Reorder at<input class="field" id="pro" inputmode="decimal" value="${p.reorder||''}"></label></div>
   ${isNew?'':'<p class="hint">Stock changes by itself with invoices and supplier orders. Change it here only after a count.</p>'}
   <button class="btn" id="pok">Save</button>${!isNew&&can.del()?'<button class="btn ghost jb-del" id="pdel">Delete part</button>':''}`,el=>{
   let unit=p.unit;el.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{unit=b.dataset.u;el.querySelectorAll('[data-u]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
   el.querySelector('#pok').onclick=()=>{const n=$('#pn').value.trim();if(!n){toast('Type a name');return;}
     const dup=DB.parts.find(x=>x!==p&&(x.name.toLowerCase()===n.toLowerCase()||($('#pnum').value.trim()&&x.num===$('#pnum').value.trim())));if(dup){toast('This part already exists: '+dup.name);return;}
     if(isNew){p={id:uid('p'),t:now()};DB.parts.push(p);}p.name=n;p.num=$('#pnum').value.trim();p.cat=$('#pcat').value;p.unit=unit;p.price=num($('#ppr').value);const co=$('#pco');if(co)p.cost=num(co.value);p.stock=num($('#pst').value);p.reorder=num($('#pro').value);save();closeSheet();render();};
   const d=el.querySelector('#pdel');if(d)d.onclick=()=>{DB.parts=DB.parts.filter(x=>x!==p);save();closeSheet();render();};});}
/* daily count */
function countToday(){const done=new Set(DB.counts.filter(c=>c.date===today()).map(c=>c.part));const last={};DB.counts.forEach(c=>last[c.part]=Math.max(last[c.part]||0,c.t));
  const pick=DB.parts.slice().sort((a,b)=>(last[a.id]||0)-(last[b.id]||0)).slice(0,5);return pick.filter(p=>!done.has(p.id)).concat(DB.parts.filter(p=>done.has(p.id)));}
SCREENS.count=m=>{const list=countToday().slice(0,Math.max(5,DB.counts.filter(c=>c.date===today()).length));const done=DB.counts.filter(c=>c.date===today());
  m.innerHTML=head('Daily count',`${done.length}/${list.length}`)+`<p class="hint">Count the shelf first, then type the number. The system number shows after you save, so the count stays honest.</p>
  ${list.length?`<div class="list">${list.map(p=>{const c=done.find(x=>x.part===p.id);return `<div class="card cnt${c?' done':''}${c&&Math.abs(c.counted-c.sys)>0.0005?' diff':''}"><b>${esc(p.name)}</b><span class="sub">${esc(p.num||p.cat)}</span>${c?`<span class="sub">Counted <b>${c.counted}</b> · system ${c.sys}${Math.abs(c.counted-c.sys)>0.0005?` · <b style="color:var(--bad)">difference ${(c.counted-c.sys).toFixed(2).replace(/\.00$/,'')}</b>`:' ✓'}</span>${Math.abs(c.counted-c.sys)>0.0005&&!c.adj&&can.del()?`<button class="btn ghost sm" data-adj="${c.id}">Set stock to ${c.counted}</button>`:c.adj?'<span class="sub" style="color:var(--ok)">Stock fixed</span>':''}`:`<div class="row2"><input class="field" inputmode="decimal" placeholder="How many on the shelf?" id="cn_${p.id}"><button class="btn okb" data-cs="${p.id}">Save</button></div>`}</div>`;}).join('')}</div>`:empty('📦','Add parts first, then the app picks 5 to count every day.')}`;
  $$('[data-cs]').forEach(b=>b.onclick=()=>{const p=byId('parts',b.dataset.cs);const v=$('#cn_'+p.id).value.trim();if(v==='')return;DB.counts.push({id:uid('k'),date:today(),t:now(),part:p.id,sys:+p.stock||0,counted:num(v),by:S.user.name});save();render();});
  $$('[data-adj]').forEach(b=>b.onclick=()=>{const c=DB.counts.find(x=>x.id===b.dataset.adj);const p=byId('parts',c.part);if(p)p.stock=c.counted;c.adj=now();save();render();});};
/* suppliers + orders */
SCREENS.vendors=m=>{const pos=DB.pos.slice().sort((a,b)=>b.t-a.t);
  m.innerHTML=head('Suppliers',`<button class="lnk" id="vadd">＋ Supplier</button>`)+`
  <div class="list">${DB.vendors.map(v=>`<button class="row" data-ve="${v.id}"><div><b>${esc(v.name)}</b><span>${esc(v.phone||'')}${v.rep?' · '+esc(v.rep):''}${v.what?' · '+esc(v.what):''}</span></div><span class="v">Edit</span></button>`).join('')||empty('🚚','No suppliers yet.')}</div>
  ${sec('Orders · '+pos.length,DB.vendors.length?'<button class="lnk" id="poadd">＋ New order</button>':'')}
  <div class="list">${pos.map(p=>{const v=byId('vendors',p.vendor)||{};return `<button class="row" data-go="po:${p.id}"><div><b>#${p.no} · ${esc(v.name||'')}</b><span>${p.items.length} items · ${fmtD(p.t)}</span></div><span class="v">${p.status==='received'?'<span class="tag t-ok">Received</span>':'<span class="tag t-warn">Open</span>'}</span></button>`;}).join('')||empty('📄','No orders yet.')}</div>`;
  $('#vadd').onclick=()=>vendorSheet();$$('[data-ve]').forEach(b=>b.onclick=()=>vendorSheet(byId('vendors',b.dataset.ve)));
  const pa=$('#poadd');if(pa)pa.onclick=()=>{const p=newPo(DB.vendors[0].id);go('po',{id:p.id});};};
function vendorSheet(v){const isNew=!v;v=v||{};openSheet(`<h3>${isNew?'New supplier':'Edit supplier'}</h3><input class="field" id="vn" placeholder="Name" value="${esc(v.name||'')}"><div class="in2"><input class="field" id="vph" inputmode="tel" placeholder="Phone" value="${esc(v.phone||'')}"><input class="field" id="vr" placeholder="Sales rep" value="${esc(v.rep||'')}"></div><input class="field" id="vw" placeholder="What they supply (oils, filters…)" value="${esc(v.what||'')}"><div class="in2"><input class="field" id="vd" placeholder="Delivery (e.g. next day)" value="${esc(v.del||'')}"><input class="field" id="vpay" placeholder="Pay (cash / 30 days)" value="${esc(v.pay||'')}"></div><button class="btn" id="vok">Save</button>`,el=>el.querySelector('#vok').onclick=()=>{const n=$('#vn').value.trim();if(!n){toast('Type a name');return;}if(isNew){v={id:uid('d'),t:now()};DB.vendors.push(v);}Object.assign(v,{name:n,phone:$('#vph').value.trim(),rep:$('#vr').value.trim(),what:$('#vw').value.trim(),del:$('#vd').value.trim(),pay:$('#vpay').value.trim()});save();closeSheet();render();});}
function newPo(vendor,items){const p={id:uid('o'),no:(DB.pos.length?Math.max(...DB.pos.map(x=>x.no)):0)+1,vendor,items:items||[],status:'open',t:now(),by:S.user.name};DB.pos.push(p);save();return p;}
function newPoFromLow(){if(!DB.vendors.length){toast('Add a supplier first');go('vendors');return;}const it=lowParts().map(p=>({part:p.id,q:Math.max(1,Math.round(((+p.reorder||0)*2-(+p.stock||0)))),cost:+p.cost||0}));const p=newPo(DB.vendors[0].id,it);go('po',{id:p.id});}
SCREENS.po=m=>{const p=byId('pos',S.p.id);if(!p){go('vendors');return;}const v=byId('vendors',p.vendor)||{};const tot=p.items.reduce((a,i)=>a+i.q*(i.cost||0),0);const rec=p.status==='received';
  m.innerHTML=head('Order #'+p.no,rec?'<span class="tag t-ok">Received</span>':'<span class="tag t-warn">Open</span>')+`
  <label class="field-l">Supplier<select class="field" id="pov" ${rec?'disabled':''}>${DB.vendors.map(x=>`<option value="${x.id}" ${x.id===p.vendor?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
  <div class="list">${p.items.map((i,k)=>{const pt=byId('parts',i.part)||{name:'(deleted part)'};return `<div class="oi"><div><b>${esc(pt.name)}</b><span>stock ${+pt.stock||0}${can.cost()?' · cost '+f3(i.cost||0):''}</span></div>${rec?`<em>${i.q}</em>`:`<div class="st"><button data-q="${k}|-1">−</button><em>${i.q}</em><button data-q="${k}|1">+</button></div>`}</div>`;}).join('')||empty('📄','No items. Add parts below.')}</div>
  ${rec?'':`<select class="field" id="poadd"><option value="">＋ Add a part…</option>${DB.parts.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>`}
  ${can.cost()?`<div class="card"><div class="h"><b>Total (cost)</b><b>${f3(tot)} ${DB.ws.currency}</b></div></div>`:''}
  <div class="two"><button class="btn ghost" id="pomsg">📤 Send to supplier</button>${rec?'<span></span>':`<button class="btn okb" id="porec">✓ Received</button>`}</div>
  ${!rec?`<p class="hint">“Received” adds the quantities to stock${can.cost()?' and updates the cost':''}.</p>`:''}
  ${!rec&&can.del()?'<button class="btn ghost jb-del" id="podel">Delete order</button>':''}`;
  const sv=$('#pov');if(sv)sv.onchange=()=>{p.vendor=sv.value;save();render();};
  $$('[data-q]').forEach(b=>b.onclick=()=>{const [k,d]=b.dataset.q.split('|');const i=p.items[+k];i.q=Math.max(0,i.q+(+d));if(!i.q)p.items.splice(+k,1);save();render();});
  const pa=$('#poadd');if(pa)pa.onchange=()=>{if(!pa.value)return;const pt=byId('parts',pa.value);p.items.push({part:pt.id,q:1,cost:+pt.cost||0});save();render();};
  $('#pomsg').onclick=()=>shareText(v.phone,'السلام عليكم، نرجو توفير:\n'+p.items.map(i=>'• '+((byId('parts',i.part)||{}).name||'')+((byId('parts',i.part)||{}).num?' ('+byId('parts',i.part).num+')':'')+' × '+i.q).join('\n')+'\n\n'+DB.ws.name+(DB.ws.phone?' · '+DB.ws.phone:''));
  const rc=$('#porec');if(rc)rc.onclick=()=>confirmSheet('Mark order #'+p.no+' as received? Stock goes up.','Received',()=>{p.items.forEach(i=>{const pt=byId('parts',i.part);if(pt){pt.stock=Math.round(((+pt.stock||0)+i.q)*100)/100;if(i.cost)pt.cost=i.cost;}});p.status='received';p.rt=now();save();render();toast('Stock updated');});
  const dl=$('#podel');if(dl)dl.onclick=()=>{DB.pos=DB.pos.filter(x=>x!==p);save();go('vendors');};};
/* ---------- SERVICES ---------- */
SCREENS.svc=m=>{const q=(S.p.q||'').toLowerCase();const cats=[...new Set(DB.services.map(s=>s.cat))];
  m.innerHTML=head('Services',`<button class="lnk" id="sadd">＋ Service</button>`)+`
  ${!DB.ws.svcReviewed?`<div class="card note"><b>These are starter services.</b><span class="sub">Check the prices, remove what you won't do, add your own. Then tap “Prices checked”.</span><button class="btn okb sm" id="srev">Prices checked ✓</button></div>`:''}
  <input class="field" id="sq" placeholder="Search services" value="${esc(S.p.q||'')}">
  ${cats.map(c=>{const l=DB.services.filter(s=>s.cat===c&&(!q||s.name.toLowerCase().includes(q)));return l.length?sec(esc(c),'Sedan · SUV')+`<div class="list">${l.map(s=>`<button class="row" data-se="${s.id}"><div><b>${esc(s.name)}</b>${s.tag?`<span>${s.tag==='oil'?'makes an engine-oil reminder':'makes a gearbox-oil reminder'}</span>`:''}</div><span class="v">${f3(s.p[0])}<small>${f3(s.p[1])}</small></span></button>`).join('')}</div>`:'';}).join('')}`;
  const sq=$('#sq');sq.oninput=()=>{S.p.q=sq.value;const pos=sq.value.length;render();const e=$('#sq');e.focus();try{e.setSelectionRange(pos,pos);}catch(x){}};
  const rv=$('#srev');if(rv)rv.onclick=()=>{DB.ws.svcReviewed=true;save();render();};
  $('#sadd').onclick=()=>svcSheet();$$('[data-se]').forEach(b=>b.onclick=()=>svcSheet(byId('services',b.dataset.se)));};
function svcSheet(s){const isNew=!s;s=s||{cat:'Engine',p:[0,0],tag:''};const cats=[...new Set(DB.services.map(x=>x.cat))];
  openSheet(`<h3>${isNew?'New service':'Edit service'}</h3><input class="field" id="sn" placeholder="Name" value="${esc(s.name||'')}"><input class="field" id="sc" placeholder="Group" value="${esc(s.cat)}" list="scl"><datalist id="scl">${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</datalist>
  <div class="in2"><label class="field-l">Sedan price<input class="field" id="sp0" inputmode="decimal" value="${f3(s.p[0])}"></label><label class="field-l">SUV price<input class="field" id="sp1" inputmode="decimal" value="${f3(s.p[1])}"></label></div>
  <div class="chips">${[['','No reminder'],['oil','Engine oil reminder'],['gear','Gearbox oil reminder']].map(([k,l])=>`<button data-t="${k}" aria-pressed="${(s.tag||'')===k}">${l}</button>`).join('')}</div>
  <button class="btn" id="sok">Save</button>${!isNew&&can.del()?'<button class="btn ghost jb-del" id="sdel">Delete service</button>':''}`,el=>{let tag=s.tag||'';el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tag=b.dataset.t;el.querySelectorAll('[data-t]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
  el.querySelector('#sok').onclick=()=>{const n=$('#sn').value.trim();if(!n){toast('Type a name');return;}if(isNew){s={id:uid('s'),custom:true};DB.services.push(s);}s.name=n;s.cat=$('#sc').value.trim()||'Other';s.p=[num($('#sp0').value),num($('#sp1').value)||num($('#sp0').value)];s.tag=tag;save();closeSheet();render();};
  const d=el.querySelector('#sdel');if(d)d.onclick=()=>{DB.services=DB.services.filter(x=>x!==s);save();closeSheet();render();};});}
/* canned jobs */
SCREENS.canned=m=>{m.innerHTML=head('Canned jobs',`<button class="lnk" id="cjadd">＋ New</button>`)+`<p class="hint">A canned job is a set you add in one tap, e.g. “Camry 2.5 oil service” = oil 4.4 L + filter + labour.</p>
  <div class="list">${DB.canned.map(c=>`<button class="row" data-cj="${c.id}"><div><b>${esc(c.name)}</b><span>${c.items.map(i=>esc(i.d)).join(' + ')}</span></div><span class="v">${f3(c.items.reduce((a,i)=>a+i.q*i.p,0))}</span></button>`).join('')||empty('📦','No canned jobs yet.')}</div>`;
  $('#cjadd').onclick=()=>cannedSheet();$$('[data-cj]').forEach(b=>b.onclick=()=>cannedSheet(DB.canned.find(x=>x.id===b.dataset.cj)));};
function cannedSheet(c){const isNew=!c;c=c||{name:'',items:[]};const items=c.items.map(i=>Object.assign({},i));
  const draw=el=>{el.querySelector('#cji').innerHTML=items.map((i,k)=>`<div class="oi"><div><b>${esc(i.d)}</b><span>${i.k==='part'?'Part':'Labour'} · ${f3(i.p)}${i.u?'/'+i.u:''}</span></div><div class="st"><button data-cq="${k}|-1">−</button><em>${i.q}</em><button data-cq="${k}|1">+</button></div></div>`).join('')+`<div class="card"><div class="h"><b>Total</b><b>${f3(items.reduce((a,i)=>a+i.q*i.p,0))}</b></div></div>`;
    el.querySelectorAll('[data-cq]').forEach(b=>b.onclick=()=>{const [k,d]=b.dataset.cq.split('|');const i=items[+k];const st=i.u==='L'?0.1:1;i.q=Math.round((i.q+st*(+d))*10)/10;if(i.q<=0)items.splice(+k,1);draw(el);});};
  openSheet(`<h3>${isNew?'New canned job':'Edit canned job'}</h3><input class="field" id="cjn" placeholder="Name (e.g. Camry 2.5 oil service)" value="${esc(c.name)}"><div id="cji" class="list"></div>
   <select class="field" id="cjs"><option value="">＋ Add a service…</option>${DB.services.map(s=>`<option value="${s.id}">${esc(s.name)} · ${f3(s.p[0])}</option>`).join('')}</select>
   <select class="field" id="cjp"><option value="">＋ Add a part…</option>${DB.parts.map(p=>`<option value="${p.id}">${esc(p.name)} · ${f3(p.price)}</option>`).join('')}</select>
   <button class="btn" id="cjok">Save</button>${!isNew?'<button class="btn ghost jb-del" id="cjdel">Delete</button>':''}`,el=>{draw(el);
   el.querySelector('#cjs').onchange=e=>{const s=byId('services',e.target.value);if(s)items.push({k:'labour',ref:s.id,d:s.name,q:1,u:'',p:s.p[0],tag:s.tag});e.target.value='';draw(el);};
   el.querySelector('#cjp').onchange=e=>{const p=byId('parts',e.target.value);if(p)items.push({k:'part',ref:p.id,d:p.name,num:p.num,q:p.unit==='L'?4:1,u:p.unit==='L'?'L':'',p:+p.price,cost:+p.cost||0});e.target.value='';draw(el);};
   el.querySelector('#cjok').onclick=()=>{const n=$('#cjn').value.trim();if(!n||!items.length){toast('Name and at least one item');return;}if(isNew){c.id=uid('t');DB.canned.push(c);}c.name=n;c.items=items;save();closeSheet();render();};
   const d=el.querySelector('#cjdel');if(d)d.onclick=()=>{DB.canned=DB.canned.filter(x=>x!==c);save();closeSheet();render();};});}
/* inspections */
SCREENS.insp=m=>{m.innerHTML=head('Inspection checklists',`<button class="lnk" id="iadd">＋ New</button>`)+`<p class="hint">Keep them short: 15 to 20 items. Workers tap green, yellow or red.</p><div class="list">${DB.insp.map(t=>`<button class="row" data-ie="${t.id}"><div><b>${esc(t.name)}</b><span>${t.items.length} items</span></div><span class="v">Edit</span></button>`).join('')}</div>`;
  const edit=t=>{const isNew=!t;t=t||{name:'',items:[]};openSheet(`<h3>${isNew?'New checklist':'Edit checklist'}</h3><input class="field" id="in" placeholder="Name" value="${esc(t.name)}"><label class="field-l">One item per line<textarea class="field" id="ii" rows="10">${esc(t.items.join('\n'))}</textarea></label><button class="btn" id="iok">Save</button>${!isNew?'<button class="btn ghost jb-del" id="idel">Delete</button>':''}`,el=>{
   el.querySelector('#iok').onclick=()=>{const n=$('#in').value.trim();const it=$('#ii').value.split('\n').map(x=>x.trim()).filter(Boolean);if(!n||!it.length){toast('Name and items');return;}if(isNew){t.id=uid('i');DB.insp.push(t);}t.name=n;t.items=it;save();closeSheet();render();};
   const d=el.querySelector('#idel');if(d)d.onclick=()=>{DB.insp=DB.insp.filter(x=>x!==t);save();closeSheet();render();};});};
  $('#iadd').onclick=()=>edit();$$('[data-ie]').forEach(b=>b.onclick=()=>edit(DB.insp.find(x=>x.id===b.dataset.ie)));};
