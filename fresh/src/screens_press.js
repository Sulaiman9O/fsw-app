/* ---------- LONG PRESS: hold a row for more options; select many items in a job ---------- */
function longPress(el,fn){if(el._lp)return;el._lp=1;let t=0,sx=0,sy=0,fired=false;
  el.addEventListener('pointerdown',e=>{fired=false;sx=e.clientX;sy=e.clientY;el.classList.add('lp-hold');t=setTimeout(()=>{fired=true;el.classList.remove('lp-hold');try{navigator.vibrate&&navigator.vibrate(18);}catch(_){}fn(e);},480);});
  const stop=()=>{clearTimeout(t);el.classList.remove('lp-hold');};
  el.addEventListener('pointermove',e=>{if(Math.abs(e.clientX-sx)>10||Math.abs(e.clientY-sy)>10)stop();});
  ['pointerup','pointerleave','pointercancel'].forEach(x=>el.addEventListener(x,stop));
  el.addEventListener('click',e=>{if(fired){e.stopImmediatePropagation();e.preventDefault();fired=false;}},true);
  el.addEventListener('contextmenu',e=>e.preventDefault());}
function actionSheet(title,sub,acts,top){acts=acts.filter(a=>a&&!a.hide);
  openSheet(`<div class="ash-h"><h3>${title}</h3>${sub?`<span>${sub}</span>`:''}</div>${top||''}<div class="ash">${acts.map((a,i)=>`<button class="ash-b${a.danger?' dg':''}" data-ai="${i}"><span class="ic">${a.ic}</span><div><b>${a.t}</b>${a.d?`<small>${a.d}</small>`:''}</div></button>`).join('')}</div>`,el=>{
    el.querySelectorAll('[data-ai]').forEach(b=>b.onclick=()=>{const a=acts[+b.dataset.ai];if(!a.keep)closeSheet();a.fn(el);});});}
let UNDO=null;
function undoBar(msg,fn){UNDO=fn;let u=$('#undob');if(!u){u=document.createElement('div');u.id='undob';u.className='undob';document.body.appendChild(u);}
  u.innerHTML=`<span>${msg}</span><button>Undo</button>`;u.hidden=false;u.querySelector('button').onclick=()=>{u.hidden=true;if(UNDO){UNDO();UNDO=null;}};clearTimeout(u._t);u._t=setTimeout(()=>{u.hidden=true;UNDO=null;},6000);}
