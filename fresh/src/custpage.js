/* ---------- CUSTOMER PAGE with tabs, like the old system: cars (with a note per car), visits, estimates, account statement,
   notes (dated), messages sent, labels on the customer, invoiced / paid / due. ---------- */
const CUST_TAGS=['VIP','Company','Fleet','On account','Follow up'];
/* every WhatsApp sent from the app is kept on the customer's page */
(function(){const ST=shareText;window.shareText=shareText=function(phone,t){try{if(t){const c=phone&&custByPhone(phone);DB.msglog=DB.msglog||[];DB.msglog.push({id:uid('m'),t:now(),cust:c?c.id:'',ph:String(phone||''),by:S.user&&S.user.name||'',x:String(t).slice(0,400)});if(DB.msglog.length>3000)DB.msglog.splice(0,DB.msglog.length-3000);save();}}catch(e){}return ST(phone,t);};})();
function custLedger(c){const L=[];DB.jobs.filter(j=>j.cust===c.id&&isInvoiced(j)).forEach(j=>{const T=jobTotals(j);L.push({t:j.inv.t,d:`${T_('Invoice')} #${j.inv.no}${j.returned?' · '+T_('returned'):''}`,a:j.returned?0:T.total,j});
  (j.pays||[]).filter(p=>!isCreditM(p.m)).forEach(p=>L.push({t:p.t,d:`${T_('Payment')} · ${T_(p.m)}`,a:-(+p.amt||0),j}));});
  L.sort((a,b)=>a.t-b.t);let bal=0;L.forEach(r=>{bal=Math.round((bal+r.a)*1000)/1000;r.bal=bal;});return L;}
function statementText(c){const L=custLedger(c);const cur=DB.ws.currency==='OMR'?'ر.ع':DB.ws.currency;
  return `${DB.ws.name}\nكشف حساب: ${c.name||''}\n\n`+L.map(r=>`${fmtD(r.t)} · ${r.d}: ${r.a<0?'−':''}${f3(Math.abs(r.a))}`).join('\n')+`\n\nالرصيد المستحق: ${f3(L.length?L[L.length-1].bal:0)} ${cur}`;}
function statementPrint(c){const L=custLedger(c);const cur=DB.ws.currency;const I=invS();
  printHtml(`<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:12mm}body{margin:0;font-family:Tahoma,Arial,sans-serif}${INV2_CSS}.st{width:100%;border-collapse:collapse;margin-top:5mm;font-size:3.2mm}.st th{background:#141414;color:#fff;padding:2mm 3mm;text-align:right}.st td{padding:2mm 3mm;border-bottom:.25mm solid #eee}.st td.a{text-align:left;direction:ltr}</style></head><body>
   <div class="iv2" style="--ia:${esc(I.acc)}"><div class="iv2-bar"><i></i><i></i></div><div class="iv2-hd"><div class="iv2-brand">${DB.ws.logo?`<img src="${DB.ws.logo}" style="height:16mm">`:`<div class="nm">${esc(DB.ws.name)}</div>`}</div><div class="iv2-ttl"><b>STATEMENT</b><span>كشف حساب</span></div></div>
   <div class="iv2-cards" style="grid-template-columns:1fr"><div><div class="lb">العميل · CUSTOMER</div><div class="big">${esc(c.name||'')}</div>${c.phone?`<div class="sm"><bdi>${esc(c.phone)}</bdi></div>`:''}</div></div>
   <table class="st"><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th><th>الرصيد</th></tr>${L.map(r=>`<tr><td><bdi>${fmtD(r.t)}</bdi></td><td>${esc(r.d)}</td><td class="a">${r.a<0?'−':''}${f3(Math.abs(r.a))}</td><td class="a">${f3(r.bal)}</td></tr>`).join('')}</table>
   <div class="iv2-bot"><div></div><div class="iv2-tot"><div class="due"><span>المستحق<small>${esc(cur)}</small></span><b><bdi>${f3(L.length?L[L.length-1].bal:0)}</bdi></b></div><div class="ln"></div></div></div><div class="iv2-end"></div></div></body></html>`,210,297,'Statement '+(c.name||''));}
