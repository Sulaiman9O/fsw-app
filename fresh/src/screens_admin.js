/* ---------- MONEY ---------- */
function rangeOf(k){const d=new Date();const s=new Date(d.toLocaleString('en-US',{timeZone:'Asia/Muscat'}));s.setHours(0,0,0,0);
  if(k==='week')s.setDate(s.getDate()-6);if(k==='month')s.setDate(1);if(k==='year')s.setMonth(0,1);return s.getTime()-(new Date().getTimezoneOffset()+240)*60e3*0;}
function sumRange(from){const inv=DB.jobs.filter(j=>isInvoiced(j)&&j.inv.t>=from);const T=inv.map(jobTotals);
  const pays=DB.jobs.flatMap(j=>(j.pays||[]).filter(p=>p.t>=from));const exp=DB.expenses.filter(e=>e.t>=from).reduce((a,e)=>a+e.amt,0);
  return {n:inv.length,sales:T.reduce((a,t)=>a+t.sales,0),passOut:T.reduce((a,t)=>a+t.passOut,0),profit:T.reduce((a,t)=>a+t.profit,0),cost:T.reduce((a,t)=>a+t.cost,0),labour:T.reduce((a,t)=>a+t.labour,0),parts:T.reduce((a,t)=>a+t.parts,0),paid:pays.reduce((a,p)=>a+p.amt,0),byM:pays.reduce((o,p)=>(o[p.m]=(o[p.m]||0)+p.amt,o),{}),exp,inv};}
