/* ---------- INSPECTION (2.19): sections, numbers that set the colour, a note and photos for what is not good,
   each item linked to a service so "Add to the job" is one tap, a report for the customer, yellow items become reminders,
   and last visit's results show next to each item.
   Templates keep `items` (flat names) for older screens; `sec` = [{n,c}] sections by count, `meta` = [{m,svc}] per item. ---------- */
const MEAS={mm:{u:'mm',t:'Pads (mm)',bad:3,warn:5},tread:{u:'mm',t:'Tyre tread (mm)',bad:2,warn:4},pct:{u:'%',t:'Battery health (%)',bad:50,warn:75},psi:{u:'psi',t:'Pressure (psi)'},v:{u:'V',t:'Volts',bad:12,warn:12.4}};
const measStatus=(m,v)=>{const M=MEAS[m];if(!M||v===''||v==null||isNaN(+v)||M.bad==null)return '';v=+v;return v<M.bad?'bad':v<M.warn?'warn':'ok';};
/* service for an item: chosen by the owner, else guessed from the words */
const INSP_LINK=[[/front.*(pad)|pad.*front|فحمات أمام/i,/front brake pad|فحمات أمام/i],[/rear.*(pad)|pad.*rear|فحمات خلف/i,/rear brake pad|فحمات خلف/i],[/rotor|disc|ديسك/i,/rotor|disc/i],[/brake fluid|brake oil|زيت فرامل/i,/brake fluid/i],
  [/engine oil|زيت المحرك/i,/engine oil change/i],[/coolant|radiator|رديتر/i,/coolant/i],[/atf|transmission|gearbox|قير/i,/atf|transmission fluid/i],[/transfer/i,/transfer case/i],[/diff/i,/differential/i],
  [/cabin|a\/?c filter|مكيف/i,/cabin|a\/c filter|ac filter/i],[/air filter|فلتر هواء/i,/air filter/i],[/battery|بطارية/i,/battery/i],[/spark|بواجي/i,/spark plug/i],[/link rod/i,/link rod/i],[/tie rod/i,/tie rod/i],
  [/bush/i,/bush/i],[/shock|مساعد/i,/shock/i],[/ball joint/i,/ball joint/i],[/belt|سير/i,/belt/i],[/wiper|مساحات/i,/wiper/i],[/tyre|tire|إطار/i,/tire|tyre|wheel balanc|rotation/i],[/align/i,/align/i],[/mount/i,/mount/i],[/obd|scan|كمبيوتر/i,/obd|scan|diagnos/i],[/a\/?c|مكيف/i,/a\/c|ac /i]];
function inspGuess(name){for(const [a,b] of INSP_LINK){if(a.test(name)){const s=DB.services.find(x=>!x.hidden&&(b.test(x.name)||b.test(x.ar||'')));if(s)return s.id;}}return '';}
function inspSvc(t,i){const m=(t.meta||[])[i]||{};if(m.svc===null||m.svc==='-')return null;return (m.svc&&byId('services',m.svc))||byId('services',inspGuess(t.items[i]))||null;}
/* "## Section" lines and "Item [mm]" lines ⇄ template */
function inspParse(txt,old){const t={items:[],sec:[],meta:[]};let cur=null;txt.split('\n').map(x=>x.trim()).filter(Boolean).forEach(l=>{if(/^##/.test(l)){cur={n:l.replace(/^#+\s*/,''),c:0};t.sec.push(cur);return;}
  const mm=l.match(/\[(\w+)\]\s*$/);const n=l.replace(/\[(\w+)\]\s*$/,'').trim();if(!n)return;if(!cur){cur={n:'Checks',c:0};t.sec.push(cur);}cur.c++;t.items.push(n);
  const o=old&&old.items?old.items.indexOf(n):-1;const om=o>=0&&old.meta?old.meta[o]||{}:{};t.meta.push({m:mm&&MEAS[mm[1]]?mm[1]:'',svc:om.svc||''});});t.sec=t.sec.filter(s=>s.c);return t;}
const inspText=t=>{const S0=inspSecs(t);return S0.map(s=>'## '+s.n+'\n'+s.idx.map(i=>t.items[i]+((t.meta||[])[i]&&t.meta[i].m?' ['+t.meta[i].m+']':'')).join('\n')).join('\n');};
function inspSecs(t){const out=[];let k=0;(t.sec&&t.sec.length?t.sec:[{n:'Checks',c:t.items.length}]).forEach(s=>{const idx=[];for(let i=0;i<s.c&&k<t.items.length;i++)idx.push(k++);out.push({n:s.n,idx});});if(k<t.items.length)out.push({n:'Other',idx:t.items.slice(k).map((_,i)=>k+i)});return out;}
/* ready-made templates with sections (added once; the owner can change or delete them) */
const INSP_NEW=[['Oil change check','## Fluids\nEngine oil level & leaks\nCoolant\nBrake fluid\nPower steering fluid\nTransmission fluid (ATF)\nWasher fluid\n## Filters & belts\nAir filter\nCabin (A/C) filter\nDrive belts\nHoses\n## Battery & lights\nBattery [pct]\nExterior lights\nWarning lights / OBD\n## Brakes & suspension\nFront brake pads [mm]\nRear brake pads [mm]\nCV boots\nLink rods\nShock leaks\n## Tyres & wipers\nTyre tread [tread]\nTyre pressure [psi]\nWiper blades'],
 ['Full service inspection','## Engine bay\nEngine mounts\nEngine oil\nCoolant\nRadiator\nBrake fluid\nBattery [pct]\nTransmission fluid (ATF)\nHoses\nDrive belts\nSpark plugs\nAir filter\nCabin (A/C) filter\n## Brakes\nFront brake pads [mm]\nRear brake pads [mm]\nFront rotors\nRear rotors\n## Suspension & steering\nShocks & boots\nBall joints\nTie rod ends\nLink rods\nArm bushings\nSteering boots\nHub bearings\nCV boots & axle seals\n## 4WD only\nTransfer case oil\nFront differential oil\nRear differential oil\n## Tyres, A/C & lights\nTyre tread [tread]\nTyre pressure [psi]\nA/C cooling\nLights\nWarning lights / OBD'],
 ['Pre-purchase inspection','## Body & chassis\nAccident / repaint signs\nChassis & underbody\nRadiator support\nDoor, hood & trunk alignment\nRust\n## Engine\nOil level & condition\nOil / water leaks\nEngine noise\nEngine mounts\nExhaust smoke\nCooling system\n## Drivetrain\nGearbox shifting\nTransmission leaks\nCV boots\nDifferential / driveshaft\n## Suspension & steering\nArm bushings\nShocks & springs\nLink rods\nSteering rack & boots\n## Brakes & tyres\nBrake pads [mm]\nTyre tread [tread]\n## Electrical & interior\nOBD scan\nA/C\nWindows & locks\nWarning lights\nRoad test']];
function inspSeed(){if(!DB.ws||DB.ws.inspV>=2)return;DB.insp=DB.insp||[];let k=0;INSP_NEW.forEach(([n,txt])=>{if(DB.insp.some(t=>t.name===n))return;const t=inspParse(txt);t.id=uid('i');t.name=n;DB.insp.splice(k++,0,t);});DB.ws.inspV=2;save();}

/* start an inspection on a job from a template (copy, so later template changes do not change old jobs) */
function inspStart(j,t){const sv=t.items.map((_,i)=>{const s=inspSvc(t,i);return s?s.id:'';});j.insp={tpl:t.id,name:t.name,items:t.items.slice(),sec:inspSecs(t).map(s=>({n:s.n,c:s.idx.length})),meta:t.items.map((_,i)=>({m:((t.meta||[])[i]||{}).m||'',svc:sv[i]})),r:{},d:{},at:now(),by:S.user?S.user.name:''};logJ(j,'Inspection started · '+t.name);}
/* last visit: the same item on this car's previous inspection */
function inspPrev(j){const P=DB.jobs.filter(x=>x!==j&&x.veh===j.veh&&x.insp&&x.insp.r&&(x.t||0)<(j.t||now())).sort((a,b)=>b.t-a.t)[0];if(!P)return {};const o={};P.insp.items.forEach((n,i)=>{const s=P.insp.r[i];if(s)o[n.toLowerCase()]={s,t:P.t,v:P.insp.d&&P.insp.d[i]&&P.insp.d[i].v};});return o;}
const ST_IC={ok:'✓',warn:'!',bad:'✕'};
function inspAdded(j,i){return (j.items||[]).some(x=>x.fromInsp===String(i));}
/* photos: kept on the phone as small pictures (one record each), shared with sync */
function shrinkPhoto(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,720/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.7));};im.onerror=()=>toast(T_('Could not read this picture'));im.src=r.result;};r.readAsDataURL(file);}
const photoOf=id=>(DB.photos||[]).find(x=>x.id===id);

