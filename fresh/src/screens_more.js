/* ---------- CUSTOMERS ---------- */
function custRow(c){const vs=DB.vehicles.filter(v=>v.cust===c.id);const due=DB.jobs.filter(j=>j.cust===c.id&&isInvoiced(j)).reduce((a,j)=>a+jobTotals(j).due,0);
  return `<button class="row" data-go="custd:${c.id}" data-s="${esc((c.name||'')+' '+(c.phone||'')+' '+vs.map(v=>(v.plate||'')+' '+carName(v)).join(' '))}"><div><b>${esc(c.name)}</b><span>${esc(c.phone||'no phone')} · ${vs.map(v=>esc(carName(v))).join(', ')||'no car'}</span></div><span class="v">${due>0.0005?`<em style="color:var(--warn)">${f3(due)}</em>`:'›'}</span></button>`;}
SCREENS.cust=m=>{
  const rd=remindersDue();const q=(S.p.q||'').toLowerCase();
  const list=DB.customers.slice().sort((a,b)=>b.t-a.t);
  m.innerHTML=head('Customers',`<button class="lnk" id="cadd">＋ Add</button>`)+`
  ${sec('Due for a reminder · '+rd.length,'30 days late → next 7 days')}
  ${rd.length?`<div class="list">${rd.map(r=>{const v=byId('vehicles',r.veh)||{},c=byId('customers',r.cust)||{};const d=Math.round((r.due-now())/864e5);return `<div class="card"><div class="h"><b>${esc(c.name||'')}</b><span>${d<0?'due '+(-d)+' days ago':d===0?'due today':'due in '+d+' days'}</span></div><span class="sub">${esc(carName(v))} · ${r.kind==='other'&&r.name?esc(r.name):r.kind==='gear'?'gearbox oil':'engine oil'}${r.dueKm?' · at '+kmf(r.dueKm)+' km':''}</span><div class="two"><button class="btn wa sm" data-rwa="${r.id}">WhatsApp</button><button class="btn ghost sm" data-rs="${r.id}">Mark sent</button></div></div>`;}).join('')}</div>`:empty('🔔','No reminders due. They are made when a job with an oil service is delivered.')}
  ${sec('All customers · '+DB.customers.length)}
  <input class="field" id="cq" placeholder="Search name or phone" value="${esc(S.p.q||'')}">
  ${list.length?`<div class="list" id="clist">${list.slice(0,600).map(custRow).join('')}</div><p class="hint" id="cnone" hidden>Nothing found.</p>`:empty('👥','No customers yet.')}`;
  liveFilter($('#cq'),'#clist>.row',q=>{const n=$('#cnone');if(n)n.hidden=!q||!!document.querySelector('#clist>.row:not([hidden])');});
  $$('[data-rs]').forEach(b=>b.onclick=()=>{const r=DB.reminders.find(x=>x.id===b.dataset.rs);r.sent=now();save();render();});
  $$('[data-rwa]').forEach(b=>b.onclick=()=>{const r=DB.reminders.find(x=>x.id===b.dataset.rwa);const v=byId('vehicles',r.veh)||{},c=byId('customers',r.cust)||{};
    const t=msg('remind',{name:c.name||'',car:carName(v),plate:v.plate||'',service:r.kind==='other'&&r.name?r.name:r.kind==='gear'?'تغيير زيت ناقل الحركة':'تغيير زيت المحرك'});shareText(c.phone,t);r.sent=now();save();});
  $('#cadd').onclick=()=>custSheet();
};
function custSheet(c){const isNew=!c;c=c||{};openSheet(`<h3>${isNew?'New customer':'Edit customer'}</h3><input class="field" id="cn" placeholder="Name" value="${esc(c.name||'')}"><input class="field" id="cp" inputmode="tel" placeholder="Phone" value="${esc(c.phone||'')}"><textarea class="field" id="cnt" rows="2" placeholder="Notes">${esc(c.notes||'')}</textarea><button class="btn" id="cok">Save</button>`,el=>el.querySelector('#cok').onclick=()=>{const n=$('#cn').value.trim();if(!n){toast('Type a name');return;}
  if(isNew){c={id:uid('c'),t:now()};DB.customers.push(c);}c.name=n;c.phone=$('#cp').value.replace(/[^\d+]/g,'');c.notes=$('#cnt').value;save();closeSheet();isNew?go('custd',{id:c.id}):render();});}
function vehSheet(cust,v,dr){const isNew=!v;v=v||{};const d=dr||v;openSheet(`<h3>${isNew?'Add car':'Edit car'}</h3><button class="carpick" id="vcp"></button><input type="hidden" id="vm" value="${esc(d.make||'')}"><input type="hidden" id="vmo" value="${esc(d.model||'')}"><input type="hidden" id="vy" value="${esc(d.year||'')}"><input type="hidden" id="veng" value="${esc(d.engine||'')}"><div class="in2"><input class="field" id="vp" placeholder="Plate" value="${esc(d.plate||'')}" style="text-transform:uppercase"><input class="field" id="vk" inputmode="numeric" placeholder="Km" value="${d.km||''}"></div><select class="field" id="vsz"><option value="">Car size: guess from model</option>${DB.sizes.map((z,k)=>`<option value="${k}" ${d.size===k?'selected':''}>Car size: ${esc(z)}</option>`).join('')}</select><input class="field" id="vv" placeholder="VIN" maxlength="17" value="${esc(d.vin||'')}" style="text-transform:uppercase"><button class="btn" id="vok">Save</button>`,el=>{const cp=el.querySelector('#vcp');const lab=()=>{cp.innerHTML=d.make?`<b>${esc([d.make,d.model,d.year].filter(Boolean).join(' '))}</b><span>${d.engine?esc(d.engine):'Tap to choose the engine'}</span><em>›</em>`:'<b>🚗 Choose make, model, year, engine</b><span>Type “toy” for Toyota…</span><em>›</em>';};lab();
  cp.onclick=()=>{const g=id=>{const e=el.querySelector(id);return e?e.value:'';};const dd=Object.assign({},d,{plate:g('#vp'),km:num(g('#vk')),vin:g('#vv'),size:g('#vsz')===''?null:+g('#vsz')});carPicker(dd,r=>vehSheet(cust,isNew?null:v,Object.assign(dd,r)));};
  el.querySelector('#vok').onclick=()=>{
  if(isNew){v={id:uid('v'),cust:cust.id,t:now()};DB.vehicles.push(v);}v.make=$('#vm').value.trim();v.model=$('#vmo').value.trim();v.year=$('#vy').value.trim();v.engine=$('#veng').value.trim();v.plate=$('#vp').value.trim().toUpperCase();v.km=num($('#vk').value);v.vin=$('#vv').value.trim().toUpperCase();const z=$('#vsz').value;v.size=z===''?null:+z;save();closeSheet();render();};});}