/* job item menu */
function itemMenu(j,i){const it=j.items[i];if(!it)return;const v=vehOf(j);const pt=it.ref&&byId('parts',it.ref);const locked=isInvoiced(j);
  const sub=`${it.k==='part'?'Part':'Labour'} · ${+it.q}${it.u?' '+esc(it.u):''} × ${it.pend?'?':f3(it.p)} = <b>${it.pend?'?':f3(it.q*it.p)}</b>`;
  if(locked){actionSheet(esc(it.d),sub,[{ic:'🧾',t:'Open the invoice',fn:()=>go('inv',{id:j.id})},{ic:'📋',t:'Copy line',fn:()=>{try{navigator.clipboard.writeText(it.d+' · '+f3(it.q*it.p));toast('Copied');}catch(e){}}}],'<p class="hint">Invoice made. Return the invoice to change items.</p>');return;}
  const step=it.u==='L'?0.5:1;
  const top=`<div class="qrow"><span>Quantity</span><div class="st"><button data-q="-1">−</button><input class="qin" id="lpq" inputmode="decimal" value="${+it.q}"><button data-q="1">+</button></div></div>`;
  const same=pt?DB.parts.filter(p=>p.cat===pt.cat&&p.id!==pt.id):[];const alts=pt?(pt.alts||[]).map(a=>byId('parts',a)).filter(Boolean):[];
  actionSheet(esc(it.d),sub,[
   {ic:'✏️',t:'Edit',d:'Name, price, quantity',fn:()=>editItemSheet(j,i)},
   {ic:'📄',t:'Duplicate',fn:()=>{j.items.splice(i+1,0,JSON.parse(JSON.stringify(it)));logJ(j,'Duplicated '+it.d);save();render();}},
   {ic:'🔁',t:'Swap part',d:alts.length?alts.length+' alternative'+(alts.length>1?'s':'')+' · same category':'Same category',hide:!pt||(!same.length),fn:()=>swapSheet(j,i,alts,same)},
   {ic:'⏳',t:it.pend?'Price is known now':'Ask owner for the price',d:it.pend?'Open to type the price':'Shows “Price?” until the owner sets it',fn:()=>{if(it.pend){editItemSheet(j,i);return;}it.pend=true;logJ(j,'Price pending · '+it.d);save();render();}},
   {ic:'🎁',t:'No charge',d:'Price 0, part still leaves stock',hide:!can.discount(),fn:()=>{const o=it.p;it.p=0;it.pend=false;it.free=1;audit('discount','No charge: '+it.d+' (was '+f3(o)+') · job #'+j.no);logJ(j,'No charge · '+it.d);save();render();}},
   {ic:'🧑‍🔧',t:it.custPart?'Undo: customer brought it':'Customer brought this part',d:'Price 0 and it does not leave our stock',hide:it.k!=='part',fn:()=>{it.custPart=!it.custPart;if(it.custPart){it._p=it.p;it.p=0;}else{it.p=it._p||it.p;delete it._p;}logJ(j,(it.custPart?'Customer part · ':'Our part again · ')+it.d);save();render();}},
   {ic:'📝',t:it.note?'Edit note':'Add a note',d:it.note?esc(it.note):'Shows on the invoice under the item',fn:()=>openSheet(`<h3>Note · ${esc(it.d)}</h3><input class="field" id="lpn" value="${esc(it.note||'')}" placeholder="e.g. old part given to customer"><button class="btn" id="lpnok">Save</button>`,el=>el.querySelector('#lpnok').onclick=()=>{it.note=$('#lpn').value.trim();save();closeSheet();render();})},
   {ic:'☑️',t:'Select several',d:'Then remove, mark or price them together',fn:()=>{S.selJ={id:j.id,set:new Set([i])};render();}},
   {ic:'🗑',t:'Remove',danger:1,fn:()=>{const it0=j.items.splice(i,1)[0];logJ(j,'Removed '+it0.d);save();render();undoBar('Removed '+esc(it0.d),()=>{j.items.splice(i,0,it0);logJ(j,'Undo remove '+it0.d);save();render();});}}
  ],top);
  const el=$('#sheet');el.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{it.q=Math.max(step,Math.round(((+it.q)+step*(+b.dataset.q))*100)/100);el.querySelector('#lpq').value=it.q;save();render();});
  const q=el.querySelector('#lpq');q.onfocus=()=>q.select();q.onchange=()=>{const n=num(q.value);if(n>0){it.q=n;save();render();}};}
function swapSheet(j,i,alts,same){const it=j.items[i];const L=[...alts,...same.filter(p=>!alts.includes(p))];
  openSheet(`<h3>🔁 Swap ${esc(it.d)}</h3><div class="list">${L.map(p=>`<button class="row" data-sw="${p.id}"><div><b>${esc(p.name)}${alts.includes(p)?' <span class="tg tok">alternative</span>':''}</b><span>${+p.stock||0}${p.unit==='L'?' L':''} in stock${p.loc?' · 📍 '+esc(p.loc):''}</span></div><span class="v">${f3(p.price)}</span></button>`).join('')}</div>`,el=>el.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{const p=byId('parts',b.dataset.sw);const o=it.d;Object.assign(it,{ref:p.id,d:p.name,num:p.num,p:+p.price,cost:+p.cost||0,u:p.unit==='L'?'L':''});logJ(j,'Swapped '+o+' → '+p.name);save();closeSheet();render();toast('Swapped');}));}
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
   {ic:'📞',t:'Call '+esc(c.name||''),hide:!c.phone,fn:()=>{location.href='tel:'+c.phone;}},
   {ic:'💬',t:'WhatsApp',hide:!c.phone,fn:()=>shareText(c.phone,msg('hello',{name:c.name||''}))},
   {ic:'✅',t:'Car is ready · tell customer',hide:j.stage!=='ready'||!c.phone,fn:()=>shareText(c.phone,msg('ready',jobVars(j)))},
   {ic:'🧾',t:'Open invoice',hide:!isInvoiced(j),fn:()=>go('inv',{id})}]);}
