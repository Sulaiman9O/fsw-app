/* ---------- STOCK (10 extra tools, each can be turned off in Stock tools) ---------- */
const SX=[['smart','✨','Smart services','Oil change, plugs, pads, battery: compare options side by side and add the right parts'],
 ['moves','📜','Part history','Every in and out for each part: invoice, return, supplier, count'],
 ['scan','📷','Barcode scan','Scan with the camera in stock, jobs and the part form'],
 ['markup','💹','Price from cost','Profit % per category; suggests the selling price'],
 ['vprices','🚚','Prices per supplier','Remembers each supplier\'s price; shows the cheapest'],
 ['alts','🔁','Alternative parts','Suggests an alternative when a part is out of stock'],
 ['fits','🚗','Fits these cars','Parts that fit the car show first on the job'],
 ['slow','🐢','Slow parts','Parts not sold for 60 or 90 days and the money in them'],
 ['value','💰','Stock value','Value at cost and at selling price, by category'],
 ['partial','📦','Part receiving','Receive part of an order; the rest stays open'],
 ['loc','📍','Shelf place','Where the part is kept (shelf A3, drawer 2)']];
const sx=k=>!((DB.ws&&DB.ws.sxOff)||{})[k];
const r2=x=>Math.round(x*100)/100;
function mv(p,q,why,ref){if(!p||!q)return;p.stock=r2((+p.stock||0)+q);(DB.moves=DB.moves||[]).push({t:now(),part:p.id,q:r2(q),why,ref:ref||'',by:S.user?S.user.name:'',bal:p.stock});}
const unitS=p=>p.unit==='L'?'L':p.unit&&p.unit!=='pc'?p.unit:'';
function lastSold(){const o={};DB.jobs.filter(isInvoiced).forEach(j=>(j.items||[]).forEach(i=>{if(i.k==='part'&&i.ref)o[i.ref]=Math.max(o[i.ref]||0,j.inv.t);}));return o;}
function fitsCar(p,v){if(!p.fits||!v)return false;const car=((v.make||'')+' '+(v.model||'')+' '+(v.year||'')+' '+(v.engine||'')).toLowerCase();
  return p.fits.split(/[,،\n]/).map(x=>x.trim().toLowerCase()).filter(Boolean).some(f=>{const w=f.split(/\s+/);const yr=w.find(x=>/^\d{4}(-\d{4})?$/.test(x));const words=w.filter(x=>x!==yr);
    if(!words.every(x=>car.includes(x)))return false;if(!yr||!v.year)return true;const [a,b]=yr.split('-').map(Number);const y=+v.year;return y>=a&&y<=(b||a);});}
const markOf=cat=>+((DB.markup||{})[cat])||0;
const suggestPrice=p=>{const m=markOf(p.cat);return m&&+p.cost?Math.round((+p.cost)*(1+m/100)*10)/10:0;};
function bestVendor(p){const vp=p.vprices||{};let b=null;Object.entries(vp).forEach(([v,x])=>{if(byId('vendors',v)&&(!b||x.cost<b.cost))b={v,cost:x.cost,t:x.t};});return b;}
/* barcode */
async function scanSheet(onCode){if(!('BarcodeDetector' in window)){toast('This phone has no built-in scanner. Type the number, or use a scanner gun.');return;}
  let stream,stop=false;openSheet(`<h3>Scan a barcode</h3><div class="scbox"><video id="scv" playsinline muted autoplay poster="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="></video><div class="scwait"><i></i><span>Opening the camera…</span></div><div class="scfr"><b></b><b></b><b></b><b></b><em></em></div></div><p class="hint">Hold the barcode inside the frame.</p>`,()=>{});
  const end=()=>{stop=true;if(stream)stream.getTracks().forEach(t=>t.stop());};const cb=$('#sheet [data-close]');if(cb)cb.addEventListener('click',end);
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});const vd=$('#scv');vd.srcObject=stream;vd.onplaying=()=>{const b=vd.closest('.scbox');if(b)b.classList.add('live');};await vd.play();
    const det=new BarcodeDetector();const loop=async()=>{if(stop||!$('#scv'))return end();try{const r=await det.detect(vd);if(r.length){const c=r[0].rawValue;end();closeSheet();onCode(c);return;}}catch(e){}requestAnimationFrame(loop);};loop();
  }catch(e){end();closeSheet();toast('Camera not allowed. Allow the camera for this app in phone settings.');}}