SCREENS.inspj=m=>{const j=byId('jobs',S.p.id);if(!j){go('work');return;}if(!j.insp){go('job',{id:j.id});return;}const I=j.insp;I.d=I.d||{};I.meta=I.meta||I.items.map(()=>({m:'',svc:''}));
  const lock=isInvoiced(j);const prev=inspPrev(j);const secs=inspSecs(I);const done=Object.keys(I.r).length,red=Object.values(I.r).filter(x=>x==='bad').length,yel=Object.values(I.r).filter(x=>x==='warn').length;
  const open=S.p.open;const v=vehOf(j);
  const row=i=>{const s=I.r[i]||'',d=I.d[i]||{},mt=I.meta[i]||{},M=MEAS[mt.m],sv=mt.svc&&byId('services',mt.svc),pv=prev[I.items[i].toLowerCase()];const exp=(s==='warn'||s==='bad'||open===i);
    return `<div class="ii ${s}" id="ii${i}"><div class="ih"><button class="in" data-io="${i}"><b>${esc(I.items[i])}</b>${pv&&pv.s!=='ok'?`<small class="pv ${pv.s}">${T_('Last visit')}: ${pv.s==='bad'?T_('red'):T_('yellow')}${pv.v!=null&&pv.v!==''?' · '+pv.v+(M?' '+M.u:''):''} · ${fmtD(pv.t)}</small>`:''}</button>
     ${M?`<input class="iv" data-iv="${i}" inputmode="decimal" placeholder="${M.u}" value="${d.v??''}" ${lock?'disabled':''}>`:''}
     <div class="isb">${['ok','warn','bad'].map(x=>`<button data-is="${i}:${x}" class="s-${x}${s===x?' on':''}" ${lock?'disabled':''} aria-label="${x}">${ST_IC[x]}</button>`).join('')}</div></div>
     ${exp?`<div class="ix"><input class="field" data-in="${i}" placeholder="${T_('Note (what you saw)')}" value="${esc(d.note||'')}" ${lock?'disabled':''}>
      <div class="iph">${(d.ph||[]).map(id=>{const p=photoOf(id);return p?`<button class="iphi" data-ipv="${id}"><img src="${p.img}" alt=""></button>`:'';}).join('')}${lock?'':`<button class="iphadd" data-ipa="${i}">📷 ${T_('Photo')}</button>`}</div>
      ${s==='warn'?`<div class="chips irem">${[['3m',T_('Remind in 3 months')],['5k',T_('Remind in 5,000 km')]].map(([k,l])=>`<button data-irem="${i}:${k}" aria-pressed="${d.rem===k}">🔔 ${l}</button>`).join('')}</div>`:''}</div>`:''}</div>`;};
  m.innerHTML=head('📋 '+esc(I.name),`<button class="lnk" id="irep">📤 ${T_('Report')}</button>`)+
   `<div class="icar card"><b>${esc(carName(v)||'')}${v&&v.plate?` <span class="pl">${esc(v.plate)}</span>`:''}${lock?'':`<button class="lnk isw" id="isw">🔄 ${T_('Change list')}</button>`}</b><span>${done}/${I.items.length} ${T_('checked')} · <i class="dot bad"></i> ${red} · <i class="dot warn"></i> ${yel}</span><div class="ibar"><i style="width:${Math.round(done/I.items.length*100)}%"></i></div></div>
   ${lock?`<p class="hint">${T_('Invoice made: the inspection can be read, not changed.')}</p>`:''}
   ${secs.map((s,si)=>{const dn=s.idx.filter(i=>I.r[i]).length;return `<div class="isec"><div class="ish"><b data-ish="${si}">${esc(T_(s.n))}</b><span>${dn}/${s.idx.length}</span>${lock?'':`<button class="lnk" data-iall="${s.idx.join(',')}">✓ ${T_('All good')}</button>`}</div>${s.idx.map(row).join('')}${lock?'':`<button class="iadd1" data-iai="${si}">＋ ${T_('Add a check')}</button>`}</div>`;}).join('')}
   ${lock?'':`<button class="iadd1 sec" id="iasec">＋ ${T_('Add a section')}</button>`}
   <button class="btn" id="idone">${T_('Done')}</button>`;
  const setS=(i,x)=>{I.r[i]=I.r[i]===x?undefined:x;if(!I.r[i])delete I.r[i];save();S.p.open=undefined;render();const e=$('#ii'+i);if(e&&I.r[i]!=='ok')e.scrollIntoView({block:'nearest'});};
  $$('[data-is]').forEach(b=>b.onclick=()=>{const [i,x]=b.dataset.is.split(':');setS(+i,x);});
  $$('[data-io]').forEach(b=>b.onclick=()=>{S.p.open=S.p.open===+b.dataset.io?undefined:+b.dataset.io;render();});
  $$('[data-iv]').forEach(b=>b.onchange=()=>{const i=+b.dataset.iv;const d=I.d[i]=I.d[i]||{};const nv=b.value.trim()===''?'':num(b.value);if(nv===d.v)return;d.v=nv;const st=measStatus(I.meta[i].m,d.v);if(st)I.r[i]=st;save();setTimeout(()=>{if(S.r==='inspj')render();},0);});
  $$('[data-in]').forEach(b=>b.onchange=()=>{const d=I.d[+b.dataset.in]=I.d[+b.dataset.in]||{};d.note=b.value.trim();save();});
  $$('[data-iall]').forEach(b=>b.onclick=()=>{b.dataset.iall.split(',').forEach(i=>{if(!I.r[i])I.r[i]='ok';});save();render();});
  $$('[data-ipa]').forEach(b=>b.onclick=()=>{const i=+b.dataset.ipa;const f=document.createElement('input');f.type='file';f.accept='image/*';f.setAttribute('capture','environment');f.onchange=()=>{const x=f.files&&f.files[0];if(!x)return;shrinkPhoto(x,u=>{DB.photos=DB.photos||[];const id=uid('ph');DB.photos.push({id,job:j.id,img:u,t:now()});const d=I.d[i]=I.d[i]||{};(d.ph=d.ph||[]).push(id);save();render();});};f.click();});
  $$('[data-ipv]').forEach(b=>b.onclick=()=>{const p=photoOf(b.dataset.ipv);if(!p)return;openSheet(`<img src="${p.img}" style="width:100%;border-radius:14px">${lock?'':`<button class="btn ghost jb-del" id="iphdel">${T_('Delete photo')}</button>`}`,el=>{const x=el.querySelector('#iphdel');if(x)x.onclick=()=>{Object.values(I.d).forEach(d=>{if(d.ph)d.ph=d.ph.filter(y=>y!==p.id);});DB.photos=DB.photos.filter(y=>y!==p);save();closeSheet();render();};});});
  $$('[data-iadd]').forEach(b=>b.onclick=()=>{const i=+b.dataset.iadd;const s=byId('services',I.meta[i].svc);if(!s)return;const it=svcItem(s,v);it.fromInsp=String(i);it.note=T_('From inspection')+': '+I.items[i];j.items=j.items||[];j.items.push(it);if(j.stage!=='estimate'&&j.stage!=='new'){}logJ(j,'Added from inspection · '+s.name);save();toast(T_('Added to the job')+' · '+s.name);render();});
  $$('[data-irm]').forEach(b=>b.onclick=()=>{const i=b.dataset.irm;j.items=j.items.filter(x=>x.fromInsp!==String(i));save();render();});
  $$('[data-irem]').forEach(b=>b.onclick=()=>{const [i,k]=b.dataset.irem.split(':');const d=I.d[i]=I.d[i]||{};d.rem=d.rem===k?undefined:k;save();render();});
  $('#irep').onclick=()=>go('inspr',{id:j.id});
  if(!lock){$('#isw').onclick=()=>inspSwitchSheet(j);$$('[data-iai]').forEach(b=>b.onclick=()=>inspAddSheet(j,+b.dataset.iai));$('#iasec').onclick=()=>inspAddSheet(j,-1);
    $$('[data-io]').forEach(b=>longPress(b,()=>inspItemSheet(j,+b.dataset.io)));$$('[data-ish]').forEach(b=>longPress(b,()=>inspSecSheet(j,+b.dataset.ish)));}
  $('#idone').onclick=()=>{inspFinish(j);if(lock||!inspQuoteSheet(j))go('job',{id:j.id});};};