SCREENS.custd=m=>{const c=byId('customers',S.p.id);if(!c){go('cust');return;}const tab=S.p.tab||'cars';
  const vs=DB.vehicles.filter(v=>v.cust===c.id);const js=DB.jobs.filter(j=>j.cust===c.id).sort((a,b)=>b.t-a.t);const visits=js.filter(j=>j.stage!=='estimate');const ests=js.filter(j=>j.stage==='estimate');
  const inv=js.filter(j=>isInvoiced(j)&&!j.returned);const tot=inv.reduce((a,j)=>a+jobTotals(j).total,0),paid=inv.reduce((a,j)=>a+jobTotals(j).paid,0),due=inv.reduce((a,j)=>a+jobTotals(j).due,0);
  const msgs=(DB.msglog||[]).filter(x=>x.cust===c.id||(x.ph&&phoneKey(x.ph)===phoneKey(c.phone)&&phoneKey(c.phone).length>=7)).sort((a,b)=>b.t-a.t);const notes=(c.log||[]).slice().sort((a,b)=>b.t-a.t);
  const same=phoneKey(c.phone).length>=7?DB.customers.filter(x=>x!==c&&phoneKey(x.phone)===phoneKey(c.phone)):[];
  const ini=String(c.name||'?').split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
  const tabs=[['cars','Cars',vs.length],['visits','Visits',visits.length],['est','Estimates',ests.length],['stmt','Statement',''],['notes','Notes',notes.length+(c.notes?1:0)],['msgs','Messages',msgs.length]].filter(([k])=>k!=='stmt'||can.money());
  let body='';
  if(tab==='cars')body=(vs.map(v=>`<div class="card ccar"><div class="h"><b><bdi>${esc([v.year,v.make,v.model].filter(Boolean).join(' '))}</bdi></b><button class="lnk" data-ctr="${v.id}">${T_('Car in')} ›</button></div>
     <span class="sub"><bdi>${[v.plate,v.engine?effEng(v)||v.engine:'',v.vin].filter(Boolean).map(esc).join(' | ')}</bdi>${v.km?` · <bdi>${kmf(v.km)} km</bdi>`:''}</span>
     ${v.note?`<div class="cnote">📝 ${esc(v.note)}</div>`:''}<div class="two"><button class="btn ghost sm" data-vn="${v.id}">📝 ${T_(v.note?'Edit note':'Add a note')}</button><button class="btn ghost sm" data-ve2="${v.id}">✏️ ${T_('Edit')}</button></div></div>`).join('')||empty('🚗','No cars yet.'))+`<button class="btn ghost" id="vadd2">＋ ${T_('Add car')}</button>`;
  if(tab==='visits')body=`<div class="list">${visits.map(carRow).join('')||empty('🧾','No visits yet.')}</div>`;
  if(tab==='est')body=`<div class="list">${ests.map(carRow).join('')||empty('📝','No estimates.')}</div>`;
  if(tab==='stmt'){const L=custLedger(c);body=debtBox(c)+L.length?`<div class="jb-list">${L.slice().reverse().map(r=>`<div class="jb-r"><div>${esc(r.d)}<small><bdi>${fmtD(r.t)}</bdi></small></div><b class="${r.a<0?'pos':''}"><bdi>${r.a<0?'−':''}${f3(Math.abs(r.a))}</bdi><small style="display:block;font-weight:500">${T_('balance')} <bdi>${f3(r.bal)}</bdi></small></b></div>`).join('')}</div>
     <div class="two">${c.phone?`<button class="btn wa" id="stwa">WhatsApp</button>`:'<span></span>'}<button class="btn ghost" id="stpr">🖨 ${T_('Print')}</button></div>`:empty('📄','No invoices yet.');}
  if(tab==='notes')body=`<textarea class="field" id="cnx" rows="2" placeholder="${T_('Write a note… (what the customer asked, a promise, a problem)')}"></textarea><button class="btn" id="cnok">${T_('Add note')}</button>
     ${c.notes?`<div class="card"><span class="sub">${esc(c.notes)}</span></div>`:''}<div class="list">${notes.map(n=>`<div class="row"><div><b style="font-weight:500;white-space:pre-wrap">${esc(n.x)}</b><span><bdi>${fmtD(n.t)} ${hm(n.t)}</bdi> · ${esc(n.by||'')}</span></div></div>`).join('')}</div>`;
  if(tab==='msgs')body=msgs.length?`<div class="list">${msgs.map(x=>`<div class="row"><div><b style="font-weight:500;white-space:pre-wrap">${esc(x.x.length>160?x.x.slice(0,160)+'…':x.x)}</b><span><bdi>${fmtD(x.t)} ${hm(x.t)}</bdi> · ${esc(x.by||'')}</span></div></div>`).join('')}</div>`:empty('💬','Messages sent from the app on WhatsApp show here.');
  m.innerHTML=head(T_('Customer'),`<button class="lnk" id="cedit">${T_('Edit')}</button>`)+`
   <div class="card chd"><div class="cav">${esc(ini)}</div><div class="cinfo"><b>${esc(c.name||'')}</b>
     <div class="ctags">${(c.tags||[]).map(t=>`<span class="tg">${esc(T_(t))}</span>`).join('')}<button class="lnk" id="ctag">＋ ${T_('Label')}</button></div>
     <span class="sub">${[c.phone?`<bdi dir="ltr">${esc(c.phone)}</bdi>`:T_('no phone'),c.area?esc(c.area):'',c.company?'🏢 '+esc(c.company):'',c.email?esc(c.email):''].filter(Boolean).join(' · ')}</span></div></div>
   ${c.phone?`<div class="two"><button class="btn wa sm" id="cwa">WhatsApp</button><a class="btn ghost sm" href="tel:${esc(c.phone)}">${T_('Call')}</a></div>`:''}
   ${same.length?`<div class="guess">${T_('Same phone as')} ${same.map(x=>`<b>${esc(x.name||'')}</b>`).join('، ')}. <button class="lnk" id="cmg1">${T_('Merge')} ›</button></div>`:''}
   <div class="kpis3">${can.money()?`<div class="kpi"><b>${f3(tot)}</b><span>${T_('Invoiced')}</span></div><div class="kpi ok"><b>${f3(paid)}</b><span>${T_('Paid')}</span></div><div class="kpi ${due>0?'org':''}"><b>${f3(due)}</b><span>${T_('Due')}</span></div>`:`<div class="kpi"><b>${visits.length}</b><span>${T_('Visits')}</span></div>`}</div>
   ${can.money()&&due>0&&tab!=='stmt'?`<button class="debtnote" id="cdue" style="width:100%;text-align:start;border:0;cursor:pointer">⚠️ ${T_('Owes')} <bdi>${f3(due)}</bdi> · ${T_('see the statement')} ›</button>`:''}
   <div class="chips ctabs">${tabs.map(([k,t,n])=>`<button data-ct="${k}" aria-pressed="${tab===k}">${T_(t)}${n!==''?` <span>${n}</span>`:''}</button>`).join('')}</div>
   <div class="ctab">${body}</div>
   ${can.del()||can.settings()?`<button class="btn ghost sm" id="cmg2">🔗 ${T_('Merge with another customer')}</button>`:''}
   ${can.del()&&!js.length?`<button class="btn ghost jb-del" id="cdel">${T_('Delete customer')}</button>`:''}`;
  $$('[data-ct]').forEach(b=>b.onclick=()=>{S.p.tab=b.dataset.ct;render();});
  $('#cedit').onclick=()=>custSheet(c);const w=$('#cwa');if(w)w.onclick=()=>shareText(c.phone,msg('hello',{name:c.name||''}));debtBind(c);
  $('#ctag').onclick=()=>tagSheet(c);const cd=$('#cdue');if(cd)cd.onclick=()=>{S.p.tab='stmt';render();};
  $$('[data-ctr]').forEach(b=>b.onclick=()=>go('counter',{vid:b.dataset.ctr}));$$('[data-ve2]').forEach(b=>b.onclick=()=>vehSheet(c,byId('vehicles',b.dataset.ve2)));
  $$('[data-vn]').forEach(b=>b.onclick=()=>{const v=byId('vehicles',b.dataset.vn);openSheet(`<h3>📝 ${esc(carName(v))}</h3><p class="hint">${T_('Shows on the car card and when the car comes in.')}</p><textarea class="field" id="vnx" rows="3">${esc(v.note||'')}</textarea><button class="btn" id="vnok">${T_('Save')}</button>`,el=>el.querySelector('#vnok').onclick=()=>{v.note=el.querySelector('#vnx').value.trim();save();closeSheet();render();});});
  const va=$('#vadd2');if(va)va.onclick=()=>vehSheet(c);
  const sw=$('#stwa');if(sw)sw.onclick=()=>shareText(c.phone,statementText(c));const sp=$('#stpr');if(sp)sp.onclick=()=>statementPrint(c);
  const nk=$('#cnok');if(nk)nk.onclick=()=>{const x=$('#cnx').value.trim();if(!x)return;c.log=c.log||[];c.log.push({t:now(),by:S.user.name,x});save();render();};
  const g1=$('#cmg1');if(g1)g1.onclick=()=>mergeSheet(c,same[0]);const g2=$('#cmg2');if(g2)g2.onclick=()=>mergeSheet(c);
  const d=$('#cdel');if(d)d.onclick=()=>confirmSheet('Delete '+esc(c.name)+'?','Delete',()=>{audit('delete','Customer '+c.name);DB.customers=DB.customers.filter(x=>x!==c);DB.vehicles=DB.vehicles.filter(v=>v.cust!==c.id);save();go('cust');});};
