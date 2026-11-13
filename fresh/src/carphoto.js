/* ---------- CAR PHOTOS: pictures kept in the car's file (customer page → cars), the first one is the main picture.
   The main picture also shows in the job header. Stored like inspection photos (small JPEG records in DB.photos, shared with sync). ---------- */
/* a car picture is kept small (about 40 KB): 640 px, JPEG 0.65 */
function shrinkCar(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,640/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.65));};im.onerror=()=>{toast(T_('Could not read this picture'));cb(null);};im.src=r.result;};r.readAsDataURL(file);}
/* the car's main picture as a small square for lists (job rows, search results); empty when the car has no picture */
/* lists show hundreds of cars: put a short blob: link in the page, not the 40 KB picture text (fast lists, less memory) */
const THUMB=new Map();
function thumbUrl(p){let u=THUMB.get(p.id);if(u&&u.src===p.img)return u.url;
  try{const i=p.img.indexOf(',');const bin=atob(p.img.slice(i+1));const a=new Uint8Array(bin.length);for(let k=0;k<bin.length;k++)a[k]=bin.charCodeAt(k);
    if(u)URL.revokeObjectURL(u.url);u={src:p.img,url:URL.createObjectURL(new Blob([a],{type:(p.img.slice(5,i).split(';')[0])||'image/jpeg'}))};THUMB.set(p.id,u);return u.url;}catch(e){return '';}}
function vehThumb(v,c){const id=v&&(v.ph||[])[0];const p=id&&photoOf(id);const u=p&&thumbUrl(p);return u?`<span class="cth${c?' '+c:''}"><img src="${esc(u)}" alt="" loading="lazy"></span>`:'';}
const vehPhotos=v=>(v&&v.ph||[]).map(id=>photoOf(id)).filter(Boolean);
function vehAddPhotos(v,done){const f=document.createElement('input');f.type='file';f.accept='image/*';f.multiple=true;
  f.onchange=()=>{const L=[...(f.files||[])];if(!L.length)return;let n=0;L.forEach(x=>shrinkCar(x,u=>{if(u){DB.photos=DB.photos||[];const id=uid('ph');DB.photos.push({id,veh:v.id,img:u,t:now()});(v.ph=v.ph||[]).push(id);}
    if(++n===L.length){save();toast(T_('Photo saved'));done&&done();}}));};f.click();}
function vehDelPhoto(v,id){v.ph=(v.ph||[]).filter(x=>x!==id);DB.photos=(DB.photos||[]).filter(x=>x.id!==id);save();toast(T_('Photo deleted'));}
/* small pictures with a ✕ on each (tap ✕ twice to delete) — tap the picture to see it big */
function vehThumbs(v,P,cls){return P.map((p,k)=>`<div class="vph${k?'':' main'}${cls?' '+cls:''}"><button class="vpo" data-vph="${p.id}"><img src="${p.img}" alt=""></button>${k?'':`<span class="vpm">⭐</span>`}<button class="vpx" data-vpx="${p.id}" title="${T_('Delete photo')}">✕</button></div>`).join('');}
function vehThumbsBind(box,v,after){box.querySelectorAll('[data-vph]').forEach(x=>x.onclick=()=>vehPhotoSheet(v,x.dataset.vph,after));
  box.querySelectorAll('[data-vpx]').forEach(x=>x.onclick=e=>{e.stopPropagation();if(!x.classList.contains('sure')){x.classList.add('sure');x.textContent=T_('Delete?');setTimeout(()=>{if(document.body.contains(x)){x.classList.remove('sure');x.textContent='✕';}},3000);return;}vehDelPhoto(v,x.dataset.vpx);after&&after();});}
