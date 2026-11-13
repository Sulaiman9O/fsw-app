/* ---------- PREVIOUS SYSTEM ARCHIVE (2.32): everything from the old program that has no screen of its own here
   (purchases, its parts and services lists, packages, staff, reviews, account credit, bookings, activity notes…).
   Read-only. Each record: {id, kind, t, title, sub, data}. Owner / settings only. ---------- */
const ARC_KINDS={purchases:['🧾','Purchases'],parts:['🛢','Old parts list'],services:['🛠','Old services list'],packages:['📦','Old packages'],staff:['👷','Staff'],reviews:['⭐','Reviews'],
  credits:['💳','Account credit'],payments:['💵','Payments without invoice'],appointments:['📅','Appointments'],bookings:['🌐','Online bookings'],notes:['📝','Quick notes'],
  categories:['🗂','Part groups'],time:['⏱','Time tracking'],activity:['🕘','Other activity']};
SCREENS.arc=m=>{if(!can.settings()){go('home');return;}const A=DB.arc||[];const k=S.p.k||'';const q=S.p.q||'';
  if(!k){const by={};A.forEach(x=>by[x.kind]=(by[x.kind]||0)+1);
    m.innerHTML=head(T_('Previous system archive'))+`<p class="hint">${T_('Everything from the previous system that has no page of its own here. Read only.')}</p>
    <div class="list">${Object.keys(by).sort((a,b)=>by[b]-by[a]).map(x=>{const [ic,n]=ARC_KINDS[x]||['📁',x];return `<button class="mitem" data-ak="${esc(x)}"><span class="ic">${ic}</span><div><b>${T_(n)}</b><span>${by[x]}</span></div><span class="v">›</span></button>`;}).join('')||empty('🗄',T_('Nothing in the archive.'))}</div>`;
    $$('[data-ak]').forEach(b=>b.onclick=()=>go('arc',{k:b.dataset.ak}));return;}
  const all=A.filter(x=>x.kind===k).sort((a,b)=>(b.t||0)-(a.t||0));const nq=lc(q);const L=nq?all.filter(x=>lc(x.title+' '+x.sub+' '+JSON.stringify(x.data)).includes(nq)):all;const [ic,n]=ARC_KINDS[k]||['📁',k];
  m.innerHTML=head(ic+' '+T_(n))+`<input class="field" id="arq" placeholder="${T_('Search')}" value="${esc(q)}"><div class="list">${L.slice(0,300).map(x=>`<button class="row" data-ar="${esc(x.id)}"><div><b>${esc(x.title)}</b><span>${x.t?fmtD(x.t)+' · ':''}${esc(x.sub||'')}</span></div><span class="v">›</span></button>`).join('')||empty('🔎',T_('Nothing found'))}</div>${L.length>300?`<p class="hint">${L.length-300} ${T_('more · search to find them')}</p>`:''}`;
  const qi=$('#arq');qi.oninput=()=>{clearTimeout(qi._t);qi._t=setTimeout(()=>{S.p.q=qi.value;render();const n2=$('#arq');if(n2){n2.focus();n2.setSelectionRange(n2.value.length,n2.value.length);}},250);};
  $$('[data-ar]').forEach(b=>b.onclick=()=>{const x=A.find(y=>y.id===b.dataset.ar);if(x)arcSheet(x);});};
/* one record: every field, readable */
function arcSheet(x){const val=v=>v==null?'':typeof v==='number'&&v>1e12&&v<4e12?fmtD(v):Array.isArray(v)||typeof v==='object'?JSON.stringify(v,null,1):String(v);
  const rows=Object.entries(x.data||{}).map(([k,v])=>`<div class="row"><div><b dir="ltr">${esc(k)}</b><span style="white-space:pre-wrap;word-break:break-word" dir="auto">${esc(val(v).slice(0,4000))}</span></div></div>`).join('');
  openSheet(`<h3>${esc(x.title)}</h3>${x.sub?`<p class="hint">${esc(x.sub)}</p>`:''}<div class="list">${rows}</div>`);}
