/* ---------- QUICK PRICE: the customer asks "how much with this oil? and that one?" — every brand's full price
   (oil for this car's litres + filter + labour) in one list, before any job card exists ---------- */
const QK={oil:{t:'Engine oil change',ic:'🛢'},gear:{t:'Gearbox oil',ic:'⚙️'}};
function quoteCar(Q){if(Q.vid){const v=byId('vehicles',Q.vid);if(v)return v;}return Q.car?Object.assign({id:'_q'},Q.car):null;}
function quoteRows(v,kind,fid){const R=RX[kind];if(!R)return {rows:[],qty:0};const rec=kind==='oil'?oilRecipe(v,'usual'):null;const sp=kind==='oil'?specOf(v):null;
  const qty=kind==='oil'?(rec&&rec.qty)||(sp&&sp.cap)||guessLitres('oil',v):(learned(kind,v)||guessLitres(kind,v));
  const fopts=kind==='oil'?filterOpts(v,rec):[];const pick=fid&&fopts.find(o=>o.p.id===fid);const filter=kind==='oil'?((pick&&pick.p)||(rec&&rec.filter)||makerFilter(v)||fitsFilter(v)):null;if(filter&&!fopts.some(o=>o.p.id===filter.id))fopts.unshift({p:filter,n:0});const svc=DB.services.find(s=>rxOf(s)===kind);const lab=svc?svcPrice(svc,v):0;const fP=filter?(+filter.price||0):0;
  const last={};if(v.id!=='_q')DB.jobs.filter(j=>j.veh===v.id).sort((a,b)=>a.t-b.t).forEach(j=>(j.items||[]).forEach(i=>{const p=partOfItem(i);if(p&&R.cat.includes(p.cat))last.id=p.id;}));
  const rows=DB.parts.filter(p=>R.cat.includes(p.cat)&&(+p.price||0)>0).map(p=>{const g=gradeOf(p),next=g&&GRADE[g]?GRADE[g][1]:0;const oil=r3(qty*(+p.price||0));const total=r3(oil+fP+lab);
    const cost=r3(qty*(+p.cost||0)+(filter?(+filter.cost||0):0));return {p,visc:viscTxt(p.name),g,next,oil,total,profit:r3(total-cost),per:next?total/next*1000:0,out:(+p.stock||0)<qty-0.0001,usual:!!(rec&&rec.oil&&rec.oil.id===p.id),last:last.id===p.id};});
  rows.sort((a,b)=>a.total-b.total);const per=rows.filter(r=>r.per).map(r=>r.per);const best=per.length>1?Math.min(...per):0;rows.forEach(r=>r.best=best&&Math.abs(r.per-best)<1e-9);
  const okV=kind==='oil'?[...new Set([rec&&rec.visc,...(sp?sp.visc:[])].filter(Boolean))]:[];
  return {rows,qty:Math.round(qty*10)/10,filter,fopts,svc,lab,fP,rec,sp,okV};}