function partRowMenu(id){const p=byId('parts',id);if(!p)return;
  actionSheet(esc(p.name),`${+p.stock||0} ${p.unit==='L'?'L':p.unit||'pc'} in stock · ${f3(p.price)}${p.loc?' · 📍 '+esc(p.loc):''}`,[
   {ic:'✏️',t:'Edit',fn:()=>partSheet(p)},
   {ic:'🚚',t:'Add to a supplier order',hide:!DB.vendors.length||!perm('vendors'),fn:()=>{let o=DB.pos.find(x=>x.status==='open');if(!o)o=newPo(DB.vendors[0].id);const ex=o.items.find(x=>x.part===p.id);if(ex)ex.q+=1;else o.items.push({part:p.id,q:Math.max(1,(+p.reorder||1)*2-(+p.stock||0)),cost:+p.cost||0});save();go('po',{id:o.id});}},
   {ic:'🔢',t:'Count it now',fn:()=>openSheet(`<h3>Count · ${esc(p.name)}</h3><input class="field" id="lpc" inputmode="decimal" placeholder="How many on the shelf?"><button class="btn" id="lpcok">Save count</button>`,el=>el.querySelector('#lpcok').onclick=()=>{const v=$('#lpc').value.trim();if(v==='')return;DB.counts.push({id:uid('k'),date:today(),t:now(),part:p.id,sys:+p.stock||0,counted:num(v),by:S.user.name});save();closeSheet();toast(Math.abs(num(v)-(+p.stock||0))<0.001?'Matches ✓':'Difference '+(num(v)-(+p.stock||0)).toFixed(2)+' · see Daily count');})},
   {ic:'📋',t:'Copy part number',hide:!p.num,fn:()=>{try{navigator.clipboard.writeText(p.num);toast('Copied '+p.num);}catch(e){}}}]);}
function custRowMenu(id){const c=byId('customers',id);if(!c)return;const vs=DB.vehicles.filter(v=>v.cust===c.id);
  actionSheet(esc(c.name),esc(c.phone||'no phone')+' · '+vs.length+' car'+(vs.length===1?'':'s'),[
   {ic:'🚗',t:'New car in for '+esc(c.name),hide:!perm('jobs'),fn:()=>go('newjob',{n:{phone:'',name:'',plate:'',make:'',model:'',year:'',km:'',vin:'',engine:'',est:false,custId:c.id,vehId:vs.length===1?vs[0].id:null}})},
   {ic:'📞',t:'Call',hide:!c.phone,fn:()=>{location.href='tel:'+c.phone;}},
   {ic:'💬',t:'WhatsApp',hide:!c.phone,fn:()=>shareText(c.phone,msg('hello',{name:c.name||''}))},
   {ic:'📂',t:'Open',fn:()=>go('custd',{id})}]);}
function attachPress(m){
  m.querySelectorAll('[data-it]').forEach(b=>{const j=byId('jobs',S.p.id);if(j)longPress(b,()=>itemMenu(j,+b.dataset.it));});
  m.querySelectorAll('[data-go^="job:"]').forEach(b=>longPress(b,()=>jobRowMenu(b.dataset.go.split(':')[1])));
  m.querySelectorAll('[data-pe]').forEach(b=>longPress(b,()=>partRowMenu(b.dataset.pe)));
  m.querySelectorAll('[data-go^="custd:"]').forEach(b=>longPress(b,()=>custRowMenu(b.dataset.go.split(':')[1])));}