/* ---- change the inspection while working: switch list, add checks or a section, rename/remove a check ---- */
/* a check is put in at place pos: the answers after it move one place */
function inspShift(j,pos,by){const I=j.insp;const sh=o=>{const n={};Object.keys(o||{}).forEach(k=>{const x=+k;if(by<0&&x===pos)return;n[x>=pos+(by<0?1:0)?x+by:x]=o[k];});return n;};I.r=sh(I.r);I.d=sh(I.d);
  (j.items||[]).forEach(x=>{if(x.fromInsp==null)return;const f=+x.fromInsp;if(by<0&&f===pos)delete x.fromInsp;else if(f>=pos+(by<0?1:0))x.fromInsp=String(f+by);});}
function inspSecFix(I){if(!I.sec||!I.sec.length)I.sec=inspSecs(I).map(s=>({n:s.n,c:s.idx.length}));return I.sec;}
function inspAddTo(t,secName,names,isJob,j){const sec=inspSecFix(t);t.meta=t.meta||t.items.map(()=>({m:'',svc:''}));let si=sec.findIndex(x=>x.n===secName);if(si<0){sec.push({n:secName,c:0});si=sec.length-1;}
  let pos=sec.slice(0,si+1).reduce((a,x)=>a+x.c,0);names.forEach(n=>{if(isJob)inspShift(j,pos,1);t.items.splice(pos,0,n);t.meta.splice(pos,0,{m:'',svc:isJob?inspGuess(n):''});sec[si].c++;pos++;});}
