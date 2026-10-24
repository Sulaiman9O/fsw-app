/* ---------- LONG PRESS: hold a row for more options; select many items in a job ---------- */
let PRESS=null;
function longPress(el,fn){if(el._lp)return;el._lp=1;let t=0,sx=0,sy=0,fired=false;
  el.addEventListener('pointerdown',e=>{fired=false;sx=e.clientX;sy=e.clientY;el.classList.add('lp-hold');t=setTimeout(()=>{fired=true;el.classList.remove('lp-hold');PRESS={el,t:Date.now()};try{navigator.vibrate&&navigator.vibrate(18);}catch(_){}fn(e);},480);});
  const stop=()=>{clearTimeout(t);el.classList.remove('lp-hold');};
  el.addEventListener('pointermove',e=>{if(Math.abs(e.clientX-sx)>10||Math.abs(e.clientY-sy)>10)stop();});
  ['pointerup','pointerleave','pointercancel'].forEach(x=>el.addEventListener(x,stop));
  el.addEventListener('click',e=>{if(fired){e.stopImmediatePropagation();e.preventDefault();fired=false;}},true);
  el.addEventListener('contextmenu',e=>e.preventDefault());}
/* long press: a strip of icon buttons right next to the row (no window). "More" opens the full list. */
function closeQs(){const q=$('#qs');if(q)q.remove();$$('.qs-on').forEach(e=>e.classList.remove('qs-on'));}
function quickStrip(anchor,title,sub,acts,top){closeQs();const r=anchor.getBoundingClientRect();anchor.classList.add('qs-on');
  const ov=document.createElement('div');ov.id='qs';ov.className='qs';
  ov.innerHTML=`<div class="qs-bar">${top?`<div class="qs-top">${top}</div>`:''}<div class="qs-row">${acts.map((a,i)=>`<button class="qs-b${a.danger?' dg':''}" data-qi="${i}"><span class="ic">${a.ic}</span><small>${a.s||a.t}</small></button>`).join('')}<button class="qs-b" data-qi="more"><span class="ic">⋯</span><small>More</small></button></div></div>`;
  document.body.appendChild(ov);const bar=ov.querySelector('.qs-bar');const h=bar.offsetHeight,vh=innerHeight;
  let top0=r.bottom+6;if(top0+h>vh-10)top0=Math.max(10,r.top-h-6);bar.style.top=top0+'px';
  try{if(motionOn())gsap.from(bar,{y:top0>r.top?-8:8,opacity:0,scale:.96,duration:.18,ease:'power2.out'});}catch(e){}
  ov.addEventListener('pointerdown',e=>{if(e.target===ov)closeQs();});
  const sc=e=>{if(e&&e.target&&e.target.closest&&e.target.closest('#qs'))return;closeQs();removeEventListener('scroll',sc,true);};   /* sliding the strip itself does not close it */setTimeout(()=>addEventListener('scroll',sc,true),300);
  ov.querySelectorAll('[data-qi]').forEach(b=>b.onclick=()=>{const k=b.dataset.qi;closeQs();if(k==='more'){fullSheet(title,sub,acts,top);return;}const a=acts[+k];a.fn($('#sheet'));});}
function actionSheet(title,sub,acts,top){acts=acts.filter(a=>a&&!a.hide);
  if(PRESS&&Date.now()-PRESS.t<1500&&PRESS.el.isConnected){const el=PRESS.el;PRESS=null;quickStrip(el,title,sub,acts,top);return;}
  fullSheet(title,sub,acts,top);}
function fullSheet(title,sub,acts,top){
  openSheet(`<div class="ash-h"><h3>${title}</h3>${sub?`<span>${sub}</span>`:''}</div>${top||''}<div class="ash">${acts.map((a,i)=>`<button class="ash-b${a.danger?' dg':''}" data-ai="${i}"><span class="ic">${a.ic}</span><div><b>${a.t}</b>${a.d?`<small>${a.d}</small>`:''}</div></button>`).join('')}</div>`,el=>{
    el.querySelectorAll('[data-ai]').forEach(b=>b.onclick=()=>{const a=acts[+b.dataset.ai];if(!a.keep)closeSheet();a.fn(el);});});}