SCREENS.custd=m=>{
  const c=byId('customers',S.p.id);if(!c){go('cust');return;}const vs=DB.vehicles.filter(v=>v.cust===c.id);const js=DB.jobs.filter(j=>j.cust===c.id).sort((a,b)=>b.t-a.t);
  const spent=js.filter(isInvoiced).reduce((a,j)=>a+jobTotals(j).total,0),due=js.filter(isInvoiced).reduce((a,j)=>a+jobTotals(j).due,0);
  m.innerHTML=head(esc(c.name),`<button class="lnk" id="cedit">Edit</button>`)+`
  <div class="card"><span class="sub">${esc(c.phone||'no phone')}${c.notes?' · '+esc(c.notes):''}</span>${c.phone?`<div class="two"><button class="btn wa sm" id="cwa">WhatsApp</button><a class="btn ghost sm" href="tel:${esc(c.phone)}">Call</a></div>`:''}</div>
  <div class="kpis3">${can.money()?`<div class="kpi"><b>${f3(spent)}</b><span>Spent</span></div><div class="kpi ${due>0?'org':''}"><b>${f3(due)}</b><span>Due</span></div>`:''}<div class="kpi"><b>${js.length}</b><span>Visits</span></div></div>
  ${can.money()?debtBox(c):''}
  ${sec('Cars · '+vs.length,`<button class="lnk" id="vadd">＋ Add car</button>`)}
  <div class="list">${vs.map(v=>`<button class="row" data-ve="${v.id}"><div><b>${esc(carName(v))} ${v.plate?`<span class="pl">${esc(v.plate)}</span>`:''}</b><span>${v.km?kmf(v.km)+' km':''}${v.vin?' · '+esc(v.vin):''}</span></div><span class="v">Edit</span></button>`).join('')||empty('🚗','No cars yet.')}</div>
  ${sec('History · '+js.length)}<div class="list">${js.map(carRow).join('')||empty('🧾','No visits yet.')}</div>
  ${can.del()&&!js.length?`<button class="btn ghost jb-del" id="cdel">Delete customer</button>`:''}`;
  $('#cedit').onclick=()=>custSheet(c);$('#vadd').onclick=()=>vehSheet(c);
  $$('[data-ve]').forEach(b=>b.onclick=()=>vehSheet(c,byId('vehicles',b.dataset.ve)));
  const w=$('#cwa');if(w)w.onclick=()=>shareText(c.phone,msg('hello',{name:c.name||''}));
  debtBind(c);
  const d=$('#cdel');if(d)d.onclick=()=>confirmSheet('Delete '+esc(c.name)+'?','Delete',()=>{audit('delete','Customer '+c.name);DB.customers=DB.customers.filter(x=>x!==c);DB.vehicles=DB.vehicles.filter(v=>v.cust!==c.id);save();go('cust');});
};
/* ---------- STOCK ---------- */
/* daily count */
function countToday(){const done=new Set(DB.counts.filter(c=>c.date===today()).map(c=>c.part));const last={};DB.counts.forEach(c=>last[c.part]=Math.max(last[c.part]||0,c.t));
  const pick=DB.parts.slice().sort((a,b)=>(last[a.id]||0)-(last[b.id]||0)).slice(0,5);return pick.filter(p=>!done.has(p.id)).concat(DB.parts.filter(p=>done.has(p.id)));}
SCREENS.count=m=>{const list=countToday().slice(0,Math.max(5,DB.counts.filter(c=>c.date===today()).length));const done=DB.counts.filter(c=>c.date===today());
  m.innerHTML=head('Daily count',`${done.length}/${list.length}`)+`<p class="hint">Count the shelf first, then type the number. The system number shows after you save, so the count stays honest.</p>
  ${list.length?`<div class="list">${list.map(p=>{const c=done.find(x=>x.part===p.id);return `<div class="card cnt${c?' done':''}${c&&Math.abs(c.counted-c.sys)>0.0005?' diff':''}"><b>${esc(p.name)}</b><span class="sub">${sx('loc')&&p.loc?'📍 '+esc(p.loc)+' · ':''}${esc(p.num||p.cat)}</span>${c?`<span class="sub">Counted <b>${c.counted}</b> · system ${c.sys}${Math.abs(c.counted-c.sys)>0.0005?` · <b style="color:var(--bad)">difference ${(c.counted-c.sys).toFixed(2).replace(/\.00$/,'')}</b>`:' ✓'}</span>${Math.abs(c.counted-c.sys)>0.0005&&!c.adj&&can.del()?`<button class="btn ghost sm" data-adj="${c.id}">Set stock to ${c.counted}</button>`:c.adj?'<span class="sub" style="color:var(--ok)">Stock fixed</span>':''}`:`<div class="row2"><input class="field" inputmode="decimal" placeholder="How many on the shelf?" id="cn_${p.id}"><button class="btn okb" data-cs="${p.id}">Save</button></div>`}</div>`;}).join('')}</div>`:empty('📦','Add parts first, then the app picks 5 to count every day.')}`;
  $$('[data-cs]').forEach(b=>b.onclick=()=>{const p=byId('parts',b.dataset.cs);const v=$('#cn_'+p.id).value.trim();if(v==='')return;DB.counts.push({id:uid('k'),date:today(),t:now(),part:p.id,sys:+p.stock||0,counted:num(v),by:S.user.name});save();render();});
  $$('[data-adj]').forEach(b=>b.onclick=()=>{const c=DB.counts.find(x=>x.id===b.dataset.adj);const p=byId('parts',c.part);if(p)mv(p,c.counted-(+p.stock||0),'Count by '+c.by);c.adj=now();save();render();});};
