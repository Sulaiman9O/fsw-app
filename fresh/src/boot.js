/* ---------- start ---------- */
(function(){
  const C=window.Capacitor;const A=C&&C.Plugins&&C.Plugins.App;
  if(A){window.CapApp=A;A.addListener('backButton',()=>{if(!back()){if(S.r==='home'||!S.user)A.exitApp();}});}
  else{try{history.pushState({},'');}catch(e){}}
  window.addEventListener('ws-update',e=>{const d=e.detail||{};const box=document.createElement('div');box.className='upd';box.innerHTML=`<span>New version ${d.name||''} is ready</span><button>Restart</button>`;box.querySelector('button').onclick=()=>location.reload();document.body.appendChild(box);});
  render();
})();