function inspAddSheet(j,si){const I=j.insp;const secs=inspSecFix(I);const tpl=(DB.insp||[]).find(t=>t.id===I.tpl);const nsec=si<0;
  openSheet(`<h3>${nsec?T_('Add a section'):T_('Add a check')+' · '+esc(T_(secs[si].n))}</h3>${nsec?`<label class="lbl">${T_('Section name')}</label><input class="field" id="ian" placeholder="${T_('e.g. Under the car')}">`:''}
    <label class="lbl">${T_('Checks (one per line)')}</label><textarea class="field" id="iat" rows="4" placeholder="${T_('e.g. Engine mounts')}"></textarea>
    ${tpl&&can.settings()?`<label class="lrow tgl2"><span class="lname"><div><b>${T_('Save in the list for next time')}</b><span>${esc(tpl.name)}</span></div></span><input type="checkbox" id="iasv"></label>`:''}
    <button class="btn" id="iaok">${T_('Add')}</button>`,el=>{setTimeout(()=>{const f=el.querySelector(nsec?'#ian':'#iat');f&&f.focus();},80);
    el.querySelector('#iaok').onclick=()=>{const names=el.querySelector('#iat').value.split('\n').map(x=>x.trim()).filter(Boolean);const sn=nsec?el.querySelector('#ian').value.trim():secs[si].n;
      if(!sn){toast(T_('Write the section name'));return;}if(!names.length){toast(T_('Write at least one check'));return;}
      inspAddTo(I,sn,names,true,j);const sv=el.querySelector('#iasv');if(sv&&sv.checked&&tpl)inspAddTo(tpl,sn,names,false);
      logJ(j,'Inspection: added '+names.join(', '));save();closeSheet();render();toast(T_('Added'));};});}
/* rebuild the inspection from sections of old places (move / reorder): answers, notes, photos and job lines follow their check */
function inspApply(j,L){const I=j.insp;const items=[],meta=[],r={},d={},map={};let k=0;
  L.forEach(x=>x.idx.forEach(o=>{map[o]=k;items.push(I.items[o]);meta.push((I.meta||[])[o]||{m:'',svc:''});if(I.r[o])r[k]=I.r[o];if(I.d&&I.d[o])d[k]=I.d[o];k++;}));
  (j.items||[]).forEach(x=>{if(x.fromInsp==null)return;const n=map[+x.fromInsp];if(n==null)delete x.fromInsp;else x.fromInsp=String(n);});
  I.items=items;I.meta=meta;I.r=r;I.d=d;I.sec=L.filter(x=>x.idx.length).map(x=>({n:x.n,c:x.idx.length}));return map;}
const inspL=I=>inspSecs(I).map(s=>({n:s.n,idx:s.idx.slice()}));
function inspItemSheet(j,i){const I=j.insp;const L=inspL(I);const si=L.findIndex(x=>x.idx.includes(i));const p=L[si].idx.indexOf(i);
  const done=(map,msg)=>{if(msg)logJ(j,msg);save();closeSheet();render();const n=map?map[i]:i;setTimeout(()=>{const e=$('#ii'+n);if(e){e.scrollIntoView({block:'center'});e.classList.add('lp-flash');setTimeout(()=>e.classList.remove('lp-flash'),900);}},60);};
  openSheet(`<h3>${esc(I.items[i])}</h3>
    <div class="two"><button class="btn ghost" id="ieup" ${p===0&&si===0?'disabled':''}>⬆ ${T_('Move up')}</button><button class="btn ghost" id="iedn" ${p===L[si].idx.length-1&&si===L.length-1?'disabled':''}>⬇ ${T_('Move down')}</button></div>
    <label class="lbl">${T_('Move to section')}</label><div class="chips">${L.map((x,k)=>`<button data-mv="${k}" aria-pressed="${k===si}">${esc(T_(x.n))}</button>`).join('')}<button data-mv="new">＋ ${T_('New section')}</button></div>
    <div id="iens" hidden><input class="field" id="iensn" placeholder="${T_('Section name')}"><button class="btn" id="iensok">${T_('Move')}</button></div>
    <label class="lbl">${T_('Name')}</label><input class="field" id="ien" value="${esc(T_(I.items[i]))}"><button class="btn" id="ieok">${T_('Save')}</button>
    <button class="btn ghost jb-del" id="iedel">🗑 ${T_('Remove from this inspection')}</button>`,el=>{
    const moveTo=(k,name)=>{L[si].idx.splice(p,1);if(k==null){L.push({n:name,idx:[i]});}else L[k].idx.push(i);done(inspApply(j,L),'Inspection: moved '+I.items[i]+' → '+(k==null?name:L[k].n));};
    el.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{if(b.dataset.mv==='new'){el.querySelector('#iens').hidden=false;el.querySelector('#iensn').focus();return;}const k=+b.dataset.mv;if(k===si){closeSheet();return;}moveTo(k);});
    el.querySelector('#iensok').onclick=()=>{const n=el.querySelector('#iensn').value.trim();if(!n){toast(T_('Write the section name'));return;}const k=L.findIndex(x=>x.n.toLowerCase()===n.toLowerCase());if(k===si){closeSheet();return;}moveTo(k<0?null:k,n);};
    el.querySelector('#ieup').onclick=()=>{const a=L[si].idx;if(p>0){[a[p-1],a[p]]=[a[p],a[p-1]];}else{a.splice(p,1);L[si-1].idx.push(i);}done(inspApply(j,L));};
    el.querySelector('#iedn').onclick=()=>{const a=L[si].idx;if(p<a.length-1){[a[p+1],a[p]]=[a[p],a[p+1]];}else{a.splice(p,1);L[si+1].idx.unshift(i);}done(inspApply(j,L));};
    el.querySelector('#ieok').onclick=()=>{const n=el.querySelector('#ien').value.trim();if(n&&n!==T_(I.items[i])){I.items[i]=n;save();}closeSheet();render();};
    el.querySelector('#iedel').onclick=()=>{L[si].idx.splice(p,1);const nm=I.items[i];inspApply(j,L);logJ(j,'Inspection: removed '+nm);save();closeSheet();render();};});}
