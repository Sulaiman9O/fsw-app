/* ---------- SIGNATURE + STAMP on the invoice: draw the signature once with a finger, make a round stamp (or upload one),
   and drag both where you want them on the preview. They are printed on every invoice by themselves. ---------- */
const SEAL_INK=['#1D3E8A','#C8282B','#0F7A47','#141414'];
function invSeal(I,L){const W=DB.ws;const sg=I.sig&&W.sig,stp=I.stamp&&W.stamp;if(!sg&&!stp&&!I.show.sign)return '';const P=I.pos||{};const s=P.s||{x:6,y:18,w:40},t=P.t||{x:58,y:4,w:34,r:-8};
  return `<div class="iv2-seal">${I.show.sign||sg?`<div class="iv2-sl"><span>${L('توقيع العميل','Customer signature')}</span><span>${L('توقيع وختم الورشة','Workshop signature & stamp')}</span></div>`:''}
   ${sg?`<img class="sd" data-sd="s" src="${W.sig}" style="left:${s.x}%;top:${s.y}%;width:${s.w}mm" alt="">`:''}
   ${stp?`<img class="sd" data-sd="t" src="${W.stamp}" style="left:${t.x}%;top:${t.y}%;width:${t.w}mm;transform:rotate(${t.r||0}deg)" alt="">`:''}</div>`;}
(function(){const st=document.createElement('style');st.textContent=`.iv2-seal{position:relative;height:34mm;margin-top:6mm}.iv2-sl{position:absolute;inset:auto 0 0 0;display:grid;grid-template-columns:1fr 1fr;gap:10mm;font-size:2.8mm;color:var(--im)}.iv2-sl span{border-top:.3mm solid var(--ik);padding-top:1.5mm}
.iv2-seal .sd{position:absolute;height:auto;opacity:.92;touch-action:none;user-select:none;-webkit-user-drag:none}.inv-pv.drag .iv2-seal .sd{outline:1px dashed hsl(214 85% 52%);cursor:grab}`;document.head.appendChild(st);
  window.INV2_CSS=(window.INV2_CSS||INV2_CSS)+st.textContent;})();