function findByCode(c){c=(c||'').trim();return DB.parts.find(p=>p.num&&p.num.trim()===c)||DB.parts.find(p=>(p.codes||[]).includes(c));}
/* stock screen (2.13): search first, category tiles, one "to order" bar, simple rows with − / + for whoever may change stock */
const PCAT_IC={'Engine oil':'🛢','Oil filters':'🧴','Air filters':'💨','Cabin filters':'🌬','Gearbox oil':'⚙️','Gearbox filters':'⚙️','Differential oil':'⚙️','Coolant':'❄️','Brake fluid':'🛑','Brake pads':'🛑','Spark plugs':'🔥','Batteries':'🔋','Bulbs':'💡','Belts':'➰','Gaskets':'⭕','Additives':'🧪','Cleaners':'🧽','Other':'📦'};
const pcatIc=c=>PCAT_IC[c]||'📦';
const canAdj=()=>can.del();
const stState=p=>{const s=+p.stock||0,r=+p.reorder||0;return s<=0?'out':(r>0&&s<=r)?'low':'ok';};
let SOLD=null;
function soldCounts(){const k=DB.jobs.length+'|'+DB.parts.length;if(SOLD&&SOLD.k===k)return SOLD.m;const m={},cut=now()-180*864e5;
  DB.jobs.forEach(j=>{if(j.stage==='estimate'||j.returned||(j.t||0)<cut)return;(j.items||[]).forEach(i=>{if(i.k!=='part')return;const p=typeof partOfItem==='function'?partOfItem(i):(i.ref&&byId('parts',i.ref));if(p)m[p.id]=(m[p.id]||0)+(+i.q||1);});});
  SOLD={k,m};return m;}
function stockSort(L){const so=S.p.sort||'sold';if(so==='az')return L.sort((a,b)=>a.name.localeCompare(b.name));
  if(so==='low')return L.sort((a,b)=>((+a.stock||0)-(+a.reorder||0))-((+b.stock||0)-(+b.reorder||0))||a.name.localeCompare(b.name));
  const m=soldCounts();return L.sort((a,b)=>(m[b.id]||0)-(m[a.id]||0)||a.name.localeCompare(b.name));}