SCREENS.quote=m=>{const Q=S.quote||(S.quote={vid:null,car:null,kind:'oil',vf:'auto',cv:false,q:''});const v=quoteCar(Q);
  let h=head('Quick price',v?`<button class="lnk" id="qcv">${Q.cv?T_('Workshop view'):'👁 '+T_('Customer view')}</button>`:'');
  if(!v){h+=`<p class="hint">${T_('Type the plate or the customer, or choose the make and model.')}</p><input class="field" id="qq" placeholder="${T_('Plate, phone or name…')}" value="${esc(Q.q)}" autocomplete="off" autocorrect="off" spellcheck="false"><div id="qres"></div><button class="btn ghost" id="qpick">🚗 ${T_('Choose make, model, year')}</button>`;
    m.innerHTML=h;const inp=$('#qq');const draw=()=>{const q=lc(inp.value).trim();Q.q=inp.value;const box=$('#qres');if(q.length<2){box.innerHTML='';return;}
      const cs=DB.customers.filter(c=>lc(c.name).includes(q)||(c.phone||'').includes(q)).map(c=>c.id);
      const vs=DB.vehicles.filter(x=>lc(x.plate).replace(/\s/g,'').includes(q.replace(/\s/g,''))||lc(carName(x)).includes(q)||cs.includes(x.cust)).slice(0,8);
      box.innerHTML=vs.length?`<div class="list">${vs.map(x=>`<button class="row" data-qv="${x.id}"><div><b>${esc(carName(x))} ${x.plate?`<span class="pl">${esc(x.plate)}</span>`:''}</b><span>${esc((byId('customers',x.cust)||{}).name||'')}${effEng(x)?' · '+esc(effEng(x)):''}</span></div><span class="v">›</span></button>`).join('')}</div>`:'';
      box.querySelectorAll('[data-qv]').forEach(b=>b.onclick=()=>{Q.vid=b.dataset.qv;Q.car=null;Q.vf='auto';Q.fid=null;render();});};
    inp.oninput=draw;draw();setTimeout(()=>inp.focus(),60);
    $('#qpick').onclick=()=>carPicker({},r=>{Q.car=r;Q.vid=null;Q.vf='auto';Q.fid=null;render();});return;}
  const D=quoteRows(v,Q.kind,Q.fid);const cust=v.id!=='_q'&&byId('customers',v.cust);
  let rows=D.rows;const visc=[...new Set(rows.map(r=>r.visc).filter(Boolean))].sort();
  const vf=Q.vf==='auto'?(D.okV.length&&rows.some(r=>D.okV.includes(r.visc))?'ok':'all'):Q.vf;
  if(vf==='ok')rows=rows.filter(r=>D.okV.includes(r.visc));else if(vf!=='all')rows=rows.filter(r=>r.visc===vf);
  const ex=[D.qty+' L',D.filter?'🔩 '+(D.filter.num||D.filter.name):'',D.svc?T_('labour')+' '+f3(D.lab):''].filter(Boolean).join(' · ');
  h+=`<div class="card qcar"><div class="h"><b>${esc(carName(v)||'')}${v.plate?` <span class="pl">${esc(v.plate)}</span>`:''}</b><button class="lnk" id="qchg">${T_('Change')}</button></div><span class="sub">${cust?esc(cust.name)+' · ':''}${esc(effEng(v)||T_('engine not known'))}</span></div>
   <div class="chips" id="qkind">${Object.entries(QK).map(([k,o])=>`<button data-k="${k}" aria-pressed="${Q.kind===k}">${o.ic} ${T_(o.t)}</button>`).join('')}</div>
   ${Q.kind==='oil'?`<div class="chips qvf" data-notr>${D.okV.length?`<button data-vf="ok" aria-pressed="${vf==='ok'}">✓ ${esc(D.okV.join(' / '))}</button>`:''}${visc.filter(x=>!D.okV.includes(x)).map(x=>`<button data-vf="${esc(x)}" aria-pressed="${vf===x}">${esc(x)}</button>`).join('')}<button data-vf="all" aria-pressed="${vf==='all'}">${T_('All')}</button></div>`:''}
   <p class="hint qex" dir="ltr" data-notr>${esc(ex)}</p>
   ${Q.kind==='oil'&&!Q.cv&&D.fopts.length>1?`<div class="lbl">${T_('Filter')}</div><div class="chips qfo" data-notr>${D.fopts.slice(0,6).map(o=>`<button data-fo="${o.p.id}" aria-pressed="${D.filter&&D.filter.id===o.p.id}">${esc(o.p.num||o.p.name)} · ${f3(o.p.price)}${o.n?` <small>×${o.n}</small>`:''}${(+o.p.stock||0)<=0?' ⚠':''}</button>`).join('')}</div>`:''}
   ${rows.length?`<div class="${Q.cv?'qbig':'list'}">${rows.map(r=>`<button class="qrow${r.out?' out':''}" data-qp="${r.p.id}"><div class="qn"><b>${esc(r.p.name)}</b><span dir="ltr" data-notr>${[r.visc,r.g&&GRADE[r.g]?GRADE[r.g][0]:'',r.next?kmf(r.next)+' km':''].filter(Boolean).join(' · ')}</span>
     <div class="qtags">${r.usual?`<i class="tg tok">${T_('usual')}</i>`:''}${r.last?`<i class="tg">${T_('last time')}</i>`:''}${r.best?`<i class="tg tok">${T_('best per km')}</i>`:''}${r.out?`<i class="tg tgr">${T_('not enough in stock')}</i>`:''}</div></div>
     <div class="qt"><b>${f3(r.total)}</b>${r.per?`<span>${f3(r.per)} / 1000 km</span>`:''}${!Q.cv&&can.cost()?`<small>${T_('profit')} ${f3(r.profit)}</small>`:''}</div></button>`).join('')}</div>`:empty('🛢','No oils in the parts list for this.')}
   ${rows.length&&cust&&cust.phone?`<button class="btn wa" id="qwa">📤 ${T_('Send these prices on WhatsApp')}</button>`:''}`;
  m.innerHTML=h;
  $('#qchg').onclick=()=>{Q.vid=null;Q.car=null;Q.q='';Q.fid=null;render();};const cv=$('#qcv');if(cv)cv.onclick=()=>{Q.cv=!Q.cv;render();};
  $$('#qkind [data-k]').forEach(b=>b.onclick=()=>{Q.kind=b.dataset.k;Q.vf='auto';render();});
  $$('[data-vf]').forEach(b=>b.onclick=()=>{Q.vf=b.dataset.vf;render();});$$('[data-fo]').forEach(b=>b.onclick=()=>{Q.fid=b.dataset.fo;render();});
  const wa=$('#qwa');if(wa)wa.onclick=()=>{const cur=DB.ws.currency==='OMR'?'ر.ع':DB.ws.currency;const items=rows.slice(0,6).map(r=>'• '+r.p.name+(r.next?' ('+kmf(r.next)+' كم)':'')+': '+f3(r.total)+' '+cur).join('\n');
    shareText(cust.phone,msg('options',{name:cust.name||'',car:carName(v),plate:v.plate||'',service:Q.kind==='oil'?'تغيير زيت المحرك':'تغيير زيت ناقل الحركة',items}));};
  $$('[data-qp]').forEach(b=>b.onclick=()=>{const r=D.rows.find(x=>x.p.id===b.dataset.qp);openSheet(`<h3>${esc(r.p.name)}</h3><div class="card"><div class="jb-r"><div>${esc(r.p.name)}<small>${D.qty} L × ${f3(r.p.price)}</small></div><b>${f3(r.oil)}</b></div>${D.filter?`<div class="jb-r"><div>${esc(D.filter.name)}</div><b>${f3(D.fP)}</b></div>`:''}${D.svc?`<div class="jb-r"><div>${esc(D.svc.name)}</div><b>${f3(D.lab)}</b></div>`:''}<div class="jb-r tot"><div>${T_('Total')}</div><b>${f3(r.total)}</b></div></div>
     <button class="btn" id="qok">✅ ${T_('Customer agreed · open job card')}</button><button class="btn ghost" id="qest">🧾 ${T_('Make an estimate')}</button>`,el=>{
     const make=est=>{closeSheet();const items=[];if(D.svc){const it=svcItem(D.svc,v);it.grp='rxsvc';items.push(it);}if(D.filter)items.push({k:'part',ref:D.filter.id,d:D.filter.name,num:D.filter.num,q:1,u:'',p:+D.filter.price,cost:+D.filter.cost||0,grp:'rxoil',by:S.user.name});
       items.push({k:'part',ref:r.p.id,d:r.p.name,num:r.p.num,q:D.qty,u:'L',p:+r.p.price,cost:+r.p.cost||0,grp:Q.kind==='oil'?'rxoil':'',by:S.user.name});
       if(v.id!=='_q'){const j={id:uid('j'),no:DB.ws.nextJob++,dev:(typeof syncDev==='function'?syncDev():''),cust:v.cust,veh:v.id,km:v.km||0,stage:est?'estimate':'new',items,disc:0,t:now(),by:S.user.name,log:[[now(),(est?'Estimate':'Job')+' opened from quick price · '+S.user.name]],pays:[]};if(Q.kind==='oil')j.rx={oil:{mode:'usual',at:now()}};
         DB.jobs.push(j);save();S.quote=null;go('job',{id:j.id});toast((est?'Estimate':'Job')+' #'+j.no+' opened');}
       else{S.pendQuote={items,kind:Q.kind};S.quote=null;go('newjob',{n:{phone:'',name:'',plate:'',make:v.make||'',model:v.model||'',year:v.year||'',km:'',vin:'',engine:v.engine||'',est:!!est,custId:null,vehId:null}});toast(T_('Add the customer and the plate; the prices are kept.'));}};
     el.querySelector('#qok').onclick=()=>make(false);el.querySelector('#qest').onclick=()=>make(true);});});};