/* suppliers + orders */
SCREENS.vendors=m=>{const pos=DB.pos.slice().sort((a,b)=>b.t-a.t);
  m.innerHTML=head('Suppliers',`<button class="lnk" id="vadd">＋ Supplier</button>`)+`
  <div class="list">${DB.vendors.map(v=>`<button class="row" data-ve="${v.id}"><div><b>${esc(v.name)}</b><span>${esc(v.phone||'')}${v.rep?' · '+esc(v.rep):''}${v.what?' · '+esc(v.what):''}</span></div><span class="v">Edit</span></button>`).join('')||empty('🚚','No suppliers yet.')}</div>
  ${sec('Orders · '+pos.length,DB.vendors.length?'<button class="lnk" id="poadd">＋ New order</button>':'')}
  <div class="list">${pos.map(p=>{const v=byId('vendors',p.vendor)||{};return `<button class="row" data-go="po:${p.id}"><div><b>#${p.no} · ${esc(v.name||'')}</b><span>${p.items.length} items · ${fmtD(p.t)}</span></div><span class="v">${p.status==='received'?'<span class="tag t-ok">Received</span>':p.status==='partial'?'<span class="tag t-warn">Part received</span>':'<span class="tag t-warn">Open</span>'}</span></button>`;}).join('')||empty('📄','No orders yet.')}</div>`;
  $('#vadd').onclick=()=>vendorSheet();$$('[data-ve]').forEach(b=>b.onclick=()=>vendorSheet(byId('vendors',b.dataset.ve)));
  const pa=$('#poadd');if(pa)pa.onclick=()=>{const p=newPo(DB.vendors[0].id);go('po',{id:p.id});};};
