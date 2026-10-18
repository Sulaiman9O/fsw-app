/* ---------- LISTS: every list in the app is editable from inside ---------- */
const ICONS=['🔧','🛢','⚙️','🛑','❄️','🌡','⚡','🔋','🛞','🚗','🔍','🧽','🎨','🪛','🔩','🧰','💡','🪟','💺','📋','📦','🏪','⭐','🧾'];
const DEF_MAKES=['Toyota','Nissan','Lexus','Hyundai','Kia','Honda','Mitsubishi','Mazda','Chevrolet','GMC','Ford','Mercedes-Benz','BMW','Land Rover','MG','Changan','Geely','Suzuki','Jeep','Volkswagen'];
const DEF_SCAT_IC={Engine:'🔧',Brakes:'🛑',Transmission:'⚙️',Cooling:'❄️',Suspension:'🛞',Electrical:'⚡',Belts:'🔩',Inspection:'🔍',Detailing:'🧽'};
function ensureLists(){if(!DB.ws)return;let ch=0;
  if(!DB.scats){DB.scats=[...new Set(DB.services.map(s=>s.cat))].map(n=>({id:uid('g'),name:n,ic:DEF_SCAT_IC[n]||'🔧'}));ch=1;}
  DB.services.forEach(s=>{if(!DB.scats.some(g=>g.name===s.cat)){DB.scats.push({id:uid('g'),name:s.cat||'Other',ic:'🔧'});s.cat=s.cat||'Other';ch=1;}});
  if(!DB.units){DB.units=['pc','L','set'];ch=1;}
  if(!DB.sizes){DB.sizes=['Small','Sedan','SUV','Pickup'];DB.services.forEach(x=>{const a=+x.p[0]||0,b=x.p[1]!=null?+x.p[1]:a;x.p=[a,a,b,b];});ch=1;}
  if(!DB.outPaid){DB.outPaid=[];ch=1;}
  if(!DB.makes){DB.makes=DEF_MAKES.slice();ch=1;}
  if(!DB.mlists){DB.mlists=[];ch=1;}
  if(!DB.hideMenu){DB.hideMenu={};ch=1;}
  if(!DB.ws.pay.includes('Cash')){DB.ws.pay.unshift('Cash');ch=1;}
  if(ch)save();}
const scatIc=n=>(DB.scats.find(g=>g.name===n)||{}).ic||'🔧';
const unitName=u=>({pc:'Piece',L:'Litre',set:'Set'})[u]||u;
/* a string list kept in an array, with the places that use each name */
const strList=(t,hint,arr,uses,rename,lock)=>({t,hint,items:()=>arr().map(n=>({id:n,n,c:uses(n),lock:lock&&lock(n)})),
  add:n=>{if(arr().includes(n))return 'Already in the list';arr().push(n);},
  ren:(o,n)=>{if(o===n)return;if(arr().includes(n))return 'Already in the list';const a=arr();a[a.indexOf(o)]=n;rename(o,n);},
  del:(o,to)=>{const a=arr();a.splice(a.indexOf(o),1);if(to)rename(o,to);},
  move:(i,d)=>{const a=arr();const j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];}});
