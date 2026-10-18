/* ---------- CAR PICKER: makes → models → year → engine (data in cardb.js) ---------- */
const lc=s=>(s||'').toLowerCase();
const mkKey=s=>lc(s).replace(/[^a-z0-9؀-ۿ]/g,'');
function carUse(){const mk={},mo={},en={};DB.vehicles.forEach(v=>{if(v.make){const a=mkKey(v.make);mk[a]=(mk[a]||0)+1;if(v.model){const b=a+'|'+mkKey(v.model);mo[b]=(mo[b]||0)+1;if(v.engine){const c=b+'|'+v.engine;en[c]=(en[c]||0)+1;}}}});return {mk,mo,en};}
function findMake(n){const k=mkKey(n);return CARDB.mk.find(m=>mkKey(m[0])===k||mkKey(m[1])===k);}
function carMakes(q){const U=carUse(),k=mkKey(q),order=CARDB.mk.map((m,i)=>({m,i,u:U.mk[mkKey(m[0])]||0}));
  let L=order.filter(o=>!k||mkKey(o.m[0]).startsWith(k)||mkKey(o.m[1]).startsWith(k)||(k.length>1&&(mkKey(o.m[0]).includes(k)||mkKey(o.m[1]).includes(k))));
  L.sort((a,b)=>{const sa=k&&mkKey(a.m[0]).startsWith(k)?1:0,sb=k&&mkKey(b.m[0]).startsWith(k)?1:0;return (sb-sa)||(b.u-a.u)||(a.i-b.i);});
  // makes typed by the user before that are not in the database
  const own=[...new Set(DB.vehicles.map(v=>v.make).filter(Boolean))].filter(n=>!findMake(n)&&(!k||mkKey(n).includes(k)));
  return own.map(n=>({m:[n,'',[],[]],u:U.mk[mkKey(n)]||0,own:1})).concat(L);}
function carModels(make,q){const U=carUse(),M=findMake(make),k=mkKey(q),a=mkKey(make);
  const pop=M?M[2]:[],rest=M?M[3]:[];const own=[...new Set(DB.vehicles.filter(v=>mkKey(v.make)===a).map(v=>v.model).filter(Boolean))];
  const all=[];const seen=new Set();[...own,...pop,...rest].forEach(n=>{const x=mkKey(n);if(!seen.has(x)){seen.add(x);all.push(n);}});
  const L=all.map((n,i)=>({n,i,u:U.mo[a+'|'+mkKey(n)]||0,p:pop.some(p=>mkKey(p)===mkKey(n))})).filter(o=>!k||mkKey(o.n).includes(k));
  L.sort((x,y)=>{const sx=k&&mkKey(x.n).startsWith(k)?1:0,sy=k&&mkKey(y.n).startsWith(k)?1:0;return (sy-sx)||(y.u-x.u)||((y.p?1:0)-(x.p?1:0))||(x.p&&y.p?pop.findIndex(p=>mkKey(p)===mkKey(x.n))-pop.findIndex(p=>mkKey(p)===mkKey(y.n)):x.n.localeCompare(y.n));});return L;}
function carEngines(make,model,year){const M=findMake(make);const nm=M?M[0]:make;let list=CARDB.eng[nm+'|'+model];
  if(!list){const km=mkKey(model);const k=Object.keys(CARDB.eng).filter(x=>x.split('|')[0]===nm).find(x=>{const m=mkKey(x.split('|')[1]);return km.startsWith(m)||m.startsWith(km);});list=k?CARDB.eng[k]:[];}
  const y=+year||0;const U=carUse(),base=mkKey(make)+'|'+mkKey(model)+'|';
  const fromDb=list.filter(e=>!y||((!e[1]||y>=e[1])&&(!e[2]||y<=e[2]))).map(e=>({n:e[0],yr:e[1]?e[1]+'–'+(e[2]||'now'):''}));
  const other=y?list.filter(e=>!fromDb.some(f=>f.n===e[0])).map(e=>({n:e[0],yr:e[1]?e[1]+'–'+(e[2]||'now'):'',off:1})):[];
  const cust=((DB.custEng||{})[nm+'|'+model]||[]).filter(n=>!list.some(e=>e[0]===n)).map(n=>({n,yr:'added by you'}));
  const L=[...cust,...fromDb].map(e=>Object.assign(e,{u:U.en[base+e.n]||0})).sort((a,b)=>b.u-a.u);return {L,other};}
