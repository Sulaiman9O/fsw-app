/* ---------- JOB CARD: tidy lines + the reminders this visit will leave ----------
   1) lines are shown by service: each service with the parts that go with it under it; parts with no service at the end.
   2) "Reminders" on the job shows, before the invoice, which reminders the visit will make (oil, gearbox, any service
      that has a reminder set, or one typed by hand). Each can be changed or switched off; they are made when the job closes. */
const REM_PART={'Engine oil':/oil change|engine oil|زيت المحرك/i,'Oil filters':/oil change|engine oil|زيت المحرك/i,'Gearbox oil':/atf|transmission|gear|cvt|جير|ناقل/i,'Brake fluid':/brake fluid|زيت الفرامل/i,'Coolant':/coolant|radiator|رديتر|تبريد/i,'Bulbs':/bulb|light|لمب/i,'Additives':/flush|clean|تنظيف/i};
function jobGroups(j){const it=j.items||[];const inPk=i=>i.k==='pkg'||i.inPkg||i.pkgx;const svcIdx=it.map((x,i)=>i).filter(i=>!inPk(it[i])&&it[i].k!=='part');
  const owner={};it.forEach((x,i)=>{if(inPk(x)||x.k!=='part')return;const p=partOfItem(x);const re=p&&REM_PART[p.cat];if(!re)return;const s=svcIdx.find(k=>re.test((it[k].d||'')+' '+(it[k].ar||''))||(p.cat==='Engine oil'||p.cat==='Oil filters')&&isOilSvc(it[k]));if(s!=null)owner[i]=s;});
  const order=[];it.forEach((x,i)=>{if(inPk(x))order.push({i,pk:1});});
  svcIdx.forEach(s=>{order.push({i:s,svc:1});it.forEach((x,i)=>{if(owner[i]===s)order.push({i,sub:1});});});
  const rest=it.map((x,i)=>i).filter(i=>!inPk(it[i])&&it[i].k==='part'&&owner[i]==null);rest.forEach((i,n)=>order.push({i,rest:1,first:n===0}));
  return {order,hasSvc:svcIdx.length>0};}
/* what reminders this job will leave */
function planRems(j){if(j.rems)return j.rems;const out=[];const add=r=>{if(!out.some(x=>x.kind===r.kind&&x.name===r.name))out.push(r);};
  (j.items||[]).forEach(it=>{if(it.k==='part'||it.k==='pkg')return;const s=svcOfItem(it)||{};const tag=it.tag||s.tag||'';
    if(tag==='oil'||isOilSvc(it))add({kind:'oil',name:'',mo:+DB.ws.remMonths||6,km:+it.nextKm||+DB.ws.remKm||7000});
    else if(tag==='gear')add({kind:'gear',name:'',mo:36,km:70000});
    else if(s.rem&&(s.rem.mo||s.rem.km))add({kind:'other',name:s.ar||s.name,mo:+s.rem.mo||0,km:+s.rem.km||0});});
  return out;}
const remName=r=>r.kind==='oil'?T_('Engine oil change'):r.kind==='gear'?T_('Gearbox oil'):r.name;
function remWhen(j,r){const base=j.inv?j.inv.t:now();const d=new Date(base);if(r.mo)d.setMonth(d.getMonth()+r.mo);return {due:r.date||(r.mo?d.getTime():0),km:r.km&&j.km?j.km+r.km:0};}
/* closing the job makes them (replaces the old oil/gearbox-only rule) */
makeReminders=window.makeReminders=function(j){const v=vehOf(j);if(!v)return;planRems(j).filter(r=>r.on!==false).forEach(r=>{const w=remWhen(j,r);if(!w.due&&!w.km)return;
  DB.reminders=DB.reminders.filter(x=>!(x.veh===v.id&&x.kind===r.kind&&(r.kind!=='other'||x.name===r.name)&&!x.sent));
  DB.reminders.push({id:uid('r'),veh:v.id,cust:j.cust,kind:r.kind,name:r.kind==='other'?r.name:undefined,due:w.due||now()+365*864e5,dueKm:w.km,job:j.id,sent:0});});};
/* the invoice's "next service": what was made, else what will be made */
invNext=window.invNext=function(j){const r=(DB.reminders||[]).filter(x=>x.job===j.id).sort((a,b)=>(a.kind==='oil'?0:1)-(b.kind==='oil'?0:1)||a.due-b.due)[0];if(r)return r;
  const p=planRems(j).filter(x=>x.on!==false)[0];if(!p)return null;const w=remWhen(j,p);return {due:w.due,dueKm:w.km,kind:p.kind,name:p.name};};