const LISTS={
  scat:{t:'Service groups',hint:'Groups for your services (Engine, Brakes…). Renaming a group renames it on every service in it.',icons:1,
    items:()=>DB.scats.map(g=>({id:g.id,n:g.name,ic:g.ic,c:DB.services.filter(s=>s.cat===g.name).length})),
    add:(n,ic)=>{if(DB.scats.some(g=>g.name.toLowerCase()===n.toLowerCase()))return 'Already in the list';DB.scats.push({id:uid('g'),name:n,ic:ic||'🔧'});},
    ren:(id,n,ic)=>{const g=DB.scats.find(x=>x.id===id);if(n!==g.name&&DB.scats.some(x=>x!==g&&x.name.toLowerCase()===n.toLowerCase()))return 'Already in the list';DB.services.forEach(s=>{if(s.cat===g.name)s.cat=n;});g.name=n;if(ic)g.ic=ic;},
    del:(id,to)=>{const g=DB.scats.find(x=>x.id===id);if(to){const t=DB.scats.find(x=>x.id===to);DB.services.forEach(s=>{if(s.cat===g.name)s.cat=t.name;});}else DB.services=DB.services.filter(s=>s.cat!==g.name);audit('delete','Service group '+g.name);DB.scats=DB.scats.filter(x=>x!==g);},
    move:(i,d)=>{const a=DB.scats,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];},cw:'services',
    delMsg:'services',delAll:'Delete the services too'},
  pcat:strList('Part categories','Categories for parts in Stock.',()=>DB.pcats,n=>DB.parts.filter(p=>p.cat===n).length,(o,n)=>DB.parts.forEach(p=>{if(p.cat===o)p.cat=n;})),
  ecat:strList('Expense types','Types for expenses (rent, salaries…).',()=>DB.ecats,n=>DB.expenses.filter(e=>e.cat===n).length,(o,n)=>DB.expenses.forEach(e=>{if(e.cat===o)e.cat=n;})),
  pay:strList('Payment methods','Shown when taking a payment. “Cash” stays: the daily close counts it.',()=>DB.ws.pay,n=>DB.jobs.reduce((a,j)=>a+(j.pays||[]).filter(p=>p.m===n).length,0),(o,n)=>DB.jobs.forEach(j=>(j.pays||[]).forEach(p=>{if(p.m===o)p.m=n;})),n=>n==='Cash'),
  unit:strList('Part units','How parts are counted. “L” means litres (price per litre).',()=>DB.units,n=>DB.parts.filter(p=>(p.unit||'pc')===n).length,(o,n)=>DB.parts.forEach(p=>{if((p.unit||'pc')===o)p.unit=n;}),n=>n==='pc'||n==='L'),
  size:{t:'Car sizes',hint:'Each service can have a price for each size. Deleting a size removes its prices.',
    items:()=>DB.sizes.map((n,k)=>({id:String(k),n,c:DB.vehicles.filter(v=>v.size===k).length,lock:DB.sizes.length<2})),
    add:n=>{if(DB.sizes.some(x=>x.toLowerCase()===n.toLowerCase()))return 'Already in the list';DB.services.forEach(x=>x.p.push(x.p[x.p.length-1]||0));DB.sizes.push(n);},
    ren:(id,n)=>{DB.sizes[+id]=n;},
    del:(id,to)=>{const k=+id;DB.sizes.splice(k,1);DB.services.forEach(x=>x.p.splice(k,1));DB.vehicles.forEach(v=>{if(v.size===k)v.size=to!=null&&to!==''?(+to>k?+to-1:+to):null;else if(v.size>k)v.size--;});},
    move:(i,d)=>{const j=i+d,a=DB.sizes;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];DB.services.forEach(x=>{const p=x.p;while(p.length<a.length)p.push(p[p.length-1]||0);[p[i],p[j]]=[p[j],p[i]];});DB.vehicles.forEach(v=>{if(v.size===i)v.size=j;else if(v.size===j)v.size=i;});}},
  make:strList('Car makes','Suggested when you type the make of a new car.',()=>DB.makes,n=>DB.vehicles.filter(v=>v.make===n).length,(o,n)=>DB.vehicles.forEach(v=>{if(v.make===o)v.make=n;}))
};
function listOf(id){if(LISTS[id])return LISTS[id];const L=DB.mlists.find(x=>x.id===id);if(!L)return null;
  return {t:L.name,hint:L.note||'Your own list.',custom:L,items:()=>L.items.map(i=>({id:i.id,n:i.name,sub:i.note})),
    add:n=>{L.items.push({id:uid('li'),name:n,note:''});},ren:(id,n,ic,note)=>{const i=L.items.find(x=>x.id===id);i.name=n;i.note=note||'';},
    del:id=>{L.items=L.items.filter(x=>x.id!==id);},move:(i,d)=>{const a=L.items,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];},note:1};}