function tagSheet(c){const all=[...new Set([...CUST_TAGS,...DB.customers.flatMap(x=>x.tags||[])])];const on=new Set(c.tags||[]);
  openSheet(`<h3>🏷 ${T_('Labels')}</h3><div class="chips">${all.map(t=>`<button data-tg="${esc(t)}" aria-pressed="${on.has(t)}">${esc(T_(t))}</button>`).join('')}</div><div class="srow"><input class="field" id="tgn" placeholder="${T_('New label')}"><button class="btn ghost" id="tgadd" style="width:auto">＋</button></div><button class="btn" id="tgok">${T_('Save')}</button>`,el=>{
    el.querySelectorAll('[data-tg]').forEach(b=>b.onclick=()=>{const t=b.dataset.tg;on.has(t)?on.delete(t):on.add(t);b.setAttribute('aria-pressed',on.has(t));});
    el.querySelector('#tgadd').onclick=()=>{const t=el.querySelector('#tgn').value.trim();if(!t)return;on.add(t);c.tags=[...on];save();closeSheet();tagSheet(c);};
    el.querySelector('#tgok').onclick=()=>{c.tags=[...on];save();closeSheet();render();};});}
/* labels and the car note elsewhere: on the customers list and on the counter card */
(function(){const CC=SCREENS.counter;SCREENS.counter=m=>{CC(m);const C=S.ctr;const v=C&&C.vid&&byId('vehicles',C.vid);if(!v)return;const card=m.querySelector('.ctrcar');if(!card)return;const c=byId('customers',v.cust)||{};
  const extra=[v.note?`📝 ${esc(v.note)}`:'',(c.tags||[]).length?(c.tags||[]).map(t=>`<span class="tg">${esc(T_(t))}</span>`).join(' '):''].filter(Boolean).join('<br>');if(extra){const d=document.createElement('div');d.className='cnote';d.innerHTML=extra;card.appendChild(d);}};})();
