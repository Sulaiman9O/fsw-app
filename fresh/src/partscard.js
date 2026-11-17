/* ---------- 2.42.0 «For the parts shop» card ----------
   One tap shows only what a spare-parts shop needs: the car, the engine, the VIN (big, in groups of 4, with a QR code
   the shop scans with its phone), and — opened from a job — the parts of the job (names and quantity, no prices).
   No customer name, phone, plate, prices or anything else from the workshop. Show it on the screen, send it as a
   picture on WhatsApp, or copy the VIN. Opened from: the job card (🔩 chip) and the customer's car card. */
const pcVin=v=>String((v&&v.vin)||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const pcGroups=s=>s.replace(/(.{4})(?=.)/g,'$1 ');
function pcTrans(v){const t=String((v&&v.trans)||'');const m=t.match(/\(([A-Z]{2,4})\)/);if(m)return m[1];if(/cvt/i.test(t))return 'CVT';if(/auto/i.test(t))return 'AT';if(/manual/i.test(t))return 'MT';return t.slice(0,20);}
function pcDrive(v){let a=v&&v.ari;if(typeof a==='string'){try{a=JSON.parse(a);}catch(e){a=null;}}const d=String((a&&a.drivenWheels)||'');return /all|4wd|four/i.test(d)?'4WD':/rear/i.test(d)?'RWD':/front/i.test(d)?'FWD':'';}
function pcEngine(v){const e=String((typeof effEng==='function'?effEng(v):'')||(v&&v.engine)||'');const s=typeof engShort==='function'?engShort(e):e;return s.replace(/\s+/g,' ').trim();}
function pcSpec(v){return [pcEngine(v),pcTrans(v),pcDrive(v),v&&v.body].filter(Boolean).join(' · ');}
function pcParts(j){return j?(j.items||[]).filter(i=>i.k==='part'&&!i.custPart&&String(i.d||'').trim()).map(i=>({d:String(i.d).trim(),q:+i.q||1,u:i.u||''})):[];}
/* QR code as an SVG (offline: vendor/qrcode.js, MIT, Kazuhiko Arase) */
function pcQr(text){try{const q=qrcode(0,'M');q.addData(text);q.make();const n=q.getModuleCount(),b=4;let d='';for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c+b} ${r+b}h1v1h-1z`;
  return {n:n+2*b,svg:`<svg class="pcqr" viewBox="0 0 ${n+2*b} ${n+2*b}" shape-rendering="crispEdges" role="img" aria-label="QR ${esc(text)}"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`,q};}catch(e){return null;}}
function pcCopy(t){const ok=()=>toast(T_('VIN copied')+' · '+t);try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,()=>pcCopy2(t,ok));return;}}catch(e){}pcCopy2(t,ok);}
function pcCopy2(t,ok){const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');ok();}catch(e){toast(t);}a.remove();}
function partsCard(v,j){if(!v){toast(T_('No car'));return;}const vin=pcVin(v);const P=pcParts(j);const pick=P.map(()=>true);
  try{trail('pcard',(j?'job ':'car ')+(vin?'vin':'no vin'));}catch(e){}
  const qr=vin?pcQr(vin):null;
  const body=()=>`<div class="pcard" id="pcard">
     <div class="pc-top">🔩 ${T_('For the parts shop')}</div>
     <div class="pc-car" dir="ltr" data-notr>${esc(carName(v)||'—')}</div>
     ${pcSpec(v)?`<div class="pc-spec" dir="ltr" data-notr>${esc(pcSpec(v))}</div>`:''}
     ${vin?`<div class="pc-lab">VIN · ${T_('Chassis no.')}</div><div class="pc-vin" dir="ltr" data-notr>${esc(pcGroups(vin))}</div>${vin.length!==17?`<div class="pc-warn">⚠️ ${T_('This VIN is not 17 characters — check it on the car')}</div>`:''}${qr?qr.svg:''}`
       :`<div class="pc-novin">⚠️ ${T_('No VIN saved for this car')}</div>`}
     ${P.length?`<div class="pc-lab">${T_('Parts needed')}</div><div class="pc-parts" data-notr>${P.map((p,i)=>`<label class="pc-p ${pick[i]?'':'off'}"><input type="checkbox" data-pcp="${i}" ${pick[i]?'checked':''}><span dir="auto">${esc(p.d)}</span><b dir="ltr">× ${+p.q.toFixed(2)}${p.u?' '+esc(p.u):''}</b></label>`).join('')}</div>`:''}
     <div class="pc-ws" dir="ltr" data-notr>${esc(DB.ws.name||'')}</div></div>`;
  openSheet(`<div id="pcbox">${body()}</div>
    <div class="pc-acts"><button class="btn" id="pcsend">📤 ${T_('Send as picture')}</button>${vin?`<button class="btn ghost" id="pccopy">📋 ${T_('Copy VIN')}</button>`:''}<button class="btn ghost" id="pcbig">⛶ ${T_('Show big')}</button></div>
    ${vin?'':`<button class="btn ghost" id="pcedit">✏️ ${T_('Add the VIN')}</button>`}`,el=>{
    const wire=()=>el.querySelectorAll('[data-pcp]').forEach(x=>x.onchange=()=>{pick[+x.dataset.pcp]=x.checked;x.closest('.pc-p').classList.toggle('off',!x.checked);});wire();
    const cp=el.querySelector('#pccopy');if(cp)cp.onclick=()=>pcCopy(vin);
    el.querySelector('#pcbig').onclick=()=>{const c=el.querySelector('#pcard');c.classList.add('pc-full');const exit=()=>{c.classList.remove('pc-full');c.removeEventListener('click',exit);};setTimeout(()=>c.addEventListener('click',exit),50);
      try{if(c.requestFullscreen)c.requestFullscreen().catch(()=>{});}catch(e){}};
    const ed=el.querySelector('#pcedit');if(ed)ed.onclick=()=>{closeSheet();vehSheet(byId('customers',v.cust)||{},v);};
    el.querySelector('#pcsend').onclick=()=>pcSend(v,P.filter((_,i)=>pick[i]),qr);});}
/* the same card drawn as a picture (1080 wide, white) — no screenshot or cropping needed */
function pcImage(v,parts,qr){const vin=pcVin(v);const W=1080,pad=64;const c=document.createElement('canvas');const x=c.getContext('2d');
  const font=(w,s)=>`${w} ${s}px Inter, Roboto, Arial, sans-serif`;
  const lines=[];const wrap=(t,f,max)=>{x.font=f;const out=[];let cur='';String(t).split(/\s+/).forEach(w=>{const tr=cur?cur+' '+w:w;if(x.measureText(tr).width>max&&cur){out.push(cur);cur=w;}else cur=tr;});if(cur)out.push(cur);return out;};
  const qs=qr?Math.min(520,W-2*pad):0;
  /* measure */x.font=font(700,64);const carL=wrap(carName(v)||'—',font(800,64),W-2*pad);const specL=pcSpec(v)?wrap(pcSpec(v),font(500,40),W-2*pad):[];
  const partL=parts.map(p=>({l:wrap(p.d,font(500,38),W-2*pad-170),q:'× '+(+p.q.toFixed(2))+(p.u?' '+p.u:'')}));
  let H=pad+44+24+carL.length*78+specL.length*52+30+(vin?40+96+30+(qr?qs+30:0):60)+(parts.length?60+partL.reduce((a,p)=>a+p.l.length*48+18,0):0)+70+pad;
  c.width=W;c.height=H;x.fillStyle='#fff';x.fillRect(0,0,W,H);x.textBaseline='top';let y=pad;
  x.fillStyle='#e8322b';x.font=font(700,34);x.fillText('🔩 FOR THE PARTS SHOP · لمحل القطع',pad,y);y+=44+24;
  x.fillStyle='#111';x.font=font(800,64);carL.forEach(l=>{x.fillText(l,pad,y);y+=78;});
  x.fillStyle='#444';x.font=font(500,40);specL.forEach(l=>{x.fillText(l,pad,y);y+=52;});y+=30;
  if(vin){x.fillStyle='#777';x.font=font(600,30);x.fillText('VIN · رقم الشاصي',pad,y);y+=40;
    x.fillStyle='#000';let fs=84;x.font=`700 ${fs}px "Roboto Mono", Menlo, Consolas, monospace`;const g=pcGroups(vin);while(x.measureText(g).width>W-2*pad&&fs>40){fs-=4;x.font=`700 ${fs}px "Roboto Mono", Menlo, Consolas, monospace`;}x.fillText(g,pad,y+(96-fs)/2);y+=96+30;
    if(qr){const n=qr.n,m=qs/n,ox=(W-qs)/2;x.fillStyle='#000';const q=qr.q,b=4,N=q.getModuleCount();for(let r=0;r<N;r++)for(let cc=0;cc<N;cc++)if(q.isDark(r,cc))x.fillRect(Math.floor(ox+(cc+b)*m),Math.floor(y+(r+b)*m),Math.ceil(m),Math.ceil(m));y+=qs+30;}}
  else{x.fillStyle='#c00';x.font=font(600,40);x.fillText('No VIN',pad,y);y+=60;}
  if(parts.length){x.fillStyle='#777';x.font=font(600,30);x.fillText('PARTS · القطع',pad,y);y+=60;
    partL.forEach(p=>{x.fillStyle='#111';x.font=font(500,38);p.l.forEach((l,i)=>x.fillText(l,pad,y+i*48));x.font=font(700,38);const w=x.measureText(p.q).width;x.fillText(p.q,W-pad-w,y);y+=p.l.length*48+18;});}
  x.fillStyle='#999';x.font=font(500,30);x.fillText(String(DB.ws.name||''),pad,H-pad-34);
  return c;}
async function pcSend(v,parts,qr){const vin=pcVin(v);let c;try{c=pcImage(v,parts,qr);}catch(e){toast(T_('Could not make the picture'));return;}
  const name=('VIN-'+(vin||carName(v)||'car')).replace(/[^A-Za-z0-9_-]+/g,'_')+'.png';const txt=[carName(v),pcSpec(v),vin?'VIN: '+vin:''].filter(Boolean).join('\n');
  try{trail('pcard','send '+parts.length+' parts');}catch(e){}
  const P=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.FswShare;
  if(window.CapApp&&P&&typeof P.sharePdf==='function'){const b64=c.toDataURL('image/png').split(',')[1];try{await P.sharePdf({b64,name,mime:'image/png',phone:'',text:txt});}catch(e){toast(T_('Could not send')+': '+(e&&e.message||e));}return;}
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));if(!blob){toast(T_('Could not make the picture'));return;}const f=new File([blob],name,{type:'image/png'});
  if(matchMedia('(pointer:coarse)').matches&&navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],text:txt});}catch(e){}return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},5000);toast(T_('Picture saved: drag it into the WhatsApp chat'),5000);}
/* job card: a 🔩 chip next to the km chip */
(function(){const J=SCREENS.job;SCREENS.job=m=>{J(m);const j=byId('jobs',S.p&&S.p.id);const v=j&&vehOf(j);if(!v||!v.id)return;const k=m.querySelector('.card [data-kmj]');if(!k)return;
  const b=document.createElement('button');b.className='kmchip pcchip';b.id='jpcard';b.innerHTML='🔩 '+T_('Parts shop');k.after(b);k.insertAdjacentText('afterend',' ');b.onclick=()=>partsCard(v,j);};})();
/* customer page, Cars tab: a button on each car */
(function(){const C=SCREENS.custd;if(!C)return;SCREENS.custd=m=>{C(m);m.querySelectorAll('.ccar [data-ve2]').forEach(e=>{const v=byId('vehicles',e.dataset.ve2);if(!v)return;const row=e.closest('.two');if(!row)return;
  const b=document.createElement('button');b.className='btn ghost sm pcbtn';b.dataset.pcv=v.id;b.innerHTML='🔩 '+T_('For the parts shop');row.after(b);b.onclick=()=>partsCard(v,null);});};})();
