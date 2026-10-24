/* ---------- COUNTER: the car in front of you is the centre.
   Type the plate (or phone, or name) → the car's card: last visit, what it usually needs, today's price →
   one tap opens the job with it → "Invoice & pay" at the bottom takes the money and closes the job. ---------- */
function newJobFor(v,km){const j={id:uid('j'),no:DB.ws.nextJob++,dev:(typeof syncDev==='function'?syncDev():''),cust:v.cust,veh:v.id,km:num(km)||v.km||0,stage:'new',items:[],disc:0,t:now(),by:S.user.name,log:[[now(),'Job opened · '+S.user.name]],pays:[]};
  if(num(km)>(+v.km||0))v.km=num(km);DB.jobs.push(j);return j;}
const openJobOf=v=>DB.jobs.filter(j=>j.veh===v.id&&!isInvoiced(j)&&j.stage!=='done'&&j.stage!=='estimate').sort((a,b)=>b.t-a.t)[0]||null;
/* a price preview without touching the real jobs */
function ctrPreview(v,fill){const t={id:'_ctr',veh:v.id,cust:v.cust,items:[],log:[],pays:[],disc:0};try{fill(t);}catch(e){return null;}return (t.items||[]).length?t:null;}
function ctrFind(q){const n=lc(q).replace(/\s/g,'');if(n.length<2)return [];const dig=q.replace(/\D/g,'');
  const cs=new Set(DB.customers.filter(c=>lc(c.name).includes(lc(q).trim())||(dig.length>=4&&phoneKey(c.phone).includes(dig))).map(c=>c.id));
  const last={};DB.jobs.forEach(j=>{if(!last[j.veh]||last[j.veh]<j.t)last[j.veh]=j.t;});
  return DB.vehicles.filter(v=>lc(v.plate).replace(/\s/g,'').includes(n)||lc(v.vin).includes(n)||cs.has(v.cust)||lc(carName(v)).replace(/\s/g,'').includes(n)).sort((a,b)=>(last[b.id]||0)-(last[a.id]||0)).slice(0,12).map(v=>({v,last:last[v.id]}));}