/* the round stamp, drawn from the workshop's own words */
function stampSvg(o){const ink=o.ink||SEAL_INK[0];const e=x=>String(x||'').replace(/[<&>"]/g,c=>({'<':'&lt;','&':'&amp;','>':'&gt;','"':'&quot;'}[c]));
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220"><defs><path id="a" d="M30,110 a80,80 0 1,1 160,0"/><path id="b" d="M24,110 a86,86 0 0,0 172,0"/></defs>
   <g fill="none" stroke="${ink}"><circle cx="110" cy="110" r="104" stroke-width="5"/><circle cx="110" cy="110" r="66" stroke-width="2"/></g>
   <g fill="${ink}" font-family="Tahoma,Arial,sans-serif" font-weight="700"><text font-size="19" letter-spacing="1"><textPath href="#a" startOffset="50%" text-anchor="middle">${e(o.top)}</textPath></text>
   <text font-size="17" letter-spacing="2"><textPath href="#b" startOffset="50%" text-anchor="middle">${e(o.bot)}</textPath></text>
   <text x="110" y="${o.mid2?104:117}" font-size="${String(o.mid||'').length>10?16:22}" text-anchor="middle">${e(o.mid)}</text>${o.mid2?`<text x="110" y="128" font-size="14" text-anchor="middle">${e(o.mid2)}</text>`:''}
   <text x="22" y="117" font-size="16" text-anchor="middle">★</text><text x="198" y="117" font-size="16" text-anchor="middle">★</text></g></svg>`);}
function stampSheet(){const W=DB.ws;const o=Object.assign({top:W.name||'',bot:W.phone||'',mid:W.addr||'',mid2:W.cr?'CR '+W.cr:'',ink:SEAL_INK[0]},W.stampO||{});
  openSheet(`<h3>🔵 ${T_('Workshop stamp')}</h3><div class="stpv"><img id="stp" alt=""></div>
   <label class="field-l">${T_('Around the top')}<input class="field" id="sta" value="${esc(o.top)}"></label><label class="field-l">${T_('Around the bottom')}<input class="field" id="stb" value="${esc(o.bot)}"></label>
   <div class="in2"><label class="field-l">${T_('Middle')}<input class="field" id="stc" value="${esc(o.mid)}"></label><label class="field-l">${T_('Under the middle')}<input class="field" id="std" value="${esc(o.mid2)}"></label></div>
   <div class="sw">${SEAL_INK.map(c=>`<button data-ink="${c}" class="${o.ink===c?'on':''}" style="background:${c}"></button>`).join('')}</div>
   <button class="btn" id="stok">${T_('Save')}</button><label class="btn ghost">${T_('Upload a stamp picture instead')}<input type="file" accept="image/*" id="stf" hidden></label>`,el=>{
    const g=()=>{o.top=el.querySelector('#sta').value;o.bot=el.querySelector('#stb').value;o.mid=el.querySelector('#stc').value;o.mid2=el.querySelector('#std').value;el.querySelector('#stp').src=stampSvg(o);};g();
    el.querySelectorAll('input.field').forEach(i=>i.oninput=g);el.querySelectorAll('[data-ink]').forEach(b=>b.onclick=()=>{o.ink=b.dataset.ink;el.querySelectorAll('[data-ink]').forEach(x=>x.classList.toggle('on',x===b));g();});
    el.querySelector('#stok').onclick=()=>{g();W.stampO=o;W.stamp=stampSvg(o);const s=invS();s.stamp=1;DB.ws.invS=s;audit('settings','Stamp');save();closeSheet();render();};
    el.querySelector('#stf').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,600/Math.max(im.width,im.height));let c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);try{c=cleanLogoCanvas(c);}catch(x){}W.stamp=c.toDataURL('image/png');delete W.stampO;const s=invS();s.stamp=1;DB.ws.invS=s;save();closeSheet();render();};im.src=r.result;};r.readAsDataURL(f);};});}
/* the signature, drawn once with a finger */
function signSheet(){openSheet(`<h3>✍️ ${T_('Your signature')}</h3><p class="hint">${T_('Sign with your finger in the box. It is printed on every invoice.')}</p><canvas id="sgc" class="sgpad"></canvas>
   <div class="two"><button class="btn ghost" id="sgclr">${T_('Clear')}</button><button class="btn" id="sgok">${T_('Save')}</button></div>`,el=>{
    const c=el.querySelector('#sgc');const r=c.getBoundingClientRect();const k=2;c.width=Math.round(r.width*k);c.height=Math.round(r.height*k);const x=c.getContext('2d');x.lineCap='round';x.lineJoin='round';x.strokeStyle='#1D3E8A';x.lineWidth=2.6*k;let dn=false,lx=0,ly=0,any=false;
    const P=e=>{const b=c.getBoundingClientRect();return [(e.clientX-b.left)*k,(e.clientY-b.top)*k];};
    c.onpointerdown=e=>{dn=true;c.setPointerCapture(e.pointerId);[lx,ly]=P(e);x.beginPath();x.arc(lx,ly,x.lineWidth/2,0,7);x.fillStyle=x.strokeStyle;x.fill();any=true;};
    c.onpointermove=e=>{if(!dn)return;const [nx,ny]=P(e);x.beginPath();x.moveTo(lx,ly);x.quadraticCurveTo(lx,ly,(lx+nx)/2,(ly+ny)/2);x.lineTo(nx,ny);x.stroke();lx=nx;ly=ny;};
    c.onpointerup=c.onpointercancel=()=>{dn=false;};
    el.querySelector('#sgclr').onclick=()=>{x.clearRect(0,0,c.width,c.height);any=false;};
    el.querySelector('#sgok').onclick=()=>{if(!any){toast(T_('Sign in the box first'));return;}let t=c;try{t=cleanLogoCanvas(c);}catch(e){}DB.ws.sig=t.toDataURL('image/png');const s=invS();s.sig=1;DB.ws.invS=s;audit('settings','Signature');save();closeSheet();render();};});}
/* settings block on the "Invoice look" page */
function invSealSettings(I){const W=DB.ws;
  return `${sec('Signature and stamp')}<p class="hint">${T_('Drag them on the preview below to put them where you like.')}</p>
   <div class="sealrow"><div class="sealbox">${W.sig?`<img src="${W.sig}" alt="">`:'<span>✍️</span>'}</div><div><button class="btn ghost sm" id="sgdraw">${T_(W.sig?'Sign again':'Draw your signature')}</button>${W.sig?`<label class="chk"><input type="checkbox" id="sgon" ${I.sig?'checked':''}> ${T_('On every invoice')}</label><label class="field-l">${T_('Size')}<input type="range" id="sgw" min="20" max="70" value="${(I.pos&&I.pos.s&&I.pos.s.w)||40}"></label>`:''}</div></div>
   <div class="sealrow"><div class="sealbox">${W.stamp?`<img src="${W.stamp}" alt="">`:'<span>🔵</span>'}</div><div><button class="btn ghost sm" id="stmk">${T_(W.stamp?'Change the stamp':'Make a stamp')}</button>${W.stamp?`<label class="chk"><input type="checkbox" id="ston" ${I.stamp?'checked':''}> ${T_('On every invoice')}</label><label class="field-l">${T_('Size')}<input type="range" id="stw" min="20" max="55" value="${(I.pos&&I.pos.t&&I.pos.t.w)||34}"></label><label class="field-l">${T_('Tilt')}<input type="range" id="str" min="-30" max="30" value="${(I.pos&&I.pos.t&&I.pos.t.r)||-8}"></label>`:''}</div></div>`;}
function invSealBind(pv){const setP=(k,f)=>{const s=invS();s.pos=JSON.parse(JSON.stringify(s.pos||{}));s.pos[k]=Object.assign({},s.pos[k]||{},f);DB.ws.invS=s;save();pv();};
  const on=(id,fn)=>{const e=$(id);if(e)fn(e);};
  on('#sgdraw',e=>e.onclick=()=>signSheet());on('#stmk',e=>e.onclick=()=>stampSheet());
  on('#sgon',e=>e.onchange=()=>{const s=invS();s.sig=e.checked?1:0;DB.ws.invS=s;save();pv();});on('#ston',e=>e.onchange=()=>{const s=invS();s.stamp=e.checked?1:0;DB.ws.invS=s;save();pv();});
  on('#sgw',e=>e.oninput=()=>setP('s',{w:+e.value}));on('#stw',e=>e.oninput=()=>setP('t',{w:+e.value}));on('#str',e=>e.oninput=()=>setP('t',{r:+e.value}));}
/* drag on the preview */
function invSealDrag(root,pv){const box=root.querySelector('.iv2-seal');if(!box)return;root.classList.add('drag');
  box.querySelectorAll('[data-sd]').forEach(img=>{img.onpointerdown=e=>{e.preventDefault();img.setPointerCapture(e.pointerId);const b=box.getBoundingClientRect(),r=img.getBoundingClientRect();const dx=e.clientX-r.left,dy=e.clientY-r.top;
    img.onpointermove=ev=>{const x=Math.max(-5,Math.min(95,(ev.clientX-dx-b.left)/b.width*100)),y=Math.max(-40,Math.min(90,(ev.clientY-dy-b.top)/b.height*100));img.style.left=x+'%';img.style.top=y+'%';img.dataset.x=x;img.dataset.y=y;};
    img.onpointerup=()=>{img.onpointermove=null;if(img.dataset.x==null)return;const k=img.dataset.sd;const s=invS();s.pos=JSON.parse(JSON.stringify(s.pos||{}));s.pos[k]=Object.assign({},s.pos[k]||{},{x:Math.round(+img.dataset.x*10)/10,y:Math.round(+img.dataset.y*10)/10});DB.ws.invS=s;save();};};});}