const MENU=[['setup','✅','Setup · 100 steps'],['svc','🛠','Services'],['stock','🛢','Stock'],['vendors','🚚','Suppliers & orders'],['canned','📦','Canned jobs'],['insp','📋','Inspection checklists'],['count','🔢','Daily count'],['money','💰','Money'],['exp','🧾','Expenses'],['close','🔒','Daily close'],['reports','📊','Reports']];
SCREENS.lists=m=>{if(!can.settings()){go('more');return;}ensureLists();
  const it=(r,ic,t,s)=>`<button class="mitem" data-go="${r}"><span class="ic">${ic}</span><div><b>${t}</b><span>${s}</span></div><span class="v">›</span></button>`;
  m.innerHTML=head('Lists',`<button class="lnk" id="lnew">＋ New list</button>`)+`<p class="hint">Add, rename, delete and reorder anything in these lists.</p>
  ${sec('Services')}<div class="list">${it('list:scat','🗂','Service groups',DB.scats.length+' groups')}${it('svc','🛠','Services',DB.services.length+' services · prices')}${it('canned','📦','Canned jobs',DB.canned.length+' sets')}${it('insp','📋','Inspection checklists',DB.insp.length+' checklists')}</div>
  ${sec('Stock & cars')}<div class="list">${it('list:size','🚙','Car sizes',DB.sizes.join(', '))}${it('list:pcat','🏷','Part categories',DB.pcats.length+' categories')}${it('list:unit','📏','Part units',DB.units.map(unitName).join(', '))}${it('list:make','🚗','Car makes',DB.makes.length+' makes')}</div>
  ${sec('Money')}<div class="list">${it('list:pay','💳','Payment methods',DB.ws.pay.join(', '))}${it('list:ecat','🧾','Expense types',DB.ecats.length+' types')}</div>
  ${sec('Menu')}<div class="list">${it('menu','☰','More menu','Show or hide items')}</div>
  ${sec('Your lists',DB.mlists.length?'':'make any list you need')}<div class="list">${DB.mlists.map(L=>it('list:'+L.id,L.ic||'📝',esc(L.name),L.items.length+' items')).join('')||`<p class="hint">For example: partner workshops, tools, car colours, things to buy.</p>`}</div>`;
  $('#lnew').onclick=()=>mlistSheet();};
