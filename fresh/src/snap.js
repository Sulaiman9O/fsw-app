/* ---------- IN-APP CAMERA for photos (2.43.3) ----------
   Why: on the workshop tablet the system camera app opened ON TOP of ShopFlo; Android then closed ShopFlo to free memory,
   so after taking the picture the app started again from home and the photo was lost (trail 27 Nov: camera → restart ×3).
   Now every "take a photo" (car photos, inspection photos, receipt photos) opens the camera INSIDE the app: nothing leaves the app.
   Camera rule: camView()/camLive() inside .camv. The same lens choice / torch as the VIN scanner (camOpen).
   snapPhoto(cb,{title}) — cb gets [Blob] after each shot; the camera stays open for more shots until ✕ or Done.
   If the live camera can't open (no permission, old WebView) it falls back to the system camera, as before. */
let SNAP=null;
function snapClose(){if(!SNAP)return false;const s=SNAP;SNAP=null;try{s.s&&s.s.getTracks().forEach(t=>t.stop());}catch(e){}s.el.remove();return true;}
function sysPick(multi,cb){const f=document.createElement('input');f.type='file';f.accept='image/*';if(multi)f.multiple=true;else f.setAttribute('capture','environment');
  f.onchange=()=>{const L=[...(f.files||[])];if(L.length)cb(L);};f.click();}
function snapPhoto(cb,opt){opt=opt||{};const md=navigator.mediaDevices;
  if(!md||!md.getUserMedia){try{trail('photo','camera (system)');}catch(e){}sysPick(false,cb);return;}
  snapClose();try{trail('photo','camera (in app)');}catch(e){}
  const el=document.createElement('div');el.id='snapov';el.className='snapov';el.setAttribute('role','dialog');
  el.innerHTML=`<div class="snaptop"><b>📷 ${esc(opt.title||T_('Take photo'))}</b><span class="snapn" id="snapn"></span><button class="snapx" id="snapx" aria-label="${esc(T_('Close'))}">✕</button></div>
    <div class="vswrap snapbox"><div class="vsv camv">${camView('snapvid')}<div class="vscam"><button id="vslens" hidden>🔄 <span></span></button><button id="vstorch" hidden>🔦</button></div></div></div>
    <div class="snapbar"><button class="btn ghost" id="snapgal">🖼 ${T_('From gallery')}</button><button class="snapshut" id="snapgo" aria-label="${esc(T_('Take photo'))}"></button><button class="btn" id="snapdone">${T_('Done')}</button></div>`;
  document.body.appendChild(el);const me={el,s:null,n:0};SNAP=me;const vid=el.querySelector('#snapvid');camLive(vid);
  el.querySelector('#snapx').onclick=()=>snapClose();el.querySelector('#snapdone').onclick=()=>snapClose();
  el.querySelector('#snapgal').onclick=()=>{snapClose();sysPick(true,cb);};
  camOpen(vid,el,s=>{if(SNAP===me)me.s=s;else{try{s.getTracks().forEach(t=>t.stop());}catch(e){}}}).catch(()=>{if(SNAP!==me)return;snapClose();toast(T_('Camera could not open'));sysPick(false,cb);});
  const go=el.querySelector('#snapgo');let busy=false;
  go.onclick=()=>{if(busy||SNAP!==me||!vid.videoWidth)return;busy=true;go.classList.add('on');
    const k=Math.min(1,1600/Math.max(vid.videoWidth,vid.videoHeight));const c=document.createElement('canvas');c.width=Math.round(vid.videoWidth*k);c.height=Math.round(vid.videoHeight*k);
    c.getContext('2d').drawImage(vid,0,0,c.width,c.height);
    c.toBlob(b=>{busy=false;go.classList.remove('on');if(!b)return;me.n++;const n=el.querySelector('#snapn');if(n)n.textContent='✓ '+me.n;try{trail('photo','taken '+me.n);}catch(e){}cb([b]);},'image/jpeg',.9);};}
