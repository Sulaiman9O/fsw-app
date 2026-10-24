/* ---------- CUSTOMERS, more like the old system: search by plate too, filters (owe money, reminder due, no phone, same phone),
   sort (last visit, name, spent, owed), last visit and money on each row, more details (area, email, company), move a car to
   another customer, and merge two records of the same person. ---------- */
let CSTAT=null;
function custStats(){const k=DB.jobs.length+'|'+DB.customers.length+'|'+DB.vehicles.length+'|'+(DB.jobs.reduce((a,j)=>a+(j.pays||[]).length,0));if(CSTAT&&CSTAT.k===k)return CSTAT.m;
  const m={};DB.customers.forEach(c=>m[c.id]={last:0,visits:0,spent:0,due:0,cars:[]});DB.vehicles.forEach(v=>{const o=m[v.cust];if(o)o.cars.push(v);});
  DB.jobs.forEach(j=>{const o=m[j.cust];if(!o)return;if(j.t>o.last)o.last=j.t;if((j.items||[]).length)o.visits++;if(isInvoiced(j)&&!j.returned){const T=jobTotals(j);o.spent+=T.total;o.due+=T.due;}});
  const ph={};DB.customers.forEach(c=>{const k=phoneKey(c.phone);if(k.length>=7)(ph[k]=ph[k]||[]).push(c.id);});Object.values(ph).forEach(a=>{if(a.length>1)a.forEach(id=>m[id].dup=a.length);});
  CSTAT={k,m};return m;}
SCREENS.cust=m=>{const P=S.p;P.f=P.f||'all';P.s=P.s||'last';P.n=P.n||60;const st=custStats();const rd=remindersDue();const remC=new Set(rd.map(r=>r.cust));const q=normQ(P.q||'');
  let L=DB.customers.filter(c=>{const o=st[c.id]||{};if(P.f==='due'&&!(o.due>0))return false;if(P.f==='rem'&&!remC.has(c.id))return false;if(P.f==='nophone'&&phoneKey(c.phone).length>=7)return false;if(P.f==='dup'&&!o.dup)return false;
    if(!q)return true;return normQ([c.name,c.phone,c.area,c.company,...(o.cars||[]).map(v=>(v.plate||'')+' '+carName(v)+' '+(v.vin||''))].join(' ')).includes(q);});
  const S_={last:(a,b)=>(st[b.id].last||b.t||0)-(st[a.id].last||a.t||0),name:(a,b)=>String(a.name||'').localeCompare(String(b.name||'')),spent:(a,b)=>st[b.id].spent-st[a.id].spent,due:(a,b)=>st[b.id].due-st[a.id].due};L.sort(S_[P.s]||S_.last);
  const cnt=k=>k==='due'?DB.customers.filter(c=>st[c.id].due>0).length:k==='rem'?remC.size:k==='nophone'?DB.customers.filter(c=>phoneKey(c.phone).length<7).length:k==='dup'?DB.customers.filter(c=>st[c.id].dup).length:DB.customers.length;
  const row=c=>{const o=st[c.id];return `<button class="row crow2" data-go="custd:${c.id}"><div><b>${esc(c.name||T_('Walk-in'))}${o.dup?` <span class="tg tgw">${T_('same phone')}</span>`:''}</b><span>${c.phone?`<bdi dir="ltr">${esc(c.phone)}</bdi>`:T_('no phone')}${c.area?' · '+esc(c.area):''}</span>
    ${o.cars.length?`<span class="cars">${o.cars.slice(0,3).map(v=>`<i>${esc(carName(v)||'')}${v.plate?` <bdi class="pl">${esc(v.plate)}</bdi>`:''}</i>`).join('')}${o.cars.length>3?`<i>+${o.cars.length-3}</i>`:''}</span>`:''}</div>
    <span class="v cv2">${o.due>0&&can.money()?`<em class="due">${f3(o.due)}</em>`:''}<small>${o.last?ago(o.last):''}</small><small>${o.visits?o.visits+' '+T_('visits'):''}</small></span></button>`;};
  m.innerHTML=head('Customers',`<button class="lnk" id="cadd">＋ ${T_('Add')}</button>`)+`
   ${rd.length?`<button class="mitem" id="crem"><span class="ic">🔔</span><div><b>${T_('Due for a reminder')} · ${rd.length}</b><span>${T_('Send them on WhatsApp')}</span></div><span class="v">›</span></button>`:''}
   <input class="field" id="cq" placeholder="${T_('Name, phone, plate or car…')}" value="${esc(P.q||'')}" autocomplete="off" autocorrect="off" spellcheck="false">
   <div class="chips">${[['all','All'],['due','Owe money'],['rem','Reminder due'],['nophone','No phone'],['dup','Same phone']].filter(([k])=>k!=='due'||can.money()).map(([k,t])=>`<button data-cf="${k}" aria-pressed="${P.f===k}">${T_(t)} <span>${cnt(k)}</span></button>`).join('')}</div>
   <div class="chips sm">${[['last','Last visit'],['name','A–Z'],['spent','Spent most'],['due','Owe most']].filter(([k])=>can.money()||(k!=='spent'&&k!=='due')).map(([k,t])=>`<button data-cs="${k}" aria-pressed="${P.s===k}">${T_(t)}</button>`).join('')}</div>
   ${L.length?`<div class="list">${L.slice(0,P.n).map(row).join('')}</div>${L.length>P.n?`<button class="btn ghost" id="cmore">${T_('Show more')} · ${L.length-P.n}</button>`:''}`:empty('👥','Nothing found.')}
   ${P.f==='dup'&&L.length?`<p class="hint">${T_('Open one of them and tap “Merge with another customer”.')}</p>`:''}`;
  const inp=$('#cq');let tm;inp.oninput=()=>{clearTimeout(tm);tm=setTimeout(()=>{P.q=inp.value;P.n=60;render();setTimeout(()=>{const i=$('#cq');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},0);},220);};
  $$('[data-cf]').forEach(b=>b.onclick=()=>{P.f=b.dataset.cf;P.n=60;render();});$$('[data-cs]').forEach(b=>b.onclick=()=>{P.s=b.dataset.cs;render();});
  const mo=$('#cmore');if(mo)mo.onclick=()=>{P.n+=100;render();};$('#cadd').onclick=()=>custSheet();
  const cr=$('#crem');if(cr)cr.onclick=()=>remListSheet();};
