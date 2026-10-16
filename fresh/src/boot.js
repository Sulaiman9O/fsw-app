/* ---------- start ---------- */
(function(){
  const C=window.Capacitor;const A=C&&C.Plugins&&C.Plugins.App;
  if(A){window.CapApp=A;A.addListener('backButton',()=>{if(!back()){if(S.r==='home'||!S.user)A.exitApp();}});}
  else{try{history.pushState({},'');}catch(e){}}
  render();
})();
