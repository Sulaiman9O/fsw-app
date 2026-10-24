/* ---------- QUICK SALE: a customer buys parts over the counter, no car.
   Search or scan → ＋/− → pay. It is kept as an invoice like any other (same numbers, stock taken out, in today's sales),
   marked kind:'sale' and with no car, so no reminders, sticker or inspection. ---------- */
const isSale=j=>j&&j.kind==='sale';
function saleCust(phone,name){const ph=String(phone||'').replace(/[^\d+]/g,''),nm=String(name||'').trim();
  if(ph){const ex=custByPhone(ph);if(ex&&(!nm||isWalk(ex)||lc(ex.name).trim()===lc(nm))){if(nm&&isWalk(ex))ex.name=nm;return ex;}}
  if(ph||nm){const c={id:uid('c'),name:nm||'Walk-in',phone:ph,t:now()};DB.customers.push(c);return c;}
  let w=DB.customers.find(c=>c.counter);if(!w){w={id:uid('c'),name:'Walk-in',phone:'',t:now(),counter:1};DB.customers.push(w);}return w;}
SCREENS.sale=m=>{const Q=S.sale||(S.sale={items:[],q:'',phone:'',name:''});const T=Q.items.reduce((a,i)=>a+(+i.q||0)*(+i.p||0),0);
  const unitOf=p=>p.unit==='L'||p.cat==='Engine oil'?'L':'';
  m.innerHTML=head('Quick sale',Q.items.length?`<button class="lnk" id="slclr">${T_('Clear')}</button>`:'')+`
   <div class="srow ssrch"><input class="field" id="slq" placeholder="${T_('Part name or number…')}" value="${esc(Q.q)}" autocomplete="off" autocorrect="off" spellcheck="false"><button class="btn ghost sq" id="slscan">📷</button></div>
   <div id="slres"></div>
   ${Q.items.length?`${sec(T_('Basket'),Q.items.length+' '+T_('items'))}<div class="jb-list">${Q.items.map((i,k)=>`<div class="jb-r slr"><div><bdi>${esc(i.d)}</bdi><small><bdi>${f3(i.p)}${i.u?' / '+i.u:''}</bdi>${(()=>{const p=i.ref&&byId('parts',i.ref);return p&&(+p.stock||0)<(+i.q||0)?' · ⚠️ '+T_('not enough in stock'):'';})()}</small></div>
     <div class="st"><button data-sq="${k}|-1">−</button><input class="qin" data-sqi="${k}" inputmode="decimal" value="${+i.q}"><button data-sq="${k}|1">+</button></div><b><bdi>${f3((+i.q||0)*(+i.p||0))}</bdi></b></div>`).join('')}
     <div class="jb-r tot"><div>${T_('Total')}</div><b><bdi>${f3(T)} ${esc(DB.ws.currency)}</bdi></b></div></div>
    <details class="pmore" ${Q.phone||Q.name?'open':''}><summary>👤 ${T_('Customer (optional)')}</summary><div class="in2"><input class="field" id="slph" inputmode="tel" placeholder="${T_('Phone')}" value="${esc(Q.phone)}"><input class="field" id="slnm" placeholder="${T_('Name')}" value="${esc(Q.name)}"></div></details>
    <div class="paybar"><div><small>${T_('Total')}</small><b>${f3(T)} <span>${esc(DB.ws.currency)}</span></b></div><button class="btn okb" id="slpay">💵 ${T_('Pay')}</button></div>`
   :empty('🛒','Search a part or scan its barcode. Each tap adds one.')}`;
  const res=$('#slres'),inp=$('#slq');
  const add=p=>{const u=unitOf(p);const ex=Q.items.find(i=>i.ref===p.id);if(ex)ex.q=Math.round(((+ex.q||0)+1)*100)/100;else Q.items.push({k:'part',ref:p.id,d:p.name,num:p.num,q:1,u,p:+p.price||0,cost:+p.cost||0,by:S.user.name});Q.q='';render();setTimeout(()=>{const i=$('#slq');if(i)i.focus();},50);};
  const draw=()=>{Q.q=inp.value;const t=normQ(inp.value);if(t.length<2){res.innerHTML='';return;}
    const L=DB.parts.filter(p=>normQ((p.num||'')+' '+p.name+' '+(p.codes||[]).join(' ')).includes(t)).sort((a,b)=>((+b.stock||0)>0)-((+a.stock||0)>0)).slice(0,12);
    res.innerHTML=L.length?`<div class="list">${L.map(p=>`<button class="row" data-sp="${p.id}"><div><b><bdi>${esc(p.name)}</bdi></b><span>${+p.stock||0} ${unitOf(p)||T_('pc')} ${T_('in stock')}</span></div><span class="v"><bdi>${f3(p.price)}</bdi> ＋</span></button>`).join('')}</div>`:`<p class="hint">${T_('Nothing found')}</p>`;
    res.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>add(byId('parts',b.dataset.sp)));};
  inp.oninput=draw;draw();if(!Q.items.length)setTimeout(()=>inp.focus(),60);
  $('#slscan').onclick=()=>scanSheet(c=>{const p=findByCode(c);if(p)add(p);else toast(T_('No part with this barcode'));});
  const cl=$('#slclr');if(cl)cl.onclick=()=>{S.sale=null;render();};
  $$('[data-sq]').forEach(b=>b.onclick=()=>{const [k,d]=b.dataset.sq.split('|');const it=Q.items[+k];const st=it.u==='L'?0.5:1;it.q=Math.round(((+it.q||0)+st*(+d))*100)/100;if(it.q<=0)Q.items.splice(+k,1);render();});
  $$('[data-sqi]').forEach(e=>e.onchange=()=>{const it=Q.items[+e.dataset.sqi];const x=num(e.value);if(x>0)it.q=x;else Q.items.splice(+e.dataset.sqi,1);render();});
  const ph=$('#slph'),nm=$('#slnm');if(ph)ph.oninput=()=>{Q.phone=ph.value;};if(nm)nm.oninput=()=>{Q.name=nm.value;};
  const pay=$('#slpay');if(pay)pay.onclick=()=>openSheet(`<h3>🧾 ${T_('Invoice')} · ${f3(T)} ${esc(DB.ws.currency)}</h3><div class="paym">${DB.ws.pay.map(p=>`<button class="btn${isCreditM(p)?' ghost':''}" data-pm="${esc(p)}">${esc(T_(p))}</button>`).join('')}</div>`,el=>{
    el.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>{const mth=b.dataset.pm;if(isCreditM(mth)&&!(Q.phone||Q.name)){toast(T_('On credit needs the customer name or phone'));return;}
      const c=saleCust(Q.phone,Q.name);const j={id:uid('j'),kind:'sale',no:DB.ws.nextJob++,dev:(typeof syncDev==='function'?syncDev():''),cust:c.id,veh:'',km:0,stage:'done',items:Q.items.map(i=>Object.assign({},i)),disc:0,t:now(),by:S.user.name,log:[[now(),'Quick sale · '+S.user.name]],pays:[]};
      DB.jobs.push(j);issueInvoice(j);j.stage='done';const T2=jobTotals(j);
      if(isCreditM(mth)){j.credit=now();logJ(j,'On credit (to pay later) · due '+f3(T2.due));audit('pay','On credit · invoice #'+j.inv.no+' · '+f3(T2.due));}
      else{j.pays.push({m:mth,amt:T2.due,t:now(),by:S.user.name});audit('pay','Payment '+f3(T2.due)+' '+mth+' · invoice #'+j.inv.no);logJ(j,'Paid '+f3(T2.due)+' · '+mth);}
      S.sale=null;save();closeSheet();go('inv',{id:j.id});toast(T_('Done ✓'));});});};
