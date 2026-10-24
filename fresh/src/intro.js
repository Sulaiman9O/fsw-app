/* ---------- opening: the logo comes up from below and fades in, then rises away into the app (no hard edges, centred) ---------- */
(function(){try{if(window.__noIntro||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
  const o=document.createElement('div');o.id='intro';o.innerHTML=`<div class="il">${(window.SF_LOGO||'').replace(/width="[^"]*"|height="[^"]*"/g,'')}</div><div class="ib"><i></i></div>`;
  const st=document.createElement('style');st.textContent=`#intro{position:fixed;inset:0;z-index:9999;pointer-events:none;background:radial-gradient(120% 90% at 50% 40%,#12305a 0%,#0B1F3A 60%,#081629 100%);display:grid;place-items:center;color:#fff;animation:inOut .45s ease-in 1.25s forwards}
#intro .il{width:min(62vw,300px);opacity:0;transform:translateY(28px) scale(.94);animation:inUp .7s cubic-bezier(.2,.8,.2,1) .1s forwards}#intro .il svg{width:100%;height:auto;display:block;filter:drop-shadow(0 10px 30px rgba(47,128,255,.35))}
#intro .ib{position:absolute;bottom:18%;width:min(40vw,160px);height:3px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden;opacity:0;animation:fadeIn .3s ease .5s forwards}#intro .ib i{display:block;height:100%;width:40%;background:#2F80FF;border-radius:3px;animation:slide 1s ease-in-out infinite}
@keyframes inUp{to{opacity:1;transform:none}}@keyframes fadeIn{to{opacity:1}}@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
@keyframes inOut{to{opacity:0;transform:translateY(-24px);visibility:hidden}}`;
  document.head.appendChild(st);document.body.appendChild(o);setTimeout(()=>{o.remove();},1900);}catch(e){}})();
