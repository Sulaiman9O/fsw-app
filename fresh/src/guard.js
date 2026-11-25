/* Guards against slips (UX audit 25 Nov 2026): taps that land on what just appeared under the finger,
   action buttons pressed twice, typing lost on the way out. No new buttons. */
const GUARD_MS=350;
const guardOff=()=>navigator.webdriver&&!window.__GUARD_ON; /* automated tests click faster than a finger */
/* money typed with a comma as the decimal mark ("5,5" = 5.500) */
const numDec=v=>{const s=String(v==null?'':v).trim();return !s.includes('.')&&/^[^\d]*\d+,\d{1,3}[^\d,]*$/.test(s)?num(s.replace(',','.')):num(s);};
/* New car in: what was typed survives Back, a tab switch or a reload (30 minutes) */
const NJ_KEY='ws_nj',NJ_MS=30*60000;
const njHas=n=>!!n&&['phone','name','plate','make','model','year','km','vin'].some(k=>String(n[k]||'').trim());
function njDraftSet(n){try{if(!njHas(n)){njDraftClear();return;}S.njDraft={t:Date.now(),n:Object.assign({},n)};localStorage.setItem(NJ_KEY,JSON.stringify(S.njDraft));}catch(e){}}
function njDraftGet(){try{let d=S.njDraft;if(!d){d=JSON.parse(localStorage.getItem(NJ_KEY)||'null');}if(!d||Date.now()-d.t>NJ_MS||!njHas(d.n)){njDraftClear();return null;}return Object.assign({},d.n,{dupOk:false});}catch(e){return null;}}
function njDraftClear(){S.njDraft=null;try{localStorage.removeItem(NJ_KEY);}catch(e){}}
(function(){
  const sheetTitle=()=>{const h=document.querySelector('#sheet .pnl h3');return h?h.textContent:'';};
  const _os=openSheet;openSheet=function(){const had=!!document.getElementById('sheet'),t0=had?sheetTitle():null;const r=_os.apply(this,arguments);if(!had||sheetTitle()!==t0)S._guard=performance.now();
    /* a sheet's action button does nothing once its sheet is gone (the same press arriving again must not save twice);
       while the sheet is open the button stays usable (add another row, retry after a refused value) */
    try{document.querySelectorAll('#sheet .pnl button.btn:not(.ghost):not([data-repeat])').forEach(b=>{const f=b.onclick;if(!f||f._once)return;const g=function(){if(!b.isConnected)return;return f.apply(this,arguments);};g._once=1;b.onclick=g;});}catch(e){}
    return r;};
  /* a sheet that closes uncovers the screen under the finger: same guard */
  const _cs=closeSheet;closeSheet=function(){const had=!!document.getElementById('sheet');const r=_cs.apply(this,arguments);if(had)S._guard=performance.now();return r;};
  const key=()=>S.r+'|'+((S.p&&S.p.id)||'');
  const _go=go;go=function(r){const k0=key(),r0=S.r;const x=_go.apply(this,arguments);if(key()!==k0)S._guard=performance.now();if(r0==='newjob'&&r==='job')njDraftClear();return x;};
  document.addEventListener('click',e=>{const t=e.target;if(!t||!t.closest)return;
    /* 1) a real tap within 350ms of a new sheet or screen is the tail of a double tap: drop it */
    if(e.isTrusted&&!guardOff()&&S._guard&&performance.now()-S._guard<GUARD_MS&&!t.closest('.key')&&(t.closest('#sheet')||t.closest('#main')||t.closest('#undob'))){e.stopPropagation();e.preventDefault();return;}
  },true);
  /* keyboard: Esc = Back, Ctrl/⌘+S = the sheet's Save, Enter in a sheet field = the sheet's Save */
  document.addEventListener('keydown',e=>{if(!S.user)return;const el=document.getElementById('sheet');
    if(e.key==='Escape'){if(e.defaultPrevented||document.querySelector('.selpop,.qsb'))return;if(el||(S.hist&&S.hist.length)||S.r!=='home'){e.preventDefault();back();}return;}
    if((e.ctrlKey||e.metaKey)&&/^s$/i.test(e.key)){if(el){const b=sheetSaveBtn(el);if(b){e.preventDefault();b.click();}}return;}
    if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&el){const t=e.target;if(t&&t.tagName==='INPUT'&&el.contains(t)&&!/^(search|checkbox|radio|file)$/.test(t.type)&&!t.classList.contains('srchbox')&&t.id!=='aq'&&!t.hasAttribute('data-noenter')){const b=sheetSaveBtn(el);if(b){e.preventDefault();b.click();}}}
  });
  /* the short message never sits on the pay bar */
  const _toast=toast;toast=function(s){_toast(s);try{const t=document.getElementById('toast'),pb=document.querySelector('#main .paybar');t.style.bottom='';if(pb&&pb.offsetParent!==null&&!document.getElementById('sheet')){const r=pb.getBoundingClientRect();if(r.top>innerHeight*.4)t.style.bottom=(innerHeight-r.top+10)+'px';}}catch(e){}};
  /* New car in: start from the draft, save it while typing, offer Clear */
  const _nj=SCREENS.newjob;SCREENS.newjob=function(m){if(!S.p.n){const d=njDraftGet();if(d)S.p.n=d;}const r=_nj.apply(this,arguments);const N=S.p.n;
    m.oninput=()=>{if(S.r!=='newjob'||!S.p.n)return;const map={nphone:'phone',nname:'name',nplate:'plate',nkm:'km',nmake:'make',nmodel:'model',nyear:'year',nvin:'vin',nkm2:'km'};Object.keys(map).forEach(id=>{const x=document.getElementById(id);if(x)S.p.n[map[id]]=x.value;});njDraftSet(S.p.n);};
    if(njHas(N)){njDraftSet(N);const h=m.querySelector('.nh-head');if(h&&!m.querySelector('#nclr')){const b=document.createElement('button');b.className='lnk';b.id='nclr';b.textContent=T_('Clear');b.onclick=()=>{njDraftClear();S.p.n=null;render();};h.appendChild(b);}}
    return r;};
})();
Object.assign(AR_DICT,{'as a service':'كخدمة','as a part':'كقطعة','Type the quantity':'اكتب الكمية','Type the price':'اكتب السعر','Marked ready':'صارت جاهزة','Clear':'امسح','Nothing found.':'ما لقينا شي.'});