function mlistSheet(L){const isNew=!L;let ic=L?L.ic:'📝';
  openSheet(`<h3>${isNew?'New list':'Edit list'}</h3><input class="field" id="mln" placeholder="List name (e.g. Partner workshops)" value="${esc(L?L.name:'')}"><input class="field" id="mlh" placeholder="What is it for? (optional)" value="${esc(L?L.note||'':'')}"><div class="chips" id="mli">${ICONS.map(x=>`<button data-ic="${x}" aria-pressed="${x===ic}">${x}</button>`).join('')}</div><label class="chk"><input type="checkbox" id="mlm" ${!L||L.inMenu!==false?'checked':''}> Show in the More menu</label><button class="btn" id="mlok">Save</button>${!isNew?'<button class="btn ghost jb-del" id="mldel">Delete list</button>':''}`,el=>{
    el.querySelectorAll('[data-ic]').forEach(b=>b.onclick=()=>{ic=b.dataset.ic;el.querySelectorAll('[data-ic]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
    el.querySelector('#mlok').onclick=()=>{const n=$('#mln').value.trim();if(!n){toast('Type a name');return;}if(isNew){L={id:uid('ml'),items:[]};DB.mlists.push(L);}L.name=n;L.note=$('#mlh').value.trim();L.ic=ic;L.inMenu=$('#mlm').checked;save();closeSheet();isNew?go('list',{id:L.id}):render();};
    const d=el.querySelector('#mldel');if(d)d.onclick=()=>confirmSheet(`Delete the list “${esc(L.name)}” and its ${L.items.length} items?`,'Delete list',()=>{DB.mlists=DB.mlists.filter(x=>x!==L);save();go('lists');});});}
SCREENS.list=m=>{ensureLists();const L=listOf(S.p.id);if(!L){go('lists');return;}if(!L.custom&&!(can.settings()||((S.p.id==='scat'||S.p.id==='size')&&perm('svcEdit')))){go('more');return;}const its=L.items();
  m.innerHTML=head(esc(L.t),`${L.custom&&can.settings()?'<button class="lnk" id="ledl">Edit list</button>':''}<button class="lnk" id="ladd">＋ Add</button>`)+`<p class="hint">${esc(L.hint)}</p>
  <div class="list">${its.map((x,i)=>`<div class="lrow"><button class="lname" data-le="${i}">${x.ic?`<span class="ic">${x.ic}</span>`:''}<div><b>${esc(x.n)}${x.lock?' 🔒':''}</b>${x.sub?`<span>${esc(x.sub)}</span>`:x.c!=null?`<span>${L.cw?x.c+' '+L.cw:x.c?'used '+x.c+(x.c===1?' time':' times'):'not used yet'}</span>`:''}</div></button><button class="mv" data-mv="${i}|-1" ${i?'':'disabled'}>↑</button><button class="mv" data-mv="${i}|1" ${i<its.length-1?'':'disabled'}>↓</button></div>`).join('')||empty('📝','Empty. Tap ＋ Add.')}</div>`;
  const edit=x=>{const isNew=!x;let ic=x?x.ic:'🔧';
    openSheet(`<h3>${isNew?'Add to '+esc(L.t):'Edit'}</h3><input class="field" id="lin" placeholder="Name" value="${esc(x?x.n:'')}" ${x&&x.lock?'disabled':''}>${L.note?`<input class="field" id="lis" placeholder="Note (optional)" value="${esc(x?x.sub||'':'')}">`:''}
      ${L.icons?`<div class="chips">${ICONS.map(y=>`<button data-ic="${y}" aria-pressed="${y===ic}">${y}</button>`).join('')}</div>`:''}
      ${x&&x.lock?'<p class="hint">This one is used by the app and stays.</p>':`<button class="btn" id="liok">Save</button>`}${x&&!x.lock?'<button class="btn ghost jb-del" id="lidel">Delete</button>':''}`,el=>{
      el.querySelectorAll('[data-ic]').forEach(b=>b.onclick=()=>{ic=b.dataset.ic;el.querySelectorAll('[data-ic]').forEach(y=>y.setAttribute('aria-pressed',y===b));});
      const ok=el.querySelector('#liok');if(ok)ok.onclick=()=>{const n=$('#lin').value.trim();if(!n){toast('Type a name');return;}const nt=L.note?$('#lis').value.trim():'';const r=isNew?L.add(n,ic,nt):L.ren(x.id,n,ic,nt);if(r){toast(r);return;}
        if(isNew&&L.note&&nt){const it=L.custom.items[L.custom.items.length-1];it.note=nt;}save();closeSheet();render();};
      const dl=el.querySelector('#lidel');if(dl)dl.onclick=()=>{if(!x.c){L.del(x.id);save();closeSheet();render();return;}
        const others=its.filter(y=>y.id!==x.id);
        openSheet(`<h3>Delete “${esc(x.n)}”?</h3><p class="hint">It is used ${x.c} ${x.c===1?'time':'times'}. Move those to:</p><div class="list">${others.map(y=>`<button class="row" data-to="${esc(y.id)}"><div><b>${y.ic?y.ic+' ':''}${esc(y.n)}</b></div><span class="v">›</span></button>`).join('')}</div>${L.delAll?`<button class="btn ghost jb-del" id="lall">${L.delAll} (${x.c})</button>`:''}`,el2=>{
          el2.querySelectorAll('[data-to]').forEach(b=>b.onclick=()=>{L.del(x.id,b.dataset.to);save();closeSheet();render();toast('Deleted and moved');});
          const a=el2.querySelector('#lall');if(a)a.onclick=()=>confirmSheet(`Delete “${esc(x.n)}” and its ${x.c} ${L.delMsg}?`,'Delete',()=>{L.del(x.id);save();render();});});};});};
  $('#ladd').onclick=()=>edit();const el=$('#ledl');if(el)el.onclick=()=>mlistSheet(L.custom);
  $$('[data-le]').forEach(b=>b.onclick=()=>edit(its[+b.dataset.le]));
  $$('[data-mv]').forEach(b=>b.onclick=()=>{const [i,d]=b.dataset.mv.split('|');L.move(+i,+d);save();const y=scrollY;render();scrollTo(0,y);});};
SCREENS.menu=m=>{if(!can.settings()){go('more');return;}
  m.innerHTML=head('More menu')+`<p class="hint">Hide what you don't use. Hidden items still work, they just leave the menu. Lists, Users and Settings always stay.</p><div class="list">${MENU.map(([r,ic,t])=>`<label class="lrow tgl2"><span class="lname"><span class="ic">${ic}</span><div><b>${t}</b></div></span><input type="checkbox" data-hm="${r}" ${DB.hideMenu[r]?'':'checked'}></label>`).join('')}</div>`;
  $$('[data-hm]').forEach(b=>b.onchange=()=>{if(b.checked)delete DB.hideMenu[b.dataset.hm];else DB.hideMenu[b.dataset.hm]=1;save();});};

/* ---------- work done at other workshops ---------- */
function outwData(){const o={};DB.jobs.filter(isInvoiced).forEach(j=>{const T=jobTotals(j);Object.entries(T.ow).forEach(([w,x])=>{o[w]=o[w]||{owed:0,paid:0,jobs:[]};o[w].owed+=x;o[w].jobs.push([j,x]);});});
  DB.outPaid.forEach(p=>{o[p.who]=o[p.who]||{owed:0,paid:0,jobs:[]};o[p.who].paid+=p.amt;});return o;}
SCREENS.outw=m=>{if(!can.money()){go('home');return;}const o=outwData();const ks=Object.keys(o);
  m.innerHTML=head('Other workshops')+`<p class="hint">Work done for us at other workshops (from services marked “Done at another workshop”). Pay them here to keep track.</p>
  ${ks.map(w=>{const x=o[w],bal=x.owed-x.paid;return `<div class="card"><div class="h"><b>🏪 ${esc(w)}</b><b style="${bal>0.0005?'color:var(--orange)':''}">${f3(bal)}</b></div><span class="sub">Owed ${f3(x.owed)} · paid ${f3(x.paid)} · ${x.jobs.length} jobs</span>${bal>0.0005?`<button class="btn ghost sm" data-ow="${esc(w)}">Pay ${esc(w)}</button>`:''}</div>`;}).join('')||empty('🏪','Nothing yet. Mark a service as “Done at another workshop” in Services.')}
  ${DB.outPaid.length?sec('Payments')+`<div class="list">${DB.outPaid.slice().sort((a,b)=>b.t-a.t).map(p=>`<div class="row"><div><b>${esc(p.who)}</b><span>${fmtD(p.t)} · ${esc(p.by)}</span></div><span class="v">${f3(p.amt)}</span></div>`).join('')}</div>`:''}`;
  $$('[data-ow]').forEach(b=>b.onclick=()=>{const w=b.dataset.ow,bal=o[w].owed-o[w].paid;openSheet(`<h3>Pay ${esc(w)}</h3><input class="field" id="owa" inputmode="decimal" value="${f3(bal)}"><button class="btn" id="owok">Save payment</button>`,el=>el.querySelector('#owok').onclick=()=>{const a=num($('#owa').value);if(!a)return;DB.outPaid.push({who:w,amt:a,t:now(),by:S.user.name});save();closeSheet();render();});});};
/* ---------- WhatsApp message templates ---------- */
const MSGS=[
 ['ready','🚗','Car is ready','Customer',['name','car','plate','total','due','workshop','phone'],'السلام عليكم {name}،\nسيارتكم {car} جاهزة للاستلام.\nالمبلغ: {total}\n\n{workshop}'],
 ['estimate','🧾','Estimate','Customer',['name','car','plate','no','date','items','total','warranty','workshop','phone'],'السلام عليكم {name}،\nتقدير سعر رقم {no} لسيارتكم {car} {plate}:\n\n{items}\n\nالمجموع: {total}\n\n{workshop} · {phone}'],
 ['invoice','🧾','Invoice','Customer',['name','car','plate','no','date','items','total','paid','due','warranty','workshop','phone'],'{workshop}\nفاتورة رقم {no} · {date}\nالعميل: {name}\nالسيارة: {car} {plate}\n\n{items}\n\nالمجموع: {total}\nالمدفوع: {paid}\nالمتبقي: {due}\n\n{warranty}\n{phone}'],
 ['remind','🔔','Service reminder','Customer',['name','car','plate','service','workshop','phone'],'السلام عليكم {name}،\nوفقاً لسجلاتنا قد يكون حان موعد {service} لسيارتكم {car}.\nوفي حال أُجريت الخدمة مؤخراً فنعتذر عن هذا التذكير.\n\n{workshop}'],
 ['payreq','💳','Payment reminder','Customer',['name','due','items','workshop','phone'],'السلام عليكم {name}،\nنود تذكيركم بوجود مبلغ متبقٍ قدره {due}:\n{items}\n\nشاكرين لكم تعاونكم.\n{workshop} · {phone}'],
 ['hello','👋','WhatsApp a customer','Customer',['name','workshop','phone'],'السلام عليكم {name}،\n'],
 ['options','🛢','Service options (compare)','Customer',['name','car','plate','service','items','workshop','phone'],'السلام عليكم {name}،\nخيارات {service} لسيارتكم {car}:\n\n{items}\n\nالسعر شامل القطع والأجرة.\nرد برقم الخيار 👍\n{workshop}'],
 ['po','🚚','Order to a supplier','Supplier',['supplier','no','items','workshop','phone'],'السلام عليكم {supplier}،\nنرجو توفير الطلب رقم {no}:\n{items}\n\n{workshop} · {phone}']];
const VAR_L={name:'customer name',car:'car',plate:'plate',total:'total',paid:'paid',due:'left to pay',workshop:'workshop name',phone:'workshop phone',no:'number',date:'date',items:'list of items',warranty:'warranty text',service:'service',supplier:'supplier name',km:'km'};
function msgTpl(k){const m=DB.ws.msgs||{};if(m[k]!=null&&m[k]!=='')return m[k];if(k==='remind'&&DB.ws.remMsg)return DB.ws.remMsg;return (MSGS.find(x=>x[0]===k)||[])[5]||'';}
function msg(k,vars){const v=Object.assign({workshop:DB.ws.name,phone:DB.ws.phone||''},vars||{});
  return msgTpl(k).replace(/\{(\w+)\}/g,(a,n)=>v[n]!=null?v[n]:a).replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
const SAMPLE={name:'Salim',car:'Toyota Camry',plate:'12345 A',total:'12.500 ر.ع',paid:'10.000 ر.ع',due:'2.500 ر.ع',no:'1001',date:fmtD(Date.now()),items:'• تغيير زيت المحرك: 2.500\n• فلتر زيت: 3.000',warranty:'',service:'تغيير زيت المحرك',supplier:'Al Noor Parts',km:'85,000'};
SCREENS.msgs=m=>{if(!can.settings()){go('more');return;}
  m.innerHTML=head('WhatsApp messages')+`<p class="hint">Change the words the app writes when it opens WhatsApp. Words in {curly brackets} are filled in by the app.</p>
  <div class="list">${MSGS.map(([k,ic,t,who])=>{const cu=DB.ws.msgs&&DB.ws.msgs[k];return `<button class="mitem" data-mk="${k}"><span class="ic">${ic}</span><div><b>${t}</b><span>${who}${cu?' · changed':''}</span></div><span class="v">›</span></button>`;}).join('')}</div>`;
  $$('[data-mk]').forEach(b=>b.onclick=()=>{const [k,ic,t,who,vars,def]=MSGS.find(x=>x[0]===b.dataset.mk);
    openSheet(`<h3>${ic} ${t}</h3><textarea class="field" id="mt" dir="auto" rows="9">${esc(msgTpl(k))}</textarea>
     <div class="field-l">Tap to add</div><div class="chips">${vars.map(x=>`<button data-v="${x}">{${x}}<small style="opacity:.6;margin-left:4px">${VAR_L[x]}</small></button>`).join('')}</div>
     <div class="field-l">Preview</div><div class="mprev" id="mp" dir="auto"></div>
     <button class="btn" id="mok">Save</button><button class="btn ghost" id="mdef">Back to the default message</button>`,el=>{
      const ta=el.querySelector('#mt'),pv=()=>{const o=(DB.ws.msgs=DB.ws.msgs||{})[k];DB.ws.msgs[k]=ta.value;el.querySelector('#mp').textContent=msg(k,SAMPLE);if(o==null)delete DB.ws.msgs[k];else DB.ws.msgs[k]=o;};
      ta.oninput=pv;pv();
      el.querySelectorAll('[data-v]').forEach(x=>x.onclick=()=>{const s=ta.selectionStart??ta.value.length,e=ta.selectionEnd??s;ta.value=ta.value.slice(0,s)+'{'+x.dataset.v+'}'+ta.value.slice(e);ta.focus();const c=s+x.dataset.v.length+2;ta.setSelectionRange(c,c);pv();});
      el.querySelector('#mok').onclick=()=>{DB.ws.msgs=DB.ws.msgs||{};DB.ws.msgs[k]=ta.value.trim();if(k==='remind')DB.ws.remMsg='';save();closeSheet();render();toast('Saved');};
      el.querySelector('#mdef').onclick=()=>{ta.value=def;pv();};});});};
