/* ---------- MONEY ---------- */
const RANGE_C={};/* the same answer within a second: reports used to ask it once per invoice */
function rangeOf(k){const n=Date.now(),c=RANGE_C[k];if(c&&n-c[0]<1000)return c[1];const v=rangeOf0(k);RANGE_C[k]=[n,v];return v;}
/* midnight in Oman (UTC+4, no daylight saving), whatever the device's own time zone */
function rangeOf0(k){let [y,m,d]=today().split('-').map(Number);m--;
  if(k==='week')d-=6;if(k==='month')d=1;if(k==='year'){m=0;d=1;}return Date.UTC(y,m,d)-4*3600e3;}
function sumRange(from){const inv=DB.jobs.filter(j=>isInvoiced(j)&&j.inv.t>=from);const T=inv.map(jobTotals);
  const pays=DB.jobs.flatMap(j=>(j.pays||[]).filter(p=>p.t>=from&&!isCreditM(p.m)));const exp=DB.expenses.filter(e=>e.t>=from).reduce((a,e)=>a+e.amt,0);
  return {n:inv.length,sales:T.reduce((a,t)=>a+t.sales,0),passOut:T.reduce((a,t)=>a+t.passOut,0),profit:T.reduce((a,t)=>a+t.profit,0),cost:T.reduce((a,t)=>a+t.cost,0),labour:T.reduce((a,t)=>a+t.labour,0),parts:T.reduce((a,t)=>a+t.parts,0),paid:pays.reduce((a,p)=>a+p.amt,0),byM:pays.reduce((o,p)=>(o[p.m]=(o[p.m]||0)+p.amt,o),{}),exp,inv};}