/* the reminders that are due, in a sheet (they used to fill the top of the page) */
function remListSheet(){const rd=remindersDue().sort((a,b)=>a.due-b.due);
  openSheet(`<h3>🔔 ${T_('Due for a reminder')}</h3><div class="list">${rd.map(r=>{const v=byId('vehicles',r.veh)||{},c=byId('customers',r.cust)||{};const d=Math.round((r.due-now())/864e5);
    return `<div class="row"><div><b>${esc(c.name||'')}</b><span>${esc(carName(v))} · ${r.kind==='other'&&r.name?esc(r.name):r.kind==='gear'?T_('Gearbox oil'):T_('Engine oil change')} · ${d<0?T_('late')+' '+(-d):d===0?T_('today'):T_('in')+' '+d} ${T_('days')}${r.dueKm?' · <bdi>'+kmf(r.dueKm)+' km</bdi>':''}</span></div>${c.phone?`<button class="btn wa sm" data-rwa="${r.id}">WhatsApp</button>`:''}<button class="lnk" data-rs="${r.id}">✓</button></div>`;}).join('')}</div>`,el=>{
    el.querySelectorAll('[data-rs]').forEach(b=>b.onclick=()=>{const r=DB.reminders.find(x=>x.id===b.dataset.rs);r.sent=now();save();closeSheet();remListSheet();});
    el.querySelectorAll('[data-rwa]').forEach(b=>b.onclick=()=>{const r=DB.reminders.find(x=>x.id===b.dataset.rwa);const v=byId('vehicles',r.veh)||{},c=byId('customers',r.cust)||{};
      shareText(c.phone,msg('remind',{name:c.name||'',car:carName(v),plate:v.plate||'',service:r.kind==='other'&&r.name?r.name:r.kind==='gear'?'تغيير زيت ناقل الحركة':'تغيير زيت المحرك'}));r.sent=now();save();});});}