SCREENS.money=m=>{if(!can.money()){go('home');return;}
  const due=dueInvoices().sort((a,b)=>a.inv.t-b.inv.t),dt=due.reduce((a,j)=>a+jobTotals(j).due,0),cd=(+DB.ws.credDays||30)*864e5;
  const td=sumRange(rangeOf('today')),wk=sumRange(rangeOf('week'));
  m.innerHTML=head('Money')+`
  <div class="kpis2"><div class="kpi org"><b>${f3(dt)}</b><span>Due from customers</span></div><div class="kpi ok"><b>${f3(wk.sales)}</b><span>Sales · last 7 days</span></div></div>
  ${sec('Today')}<div class="kpis3"><div class="kpi"><b>${f3(td.sales)}</b><span>Invoiced · ${td.n}</span></div><div class="kpi"><b>${f3(td.paid)}</b><span>Collected</span></div><div class="kpi"><b>${f3(td.exp)}</b><span>Expenses</span></div></div>
  <div class="two"><button class="btn ghost sm" data-go="close">🔒 Daily close</button><button class="btn ghost sm" data-go="exp">🧾 Expenses</button></div>
  <div class="two"><button class="btn ghost sm" data-go="reports">📊 Reports</button><button class="btn ghost sm" data-go="outw">🏪 Other workshops</button></div>
  ${sec('Collect first · '+due.length,`older than ${DB.ws.credDays||30} days in red`)}
  <div class="jb-list">${due.map(j=>{const c=custOf(j),v=vehOf(j),T=jobTotals(j),old=now()-j.inv.t>cd;return `<button class="jb-r it" data-go="inv:${j.id}"><div>${esc(c.name||'')}<small>#${j.inv.no} · ${esc(carName(v))} · ${ago(j.inv.t)}</small></div><b style="${old?'color:var(--bad)':''}">${f3(T.due)}</b></button>`;}).join('')||'<div class="jb-r"><div>Nothing due 👌</div></div>'}</div>`;};
SCREENS.exp=m=>{const f=rangeOf('month');const list=DB.expenses.slice().sort((a,b)=>b.t-a.t);const mon=DB.expenses.filter(e=>e.t>=f);
  const byC={};mon.forEach(e=>byC[e.cat]=(byC[e.cat]||0)+e.amt);
  m.innerHTML=head('Expenses',`<button class="lnk" id="eadd">＋ Expense</button>`)+`
  <div class="kpis2"><div class="kpi red"><b>${f3(mon.reduce((a,e)=>a+e.amt,0))}</b><span>This month</span></div><div class="kpi"><b>${mon.length}</b><span>Entries</span></div></div>
  ${Object.keys(byC).length?sec('This month by type')+`<div class="list">${Object.entries(byC).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="row"><div><b>${esc(c)}</b></div><span class="v">${f3(v)}</span></div>`).join('')}</div>`:''}
  ${sec('All')}<div class="list">${list.map(e=>`<button class="row" data-ee="${e.id}"><div><b>${esc(e.cat)}</b><span>${fmtD(e.t)}${e.note?' · '+esc(e.note):''}${e.monthly?' · monthly':''}</span></div><span class="v">${f3(e.amt)}</span></button>`).join('')||empty('🧾','No expenses yet. Add rent and salaries first.')}</div>`;
  const edit=e=>{const isNew=!e;e=e||{cat:DB.ecats[0],amt:0,t:now()};openSheet(`<h3>${isNew?'New expense':'Edit expense'}</h3><select class="field" id="ec">${DB.ecats.map(c=>`<option ${e.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select><input class="field" id="ea" inputmode="decimal" placeholder="Amount" value="${e.amt?f3(e.amt):''}"><input class="field" id="en" placeholder="Note" value="${esc(e.note||'')}"><label class="chk"><input type="checkbox" id="em" ${e.monthly?'checked':''}> Every month (rent, salaries…)</label><button class="btn" id="eok">Save</button>${!isNew?'<button class="btn ghost jb-del" id="edel">Delete</button>':''}`,el=>{
    el.querySelector('#eok').onclick=()=>{const a=num($('#ea').value);if(!a){toast('Type the amount');return;}if(isNew){e.id=uid('e');e.by=S.user.name;DB.expenses.push(e);}e.cat=$('#ec').value;e.amt=a;e.note=$('#en').value.trim();e.monthly=$('#em').checked;save();closeSheet();render();};
    const d=el.querySelector('#edel');if(d)d.onclick=()=>{audit('delete','Expense '+e.cat+' '+f3(e.amt));DB.expenses=DB.expenses.filter(x=>x!==e);save();closeSheet();render();};});};
  $('#eadd').onclick=()=>edit();$$('[data-ee]').forEach(b=>b.onclick=()=>edit(DB.expenses.find(x=>x.id===b.dataset.ee)));};
SCREENS.close=m=>{const td=sumRange(rangeOf('today'));const cash=td.byM.Cash||0;const cashExp=DB.expenses.filter(e=>dayKey(e.t)===today()&&e.cash).reduce((a,e)=>a+e.amt,0);
  const last=DB.closes.slice().sort((a,b)=>b.t-a.t)[0];const opening=last?last.counted:(+DB.openingCash||0);const expect=opening+cash-cashExp;const done=DB.closes.find(c=>c.date===today());
  const openJ=openJobs();
  m.innerHTML=head('Daily close · '+fmtDs(now()))+`
  <div class="jb-list"><div class="jb-r"><div>Opening cash<small>${last?'from last close':'set in Settings'}</small></div><b>${f3(opening)}</b></div><div class="jb-r"><div>+ Cash payments today</div><b>${f3(cash)}</b></div>${Object.entries(td.byM).filter(([k])=>k!=='Cash').map(([k,v])=>`<div class="jb-r"><div>${esc(k)}<small>not in the drawer</small></div><b>${f3(v)}</b></div>`).join('')}<div class="jb-r tot"><div>Cash expected in the drawer</div><b>${f3(expect)}</b></div></div>
  ${done?`<div class="card ${Math.abs(done.diff)>0.0005?'note':''}"><div class="h"><b>Closed by ${esc(done.by)} at ${hm(done.t)}</b></div><span class="sub">Counted ${f3(done.counted)} · ${Math.abs(done.diff)<=0.0005?'matches ✓':'difference '+f3(done.diff)}</span></div>`
  :`<label class="field-l">Cash counted in the drawer<input class="field" id="ccnt" inputmode="decimal" placeholder="0.000"></label><button class="btn" id="cok">Close the day</button>`}
  ${openJ.length?sec('Still open · '+openJ.length,'close them or write why')+`<div class="list">${openJ.map(carRow).join('')}</div>`:''}
  ${sec('Past closes')}<div class="list">${DB.closes.slice().sort((a,b)=>b.t-a.t).slice(0,14).map(c=>`<div class="row"><div><b>${fmtD(c.t)}</b><span>${esc(c.by)} · expected ${f3(c.expected)}</span></div><span class="v ${Math.abs(c.diff)>0.0005?'bad':''}">${f3(c.counted)}<small>${Math.abs(c.diff)>0.0005?(c.diff>0?'+':'')+f3(c.diff):'✓'}</small></span></div>`).join('')||empty('🔒','No closes yet.')}</div>`;
  const ok=$('#cok');if(ok)ok.onclick=()=>{const v=$('#ccnt').value.trim();if(v===''){toast('Count the cash first');return;}const c=num(v);audit('close','Daily close');DB.closes.push({date:today(),t:now(),by:S.user.name,expected:expect,counted:c,diff:c-expect});save();render();};};
SCREENS.reports=m=>{if(!can.money()){go('home');return;}const k=S.p.k||'month';const R=sumRange(rangeOf(k));
  const svc={},prt={};R.inv.forEach(j=>(j.items||[]).forEach(i=>{const o=i.k==='part'?prt:svc;o[i.d]=o[i.d]||{n:0,a:0};o[i.d].n+=(+i.q||0);o[i.d].a+=(+i.q||0)*(+i.p||0);}));
  const top=o=>Object.entries(o).sort((a,b)=>b[1].a-a[1].a).slice(0,10);
  const days={};DB.jobs.filter(j=>isInvoiced(j)&&j.inv.t>=rangeOf(k)).forEach(j=>{const d=new Date(j.inv.t).toLocaleDateString('en-GB',{weekday:'short',timeZone:'Asia/Muscat'});days[d]=(days[d]||0)+1;});
  m.innerHTML=head('Reports')+`<div class="chips">${[['today','Today'],['week','7 days'],['month','This month'],['year','This year']].map(([x,l])=>`<button data-k="${x}" aria-pressed="${k===x}">${l}</button>`).join('')}</div>
  <div class="kpis3"><div class="kpi ok"><b>${f3(R.sales)}</b><span>Sales · ${R.n} invoices</span></div><div class="kpi"><b>${f3(R.paid)}</b><span>Collected</span></div><div class="kpi red"><b>${f3(R.exp)}</b><span>Expenses</span></div></div>
  ${can.cost()?`<div class="kpis3"><div class="kpi"><b>${f3(R.labour)}</b><span>Labour</span></div><div class="kpi"><b>${f3(R.parts-R.cost)}</b><span>Profit on parts</span></div><div class="kpi ${R.profit-R.exp>=0?'ok':'red'}"><b>${f3(R.profit-R.exp)}</b><span>Net after expenses</span></div></div>`:''}
  ${R.passOut>0.0005?`<p class="hint">${f3(R.passOut)} of work done at other workshops is not counted in sales.</p>`:''}
  ${(()=>{const cm={};R.inv.forEach(j=>(j.items||[]).forEach(i=>{if(+i.comm&&i.by){cm[i.by]=(cm[i.by]||0)+(+i.comm)*(+i.q||1);}}));const e=Object.entries(cm);return can.cost()&&e.length?sec('Commission')+`<div class="list">${e.sort((a,b)=>b[1]-a[1]).map(([n,v])=>`<div class="row"><div><b>${esc(n)}</b></div><span class="v">${f3(v)}</span></div>`).join('')}</div>`:'';})()}
  ${(()=>{const g={};R.inv.forEach(j=>(j.items||[]).forEach(i=>{if(i.rxk==='oil'&&i.k!=='part'){const k=i.rxg||'other';g[k]=(g[k]||0)+1;}}));const n=Object.values(g).reduce((a,b)=>a+b,0);return n?sec('🛢 Oil change choices',n+' oil changes')+`<div class="list">${Object.entries(g).sort((a,b)=>b[1]-a[1]).map(([k,c])=>`<div class="nh-row"><b>${GRADE[k]?GRADE[k][0]:'Other'}</b><span class="r">${Math.round(c/n*100)}%</span><span class="m">${c} times</span><div class="nh-bar"><i style="width:${Math.round(c/n*100)}%;background:var(--ok)"></i></div></div>`).join('')}</div>`:'';})()}
  ${sec('Top services')}<div class="list">${top(svc).map(([n,o])=>`<div class="row"><div><b>${esc(n)}</b><span>${o.n} times</span></div><span class="v">${f3(o.a)}</span></div>`).join('')||empty('📊','No invoices in this period.')}</div>
  ${sec('Top parts')}<div class="list">${top(prt).map(([n,o])=>`<div class="row"><div><b>${esc(n)}</b><span>${+o.n.toFixed(2)} sold</span></div><span class="v">${f3(o.a)}</span></div>`).join('')||''}</div>
  ${Object.keys(days).length?sec('Invoices by day of week')+`<div class="list">${['Sat','Sun','Mon','Tue','Wed','Thu','Fri'].filter(d=>days[d]).map(d=>`<div class="nh-row"><b>${d}</b><span class="r">${days[d]}</span><span class="m"></span><div class="nh-bar"><i style="width:${Math.round(days[d]/Math.max(...Object.values(days))*100)}%;background:var(--red)"></i></div></div>`).join('')}</div>`:''}`;
  $$('[data-k]').forEach(b=>b.onclick=()=>{S.p.k=b.dataset.k;render();});};
/* ---------- SETUP · 100 steps ---------- */
const STEP_LINK={profile:'settings',logo:'settings',vat:'settings',invno:'settings',warranty:'settings',pay:'list:pay',cred:'settings',remind:'settings',remmsg:'settings',backup:'settings',backup2:'settings',manager:'users',worker:'users',owner:'users',svc:'svc',svcadd:'svc',pcat:'list:pcat',oils:'stock',filters:'stock',pprice:'stock',pcost:'stock',reorder:'stock',vendors:'vendors',po:'vendors',porec:'vendors',canned:'canned',insp:'insp',expcat:'list:pcat',exp:'exp',cust5:'cust',job1:'newjob',est2job:'work',inv1:'work',pay3:'money',ret:'work',outside:'work',rem1:'cust',close1:'close',count1:'count'};
SCREENS.setup=m=>{const [d,t]=stepsProgress();const open=S.p.w||STEPS.find(([w,,l])=>l.some(([,a],i)=>!stepDone(w,i,a)))?.[0]||'w1';
  m.innerHTML=head('Setup · 100 steps',`${d}/${t}`)+`<div class="prog"><i style="width:${d/t*100}%"></i></div>
  <p class="hint">Ticks with ✨ tick themselves when the app sees it done. Tap a step with › to go there.</p>
  ${STEPS.map(([w,title,list])=>{const dn=list.filter(([,a],i)=>stepDone(w,i,a)).length;const isO=open===w;return `<button class="wk${isO?' on':''}" data-w="${w}"><b>${title}</b><span>${dn}/${list.length}</span></button>${isO?`<div class="steps">${list.map(([txt,a],i)=>{const done=stepDone(w,i,a);const autoDone=!DB.steps[stepKey(w,i)]&&done;const n=STEPS.slice(0,STEPS.findIndex(x=>x[0]===w)).reduce((s,x)=>s+x[2].length,0)+i+1;return `<div class="stp${done?' done':''}"><button class="cb" data-st="${w}|${i}" ${autoDone?'disabled':''}>${done?'✓':''}</button><div><span class="n">${n}</span>${esc(txt)}${autoDone?' <em>✨</em>':''}</div>${a&&STEP_LINK[a]?`<button class="lnk" data-go="${STEP_LINK[a]}">›</button>`:''}</div>`;}).join('')}</div>`:''}`;}).join('')}`;
  $$('[data-w]').forEach(b=>b.onclick=()=>{S.p.w=S.p.w===b.dataset.w&&open===b.dataset.w?'none':b.dataset.w;render();});
  $$('[data-st]').forEach(b=>b.onclick=()=>{const [w,i]=b.dataset.st.split('|');const k=stepKey(w,+i);DB.steps[k]=!DB.steps[k];if(!DB.steps[k])delete DB.steps[k];save();S.keep=scrollY;render();scrollTo(0,S.keep);});};
/* ---------- SETTINGS ---------- */
SCREENS.settings=m=>{if(!can.settings()){go('more');return;}const w=DB.ws;
  m.innerHTML=head('Settings')+`
  ${sec('Workshop')}
  <div class="logo-up"><label>${w.logo?`<img src="${w.logo}" alt="">`:'<span class="wsmark big">＋</span>'}<input type="file" accept="image/*" id="slogo" hidden><span>${w.logo?'Change logo':'Upload logo'}</span></label>${w.logo?'<button class="lnk" id="slogox">Remove</button>':''}</div>
  <input class="field" id="sname" placeholder="Workshop name" value="${esc(w.name)}"><div class="in2"><input class="field" id="sphone" inputmode="tel" placeholder="Phone" value="${esc(w.phone||'')}"><input class="field" id="saddr" placeholder="Area / city" value="${esc(w.addr||'')}"></div>
  <input class="field" id="scr" placeholder="Commercial registration no. (optional)" value="${esc(w.cr||'')}">
  ${sec('Invoices')}
  <div class="in2"><label class="field-l">Next invoice number<input class="field" id="sinv" inputmode="numeric" value="${w.nextInv}"></label><label class="field-l">Credit days<input class="field" id="scred" inputmode="numeric" value="${w.credDays}"></label></div>
  <label class="chk"><input type="checkbox" id="svat" ${w.vat?'checked':''}> VAT registered (if not, leave off)</label>
  <label class="field-l">Warranty / footer text<textarea class="field" id="swar" rows="2" placeholder="e.g. 3 months warranty on labour. Parts as per maker.">${esc(w.warranty||'')}</textarea></label>
  <button class="mitem" data-go="list:pay"><span class="ic">💳</span><div><b>Payment methods</b><span>${esc(w.pay.join(', '))}</span></div><span class="v">›</span></button>
  ${sec('Reminders')}
  <div class="in2"><label class="field-l">Engine oil · months<input class="field" id="srm" inputmode="numeric" value="${w.remMonths}"></label><label class="field-l">Engine oil · km<input class="field" id="srk" inputmode="numeric" value="${w.remKm}"></label></div>
  <button class="mitem" data-go="msgs"><span class="ic">💬</span><div><b>WhatsApp messages</b><span>Customers, reminders, estimates, invoices, suppliers</span></div><span class="v">›</span></button>
  ${sec('Lists')}
  <button class="mitem" data-go="lists"><span class="ic">🗂</span><div><b>All lists</b><span>Service groups, part categories, units, car makes, expense types, your own lists</span></div><span class="v">›</span></button>
  <label class="field-l">Opening cash in the drawer<input class="field" id="soc" inputmode="decimal" value="${DB.openingCash?f3(DB.openingCash):''}"></label>
  <button class="btn" id="ssave">Save settings</button>
  ${sec('✨ Smart services')}
  <label class="chk"><input type="checkbox" id="ssmart" ${sx('smart')?'checked':''}> Compare options when adding oil change, plugs, pads, battery (off = always add normally)</label>
  ${sec('✨ Look')}
  <label class="field-l">Language / اللغة</label>
  <div class="chips" id="slang" data-notr><button data-l="en" aria-pressed="${(w.lang||'en')==='en'}">English</button><button data-l="ar" aria-pressed="${w.lang==='ar'}">العربية</button></div>
  <label class="field-l">Light or dark</label>
  <div class="chips" id="smode">${[['auto','◐ Auto (like the phone)'],['light','☀️ Light'],['dark','🌙 Dark']].map(([k,t])=>`<button data-m="${k}" aria-pressed="${(w.mode||'auto')===k}">${t}</button>`).join('')}</div>
  <label class="field-l">Colours</label>
  <div class="themes" id="sthm">${LOOKS.map(([k,t,a,b])=>`<button data-t="${k}" aria-pressed="${(w.theme||'shopflo')===k}"><i style="background:linear-gradient(135deg,${a},${b})"></i><b>${t}</b></button>`).join('')}</div>
  <label class="chk"><input type="checkbox" id="smo" ${w.motionOff?'':'checked'}> Motion and animations (smooth screens, numbers count up)</label>
  ${sec('🧪 Test data')}
  <p class="hint">Fake customers, cars, suppliers, parts and jobs to try the app. All have 🧪 in the name. Remove them before real work.</p>
  ${hasDemo()?'<button class="btn ghost sm" id="sdemox">Remove test data</button>':'<button class="btn ghost sm" id="sdemo">🧪 Add test data</button>'}
  ${sec('☁️ Online sync')}
  <div id="sysec">${syncSection()}</div>
  ${sec('📥 Services and parts list')}
  <p class="hint">Bring in a ready list of services and parts from a file. It replaces the ones on this device.</p>
  <button class="btn ghost sm" id="scat">📥 Import services and parts</button>
  ${sec('Storage')}<p class="hint" id="stor">💾 ${storeLabel()}</p>
  ${sec('Backup')}
  <p class="hint">Everything stays on this device only. Make a locked backup every week.</p>
  <div class="two"><button class="btn ghost sm" id="sbk">⬇️ Make backup</button><button class="btn ghost sm" id="srs">⬆️ Restore</button></div>
  <button class="btn ghost jb-del" id="swipe">🗑 Delete all data</button>`;
  $('#slogo').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,600/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);w.logo=c.toDataURL('image/png');save();render();};im.src=r.result;};r.readAsDataURL(f);};
  const lx=$('#slogox');if(lx)lx.onclick=()=>{w.logo='';save();render();};
  $('#ssave').onclick=()=>{w.name=$('#sname').value.trim()||w.name;w.phone=$('#sphone').value.trim();w.addr=$('#saddr').value.trim();w.cr=$('#scr').value.trim();w.nextInv=Math.max(1,parseInt($('#sinv').value)||w.nextInv);w.invStart=w.invStart||w.nextInv;w.credDays=parseInt($('#scred').value)||30;w.vat=$('#svat').checked;w.vatDecided=true;w.warranty=$('#swar').value.trim();
    w.remMonths=parseInt($('#srm').value)||6;w.remKm=parseInt($('#srk').value)||7000;
    DB.openingCash=num($('#soc').value);audit('settings','Settings saved');save();toast('Saved');render();};
  $('#ssmart').onchange=e=>{DB.ws.sxOff=DB.ws.sxOff||{};if(e.target.checked)delete DB.ws.sxOff.smart;else DB.ws.sxOff.smart=1;save();toast(e.target.checked?'Smart services on':'Smart services off');};
  $$('#slang [data-l]').forEach(b=>b.onclick=()=>{w.lang=b.dataset.l;save();audit('settings','Language '+w.lang);render();});
  $$('#smode [data-m]').forEach(b=>b.onclick=()=>{w.mode=b.dataset.m;save();lookApply();render();});
  $$('#sthm [data-t]').forEach(b=>b.onclick=()=>{w.theme=b.dataset.t;save();lookApply();render();});
  $('#smo').onchange=e=>{w.motionOff=!e.target.checked;save();toast(w.motionOff?'Animations off':'Animations on');MV.key='';render();};
  const sd=$('#sdemo');if(sd)sd.onclick=()=>{loadDemo();};const sdx=$('#sdemox');if(sdx)sdx.onclick=()=>confirmSheet('Remove all test data (everything with 🧪)? Your real data stays.','Remove test data',removeDemo);
  syncBind();
  $('#scat').onclick=catalogSheet;
  $('#sbk').onclick=backupSheet;
  $('#srs').onclick=restoreSheet;
  $('#swipe').onclick=wipeDataSheet;};