/* hold a section title: rename it, move it up or down, or remove it with its checks */
function inspSecSheet(j,si){const I=j.insp;const L=inspL(I);let sure=0;
  openSheet(`<h3>${esc(T_(L[si].n))}</h3><div class="two"><button class="btn ghost" id="isup" ${si===0?'disabled':''}>⬆ ${T_('Move up')}</button><button class="btn ghost" id="isdn" ${si===L.length-1?'disabled':''}>⬇ ${T_('Move down')}</button></div>
    <label class="lbl">${T_('Section name')}</label><input class="field" id="isn" value="${esc(T_(L[si].n))}"><button class="btn" id="isok">${T_('Save')}</button>
    <button class="btn ghost jb-del" id="isdel">🗑 ${T_('Remove the section and its checks')}</button>`,el=>{
    const sw=d=>{[L[si],L[si+d]]=[L[si+d],L[si]];inspApply(j,L);save();closeSheet();render();};
    el.querySelector('#isup').onclick=()=>sw(-1);el.querySelector('#isdn').onclick=()=>sw(1);
    el.querySelector('#isok').onclick=()=>{const n=el.querySelector('#isn').value.trim();if(n&&n!==T_(L[si].n)){L[si].n=n;inspApply(j,L);save();}closeSheet();render();};
    el.querySelector('#isdel').onclick=e=>{if(!sure){sure=1;e.currentTarget.textContent='⚠ '+T_('Tap again to remove')+' ('+L[si].idx.length+')';return;}const n=L[si].n;L.splice(si,1);inspApply(j,L);logJ(j,'Inspection: removed section '+n);save();closeSheet();render();};});}
/* another list: answers of checks with the same name are kept */
function inspSwitch(j,t){const O=j.insp;const by={};O.items.forEach((n,i)=>{by[n.toLowerCase()]=i;});inspStart(j,t);const N=j.insp;N.at=O.at||N.at;N.by=O.by||N.by;
  const map={};N.items.forEach((n,i)=>{const o=by[n.toLowerCase()];if(o==null)return;map[o]=i;if(O.r[o])N.r[i]=O.r[o];if(O.d&&O.d[o])N.d[i]=O.d[o];});
  (j.items||[]).forEach(x=>{if(x.fromInsp==null)return;const k=map[+x.fromInsp];if(k==null)delete x.fromInsp;else x.fromInsp=String(k);});}
function inspSwitchSheet(j){inspSeed();const I=j.insp;let sure=0;
  openSheet(`<h3>${T_('Change list')}</h3><p class="hint">${T_('Answers of checks that are in the new list stay.')}</p><div class="list">${DB.insp.map(t=>`<button class="row" data-ts="${t.id}"><div><b>${esc(t.name)}${t.id===I.tpl?' ✓':''}</b><span>${inspSecs(t).length} ${T_('sections')} · ${t.items.length} ${T_('items')}</span></div><span class="v">›</span></button>`).join('')}</div>
    <button class="btn ghost jb-del" id="iswdel">🗑 ${T_('Remove the inspection')}</button>`,el=>{
    el.querySelectorAll('[data-ts]').forEach(x=>x.onclick=()=>{const t=DB.insp.find(y=>y.id===x.dataset.ts);if(!t||t.id===I.tpl){closeSheet();return;}inspSwitch(j,t);save();closeSheet();render();toast(T_('List changed')+' · '+t.name);});
    el.querySelector('#iswdel').onclick=e=>{if(!sure){sure=1;e.currentTarget.textContent='⚠ '+T_('Tap again to remove the inspection');return;}
      (j.items||[]).forEach(x=>delete x.fromInsp);logJ(j,'Inspection removed · '+I.name);delete j.insp;save();closeSheet();go('job',{id:j.id});};});}