SCREENS.stock=m=>{
  const q=(S.p.q||'').trim().toLowerCase(),cat=S.p.cat||'',lowV=!!S.p.low;
  const low=lowParts();const val=DB.parts.reduce((a,p)=>a+(+p.stock||0)*(+p.cost||0),0);
  const cats=DB.pcats.filter(c=>DB.parts.some(p=>p.cat===c));
  let h=head(lowV?'To order':'Stock',`${lowV?'':'<button class="lnk" id="ptools" aria-label="More">⋯</button>'}<button class="lnk" id="padd">＋ Part</button>`)+
  `<div class="srow ssrch"><input class="field" id="pq" placeholder="Search name, number${sx('loc')?', shelf':''}" value="${esc(S.p.q||'')}" autocomplete="off" autocorrect="off" spellcheck="false">${sx('scan')?'<button class="scanb" id="pscan">📷</button>':''}</div>`;
  if(!lowV){
    h+=`${low.length?`<button class="lowbar" id="plow"><span class="ld"></span><div><b>${low.length} parts to order</b><span>${low.filter(p=>(+p.stock||0)<=0).length} out of stock</span></div><em>›</em></button>`:''}
`;}
  else if(low.length)h+=`<button class="btn" id="mkpo">🚚 Make an order for these ${low.length}</button>`;
  h+=`<div class="sbar"><div class="chips pcatc">${['',...cats].map(c=>{const n=c?DB.parts.filter(p=>p.cat===c).length:(lowV?low.length:DB.parts.length);return `<button data-cat="${esc(c)}" aria-pressed="${cat===c}">${c?pcatIc(c)+' '+esc(c):'All'} <small>${n}</small></button>`;}).join('')}</div>
   <div class="chips sortc">${[['sold','Most sold'],['az','A–Z'],['low','Least stock']].map(([k,t])=>`<button data-sort="${k}" aria-pressed="${(S.p.sort||'sold')===k}">${t}</button>`).join('')}</div></div>`;
  h+=`<div class="list" id="plist"></div><p class="hint" id="pnone" hidden>Nothing found.</p>`;
  if(!DB.parts.length)h+=empty('🛢','No parts yet. Tap <b>＋ Part</b> to add your first one.');
  m.innerHTML=h;
  let drawn=false;
  const draw=()=>{const qq=(S.p.q||'').trim().toLowerCase();const box=$('#plist');
    let L=DB.parts.filter(p=>(!S.p.cat||p.cat===S.p.cat)&&(!lowV||low.includes(p)));
    if(qq){const w=qq.split(/\s+/);L=L.filter(p=>{const t=(p.name+' '+(p.num||'')+' '+(p.loc||'')+' '+(p.codes||[]).join(' ')+' '+p.cat).toLowerCase();return w.every(x=>t.includes(x));});}
    box.innerHTML=stockSort(L).slice(0,400).map(partRow).join('');$('#pnone').hidden=!!L.length;bindRows(box,drawn);drawn=true;};
  const inp=$('#pq');let tm=0;inp.oninput=()=>{S.p.q=inp.value;clearTimeout(tm);tm=setTimeout(draw,120);};
  draw();
  $$('[data-cat]').forEach(b=>b.onclick=()=>{S.p.cat=b.dataset.cat;$$('[data-cat]').forEach(x=>x.setAttribute('aria-pressed',x===b));draw();});
  $$('[data-sort]').forEach(b=>b.onclick=()=>{S.p.sort=b.dataset.sort;$$('[data-sort]').forEach(x=>x.setAttribute('aria-pressed',x===b));draw();});
  const pl=$('#plow');if(pl)pl.onclick=()=>go('stock',{low:1});
  const pt=$('#ptools');if(pt)pt.onclick=()=>actionSheet(T_('Stock'),'',[
    {ic:'📦',t:'Daily count',s:'Count',fn:()=>go('count')},
    {ic:'🚚',t:'Suppliers & orders',s:'Orders',hide:!perm('vendors'),fn:()=>go('vendors')},
    {ic:'🐢',t:'Slow parts',s:'Slow',hide:!sx('slow'),fn:()=>go('slow')},
    {ic:'💰',t:'Stock value',s:f3(val),hide:!(sx('value')&&can.cost()),fn:()=>go('stockval')},
    {ic:'⚙️',t:'Stock tools',s:'Tools',hide:!can.settings(),fn:()=>go('stocktools')}]);
  $('#padd').onclick=()=>partSheet(S.p.cat?{cat:S.p.cat,unit:'pc'}:null,null,!!S.p.cat);
  const mk=$('#mkpo');if(mk)mk.onclick=()=>newPoFromLow();
  const ps=$('#pscan');if(ps)ps.onclick=()=>scanSheet(c=>{const p=findByCode(c);if(p)partSheet(p);else confirmSheet('No part with '+esc(c)+'. Add it as a new part?','＋ New part',()=>partSheet({cat:DB.pcats[0],unit:'pc',num:c},null,true));});
};
function bindRows(box,press){const R=box.matches&&box.matches('[data-pe]')?[box]:[...box.querySelectorAll('[data-pe]')];if(press&&typeof longPress==='function')R.forEach(b=>longPress(b,()=>{if(!S.sel)partRowMenu(b.dataset.pe);}));R.forEach(b=>{b.onclick=()=>partSheet(byId('parts',b.dataset.pe));b.onkeydown=e=>{if(e.key==='Enter')b.click();};});
  box.querySelectorAll('[data-adj]').forEach(x=>{['pointerdown','touchstart','mousedown'].forEach(ev=>x.addEventListener(ev,e=>e.stopPropagation()));x.onclick=e=>{e.stopPropagation();const p=byId('parts',x.dataset.id);if(!p)return;const d=+x.dataset.adj;
    if(d<0&&(+p.stock||0)<=0){toast('Already 0');return;}mv(p,d,d>0?'Added by hand (+)':'Taken out by hand (−)');audit('stock','Stock of '+p.name+' '+(d>0?'+':'')+d+' → '+p.stock);save();
    const row=x.closest('[data-pe]');if(row){const t=document.createElement('div');t.innerHTML=partRow(p);const nr=t.firstElementChild;row.replaceWith(nr);bindRows(nr,true);}};});}
function partRow(p){const st=stState(p),u=p.unit==='L'?'L':unitS(p)||'pc';const adj=canAdj()&&sx('adj')!==false;
  return `<div class="row prow" role="button" tabindex="0" data-pe="${p.id}"><i class="sd ${st}"></i><div class="pm"><b>${esc(p.name)}</b><span>${sx('loc')&&p.loc?'📍 '+esc(p.loc)+' · ':''}${f3(p.price)}${p.unit==='L'?'/L':''}${p.num&&!p.name.includes(p.num)?' · <bdi>'+esc(p.num)+'</bdi>':''}</span></div>
   <div class="pq">${adj?`<button class="adj" data-adj="-1" data-id="${p.id}" aria-label="−1">−</button>`:''}<span class="v ${st}">${+p.stock||0}<small>${u}</small></span>${adj?`<button class="adj" data-adj="1" data-id="${p.id}" aria-label="+1">+</button>`:''}</div></div>`;}