/* a sale in the lists: no car, opens its invoice */
(function(){const CR=carRow;window.carRow=carRow=function(j){if(!isSale(j))return CR(j);const c=custOf(j),T=jobTotals(j);const unpaid=!j.returned&&T.due>0;
  return `<button class="car" data-go="inv:${j.id}" style="--sc:${unpaid?'var(--bad)':'var(--dim)'}"><div class="no">#${j.no}</div><div class="tx"><b>🛒 ${T_('Quick sale')}</b><span>${esc(isWalk(c)?T_('Walk-in'):c.name||'')}${(j.items||[]).length?' · '+esc(j.items.slice(0,2).map(i=>i.d).join(' + ')):''}</span></div><div class="st">${unpaid?T_('Not paid').toUpperCase():T_('Done').toUpperCase()} <small>${f3(unpaid?T.due:T.total)}</small></div></button>`;};
  /* the job screen is for cars: a sale opens its invoice */
  const J=SCREENS.job;SCREENS.job=m=>{const j=byId('jobs',S.p&&S.p.id);if(isSale(j)&&j.inv){go('inv',{id:j.id});return;}J(m);};
  /* the way in: the counter */
  const C=SCREENS.counter;SCREENS.counter=m=>{C(m);const q=m.querySelector('#cq');if(!q)return;const b=document.createElement('button');b.className='btn ghost ctrsale';b.innerHTML='🛒 '+T_('Quick sale (no car)');b.onclick=()=>go('sale');q.before(b);};})();