function vendorSheet(v){const isNew=!v;v=v||{};openSheet(`<h3>${isNew?'New supplier':'Edit supplier'}</h3><input class="field" id="vn" placeholder="Name" value="${esc(v.name||'')}"><div class="in2"><input class="field" id="vph" inputmode="tel" placeholder="Phone" value="${esc(v.phone||'')}"><input class="field" id="vr" placeholder="Sales rep" value="${esc(v.rep||'')}"></div><input class="field" id="vw" placeholder="What they supply (oils, filters…)" value="${esc(v.what||'')}"><div class="in2"><input class="field" id="vd" placeholder="Delivery (e.g. next day)" value="${esc(v.del||'')}"><input class="field" id="vpay" placeholder="Pay (cash / 30 days)" value="${esc(v.pay||'')}"></div><button class="btn" id="vok">Save</button>`,el=>el.querySelector('#vok').onclick=()=>{const n=$('#vn').value.trim();if(!n){toast('Type a name');return;}if(isNew){v={id:uid('d'),t:now()};DB.vendors.push(v);}Object.assign(v,{name:n,phone:$('#vph').value.trim(),rep:$('#vr').value.trim(),what:$('#vw').value.trim(),del:$('#vd').value.trim(),pay:$('#vpay').value.trim()});save();closeSheet();render();});}
function newPo(vendor,items){const p={id:uid('o'),no:(DB.pos.length?Math.max(...DB.pos.map(x=>x.no)):0)+1,vendor,items:items||[],status:'open',t:now(),by:S.user.name};DB.pos.push(p);save();return p;}
function newPoFromLow(){if(!DB.vendors.length){toast('Add a supplier first');go('vendors');return;}const it=lowParts().map(p=>({part:p.id,q:Math.max(1,Math.round(((+p.reorder||0)*2-(+p.stock||0)))),cost:+p.cost||0}));const p=newPo(DB.vendors[0].id,it);go('po',{id:p.id});}
SCREENS.po=m=>{const p=byId('pos',S.p.id);if(!p){go('vendors');return;}const v=byId('vendors',p.vendor)||{};const tot=p.items.reduce((a,i)=>a+i.q*(i.cost||0),0);const rec=p.status==='received',part=p.status==='partial';
  m.innerHTML=head('Order #'+p.no,rec?'<span class="tag t-ok">Received</span>':part?'<span class="tag t-warn">Part received</span>':'<span class="tag t-warn">Open</span>')+`
  <label class="field-l">Supplier<select class="field" id="pov" ${rec?'disabled':''}>${DB.vendors.map(x=>`<option value="${x.id}" ${x.id===p.vendor?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
  <div class="list">${p.items.map((i,k)=>{const pt=byId('parts',i.part)||{name:'(deleted part)'};return `<div class="oi"><div><b>${esc(pt.name)}</b><span>stock ${+pt.stock||0}${i.rec?' · got '+i.rec:''}${can.cost()?' · cost '+f3(i.cost||0):''}${(()=>{if(!sx('vprices')||!can.cost())return '';const bv=bestVendor(pt);return bv&&bv.v!==p.vendor&&bv.cost<(+i.cost||Infinity)-0.0005?` · <b style="color:var(--ok)">cheaper: ${esc(byId('vendors',bv.v).name)} ${f3(bv.cost)}</b>`:'';})()}</span></div>${rec?`<em>${i.q}</em>`:`<div class="st"><button data-q="${k}|-1">−</button><input class="qin" data-qi="${k}" inputmode="decimal" value="${i.q}"><button data-q="${k}|1">+</button></div>`}</div>`;}).join('')||empty('📄','No items. Add parts below.')}</div>
  ${rec?'':`<select class="field" id="poadd"><option value="">＋ Add a part…</option><option value="__new">✏️ New part (not in the list yet)…</option>${DB.parts.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>`}
  ${can.cost()?`<div class="card"><div class="h"><b>Total (cost)</b><b>${f3(tot)} ${DB.ws.currency}</b></div></div>`:''}
  <div class="two"><button class="btn ghost" id="pomsg">📤 Send to supplier</button>${rec?'<span></span>':`<button class="btn okb" id="porec">✓ Received</button>`}</div>
  ${!rec?`<p class="hint">“Received” adds the quantities to stock${can.cost()?' and updates the cost':''}.</p>`:''}
  ${!rec&&can.del()?'<button class="btn ghost jb-del" id="podel">Delete order</button>':''}`;
  $$('[data-qi]').forEach(b=>{b.onfocus=()=>b.select();b.onchange=()=>{const i=p.items[+b.dataset.qi];const q=num(b.value);if(q<=0){p.items.splice(+b.dataset.qi,1);}else i.q=q;save();render();};b.onkeydown=e=>{if(e.key==='Enter')b.blur();};});
  const sv=$('#pov');if(sv)sv.onchange=()=>{p.vendor=sv.value;save();render();};
  $$('[data-q]').forEach(b=>b.onclick=()=>{const [k,d]=b.dataset.q.split('|');const i=p.items[+k];i.q=Math.max(0,i.q+(+d));if(!i.q)p.items.splice(+k,1);save();render();});
  const pa=$('#poadd');if(pa)pa.onchange=()=>{if(!pa.value)return;if(pa.value==='__new'){pa.value='';partSheet(null,pt=>{p.items.push({part:pt.id,q:1,cost:+pt.cost||0});save();render();toast('Part added to stock and to this order');});return;}const pt=byId('parts',pa.value);p.items.push({part:pt.id,q:1,cost:+(((pt.vprices||{})[p.vendor]||{}).cost||pt.cost||0)});save();render();};
  $('#pomsg').onclick=()=>shareText(v.phone,msg('po',{supplier:v.name||'',no:p.no,items:p.items.map(i=>{const pt=byId('parts',i.part)||{};return '• '+(pt.name||'')+(pt.num?' ('+pt.num+')':'')+' × '+i.q+(pt.unit&&pt.unit!=='pc'?' '+pt.unit:'');}).join('\n')}));
  const rc=$('#porec');if(rc)rc.onclick=()=>receivePo(p);
  const dl=$('#podel');if(dl)dl.onclick=()=>{audit('delete','Supplier order #'+p.no);DB.pos=DB.pos.filter(x=>x!==p);save();go('vendors');};};
/* ---------- SERVICES (2.14): one list, group chips filter it, most used first, details folded ---------- */
const SCAT_MERGE=[['Engine','🔧',['Engine','Tune up','Belts']],['Brakes','🛑',['Brakes','Turning']],['Transmission','⚙️',['Transmission']],['Suspension & tires','🛞',['Suspension','Tires','Alignment']],['Electrical & checks','⚡',['Electrical','Inspection','Scanner','Sensor']],['Cooling & AC','❄️',['Cooling','AC']],['Detailing & other','🧽',['Detailing','Cover','Other']]];
function mergeScats(force){if(!DB.ws||(!force&&DB.ws.scatV>=1))return 0;const lc2=x=>String(x||'').trim().toLowerCase();let ch=0;
  const known=new Set(SCAT_MERGE.flatMap(([,,L])=>L.map(lc2)));if(!DB.scats.some(g=>known.has(lc2(g.name))&&!SCAT_MERGE.some(([t])=>lc2(t)===lc2(g.name)))){DB.ws.scatV=1;return 0;}
  SCAT_MERGE.forEach(([to,ic,from])=>{const src=DB.scats.filter(g=>from.map(lc2).includes(lc2(g.name)));if(!src.length)return;
    let tg=DB.scats.find(g=>lc2(g.name)===lc2(to));if(!tg){tg={id:uid('g'),name:to,ic};DB.scats.splice(DB.scats.indexOf(src[0]),0,tg);}else tg.ic=tg.ic||ic;
    src.forEach(g=>{DB.services.forEach(x=>{if(lc2(x.cat)===lc2(g.name)){x.cat=to;ch++;}});if(g!==tg)DB.scats=DB.scats.filter(y=>y!==g);});});
  DB.ws.scatV=1;save();return ch;}
const svcPrices=s=>DB.sizes.map((z,k)=>+(s.p[k]??s.p[s.p.length-1])||0);
const svcBySize=s=>DB.sizes.length>1&&new Set(svcPrices(s).map(f3)).size>1;
SCREENS.svc=m=>{const fc=S.p.g||'';const own=perm('svcEdit');const hidV=!!S.p.hid;
  const hid=DB.services.filter(s=>s.hidden);const ar=I18N.lang==='ar';
  const tags=s=>[s.from?'<span class="tg tgr">FROM</span>':'',s.out&&s.out.who?'<span class="tg tb">OUTSIDE</span>':''].join('');
  const row=s=>{const a=ar&&s.ar?s.ar:s.name,b2=ar&&s.ar?s.name:(s.ar||'');const z=sizeOf(null);const pv=svcPrices(s);
    return `<button class="row srow2" data-se="${s.id}"><div><b>${esc(a)}${tags(s)}</b>${b2?`<span><bdi>${esc(b2)}</bdi></span>`:''}</div><span class="v">${f3(pv[z??0]??pv[0])}${svcBySize(s)?'<small>by size</small>':''}</span></button>`;};
  const groups=DB.scats.filter(g=>DB.services.some(s=>s.cat===g.name&&!s.hidden));
  m.innerHTML=head(hidV?'Hidden services':'Services',`${own&&!hidV?'<button class="lnk" id="smore" aria-label="More">⋯</button>':''}${own&&!hidV?`<button class="lnk" id="sadd">＋ Service</button>`:''}`)+`
  ${!DB.ws.svcReviewed&&own&&!hidV?`<div class="card note"><b>These are starter services.</b><span class="sub">Check the prices, delete what you won't do, add your own, and change the groups as you like. Then tap “Prices checked”.</span><button class="btn okb sm" id="srev">Prices checked ✓</button></div>`:''}
  <input class="field ssrch" id="sq" placeholder="Search services" value="${esc(S.p.q||'')}" autocomplete="off" autocorrect="off" spellcheck="false">
  ${hidV?'':`<div class="chips pcatc"><button data-g="" aria-pressed="${!fc}">All <small>${DB.services.length-hid.length}</small></button>${groups.map(g=>`<button data-g="${g.id}" aria-pressed="${fc===g.id}">${g.ic} ${esc(g.name)} <small>${DB.services.filter(s=>s.cat===g.name&&!s.hidden).length}</small></button>`).join('')}</div>
  <div class="chips sortc">${[['use','Most used'],['az','A–Z']].map(([k,t])=>`<button data-so="${k}" aria-pressed="${(S.p.so||'use')===k}">${t}</button>`).join('')}</div>`}
  <div class="list" id="slist"></div><p class="hint" id="snone" hidden>Nothing found.</p>`;
  const draw=()=>{const q=(S.p.q||'').trim().toLowerCase();const g=DB.scats.find(x=>x.id===S.p.g);
    let L=DB.services.filter(s=>hidV?s.hidden:(!s.hidden&&(!g||s.cat===g.name)));
    if(q){const w=q.split(/\s+/);L=L.filter(s=>{const t=(s.name+' '+(s.ar||'')+' '+T_(s.name)+' '+s.cat).toLowerCase();return w.every(x=>t.includes(x));});}
    if((S.p.so||'use')==='az')L.sort((a,b)=>(ar&&a.ar?a.ar:a.name).localeCompare(ar&&b.ar?b.ar:b.name));else{const u=svcUse();L.sort((a,b)=>(u[b.id]||0)-(u[a.id]||0)||a.name.localeCompare(b.name));}
    const box=$('#slist');box.innerHTML=L.map(row).join('');$('#snone').hidden=!!L.length;
    box.querySelectorAll('[data-se]').forEach(b=>b.onclick=()=>{if(S.sel)return;if(!own){toast('Not allowed for '+S.user.name);return;}svcSheet(byId('services',b.dataset.se));});if(drawn&&typeof attachPress==='function')attachPress(box);drawn=true;};let drawn=false;
  const inp=$('#sq');let tm=0;inp.oninput=()=>{S.p.q=inp.value;clearTimeout(tm);tm=setTimeout(draw,120);};draw();
  $$('[data-g]').forEach(b=>b.onclick=()=>{S.p.g=b.dataset.g;$$('[data-g]').forEach(x=>x.setAttribute('aria-pressed',x===b));draw();});
  $$('[data-so]').forEach(b=>b.onclick=()=>{S.p.so=b.dataset.so;$$('[data-so]').forEach(x=>x.setAttribute('aria-pressed',x===b));draw();});
  const rv=$('#srev');if(rv)rv.onclick=()=>{DB.ws.svcReviewed=true;save();render();};
  const sa=$('#sadd');if(sa)sa.onclick=()=>svcSheet(null,(DB.scats.find(g=>g.id===S.p.g)||DB.scats[0]||{}).name);
  const sm=$('#smore');if(sm)sm.onclick=()=>actionSheet(T_('Services'),'',[
    {ic:'📁',t:'Groups',s:'Groups',fn:()=>go('list',{id:'scat'})},
    {ic:'🚙',t:'Car sizes',s:'Sizes',fn:()=>go('list',{id:'size'})},
    {ic:'🙈',t:'Hidden services',s:String(hid.length),hide:!hid.length,fn:()=>go('svc',{hid:1})}]);};
function svcSheet(s0,cat){const isNew=!s0;const s=JSON.parse(JSON.stringify(s0||{cat:cat||(DB.scats[0]||{}).name||'Other',p:[0],tag:''}));
  s.out=s.out||{who:'',mode:'pass',amt:0};s.parts=s.parts||[];let outOn=!!s.out.who;
  const partners=(DB.mlists.find(L=>/partner|workshop/i.test(L.name))||{items:[]}).items.map(i=>i.name);
  const pr=k=>s.p[k]!=null?s.p[k]:s.p[s.p.length-1];const bySz=DB.sizes.length>1&&new Set(DB.sizes.map((z,k)=>f3(pr(k)))).size>1;
  openSheet(`<h3>${isNew?'New service':'Edit service'}</h3>
  <input class="field" id="sn" placeholder="Name" value="${esc(s.name||'')}">
  <input class="field ar" id="sar" dir="rtl" placeholder="الاسم بالعربية (يظهر في الفاتورة)" value="${esc(s.ar||'')}">
  <select class="field" id="sc">${DB.scats.map(g=>`<option value="${esc(g.name)}" ${g.name===s.cat?'selected':''}>${g.ic} ${esc(g.name)}</option>`).join('')}<option value="__new">＋ New group…</option></select>
  <input class="field" id="scn" placeholder="New group name" hidden>
  <label class="field-l" id="sp1w" ${bySz?'hidden':''}>Price<input class="field" id="sp1" inputmode="decimal" value="${f3(pr(0))}"></label>
  ${DB.sizes.length>1?`<label class="chk"><input type="checkbox" id="sbz" ${bySz?'checked':''}> Different price by car size</label>`:''}
  <div id="szw" ${bySz?'':'hidden'}><div class="field-l" style="display:flex;justify-content:space-between;align-items:center">Price by car size <button class="lnk" data-go2="list:size" style="min-height:0;padding:0">Edit sizes ›</button></div>
  <div class="szg" style="grid-template-columns:repeat(${Math.min(DB.sizes.length,4)},minmax(0,1fr))">${DB.sizes.map((z,k)=>`<label class="field-l">${esc(z)}<input class="field" data-sp="${k}" inputmode="decimal" value="${f3(pr(k))}"></label>`).join('')}</div></div>
  <div class="field-l">⏰ ${T_('Reminder to the customer')}</div><div class="chips">${[['','None'],['oil','Engine oil'],['gear','Gearbox oil'],['rem','After a time or km']].map(([k,l])=>`<button data-t="${k}" aria-pressed="${(s.tag||(s.rem?'rem':''))===k}">${T_(l)}</button>`).join('')}</div>
  <div class="in2" id="sremw" ${(s.tag||(s.rem?'rem':''))==='rem'?'':'hidden'}><label class="field-l">${T_('After (months)')}<input class="field" id="srmo" inputmode="numeric" value="${s.rem&&s.rem.mo||''}" placeholder="6"></label><label class="field-l">${T_('or after (km)')}<input class="field" id="srkm" inputmode="numeric" value="${s.rem&&s.rem.km||''}" placeholder="10000"></label></div>
  <details class="pmore"><summary>More details</summary>
  <label class="chk"><input type="checkbox" id="sfr" ${s.from?'checked':''}> Price “starts from” (set the real price on the job)</label>
  <div class="in2"><label class="field-l">Time it takes (min)<input class="field" id="smin" inputmode="numeric" value="${s.min||''}" placeholder="e.g. 30"></label><label class="field-l">Warranty<input class="field" id="swar" value="${esc(s.war||'')}" placeholder="e.g. 3 months"></label></div>
  ${sx('smart')?`<label class="field-l">✨ Smart compare when adding to a job<select class="field" id="srx"><option value="auto" ${s.rx===undefined?'selected':''}>Auto${rxGuess(s)?' ('+RX[rxGuess(s)].t+')':' (none)'}</option><option value="" ${s.rx===''?'selected':''}>Off for this service</option>${Object.entries(RX).map(([k,r])=>`<option value="${k}" ${s.rx===k?'selected':''}>${r.ic} ${r.t}</option>`).join('')}</select></label>`:''}
  <div class="field-l">Parts that come with it</div><div class="list" id="spl"></div>
  <select class="field" id="spa"><option value="">＋ Add a part…</option>${DB.parts.map(p=>`<option value="${p.id}">${esc(p.name)} · ${f3(p.price)}</option>`).join('')}</select>
  <div class="obox"><label class="chk" style="min-height:0"><input type="checkbox" id="soo" ${outOn?'checked':''}> <b>🏪 Done at another workshop</b></label><div id="sob"></div></div>
  ${can.cost()?`<label class="field-l">Worker commission each time (${DB.ws.currency})<input class="field" id="scm" inputmode="decimal" value="${s.comm?f3(s.comm):''}" placeholder="0.000"></label>`:''}
  <label class="chk"><input type="checkbox" id="slk" ${s.lockP?'checked':''}> Workers can't change the price</label>
  <label class="chk"><input type="checkbox" id="shd" ${s.hidden?'checked':''}> Hide (not shown when adding to a job)</label></details>
  <button class="btn" id="sok">Save</button>${!isNew?'<button class="btn ghost jb-del" id="sdel">Delete service</button>':''}`,el=>{
  const sp1=el.querySelector('#sp1'),sbz=el.querySelector('#sbz'),szw=el.querySelector('#szw');const spAll=()=>[...el.querySelectorAll('[data-sp]')];
  sp1.oninput=()=>{if(!sbz||!sbz.checked)spAll().forEach(i=>i.value=sp1.value);};
  if(sbz)sbz.onchange=()=>{szw.hidden=!sbz.checked;el.querySelector('#sp1w').hidden=sbz.checked;if(!sbz.checked)spAll().forEach(i=>i.value=sp1.value);else spAll().forEach(i=>{if(!num(i.value))i.value=sp1.value;});};
  const sp0=spAll()[0];if(sp0)sp0.addEventListener('input',()=>{sp1.value=sp0.value;});
  let tag=s.tag||(s.rem?'rem':'');el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tag=b.dataset.t;el.querySelectorAll('[data-t]').forEach(x=>x.setAttribute('aria-pressed',x===b));const w=el.querySelector('#sremw');if(w)w.hidden=tag!=='rem';});
  const sc=el.querySelector('#sc'),scn=el.querySelector('#scn');sc.onchange=()=>{scn.hidden=sc.value!=='__new';if(!scn.hidden)scn.focus();};
  el.querySelectorAll('[data-go2]').forEach(b=>b.onclick=()=>{closeSheet();go('list',{id:'size'});});
  const drawP=()=>{el.querySelector('#spl').innerHTML=s.parts.map((x,k)=>{const p=byId('parts',x.ref)||{name:'(deleted part)'};return `<div class="oi"><div><b>${esc(p.name)}</b><span>${p.unit==='L'?'litres':'qty'}</span></div><div class="st"><button data-pq="${k}|-1">−</button><em>${x.q}</em><button data-pq="${k}|1">+</button></div></div>`;}).join('')||'<p class="hint">None. Example: oil change → oil + filter.</p>';
    el.querySelectorAll('[data-pq]').forEach(b=>b.onclick=()=>{const [k,d]=b.dataset.pq.split('|');const x=s.parts[+k];const p=byId('parts',x.ref)||{};const st=p.unit==='L'?0.5:1;x.q=Math.round((x.q+st*(+d))*10)/10;if(x.q<=0)s.parts.splice(+k,1);drawP();});};
  el.querySelector('#spa').onchange=e=>{const p=byId('parts',e.target.value);if(p)s.parts.push({ref:p.id,q:p.unit==='L'?4:1});e.target.value='';drawP();};drawP();
  const drawO=()=>{const b=el.querySelector('#sob');if(!outOn){b.innerHTML='<p class="hint" style="margin-top:6px">For work you send out, like car wash or tyre repair.</p>';return;}
    b.innerHTML=`<input class="field" id="sow" placeholder="Which workshop" value="${esc(s.out.who)}" list="sowl" style="margin-top:8px"><datalist id="sowl">${partners.map(x=>`<option>${esc(x)}</option>`).join('')}</datalist>
    <div class="seg">${[['pass','Not in our sales'],['share','We keep a share'],['pay','We pay them']].map(([k,l])=>`<button data-om="${k}" class="${s.out.mode===k?'on':''}">${l}</button>`).join('')}</div>
    ${s.out.mode!=='pass'?`<label class="field-l">${s.out.mode==='share'?'We keep each time':'We pay them each time'} (${DB.ws.currency})<input class="field" id="soa" inputmode="decimal" value="${s.out.amt?f3(s.out.amt):''}"></label>`:''}
    <p class="hint">${{pass:'The customer pays us and sees it on the invoice. It is not counted in our sales or profit. The app keeps what we owe them.',share:'Counted in sales. Our profit is only the share we keep; the rest is owed to them.',pay:'Counted in sales. What we pay them is the cost, so profit is the difference.'}[s.out.mode]}</p>`;
    b.querySelectorAll('[data-om]').forEach(x=>x.onclick=()=>{keepO();s.out.mode=x.dataset.om;drawO();});};
  const keepO=()=>{const w=el.querySelector('#sow');if(w)s.out.who=w.value.trim();const a=el.querySelector('#soa');if(a)s.out.amt=num(a.value);};
  el.querySelector('#soo').onchange=e=>{keepO();outOn=e.target.checked;drawO();};drawO();
  el.querySelector('#sok').onclick=()=>{const n=$('#sn').value.trim();if(!n){toast('Type a name');return;}keepO();if(outOn&&!s.out.who){toast('Type which workshop does it');return;}let g=sc.value;
    if(g==='__new'){g=scn.value.trim();if(!g){toast('Type the group name');return;}const ex=DB.scats.find(x=>x.name.toLowerCase()===g.toLowerCase());if(ex)g=ex.name;else DB.scats.push({id:uid('g'),name:g,ic:'🔧'});}
    if(!sbz||!sbz.checked)spAll().forEach(i=>i.value=sp1.value);
    if(s0){const np=[...el.querySelectorAll('[data-sp]')].map(i=>num(i.value));if(np.some((x,i)=>Math.abs(x-(+s0.p[i]||0))>0.0005))audit('price','Service '+s0.name+': '+s0.p.map(f3).join('/')+' → '+np.map(f3).join('/'));}
    const t=s0||{id:uid('s'),custom:true};if(!s0)DB.services.push(t);
    Object.assign(t,{name:n,ar:$('#sar').value.trim(),cat:g,p:[...el.querySelectorAll('[data-sp]')].map(i=>num(i.value)),from:$('#sfr').checked,min:parseInt($('#smin').value)||0,war:$('#swar').value.trim(),tag:tag==='rem'?'':tag,rem:tag==='rem'&&(num($('#srmo').value)||num($('#srkm').value))?{mo:num($('#srmo').value)||0,km:num($('#srkm').value)||0}:null,parts:s.parts,out:outOn?s.out:null,lockP:$('#slk').checked,hidden:$('#shd').checked});
    const cm=$('#scm');if(cm)t.comm=num(cm.value);const rxe=$('#srx');if(rxe){if(rxe.value==='auto')delete t.rx;else t.rx=rxe.value;}
    if(outOn&&!partners.includes(s.out.who)){let L=DB.mlists.find(L=>/partner|workshop/i.test(L.name));if(!L){L={id:uid('ml'),name:'Partner workshops',ic:'🏪',note:'Workshops that do work for us.',items:[],inMenu:true};DB.mlists.push(L);}L.items.push({id:uid('li'),name:s.out.who,note:''});}
    save();closeSheet();render();};
  const d=el.querySelector('#sdel');if(d)d.onclick=()=>confirmSheet(`Delete “${esc(s0.name)}”? Old invoices keep it.`,'Delete service',()=>{audit('delete','Service '+s0.name);DB.services=DB.services.filter(x=>x!==s0);save();render();});});}
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
   const d=el.querySelector('#cjdel');if(d)d.onclick=()=>{audit('delete','Canned job '+c.name);DB.canned=DB.canned.filter(x=>x!==c);save();closeSheet();render();};});}
/* inspections */
SCREENS.insp=m=>{m.innerHTML=head('Inspection checklists',`<button class="lnk" id="iadd">＋ New</button>`)+`<p class="hint">Keep them short: 15 to 20 items. Workers tap green, yellow or red.</p><div class="list">${DB.insp.map(t=>`<button class="row" data-ie="${t.id}"><div><b>${esc(t.name)}</b><span>${t.items.length} items</span></div><span class="v">Edit</span></button>`).join('')}</div>`;
  const edit=t=>{const isNew=!t;t=t||{name:'',items:[]};openSheet(`<h3>${isNew?'New checklist':'Edit checklist'}</h3><input class="field" id="in" placeholder="Name" value="${esc(t.name)}"><label class="field-l">One item per line<textarea class="field" id="ii" rows="10">${esc(t.items.join('\n'))}</textarea></label><button class="btn" id="iok">Save</button>${!isNew?'<button class="btn ghost jb-del" id="idel">Delete</button>':''}`,el=>{
   el.querySelector('#iok').onclick=()=>{const n=$('#in').value.trim();const it=$('#ii').value.split('\n').map(x=>x.trim()).filter(Boolean);if(!n||!it.length){toast('Name and items');return;}if(isNew){t.id=uid('i');DB.insp.push(t);}t.name=n;t.items=it;save();closeSheet();render();};
   const d=el.querySelector('#idel');if(d)d.onclick=()=>{audit('delete','Checklist '+t.name);DB.insp=DB.insp.filter(x=>x!==t);save();closeSheet();render();};});};
  $('#iadd').onclick=()=>edit();$$('[data-ie]').forEach(b=>b.onclick=()=>edit(DB.insp.find(x=>x.id===b.dataset.ie)));};

/* ---------- money owed: on the customer page, when the customer comes back, and the Debts list ---------- */
function debtText(c){const d=custDebt(c.id),cur=DB.ws.currency==='OMR'?'ر.ع':DB.ws.currency;const items=d.list.map(x=>{const v=vehOf(x.j);return '• فاتورة رقم '+x.j.inv.no+' · '+fmtD(x.j.inv.t||x.j.t)+(v&&v.make?' · '+carName(v):'')+': '+f3(x.due)+' '+cur;}).join('\n');
  return msg('payreq',{name:c.name||'',due:f3(d.due)+' '+cur,items});}
function debtBox(c){const d=custDebt(c.id);if(!d.list.length)return '';
  return `<div class="debtbox"><div class="dh"><b>⚠️ ${T_('Owes '+f3(d.due)+' OMR')}</b>${c.payRem?`<span>${T_('Reminded')} ${fmtD(c.payRem)}</span>`:''}</div>
   ${d.list.map(x=>`<button class="row" data-go="inv:${x.j.id}"><div><b>#${x.j.inv.no} · ${f3(x.due)}</b><span>${fmtD(x.j.inv.t||x.j.t)} · ${T_(x.days+' days')}${vehOf(x.j).make?' · '+esc(carName(vehOf(x.j))):''}</span></div><span class="v">${T_('Record payment')} ›</span></button>`).join('')}
   ${c.phone?`<button class="btn wa sm" id="dbrem">💳 ${T_('Payment reminder')}</button>`:''}</div>`;}
function debtBind(c){const b=$('#dbrem');if(b)b.onclick=()=>{shareText(c.phone,debtText(c));c.payRem=now();audit('money','Payment reminder · '+(c.name||''));save();render();};}
function debtNote(cid){if(!can.money())return '';const d=custDebt(cid);if(!d.list.length)return '';const o=d.list[0];
  return `<div class="debtnote">⚠️ ${T_('This customer owes '+f3(d.due)+' OMR')} · ${T_('invoice')} #${o.j.inv.no}${d.list.length>1?' +'+(d.list.length-1):''} · ${T_(o.days+' days')}</div>`;}
SCREENS.debts=m=>{if(!can.money()){go('home');return;}
  const rows=DB.customers.map(c=>({c,d:custDebt(c.id)})).filter(x=>x.d.list.length).sort((a,b)=>b.d.list[0].days-a.d.list[0].days);
  const tot=totalDue();const sel=S.debtSel||(S.debtSel=null);
  m.innerHTML=head('Debts',rows.length?`<button class="lnk" id="dsel">${sel?'Cancel':'Select'}</button>`:'')+`
  <div class="kpis2"><div class="kpi org"><b>${f3(tot)}</b><span>Due · ${esc(DB.ws.currency)}</span></div><div class="kpi"><b>${rows.length}</b><span>Customers</span></div></div>
  ${rows.length?`<div class="list">${rows.map(({c,d})=>`<div class="drow${sel&&sel.has(c.id)?' on':''}" data-dc="${c.id}">${sel?`<i class="ck">${sel.has(c.id)?'✓':''}</i>`:''}<div class="dt"><b>${esc(c.name||'')}</b><span>${d.list.length} ${T_(d.list.length===1?'invoice':'invoices')} · ${T_('oldest')} ${T_(d.list[0].days+' days')}${c.payRem?' · '+T_('Reminded')+' '+fmtD(c.payRem):''}</span></div><b class="da">${f3(d.due)}</b>${!sel&&c.phone?`<button class="btn wa sm" data-dw="${c.id}">💳</button>`:''}</div>`).join('')}</div>`:empty('✅','Nobody owes money.')}
  ${sel?`<div class="selb2"><b>${sel.size} ${T_('selected')}</b><button class="btn sm" id="dsend" ${sel.size?'':'disabled'}>💳 ${T_('Send reminders')}</button></div>`:''}`;
  const ds=$('#dsel');if(ds)ds.onclick=()=>{S.debtSel=sel?null:new Set();render();};
  $$('[data-dc]').forEach(r=>{let tm=0,long=false;const id=r.dataset.dc;
    r.onclick=e=>{if(e.target.closest('[data-dw]'))return;if(long){long=false;return;}if(S.debtSel){S.debtSel.has(id)?S.debtSel.delete(id):S.debtSel.add(id);render();}else go('custd',{id});};
    r.addEventListener('pointerdown',()=>{tm=setTimeout(()=>{long=true;if(!S.debtSel)S.debtSel=new Set();S.debtSel.add(id);try{navigator.vibrate&&navigator.vibrate(15);}catch(e){}render();},500);});
    ['pointerup','pointerleave','pointercancel'].forEach(ev=>r.addEventListener(ev,()=>clearTimeout(tm)));});
  $$('[data-dw]').forEach(b=>b.onclick=()=>{const c=byId('customers',b.dataset.dw);shareText(c.phone,debtText(c));c.payRem=now();save();render();});
  const sd=$('#dsend');if(sd)sd.onclick=()=>{if(!S.debtSel)return;const cs=[...S.debtSel].map(id=>byId('customers',id)).filter(c=>c&&c.phone);
    openSheet(`<h3>💳 ${T_('Send reminders')}</h3><p class="hint">${T_('Tap each one. WhatsApp opens with the message ready; come back for the next.')}</p><div class="list">${cs.map(c=>`<button class="row" data-ds="${c.id}"><div><b>${esc(c.name)}</b><span>${f3(custDebt(c.id).due)} ${esc(DB.ws.currency)}</span></div><span class="v">${c.payRem&&now()-c.payRem<36e5?'✓':T_('Send')+' ›'}</span></button>`).join('')}</div>`,el=>{
      el.querySelectorAll('[data-ds]').forEach(b=>b.onclick=()=>{const c=byId('customers',b.dataset.ds);shareText(c.phone,debtText(c));c.payRem=now();save();b.querySelector('.v').textContent='✓';b.classList.add('done');});});
    S.debtSel=null;render();};
};