/* more details on a customer */
custSheet=window.custSheet=function(c){const isNew=!c;c=c||{};
  openSheet(`<h3>${T_(isNew?'New customer':'Edit customer')}</h3><input class="field" id="cn" placeholder="${T_('Name')}" value="${esc(c.name||'')}"><input class="field" id="cp" inputmode="tel" placeholder="${T_('Phone')}" value="${esc(c.phone||'')}">
   <div class="in2"><input class="field" id="car" placeholder="${T_('Area / city')}" value="${esc(c.area||'')}"><input class="field" id="cem" inputmode="email" placeholder="${T_('Email (optional)')}" value="${esc(c.email||'')}"></div>
   <input class="field" id="cco" placeholder="${T_('Company (bill to, optional)')}" value="${esc(c.company||'')}"><textarea class="field" id="cnt" rows="2" placeholder="${T_('Notes')}">${esc(c.notes||'')}</textarea><button class="btn" id="cok">${T_('Save')}</button>`,el=>el.querySelector('#cok').onclick=()=>{const n=$('#cn').value.trim();if(!n){toast('Type a name');return;}
    const ph=$('#cp').value.replace(/[^\d+]/g,'');const ex=ph&&DB.customers.find(x=>x!==c&&phoneKey(x.phone)===phoneKey(ph)&&phoneKey(ph).length>=7);
    if(isNew){c={id:uid('c'),t:now()};DB.customers.push(c);}CSTAT=null;Object.assign(c,{name:n,phone:ph,area:$('#car').value.trim(),email:$('#cem').value.trim(),company:$('#cco').value.trim(),notes:$('#cnt').value});save();closeSheet();
    if(ex)toast(T_('Another customer has this phone')+': '+(ex.name||''));isNew?go('custd',{id:c.id}):render();});};
/* customer page: details, last visit, same-phone warning, merge */
(function(){const CD=SCREENS.custd;SCREENS.custd=m=>{CD(m);const c=byId('customers',S.p.id);if(!c)return;const o=custStats()[c.id]||{};const card=m.querySelector('.card');
  if(card){const sub=card.querySelector('.sub');if(sub)sub.innerHTML=[c.phone?`<bdi dir="ltr">${esc(c.phone)}</bdi>`:T_('no phone'),c.area?esc(c.area):'',c.company?'🏢 '+esc(c.company):'',c.email?esc(c.email):'',o.last?T_('last visit')+' '+fmtD(o.last):'',c.notes?'📝 '+esc(c.notes):''].filter(Boolean).join(' · ');}
  const same=phoneKey(c.phone).length>=7?DB.customers.filter(x=>x!==c&&phoneKey(x.phone)===phoneKey(c.phone)):[];
  if(same.length&&card){const w=document.createElement('div');w.className='guess';w.innerHTML=`${T_('Same phone as')} ${same.map(x=>`<b>${esc(x.name||'')}</b>`).join('، ')}. <button class="lnk" id="cmg1">${T_('Merge')} ›</button>`;card.after(w);w.querySelector('#cmg1').onclick=()=>mergeSheet(c,same[0]);}
  if(can.del()||can.settings()){const b=document.createElement('button');b.className='btn ghost sm';b.textContent='🔗 '+T_('Merge with another customer');b.onclick=()=>mergeSheet(c);m.appendChild(b);}};})();