let UNDO=null;
function undoBar(msg,fn){UNDO=fn;let u=$('#undob');if(!u){u=document.createElement('div');u.id='undob';u.className='undob';document.body.appendChild(u);}
  u.innerHTML=`<span>${msg}</span><button>Undo</button>`;u.hidden=false;u.querySelector('button').onclick=()=>{u.hidden=true;if(UNDO){UNDO();UNDO=null;}};clearTimeout(u._t);u._t=setTimeout(()=>{u.hidden=true;UNDO=null;},6000);}
/* job item menu */
function itemMenu(j,i){const it=j.items[i];if(!it)return;const v=vehOf(j);const pt=it.k==='part'?partOfItem(it):null;const locked=isInvoiced(j);
  const sub=`${it.k==='part'?'Part':'Labour'} · ${+it.q}${it.u?' '+esc(it.u):''} × ${it.pend?'?':f3(it.p)} = <b>${it.pend?'?':f3(it.q*it.p)}</b>`;
  if(locked){actionSheet(esc(it.d),sub,[{ic:'🧾',s:'Invoice',t:'Open the invoice',fn:()=>go('inv',{id:j.id})},{ic:'📋',s:'Copy',t:'Copy line',fn:()=>{try{navigator.clipboard.writeText(it.d+' · '+f3(it.q*it.p));toast('Copied');}catch(e){}}}],'<p class="hint">Invoice made. Return the invoice to change items.</p>');return;}
  const step=it.u==='L'?0.5:1;
  const top=`<div class="qrow"><span>Quantity</span><div class="st"><button data-q="-1">−</button><input class="qin" id="lpq" inputmode="decimal" value="${+it.q}"><button data-q="1">+</button></div></div>`;
  const same=pt?DB.parts.filter(p=>p.cat===pt.cat&&p.id!==pt.id):[];const alts=pt?(pt.alts||[]).map(a=>byId('parts',a)).filter(Boolean):[];
  actionSheet(esc(it.d),sub,[
   {ic:'🔁',t:'Change to another',s:'Change',d:alts.length?alts.length+' alternative'+(alts.length>1?'s':'')+' · same category':'Same category',hide:!pt||(!same.length),fn:()=>swapSheet(j,i,alts,same)},
   {ic:'✏️',t:'Edit',s:'Edit',d:'Name, price, quantity',fn:()=>editItemSheet(j,i)},
   {ic:'⏳',s:'Price?',t:it.pend?'Price is known now':'Ask owner for the price',d:it.pend?'Open to type the price':'Shows “Price?” until the owner sets it',fn:()=>{if(it.pend){editItemSheet(j,i);return;}it.pend=true;logJ(j,'Price pending · '+it.d);save();render();}},
   {ic:'🎁',t:'No charge',s:'Free',d:'Price 0, part still leaves stock',hide:!can.discount(),fn:()=>{const o=it.p;it.p=0;it.pend=false;it.free=1;audit('discount','No charge: '+it.d+' (was '+f3(o)+') · job #'+j.no);logJ(j,'No charge · '+it.d);save();render();}},
   {ic:'🧑‍🔧',s:'Customer part',t:it.custPart?'Undo: customer brought it':'Customer brought this part',d:'Price 0 and it does not leave our stock',hide:it.k!=='part',fn:()=>{it.custPart=!it.custPart;if(it.custPart){it._p=it.p;it.p=0;}else{it.p=it._p||it.p;delete it._p;}logJ(j,(it.custPart?'Customer part · ':'Our part again · ')+it.d);save();render();}},
   {ic:'📝',s:'Note',t:it.note?'Edit note':'Add a note',d:it.note?esc(it.note):'Shows on the invoice under the item',fn:()=>openSheet(`<h3>Note · ${esc(it.d)}</h3><input class="field" id="lpn" value="${esc(it.note||'')}" placeholder="e.g. old part given to customer"><button class="btn" id="lpnok">Save</button>`,el=>el.querySelector('#lpnok').onclick=()=>{it.note=$('#lpn').value.trim();save();closeSheet();render();})},
   {ic:'☑️',t:'Select several',s:'Select',d:'Then remove, mark or price them together',fn:()=>{S.selJ={id:j.id,set:new Set([i])};render();}},
   {ic:'🗑',t:'Remove',s:'Remove',danger:1,fn:()=>{const it0=j.items.splice(i,1)[0];logJ(j,'Removed '+it0.d);save();render();undoBar('Removed '+esc(it0.d),()=>{j.items.splice(i,0,it0);logJ(j,'Undo remove '+it0.d);save();render();});}}
  ],top);
  const el=$('#qs')||$('#sheet');if(!el)return;el.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{it.q=Math.max(step,Math.round(((+it.q)+step*(+b.dataset.q))*100)/100);el.querySelector('#lpq').value=it.q;save();render();const a=document.querySelector('[data-it="'+i+'"]');if(a)a.classList.add('qs-on');});
  const q=el.querySelector('#lpq');q.onfocus=()=>q.select();q.onchange=()=>{const n=num(q.value);if(n>0){it.q=n;save();render();}};}
