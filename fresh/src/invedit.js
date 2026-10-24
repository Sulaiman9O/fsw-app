/* ---------- EDIT AN INVOICE: the customer wants one more thing, or there is a mistake.
   The invoice is opened again with the SAME number: parts go back to stock, payments stay, the job can be changed,
   and "Invoice & pay" makes it again (same number, only what is still due is taken; too much paid is given back). ---------- */
function reopenInvoice(j){if(!isInvoiced(j))return;const no=j.inv.no;
  (j.items||[]).forEach(it=>{if(it.k==='part'&&it.ref&&!it.custPart){const p=byId('parts',it.ref);if(p)mv(p,+it.q||0,'Invoice #'+no+' opened to edit',j.id);}});
  j.invEdit={no,t:j.inv.t,edited:j.inv.edited||0};delete j.inv;delete j.returned;j.stage='work';DB.reminders=(DB.reminders||[]).filter(r=>r.job!==j.id||r.sent);
  audit('invoice','Invoice #'+no+' opened to edit · '+carName(vehOf(j)));logJ(j,'Invoice #'+no+' opened to edit');save();}
function editInvAsk(j){if(!can.invoice()){toast(T_('Ask the manager to edit the invoice'));return;}
  openSheet(`<h3>🧾 ${T_('Invoice')} #${j.inv.no}</h3><p class="hint">${T_('To change or add something, open the invoice to edit. It keeps the same number; parts go back to stock until you make it again.')}</p>
   <button class="btn" id="ieok">✏️ ${T_('Edit the invoice')}</button><button class="btn ghost" id="ieinv">${T_('Open the invoice')}</button>`,el=>{
    el.querySelector('#ieok').onclick=()=>{reopenInvoice(j);closeSheet();go('job',{id:j.id});toast(T_('Change what you need, then “Invoice & pay”.'));};
    el.querySelector('#ieinv').onclick=()=>{closeSheet();go('inv',{id:j.id});};});}
/* too much paid after an edit that lowered the total → the difference is given back */
(function(){const II=issueInvoice;window.issueInvoice=issueInvoice=function(j){const ed=!!j.invEdit;II(j);if(!ed)return;const T=jobTotals(j);const over=Math.round((T.paid-T.total)*1000)/1000;
  if(over>0.0005){const last=(j.pays||[]).filter(p=>!isCreditM(p.m)&&+p.amt>0).slice(-1)[0];j.pays.push({m:last?last.m:'Cash',amt:-over,t:now(),by:S.user.name,refund:1});logJ(j,'Give back '+f3(over));toast(T_('Give the customer back')+' '+f3(over));}};})();
/* the ways in: the invoice page and the job page */
(function(){const IV=SCREENS.inv;SCREENS.inv=m=>{IV(m);const j=byId('jobs',S.p&&S.p.id);if(!j||!isInvoiced(j)||j.returned||!can.invoice())return;
    const ret=m.querySelector('#iret');const b=document.createElement('button');b.className='btn';b.innerHTML='✏️ '+T_('Edit the invoice');b.onclick=()=>editInvAsk(j);(ret||m.lastChild).before(b);};
  const J=SCREENS.job;SCREENS.job=m=>{J(m);const j=byId('jobs',S.p&&S.p.id);if(!j)return;
    if(isInvoiced(j)&&!j.returned&&can.invoice()){const list=m.querySelector('.jb-list');if(list){const b=document.createElement('button');b.className='btn ghost';b.innerHTML='✏️ '+T_('Edit the invoice')+' · '+T_('add or change items');b.onclick=()=>editInvAsk(j);list.after(b);}}
    if(j.invEdit){const h=m.querySelector('.card');if(h){const d=document.createElement('div');d.className='guess';d.textContent='✏️ '+T_('Editing invoice')+' #'+j.invEdit.no+' · '+T_('make it again with “Invoice & pay”');h.after(d);}}};})();