function remSheet(j,k){const L=j.rems=JSON.parse(JSON.stringify(planRems(j)));const isNew=k==null;const r=isNew?{kind:'other',name:'',mo:6,km:0}:L[k];
  openSheet(`<h3>⏰ ${isNew?T_('New reminder'):esc(remName(r))}</h3>
   ${r.kind==='other'?`<label class="field-l">${T_('What to remind about')}<input class="field" id="rmn" value="${esc(r.name||'')}" placeholder="${T_('e.g. brake check, tyre rotation…')}"></label>`:''}
   <div class="in2"><label class="field-l">${T_('After (months)')}<input class="field" id="rmo" inputmode="numeric" value="${r.mo||''}"></label><label class="field-l">${T_('or after (km)')}<input class="field" id="rkm" inputmode="numeric" value="${r.km||''}"></label></div>
   <div class="chips">${[[1,'1 month'],[3,'3 months'],[6,'6 months'],[12,'1 year']].map(([m,t])=>`<button data-rq="${m}">${T_(t)}</button>`).join('')}</div>
   <button class="btn" id="rmok">${T_('Save')}</button>${isNew?'':`<button class="btn ghost" id="rmoff">${r.on===false?T_('Turn on'):T_('Do not remind')}</button>`}`,el=>{
    el.querySelectorAll('[data-rq]').forEach(b=>b.onclick=()=>{el.querySelector('#rmo').value=b.dataset.rq;});
    el.querySelector('#rmok').onclick=()=>{const n=el.querySelector('#rmn');if(n&&!n.value.trim()){toast(T_('Type what to remind about'));return;}
      Object.assign(r,{name:n?n.value.trim():r.name,mo:num(el.querySelector('#rmo').value)||0,km:num(el.querySelector('#rkm').value)||0,on:true});if(!r.mo&&!r.km){toast(T_('Type months or km'));return;}
      if(isNew){r.manual=1;L.push(r);}logJ(j,'Reminder: '+remName(r));if(j.stage==='done')makeReminders(j);save();closeSheet();render();};
    const off=el.querySelector('#rmoff');if(off)off.onclick=()=>{r.on=r.on===false;if(j.stage==='done'){DB.reminders=DB.reminders.filter(x=>!(x.job===j.id&&x.kind===r.kind&&(r.kind!=='other'||x.name===r.name)));if(r.on!==false)makeReminders(j);}save();closeSheet();render();};});}
(function(){const J=SCREENS.job;SCREENS.job=m=>{J(m);const j=byId('jobs',S.p&&S.p.id);if(!j)return;
  /* 1) group the lines */
  const list=m.querySelector('.jb-list');if(list&&!(S.selJ&&S.selJ.id===j.id)){const rows={};list.querySelectorAll('.jb-r.it[data-it]').forEach(r=>rows[r.dataset.it]=r);const first=list.querySelector('.jb-r.it[data-it]');
    if(first){const G=jobGroups(j);const anchor=document.createComment('items');first.before(anchor);let at=anchor;
      G.order.forEach(o=>{const r=rows[o.i];if(!r)return;if(o.rest&&o.first&&G.hasSvc){const h=document.createElement('div');h.className='jb-gh';h.textContent=T_('Other parts');at.after(h);at=h;}
        r.classList.toggle('jb-svc',!!o.svc);r.classList.toggle('jb-sub',!!o.sub);at.after(r);at=r;});}}
  /* 2) the reminders this visit leaves */
  const L=planRems(j);const card=document.createElement('div');card.className='jrem';
  card.innerHTML=`${sec('⏰ '+T_('Reminders for the customer'),j.stage==='done'?T_('made'):T_('made when the job closes'))}<div class="list">${L.map((r,k)=>{const w=remWhen(j,r);return `<button class="row${r.on===false?' off':''}" data-rm="${k}"><div><b>${esc(remName(r))}${r.on===false?' · '+T_('off'):''}</b><span>${[r.km?`<bdi>${kmf(r.km)} km</bdi>${w.km?` (<bdi>${kmf(w.km)}</bdi>)`:''}`:'',w.due?`<bdi>${fmtD(w.due)}</bdi>`:''].filter(Boolean).join(' '+T_('or')+' ')}</span></div><span class="v">${T_('Edit')} ›</span></button>`;}).join('')||`<p class="hint">${T_('No reminder yet. Services with a reminder add one by themselves.')}</p>`}</div><button class="btn ghost sm" id="jrmadd">＋ ${T_('Add a reminder')}</button>`;
  const ins=m.querySelector('#jinsp');const after=ins?(ins.closest('.row')||ins):m.querySelector('.jb-list');(after||m.lastChild).after(card);
  card.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>remSheet(j,+b.dataset.rm));card.querySelector('#jrmadd').onclick=()=>remSheet(j,null);};})();