function swapSheet(j,i,alts,same){const it=j.items[i];const cur=partOfItem(it);const v=vehOf(j);
  /* the likely ones first: its alternatives, then (filters) the ones that fit this car or (oils) the same viscosity, then what is in stock */
  const fit=new Set();try{if(cur&&cur.cat==='Oil filters')filterOpts(v,oilRecipe(v,'usual')).forEach(o=>fit.add(o.p.id));}catch(e){}const vs=cur?viscTxt(cur.name):'';
  const rank=p=>(alts.includes(p)?0:fit.has(p.id)||(vs&&viscTxt(p.name)===vs)?1:2)*2+((+p.stock||0)>0?0:1);
  const L=[...new Set([...alts,...same])].sort((a,b)=>rank(a)-rank(b)||(+a.price||0)-(+b.price||0));
  const row=p=>`<button class="row" data-sw="${p.id}"><div><b>${esc(p.name)}${alts.includes(p)?' <span class="tg tok">'+T_('alternative')+'</span>':fit.has(p.id)?' <span class="tg tok">'+T_('fits')+'</span>':''}</b><span>${+p.stock||0}${p.unit==='L'||p.cat==='Engine oil'?' L':''} ${T_('in stock')}${p.loc?' · 📍 '+esc(p.loc):''}</span></div><span class="v">${f3(p.price)}</span></button>`;
  openSheet(`<h3>🔁 ${T_('Change')} · ${esc(it.d)}</h3><input class="field" id="swq" placeholder="${T_('Number or name…')}" autocomplete="off" autocorrect="off" spellcheck="false"><div class="list" id="swl"></div>`,el=>{
    const q=el.querySelector('#swq'),box=el.querySelector('#swl');
    const draw=()=>{const t=normQ(q.value);const M=L.filter(p=>!t||normQ((p.num||'')+' '+p.name).includes(t)).slice(0,t?40:20);box.innerHTML=M.map(row).join('')||`<p class="hint">${T_('Nothing found')}</p>`;
      box.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{const p=byId('parts',b.dataset.sw);const o=it.d;Object.assign(it,{ref:p.id,d:p.name,num:p.num,p:+p.price,cost:+p.cost||0,u:(p.unit==='L'||p.cat==='Engine oil')?'L':''});logJ(j,'Swapped '+o+' → '+p.name);save();closeSheet();render();});};
    q.oninput=draw;draw();});}
/* selection bar actions */
function selBar(j){const s=S.selJ;const n=s.set.size;
  return `<div class="selbar"><b>${n} selected</b><button data-sa="all">All</button><button data-sa="pend">⏳ Price?</button>${can.discount()?'<button data-sa="free">🎁 Free</button>':''}<button data-sa="del" class="dg">🗑 Remove</button><button data-sa="x">✕</button></div>`;}
