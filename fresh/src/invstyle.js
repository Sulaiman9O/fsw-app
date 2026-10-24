/* ---------- INVOICE LOOK: a modern invoice (and a clean one for black & white printers), set up in Settings → Invoice look:
   template, colour, logo and its size, language of the labels, what shows, and the footer lines. ---------- */
const INV_ACC=['#EE3A39','#1D6FE0','#0F9D58','#F28C28','#7B4FD6','#141414'];
const invS=()=>{const d={t:'modern',acc:'#EE3A39',lsz:'m',lang:'both',show:{num:1,ar:1,vin:1,km:1,next:1,sign:0,pays:1,notes:0},thanks:'',note:''};const s=DB.ws.invS||{};return Object.assign({},d,s,{show:Object.assign({},d.show,s.show||{})});};
const INV2_CSS=`.iv2{--ia:#EE3A39;--ik:#141414;--im:#5A5A5A;--il:#E6E3DF;--ib:#F6F4F1;background:#fff;color:var(--ik);font-family:Tahoma,Arial,sans-serif;font-size:3.2mm;line-height:1.45;direction:rtl;text-align:right}
.iv2 bdi,.iv2 .ltr{direction:ltr;unicode-bidi:isolate}
.iv2-bar{display:flex;height:2.4mm}.iv2-bar i{flex:1;background:var(--ik)}.iv2-bar i+i{flex:0 0 38mm;background:var(--ia)}
.iv2-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:6mm;margin-top:6mm}
.iv2-brand img{display:block;max-width:70mm;object-fit:contain}.iv2-brand .nm{font-size:6mm;font-weight:800}.iv2-brand small{display:block;color:var(--im);font-size:2.8mm;margin-top:1.5mm}
.iv2-ttl{text-align:left}.iv2-ttl b{display:block;font-size:9mm;font-weight:800;letter-spacing:.8mm;line-height:1;direction:ltr}.iv2-ttl span{display:block;font-size:5mm;font-weight:700;margin-top:1mm}.iv2-ttl em{display:block;font-style:normal;font-size:7mm;font-weight:800;color:var(--ia);margin-top:1mm;direction:ltr}
.iv2-strip{display:grid;grid-template-columns:repeat(4,1fr);border-top:.6mm solid var(--ik);border-bottom:.25mm solid var(--il);margin-top:5mm}
.iv2-strip>div{padding:2.2mm 3mm}.iv2-strip>div+div{border-right:.25mm solid var(--il)}.iv2-strip small{display:block;color:var(--im);font-size:2.5mm}.iv2-strip b{font-size:3.5mm}
.iv2-st.ok{color:#0F8A4C}.iv2-st.due{color:#C8282B}
.iv2-cards{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm;margin-top:4mm}.iv2-cards>div{background:var(--ib);border-radius:2.5mm;padding:3mm 3.5mm}
.iv2-cards .lb{font-size:2.5mm;font-weight:700;color:var(--ia);letter-spacing:.2mm}.iv2-cards .big{font-size:4.2mm;font-weight:700;margin-top:1mm}.iv2-cards .sm{font-size:2.9mm;color:var(--im);margin-top:.6mm}
.iv2-pl{display:inline-block;border:.35mm solid var(--ik);border-radius:1.2mm;padding:0 2mm;font-weight:700;font-size:3.1mm;margin-top:1mm;direction:ltr}
.iv2-t{width:100%;border-collapse:collapse;margin-top:5mm;font-size:3.1mm}.iv2-t th{background:var(--ik);color:#fff;font-weight:600;font-size:2.8mm;padding:2.2mm 3mm;text-align:right}
.iv2-t th.c,.iv2-t td.c{text-align:center}.iv2-t th.a,.iv2-t td.a{text-align:left}.iv2-t td{padding:2mm 3mm;border-bottom:.25mm solid #EFECE8;vertical-align:top}
.iv2-t tr.iv2-g td{background:var(--ib);font-weight:700;font-size:2.8mm;color:var(--ia);padding:1.6mm 3mm;border:0}
.iv2-t .d{font-weight:600}.iv2-t .x{display:block;font-size:2.6mm;color:var(--im);font-weight:400;margin-top:.4mm}
.iv2-bot{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:5mm;align-items:start}
.iv2-box{border:.35mm solid var(--ik);border-radius:2.5mm;padding:3mm 3.5mm;font-size:2.9mm;white-space:pre-wrap}.iv2-box b{display:block;font-size:3.1mm;margin-bottom:1mm;white-space:normal}.iv2-box+.iv2-box{margin-top:3mm}
.iv2-next{border-color:var(--ia)}.iv2-next .v{font-size:4mm;font-weight:800;color:var(--ia)}
.iv2-tot{background:var(--ik);color:#D6D2CC;border-radius:2.5mm;padding:3.5mm 4mm}.iv2-tot>div{display:flex;justify-content:space-between;padding:.7mm 0}
.iv2-tot .t{border-top:.25mm solid #3A3A3A;margin-top:1.5mm;padding-top:2mm;color:#fff;font-weight:700}.iv2-tot .due{align-items:flex-end;color:#fff;padding-top:2mm}.iv2-tot .due b{font-size:8mm;line-height:1}
.iv2-tot .due small{display:block;font-size:2.4mm;color:#D6D2CC}.iv2-tot .ln{height:1.2mm;background:var(--ia);border-radius:1mm;margin-top:2mm}
.iv2-paid{display:inline-block;margin-top:2mm;border:.5mm solid #0F8A4C;color:#0F8A4C;border-radius:1.5mm;padding:.8mm 3mm;font-weight:800;font-size:3.3mm;transform:rotate(-3deg)}
.iv2-sign{display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:9mm;font-size:2.8mm;color:var(--im)}.iv2-sign div{border-top:.3mm solid var(--ik);padding-top:1.5mm}
.iv2-ft{display:flex;justify-content:space-between;gap:4mm;border-top:.25mm solid var(--il);margin-top:6mm;padding-top:3mm;font-size:2.9mm}.iv2-ft b{font-size:3.6mm}.iv2-ft small{display:block;color:var(--im)}
.iv2-end{height:1.6mm;background:var(--ik);margin-top:5mm}
.iv2.clean .iv2-bar i{background:var(--ia)}.iv2.clean .iv2-bar i+i{display:none}.iv2.clean .iv2-t th{background:none;color:var(--ik);border-bottom:.5mm solid var(--ia)}
.iv2.clean .iv2-tot{background:none;color:var(--ik);border:.4mm solid var(--ia)}.iv2.clean .iv2-tot .t,.iv2.clean .iv2-tot .due,.iv2.clean .iv2-tot .due small{color:var(--ik);border-color:var(--il)}.iv2.clean .iv2-end{background:var(--ia);height:.8mm}.iv2.clean .iv2-cards>div{background:none;border:.25mm solid var(--il)}
.inv-pv .iv2{padding:6mm;width:190mm;box-sizing:border-box}`;
(function(){const st=document.createElement('style');st.textContent=INV2_CSS;document.head.appendChild(st);})();
function invNext(j){const r=(DB.reminders||[]).filter(x=>x.job===j.id&&(x.kind==='oil'||x.kind==='gear')).sort((a,b)=>a.due-b.due)[0];return r||null;}
function invoiceModern(j,I){I=I||invS();const v=vehOf(j)||{},c=custOf(j)||{},T=jobTotals(j);const W=DB.ws;const sh=I.show;
  const L=(ar,en)=>I.lang==='ar'?ar:I.lang==='en'?en:ar+' · '+en;const cur=W.currency==='OMR'?(I.lang==='en'?'OMR':'ر.ع'):W.currency;
  const lh={s:'12mm',m:'18mm',l:'26mm'}[I.lsz]||'18mm';
  const inPk=i=>i.k==='pkg'||i.inPkg||i.pkgx;const P=(j.items||[]).filter(i=>i.k==='pkg');
  const rows=k=>(j.items||[]).filter(i=>(k==='part'?i.k==='part':i.k!=='part')&&!i.pend&&!inPk(i)).map(i=>`<tr><td><span class="d"><bdi>${esc(i.d)}</bdi></span>${sh.ar&&i.ar?`<span class="x">${esc(i.ar)}</span>`:''}${sh.num&&i.num?`<span class="x"><bdi>${esc(i.num)}</bdi></span>`:''}${i.war?`<span class="x">${L('الضمان','Warranty')}: ${esc(i.war)}</span>`:''}${i.note?`<span class="x">📝 ${esc(i.note)}</span>`:''}${i.free?`<span class="x">${L('مجاناً','Free')}</span>`:''}</td><td class="c"><bdi>${+i.q}${i.u?' '+esc(i.u):''}</bdi></td><td class="c"><bdi>${f3(i.p)}</bdi></td><td class="a"><bdi>${f3((+i.q||0)*(+i.p||0))}</bdi></td></tr>`).join('');
  const pa=rows('part'),la=rows('labour');
  /* packages: one line at the package price, what it includes as quantities only, extras at their price */
  const pk=P.map(k=>`<tr><td><span class="d">📦 ${esc(k.d)}</span>${sh.ar&&k.ar?`<span class="x">${esc(k.ar)}</span>`:''}${k.desc?`<span class="x">${esc(k.desc)}</span>`:''}</td><td class="c">1</td><td class="c"><bdi>${k.p0&&Math.abs(k.p0-k.p)>0.0005?`<s style="color:#888">${f3(k.p0)}</s> `:''}${f3(k.p)}</bdi></td><td class="a"><bdi>${f3(k.p)}</bdi></td></tr>`+
    j.items.filter(i=>i.inPkg===k.inst).map(i=>`<tr><td style="padding-inline-start:7mm"><span class="x" style="font-size:2.9mm;color:var(--ik)">· <bdi>${esc(i.d)}</bdi>${sh.ar&&i.ar?' · '+esc(i.ar):''}</span></td><td class="c"><bdi>${+i.q}${i.u?' '+esc(i.u):''}</bdi></td><td colspan="2" class="a" style="color:var(--im);font-size:2.6mm">${L('ضمن الباقة','Included')}</td></tr>`).join('')+
    j.items.filter(i=>i.pkgx===k.inst).map(i=>`<tr><td style="padding-inline-start:7mm"><bdi>${esc(i.d)}</bdi></td><td class="c"><bdi>${+i.q}${i.u?' '+esc(i.u):''}</bdi></td><td class="c"><bdi>${f3(i.p)}</bdi></td><td class="a"><bdi>${f3(i.q*i.p)}</bdi></td></tr>`).join('')).join('');const nx=sh.next&&invNext(j);const paid=T.due<=0&&T.total>0&&!j.returned;
  const st=j.returned?`<b class="iv2-st due">${L('مرتجعة','Returned')}</b>`:paid?`<b class="iv2-st ok">● ${L('مدفوعة','Paid')}</b>`:`<b class="iv2-st due">● ${L('مستحقة','Due')}</b>`;
  const payTxt=(j.pays||[]).filter(p=>!isCreditM(p.m)).map(p=>T_(p.m)).filter((x,i,a)=>a.indexOf(x)===i).join('، ');
  return `<div class="iv2${I.t==='clean'?' clean':''}" data-notr style="--ia:${esc(I.acc)}"><div class="iv2-bar"><i></i><i></i></div>
   <div class="iv2-hd"><div class="iv2-brand">${W.logo?`<img src="${W.logo}" style="height:${lh}" alt="">`:`<div class="nm">${esc(W.name)}</div>`}<small>${[W.logo?W.name:'',W.addr,W.phone?'<bdi>'+esc(W.phone)+'</bdi>':'',W.cr?L('س.ت','CR')+' <bdi>'+esc(W.cr)+'</bdi>':''].filter(Boolean).map(x=>/<bdi>/.test(x)?x:esc(x)).join(' · ')}</small></div>
    <div class="iv2-ttl">${I.lang!=='ar'?'<b>INVOICE</b>':''}${I.lang!=='en'?'<span>فاتورة</span>':''}<em>#${j.inv?j.inv.no:j.no}</em></div></div>
   <div class="iv2-strip"><div><small>${L('التاريخ','Date')}</small><b><bdi>${fmtD(j.inv?j.inv.t:j.t)}</bdi></b></div><div><small>${L('العداد','Odometer')}</small><b><bdi>${sh.km&&j.km?kmf(j.km)+' km':'—'}</bdi></b></div><div><small>${L('الحالة','Status')}</small>${st}</div><div><small>${L('أمر العمل','Job')}</small><b><bdi>#${j.no}</bdi></b></div></div>
   <div class="iv2-cards"><div><div class="lb">${L('العميل','BILL TO')}</div><div class="big">${esc(isWalk(c)?L('عميل نقدي','Cash customer'):c.name||'—')}</div>${c.phone?`<div class="sm"><bdi>${esc(c.phone)}</bdi></div>`:''}</div>
    ${j.kind==='sale'?`<div><div class="lb">${L('البيع','SALE')}</div><div class="big">${L('بيع مباشر','Counter sale')}</div></div>`:`<div><div class="lb">${L('المركبة','VEHICLE')}</div><div class="big"><bdi>${esc(carName(v)||'—')}</bdi></div>${v.plate?`<span class="iv2-pl">${esc(v.plate)}</span>`:''}${sh.vin&&v.vin?`<div class="sm"><bdi>VIN ${esc(v.vin)}</bdi></div>`:''}</div>`}</div>
   <table class="iv2-t"><thead><tr><th>${L('الوصف','Description')}</th><th class="c" style="width:18mm">${L('الكمية','Qty')}</th><th class="c" style="width:22mm">${L('السعر','Unit')}</th><th class="a" style="width:24mm">${L('المبلغ','Amount')}</th></tr></thead>
    <tbody>${pk?`<tr class="iv2-g"><td colspan="4">${L('الباقات','Packages')}</td></tr>${pk}`:''}${pa?`<tr class="iv2-g"><td colspan="4">${L('قطع الغيار والزيوت','Parts')}</td></tr>${pa}`:''}${la?`<tr class="iv2-g"><td colspan="4">${L('الخدمات والأجور','Labour')}</td></tr>${la}`:''}</tbody></table>
   <div class="iv2-bot"><div>${nx?`<div class="iv2-box iv2-next"><b>${L('الصيانة القادمة','Next service')}</b><span class="v"><bdi>${nx.dueKm?kmf(nx.dueKm)+' km':''}</bdi></span>${nx.dueKm?' · ':''}<bdi>${fmtD(nx.due)}</bdi></div>`:''}${W.warranty?`<div class="iv2-box"><b>${L('الضمان والشروط','Warranty & terms')}</b>${esc(W.warranty)}</div>`:''}${j.notes&&sh.notes?`<div class="iv2-box"><b>${L('ملاحظات','Notes')}</b>${esc(j.notes)}</div>`:''}</div>
    <div><div class="iv2-tot">${T.parts?`<div><span>${L('قطع الغيار','Parts')}</span><bdi>${f3(T.parts)}</bdi></div>`:''}${T.labour?`<div><span>${L('الأجور','Labour')}</span><bdi>${f3(T.labour)}</bdi></div>`:''}${T.disc?`<div><span>${L('الخصم','Discount')}</span><bdi>−${f3(T.disc)}</bdi></div>`:''}
     <div class="t"><span>${L('الإجمالي','Total')}</span><bdi>${f3(T.total)} ${esc(cur)}</bdi></div>${sh.pays&&T.paid?`<div><span>${L('المدفوع','Paid')}${payTxt?' ('+esc(payTxt)+')':''}</span><bdi>${f3(T.paid)}</bdi></div>`:''}
     <div class="due"><span>${L('المبلغ المستحق','Balance due')}<small>${esc(cur)}</small></span><b><bdi>${f3(j.returned?0:T.due)}</bdi></b></div><div class="ln"></div></div>${paid?`<div style="text-align:center"><span class="iv2-paid">${L('مدفوعة','PAID')} ✓</span></div>`:''}</div></div>
   ${sh.sign?`<div class="iv2-sign"><div>${L('توقيع العميل','Customer signature')}</div><div>${L('توقيع الورشة','Workshop signature')}</div></div>`:''}
   <div class="iv2-ft"><div><b>${esc(I.thanks||L('شكراً لثقتكم','Thank you'))}</b>${I.note?`<small style="white-space:pre-wrap">${esc(I.note)}</small>`:''}</div><div style="text-align:left"><b>${esc(W.name)}</b>${W.phone?`<small><bdi>${esc(W.phone)}</bdi></small>`:''}</div></div>
   <div class="iv2-end"></div></div>`;}
