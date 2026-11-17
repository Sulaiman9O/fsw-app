/* ---------- 2.42.0 «For the parts shop» card ----------
   One tap shows only what a spare-parts shop needs: the car, the engine and the VIN (big, in groups of 4).
   2.42.1: QR code and parts list taken out (Sulaiman: the part names come in no order — just the car, bigger).
   No customer name, phone, plate, prices or anything else from the workshop. Show it on the screen, send it as a
   picture on WhatsApp, or copy the VIN. Opened from: the job card (🔩 chip) and the customer's car card. */
const pcVin=v=>String((v&&v.vin)||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const pcGroups=s=>s.replace(/(.{4})(?=.)/g,'$1 ');
function pcTrans(v){const t=String((v&&v.trans)||'');const m=t.match(/\(([A-Z]{2,4})\)/);if(m)return m[1];if(/cvt/i.test(t))return 'CVT';if(/auto/i.test(t))return 'AT';if(/manual/i.test(t))return 'MT';return t.slice(0,20);}
function pcDrive(v){let a=v&&v.ari;if(typeof a==='string'){try{a=JSON.parse(a);}catch(e){a=null;}}const d=String((a&&a.drivenWheels)||'');return /all|4wd|four/i.test(d)?'4WD':/rear/i.test(d)?'RWD':/front/i.test(d)?'FWD':'';}
function pcEngine(v){const e=String((typeof effEng==='function'?effEng(v):'')||(v&&v.engine)||'');const s=typeof engShort==='function'?engShort(e):e;return s.replace(/\s+/g,' ').trim();}
function pcCopy(t){const ok=()=>toast(T_('VIN copied')+' · '+t);try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,()=>pcCopy2(t,ok));return;}}catch(e){}pcCopy2(t,ok);}
function pcCopy2(t,ok){const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');ok();}catch(e){toast(t);}a.remove();}
const pcSpecL=v=>[pcEngine(v),pcTrans(v),pcDrive(v),v&&v.body].filter(Boolean);
function partsCard(v){if(!v){toast(T_('No car'));return;}const vin=pcVin(v);
  try{trail('pcard',vin?'vin':'no vin');}catch(e){}
  const sp=pcSpecL(v);
  openSheet(`<div class="pcard" id="pcard"><div class="pc-in">
     <div class="pc-top">🔩 ${T_('For the parts shop')}</div>
     <div class="pc-car" dir="ltr" data-notr>${esc([v.make,v.model].filter(Boolean).join(' ')||'—')}${v.year?` <span class="pc-yr">${esc(v.year)}</span>`:''}</div>
     ${sp.length?`<div class="pc-spec" dir="ltr" data-notr>${sp.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}
     ${vin?`<div class="pc-lab">VIN · ${T_('Chassis no.')}</div><div class="pc-vin" dir="ltr" data-notr>${esc(pcGroups(vin))}</div>${vin.length!==17?`<div class="pc-warn">⚠️ ${T_('This VIN is not 17 characters — check it on the car')}</div>`:''}`
       :`<div class="pc-novin">⚠️ ${T_('No VIN saved for this car')}</div>`}
     <div class="pc-ws" dir="ltr" data-notr>${esc(DB.ws.name||'')}</div></div></div>
    <div class="pc-acts"><button class="btn" id="pcsend">📤 ${T_('Send as picture')}</button>${vin?`<button class="btn ghost" id="pccopy">📋 ${T_('Copy VIN')}</button>`:''}<button class="btn ghost" id="pcbig">⛶ ${T_('Show big')}</button></div>
    ${vin?'':`<button class="btn ghost" id="pcedit">✏️ ${T_('Add the VIN')}</button>`}`,el=>{
    const cp=el.querySelector('#pccopy');if(cp)cp.onclick=()=>pcCopy(vin);
    el.querySelector('#pcbig').onclick=()=>{const c=el.querySelector('#pcard');c.classList.add('pc-full');const exit=()=>{c.classList.remove('pc-full');c.removeEventListener('click',exit);try{if(document.fullscreenElement)document.exitFullscreen();}catch(e){}};setTimeout(()=>c.addEventListener('click',exit),50);
      try{if(c.requestFullscreen)c.requestFullscreen().catch(()=>{});}catch(e){}};
    const ed=el.querySelector('#pcedit');if(ed)ed.onclick=()=>{closeSheet();vehSheet(byId('customers',v.cust)||{},v);};
    el.querySelector('#pcsend').onclick=()=>pcSend(v);});}
/* the same card drawn as a picture (1080 wide, white) — no screenshot or cropping needed */
function pcImage(v){const vin=pcVin(v);const W=1080,pad=72;const c=document.createElement('canvas');const x=c.getContext('2d');
  const font=(w,s)=>`${w} ${s}px Inter, Roboto, Arial, sans-serif`;const mono=s=>`800 ${s}px "Roboto Mono", Menlo, Consolas, monospace`;
  const wrap=(t,f,max)=>{x.font=f;const out=[];let cur='';String(t).split(/\s+/).forEach(w=>{const tr=cur?cur+' '+w:w;if(x.measureText(tr).width>max&&cur){out.push(cur);cur=w;}else cur=tr;});if(cur)out.push(cur);return out;};
  const carT=[v.make,v.model,v.year].filter(Boolean).join(' ')||'—';let cf=96;x.font=font(800,cf);while(x.measureText(carT).width>W-2*pad&&cf>60){cf-=4;x.font=font(800,cf);}const carL=wrap(carT,font(800,cf),W-2*pad);
  const sp=pcSpecL(v).join('  ·  ');const specL=sp?wrap(sp,font(600,46),W-2*pad):[];
  let vf=104;x.font=mono(vf);const g=pcGroups(vin);while(vin&&x.measureText(g).width>W-2*pad&&vf>48){vf-=4;x.font=mono(vf);}
  const H=pad+50+40+carL.length*(cf+20)+specL.length*62+60+(vin?50+vf+40:80)+60+pad;c.width=W;c.height=H;
  x.fillStyle='#fff';x.fillRect(0,0,W,H);x.textBaseline='top';let y=pad;
  x.fillStyle='#e8322b';x.font=font(700,36);x.fillText('🔩 FOR THE PARTS SHOP · لمحل القطع',pad,y);y+=50+40;
  x.fillStyle='#111';x.font=font(800,cf);carL.forEach(l=>{x.fillText(l,pad,y);y+=cf+20;});
  x.fillStyle='#444';x.font=font(600,46);specL.forEach(l=>{x.fillText(l,pad,y);y+=62;});y+=60;
  if(vin){x.fillStyle='#777';x.font=font(600,34);x.fillText('VIN · رقم الشاصي',pad,y);y+=50;x.fillStyle='#000';x.font=mono(vf);x.fillText(g,pad,y);y+=vf+40;}
  else{x.fillStyle='#c00';x.font=font(700,48);x.fillText('No VIN',pad,y);y+=80;}
  x.fillStyle='#999';x.font=font(500,32);x.fillText(String(DB.ws.name||''),pad,H-pad-36);
  return c;}
async function pcSend(v){const vin=pcVin(v);let c;try{c=pcImage(v);}catch(e){toast(T_('Could not make the picture'));return;}
  const name=('VIN-'+(vin||carName(v)||'car')).replace(/[^A-Za-z0-9_-]+/g,'_')+'.png';const txt=[carName(v),pcSpecL(v).join(' · '),vin?'VIN: '+vin:''].filter(Boolean).join('\n');
  try{trail('pcard','send');}catch(e){}
  const P=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.FswShare;
  if(window.CapApp&&P&&typeof P.sharePdf==='function'){const b64=c.toDataURL('image/png').split(',')[1];try{await P.sharePdf({b64,name,mime:'image/png',phone:'',text:txt});}catch(e){toast(T_('Could not send')+': '+(e&&e.message||e));}return;}
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));if(!blob){toast(T_('Could not make the picture'));return;}const f=new File([blob],name,{type:'image/png'});
  if(matchMedia('(pointer:coarse)').matches&&navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],text:txt});}catch(e){}return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},5000);toast(T_('Picture saved: drag it into the WhatsApp chat'),5000);}
/* job card: a 🔩 chip next to the km chip */
(function(){const J=SCREENS.job;SCREENS.job=m=>{J(m);const j=byId('jobs',S.p&&S.p.id);const v=j&&vehOf(j);if(!v||!v.id)return;const k=m.querySelector('.card [data-kmj]');if(!k)return;
  const b=document.createElement('button');b.className='kmchip pcchip';b.id='jpcard';b.innerHTML='🔩 '+T_('Parts shop');k.after(b);k.insertAdjacentText('afterend',' ');b.onclick=()=>partsCard(v);};})();
/* customer page, Cars tab: a button on each car */
(function(){const C=SCREENS.custd;if(!C)return;SCREENS.custd=m=>{C(m);m.querySelectorAll('.ccar [data-ve2]').forEach(e=>{const v=byId('vehicles',e.dataset.ve2);if(!v)return;const row=e.closest('.two');if(!row)return;
  const b=document.createElement('button');b.className='btn ghost sm pcbtn';b.dataset.pcv=v.id;b.innerHTML='🔩 '+T_('For the parts shop');row.after(b);b.onclick=()=>partsCard(v);});};})();