/* after Done: a suggested quote for the yellow and red checks; untick what you don't want, change the service, then add to the job */
function inspQuoteSheet(j){const I=j.insp,v=vehOf(j);const L=I.items.map((n,i)=>({n,i,s:I.r[i]})).filter(x=>x.s==='bad'||x.s==='warn').sort((a,b)=>(a.s==='bad'?0:1)-(b.s==='bad'?0:1));if(!L.length)return false;
  const SV=DB.services.filter(s=>!s.hidden).sort((a,b)=>String(a.name).localeCompare(String(b.name)));const nm=s=>I18N.lang==='ar'&&s.ar?s.ar:s.name;
  const pick={};L.forEach(x=>{const sv=(I.meta[x.i]||{}).svc||inspGuess(x.n);pick[x.i]={sv,on:!!sv&&!inspAdded(j,x.i)};});
  const tot=()=>L.reduce((a,x)=>{const p=pick[x.i],s=p.on&&byId('services',p.sv);return a+(s?svcPrice(s,v):0);},0);
  openSheet(`<h3>💡 ${T_('Suggested quote')}</h3><p class="hint">${T_('From the yellow and red checks. Untick what you don\'t want or change the service.')}</p><div class="iqs">${L.map(x=>{const p=pick[x.i],done=inspAdded(j,x.i);return `<div class="iqr ${x.s}">
      <label class="iqc"><input type="checkbox" data-qc="${x.i}" ${p.on?'checked':''} ${done?'disabled':''}><span><i class="dot ${x.s}"></i> ${esc(x.n)}${(I.d[x.i]||{}).note?`<small>${esc(I.d[x.i].note)}</small>`:''}</span></label>
      ${done?`<span class="iqd">✓ ${T_('Already in the job')}</span>`:`<div class="iqv"><select class="field" data-qs="${x.i}"><option value="">— ${T_('Choose a service')} —</option>${SV.map(s=>`<option value="${s.id}" ${s.id===p.sv?'selected':''}>${esc(nm(s))}</option>`).join('')}</select><b data-qp="${x.i}"></b></div>`}</div>`;}).join('')}</div>
    <div class="iqt"><span>${T_('Total')}</span><b id="iqtot"></b></div><button class="btn okb" id="iqok"></button><button class="btn ghost" id="iqno">${T_('Not now')}</button>`,el=>{
    const upd=()=>{L.forEach(x=>{const b=el.querySelector('[data-qp="'+x.i+'"]');if(!b)return;const s=byId('services',pick[x.i].sv);b.textContent=s?f3(svcPrice(s,v)):'';});
      const n=L.filter(x=>pick[x.i].on&&pick[x.i].sv&&!inspAdded(j,x.i)).length;el.querySelector('#iqtot').textContent=f3(tot())+' '+DB.ws.currency;const ok=el.querySelector('#iqok');ok.textContent='＋ '+T_('Add {n} to the job'.replace('{n}',n));ok.disabled=!n;};
    el.querySelectorAll('[data-qc]').forEach(c=>c.onchange=()=>{pick[c.dataset.qc].on=c.checked;upd();});
    el.querySelectorAll('[data-qs]').forEach(c=>c.onchange=()=>{const p=pick[c.dataset.qs];p.sv=c.value;p.on=!!c.value;const cb=el.querySelector('[data-qc="'+c.dataset.qs+'"]');if(cb)cb.checked=p.on;upd();});
    el.querySelector('#iqno').onclick=()=>{closeSheet();go('job',{id:j.id});};
    el.querySelector('#iqok').onclick=()=>{let n=0;j.items=j.items||[];L.forEach(x=>{const p=pick[x.i];if(p.sv)I.meta[x.i].svc=p.sv;if(!p.on||!p.sv||inspAdded(j,x.i))return;const s=byId('services',p.sv);if(!s)return;
        const it=svcItem(s,v);it.fromInsp=String(x.i);it.note=T_('From inspection')+': '+x.n;j.items.push(it);n++;});
      if(n)logJ(j,'Added from inspection · '+n);save();closeSheet();toast(T_('Added {n} to the job'.replace('{n}',n)));go('job',{id:j.id});};upd();});return true;}
/* finishing: log the red items, make reminders for the yellow ones the worker asked for */
function inspFinish(j){const I=j.insp;if(!I)return;const red=Object.entries(I.r).filter(([,s])=>s==='bad').map(([i])=>I.items[i]);if(red.length&&!I.logged)logJ(j,'Inspection: red '+red.join(', '));I.logged=1;
  const v=vehOf(j);Object.entries(I.d||{}).forEach(([i,d])=>{if(!d.rem||d.remDone)return;const due=new Date();if(d.rem==='3m')due.setMonth(due.getMonth()+3);else due.setMonth(due.getMonth()+6);
    DB.reminders.push({id:uid('r'),veh:v.id,cust:j.cust,kind:'other',name:I.items[i],due:due.getTime(),dueKm:d.rem==='5k'&&j.km?j.km+5000:0,job:j.id,sent:0});d.remDone=1;});save();}