/* delete the workshop's data on this device and online. Kept: the workshop name and settings, the users (names and PINs)
   and the online sign-in. Other synced devices get the same deletion through sync. The delete button unlocks after 6 seconds. */
function wipeDataSheet(){const cl=typeof SYNC!=='undefined'&&SYNC.user;let n=6,tm=0;
  openSheet(`<h3>⚠️ Delete all data</h3><div class="wipebox"><p>${cl?'This deletes customers, cars, job cards, invoices, payments, services, parts and stock, suppliers, expenses and reports on this device, online and on every synced device.':'This deletes customers, cars, job cards, invoices, payments, services, parts and stock, suppliers, expenses and reports on this device.'}</p><p>${cl?'Kept: the workshop name and settings, the users and their PINs, and the online sign-in.':'Kept: the workshop name and settings, the users and their PINs.'}</p><p class="err">This cannot be undone. Make a backup first if you may need the data.</p></div><button class="btn danger" id="wdgo" disabled>Delete all data (${n})</button>`,el=>{
    const bt=el.querySelector('#wdgo');tm=setInterval(()=>{n--;if(!document.body.contains(bt)){clearInterval(tm);return;}if(n<=0){clearInterval(tm);bt.disabled=false;bt.textContent=T_('Delete all data');}else bt.textContent=T_('Delete all data ({n})').replace('{n}',n).replace('{0}',n);},1000);
    bt.onclick=async()=>{if(bt.disabled)return;bt.disabled=true;closeSheet();wipeData();await flushNow();if(cl){try{await syncPushNow();}catch(e){}}toast('All data deleted');go('home');};});}