/* one picture big: ‹ › to go through them, make it the main one, delete */
function vehPhotoSheet(v,id,done){const P=vehPhotos(v);let k=Math.max(0,P.findIndex(p=>p.id===id));let sure=0;if(!P.length)return;
  const draw=el=>{const p=P[k];const main=(v.ph||[])[0]===p.id;sure=0;
    el.querySelector('#vpimg').src=p.img;el.querySelector('#vpn').textContent=(k+1)+' / '+P.length;el.querySelector('#vpstar').hidden=!main;el.querySelector('#vpmain').hidden=main;
    el.querySelector('#vpdel').textContent='🗑 '+T_('Delete photo');el.querySelector('#vpprev').hidden=el.querySelector('#vpnext').hidden=P.length<2;};
  openSheet(`<div class="vpbig"><img id="vpimg" alt=""><button class="vpnav" id="vpprev">‹</button><button class="vpnav r" id="vpnext">›</button><span class="vpn" id="vpn"></span></div>
    <p class="hint" id="vpstar">⭐ ${T_('Main picture')}</p><button class="btn ghost" id="vpmain">⭐ ${T_('Make it the main picture')}</button>
    <div class="two"><button class="btn ghost" id="vpadd2">📷 ${T_('Add photo')}</button><button class="btn ghost jb-del" id="vpdel"></button></div>`,el=>{draw(el);
    el.querySelector('#vpprev').onclick=()=>{k=(k-1+P.length)%P.length;draw(el);};el.querySelector('#vpnext').onclick=()=>{k=(k+1)%P.length;draw(el);};
    let sx=0;const im=el.querySelector('.vpbig');im.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;},{passive:true});im.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50&&P.length>1){k=(k+(dx<0?1:-1)+P.length)%P.length;draw(el);}});
    el.querySelector('#vpmain').onclick=()=>{const id2=P[k].id;v.ph=[id2,...v.ph.filter(x=>x!==id2)];save();toast(T_('Main picture'));closeSheet();done&&done();};
    el.querySelector('#vpadd2').onclick=()=>{closeSheet();vehAddPhotos(v,done);};
    el.querySelector('#vpdel').onclick=e=>{if(!sure){sure=1;e.currentTarget.textContent='⚠ '+T_('Tap again to delete');return;}vehDelPhoto(v,P[k].id);P.splice(k,1);
      if(!P.length){closeSheet();done&&done();return;}k=Math.min(k,P.length-1);draw(el);done&&done();};});}
/* customer page: a photo strip on each car card */
(function(){const C=SCREENS.custd;SCREENS.custd=m=>{C(m);if((S.p.tab||'cars')!=='cars')return;
  m.querySelectorAll('.ccar').forEach(card=>{const b=card.querySelector('[data-ctr]');const v=b&&byId('vehicles',b.dataset.ctr);if(!v)return;const P=vehPhotos(v);
    const strip=document.createElement('div');strip.className='vphs';
    strip.innerHTML=vehThumbs(v,P)+`<button class="vphadd" data-vpa>📷 ${T_(P.length?'Add photo':'Add car photos')}</button>`;
    const sub=card.querySelector('.sub');(sub||card.querySelector('.h')).after(strip);
    const re=()=>{if(!S.sheet)render();};vehThumbsBind(strip,v,re);
    strip.querySelector('[data-vpa]').onclick=()=>vehAddPhotos(v,render);});};})();
/* all the car's pictures in a window (from the job) */
function vehGallery(v){const P=vehPhotos(v);
  openSheet(`<h3>📷 ${esc(carName(v))}</h3><p class="hint">${T_('Tap a picture to see it big. ✕ twice deletes it.')}</p><div class="vphs big">${vehThumbs(v,P)}</div><button class="btn ghost" id="vpadd">📷 ${T_('Add photo')}</button>`,el=>{
    vehThumbsBind(el,v,()=>{if(S.r==='job')render();if(vehPhotos(v).length)vehGallery(v);else closeSheet();});
    el.querySelector('#vpadd').onclick=()=>{closeSheet();vehAddPhotos(v,()=>{render();vehGallery(v);});};});}
/* job header: the car's main picture (tap to see / add) */
(function(){const J=SCREENS.job;SCREENS.job=m=>{J(m);const j=byId('jobs',S.p&&S.p.id);const v=j&&vehOf(j);if(!v||!v.id)return;const card=m.querySelector('.card');const h=card&&card.querySelector('.h');if(!h)return;
  const P=vehPhotos(v);const b=document.createElement('button');b.className='vth'+(P.length?'':' none');b.title=T_('Car photos');b.innerHTML=P.length?`<img src="${P[0].img}" alt="">${P.length>1?`<i>${P.length}</i>`:''}`:'📷';
  h.prepend(b);b.onclick=()=>{if(!P.length){vehAddPhotos(v,render);return;}vehGallery(v);};};})();