function selAct(j,a){const s=S.selJ;const idx=[...s.set].sort((x,y)=>y-x);
  if(a==='x'){S.selJ=null;render();return;}if(a==='all'){s.set=new Set(j.items.map((_,i)=>i));render();return;}if(!idx.length){toast('Tap items to select them');return;}
  if(a==='pend'){idx.forEach(i=>j.items[i].pend=true);logJ(j,idx.length+' items: price pending');}
  if(a==='free'){idx.forEach(i=>{const it=j.items[i];it.p=0;it.pend=false;it.free=1;});audit('discount','No charge on '+idx.length+' items · job #'+j.no);logJ(j,idx.length+' items: no charge');}
  if(a==='del'){const old=j.items.slice();idx.forEach(i=>j.items.splice(i,1));logJ(j,'Removed '+idx.length+' items');S.selJ=null;save();render();undoBar('Removed '+idx.length+' items',()=>{j.items=old;save();render();});return;}
  S.selJ=null;save();render();}
/* other long-press menus */
function jobRowMenu(id){const j=byId('jobs',id);if(!j)return;const c=custOf(j),v=vehOf(j);const nx=(typeof NEXT!=='undefined')&&NEXT[j.stage];
  actionSheet(`#${j.no} · ${esc(carName(v)||'Car')}`,esc(c.name||'Walk-in')+(v.plate?' · '+esc(v.plate):''),[
   {ic:'📂',t:'Open',fn:()=>go('job',{id})},
   {ic:'📞',s:'Call',t:'Call '+esc(c.name||''),hide:!c.phone,fn:()=>{location.href='tel:'+c.phone;}},
   {ic:'💬',t:'WhatsApp',hide:!c.phone,fn:()=>shareText(c.phone,msg('hello',{name:c.name||''}))},
   {ic:'✅',s:'Ready msg',t:'Car is ready · tell customer',hide:j.stage!=='ready'||!c.phone,fn:()=>shareText(c.phone,msg('ready',jobVars(j)))},
   {ic:'🧾',s:'Invoice',t:'Open invoice',hide:!isInvoiced(j),fn:()=>go('inv',{id})}]);}
function partRowMenu(id){const p=byId('parts',id);if(!p)return;
  actionSheet(esc(p.name),`${+p.stock||0} ${p.unit==='L'?'L':p.unit||'pc'} in stock · ${f3(p.price)}${p.loc?' · 📍 '+esc(p.loc):''}`,[
   {ic:'✏️',t:'Edit',fn:()=>partSheet(p)},
   {ic:'🚚',s:'Order',t:'Add to a supplier order',hide:!DB.vendors.length||!perm('vendors'),fn:()=>{let o=DB.pos.find(x=>x.status==='open');if(!o)o=newPo(DB.vendors[0].id);const ex=o.items.find(x=>x.part===p.id);if(ex)ex.q+=1;else o.items.push({part:p.id,q:Math.max(1,(+p.reorder||1)*2-(+p.stock||0)),cost:+p.cost||0});save();go('po',{id:o.id});}},
   {ic:'🔢',s:'Count',t:'Count it now',fn:()=>openSheet(`<h3>Count · ${esc(p.name)}</h3><input class="field" id="lpc" inputmode="decimal" placeholder="How many on the shelf?"><button class="btn" id="lpcok">Save count</button>`,el=>el.querySelector('#lpcok').onclick=()=>{const v=$('#lpc').value.trim();if(v==='')return;DB.counts.push({id:uid('k'),date:today(),t:now(),part:p.id,sys:+p.stock||0,counted:num(v),by:S.user.name});save();closeSheet();toast(Math.abs(num(v)-(+p.stock||0))<0.001?'Matches ✓':'Difference '+(num(v)-(+p.stock||0)).toFixed(2)+' · see Daily count');})},
   {ic:'☑️',s:'Select',t:'Select several',d:'Order, count or move many parts at once',fn:()=>selStart('parts',id)},
   {ic:'📋',s:'Copy no.',t:'Copy part number',hide:!p.num,fn:()=>{try{navigator.clipboard.writeText(p.num);toast('Copied '+p.num);}catch(e){}}}]);}