function wipeData(){const b=blankDB(),keep=['v','ws','users','pcats','ecats','insp','canned','seenNews'];
  Object.keys(DB).forEach(k=>{if(keep.includes(k))return;if(k in b)DB[k]=b[k];else delete DB[k];});
  DB.ws.nextJob=1;DB.ws.nextInv=DB.ws.invStart||1001;DB.ws.resetAt=Date.now();delete DB.ws.mainAt;
  audit('settings','All data deleted · '+((S.user&&S.user.name)||''));save();}
/* ---------- USERS ---------- */
SCREENS.users=m=>{if(!can.settings()){go('more');return;}
  const nCust=u=>u.role!=='owner'&&u.perm?Object.keys(u.perm).length:0;
  m.innerHTML=head('Users',`<button class="lnk" id="uadd">＋ Add</button>`)+`
  <div class="card note"><b>Who can do what</b><span class="sub"><b>Owner</b>: everything.<br><b>Manager</b> and <b>Worker</b> start with a set of permissions. Tap a person to turn each one on or off.</span></div>
  <div class="list">${DB.users.map(u=>`<button class="row" data-ue="${u.id}"><div style="display:flex;gap:12px;align-items:center"><span class="av" style="background:${u.color}">${initials(u.name)}</span><div><b>${esc(u.name)}</b><span>${ROLE[u.role]}${nCust(u)?' · custom permissions':''}</span></div></div><span class="v">Edit</span></button>`).join('')}</div>`;
  const edit=u=>{const isNew=!u;u=u||{role:'worker'};let role=u.role;let pm=Object.assign({},u.perm||{});
    openSheet(`<h3>${isNew?'New user':'Edit '+esc(u.name)}</h3><input class="field" id="un" placeholder="Name" value="${esc(u.name||'')}">
     <div class="chips" id="uro"></div>
     <label class="field-l">Language for this person</label><div class="chips" id="ulg" data-notr></div>
     <input class="field" id="up" inputmode="numeric" maxlength="4" placeholder="${isNew?'4-number PIN':'New PIN (leave empty to keep)'}">
     <div class="field-l" style="display:flex;justify-content:space-between;align-items:center">What ${isNew?'they':esc(u.name)} can see and do <button class="lnk" id="urst" style="min-height:0;padding:0">Reset to ${'role'}</button></div>
     <div class="list" id="upm"></div>
     <button class="btn" id="uok">Save</button>${!isNew&&u.id!==S.user.id?'<button class="btn ghost jb-del" id="udel">Remove user</button>':''}`,el=>{
     let ulang=u.lang||'';const dl=()=>{el.querySelector('#ulg').innerHTML=[['',T_('Same as workshop')],['en','English'],['ar','العربية']].map(([k,t])=>`<button data-ul="${k}" aria-pressed="${ulang===k}">${t}</button>`).join('');el.querySelectorAll('[data-ul]').forEach(b=>b.onclick=()=>{ulang=b.dataset.ul;dl();});};dl();
     const draw=()=>{el.querySelector('#uro').innerHTML=['owner','manager','worker'].map(r=>`<button data-r="${r}" aria-pressed="${role===r}">${ROLE[r]}</button>`).join('');
       el.querySelector('#urst').hidden=role==='owner'||!Object.keys(pm).length;
       el.querySelector('#upm').innerHTML=role==='owner'?'<p class="hint">The owner can see and do everything.</p>':PERMS.map(([k,t,d])=>{const on=k in pm?!!pm[k]:roleDef(role,k);return `<label class="lrow tgl2"><span class="lname"><div><b>${t}${k in pm?' <span class="tg tgr">changed</span>':''}</b><span>${d}</span></div></span><input type="checkbox" data-pk="${k}" ${on?'checked':''}></label>`;}).join('');
       el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{role=b.dataset.r;pm={};draw();});
       el.querySelectorAll('[data-pk]').forEach(b=>b.onchange=()=>{const k=b.dataset.pk;if(b.checked===roleDef(role,k))delete pm[k];else pm[k]=b.checked;draw();});};
     draw();el.querySelector('#urst').onclick=()=>{pm={};draw();};
     el.querySelector('#uok').onclick=async()=>{const n=$('#un').value.trim();const pin=$('#up').value.trim();if(!n){toast('Type a name');return;}if(isNew&&!/^\d{4}$/.test(pin)){toast('PIN must be 4 numbers');return;}if(pin&&!/^\d{4}$/.test(pin)){toast('PIN must be 4 numbers');return;}
       if(!isNew&&u.role==='owner'&&role!=='owner'&&DB.users.filter(x=>x.role==='owner').length===1){toast('Keep at least one owner');return;}
       if(isNew){u.id=uid('u');u.color=COLORS[DB.users.length%COLORS.length];DB.users.push(u);}audit('user',(isNew?'Added user ':'Changed user ')+n+' · '+ROLE[role]+(Object.keys(pm).length&&role!=='owner'?' · permissions: '+Object.entries(pm).map(([k,v])=>(v?'+':'−')+k).join(' '):'')+(pin?' · new PIN':''));u.name=n;u.role=role;if(ulang)u.lang=ulang;else delete u.lang;u.perm=role==='owner'?{}:pm;if(pin)u.pin=await hashPin(pin);save();closeSheet();render();};
     const d=el.querySelector('#udel');if(d)d.onclick=()=>confirmSheet('Remove '+esc(u.name)+'?','Remove',()=>{audit('user','Removed user '+u.name);DB.users=DB.users.filter(x=>x!==u);save();render();});});};
  $('#uadd').onclick=()=>edit();$$('[data-ue]').forEach(b=>b.onclick=()=>edit(DB.users.find(x=>x.id===b.dataset.ue)));};
