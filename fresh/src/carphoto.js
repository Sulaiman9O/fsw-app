/* ---------- CAR PHOTOS: pictures kept in the car's file (customer page → cars), the first one is the main picture.
   The main picture also shows in the job header. Stored like inspection photos (small JPEG records in DB.photos, shared with sync). ---------- */
/* a car picture is kept small (about 40 KB): 640 px, JPEG 0.65 */
function shrinkCar(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,640/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.65));};im.onerror=()=>{toast(T_('Could not read this picture'));cb(null);};im.src=r.result;};r.readAsDataURL(file);}
const vehPhotos=v=>(v&&v.ph||[]).map(id=>photoOf(id)).filter(Boolean);
function vehAddPhotos(v,done){const f=document.createElement('input');f.type='file';f.accept='image/*';f.multiple=true;
  f.onchange=()=>{const L=[...(f.files||[])];if(!L.length)return;let n=0;L.forEach(x=>shrinkCar(x,u=>{if(u){DB.photos=DB.photos||[];const id=uid('ph');DB.photos.push({id,veh:v.id,img:u,t:now()});(v.ph=v.ph||[]).push(id);}
    if(++n===L.length){save();toast(T_('Photo saved'));done&&done();}}));};f.click();}
function vehPhotoSheet(v,id,done){const p=photoOf(id);if(!p)return;const main=(v.ph||[])[0]===id;let sure=0;
  openSheet(`<img src="${p.img}" style="width:100%;border-radius:14px">${main?`<p class="hint">⭐ ${T_('Main picture')}</p>`:`<button class="btn ghost" id="vpmain">⭐ ${T_('Make it the main picture')}</button>`}<button class="btn ghost jb-del" id="vpdel">🗑 ${T_('Delete photo')}</button>`,el=>{
    const mb=el.querySelector('#vpmain');if(mb)mb.onclick=()=>{v.ph=[id,...v.ph.filter(x=>x!==id)];save();closeSheet();done&&done();};
    el.querySelector('#vpdel').onclick=e=>{if(!sure){sure=1;e.currentTarget.textContent='⚠ '+T_('Tap again to delete');return;}v.ph=v.ph.filter(x=>x!==id);DB.photos=DB.photos.filter(x=>x.id!==id);save();closeSheet();done&&done();};});}
/* customer page: a photo strip on each car card */
(function(){const C=SCREENS.custd;SCREENS.custd=m=>{C(m);if((S.p.tab||'cars')!=='cars')return;
  m.querySelectorAll('.ccar').forEach(card=>{const b=card.querySelector('[data-ctr]');const v=b&&byId('vehicles',b.dataset.ctr);if(!v)return;const P=vehPhotos(v);
    const strip=document.createElement('div');strip.className='vphs';
    strip.innerHTML=P.map((p,k)=>`<button class="vph${k?'':' main'}" data-vph="${p.id}"><img src="${p.img}" alt=""></button>`).join('')+`<button class="vphadd" data-vpa>📷 ${T_(P.length?'Add photo':'Add car photos')}</button>`;
    const sub=card.querySelector('.sub');(sub||card.querySelector('.h')).after(strip);
    strip.querySelectorAll('[data-vph]').forEach(x=>x.onclick=()=>vehPhotoSheet(v,x.dataset.vph,render));
    strip.querySelector('[data-vpa]').onclick=()=>vehAddPhotos(v,render);});};})();
/* job header: the car's main picture (tap to see / add) */
(function(){const J=SCREENS.job;SCREENS.job=m=>{J(m);const j=byId('jobs',S.p&&S.p.id);const v=j&&vehOf(j);if(!v||!v.id)return;const card=m.querySelector('.card');const h=card&&card.querySelector('.h');if(!h)return;
  const P=vehPhotos(v);const b=document.createElement('button');b.className='vth'+(P.length?'':' none');b.title=T_('Car photos');b.innerHTML=P.length?`<img src="${P[0].img}" alt="">${P.length>1?`<i>${P.length}</i>`:''}`:'📷';
  h.prepend(b);b.onclick=()=>{if(!P.length){vehAddPhotos(v,render);return;}
    openSheet(`<h3>📷 ${esc(carName(v))}</h3><div class="vphs big">${P.map(p=>`<button class="vph" data-vph="${p.id}"><img src="${p.img}" alt=""></button>`).join('')}</div><button class="btn ghost" id="vpadd">📷 ${T_('Add photo')}</button>`,el=>{
      el.querySelectorAll('[data-vph]').forEach(x=>x.onclick=()=>vehPhotoSheet(v,x.dataset.vph,render));el.querySelector('#vpadd').onclick=()=>{closeSheet();vehAddPhotos(v,render);};});};};})();
