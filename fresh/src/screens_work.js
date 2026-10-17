/* ---------- HOME ---------- */
const SCREENS={};
function carRow(j){const v=vehOf(j),c=custOf(j),T=jobTotals(j),[sl,sc]=STAGE[j.stage];
  const right=j.stage==='ready'&&T.due>0?`not paid · ${f3(T.due)}`:j.stage==='work'&&j.eta?`ready ~${hm(j.eta)}`:j.stage==='done'?f3(T.total):ago(j.t);
  return `<button class="car" data-go="job:${j.id}" style="--sc:${sc}"><div class="no">#${j.no}</div><div class="tx"><b>${esc(carName(v)||'Car')}${v.plate?` <span class="pl">${esc(v.plate)}</span>`:''}</b><span>${esc(c.name||'Walk-in')}${(j.items||[]).length?' · '+esc(j.items.slice(0,2).map(i=>i.d).join(' + ')):''}</span></div><div class="st">${sl.toUpperCase()}<small>${right}</small></div></button>`;}
SCREENS.home=m=>{
  const open=openJobs(),[pd,pt]=stepsProgress(),due=dueInvoices().reduce((a,j)=>a+jobTotals(j).due,0),low=lowParts().length,rem=remindersDue().length;
  const todayInv=DB.jobs.filter(j=>isInvoiced(j)&&dayKey(j.inv.t)===today());const est=DB.jobs.filter(j=>j.stage==='estimate');
  m.innerHTML=demoBanner()+`
  <button class="srch" data-go="search"><svg><use href="#i-list"/></svg><b>Plate, phone or name…</b></button>
  <button class="bigbtn" data-go="newjob"><div><b>New car in</b><span>Customer → car → services → invoice</span></div><span class="plus">＋</span></button>
  ${pd<pt?`<button class="setupbar" data-go="setup"><div><b>Setup · ${pd}/${pt} steps</b><span>Finish setting up your workshop</span></div><div class="ring" style="--p:${Math.round(pd/pt*100)}">${Math.round(pd/pt*100)}%</div></button>`:''}
  ${sec(`In the workshop now · ${open.length}`,open.length?'<a data-go="work">All ›</a>':'')}
  ${open.length?`<div class="list">${open.slice(0,4).map(carRow).join('')}</div>`:empty('🚗','No cars in the workshop. Tap <b>New car in</b> when one arrives.')}
  <div class="kpis3">${can.money()?`<button class="kpi org" data-go="money"><b>${f3(due)}</b><span>Due · ${DB.ws.currency}</span></button>`:''}<button class="kpi ${low?'red':''}" data-go="stock"><b>${low}</b><span>To order</span></button><button class="kpi" data-go="cust"><b>${rem}</b><span>Reminders</span></button></div>
  <div class="grp">
   <button class="g" data-go="work" style="--tc:color-mix(in srgb,var(--red) 20%,var(--panel));--glow:color-mix(in srgb,var(--red) 28%,transparent)"><span class="ic">🔧</span><b>Work</b><div class="sub"><span><i>${open.length}</i> in workshop</span><span><i>${est.length}</i> estimates open</span><span><i>${todayInv.length}</i> invoices today</span></div></button>
   <button class="g" data-go="cust" style="--tc:color-mix(in srgb,var(--v530) 20%,var(--panel));--glow:color-mix(in srgb,var(--v530) 30%,transparent)"><span class="ic">🚗</span><b>Customers</b><div class="sub"><span><i>${rem}</i> reminders due</span><span><i>${DB.customers.length}</i> customers</span><span><i>${DB.vehicles.length}</i> cars</span></div></button>
   <button class="g" data-go="stock" style="--tc:color-mix(in srgb,var(--orange) 20%,var(--panel));--glow:color-mix(in srgb,var(--orange) 28%,transparent)">${low?`<span class="n">${low}</span>`:''}<span class="ic">🛢</span><b>Stock</b><div class="sub"><span><i>${DB.parts.length}</i> parts</span><span><i>${low}</i> to order</span><span><i>${countToday().length}</i> to count today</span></div></button>
   ${can.money()?`<button class="g" data-go="money" style="--tc:color-mix(in srgb,var(--ok) 18%,var(--panel));--glow:color-mix(in srgb,var(--ok) 26%,transparent)"><span class="ic">💰</span><b>Money</b><div class="sub"><span><i>${f3(due)}</i> due</span><span><i>${f3(todayInv.reduce((a,j)=>a+jobTotals(j).total,0))}</i> today</span><span><i>${DB.expenses.length}</i> expenses</span></div></button>`:`<button class="g" data-go="count" style="--tc:color-mix(in srgb,var(--ok) 18%,var(--panel));--glow:color-mix(in srgb,var(--ok) 26%,transparent)"><span class="ic">📦</span><b>Count</b><div class="sub"><span><i>${countToday().length}</i> to count today</span></div></button>`}
  </div>
  <button class="morerow" data-go="more"><span>⋯</span><b>More</b><span>Services · Suppliers · Inspections · Reports · Settings</span></button>`;
  const dx=$('#demox');if(dx)dx.onclick=()=>confirmSheet('Remove all test data (everything with 🧪)? Your real data stays.','Remove test data',removeDemo);
};
/* ---------- SEARCH ---------- */
SCREENS.search=m=>{
  m.innerHTML=head('Search')+`<input class="field" id="sq" placeholder="Plate, phone, name, VIN or job #" value="${esc(S.q)}" autocomplete="off"><div id="sres"></div>`;
  const inp=$('#sq');const run=()=>{const q=inp.value.trim().toLowerCase();S.q=inp.value;const box=$('#sres');if(!q){box.innerHTML='';return;}
    const vs=DB.vehicles.filter(v=>[v.plate,v.vin,carName(v)].some(x=>(x||'').toLowerCase().includes(q)));
    const cs=DB.customers.filter(c=>[c.name,c.phone].some(x=>(x||'').toLowerCase().includes(q)));
    const js=DB.jobs.filter(j=>String(j.no)===q.replace('#','')||(j.inv&&String(j.inv.no)===q.replace('#','')));
    box.innerHTML=(js.length?sec('Jobs')+`<div class="list">${js.map(carRow).join('')}</div>`:'')+(cs.length?sec('Customers')+`<div class="list">${cs.map(custRow).join('')}</div>`:'')+(vs.length?sec('Cars')+`<div class="list">${vs.map(v=>{const c=byId('customers',v.cust)||{};return `<button class="row" data-go="custd:${v.cust}"><div><b>${esc(carName(v))} ${v.plate?`<span class="pl">${esc(v.plate)}</span>`:''}</b><span>${esc(c.name||'')}${v.km?' · '+kmf(v.km)+' km':''}</span></div><span class="v">›</span></button>`;}).join('')}</div>`:'')||empty('🔍','Nothing found.');
    box.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const [r,id]=b.dataset.go.split(':');go(r,{id});});};
  inp.oninput=run;run();setTimeout(()=>inp.focus(),50);
};
/* ---------- WORK ---------- */
SCREENS.work=m=>{
  const f=S.p.f||'open';const cnt=k=>DB.jobs.filter(j=>k==='open'?(j.stage!=='done'&&j.stage!=='estimate'):k==='today'?(j.stage==='done'&&isInvoiced(j)&&dayKey(j.inv.t)===today()):j.stage===k).length;
  let list=DB.jobs.filter(j=>f==='open'?(j.stage!=='done'&&j.stage!=='estimate'):f==='today'?(j.stage==='done'&&isInvoiced(j)&&dayKey(j.inv.t)===today()):f==='all'?true:j.stage===f).sort((a,b)=>b.t-a.t);
  m.innerHTML=head('Work')+`<div class="pipe">${[['new','New'],['work','Working'],['ready','Ready'],['today','Done today']].map(([k,l])=>`<button data-f="${k}" class="${f===k?'on':''}"><b>${cnt(k)}</b><span>${l}</span></button>`).join('')}</div>
  <div class="chips">${[['open','Open'],['estimate','Estimates'],['done','Done'],['all','All']].map(([k,l])=>`<button data-f="${k}" aria-pressed="${f===k}">${l}<span>${cnt(k)}</span></button>`).join('')}</div>
  <button class="btn okb" data-go="newjob">＋ New car in</button>
  ${list.length?`<div class="list">${list.map(carRow).join('')}</div>`:empty('🔧','Nothing here.')}`;
  m.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.p.f=b.dataset.f;render();});
};
/* ---------- NEW JOB (customer → car → job) ---------- */
SCREENS.newjob=m=>{
  const N=S.p.n||(S.p.n={phone:'',name:'',plate:'',make:'',model:'',year:'',km:'',vin:'',engine:'',est:false,custId:null,vehId:null});
  const cust=N.custId&&byId('customers',N.custId);
  const fHtml=()=>{const found=N.phone.length>=4?DB.customers.filter(c=>(c.phone||'').includes(N.phone)).slice(0,4):[];return found.length?`<div class="list">${found.map(c=>`<button class="row" data-pc="${c.id}"><div><b>${esc(c.name)}</b><span>${esc(c.phone)} · known customer</span></div><span class="v">Use ›</span></button>`).join('')}</div>`:'';};
  const vfHtml=()=>{const vfound=N.plate.length>=2?DB.vehicles.filter(v=>(v.plate||'').toLowerCase().includes(N.plate.toLowerCase())).slice(0,4):[];return vfound.length&&!cust?`<div class="list">${vfound.map(v=>{const c=byId('customers',v.cust)||{};return `<button class="row" data-pvf="${v.id}"><div><b>${esc(carName(v))} <span class="pl">${esc(v.plate)}</span></b><span>${esc(c.name||'')} · known car</span></div><span class="v">Use ›</span></button>`;}).join('')}</div>`:'';};const cars=cust?DB.vehicles.filter(v=>v.cust===cust.id):[];
  m.innerHTML=head('New car in')+`
  <div class="steps3"><span class="on">1 Customer</span><span class="${cust?'on':''}">2 Car</span><span>3 Services</span></div>
  ${sec('Customer')}
  ${cust?`<div class="card sel"><div class="h"><b>${esc(cust.name)}</b><button class="lnk" id="nchg">Change</button></div><span class="sub">${esc(cust.phone||'')} · ${cars.length} car${cars.length===1?'':'s'}</span></div>`
  :`<div class="in2"><input class="field" id="nphone" inputmode="tel" placeholder="Phone" value="${esc(N.phone)}"><input class="field" id="nname" placeholder="Name" value="${esc(N.name)}"></div>
   <div id="nfound">${fHtml()}</div>
   <button class="btn ghost sm" id="nwalk">Walk-in (no name)</button>`}
  ${sec('Car')}
  ${cars.length&&!N.vehNew?`<div class="list">${cars.map(v=>`<button class="row${N.vehId===v.id?' selr':''}" data-pv="${v.id}"><div><b>${esc(carName(v))} ${v.plate?`<span class="pl">${esc(v.plate)}</span>`:''}</b><span>${v.km?'last '+kmf(v.km)+' km':''}</span></div><span class="v">${N.vehId===v.id?'✓':'›'}</span></button>`).join('')}<button class="row" id="nvnew"><div><b>＋ Another car</b></div></button></div>`
  :`<div class="in2"><input class="field" id="nplate" placeholder="Plate (12345 A)" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="${esc(N.plate)}" style="text-transform:uppercase"><input class="field" id="nkm" inputmode="numeric" placeholder="Km now" value="${esc(N.km)}"></div>
   <div id="nvfound">${vfHtml()}</div>
   <button class="carpick" id="ncp">${N.make?`<b>${esc([N.make,N.model,N.year].filter(Boolean).join(' '))}</b><span>${N.engine?esc(N.engine):'Tap to choose the engine'}</span>`:'<b>🚗 Choose make, model, year, engine</b><span>Type “toy” for Toyota…</span>'}<em>›</em></button>
   <input type="hidden" id="nmake" value="${esc(N.make)}"><input type="hidden" id="nmodel" value="${esc(N.model)}"><input type="hidden" id="nyear" value="${esc(N.year)}">
   <input class="field" id="nvin" placeholder="VIN (optional)" maxlength="17" value="${esc(N.vin)}" style="text-transform:uppercase">`}
  ${N.vehId?`<input class="field" id="nkm2" inputmode="numeric" placeholder="Km now" value="${esc(N.km)}">`:''}
  <label class="chk"><input type="checkbox" id="nest" ${N.est?'checked':''}> Estimate only (customer has not agreed yet)</label>
  <button class="btn" id="ngo">Open ${N.est?'estimate':'job card'} ›</button>`;
  const keep=()=>{['nphone','nname','nplate','nkm','nmake','nmodel','nyear','nvin','nkm2'].forEach(id=>{const e=$('#'+id);if(e)N[{nphone:'phone',nname:'name',nplate:'plate',nkm:'km',nmake:'make',nmodel:'model',nyear:'year',nvin:'vin',nkm2:'km'}[id]]=e.value;});};
  /* typing only refreshes the suggestions; the box stays, so the keyboard does not jump back to letters */
  const bindSug=()=>{$$('[data-pc]').forEach(b=>b.onclick=()=>{keep();N.custId=b.dataset.pc;const vs=DB.vehicles.filter(v=>v.cust===N.custId);N.vehId=vs.length===1?vs[0].id:null;render();});
    $$('[data-pvf]').forEach(b=>b.onclick=()=>{keep();const v=byId('vehicles',b.dataset.pvf);N.custId=v.cust;N.vehId=v.id;render();});};
  [['nphone','nfound',fHtml],['nplate','nvfound',vfHtml]].forEach(([id,box,fn])=>{const e=$('#'+id);if(e)e.oninput=()=>{keep();const b=$('#'+box);if(b){b.innerHTML=fn();bindSug();}};});
  bindSug();
  $$('[data-pv]').forEach(b=>b.onclick=()=>{keep();N.vehId=b.dataset.pv;render();});
  const ncp=$('#ncp');if(ncp)ncp.onclick=()=>{keep();carPicker(N,r=>{Object.assign(N,r);render();});};
  const nv=$('#nvnew');if(nv)nv.onclick=()=>{keep();N.vehNew=true;N.vehId=null;render();};
  const ch=$('#nchg');if(ch)ch.onclick=()=>{N.custId=null;N.vehId=null;N.vehNew=false;render();};
  const wk=$('#nwalk');if(wk)wk.onclick=()=>{keep();N.name='Walk-in';render();};
  $('#nest').onchange=e=>{keep();N.est=e.target.checked;render();};
  $('#ngo').onclick=()=>{keep();
    let c=cust;if(!c){if(!N.name&&!N.phone){toast('Type a phone or name, or tap Walk-in');return;}c={id:uid('c'),name:N.name||'Walk-in',phone:N.phone.replace(/[^\d+]/g,''),t:now()};DB.customers.push(c);}
    let v=N.vehId&&byId('vehicles',N.vehId);
    if(!v){if(!N.make&&!N.plate){toast('Type the plate or the make');return;}v={id:uid('v'),cust:c.id,make:N.make.trim(),model:N.model.trim(),year:N.year.trim(),plate:N.plate.trim().toUpperCase(),vin:N.vin.trim().toUpperCase(),engine:N.engine||'',km:num(N.km),t:now()};DB.vehicles.push(v);}
    else if(num(N.km))v.km=num(N.km);
    const j={id:uid('j'),no:DB.ws.nextJob++,cust:c.id,veh:v.id,km:num(N.km)||v.km||0,stage:N.est?'estimate':'new',items:[],disc:0,t:now(),by:S.user.name,log:[[now(),(N.est?'Estimate':'Job')+' opened · '+S.user.name]],pays:[]};
    DB.jobs.push(j);save();toast((N.est?'Estimate':'Job')+' #'+j.no+' opened');go('job',{id:j.id});};
};