/* ---------- MORE ---------- */
SCREENS.more=m=>{const [d,t]=stepsProgress();const it=(r,ic,t2,s,show=true)=>show&&routeOk(r)&&!DB.hideMenu[r]?`<button class="mitem" data-go="${r}"><span class="ic">${ic}</span><div><b>${t2}</b><span>${s}</span></div><span class="v">›</span></button>`:'';
  const ml=DB.mlists.filter(L=>L.inMenu!==false);
  m.innerHTML=head('More')+`<div class="list">
  ${it('news','🎉','What\'s new · how to use',newsUnseen().length?'<b style="color:var(--red2)">'+newsUnseen().length+' new</b> · tap to see':'Tours of every new thing')}${it('setup','✅','Setup · 100 steps',`${d} of ${t} done`)}
  ${it('svc','🛠','Services',DB.services.length+' services · '+DB.scats.length+' groups')}
  ${it('stock','🛢','Stock',DB.parts.length+' parts')}
  ${it('vendors','🚚','Suppliers & orders',DB.vendors.length+' suppliers')}
  ${it('canned','📦','Canned jobs',DB.canned.length+' sets')}
  ${it('insp','📋','Inspection checklists',DB.insp.length+' checklists')}
  ${it('count','🔢','Daily count','5 items a day')}
  ${it('money','💰','Money','Due, today, collect',can.money())}
  ${it('exp','🧾','Expenses','Rent, salaries, supplies',can.money())}
  ${it('close','🔒','Daily close','Match the cash drawer',can.money())}
  ${it('reports','📊','Reports','Sales, profit, top items',can.money())}
  </div>
  ${ml.length?sec('Your lists')+`<div class="list">${ml.map(L=>it('list:'+L.id,L.ic||'📝',esc(L.name),L.items.length+' items')).join('')}</div>`:''}
  ${can.settings()?sec('Customize')+`<div class="list">${it('lists','🗂','Lists','Groups, categories, units, payment methods, your own lists')}${it('audit','📜','Activity log','Who did what and when')}${it('msgs','💬','WhatsApp messages','Customers, reminders, suppliers')}${it('users','👥','Users','Who sees what')}${it('settings','⚙️','Settings','Workshop, invoices, backup')}</div>`:''}
  <button class="btn ghost" id="lo">Log out (${esc(S.user.name)})</button><p class="hint" id="verh" style="text-align:center" data-notr>ShopFlo ${esc(window.WS_VN||"")}</p>`;
  $('#lo').onclick=()=>{S.user=null;render();};};