/* pick a customer (search) */
function pickCust(title,except,cb,allowNew){openSheet(`<h3>${title}</h3><input class="field" id="pcq" placeholder="${T_('Name, phone, plate or car…')}" autocomplete="off"><div class="list" id="pcl"></div>${allowNew?`<details class="pmore"><summary>＋ ${T_('New customer')}</summary><div class="in2"><input class="field" id="pcp" inputmode="tel" placeholder="${T_('Phone')}"><input class="field" id="pcn" placeholder="${T_('Name')}"></div><button class="btn" id="pcnew">${T_('Save')}</button></details>`:''}`,el=>{
  const st=custStats();const q=el.querySelector('#pcq'),box=el.querySelector('#pcl');
  const draw=()=>{const t=normQ(q.value);if(t.length<2){box.innerHTML='';return;}const L=DB.customers.filter(c=>c.id!==except&&normQ([c.name,c.phone,...((st[c.id]||{}).cars||[]).map(v=>(v.plate||'')+' '+carName(v))].join(' ')).includes(t)).slice(0,10);
    box.innerHTML=L.map(c=>`<button class="row" data-pc="${c.id}"><div><b>${esc(c.name||'')}</b><span>${c.phone?`<bdi dir="ltr">${esc(c.phone)}</bdi>`:''}${(st[c.id]||{}).cars&&st[c.id].cars.length?' · '+st[c.id].cars.map(v=>esc(carName(v))).join(', '):''}</span></div><span class="v">›</span></button>`).join('')||`<p class="hint">${T_('Nothing found')}</p>`;
    box.querySelectorAll('[data-pc]').forEach(b=>b.onclick=()=>{closeSheet();cb(byId('customers',b.dataset.pc));});};q.oninput=draw;setTimeout(()=>q.focus(),80);
  const nw=el.querySelector('#pcnew');if(nw)nw.onclick=()=>{const nm=el.querySelector('#pcn').value.trim(),ph=el.querySelector('#pcp').value.replace(/[^\d+]/g,'');if(!nm&&!ph){toast(T_('Type a phone or name'));return;}const ex=ph&&custByPhone(ph);const c=ex||{id:uid('c'),name:nm||'Walk-in',phone:ph,t:now()};if(!ex)DB.customers.push(c);closeSheet();cb(c);};});}
/* move a car to another customer (sold the car, or it was under the wrong name). Old visits stay with the old owner. */
function moveCar(v){const from=byId('customers',v.cust)||{};pickCust('🔁 '+T_('Move')+' '+esc(carName(v))+(v.plate?' '+esc(v.plate):'')+' '+T_('to…'),v.cust,to=>{
  confirmSheet(`${T_('Move')} <b>${esc(carName(v))}</b> ${T_('from')} <b>${esc(from.name||'')}</b> ${T_('to')} <b>${esc(to.name||'')}</b>?<br><small class="hint">${T_('Old visits stay in the old customer’s history. New visits and reminders go to the new one.')}</small>`,T_('Move'),()=>{
    v.cust=to.id;(DB.reminders||[]).filter(r=>r.veh===v.id&&!r.sent).forEach(r=>r.cust=to.id);DB.jobs.filter(j=>j.veh===v.id&&!isInvoiced(j)).forEach(j=>j.cust=to.id);
    audit('customer','Car '+carName(v)+' '+(v.plate||'')+' moved from '+(from.name||'')+' to '+(to.name||''));CSTAT=null;save();toast(T_('Moved'));go('custd',{id:to.id});});},true);}
(function(){const VS=vehSheet;window.vehSheet=vehSheet=function(cust,v,dr){VS(cust,v,dr);if(!v||!v.id)return;const el=$('#sheet');const ok=el&&el.querySelector('#vok');if(!ok)return;
  const b=document.createElement('button');b.className='btn ghost';b.innerHTML='🔁 '+T_('Move this car to another customer');b.onclick=()=>{closeSheet();moveCar(v);};ok.after(b);};})();
/* merge two records of the same person: cars, visits and reminders go to the one you keep */
function mergeSheet(c,other){const go2=o=>confirmSheet(`${T_('Merge')} <b>${esc(c.name||'')}</b> ${T_('into')} <b>${esc(o.name||'')}</b>?<br><small class="hint">${T_('Cars, visits and reminders of the first go to the second, and the first is removed. This cannot be undone.')}</small>`,T_('Merge'),()=>{
    DB.vehicles.filter(v=>v.cust===c.id).forEach(v=>v.cust=o.id);DB.jobs.filter(j=>j.cust===c.id).forEach(j=>j.cust=o.id);(DB.reminders||[]).filter(r=>r.cust===c.id).forEach(r=>r.cust=o.id);
    if(!o.phone&&c.phone)o.phone=c.phone;['area','email','company'].forEach(k=>{if(!o[k]&&c[k])o[k]=c[k];});if(c.notes)o.notes=[o.notes,c.notes].filter(Boolean).join(' · ');
    DB.customers=DB.customers.filter(x=>x!==c);audit('customer','Merged '+(c.name||'')+' into '+(o.name||''));CSTAT=null;save();toast(T_('Merged'));go('custd',{id:o.id});});
  if(other)go2(other);else pickCust('🔗 '+T_('Merge')+' '+esc(c.name||'')+' '+T_('into…'),c.id,go2,false);}
