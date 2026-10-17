/* ---------- PRIVACY: activity log + encrypted backups ---------- */
function audit(a,d){try{DB.audit=DB.audit||[];DB.audit.push({t:now(),u:S.user?S.user.name:'—',a,d:d||''});if(DB.audit.length>5000)DB.audit.splice(0,DB.audit.length-5000);}catch(e){}}
const AUD_IC={login:'🔑',fail:'⛔',delete:'🗑',price:'💲',invoice:'🧾',return:'↩️',pay:'💰',discount:'🏷',user:'👥',settings:'⚙️',backup:'⬇️',restore:'⬆️',wipe:'💣',demo:'🧪',close:'🔒',order:'🚚',stock:'📦'};
SCREENS.audit=m=>{if(!can.settings()){go('more');return;}const f=S.p.f||'',u=S.p.u||'';const L=(DB.audit||[]).slice().reverse();
  const users=[...new Set(L.map(x=>x.u))];const types=[...new Set(L.map(x=>x.a))];
  const R=L.filter(x=>(!f||x.a===f)&&(!u||x.u===u));
  m.innerHTML=head('Activity log',`${R.length}`)+`<p class="hint">Who did what, and when. Nobody can edit or delete this list (it keeps the last 5,000).</p>
  <div class="chips"><button data-af="" aria-pressed="${!f}">All</button>${types.map(t=>`<button data-af="${t}" aria-pressed="${f===t}">${AUD_IC[t]||'•'} ${t}</button>`).join('')}</div>
  ${users.length>1?`<div class="chips"><button data-au="" aria-pressed="${!u}">Everyone</button>${users.map(x=>`<button data-au="${esc(x)}" aria-pressed="${u===x}">${esc(x)}</button>`).join('')}</div>`:''}
  <div class="list">${R.slice(0,300).map(x=>`<div class="row"><div><b>${AUD_IC[x.a]||'•'} ${esc(x.d||x.a)}</b><span>${esc(x.u)} · ${fmtD(x.t)} ${hm(x.t)}</span></div></div>`).join('')||empty('📜','Nothing yet.')}</div>`;
  $$('[data-af]').forEach(b=>b.onclick=()=>{S.p.f=b.dataset.af;render();});$$('[data-au]').forEach(b=>b.onclick=()=>{S.p.u=b.dataset.au;render();});};
/* encrypted backup: AES-GCM 256, key from password with PBKDF2-SHA256 (250,000 rounds) */
const b64e=u=>{let s='';const a=new Uint8Array(u);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s);};
const b64d=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function bkKey(pw,salt){const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function encBackup(obj,pw){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const k=await bkKey(pw,salt);
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(JSON.stringify(obj)));return JSON.stringify({ws_backup:2,enc:'AES-GCM-256/PBKDF2-250k',made:new Date().toISOString(),salt:b64e(salt),iv:b64e(iv),data:b64e(ct)});}
async function decBackup(o,pw){const k=await bkKey(pw,b64d(o.salt));const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64d(o.iv)},k,b64d(o.data));return JSON.parse(new TextDecoder().decode(pt));}
function backupSheet(){openSheet(`<h3>⬇️ Make a backup</h3><p class="hint">The backup is locked with a password. Without it nobody can open the file, not even us. <b>Write the password down.</b> If you lose it, the backup cannot be opened.</p>
  <input class="field" id="bp1" type="password" placeholder="Password (at least 6)" autocomplete="new-password"><input class="field" id="bp2" type="password" placeholder="Type it again" autocomplete="new-password"><button class="btn" id="bpok">🔒 Make locked backup</button>`,el=>el.querySelector('#bpok').onclick=async()=>{
    const a=$('#bp1').value,b=$('#bp2').value;if(a.length<6){toast('Password: at least 6 letters or numbers');return;}if(a!==b){toast('The two passwords are not the same');return;}
    if(!(window.crypto&&crypto.subtle)){toast('This phone cannot lock files');return;}
    const btn=$('#bpok');btn.disabled=true;btn.textContent='Locking…';
    try{audit('backup','Locked backup made');DB.backups=(DB.backups||0)+1;save();const txt=await encBackup(DB,a);const name='workshop-backup-'+today()+'.wsb.json';closeSheet();
      try{if(navigator.canShare&&navigator.canShare({files:[new File([txt],name)]})){await navigator.share({files:[new File([txt],name,{type:'application/json'})],title:name});toast('Locked backup ready');return;}}catch(e){}
      try{const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));l.download=name;l.click();toast('Locked backup saved');}catch(e){toast('Could not save the file');}
    }catch(e){btn.disabled=false;btn.textContent='🔒 Make locked backup';toast('Could not make the backup');}});}