SCREENS.counter=m=>{const C=S.ctr||(S.ctr={q:'',vid:null,km:''});if(S.p&&S.p.vid&&S.p.vid!==C.vid){C.vid=S.p.vid;C.km='';}
  const v=C.vid&&byId('vehicles',C.vid);
  if(!v){C.vid=null;
    m.innerHTML=head('Counter')+`<input class="field ctrq" id="cq" placeholder="${T_('Plate, phone or name…')}" value="${esc(C.q)}" autocomplete="off" autocorrect="off" spellcheck="false"><div id="cres"></div>
     <button class="btn ghost" id="cnew">＋ ${T_('New customer or car')}</button>`;
    const inp=$('#cq');const draw=()=>{C.q=inp.value;const R=ctrFind(inp.value);const box=$('#cres');
      box.innerHTML=R.length?`<div class="list">${R.map(({v,last})=>{const c=byId('customers',v.cust)||{};return `<button class="row" data-cv="${v.id}"><div><b>${esc(carName(v)||T_('Car'))} ${v.plate?`<span class="pl"><bdi>${esc(v.plate)}</bdi></span>`:''}</b><span>${esc(c.name||'')}${c.phone?' · <bdi dir="ltr">'+esc(c.phone)+'</bdi>':''}${last?' · '+T_('last visit')+' '+fmtDs(last):''}</span></div><span class="v">›</span></button>`;}).join('')}</div>`:(inp.value.trim().length>=2?`<p class="hint">${T_('Not found. Tap “New customer or car”.')}</p>`:'');
      box.querySelectorAll('[data-cv]').forEach(b=>b.onclick=()=>{C.vid=b.dataset.cv;C.km='';render();});};
    inp.oninput=draw;draw();setTimeout(()=>inp.focus(),60);
    $('#cnew').onclick=()=>{const q=inp.value.trim(),dig=q.replace(/\D/g,'');const isPh=dig.length>=7&&dig.length===q.replace(/[\s+]/g,'').length;
      go('newjob',{n:{phone:isPh?q:'',name:'',plate:isPh?'':q.toUpperCase(),make:'',model:'',year:'',km:'',vin:'',engine:'',est:false,custId:null,vehId:null}});};
    return;}
  const c=byId('customers',v.cust)||{};const oj=openJobOf(v);const lv=DB.jobs.filter(j=>j.veh===v.id&&(j.items||[]).length).sort((a,b)=>b.t-a.t)[0];
  const rep=lv&&ctrPreview(v,t=>repeatVisit(t,lv));const oil=!isEV(v)&&ctrPreview(v,t=>applyOilRecipe(t,(DB.ws.rxMode)||'usual'));
  const oilR=oil&&oilRecipe(v,(DB.ws.rxMode)||'usual');const guess=oilR&&oilR.qsrc&&oilR.qsrc.guess;
  const sum=t=>t.items.map(i=>i.d.replace(/\s+F\/S.*$/i,'').slice(0,34)).join(' + ');
  m.innerHTML=head('Counter',`<button class="lnk" id="cchg">${T_('Change')}</button>`)+`
   <div class="card ctrcar"><div class="h"><b>${esc(carName(v)||T_('Car'))}</b>${v.plate?`<span class="pl"><bdi>${esc(v.plate)}</bdi></span>`:''}</div>
    <span class="sub">${v.engine?'⚙️ '+esc(effEng(v)||v.engine)+' · ':''}${esc(isWalk(c)?T_('Walk-in'):c.name||'')}${c.phone?' · <bdi dir="ltr">'+esc(c.phone)+'</bdi>':''}${v.km?' · '+T_('last km')+' <bdi>'+kmf(v.km)+'</bdi>':''}</span>
    <label class="field-l">${T_('Km now (optional)')}<input class="field" id="ckm" inputmode="numeric" value="${esc(C.km)}" placeholder="${v.km?kmf(v.km):''}"></label></div>
   ${debtNote(v.cust)}
   ${oj?`<button class="ctra main" id="coj"><span class="ic">🔧</span><div><b>${T_('Open job')} #${oj.no}</b><small>${(oj.items||[]).length} ${T_('items')} · ${f3(jobTotals(oj).total)}</small></div><em>›</em></button>`:''}
   ${rep?`<button class="ctra${oj?'':' main'}" id="crep"><span class="ic">🔁</span><div><b>${T_('Same as last visit')}</b><small>${fmtDs(lv.t)} · ${esc(sum(rep))}</small></div><em>${f3(jobTotals(rep).total)}</em></button>`:''}
   ${oil?`<button class="ctra${oj||rep?'':' main'}" id="coil"><span class="ic">🛢</span><div><b>${T_('Oil change')}</b><small>${esc(sum(oil))}</small>${guess?`<small class="gw">⚠️ ${T_('Litres are a guess, check them')}</small>`:''}</div><em>${f3(jobTotals(oil).total)}</em></button>`:''}
   <div class="two"><button class="btn ghost" id="cadd">＋ ${T_('Other work')}</button><button class="btn ghost" id="cqp">💬 ${T_('Other brands')}</button></div>
   <div class="two"><button class="btn ghost" data-go="custd:${v.cust}">📋 ${T_('History')}</button>${c.phone?`<button class="btn ghost" id="cwa">WhatsApp</button>`:'<span></span>'}</div>`;
  $('#cchg').onclick=()=>{C.vid=null;C.q='';render();};
  const km=$('#ckm');km.oninput=()=>{C.km=km.value;};
  const start=fill=>{const j=newJobFor(v,C.km);if(fill)fill(j);save();C.km='';go('job',{id:j.id});};
  const o1=$('#coj');if(o1)o1.onclick=()=>go('job',{id:oj.id});
  const r1=$('#crep');if(r1)r1.onclick=()=>start(j=>{repeatVisit(j,lv);});
  const o2=$('#coil');if(o2)o2.onclick=()=>start(j=>{applyOilRecipe(j,(DB.ws.rxMode)||'usual');});
  $('#cadd').onclick=()=>start(j=>{setTimeout(()=>addItemSheet(j),120);});
  $('#cqp').onclick=()=>{S.quote={vid:v.id,car:null,kind:'oil',vf:'auto',cv:false,q:''};go('quote');};
  const wa=$('#cwa');if(wa)wa.onclick=()=>shareText(c.phone,'');};

/* the job card: total + "Invoice & pay" always at the bottom, by the thumb */
function payNow(j){const T=jobTotals(j);if(!(j.items||[]).length){toast('Add services or parts first');return;}if((j.items||[]).some(i=>i.pend)){toast('Some items have no price yet');return;}
  openSheet(`<h3>🧾 ${T_('Invoice')} · ${f3(T.total)} ${esc(DB.ws.currency)}</h3><p class="hint">${T_('How is the customer paying? The invoice is made, stock is taken out and the job is closed.')}</p>
   <div class="paym">${DB.ws.pay.map(p=>`<button class="btn${isCreditM(p)?' ghost':''}" data-pm="${esc(p)}">${esc(T_(p))}</button>`).join('')}</div>
   <button class="btn ghost" id="pmlater">${T_('Invoice only, payment later')}</button>`,el=>{
    el.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>{const mth=b.dataset.pm;issueInvoice(j);const T2=jobTotals(j);
      if(isCreditM(mth)){j.credit=now();logJ(j,'On credit (to pay later) · due '+f3(T2.due));audit('pay','On credit · invoice #'+j.inv.no+' · '+f3(T2.due));}
      else if(T2.due>0){j.pays.push({m:mth,amt:T2.due,t:now(),by:S.user.name});audit('pay','Payment '+f3(T2.due)+' '+mth+' · invoice #'+j.inv.no);logJ(j,'Paid '+f3(T2.due)+' · '+mth);}
      closeJob(j);save();closeSheet();go('inv',{id:j.id});toast(T_('Done ✓'));});
    el.querySelector('#pmlater').onclick=()=>{issueInvoice(j);save();closeSheet();go('inv',{id:j.id});};});}
(function(){const J=SCREENS.job;SCREENS.job=m=>{J(m);const j=byId('jobs',S.p&&S.p.id);if(!j||isInvoiced(j)||!can.invoice()||!(j.items||[]).length)return;const T=jobTotals(j);
  const tot=m.querySelector('.jb-r.tot');const bar=document.createElement('div');bar.className='paybar';
  bar.innerHTML=`<div><small>${T_('Total')}</small><b>${f3(T.total)} <span>${esc(DB.ws.currency)}</span></b></div><button class="btn okb" id="jpay">💵 ${T_('Invoice & pay')}</button>`;
  const list=tot&&tot.closest('.jb-list');(list||m).after(bar);bar.querySelector('#jpay').onclick=()=>payNow(j);
  /* the old "Make invoice" button stays for "invoice now, payment later", but quieter */
  const iv=m.querySelector('#jinv');if(iv)iv.classList.add('quiet');
  /* "Start work" is for the workers' board: still there, but the money button is the big one */
  const nx=m.querySelector('#jnext');if(nx&&j.stage==='new'){nx.classList.remove('okb');nx.classList.add('ghost','sm');}};})();

/* customer page: tap a car = its counter card; Edit stays as a link */
(function(){const CD=SCREENS.custd;SCREENS.custd=m=>{CD(m);m.querySelectorAll('[data-ve]').forEach(b=>{const id=b.dataset.ve;const v=b.querySelector('.v');if(v)v.outerHTML=`<span class="v"><i class="lnk" data-vedit="${id}">${T_('Edit')}</i> <i class="ctrgo">${T_('Car in')} ›</i></span>`;
    b.onclick=e=>{if(e.target.closest('[data-vedit]')){const c=byId('customers',S.p.id);vehSheet(c,byId('vehicles',id));return;}go('counter',{vid:id});};});};})();
