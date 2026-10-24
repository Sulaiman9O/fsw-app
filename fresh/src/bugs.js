/* 🐞 "Something is wrong": two words + what was on the screen are kept, so a problem met with a customer waiting is not lost.
   The owner copies the list and sends it; nothing leaves the phone by itself. */
function bugSnap(){const o={r:S.r,t:now(),by:S.user&&S.user.name};try{if(S.p&&S.p.id){const j=byId('jobs',S.p.id);if(j){const v=vehOf(j);o.job={no:j.no,stage:j.stage,car:carName(v),eng:v&&v.engine||'',items:(j.items||[]).map(i=>[i.d,+i.q,i.u||'',+i.p].join(' | '))};}}
  if(S.r==='quote'&&S.quote){const Q=S.quote;const v=quoteCar(Q);o.quote={car:v?carName(v)+' '+(v.engine||''):'',kind:Q.kind,vf:Q.vf,fid:Q.fid||''};}}catch(e){}return o;}
function bugSheet(){const snap=bugSnap();
  openSheet(`<h3>🐞 ${T_('Something is wrong')}</h3><p class="hint">${T_('Write two words. What is on the screen is kept with it, so you can carry on with the customer.')}</p>
   <textarea class="field" id="bgn" rows="3" placeholder="${T_('e.g. wrong filter, price too low, could not find…')}"></textarea>
   <button class="btn" id="bgok">${T_('Save')}</button>${(DB.bugs||[]).length?`<button class="btn ghost" id="bgl">${T_('Saved problems')} · ${DB.bugs.length}</button>`:''}`,el=>{
    setTimeout(()=>{const t=el.querySelector('#bgn');if(t)t.focus();},80);
    el.querySelector('#bgok').onclick=()=>{const n=el.querySelector('#bgn').value.trim();if(!n){toast(T_('Write two words'));return;}DB.bugs=DB.bugs||[];DB.bugs.push(Object.assign({id:uid('b'),note:n},snap));save();closeSheet();toast(T_('Saved. Carry on.'));};
    const l=el.querySelector('#bgl');if(l)l.onclick=()=>{closeSheet();go('bugs');};});}
function bugText(b){const L=['🐞 '+fmtD(b.t)+' '+hm(b.t)+' · '+(b.by||'')+' · '+b.r,b.note];if(b.job)L.push('#'+b.job.no+' '+b.job.car+' '+b.job.eng+' ['+b.job.stage+']',...b.job.items.map(x=>'  - '+x));if(b.quote)L.push('quote: '+b.quote.car+' · '+b.quote.kind+' · '+b.quote.vf);return L.join('\n');}
SCREENS.bugs=m=>{const L=(DB.bugs||[]).slice().sort((a,b)=>b.t-a.t);
  m.innerHTML=head('Saved problems',L.length?`<button class="lnk" id="bgc">📋 ${T_('Copy all')}</button>`:'')+(L.length?`<p class="hint">${T_('Copy all and send them in one message; they get fixed together.')}</p><div class="list">${L.map(b=>`<div class="row"><div><b>${esc(b.note)}</b><span>${fmtD(b.t)} ${hm(b.t)} · ${esc(b.by||'')}${b.job?' · #'+b.job.no+' '+esc(b.job.car):''}${b.quote?' · '+esc(b.quote.car):''}</span></div><button class="lnk" data-bd="${b.id}">✓ ${T_('Fixed')}</button></div>`).join('')}</div>`:empty('🐞','Nothing saved. Tap 🐞 at the top when something is wrong.'));
  const c=$('#bgc');if(c)c.onclick=()=>{const t=L.map(bugText).join('\n\n');try{navigator.clipboard.writeText(t);toast(T_('Copied'));}catch(e){}};
  $$('[data-bd]').forEach(b=>b.onclick=()=>{DB.bugs=DB.bugs.filter(x=>x.id!==b.dataset.bd);save();render();});};