function restoreSheet(){openSheet(`<h3>⬆️ Restore a backup</h3><p class="hint">This replaces everything on this device.</p><input type="file" accept="application/json,.json" id="rf" class="field"><input class="field" id="rpw" type="password" placeholder="Backup password" autocomplete="off"><button class="btn" id="rok">Restore</button>`,el=>el.querySelector('#rok').onclick=async()=>{
    const f=$('#rf').files[0];if(!f){toast('Choose the backup file');return;}let o;try{o=JSON.parse(await f.text());}catch(e){toast('That is not a backup file');return;}
    let d=o;if(o.ws_backup===2){const pw=$('#rpw').value;if(!pw){toast('Type the backup password');return;}try{d=await decBackup(o,pw);}catch(e){toast('Wrong password');return;}}
    if(!d||!d.ws){toast('That is not a backup file');return;}
    confirmSheet('Replace everything on this device with this backup?','Restore',()=>{DB=Object.assign(blankDB(),d);audit('restore','Backup restored ('+(o.ws_backup===2?'locked':'old unlocked')+' file)');save();S.user=null;render();toast('Restored');});});}
/* ---------- import a services + parts list (replaces the ones on this device) ---------- */
function catalogSheet(){if(!can.settings())return;openSheet(`<h3>📥 Import services and parts</h3><p class="hint">Choose the list file. It <b>replaces all services and all parts</b> on this device, test ones too. Old jobs and invoices keep their lines.</p><input type="file" accept="application/json,.json" id="cf" class="field"><div id="cfi"></div><button class="btn" id="cfok" disabled>Import</button>`,el=>{let cat=null;
  el.querySelector('#cf').onchange=async e=>{const f=e.target.files[0];cat=null;el.querySelector('#cfok').disabled=true;if(!f)return;try{const o=JSON.parse(await f.text());if(o&&o.ws_catalog&&Array.isArray(o.services)&&Array.isArray(o.parts))cat=o;}catch(x){}
    el.querySelector('#cfi').innerHTML=cat?`<div class="card note"><b>${cat.services.length} services · ${cat.parts.length} parts</b><span class="sub">Now on this device: ${DB.services.length} services · ${DB.parts.length} parts. They will be removed.</span></div>`:'<p class="err">That is not a services and parts list.</p>';el.querySelector('#cfok').disabled=!cat;};
  el.querySelector('#cfok').onclick=()=>{if(!cat)return;const old={services:DB.services,parts:DB.parts,scats:DB.scats,pcats:DB.pcats};
    DB.services=cat.services;DB.parts=cat.parts;if(cat.scats)DB.scats=cat.scats;DB.pcats=[...new Set([...(cat.pcats||[]),...cat.parts.map(p=>p.cat)])];
    const ids=new Set(DB.parts.map(p=>p.id));(DB.pos||[]).forEach(o=>{if(o.status!=='received')o.items=(o.items||[]).filter(i=>ids.has(i.part));});
    DB.ws.svcReviewed=true;audit('import','Imported '+cat.services.length+' services and '+cat.parts.length+' parts (replaced '+old.services.length+' services, '+old.parts.length+' parts)');save();closeSheet();render();
    undoBar('Imported '+cat.services.length+' services and '+cat.parts.length+' parts',()=>{Object.assign(DB,old);save();render();});};});}