/* the customer's report: colours, notes, photos and what we recommend with prices */
function inspReportHtml(j){const I=j.insp,v=vehOf(j),c=custOf(j);const secs=inspSecs(I);const cnt=x=>Object.values(I.r).filter(y=>y===x).length;
  const recs=I.items.map((n,i)=>({n,i,s:I.r[i],sv:I.meta&&I.meta[i]&&I.meta[i].svc&&byId('services',I.meta[i].svc)})).filter(x=>(x.s==='bad'||x.s==='warn')&&x.sv);
  const col={ok:'#16a34a',warn:'#d97706',bad:'#dc2626'};const lab={ok:'Good · سليم',warn:'Soon · قريباً',bad:'Now · الآن'};
  return `<div class="inv irep"><div class="inv-hd">${DB.ws.logo?`<img src="${DB.ws.logo}" alt="">`:`<b style="font-size:6mm">${esc(DB.ws.name)}</b>`}<div class="inv-ws"><b>${esc(DB.ws.name)}</b><span>${[DB.ws.addr,DB.ws.phone].filter(Boolean).map(esc).join(' · ')}</span></div></div>
  <div class="inv-ttl"><b>INSPECTION REPORT <span class="ar">تقرير الفحص</span></b><span>${esc(I.name)} · ${fmtD(I.at||j.t)}</span></div>
  <div class="inv-meta"><div><small>Customer</small>${esc(c.name||'—')}</div><div><small>Car</small>${esc(carName(v)||'—')}</div><div><small>Plate</small>${esc(v.plate||'—')}</div><div><small>Km</small>${j.km?kmf(j.km):'—'}</div></div>
  <div class="irsum"><span style="color:${col.ok}">● ${cnt('ok')} ${lab.ok}</span><span style="color:${col.warn}">● ${cnt('warn')} ${lab.warn}</span><span style="color:${col.bad}">● ${cnt('bad')} ${lab.bad}</span></div>
  ${secs.map(s=>`<div class="irsec"><b>${esc(s.n)}</b>${s.idx.map(i=>{const st=I.r[i],d=(I.d||{})[i]||{},M=MEAS[(I.meta[i]||{}).m];return `<div class="irr"><span class="irdot" style="background:${col[st]||'#cbd5e1'}"></span><span class="irn">${esc(I.items[i])}${d.v!=null&&d.v!==''?` · ${d.v} ${M?M.u:''}`:''}${d.note?`<small>${esc(d.note)}</small>`:''}</span><span class="irs" style="color:${col[st]||'#94a3b8'}">${st?lab[st]:'—'}</span></div>${(d.ph||[]).length?`<div class="irph">${d.ph.map(id=>{const p=photoOf(id);return p?`<img src="${p.img}">`:'';}).join('')}</div>`:''}`;}).join('')}</div>`).join('')}
  ${recs.length?`<div class="irsec"><b>We recommend · ننصح بـ</b>${recs.map(r=>`<div class="irr"><span class="irdot" style="background:${col[r.s]}"></span><span class="irn">${esc(r.sv.name)}${r.sv.ar?` <span class="ar">${esc(r.sv.ar)}</span>`:''}<small>${esc(r.n)}</small></span><span class="irs">${f3(svcPrice(r.sv,v))} ${DB.ws.currency}</span></div>`).join('')}<div class="irr tot"><span></span><span class="irn"><b>Total · المجموع</b></span><span class="irs"><b>${f3(recs.reduce((a,r)=>a+svcPrice(r.sv,v),0))} ${DB.ws.currency}</b></span></div></div>`:''}
  <div class="inv-ft">${esc(DB.ws.phone?'📞 '+DB.ws.phone:'')} · شكراً لزيارتكم</div></div>`;}
function inspReportText(j){const I=j.insp,v=vehOf(j),c=custOf(j);const cur=DB.ws.currency==='OMR'?'ر.ع':DB.ws.currency;const L=(x,e)=>I.items.map((n,i)=>I.r[i]===x?e+' '+n+((I.d||{})[i]&&I.d[i].note?' — '+I.d[i].note:''):'').filter(Boolean);
  const recs=I.items.map((n,i)=>({s:I.r[i],sv:I.meta&&I.meta[i]&&I.meta[i].svc&&byId('services',I.meta[i].svc)})).filter(x=>(x.s==='bad'||x.s==='warn')&&x.sv);
  return [`مرحباً ${c.name||''}،`,`نتيجة فحص سيارتك ${carName(v)}${v.plate?' ('+v.plate+')':''}:`,'',`✅ سليم: ${Object.values(I.r).filter(x=>x==='ok').length} بند`,...(L('bad','🔴').length?['','🔴 يحتاج الآن:',...L('bad','•')]:[]),...(L('warn','🟡').length?['','🟡 قريباً:',...L('warn','•')]:[]),
    ...(recs.length?['','ننصح بـ:',...recs.map(r=>'• '+(r.sv.ar||r.sv.name)+': '+f3(svcPrice(r.sv,v))+' '+cur),'المجموع: '+f3(recs.reduce((a,r)=>a+svcPrice(r.sv,v),0))+' '+cur]:[]),'',DB.ws.name||''].join('\n');}
const IR_CSS='.irsum{display:flex;gap:4mm;flex-wrap:wrap;margin:3mm 0;font-weight:700}.irsec{margin:3mm 0;border:0.3mm solid #ddd;border-radius:2mm;padding:2mm 3mm}.irsec>b{display:block;margin-bottom:1.5mm;font-size:3.6mm}.irr{display:grid;grid-template-columns:3mm 1fr auto;gap:2mm;align-items:start;padding:1.2mm 0;border-top:0.2mm solid #eee}.irr:first-of-type{border-top:0}.irdot{width:3mm;height:3mm;border-radius:50%;margin-top:0.6mm}.irn small{display:block;color:#555;font-size:2.6mm}.irs{font-size:2.8mm;font-weight:700;white-space:nowrap}.irph{display:flex;gap:2mm;flex-wrap:wrap;padding:1mm 0 2mm 5mm}.irph img{width:28mm;height:21mm;object-fit:cover;border-radius:1.5mm}.irr.tot{border-top:0.4mm solid #333}';
(function(){const st=document.createElement('style');st.textContent=IR_CSS;document.head.appendChild(st);})();
SCREENS.inspr=m=>{const j=byId('jobs',S.p.id);if(!j||!j.insp){go('work');return;}const c=custOf(j);
  m.innerHTML=head(T_('Inspection report'))+`<div class="invwrap">${inspReportHtml(j)}</div>
   <div class="two">${c.phone?`<button class="btn wa" id="irwa">📤 ${T_('Send on WhatsApp')}</button>`:''}<button class="btn ghost" id="irpr">🖨 ${T_('Print / PDF')}</button></div>`;
  const wa=$('#irwa');if(wa)wa.onclick=()=>{shareText(c.phone,inspReportText(j));logJ(j,'Inspection report sent');save();};
  $('#irpr').onclick=()=>printHtml('<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:14mm}body{margin:0;font-family:Arial,sans-serif}'+INV_CSS+IR_CSS+'</style></head><body>'+inspReportHtml(j)+'</body></html>',210,297,'Inspection '+(vehOf(j).plate||j.no));};