function custRowMenu(id){const c=byId('customers',id);if(!c)return;const vs=DB.vehicles.filter(v=>v.cust===c.id);
  actionSheet(esc(c.name),esc(c.phone||'no phone')+' · '+vs.length+' car'+(vs.length===1?'':'s'),[
   {ic:'🚗',s:'New job',t:'New car in for '+esc(c.name),hide:!perm('jobs'),fn:()=>go('newjob',{n:{phone:'',name:'',plate:'',make:'',model:'',year:'',km:'',vin:'',engine:'',est:false,custId:c.id,vehId:vs.length===1?vs[0].id:null}})},
   {ic:'📞',t:'Call',hide:!c.phone,fn:()=>{location.href='tel:'+c.phone;}},
   {ic:'💬',t:'WhatsApp',hide:!c.phone,fn:()=>shareText(c.phone,msg('hello',{name:c.name||''}))},
   {ic:'📂',t:'Open',fn:()=>go('custd',{id})}]);}
function attachPress(m){
  m.querySelectorAll('[data-it]').forEach(b=>{const j=byId('jobs',S.p.id);if(j)longPress(b,()=>itemMenu(j,+b.dataset.it));});
  m.querySelectorAll('[data-go^="job:"]').forEach(b=>longPress(b,()=>jobRowMenu(b.dataset.go.split(':')[1])));
  m.querySelectorAll('[data-pe]').forEach(b=>longPress(b,()=>{if(!S.sel)partRowMenu(b.dataset.pe);}));
  m.querySelectorAll('[data-go^="custd:"]').forEach(b=>longPress(b,()=>custRowMenu(b.dataset.go.split(':')[1])));
  m.querySelectorAll('[data-se]').forEach(b=>longPress(b,()=>{if(S.sel)return;const sv=byId('services',b.dataset.se);if(!sv)return;actionSheet(esc(sv.name),esc(sv.cat)+' · '+f3(sv.p[0]),[
    {ic:'✏️',s:'Edit',t:'Edit',fn:()=>svcSheet(sv)},
    {ic:'☑️',s:'Select',t:'Select several',d:'Move, hide or change prices together',hide:!perm('svcEdit'),fn:()=>selStart('svc',sv.id)},
    {ic:sv.hidden?'👁':'🙈',s:sv.hidden?'Show':'Hide',t:sv.hidden?'Show':'Hide',hide:!perm('svcEdit'),fn:()=>{sv.hidden=!sv.hidden;save();render();}}]);}));
  try{selApply(m);}catch(e){}}