const fixMake=n=>{const M=findMake(n);return M?M[0]:n;};
/* typing only swaps the list; the box stays so the keyboard does not reset */
const put=(b,onlyList,inp,list)=>{const o=b.querySelector('.cpl');if(onlyList&&o&&b.querySelector('#cpq'))o.outerHTML=list;else b.innerHTML=inp+list;};
function carPicker(cur,done){const st={make:cur.make||'',model:cur.model||'',year:cur.year||'',engine:cur.engine||'',step:cur.make?(cur.model?'year':'model'):'make',q:''};
  const crumbs=()=>`<div class="cpath">${[['make',st.make||'Make'],['model',st.model||'Model'],['year',st.year||'Year'],['engine',st.engine?st.engine.split(' · ')[0]:'Engine']].map(([k,l],i)=>`<button data-cs="${k}" class="${st.step===k?'on':''}" ${i&&!st.make?'disabled':''}>${esc(l)}</button>`).join('<span>›</span>')}</div>`;
  const draw=onlyList=>{const el=$('#sheet .pnl');if(!el)return;const b=el.querySelector('#cpb');el.querySelector('#cph').innerHTML=crumbs();
    el.querySelectorAll('[data-cs]').forEach(x=>x.onclick=()=>{st.step=x.dataset.cs;st.q='';draw();});
    if(st.step==='make'){const ML=carMakes(st.q);put(b,onlyList,`<input class="field" id="cpq" placeholder="Type the make… (toy, nis, تويوتا)" value="${esc(st.q)}" autocomplete="off" autocorrect="off" spellcheck="false">`,`<div class="list cpl">${ML.slice(0,st.q?30:24).map(o=>`<button class="row" data-mk="${esc(o.m[0])}"><div><b>${esc(o.m[0])}</b><span>${o.m[1]?`<bdi>${esc(o.m[1])}</bdi>`:'your make'}${o.u?' · '+o.u+' in your cars':''}</span></div><span class="v">›</span></button>`).join('')}${st.q&&!ML.length?`<button class="row addr" data-mk="${esc(st.q)}"><div><b>＋ Use “${esc(st.q)}”</b></div></button>`:''}</div>`);}
    else if(st.step==='model'){const L=carModels(st.make,st.q);put(b,onlyList,`<input class="field" id="cpq" placeholder="Type the model of ${esc(st.make)}…" value="${esc(st.q)}" autocomplete="off" autocorrect="off" spellcheck="false">`,`<div class="list cpl">${L.slice(0,st.q?40:30).map((o,i)=>`<button class="row" data-mo="${esc(o.n)}"><div><b>${esc(o.n)}</b><span>${o.u?o.u+' in your cars':o.p?'common here':''}</span></div><span class="v">›</span></button>`).join('')}${st.q&&!L.length?`<button class="row addr" data-mo="${esc(st.q)}"><div><b>＋ Use “${esc(st.q)}”</b></div></button>`:''}</div>`);}
    else if(st.step==='year'){const Y=new Date().getFullYear()+1;const ys=[];for(let y=Y;y>=1995;y--)ys.push(y);b.innerHTML=`<input class="field" id="cpy" inputmode="numeric" maxlength="4" placeholder="Type the year" value="${esc(st.year)}"><div class="ygrid">${ys.map(y=>`<button data-y="${y}" class="${String(y)===String(st.year)?'on':''}">${y}</button>`).join('')}</div><button class="btn ghost sm" data-y="">Skip year</button>`;}
    else{const E=carEngines(st.make,st.model,st.year);b.innerHTML=`${E.L.length?'':`<p class="hint">No engines saved for ${esc(st.make+' '+st.model)}${st.year?' '+esc(st.year):''}. Type it below.</p>`}<div class="list cpl">${E.L.map(e=>`<button class="row${st.engine===e.n?' selr':''}" data-en="${esc(e.n)}"><div><b>${esc(e.n)}</b><span>${[e.yr,e.u?e.u+' in your cars':'',typeof engSpecTxt==='function'?engSpecTxt(e.n):''].filter(Boolean).join(' · ')}</span></div><span class="v">${st.engine===e.n?'✓':'›'}</span></button>`).join('')}</div>
      ${E.other.length?`<details class="cpo"><summary>Other years (${E.other.length})</summary><div class="list cpl">${E.other.map(e=>`<button class="row" data-en="${esc(e.n)}"><div><b>${esc(e.n)}</b><span>${e.yr}</span></div></button>`).join('')}</div></details>`:''}
      <div class="row2"><input class="field" id="cpe" placeholder="Other engine (e.g. 2.5L 4 cyl · 2AR-FE)"><button class="btn ghost sm" id="cpeok">Use</button></div><button class="btn ghost sm" data-en="">Skip engine</button>`;}
    const q=b.querySelector('#cpq');if(q){q.oninput=()=>{st.q=q.value;draw(true);};if(!st.q)setTimeout(()=>q.focus(),60);}
    b.querySelectorAll('[data-mk]').forEach(x=>x.onclick=()=>{const n=fixMake(x.dataset.mk);if(n!==st.make){st.model='';st.engine='';}st.make=n;st.q='';st.step='model';draw();});
    b.querySelectorAll('[data-mo]').forEach(x=>x.onclick=()=>{if(x.dataset.mo!==st.model)st.engine='';st.model=x.dataset.mo;st.q='';st.step='year';draw();});
    b.querySelectorAll('[data-y]').forEach(x=>x.onclick=()=>{st.year=x.dataset.y;st.step='engine';draw();});
    const cy=b.querySelector('#cpy');if(cy)cy.oninput=()=>{if(/^\d{4}$/.test(cy.value)){st.year=cy.value;st.step='engine';draw();}};
    const fin=en=>{st.engine=en;closeSheet();done({make:st.make,model:st.model,year:st.year,engine:st.engine});};
    b.querySelectorAll('[data-en]').forEach(x=>x.onclick=()=>fin(x.dataset.en));
    const eo=b.querySelector('#cpeok');if(eo)eo.onclick=()=>{const v=$('#cpe').value.trim();if(!v)return;const M=findMake(st.make);const k=(M?M[0]:st.make)+'|'+st.model;DB.custEng=DB.custEng||{};DB.custEng[k]=DB.custEng[k]||[];if(!DB.custEng[k].includes(v))DB.custEng[k].push(v);save();fin(v);};};
  openSheet(`<h3>🚗 Choose the car</h3><div id="cph"></div><div id="cpb"></div>`,()=>{});draw();}