/* job screen: open the new inspection page; the summary shows sections and red/yellow */
(function(){window.inspSheet=inspSheet=function(j){go('inspj',{id:j.id});};
  const J=SCREENS.job;SCREENS.job=m=>{J(m);const j=byId('jobs',S.p.id);const b=$('#jinsp');if(!j||!b)return;
    b.onclick=()=>{if(j.insp){go('inspj',{id:j.id});return;}inspSeed();openSheet(`<h3>${T_('Choose a checklist')}</h3><div class="list">${DB.insp.map(t=>`<button class="row" data-ti="${t.id}"><div><b>${esc(t.name)}</b><span>${inspSecs(t).length} ${T_('sections')} · ${t.items.length} ${T_('items')}</span></div><span class="v">›</span></button>`).join('')}</div>`,el=>el.querySelectorAll('[data-ti]').forEach(x=>x.onclick=()=>{const t=DB.insp.find(y=>y.id===x.dataset.ti);inspStart(j,t);save();closeSheet();go('inspj',{id:j.id});}));};
    if(j.insp){const I=j.insp;const red=Object.values(I.r||{}).filter(x=>x==='bad').length,yel=Object.values(I.r||{}).filter(x=>x==='warn').length,dn=Object.keys(I.r||{}).length;
      b.innerHTML=`<div><b>📋 ${esc(I.name)}</b><span>${dn}/${I.items.length} ${T_('checked')}${red?` · <i class="dot bad"></i> ${red}`:''}${yel?` · <i class="dot warn"></i> ${yel}`:''}</span></div><span class="v">${T_('Open')} ›</span>`;}};})();
/* packages start the new kind of inspection too */
(function(){if(typeof pkgApply!=='function')return;const PA=pkgApply;window.pkgApply=pkgApply=function(j,v,sel){const had=!!j.insp;const r=PA(j,v,sel);if(r&&!had&&j.insp&&!j.insp.meta){const p=byId('pkgs',sel.id);const t=p&&(DB.insp||[]).find(x=>x.id===p.insp);if(t){delete j.insp;inspStart(j,t);}}return r;};})();

/* ---------- templates: sections with "## ", measurements with [mm] [tread] [pct] [psi], and the service each item sells ---------- */
SCREENS.insp=m=>{inspSeed();m.innerHTML=head('Inspection checklists',`<button class="lnk" id="iadd">＋ ${T_('New')}</button>`)+`<p class="hint">${T_('Workers tap green, yellow or red. Items with a number (pads, tyres, battery) take their colour from the number.')}</p>
  <div class="list">${DB.insp.map(t=>`<button class="row" data-ie="${t.id}"><div><b>${esc(t.name)}</b><span>${inspSecs(t).length} ${T_('sections')} · ${t.items.length} ${T_('items')}</span></div><span class="v">${T_('Edit')}</span></button>`).join('')}</div>`;
  const edit=t0=>{const isNew=!t0;const t=t0||{name:'',items:[],sec:[],meta:[]};
    openSheet(`<h3>${isNew?T_('New checklist'):T_('Edit checklist')}</h3><input class="field" id="in" placeholder="${T_('Name')}" value="${esc(t.name)}">
     <label class="field-l">${T_('One item per line. A line starting with ## is a section. Add [mm], [tread], [pct] or [psi] after an item to type a number.')}<textarea class="field" id="ii" rows="14" dir="ltr">${esc(t.items.length?inspText(t):'## Engine bay\nEngine oil\nCoolant\n## Brakes\nFront brake pads [mm]')}</textarea></label>
     <button class="btn" id="iok">${T_('Save')}</button>${!isNew?`<button class="btn ghost" id="ilink">🛠 ${T_('Services for each item')}</button><button class="btn ghost jb-del" id="idel">${T_('Delete')}</button>`:''}`,el=>{
     el.querySelector('#iok').onclick=()=>{const n=$('#in').value.trim();const P=inspParse($('#ii').value,t);if(!n||!P.items.length){toast(T_('Name and items'));return;}Object.assign(t,P,{name:n});if(isNew){t.id=uid('i');DB.insp.push(t);}save();closeSheet();render();};
     const lk=el.querySelector('#ilink');if(lk)lk.onclick=()=>linkSheet(t);
     const d=el.querySelector('#idel');if(d)d.onclick=()=>{audit('delete','Checklist '+t.name);DB.insp=DB.insp.filter(x=>x!==t);save();closeSheet();render();};});};
  const linkSheet=t=>{t.meta=t.meta||t.items.map(()=>({m:'',svc:''}));const SV=DB.services.filter(s=>!s.hidden);
    openSheet(`<h3>🛠 ${esc(t.name)}</h3><p class="hint">${T_('When an item is red or yellow, this service can be added to the job with one tap.')}</p><div class="list">${t.items.map((n,i)=>{const cur=inspSvc(t,i);return `<div class="row ilk"><div><b>${esc(n)}</b></div><select class="field sm" data-lk="${i}"><option value="-" ${!cur?'selected':''}>—</option>${SV.map(s=>`<option value="${s.id}" ${cur&&cur.id===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>`;}).join('')}</div><button class="btn" id="lkok">${T_('Save')}</button>`,el=>{
      el.querySelector('#lkok').onclick=()=>{el.querySelectorAll('[data-lk]').forEach(s=>{const i=+s.dataset.lk;t.meta[i]=t.meta[i]||{m:''};t.meta[i].svc=s.value;});save();closeSheet();render();toast(T_('Saved'));};});};
  $('#iadd').onclick=()=>edit();$$('[data-ie]').forEach(b=>b.onclick=()=>edit(DB.insp.find(x=>x.id===b.dataset.ie)));};