/* ---------- print CSS ---------- */
const INV_CSS='.inv-t .ar0{letter-spacing:0;text-transform:none}.inv{background:#fff;color:#000;font-size:3.3mm;line-height:1.3;padding:0}.inv .ar{direction:rtl}.inv-hd{display:flex;align-items:center;gap:4mm;border-bottom:.5mm solid #000;padding-bottom:3mm}.inv-hd img{max-width:40mm;max-height:18mm}.inv-ws{display:grid;gap:.4mm;margin-left:auto;text-align:right}.inv-ws b{font-size:4mm}.inv-ws span{font-size:2.8mm}.inv-ttl{display:flex;justify-content:space-between;align-items:baseline;margin:3mm 0 2.5mm}.inv-ttl b{font-size:5mm;letter-spacing:.1em}.inv-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5mm 4mm;border:.3mm solid #000;border-radius:1.5mm;padding:2mm 3mm;margin-bottom:3mm}.inv-meta small{display:block;font-size:2.3mm;color:#555;text-transform:uppercase;letter-spacing:.08em}.inv .mono{font-family:monospace}.inv-t{width:100%;border-collapse:collapse}.inv-t th{font-size:2.5mm;letter-spacing:.1em;border-bottom:.4mm solid #000;padding:1.2mm 1mm;text-align:left}.inv-t td{padding:1.4mm 1mm;border-bottom:.2mm solid #ccc;vertical-align:top}.inv-t td small{color:#555;font-size:2.5mm;margin-left:1.5mm}.inv-t .n{width:6mm;color:#888}.inv-t .q,.inv-t .u,.inv-t .a{text-align:right;white-space:nowrap}.inv-t .q{width:12mm}.inv-t .u{width:18mm;color:#555}.inv-t .a{width:20mm;font-weight:700}.inv-t .grp td{white-space:nowrap;border-bottom:.3mm solid #000;padding-top:3mm;font-size:2.6mm;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.inv-sum{margin-left:auto;width:70mm;margin-top:3mm;border-top:.3mm solid #000}.inv-sum div{display:flex;justify-content:space-between;padding:1.2mm 1mm}.inv-sum .tot{border-top:.5mm solid #000;font-weight:800;font-size:4.4mm;padding-top:2mm;margin-top:1mm}.inv-paid{display:inline-block;border:.6mm solid #000;border-radius:1.5mm;padding:1mm 3mm;font-weight:800;letter-spacing:.1em;margin-top:3mm;transform:rotate(-3deg)}.inv-ft{margin-top:5mm;text-align:center;font-size:2.9mm;color:#333}';
const STK_CSS='.wstk{width:62mm;padding:3mm;box-sizing:border-box;font-family:Arial,sans-serif;color:#000;background:#fff;display:grid;gap:1.6mm}.wstk .wh{display:flex;align-items:center;justify-content:center;gap:2mm}.wstk .wh img{max-height:12mm;max-width:36mm}.wstk .wh b{font-size:3.4mm}.wstk .wbar{background:#000;color:#fff;text-align:center;font-weight:700;font-size:2.7mm;padding:1mm;border-radius:1mm}.wstk .wtwo{display:grid;grid-template-columns:1fr auto 1fr;gap:1.5mm;align-items:center}.wstk .wtwo div{border:.45mm solid #000;border-radius:1.2mm;padding:1.2mm 1.5mm;display:grid}.wstk .wtwo small{font-size:1.9mm;font-weight:700}.wstk .wtwo b{font-size:3.8mm;white-space:nowrap}.wstk em{font-style:normal;font-weight:800;font-size:3.2mm}.wstk .wft{display:flex;justify-content:space-between;font-size:2.1mm;border-top:.3mm dashed #000;padding-top:1mm}';