/* ---------- select many rows on a list (parts, services) with a long press ---------- */
const SELK={
 parts:{attr:'pe',acts:()=>[
  {ic:'🚚',t:'Add to order',ok:perm('vendors')&&DB.vendors.length,fn:ids=>{let o=DB.pos.find(x=>x.status==='open');if(!o)o=newPo(DB.vendors[0].id);ids.forEach(id=>{const p=byId('parts',id);const ex=o.items.find(x=>x.part===id);if(ex)ex.q+=1;else o.items.push({part:id,q:Math.max(1,(+p.reorder||1)*2-(+p.stock||0)),cost:+p.cost||0});});save();S.sel=null;go('po',{id:o.id});toast(ids.length+' parts added to the order');}},
  {ic:'🏷',t:'Category',ok:perm('stock'),fn:ids=>pickSheet('Move to category',DB.pcats,c=>{ids.forEach(id=>byId('parts',id).cat=c);save();S.sel=null;render();toast('Moved '+ids.length+' parts');})},
  {ic:'📍',t:'Shelf',ok:perm('stock'),fn:ids=>openSheet(`<h3>Shelf place for ${ids.length} parts</h3><input class="field" id="sloc" placeholder="e.g. Shelf A3 · Drawer 2"><button class="btn" id="slok">Save</button>`,el=>el.querySelector('#slok').onclick=()=>{const v=$('#sloc').value.trim();ids.forEach(id=>byId('parts',id).loc=v);save();closeSheet();S.sel=null;render();})}]},
 svc:{attr:'se',acts:()=>[
  {ic:'📁',t:'Group',ok:perm('svcEdit'),fn:ids=>pickSheet('Move to group',DB.scats.map(g=>g.name),g=>{ids.forEach(id=>byId('services',id).cat=g);save();S.sel=null;render();toast('Moved '+ids.length+' services');})},
  {ic:'🙈',t:'Hide / show',ok:perm('svcEdit'),fn:ids=>{const hide=!ids.every(id=>byId('services',id).hidden);ids.forEach(id=>byId('services',id).hidden=hide);save();S.sel=null;render();toast((hide?'Hidden ':'Shown ')+ids.length);}},
  {ic:'％',t:'Change price',ok:perm('svcEdit'),fn:ids=>openSheet(`<h3>Change the price of ${ids.length} services</h3><p class="hint">Type + or − percent, e.g. 10 or -5. All car sizes change.</p><input class="field" id="spc" inputmode="decimal" placeholder="%"><button class="btn" id="spok">Apply</button>`,el=>el.querySelector('#spok').onclick=()=>{const x=num($('#spc').value);if(!x)return;ids.forEach(id=>{const s=byId('services',id);s.p=s.p.map(v=>Math.round(v*(1+x/100)*1000)/1000);});audit('price','Services price '+(x>0?'+':'')+x+'% on '+ids.length);save();closeSheet();S.sel=null;render();toast('Prices changed');})}]}};
function pickSheet(t,list,fn){openSheet(`<h3>${t}</h3><div class="list">${list.map((x,i)=>`<button class="row" data-pk="${i}"><div><b>${esc(x)}</b></div><span class="v">›</span></button>`).join('')}</div>`,el=>el.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{closeSheet();fn(list[+b.dataset.pk]);}));}
function selStart(kind,id){S.sel={kind,set:new Set(id?[id]:[])};render();}
function selApply(m){const old=$('#selb2');if(!S.sel){if(old)old.remove();return;}const K=SELK[S.sel.kind];if(!K)return;
  const rows=[...m.querySelectorAll('[data-'+K.attr+']')];if(!rows.length){if(old)old.remove();return;}
  const id=r=>r.dataset[K.attr==='pe'?'pe':'se'];
  rows.forEach(r=>{r.classList.add('selm');r.classList.toggle('on',S.sel.set.has(id(r)));if(!r.querySelector('.ck'))r.insertAdjacentHTML('afterbegin','<i class="ck">✓</i>');
    r.addEventListener('click',e=>{if(!S.sel)return;e.stopImmediatePropagation();e.preventDefault();const k=id(r);if(S.sel.set.has(k))S.sel.set.delete(k);else S.sel.set.add(k);r.classList.toggle('on');bar();},true);});
  const acts=K.acts().filter(a=>a.ok);let b=old;if(!b){b=document.createElement('div');b.id='selb2';b.className='selb2';document.body.appendChild(b);}
  const bar=()=>{const n=S.sel.set.size;b.innerHTML=`<b>${n} selected</b><div class="sb">${acts.map((a,i)=>`<button data-sb="${i}"><span>${a.ic}</span>${a.t}</button>`).join('')}<button data-sb="all"><span>☑️</span>All</button><button data-sb="x"><span>✕</span>Done</button></div>`;
    b.querySelectorAll('[data-sb]').forEach(x=>x.onclick=()=>{const k=x.dataset.sb;if(k==='x'){S.sel=null;render();return;}if(k==='all'){rows.filter(r=>!r.hidden&&r.offsetParent).forEach(r=>S.sel.set.add(id(r)));render();return;}
      const ids=[...S.sel.set];if(!ids.length){toast('Tap items to select them');return;}acts[+k].fn(ids);});};bar();}