(function(){const IH=invoiceHtml;window.invoiceHtml=invoiceHtml=function(j,print){return invS().t==='classic'?IH(j,print):invoiceModern(j);};})();
/* a sample for the preview when no invoice exists yet */
function invSample(){const j=DB.jobs.filter(x=>x.inv&&!x.returned&&(x.items||[]).length).sort((a,b)=>b.inv.t-a.inv.t)[0];if(j)return j;
  const v=DB.vehicles[0]||{id:'_v',make:'Toyota',model:'Camry',year:'2018',plate:'12345 AB'};return {id:'_s',no:1,veh:v.id,cust:v.cust,km:120500,t:now(),inv:{no:DB.ws.nextInv||1001,t:now()},items:[{k:'part',d:'Toyota Motor Oil 5W-30 F/S 4ltrs',q:4.5,u:'L',p:2.12},{k:'part',d:'Toyota Oil Filter 04152-YZZD1',num:'04152-YZZD1',q:1,p:2.5},{k:'labour',d:'Engine Oil Change',ar:'تغيير زيت المحرك',q:1,p:2.5}],pays:[],disc:0};}
SCREENS.invstyle=m=>{if(!can.settings()){go('more');return;}const I=invS();const W=DB.ws;
  const setI=(k,v)=>{const o=invS();if(k.startsWith('show.'))o.show[k.slice(5)]=v;else o[k]=v;DB.ws.invS=o;save();};
  const tg=(k,t)=>`<label class="chk"><input type="checkbox" data-sh="${k}" ${I.show[k]?'checked':''}> ${T_(t)}</label>`;
  m.innerHTML=head('Invoice look')+`
   ${sec('Template')}<div class="chips big">${[['modern','Modern'],['clean','Clean (black & white printers)'],['classic','Classic']].map(([k,t])=>`<button data-it2="${k}" aria-pressed="${I.t===k}">${T_(t)}</button>`).join('')}</div>
   ${I.t!=='classic'?`${sec('Colour')}<div class="sw">${INV_ACC.map(c=>`<button data-ac="${c}" class="${I.acc===c?'on':''}" style="background:${c}" title="${c}"></button>`).join('')}</div>`:''}
   ${sec('Logo')}<div class="logo-up"><label>${W.logo?`<img src="${W.logo}" alt="">`:'<span class="wsmark big">＋</span>'}<input type="file" accept="image/*" id="ilogo" hidden><span>${T_(W.logo?'Change logo':'Upload logo')}</span></label>${W.logo?`<button class="lnk" id="ilogox">${T_('Remove')}</button>`:''}</div>
   ${I.t!=='classic'&&W.logo?`<div class="chips">${[['s','Small'],['m','Medium'],['l','Large']].map(([k,t])=>`<button data-ls="${k}" aria-pressed="${I.lsz===k}">${T_(t)}</button>`).join('')}</div>`:''}
   ${I.t!=='classic'?`${sec('Labels')}<div class="chips">${[['both','Arabic + English'],['ar','Arabic'],['en','English']].map(([k,t])=>`<button data-lg="${k}" aria-pressed="${I.lang===k}">${T_(t)}</button>`).join('')}</div>
   ${sec('Show on the invoice')}${tg('num','Part numbers')}${tg('ar','Arabic names of services')}${tg('km','Odometer')}${tg('vin','VIN')}${tg('next','Next service (km and date)')}${tg('pays','What was paid and how')}${tg('notes','Job notes')}${tg('sign','Signature lines')}
   ${sec('Footer')}<label class="field-l">${T_('Thank-you line')}<input class="field" id="ith" value="${esc(I.thanks)}" placeholder="${T_('شكراً لثقتكم')}"></label>
   <label class="field-l">${T_('Extra line (bank account, opening hours…)')}<textarea class="field" id="inote" rows="2">${esc(I.note)}</textarea></label>`:''}
   <label class="field-l">${T_('Warranty / footer text')}<textarea class="field" id="iwar" rows="2">${esc(W.warranty||'')}</textarea></label>
   ${sec('Preview')}<div class="inv-pv" id="ipv"></div>
   <button class="btn ghost" id="iprint">🖨 ${T_('Print a test')}</button>`;
  const pv=()=>{const e=$('#ipv');if(e){e.innerHTML=invoiceHtml(invSample());fitInv();}};pv();
  $$('[data-it2]').forEach(b=>b.onclick=()=>{setI('t',b.dataset.it2);render();});
  $$('[data-ac]').forEach(b=>b.onclick=()=>{setI('acc',b.dataset.ac);$$('[data-ac]').forEach(x=>x.classList.toggle('on',x===b));pv();});
  $$('[data-ls]').forEach(b=>b.onclick=()=>{setI('lsz',b.dataset.ls);render();});
  $$('[data-lg]').forEach(b=>b.onclick=()=>{setI('lang',b.dataset.lg);render();});
  $$('[data-sh]').forEach(b=>b.onchange=()=>{setI('show.'+b.dataset.sh,b.checked?1:0);pv();});
  const ith=$('#ith');if(ith)ith.oninput=()=>{setI('thanks',ith.value);pv();};const ino=$('#inote');if(ino)ino.oninput=()=>{setI('note',ino.value);pv();};
  const iw=$('#iwar');iw.oninput=()=>{DB.ws.warranty=iw.value;save();pv();};
  $('#ilogo').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,700/Math.max(im.width,im.height));let c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));c.getContext('2d').drawImage(im,0,0,c.width,c.height);try{c=cleanLogoCanvas(c);}catch(x){}DB.ws.logo=c.toDataURL('image/png');audit('settings','Logo changed');save();render();toast(T_('Picture saved'));};im.src=r.result;};r.readAsDataURL(f);};
  const lx=$('#ilogox');if(lx)lx.onclick=()=>{DB.ws.logo='';save();render();};
  $('#iprint').onclick=()=>printHtml('<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:12mm}body{margin:0;font-family:Arial,sans-serif}'+INV_CSS+INV2_CSS+'</style></head><body>'+invoiceHtml(invSample(),true)+'</body></html>',210,297,'Invoice test');};
