/* ---------- start ---------- */
(function(){
  const C=window.Capacitor;const A=C&&C.Plugins&&C.Plugins.App;
  if(A){window.CapApp=A;A.addListener('backButton',()=>{if(!back()){if(S.r==='home'||!S.user)A.exitApp();}});}
  else{try{history.pushState({},'');}catch(e){}}
  window.addEventListener('ws-update',e=>{const d=e.detail||{};const box=document.createElement('div');box.className='upd';box.innerHTML=`<span>New version ${d.name||''} is ready</span><button>Restart</button>`;box.querySelector('button').onclick=()=>{Promise.resolve(flushNow()).finally(()=>location.reload());};document.body.appendChild(box);});
  const A2=A;if(A2)A2.addListener('pause',()=>flushNow());
  const r=document.getElementById('root');if(r&&!r.children.length)r.innerHTML='<div class="ob-hero" style="padding-top:30vh"><span class="wsmark big">＋</span><p>Loading…</p></div>';
  storeInit().then(()=>{if(STORE.err){document.getElementById('root').innerHTML=`<div class="ob-hero" style="padding:25vh 20px 0"><span class="wsmark big">!</span><h2>Storage problem</h2><p>${esc(STORE.err)}</p><p class="hint">Your data was not changed. Do not use the app until this is fixed.</p></div>`;return;}try{fitsFix();}catch(e){}try{mergeScats();}catch(e){}try{setTimeout(cleanOldLogos,1500);}catch(e){}try{syncBoot();}catch(e){}try{if(DB.ws&&DB.customers&&!DB.ws.walkMerged){mergeWalkins();DB.ws.walkMerged=1;save();}}catch(e){}render();}).catch(()=>render());
})();
