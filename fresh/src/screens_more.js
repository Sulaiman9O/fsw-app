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
    const t=msg('remind',{name:c.name||'',car:carName(v),plate:v.plate||'',service:r.kind==='gear'?'تغيير زيت الجير':'تغيير زيت المحرك'});shareText(c.phone,t);r.sent=now();save();});
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
  ${sec('Cars · '+vs.length,`<button class="lnk" id="vadd">＋ Add car</button>`)}
  <div class="list">${vs.map(v=>`<button class="row" data-ve="${v.id}"><div><b>${esc(carName(v))} ${v.plate?`<span class="pl">${esc(v.plate)}</span>`:''}</b><span>${v.km?kmf(v.km)+' km':''}${v.vin?' · '+esc(v.vin):''}</span></div><span class="v">Edit</span></button>`).join('')||empty('🚗','No cars yet.')}</div>
  ${sec('History · '+js.length)}<div class="list">${js.map(carRow).join('')||empty('🧾','No visits yet.')}</div>
  ${can.del()&&!js.length?`<button class="btn ghost jb-del" id="cdel">Delete customer</button>`:''}`;
  $('#cedit').onclick=()=>custSheet(c);$('#vadd').onclick=()=>vehSheet(c);
  $$('[data-ve]').forEach(b=>b.onclick=()=>vehSheet(c,byId('vehicles',b.dataset.ve)));
  const w=$('#cwa');if(w)w.onclick=()=>shareText(c.phone,msg('hello',{name:c.name||''}));
  const d=$('#cdel');if(d)d.onclick=()=>confirmSheet('Delete '+esc(c.name)+'?','Delete',()=>{DB.customers=DB.customers.filter(x=>x!==c);DB.vehicles=DB.vehicles.filter(v=>v.cust!==c.id);save();go('cust');});
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
  const dl=$('#podel');if(dl)dl.onclick=()=>{DB.pos=DB.pos.filter(x=>x!==p);save();go('vendors');};};
/* ---------- SERVICES ---------- */
SCREENS.svc=m=>{const q=(S.p.q||'').toLowerCase(),fc=S.p.g||'';const own=perm('svcEdit');
  const vis=g=>DB.services.filter(s=>s.cat===g.name&&!s.hidden&&(!q||(s.name+' '+(s.ar||'')).toLowerCase().includes(q)));const hid=DB.services.filter(s=>s.hidden);
  const tags=s=>[s.from?'<span class="tg tgr">FROM</span>':'',s.out&&s.out.who?'<span class="tg tb">OUTSIDE</span>':'',s.lockP?'<span class="tg tgr">🔒</span>':''].join('');
  const sub=s=>[s.ar?'<bdi>'+esc(s.ar)+'</bdi>':'',s.min?'⏱ '+s.min+' min':'',s.out&&s.out.who?'at '+esc(s.out.who)+' · '+({pass:'not in our sales',share:'we keep '+f3(s.out.amt),pay:'we pay '+f3(s.out.amt)})[s.out.mode]:'',(s.parts||[]).length?'+ '+s.parts.length+' parts':'',s.tag?(s.tag==='oil'?'oil reminder':'gearbox reminder'):'',s.war?'warranty '+esc(s.war):''].filter(Boolean).join(' · ');
  const row=s=>`<button class="row" data-se="${s.id}"><div><b>${esc(s.name)}${tags(s)}</b>${sub(s)?`<span>${sub(s)}</span>`:''}</div><span class="v">${f3(s.p[sizeOf(null)]??s.p[0])}<small>${DB.sizes.length>1?DB.sizes.map((z,k)=>f3(s.p[k]??s.p[s.p.length-1])).filter((x,i,a)=>a.indexOf(x)===i).length>1?'by size':'all sizes':''}</small></span></button>`;
  m.innerHTML=head('Services',own?`<button class="lnk" id="sadd">＋ Service</button>`:'')+`
  ${!DB.ws.svcReviewed&&own?`<div class="card note"><b>These are starter services.</b><span class="sub">Check the prices, delete what you won't do, add your own, and change the groups as you like. Then tap “Prices checked”.</span><button class="btn okb sm" id="srev">Prices checked ✓</button></div>`:''}
  <input class="field" id="sq" placeholder="Search services" value="${esc(S.p.q||'')}">
  <div class="chips"><button data-g="" aria-pressed="${!fc}">All ${DB.services.length-hid.length}</button>${DB.scats.map(g=>`<button data-g="${g.id}" aria-pressed="${fc===g.id}">${g.ic} ${esc(g.name)} ${DB.services.filter(s=>s.cat===g.name&&!s.hidden).length}</button>`).join('')}${own?'<button data-go="list:scat">⚙️ Groups</button><button data-go="list:size">🚙 Car sizes</button>':''}</div>
  ${DB.scats.filter(g=>!fc||g.id===fc).map(g=>{const l=vis(g);if(!l.length&&(q||!own))return '';return sec(`${g.ic} ${esc(g.name)}`,l.length?sizeOf(null)!=null?DB.sizes[sizeOf(null)]+' price':'':'')+`<div class="list">${l.map(row).join('')}${own&&!q?`<button class="row addr" data-sa="${g.id}"><div><b>＋ Add to ${esc(g.name)}</b></div></button>`:''}</div>`;}).join('')}
  ${hid.length&&own&&!fc?sec('🙈 Hidden · '+hid.length,'not shown when adding to a job')+`<div class="list">${hid.map(row).join('')}</div>`:''}`;
  const sq=$('#sq');sq.oninput=()=>{S.p.q=sq.value;const pos=sq.value.length;render();const e=$('#sq');e.focus();try{e.setSelectionRange(pos,pos);}catch(x){}};
  $$('[data-g]').forEach(b=>b.onclick=()=>{S.p.g=b.dataset.g;render();});
  const rv=$('#srev');if(rv)rv.onclick=()=>{DB.ws.svcReviewed=true;save();render();};
  const sa=$('#sadd');if(sa)sa.onclick=()=>svcSheet(null,(DB.scats.find(g=>g.id===fc)||DB.scats[0]||{}).name);
  $$('[data-sa]').forEach(b=>b.onclick=()=>svcSheet(null,DB.scats.find(g=>g.id===b.dataset.sa).name));
  $$('[data-se]').forEach(b=>b.onclick=()=>{if(!own){toast('Not allowed for '+S.user.name);return;}svcSheet(byId('services',b.dataset.se));});};
function svcSheet(s0,cat){const isNew=!s0;const s=JSON.parse(JSON.stringify(s0||{cat:cat||(DB.scats[0]||{}).name||'Other',p:[0],tag:''}));
  s.out=s.out||{who:'',mode:'pass',amt:0};s.parts=s.parts||[];let outOn=!!s.out.who;
  const partners=(DB.mlists.find(L=>/partner|workshop/i.test(L.name))||{items:[]}).items.map(i=>i.name);
  const pr=k=>s.p[k]!=null?s.p[k]:s.p[s.p.length-1];
  openSheet(`<h3>${isNew?'New service':'Edit service'}</h3>
  <input class="field" id="sn" placeholder="Name" value="${esc(s.name||'')}">
  <input class="field ar" id="sar" dir="rtl" placeholder="الاسم بالعربي (يطلع في الفاتورة)" value="${esc(s.ar||'')}">
  <select class="field" id="sc">${DB.scats.map(g=>`<option value="${esc(g.name)}" ${g.name===s.cat?'selected':''}>${g.ic} ${esc(g.name)}</option>`).join('')}<option value="__new">＋ New group…</option></select>
  <input class="field" id="scn" placeholder="New group name" hidden>
  <div class="field-l" style="display:flex;justify-content:space-between;align-items:center">Price by car size <button class="lnk" data-go2="list:size" style="min-height:0;padding:0">Edit sizes ›</button></div>
  <div class="szg" style="grid-template-columns:repeat(${Math.min(DB.sizes.length,4)},minmax(0,1fr))">${DB.sizes.map((z,k)=>`<label class="field-l">${esc(z)}<input class="field" data-sp="${k}" inputmode="decimal" value="${f3(pr(k))}"></label>`).join('')}</div>
  <label class="chk"><input type="checkbox" id="sfr" ${s.from?'checked':''}> Price “starts from” (set the real price on the job)</label>
  <div class="in2"><label class="field-l">Time it takes (min)<input class="field" id="smin" inputmode="numeric" value="${s.min||''}" placeholder="e.g. 30"></label><label class="field-l">Warranty<input class="field" id="swar" value="${esc(s.war||'')}" placeholder="e.g. 3 months"></label></div>
  ${sx('smart')?`<label class="field-l">✨ Smart compare when adding to a job<select class="field" id="srx"><option value="auto" ${s.rx===undefined?'selected':''}>Auto${rxGuess(s)?' ('+RX[rxGuess(s)].t+')':' (none)'}</option><option value="" ${s.rx===''?'selected':''}>Off for this service</option>${Object.entries(RX).map(([k,r])=>`<option value="${k}" ${s.rx===k?'selected':''}>${r.ic} ${r.t}</option>`).join('')}</select></label>`:''}
  <div class="field-l">Reminder</div><div class="chips">${[['','None'],['oil','Engine oil'],['gear','Gearbox oil']].map(([k,l])=>`<button data-t="${k}" aria-pressed="${(s.tag||'')===k}">${l}</button>`).join('')}</div>
  <div class="field-l">Parts that come with it</div><div class="list" id="spl"></div>
  <select class="field" id="spa"><option value="">＋ Add a part…</option>${DB.parts.map(p=>`<option value="${p.id}">${esc(p.name)} · ${f3(p.price)}</option>`).join('')}</select>
  <div class="obox"><label class="chk" style="min-height:0"><input type="checkbox" id="soo" ${outOn?'checked':''}> <b>🏪 Done at another workshop</b></label><div id="sob"></div></div>
  ${can.cost()?`<label class="field-l">Worker commission each time (${DB.ws.currency})<input class="field" id="scm" inputmode="decimal" value="${s.comm?f3(s.comm):''}" placeholder="0.000"></label>`:''}
  <label class="chk"><input type="checkbox" id="slk" ${s.lockP?'checked':''}> Workers can't change the price</label>
  <label class="chk"><input type="checkbox" id="shd" ${s.hidden?'checked':''}> Hide (not shown when adding to a job)</label>
  <button class="btn" id="sok">Save</button>${!isNew?'<button class="btn ghost jb-del" id="sdel">Delete service</button>':''}`,el=>{
  let tag=s.tag||'';el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tag=b.dataset.t;el.querySelectorAll('[data-t]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
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
    const t=s0||{id:uid('s'),custom:true};if(!s0)DB.services.push(t);
    Object.assign(t,{name:n,ar:$('#sar').value.trim(),cat:g,p:[...el.querySelectorAll('[data-sp]')].map(i=>num(i.value)),from:$('#sfr').checked,min:parseInt($('#smin').value)||0,war:$('#swar').value.trim(),tag,parts:s.parts,out:outOn?s.out:null,lockP:$('#slk').checked,hidden:$('#shd').checked});
    const cm=$('#scm');if(cm)t.comm=num(cm.value);const rxe=$('#srx');if(rxe){if(rxe.value==='auto')delete t.rx;else t.rx=rxe.value;}
    if(outOn&&!partners.includes(s.out.who)){let L=DB.mlists.find(L=>/partner|workshop/i.test(L.name));if(!L){L={id:uid('ml'),name:'Partner workshops',ic:'🏪',note:'Workshops that do work for us.',items:[],inMenu:true};DB.mlists.push(L);}L.items.push({id:uid('li'),name:s.out.who,note:''});}
    save();closeSheet();render();};
  const d=el.querySelector('#sdel');if(d)d.onclick=()=>confirmSheet(`Delete “${esc(s0.name)}”? Old invoices keep it.`,'Delete service',()=>{DB.services=DB.services.filter(x=>x!==s0);save();render();});});}
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