/* the way in: Settings → Invoices, and from any invoice (owner) */
(function(){const SE=SCREENS.settings;SCREENS.settings=m=>{SE(m);const w=m.querySelector('#swar');const at=w&&w.closest('label');if(!at)return;const b=document.createElement('button');b.className='mitem';b.innerHTML=`<span class="ic">🎨</span><div><b>${T_('Invoice look')}</b><span>${T_('Template, colour, logo, what shows')}</span></div><span class="v">›</span>`;b.onclick=()=>go('invstyle');at.before(b);};
  const IV=SCREENS.inv;SCREENS.inv=m=>{IV(m);if(!can.settings())return;const pv=m.querySelector('.inv-pv');if(!pv)return;const a=document.createElement('button');a.className='lnk';a.style.margin='4px 0 8px';a.textContent='🎨 '+T_('Change the invoice look');a.onclick=()=>go('invstyle');pv.after(a);};})();

/* the invoice is drawn at A4 width and scaled to fit the screen, so it looks like the printed page */
function fitInv(root){(root||document).querySelectorAll('.inv-pv').forEach(pv=>{const iv=pv.querySelector('.iv2');if(!iv)return;iv.style.zoom='';const cs=getComputedStyle(pv);const w=pv.clientWidth-parseFloat(cs.paddingLeft||0)-parseFloat(cs.paddingRight||0)-2,iw=iv.offsetWidth;if(w&&iw>w)iv.style.zoom=(w/iw).toFixed(3);});}
(function(){const R=render;window.render=render=function(){R.apply(this,arguments);try{fitInv();}catch(e){}};addEventListener('resize',()=>{try{fitInv();}catch(e){}});})();
