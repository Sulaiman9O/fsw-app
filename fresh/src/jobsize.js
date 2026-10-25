/* ---------- On the job: (1) labour lines are told apart from parts at a glance (blue "🔧 Labour" tag + light tint, parts get a grey "📦 Part" tag);
   (2) a labour line whose price depends on the car size shows the size; tap it to switch (e.g. a Hilux at the sedan price). The car keeps that size next time. ---------- */
(function(){const st=document.createElement('style');st.textContent=`.jb-r.it.jb-lab{background:hsl(214 85% 52% / .07)}.jb-r.it.jb-lab>b{color:hsl(214 85% 60%)}
.jb-r.it .kt{display:inline-flex;align-items:center;gap:3px;font-size:.72rem;font-weight:800;padding:1px 7px;border-radius:999px;margin-inline-end:4px;vertical-align:1px}
.jb-r.it .kt.lab{background:hsl(214 85% 52% / .16);color:hsl(214 85% 62%)}.jb-r.it .kt.prt{background:hsl(220 10% 50% / .16);color:inherit;opacity:.85}
.jb-r.it .szc{display:inline-flex;align-items:center;gap:2px;font-size:.72rem;font-weight:800;padding:1px 8px;border-radius:999px;border:1px dashed hsl(214 85% 55% / .7);color:hsl(214 85% 62%);margin-inline-start:4px;vertical-align:1px}
html.m-light .jb-r.it .kt.lab,html.m-light .jb-r.it .szc{color:hsl(214 85% 42%)}html.m-light .jb-r.it.jb-lab>b{color:hsl(214 85% 42%)}`;document.head.appendChild(st);})();
const svcHasSizes=s=>{const p=(s&&s.p)||[];return p.length>1&&new Set(p.filter(x=>x!==''&&x!=null).map(Number)).size>1;};
function jobSizeSheet(j,i){const v=vehOf(j);const it=j.items[i];const s=svcOfItem(it);if(!s)return;
  if(j.inv){if(typeof editInvAsk==='function')editInvAsk(j);else toast(T_('The invoice is ready'));return;}
  const cur=sizeOf(v);
  openSheet(`<h3>🚙 ${T_('Car size for the price')}</h3><p class="hint">${esc(s.name)}</p><div class="list">${DB.sizes.map((n,k)=>`<button class="row" data-zz="${k}" aria-pressed="${k===cur}"><div><b>${k===cur?'✓ ':''}${esc(T_(n))}</b></div><span class="v"><bdi>${f3(svcPrice(s,{size:k,model:''}))}</bdi></span></button>`).join('')}</div>
   <p class="hint">${v?T_('The car keeps this size next time.'):''}</p>${can.settings()?`<button class="btn ghost sm" id="zz1">⚙️ ${T_('One price for all sizes')} (<bdi>${f3(+it.p||0)}</bdi>)</button>`:''}`,el=>{
    const z1=el.querySelector('#zz1');if(z1)z1.onclick=()=>{const sv=byId('services',s.id)||s;sv.p=[+it.p||0];audit('settings','One price for all sizes · '+sv.name);save();closeSheet();render();toast(T_('Saved: one price for all sizes'));};
    el.querySelectorAll('[data-zz]').forEach(b=>b.onclick=()=>{const k=+b.dataset.zz;const old=cur;let n=0;
      (j.items||[]).forEach(x=>{if(x.k==='part')return;const sv=svcOfItem(x);if(!sv||!svcHasSizes(sv))return;const was=svcPrice(sv,{size:old,model:''});if(x===it||Math.abs((+x.p||0)-was)<0.0005){x.p=svcPrice(sv,{size:k,model:''});n++;}});
      if(v){v.size=k;}logJ(j,'Car size → '+DB.sizes[k]);save();closeSheet();render();toast(T_('Price changed')+(n>1?' ('+n+')':''));});});}
(function(){const J=SCREENS.job;SCREENS.job=m=>{J(m);const j=byId('jobs',S.p&&S.p.id);if(!j||(S.selJ&&S.selJ.id===j.id))return;const v=vehOf(j);const LB=T_('Labour'),PT=T_('Part');
  m.querySelectorAll('.jb-r.it[data-it]').forEach(r=>{const i=+r.dataset.it;const it=(j.items||[])[i];if(!it)return;const sm=r.querySelector('small');if(!sm)return;
    const tn=sm.firstChild;const lab=it.k!=='part';const word=lab?LB:PT;
    if(tn&&tn.nodeType===3&&tn.textContent.startsWith(word)){tn.textContent=tn.textContent.slice(word.length);const k=document.createElement('span');k.className='kt '+(lab?'lab':'prt');k.textContent=(lab?'🔧 ':'📦 ')+word;sm.insertBefore(k,tn);if(tn.textContent.startsWith(' · '))tn.textContent=tn.textContent.slice(3);}
    if(!lab)return;r.classList.add('jb-lab');const s=svcOfItem(it);if(!s||!svcHasSizes(s)||it.free)return;
    const c=document.createElement('span');c.className='szc';c.dataset.szc=i;c.textContent='🚙 '+T_(DB.sizes[sizeOf(v)]||'')+' ▾';sm.appendChild(c);
    c.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();jobSizeSheet(j,i);});});};})();