function partSheet(p,onSaved,forceNew,draft){const isNew=!p||forceNew;p=p||{cat:DB.pcats[0],unit:'pc'};const w=JSON.parse(JSON.stringify(draft||p));w.alts=w.alts||[];w.vprices=w.vprices||{};
  const mvs=(DB.moves||[]).filter(x=>x.part===p.id).sort((a,b)=>b.t-a.t);
  openSheet(`<h3>${isNew?'New part':'Edit part'}</h3><input class="field" id="pn" placeholder="Name · brand type size (e.g. Toyota Oil Filter 90915-YZZN2)" value="${esc(w.name||'')}">
   <div class="in2"><div class="srow"><input class="field" id="pnum" placeholder="Part number / barcode" value="${esc(w.num||'')}">${sx('scan')?'<button class="scanb" id="pnsc">📷</button>':''}</div><select class="field" id="pcat">${DB.pcats.map(c=>`<option ${w.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
   <div class="chips">${DB.units.map(k=>[k,unitName(k)]).map(([k,l])=>`<button data-u="${k}" aria-pressed="${w.unit===k}">${l}</button>`).join('')}</div>
   <div id="pgr"></div>
   <div class="in2"><label class="field-l">Selling price<input class="field" id="ppr" inputmode="decimal" value="${w.price?f3(w.price):''}"></label>${can.cost()?`<label class="field-l">Cost (owner only)<input class="field" id="pco" inputmode="decimal" value="${w.cost?f3(w.cost):''}"></label>`:'<span></span>'}</div>
   ${sx('markup')&&can.cost()?'<div id="psug"></div>':''}
   <div class="in2"><label class="field-l">In stock<input class="field" id="pst" inputmode="decimal" value="${w.stock||''}" ${isNew||can.del()?'':'disabled'}></label><label class="field-l">Reorder at<input class="field" id="pro" inputmode="decimal" value="${w.reorder||''}"></label></div>
   ${!isNew?`<button class="btn ghost" id="prcv">📥 Received stock</button>`:''}
   <details class="pmore"${draft?' open':''}><summary>More details</summary>
   ${sx('loc')?`<label class="field-l">📍 Shelf place<input class="field" id="ploc" placeholder="e.g. Shelf A3 · Drawer 2" value="${esc(w.loc||'')}"></label>`:''}
   ${sx('fits')?`<label class="field-l">🚗 Fits these cars (comma between)<input class="field" id="pfit" placeholder="e.g. Camry 2012-2017, Corolla, Lexus ES" value="${esc(w.fits||'')}"></label>`:''}
   ${sx('alts')?`<div class="field-l">🔁 Alternative parts</div><div class="list" id="palt"></div><select class="field" id="paltadd"><option value="">＋ Add an alternative…</option>${DB.parts.filter(x=>x.id!==p.id).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>`:''}
   ${sx('vprices')&&can.cost()&&DB.vendors.length?`<div class="field-l">🚚 Price per supplier</div><div class="list" id="pvp"></div><div class="in2"><select class="field" id="pvv">${DB.vendors.map(v=>`<option value="${v.id}">${esc(v.name)}</option>`).join('')}</select><div class="row2"><input class="field" id="pvc" inputmode="decimal" placeholder="Their price"><button class="btn ghost sm" id="pvok">＋</button></div></div>`:''}
   ${isNew?'':'<p class="hint">Stock changes by itself with invoices and supplier orders. Change it here only after a count.</p>'}
   ${sx('moves')&&!isNew?sec('📜 History',mvs.length+' moves')+`<div class="list">${mvs.slice(0,30).map(x=>`<div class="row"><div><b>${esc(x.why)}</b><span>${fmtD(x.t)} ${hm(x.t)}${x.by?' · '+esc(x.by):''}</span></div><span class="v ${x.q<0?'bad':''}" style="${x.q>0?'color:var(--ok)!important':''}">${x.q>0?'+':''}${x.q}<small>left ${x.bal}</small></span></div>`).join('')||'<p class="hint">No moves yet.</p>'}</div>`:''}</details>
   <button class="btn" id="pok">Save</button>
   ${!isNew&&can.del()?'<button class="btn ghost jb-del" id="pdel">Delete part</button>':''}`,el=>{
   let unit=w.unit;el.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{unit=b.dataset.u;el.querySelectorAll('[data-u]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
   const sc=el.querySelector('#pnsc');if(sc)sc.onclick=()=>{const g=id=>{const e=el.querySelector(id);return e?e.value:undefined;};const d=Object.assign({},w,{name:g('#pn'),cat:g('#pcat'),unit,price:num(g('#ppr')),stock:num(g('#pst')),reorder:num(g('#pro'))});if(g('#pco')!==undefined)d.cost=num(g('#pco'));if(g('#ploc')!==undefined)d.loc=g('#ploc');if(g('#pfit')!==undefined)d.fits=g('#pfit');scanSheet(c=>{d.num=c;partSheet(p,onSaved,isNew,d);});};
   let grade=w.grade||gradeOf(w);const drawG=()=>{const b=el.querySelector('#pgr');if(!b)return;if(!sx('smart')||$('#pcat').value!=='Engine oil'){b.innerHTML='';return;}if(!w.grade&&!grade)grade=gradeOf({name:$('#pn').value});b.innerHTML=`<div class="field-l">Oil type (for the oil change compare)</div><div class="chips">${Object.entries(GRADE).map(([k,[n,km]])=>`<button data-gr="${k}" aria-pressed="${grade===k}">${n} · ${kmf(km)} km</button>`).join('')}</div>`;b.querySelectorAll('[data-gr]').forEach(x=>x.onclick=()=>{grade=x.dataset.gr;drawG();});};drawG();el.querySelector('#pcat').addEventListener('change',drawG);el.querySelector('#pn').addEventListener('change',drawG);
   const sug=el.querySelector('#psug');const drawSug=()=>{if(!sug)return;const cat=$('#pcat').value,co=num($('#pco').value),mk=markOf(cat);if(!mk||!co){sug.innerHTML=mk?'':`<p class="hint">Set a profit % for ${esc(cat)} in Stock tools to get a suggested price.</p>`;return;}const s=Math.round(co*(1+mk/100)*10)/10;sug.innerHTML=`<button class="btn ghost sm" id="psug2">💹 Use ${f3(s)} (cost + ${mk}%)</button>`;el.querySelector('#psug2').onclick=()=>{$('#ppr').value=f3(s);};};
   if(sug){$('#pco').oninput=drawSug;$('#pcat').addEventListener('change',drawSug);drawSug();}
   const drawAlt=()=>{const b=el.querySelector('#palt');if(!b)return;b.innerHTML=w.alts.map(id=>{const x=byId('parts',id);return x?`<div class="row"><div><b>${esc(x.name)}</b><span>stock ${+x.stock||0}</span></div><button class="lnk" data-ax="${id}">✕</button></div>`:'';}).join('')||'<p class="hint">None.</p>';b.querySelectorAll('[data-ax]').forEach(x=>x.onclick=()=>{w.alts=w.alts.filter(i=>i!==x.dataset.ax);drawAlt();});};drawAlt();
   const aa=el.querySelector('#paltadd');if(aa)aa.onchange=()=>{if(aa.value&&!w.alts.includes(aa.value))w.alts.push(aa.value);aa.value='';drawAlt();};
   const drawVp=()=>{const b=el.querySelector('#pvp');if(!b)return;const best=bestVendor(w);b.innerHTML=Object.entries(w.vprices).filter(([v])=>byId('vendors',v)).sort((a,c)=>a[1].cost-c[1].cost).map(([v,x])=>`<div class="row"><div><b>${esc(byId('vendors',v).name)}${best&&best.v===v?' <span class="tg tgr">cheapest</span>':''}</b><span>${fmtD(x.t)}</span></div><span class="v">${f3(x.cost)}</span><button class="lnk" data-vx="${v}">✕</button></div>`).join('')||'<p class="hint">Fills in by itself when you receive orders.</p>';b.querySelectorAll('[data-vx]').forEach(x=>x.onclick=()=>{delete w.vprices[x.dataset.vx];drawVp();});};drawVp();
   const vo=el.querySelector('#pvok');if(vo)vo.onclick=()=>{const c=num($('#pvc').value);if(!c)return;w.vprices[$('#pvv').value]={cost:c,t:now()};$('#pvc').value='';drawVp();};
   const rc=el.querySelector('#prcv');if(rc)rc.onclick=()=>receiveSheet(p);
   el.querySelector('#pok').onclick=()=>{const n=$('#pn').value.trim();if(!n){toast('Type a name');return;}const nm=$('#pnum').value.trim();
     const dup=DB.parts.find(x=>x!==p&&(x.name.toLowerCase()===n.toLowerCase()||(nm&&x.num===nm)));if(dup){toast('This part already exists: '+dup.name);return;}
     let t=p;if(isNew){t={id:uid('p'),t:now(),stock:0};DB.parts.push(t);}
     const ns=num($('#pst').value),os=+t.stock||0;
     if(!isNew&&(Math.abs(num($('#ppr').value)-(+t.price||0))>0.0005))audit('price','Part '+t.name+': '+f3(t.price)+' → '+f3(num($('#ppr').value)));
     Object.assign(t,{grade:$('#pcat').value==='Engine oil'?grade:t.grade,name:n,num:nm,cat:$('#pcat').value,unit,price:num($('#ppr').value),reorder:num($('#pro').value)});const co=$('#pco');if(co)t.cost=num(co.value);
     const g=id=>{const e=el.querySelector(id);return e?e.value.trim():undefined;};if(g('#ploc')!==undefined)t.loc=g('#ploc');if(g('#pfit')!==undefined)t.fits=g('#pfit');
     if(el.querySelector('#palt')){const old=t.alts||[];t.alts=w.alts;old.filter(i=>!w.alts.includes(i)).forEach(i=>{const x=byId('parts',i);if(x)x.alts=(x.alts||[]).filter(y=>y!==t.id);});w.alts.forEach(i=>{const x=byId('parts',i);if(x){x.alts=x.alts||[];if(!x.alts.includes(t.id))x.alts.push(t.id);}});}
     if(el.querySelector('#pvp'))t.vprices=w.vprices;
     if(Math.abs(ns-os)>0.0001){mv(t,ns-os,isNew?'Opening stock':'Changed by hand');if(!isNew)audit('stock','Stock of '+t.name+' changed by hand: '+os+' → '+ns);}
     save();closeSheet();if(onSaved)onSaved(t);else render();};
   const d=el.querySelector('#pdel');if(d)d.onclick=()=>confirmSheet('Delete '+esc(p.name)+'?','Delete part',()=>{audit('delete','Part '+p.name+' (stock '+(+p.stock||0)+')');DB.parts=DB.parts.filter(x=>x!==p);save();render();});});}
/* received stock: add the quantity; the cost becomes the average of what was on the shelf and what came in */
function receiveSheet(p){if(!p)return;const cc=can.cost();openSheet(`<h3>📥 Received · ${esc(p.name)}</h3><p class="hint">Now ${+p.stock||0} ${p.unit==='L'?'L':unitS(p)||'pc'} on the shelf.</p>
  <div class="in2"><label class="field-l">How many came<input class="field" id="rq" inputmode="decimal"></label>${cc?`<label class="field-l">Cost each<input class="field" id="rc" inputmode="decimal" value="${p.cost?f3(p.cost):''}"></label>`:'<span></span>'}</div><div id="rinfo"></div><button class="btn" id="rok">Add to stock</button>`,el=>{
  const q=el.querySelector('#rq'),c=el.querySelector('#rc'),info=el.querySelector('#rinfo');const calc=()=>{const n=num(q.value),k=c?num(c.value):(+p.cost||0),os=Math.max(0,+p.stock||0),oc=+p.cost||0;const avg=n>0&&k>0?(os*oc+n*k)/(os+n):oc;return {n,k,avg:Math.round(avg*1000)/1000};};
  const show=()=>{const x=calc();info.innerHTML=x.n>0?`<p class="hint">New stock: <b>${r2((+p.stock||0)+x.n)}</b>${cc&&x.k>0&&Math.abs(x.avg-(+p.cost||0))>0.0005?` · average cost ${f3(x.avg)}`:''}</p>`:'';};q.oninput=show;if(c)c.oninput=show;setTimeout(()=>q.focus(),60);
  el.querySelector('#rok').onclick=()=>{const x=calc();if(!(x.n>0)){toast('Type how many came');return;}const oc=+p.cost||0;mv(p,x.n,'Received');if(cc&&x.k>0){p.cost=x.avg;if(Math.abs(x.avg-oc)>0.0005)audit('price','Cost of '+p.name+': '+f3(oc)+' → '+f3(x.avg)+' (average)');}
    audit('stock','Received '+x.n+' of '+p.name+' → '+p.stock);save();closeSheet();toast('Added '+x.n+' · now '+p.stock);render();};});}
/* add-to-job part list: fits first, alternatives when out */
function partOpts(v,ps){const fit=sx('fits');const L=ps.map(p=>({p,f:fit&&fitsCar(p,v)})).sort((a,b)=>(b.f-a.f));
  return L.slice(0,60).map(({p,f})=>{let alt='';if(sx('alts')&&(+p.stock||0)<=0){const a=(p.alts||[]).map(i=>byId('parts',i)).filter(x=>x&&(+x.stock||0)>0)[0];if(a)alt=`<button class="opt alt" data-pt="${a.id}"><div class="tx"><b>↳ Instead: ${esc(a.name)}</b><span>${+a.stock}${unitS(a)?' '+unitS(a):''} in stock${sx('loc')&&a.loc?' · 📍 '+esc(a.loc):''}</span></div><span class="v">${f3(a.price)}</span></button>`;}
    return `<button class="opt" data-pt="${p.id}"><div class="tx"><b>${esc(p.name)}${f?' <span class="tg tok">fits</span>':''}</b><span>${esc(p.num||p.cat)} · ${+p.stock>0?(+p.stock)+(p.unit==='L'?' L':'')+' in stock':'out of stock'}${sx('loc')&&p.loc?' · 📍 '+esc(p.loc):''}</span></div><span class="v">${f3(p.price)}${p.unit==='L'?'<small>/L</small>':''}</span></button>`+alt;}).join('');}
/* slow parts */
SCREENS.slow=m=>{const d=+S.p.d||60;const ls=lastSold();const cut=now()-d*864e5;
  const L=DB.parts.filter(p=>(+p.stock||0)>0&&(ls[p.id]||p.t||0)<cut).sort((a,b)=>(+b.stock*(+b.cost||0))-(+a.stock*(+a.cost||0)));const tied=L.reduce((a,p)=>a+(+p.stock)*(+p.cost||0),0);
  m.innerHTML=head('🐢 Slow parts')+`<div class="chips">${[30,60,90,180].map(x=>`<button data-d="${x}" aria-pressed="${x===d}">${x} days</button>`).join('')}</div>
  <div class="kpis2"><div class="kpi"><b>${L.length}</b><span>Parts not sold in ${d} days</span></div>${can.cost()?`<div class="kpi org"><b>${f3(tied)}</b><span>Money on the shelf (cost)</span></div>`:''}</div>
  <div class="list">${L.map(p=>`<button class="row" data-pe="${p.id}"><div><b>${esc(p.name)}</b><span>${ls[p.id]?'last sold '+ago(ls[p.id]):'never sold'} · ${+p.stock} ${unitS(p)||'pc'}</span></div><span class="v">${can.cost()?f3((+p.stock)*(+p.cost||0)):''}</span></button>`).join('')||empty('👍','Nothing slow. Everything sold in the last '+d+' days.')}</div>`;
  $$('[data-d]').forEach(b=>b.onclick=()=>{S.p.d=b.dataset.d;render();});$$('[data-pe]').forEach(b=>b.onclick=()=>partSheet(byId('parts',b.dataset.pe)));};
/* stock value */
SCREENS.stockval=m=>{if(!can.cost()){go('stock');return;}const by={};DB.parts.forEach(p=>{const s=Math.max(0,+p.stock||0);const o=by[p.cat]=by[p.cat]||{n:0,c:0,p:0};o.n++;o.c+=s*(+p.cost||0);o.p+=s*(+p.price||0);});
  const T=Object.values(by).reduce((a,o)=>({c:a.c+o.c,p:a.p+o.p}),{c:0,p:0});
  m.innerHTML=head('💰 Stock value')+`<div class="kpis3"><div class="kpi"><b>${f3(T.c)}</b><span>At cost</span></div><div class="kpi ok"><b>${f3(T.p)}</b><span>At selling price</span></div><div class="kpi"><b>${f3(T.p-T.c)}</b><span>Profit inside</span></div></div>
  ${sec('By category')}<div class="list">${Object.entries(by).sort((a,b)=>b[1].c-a[1].c).map(([k,o])=>`<div class="row"><div><b>${esc(k)}</b><span>${o.n} parts · sells for ${f3(o.p)}</span></div><span class="v">${f3(o.c)}<small>cost</small></span></div>`).join('')||empty('🛢','No parts yet.')}</div>`;};
/* settings for the 10 tools */
SCREENS.stocktools=m=>{if(!can.settings()){go('stock');return;}DB.ws.sxOff=DB.ws.sxOff||{};DB.markup=DB.markup||{};
  m.innerHTML=head('⚙️ Stock tools')+`<p class="hint">Turn off what you don't need. Turning off only hides it; nothing is deleted.</p>
  <div class="list">${SX.map(([k,ic,t,d])=>`<label class="lrow tgl2"><span class="lname"><span class="ic">${ic}</span><div><b>${t}</b><span>${d}</span></div></span><input type="checkbox" data-sx="${k}" ${sx(k)?'checked':''}></label>`).join('')}</div>
  ${sx('markup')?sec('💹 Profit % by category','used for the suggested price')+`<div class="list">${DB.pcats.map(c=>`<div class="lrow"><span class="lname"><div><b>${esc(c)}</b></div></span><input class="qin" style="width:84px" data-mu="${esc(c)}" inputmode="decimal" placeholder="%" value="${DB.markup[c]||''}"></div>`).join('')}</div><button class="btn ghost sm" id="muall">Update selling prices of all parts from cost</button>`:''}`;
  $$('[data-sx]').forEach(b=>b.onchange=()=>{if(b.checked)delete DB.ws.sxOff[b.dataset.sx];else DB.ws.sxOff[b.dataset.sx]=1;save();render();});
  $$('[data-mu]').forEach(b=>b.onchange=()=>{const v=num(b.value);if(v)DB.markup[b.dataset.mu]=v;else delete DB.markup[b.dataset.mu];save();});
  const ma=$('#muall');if(ma)ma.onclick=()=>{const L=DB.parts.filter(p=>suggestPrice(p)&&Math.abs(suggestPrice(p)-(+p.price||0))>0.0005);if(!L.length){toast('All prices already match');return;}
    openSheet(`<h3>New prices · ${L.length}</h3><div class="list">${L.map(p=>`<label class="lrow tgl2"><span class="lname"><div><b>${esc(p.name)}</b><span>${f3(p.price||0)} → <b>${f3(suggestPrice(p))}</b></span></div></span><input type="checkbox" data-np="${p.id}" checked></label>`).join('')}</div><button class="btn" id="npok">Apply</button>`,el=>el.querySelector('#npok').onclick=()=>{el.querySelectorAll('[data-np]:checked').forEach(c=>{const p=byId('parts',c.dataset.np);p.price=suggestPrice(p);});save();closeSheet();toast('Prices updated');});};};
/* receive a supplier order (all or part) */
function receivePo(p){const v=byId('vendors',p.vendor)||{};const left=p.items.map(i=>({i,rest:r2(i.q-(+i.rec||0))})).filter(x=>x.rest>0);
  const apply=got=>{const changed=[];got.forEach(([i,q,c])=>{if(!q)return;const pt=byId('parts',i.part);if(!pt)return;mv(pt,q,'Supplier order #'+p.no+(v.name?' · '+v.name:''),p.id);i.rec=r2((+i.rec||0)+q);
      if(c){if(Math.abs(c-(+pt.cost||0))>0.0005)changed.push(pt);pt.cost=c;i.cost=c;}if(c&&p.vendor){pt.vprices=pt.vprices||{};pt.vprices[p.vendor]={cost:c,t:now()};}});
    p.status=p.items.every(i=>(+i.rec||0)>=i.q-0.0001)?'received':'partial';p.rt=now();save();
    const sug=sx('markup')?changed.filter(pt=>suggestPrice(pt)&&Math.abs(suggestPrice(pt)-(+pt.price||0))>0.0005):[];
    if(sug.length&&can.cost()){openSheet(`<h3>Cost changed · new selling prices?</h3><div class="list">${sug.map(pt=>`<label class="lrow tgl2"><span class="lname"><div><b>${esc(pt.name)}</b><span>${f3(pt.price||0)} → <b>${f3(suggestPrice(pt))}</b></span></div></span><input type="checkbox" data-np="${pt.id}" checked></label>`).join('')}</div><button class="btn" id="npok">Apply</button>`,el=>el.querySelector('#npok').onclick=()=>{el.querySelectorAll('[data-np]:checked').forEach(c=>{const x=byId('parts',c.dataset.np);x.price=suggestPrice(x);});save();closeSheet();render();});}
    render();toast(p.status==='received'?'Stock updated':'Received part of the order. The rest stays open.');};
  if(!sx('partial')){confirmSheet('Mark order #'+p.no+' as received? Stock goes up.','Received',()=>apply(left.map(x=>[x.i,x.rest,+x.i.cost||0])));return;}
  openSheet(`<h3>Receive order #${p.no}</h3><p class="hint">Type what arrived. Leave less if some did not come; the rest stays open.</p><div class="list">${left.map((x,k)=>{const pt=byId('parts',x.i.part)||{name:'?'};return `<div class="oi"><div><b>${esc(pt.name)}</b><span>ordered ${x.i.q}${x.i.rec?' · got '+x.i.rec:''}</span></div><div class="st">${can.cost()?`<input class="qin" style="width:76px" data-rc="${k}" inputmode="decimal" placeholder="cost" value="${x.i.cost?f3(x.i.cost):''}">`:''}<input class="qin" data-rq="${k}" inputmode="decimal" value="${x.rest}"></div></div>`;}).join('')}</div><button class="btn okb" id="rcok">✓ Save received</button>`,el=>{
    el.querySelectorAll('.qin').forEach(b=>b.onfocus=()=>b.select());
    el.querySelector('#rcok').onclick=()=>{const got=left.map((x,k)=>{const q=Math.min(x.rest,num(el.querySelector(`[data-rq="${k}"]`).value));const ce=el.querySelector(`[data-rc="${k}"]`);return [x.i,q,ce?num(ce.value):(+x.i.cost||0)];});closeSheet();apply(got);};});}