SCREENS.money=m=>{if(!can.money()){go('home');return;}
  const due=dueInvoices().sort((a,b)=>a.inv.t-b.inv.t),dt=totalDue(),cd=(+DB.ws.credDays||30)*864e5;
  const td=sumRange(rangeOf('today')),wk=sumRange(rangeOf('week'));
  m.innerHTML=head('Money')+`
  <div class="kpis2"><div class="kpi org"><b>${f3(dt)}</b><span>Due from customers</span></div><div class="kpi ok"><b>${f3(wk.sales)}</b><span>Sales · last 7 days</span></div></div>
  ${sec('Today')}<div class="kpis3"><div class="kpi"><b>${f3(td.sales)}</b><span>Invoiced · ${td.n}</span></div><div class="kpi"><b>${f3(td.paid)}</b><span>Collected</span></div><div class="kpi"><b>${f3(td.exp)}</b><span>Expenses</span></div></div>
  <div class="two"><button class="btn ghost sm" data-go="close">🔒 Daily close</button><button class="btn ghost sm" data-go="exp">🧾 Expenses</button></div>
  <div class="two"><button class="btn ghost sm" data-go="reports">📊 Reports</button><button class="btn ghost sm" data-go="outw">🏪 Other workshops</button></div>
  ${sec('Collect first · '+due.length,`older than ${DB.ws.credDays||30} days in red`)}
  <div class="jb-list">${due.map(j=>{const c=custOf(j),v=vehOf(j),T=jobTotals(j),old=now()-j.inv.t>cd;return `<button class="jb-r it" data-go="inv:${j.id}"><div>${esc(c.name||'')}<small>#${j.inv.no} · ${esc(carName(v))} · ${ago(j.inv.t)}</small></div><b style="${old?'color:var(--bad)':''}">${f3(T.due)}</b></button>`;}).join('')||'<div class="jb-r"><div>Nothing due 👌</div></div>'}</div>`;};
/* an expense note for the list: the same sentence written twice (old imports) shown once, "Not paid yet: X" pulled out
   to sit under the amount. Only what is shown changes; the saved note stays as it was (open the expense to see it all). */
function expNote(s){s=String(s||'').trim();if(!s)return {text:'',due:null};let due=null;const key=x=>x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const parts=s.split(/\s+[•·]\s+/).map(x=>x.trim()).filter(Boolean).filter(x=>{const m=x.match(/^not paid yet\s*:?\s*([\d.,]+)\s*$/i);if(m){due=num(m[1].replace(/,/g,''));return false;}return true;});
  const keep=[];parts.forEach(x=>{const k=key(x);if(!k)return;const i=keep.findIndex(y=>{const a=key(y);if(a===k)return true;const sh=a.length<k.length?a:k;if(sh.length>=25&&(a.includes(k)||k.includes(a)))return true;let n=0;while(n<a.length&&n<k.length&&a[n]===k[n])n++;return n>=40;});
    if(i<0)keep.push(x);else if(key(x).length>key(keep[i]).length)keep[i]=x;});
  return {text:keep.join(' · '),due:due!=null&&due>0.0005?due:null};}
/* 2.42.0 expenses: the receipt date, a photo of the receipt, the shop it came from (a supplier), and how it was paid —
   drawer / card / transfer / my pocket, or not paid yet (then pay it later, all or part).
   e.pays=[{amt,m,t,by}] like an invoice; old expenses have no pays: they count as paid on their date (drawer unless cash:false).
   e.cash is kept = "some of it came from the drawer" for anything older that still reads it. */
const EXP_M=[['Cash','💵','Cash drawer'],['Card','💳','Card'],['Transfer','🏦','Transfer'],['Own','👛','My pocket']];
const expMName=m=>{const x=EXP_M.find(y=>y[0]===m);return x?x[1]+' '+T_(x[2]):m==='Other'?T_('Paid (not from the drawer)'):esc(m||'');};
function expPays(e){if(Array.isArray(e.pays))return e.pays;return [{amt:+e.amt||0,m:e.cash===false?'Other':'Cash',t:e.t}];}
const expPaid=e=>Math.round(expPays(e).reduce((a,p)=>a+(+p.amt||0),0)*1000)/1000;
const expOwed=e=>Array.isArray(e.pays)?Math.max(0,Math.round(((+e.amt||0)-expPaid(e))*1000)/1000):0;
const expVend=e=>(e.vend&&byId('vendors',e.vend))||null;
const expVName=e=>{const v=expVend(e);return v?v.name:(e.vname||'');};
/* cash that left the drawer on a day (for the daily close) */
const expCashOn=day=>DB.expenses.reduce((a,e)=>a+expPays(e).filter(p=>p.m==='Cash'&&dayKey(p.t)===day).reduce((x,p)=>x+(+p.amt||0),0),0);
/* a date box (Muscat day) ↔ time: keep the time of day the expense already had */
const MUS=4*3600e3;const expDayT=(day,t0)=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(day||'');if(!m)return null;const tod=t0!=null?((t0+MUS)%864e5+864e5)%864e5:12*3600e3;return Date.UTC(+m[1],+m[2]-1,+m[3])-MUS+tod;};
/* receipt pictures: bigger than car pictures so the small print can be read */
function shrinkImg(file,max,q,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',q));};im.onerror=()=>{toast(T_('Could not read this picture'));cb(null);};im.src=r.result;};r.onerror=()=>{toast(T_('Could not read this picture'));cb(null);};r.readAsDataURL(file);}
function pickImgs(mode,cb){const got=L=>{if(!L.length)return;const out=[];let n=0;L.forEach(x=>shrinkImg(x,1400,.62,u=>{if(u)out.push(u);if(++n===L.length)cb(out);}));};
  /* 2.43.3: camera inside the app (see snap.js) */
  if(mode==='cam')snapPhoto(got,{title:T_('Receipt photo')});else{try{trail('photo','gallery');}catch(e){}sysPick(true,got);}}
SCREENS.exp=m=>{const f=rangeOf('month');const P=S.p||{};const fv=P.vend?byId('vendors',P.vend):null;const fo=!!P.owed;
  const all=DB.expenses.slice().sort((a,b)=>b.t-a.t);const list=all.filter(e=>(!fv||e.vend===fv.id)&&(!fo||expOwed(e)>0));const mon=DB.expenses.filter(e=>e.t>=f);
  const owed=DB.expenses.reduce((a,e)=>a+expOwed(e),0);const byC={};mon.forEach(e=>byC[e.cat]=(byC[e.cat]||0)+e.amt);
  m.innerHTML=head('Expenses',`<button class="lnk" id="eadd">＋ Expense</button>`)+`
  <div class="kpis2"><div class="kpi red"><b>${f3(mon.reduce((a,e)=>a+e.amt,0))}</b><span>This month</span></div>${owed>0.0005?`<button class="kpi red" id="eowed"><b>${f3(owed)}</b><span>${T_('Owed to shops')} ›</span></button>`:`<div class="kpi"><b>${mon.length}</b><span>Entries</span></div>`}</div>
  ${!fv&&!fo&&Object.keys(byC).length?sec('This month by type')+`<div class="list">${Object.entries(byC).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="row"><div><b>${esc(c)}</b></div><span class="v">${f3(v)}</span></div>`).join('')}</div>`:''}
  ${sec(fv?'🚚 '+esc(fv.name):fo?T_('Not paid yet'):'All',fv||fo?`<button class="lnk" id="eflt">✕ ${T_('Show all')}</button>`:'')}<div class="list">${list.map(e=>{const n=expNote(e.note);const ow=expOwed(e);const vn=expVName(e);const due=ow>0.0005?ow:n.due;
    return `<button class="row xrow" data-ee="${e.id}"><div><b>${esc(e.cat)}${(e.ph||[]).length?' <span class="xph">📎</span>':''}</b><span>${fmtD(e.t)}${vn?' · <span dir="auto">'+esc(vn)+'</span>':''}${e.monthly?' · '+T_('monthly'):''}</span>${n.text?`<span class="xn" dir="auto" data-notr>${esc(n.text)}</span>`:''}</div><span class="v">${f3(e.amt)}${due!=null&&due>0.0005?`<small class="bad">${T_('Unpaid')} ${f3(due)}</small>`:''}</span></button>`;}).join('')||empty('🧾',fv||fo?T_('Nothing here.'):'No expenses yet. Add rent and salaries first.')}</div>`;
  const eo=$('#eowed');if(eo)eo.onclick=()=>go('exp',{owed:1});const ef=$('#eflt');if(ef)ef.onclick=()=>go('exp');
  $('#eadd').onclick=()=>expSheet(null,fv?{vend:fv.id}:null);$$('[data-ee]').forEach(b=>b.onclick=()=>expSheet(DB.expenses.find(x=>x.id===b.dataset.ee)));};
/* one sheet for a new or an old expense. Nothing is kept until Save: new photos, removed photos, payments added or removed. */
function expSheet(e,pre){const isNew=!e;e=e||Object.assign({cat:DB.ecats.includes('Workshop supplies')?'Workshop supplies':DB.ecats[0],amt:0,t:now()},pre||{});
  const st={ph:(e.ph||[]).slice(),add:[],pays:isNew?null:expPays(e).map(p=>Object.assign({},p)),m:isNew?'Cash':null,payM:'Cash'};
  const vn=expVName(e);const vl=DB.vendors.map(v=>v.name).filter(Boolean);
  openSheet(`<h3>${isNew?T_('New expense'):T_('Edit expense')}</h3>
   <select class="field" id="ec">${DB.ecats.map(c=>`<option ${e.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
   <div class="in2"><input class="field" id="ea" inputmode="decimal" placeholder="${T_('Amount')}" value="${e.amt?f3(e.amt):''}"><input class="field" id="ed" type="date" max="${today()}" value="${dayKey(e.t)}" aria-label="${T_('Receipt date')}"></div>
   <input class="field" id="ev" list="evl" dir="auto" autocomplete="off" placeholder="🚚 ${T_('Shop / supplier')}" value="${esc(vn)}"><datalist id="evl">${vl.map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
   <input class="field" id="en" dir="auto" placeholder="${T_('Note (what you bought)')}" value="${esc(e.note||'')}">
   <div class="xlab">${T_('Paid how?')}</div><div id="epay"></div>
   <div class="xlab">${T_('Receipt photo')}</div><div id="ephs" class="xphs"></div><input type="hidden" id="eph" value="">
   <div class="in2"><button class="btn ghost sm" id="ecam">📷 ${T_('Camera')}</button><button class="btn ghost sm" id="egal">🖼 ${T_('From gallery')}</button></div>
   <label class="chk"><input type="checkbox" id="em" ${e.monthly?'checked':''}> ${T_('Every month (rent, salaries…)')}</label>
   <button class="btn" id="eok">${T_('Save')}</button>${!isNew?`<button class="btn ghost jb-del" id="edel">🗑 ${T_('Delete expense')}</button>`:''}`,el=>{
   const q=s=>el.querySelector(s);const amt=()=>num(q('#ea').value)||0;
   const paidSum=()=>Math.round((st.pays||[]).reduce((a,p)=>a+(+p.amt||0),0)*1000)/1000;
   const drawPay=()=>{const box=q('#epay');
     if(isNew){box.innerHTML=`<div class="chips xchips">${EXP_M.map(([k,ic,t])=>`<button data-em="${k}" aria-pressed="${st.m===k}">${ic} ${T_(t)}</button>`).join('')}<button data-em="Due" aria-pressed="${st.m==='Due'}">⏳ ${T_('Not paid yet')}</button></div>`;
       box.querySelectorAll('[data-em]').forEach(b=>b.onclick=()=>{st.m=b.dataset.em;drawPay();});return;}
     const ow=Math.max(0,Math.round((amt()-paidSum())*1000)/1000);
     box.innerHTML=`<div class="jb-list xpays">${(st.pays||[]).map((p,i)=>`<div class="jb-r"><div>${expMName(p.m)}<small>${fmtD(p.t)}</small></div><b>${f3(p.amt)}</b><button class="xpx" data-epx="${i}" aria-label="${T_('Remove payment')}">✕</button></div>`).join('')||`<div class="jb-r"><div>${T_('No payment yet')}</div></div>`}</div>
       ${ow>0.0005?`<div class="xowed nosnap"><b class="bad">${T_('Still owed')} ${f3(ow)}</b><div class="chips xchips">${EXP_M.map(([k,ic,t])=>`<button data-pm="${k}" aria-pressed="${st.payM===k}">${ic} ${T_(t)}</button>`).join('')}</div><div class="in2"><input class="field" id="epa" inputmode="decimal" value="${f3(ow)}" aria-label="${T_('Pay now')}"><button class="btn sm" id="epadd">＋ ${T_('Pay')}</button></div></div>`:`<p class="hint ok">✓ ${T_('Paid in full')}</p>`}`;
     box.querySelectorAll('[data-epx]').forEach(b=>b.onclick=()=>{st.pays.splice(+b.dataset.epx,1);drawPay();});
     box.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>{st.payM=b.dataset.pm;box.querySelectorAll('[data-pm]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
     const pa=q('#epadd');if(pa)pa.onclick=()=>{const v=num(q('#epa').value);const ow2=Math.max(0,Math.round((amt()-paidSum())*1000)/1000);if(!(v>0)){toast(T_('Type the amount paid'));return;}if(v>ow2+0.0005){toast(T_('More than what is owed')+' ('+f3(ow2)+')');return;}
       st.pays.push({amt:Math.round(v*1000)/1000,m:st.payM,t:now(),by:S.user?S.user.name:''});drawPay();};};
   const drawPh=()=>{const L=st.ph.map(id=>({id,img:(photoOf(id)||{}).img})).filter(x=>x.img).concat(st.add.map((img,i)=>({id:'new'+i,img})));
     q('#ephs').innerHTML=L.map(x=>`<div class="xph1"><img src="${x.img}" alt=""><button class="vpx" data-xpx="${x.id}" aria-label="${T_('Delete photo')}">✕</button></div>`).join('');
     q('#eph').value=st.ph.join(',')+'|'+st.add.length;
     q('#ephs').querySelectorAll('[data-xpx]').forEach(b=>b.onclick=()=>{const id=b.dataset.xpx;if(b.dataset.sure!=='1'){b.dataset.sure='1';b.classList.add('sure');toast(T_('Tap ✕ again to delete the photo'));return;}
       if(id.startsWith('new'))st.add.splice(+id.slice(3),1);else st.ph=st.ph.filter(x=>x!==id);el._touched=true;drawPh();});
     q('#ephs').querySelectorAll('img').forEach(im=>im.onclick=()=>im.parentElement.classList.toggle('big'));};
   const addPh=mode=>pickImgs(mode,L=>{if(!L.length)return;st.add.push(...L);el._touched=true;drawPh();});
   q('#ecam').onclick=()=>addPh('cam');q('#egal').onclick=()=>addPh('gal');
   q('#ea').addEventListener('input',()=>{if(!isNew)drawPay();});
   drawPay();drawPh();
   /* the payments and pictures are not form boxes: put them in the "changed?" check so leaving asks to save */
   const snap0=JSON.stringify([st.pays,st.ph,st.add.length,st.m]);const sn=el._snapX=()=>JSON.stringify([st.pays,st.ph,st.add.length,st.m])!==snap0;
   q('#eok').onclick=()=>{const a=Math.round(num(q('#ea').value)*1000)/1000;if(!(a>0)){toast(T_('Type the amount'));return;}
     const day=q('#ed').value;if(!day){toast(T_('Choose the receipt date'));return;}if(day>today()){toast(T_('The date is after today'));return;}
     const nt=dayKey(e.t)===day?e.t:isNew&&day===today()?now():expDayT(day,isNew?null:e.t);if(nt==null){toast(T_('Choose the receipt date'));return;}
     let pays;if(isNew)pays=st.m==='Due'?[]:[{amt:a,m:st.m,t:nt,by:S.user?S.user.name:''}];
     else{pays=st.pays.map(p=>Object.assign({},p));const ps=pays.reduce((x,p)=>x+p.amt,0);
       /* one payment that covered the old amount: the amount was corrected, so the payment follows it */
       if(pays.length===1&&Math.abs(ps-(+e.amt||0))<0.0005&&Math.abs(a-(+e.amt||0))>0.0005)pays[0].amt=a;
       else if(ps>a+0.0005){toast(T_('Paid is more than the amount')+' ('+f3(ps)+')');return;}
       /* a payment dated with the old receipt date moves with the date */
       pays.forEach(p=>{if(dayKey(p.t)===dayKey(e.t)&&nt!==e.t&&p.t<=e.t+864e5)p.t=nt;});}
     /* the shop: an existing supplier (same name), or a new one added to Suppliers */
     const vnm=q('#ev').value.trim().replace(/\s+/g,' ');let vend=null;
     if(vnm){vend=DB.vendors.find(v=>String(v.name||'').trim().toLowerCase()===vnm.toLowerCase());if(!vend){vend={id:uid('d'),t:now(),name:vnm,what:e.cat};DB.vendors.push(vend);audit('add','Supplier '+vnm+' (from an expense)');}}
     if(isNew){e.id=uid('e');e.by=S.user?S.user.name:'';DB.expenses.push(e);}
     const gone=(e.ph||[]).filter(id=>!st.ph.includes(id));if(gone.length)DB.photos=(DB.photos||[]).filter(p=>!gone.includes(p.id));
     const nph=st.add.map(img=>{const id=uid('ph');DB.photos=DB.photos||[];DB.photos.push({id,exp:e.id,img,t:now()});return id;});
     Object.assign(e,{cat:q('#ec').value,amt:a,t:nt,note:q('#en').value.trim(),monthly:q('#em').checked,pays,cash:pays.some(p=>p.m==='Cash'),ph:st.ph.concat(nph)});
     if(vend){e.vend=vend.id;e.vname=vend.name;}else{delete e.vend;delete e.vname;}
     if(!e.ph.length)delete e.ph;audit(isNew?'add':'edit','Expense '+e.cat+' '+f3(e.amt)+(vend?' · '+vend.name:''));save();closeSheet();render();};
   const d=q('#edel');if(d)d.onclick=()=>confirmSheet(T_('Delete this expense?')+' '+esc(e.cat)+' · '+f3(e.amt),'🗑 '+T_('Delete expense'),()=>{audit('delete','Expense '+e.cat+' '+f3(e.amt));
     if((e.ph||[]).length)DB.photos=(DB.photos||[]).filter(p=>!e.ph.includes(p.id));DB.expenses=DB.expenses.filter(x=>x!==e);save();render();});});}
SCREENS.close=m=>{const td=sumRange(rangeOf('today'));const cash=td.byM.Cash||0;const cashExp=expCashOn(today());
  const last=DB.closes.filter(c=>c.date!==today()).sort((a,b)=>b.t-a.t)[0];const opening=last?last.counted:(+DB.openingCash||0);const expect=opening+cash-cashExp;const done=DB.closes.find(c=>c.date===today());
  const openJ=openJobs();
  m.innerHTML=head('Daily close · '+fmtDs(now()))+`
  <div class="jb-list"><div class="jb-r"><div>Opening cash<small>${last?'from last close':'set in Settings'}</small></div><b>${f3(opening)}</b></div><div class="jb-r"><div>+ Cash payments today</div><b>${f3(cash)}</b></div>${Object.entries(td.byM).filter(([k])=>k!=='Cash').map(([k,v])=>`<div class="jb-r"><div>${esc(k)}<small>not in the drawer</small></div><b>${f3(v)}</b></div>`).join('')}${cashExp?`<div class="jb-r"><div>− Cash expenses today</div><b>${f3(cashExp)}</b></div>`:''}<div class="jb-r tot"><div>Cash expected in the drawer</div><b>${f3(expect)}</b></div></div>
  ${done?`<div class="card ${Math.abs(done.diff)>0.0005?'note':''}"><div class="h"><b>Closed by ${esc(done.by)} at ${hm(done.t)}</b></div><span class="sub">Counted ${f3(done.counted)} · ${Math.abs(done.diff)<=0.0005?'matches ✓':'difference '+f3(done.diff)}</span></div>`
  :`<label class="field-l">Cash counted in the drawer<input class="field" id="ccnt" inputmode="decimal" placeholder="0.000"></label><button class="btn" id="cok">Close the day</button>`}
  ${openJ.length?sec('Still open · '+openJ.length,'close them or write why')+`<div class="list">${openJ.map(carRow).join('')}</div>`:''}
  ${sec('Past closes')}<div class="list">${DB.closes.slice().sort((a,b)=>b.t-a.t).slice(0,14).map(c=>`<div class="row"><div><b>${fmtD(c.t)}</b><span>${esc(c.by)} · expected ${f3(c.expected)}</span></div><span class="v ${Math.abs(c.diff)>0.0005?'bad':''}">${f3(c.counted)}<small>${Math.abs(c.diff)>0.0005?(c.diff>0?'+':'')+f3(c.diff):'✓'}</small></span></div>`).join('')||empty('🔒','No closes yet.')}</div>`;
  const ok=$('#cok');if(ok)ok.onclick=()=>{const v=$('#ccnt').value.trim();if(v===''){toast('Count the cash first');return;}const c=num(v);audit('close','Daily close');DB.closes.push({date:today(),t:now(),by:S.user.name,expected:expect,counted:c,diff:c-expect});save();render();};};
SCREENS.reports=m=>{if(!can.money()){go('home');return;}const k=S.p.k||'month';const R=sumRange(rangeOf(k));
  const svc={},prt={};R.inv.forEach(j=>(j.items||[]).forEach(i=>{const o=i.k==='part'?prt:svc;o[i.d]=o[i.d]||{n:0,a:0};o[i.d].n+=(+i.q||0);o[i.d].a+=(+i.q||0)*(+i.p||0);}));
  const top=o=>Object.entries(o).sort((a,b)=>b[1].a-a[1].a).slice(0,10);
  const days={};const r0=rangeOf(k),WD=new Intl.DateTimeFormat('en-GB',{weekday:'short',timeZone:'Asia/Muscat'});DB.jobs.filter(j=>isInvoiced(j)&&j.inv.t>=r0).forEach(j=>{const d=WD.format(new Date(j.inv.t));days[d]=(days[d]||0)+1;});
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
  <button class="btn ghost sm" id="scat">📥 Import services and parts</button><button class="btn ghost sm" id="scust">📥 Import customers and history</button>
  ${sec('Storage')}<p class="hint" id="stor">💾 ${storeLabel()}</p>
  ${sec('Backup')}
  <p class="hint">Everything stays on this device only. Make a locked backup every week.</p>
  <div class="two"><button class="btn ghost sm" id="sbk">⬇️ Make backup</button><button class="btn ghost sm" id="srs">⬆️ Restore</button></div>
  <button class="btn ghost jb-del" id="swipe">🗑 Delete all data</button>`;
  $('#slogo').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,600/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);w.logo=c.toDataURL('image/png');save();render();};im.src=r.result;};r.readAsDataURL(f);};
  const lx=$('#slogox');if(lx)lx.onclick=()=>{w.logo='';save();render();};
  $('#ssave').onclick=()=>{w.name=$('#sname').value.trim()||w.name;w.phone=$('#sphone').value.trim();w.addr=$('#saddr').value.trim();w.cr=$('#scr').value.trim();{const used=DB.jobs.reduce((m,j)=>j.inv&&!j.inv.void&&+j.inv.no>m?+j.inv.no:m,0);const want=Math.max(1,parseInt(num($('#sinv').value))||w.nextInv);if(want<=used&&want!==w.nextInv)toast(T_('Invoice numbers up to '+used+' are used. The next is '+(used+1)+'.'));w.nextInv=Math.max(want,want<=used&&want!==w.nextInv?used+1:want);}w.invStart=w.invStart||w.nextInv;w.credDays=parseInt($('#scred').value)||30;w.vat=$('#svat').checked;w.vatDecided=true;w.warranty=$('#swar').value.trim();
    w.remMonths=parseInt($('#srm').value)||6;w.remKm=parseInt($('#srk').value)||7000;
    DB.openingCash=num($('#soc').value);audit('settings','Settings saved');save();toast('Saved');render();};
  $('#ssmart').onchange=e=>{DB.ws.sxOff=DB.ws.sxOff||{};if(e.target.checked)delete DB.ws.sxOff.smart;else DB.ws.sxOff.smart=1;save();toast(e.target.checked?'Smart services on':'Smart services off');};
  $$('#slang [data-l]').forEach(b=>b.onclick=()=>{w.lang=b.dataset.l;save();audit('settings','Language '+w.lang);render();});
  $$('#smode [data-m]').forEach(b=>b.onclick=()=>{w.mode=b.dataset.m;save();lookApply();render();});
  $$('#sthm [data-t]').forEach(b=>b.onclick=()=>{w.theme=b.dataset.t;save();lookApply();render();});
  $('#smo').onchange=e=>{w.motionOff=!e.target.checked;save();toast(w.motionOff?'Animations off':'Animations on');MV.key='';render();};
  const sd=$('#sdemo');if(sd)sd.onclick=()=>{loadDemo();};const sdx=$('#sdemox');if(sdx)sdx.onclick=()=>confirmSheet('Remove all test data (everything with 🧪)? Your real data stays.','Remove test data',removeDemo);
  syncBind();
  $('#scat').onclick=catalogSheet;$('#scust').onclick=custImportSheet;
  $('#sbk').onclick=backupSheet;
  $('#srs').onclick=restoreSheet;
  $('#swipe').onclick=wipeDataSheet;};
/* delete the workshop's data on this device and online. Kept: the workshop name and settings, the users (names and PINs)
   and the online sign-in. Other synced devices get the same deletion through sync. The delete button unlocks after 6 seconds. */
function wipeDataSheet(){if(!S.user||S.user.role!=='owner'){toast(T_('Only the owner can do this'));return;}const cl=typeof SYNC!=='undefined'&&SYNC.user;let n=6,tm=0;
  openSheet(`<h3>⚠️ Delete all data</h3><div class="wipebox"><p>${cl?'This deletes customers, cars, job cards, invoices, payments, services, parts and stock, suppliers, expenses and reports on this device, online and on every synced device.':'This deletes customers, cars, job cards, invoices, payments, services, parts and stock, suppliers, expenses and reports on this device.'}</p><p>${cl?'Kept: the workshop name and settings, the users and their PINs, and the online sign-in.':'Kept: the workshop name and settings, the users and their PINs.'}</p><p class="err">This cannot be undone. Make a backup first if you may need the data.</p></div><p class="hint">${T_('To confirm, type DELETE')}</p><input class="field" id="wdty" autocomplete="off" placeholder="DELETE"><button class="btn danger" id="wdgo" disabled>Delete all data (${n})</button>`,el=>{
    const bt=el.querySelector('#wdgo'),ty=el.querySelector('#wdty');const typed=()=>/^(delete|حذف|احذف)$/i.test(ty.value.trim());ty.oninput=()=>{bt.disabled=n>0||!typed();};tm=setInterval(()=>{n--;if(!document.body.contains(bt)){clearInterval(tm);return;}if(n<=0){clearInterval(tm);bt.disabled=!typed();bt.textContent=T_('Delete all data');}else bt.textContent=T_('Delete all data ({n})').replace('{n}',n).replace('{0}',n);},1000);
    bt.onclick=async()=>{if(bt.disabled||!typed())return;bt.disabled=true;closeSheet();wipeData();await flushNow();if(cl){try{await syncPushNow();}catch(e){}}toast('All data deleted');go('home');};});}
function wipeData(){const b=blankDB(),keep=['v','ws','users','pcats','ecats','insp','canned','seenNews','sizes','hideMenu','mlists','custEng','spec','backups','openingCash','brandImg','pkgs'];
  Object.keys(DB).forEach(k=>{if(keep.includes(k))return;if(k in b)DB[k]=b[k];else delete DB[k];});
  DB.ws.nextJob=1;DB.ws.nextInv=DB.ws.invStart||1001;DB.ws.resetAt=Date.now();delete DB.ws.mainAt;
  audit('settings','All data deleted · '+((S.user&&S.user.name)||''));save();}
/* ---------- USERS ---------- */
SCREENS.users=m=>{if(!can.settings()){go('more');return;}
  const nCust=u=>u.role!=='owner'&&u.perm?Object.keys(u.perm).length:0;
  m.innerHTML=head('Users',`<button class="lnk" id="uadd">＋ Add</button>`)+`
  <div class="card note"><b>Who can do what</b><span class="sub"><b>Owner</b>: everything.<br><b>Manager</b> and <b>Employee</b> start with a set of permissions. Tap a person to turn each one on or off.</span></div>
  <div class="list">${DB.users.map(u=>`<button class="row" data-ue="${u.id}"><div style="display:flex;gap:12px;align-items:center"><span class="av" style="background:${safeCol(u.color)}">${initials(u.name)}</span><div><b>${esc(u.name)}</b><span>${ROLE[u.role]}${nCust(u)?' · custom permissions':''}</span></div></div><span class="v">Edit</span></button>`).join('')}</div>`;
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
     el.querySelector('#uok').onclick=async()=>{if(S.user.role!=='owner'&&((!isNew&&u.role==='owner')||role==='owner')){toast(T_('Only the owner can change an owner'));return;}const n=$('#un').value.trim();const pin=$('#up').value.trim();if(!n){toast('Type a name');return;}if(isNew&&!/^\d{4}$/.test(pin)){toast('PIN must be 4 numbers');return;}if(pin&&!/^\d{4}$/.test(pin)){toast('PIN must be 4 numbers');return;}
       if(!isNew&&u.role==='owner'&&role!=='owner'&&DB.users.filter(x=>x.role==='owner').length===1){toast('Keep at least one owner');return;}
       if(isNew){u.id=uid('u');u.color=COLORS[DB.users.length%COLORS.length];DB.users.push(u);}audit('user',(isNew?'Added user ':'Changed user ')+n+' · '+ROLE[role]+(Object.keys(pm).length&&role!=='owner'?' · permissions: '+Object.entries(pm).map(([k,v])=>(v?'+':'−')+k).join(' '):'')+(pin?' · new PIN':''));u.name=n;u.role=role;if(ulang)u.lang=ulang;else delete u.lang;u.perm=role==='owner'?{}:pm;if(pin)u.pin=await hashPin(pin);save();closeSheet();render();};
     const d=el.querySelector('#udel');if(d&&S.user.role!=='owner'&&u.role==='owner')d.remove();else if(d)d.onclick=()=>confirmSheet('Remove '+esc(u.name)+'?','Remove',()=>{audit('user','Removed user '+u.name);DB.users=DB.users.filter(x=>x!==u);save();render();});});};
  $('#uadd').onclick=()=>edit();$$('[data-ue]').forEach(b=>b.onclick=()=>edit(DB.users.find(x=>x.id===b.dataset.ue)));};
/* ---------- MORE ---------- */
SCREENS.more=m=>{const [d,t]=stepsProgress();const it=(r,ic,t2,s,show=true)=>show&&routeOk(r)&&!DB.hideMenu[r]?`<button class="mitem" data-go="${r}"><span class="ic">${ic}</span><div><b>${t2}</b><span>${s}</span></div><span class="v">›</span></button>`:'';
  const ml=DB.mlists.filter(L=>L.inMenu!==false);
  m.innerHTML=head('More')+`<div class="list">
  ${(DB.bugs||[]).length?it('bugs','🐞','Saved problems',DB.bugs.length+' · copy them and send them to be fixed'):''}
  ${it('news','🎉','What\'s new · how to use',newsUnseen().length?'<b style="color:var(--red2)">'+newsUnseen().length+' new</b> · tap to see':'Tours of every new thing')}${it('setup','✅','Setup · 100 steps',`${d} of ${t} done`,can.settings())}
  ${it('checks','🔎','Invoice checks',(()=>{const n=DB.jobs.filter(j=>j.t>=now()-7*864e5&&j.stage!=='estimate'&&jobChecks(j).length).length;return n?n+' to look at · last 7 days':'Nothing wrong · last 7 days';})())}
  ${it('debts','💳','Debts',(()=>{const n=DB.customers.filter(c=>custDebt(c.id).list.length).length;return n?n+' customers owe money':'Nobody owes money';})())}
  ${it('pkgs','📦','Packages','Fixed-price packages by car',can.settings())}
  ${it('svc','🛠','Services',DB.services.length+' services · '+DB.scats.length+' groups')}
  ${it('stock','🛢','Stock',DB.parts.length+' parts')}
  ${it('vendors','🚚','Suppliers & orders',DB.vendors.length+' suppliers')}
  ${it('canned','📦','Canned jobs',DB.canned.length+' sets')}
  ${it('insp','📋','Inspection checklists',DB.insp.length+' checklists')}
  ${it('arc','🗄',T_('Previous system archive'),(DB.arc||[]).length+' '+T_('records'),can.settings()&&(DB.arc||[]).length>0)}
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
