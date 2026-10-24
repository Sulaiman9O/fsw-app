/* ---------- sign-in screen: the workshop logo in a soft rounded card (its empty white margins cut off), coming in with a rise ---------- */
let LOGO_T=null;
function logoTrimmed(src,cb){if(LOGO_T&&LOGO_T.src===src){cb(LOGO_T.out);return;}const im=new Image();im.onload=()=>{try{const k=Math.min(1,900/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const x=c.getContext('2d');x.drawImage(im,0,0,c.width,c.height);
  const d=x.getImageData(0,0,c.width,c.height).data,W=c.width,H=c.height;let x0=W,y0=H,x1=-1,y1=-1;
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const o=(j*W+i)*4;if(d[o+3]>24&&Math.min(d[o],d[o+1],d[o+2])<235){if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j;}}
  if(x1<0){LOGO_T={src,out:src};cb(src);return;}const pad=Math.round(Math.max(x1-x0,y1-y0)*0.05);x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(W-1,x1+pad);y1=Math.min(H-1,y1+pad);
  const o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1-y0+1;o.getContext('2d').drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height);const out=o.toDataURL('image/png');LOGO_T={src,out};cb(out);}catch(e){cb(src);}};im.onerror=()=>cb(src);im.src=src;}
(function(){const st=document.createElement('style');st.textContent=`.login .lgbadge{background:#fff;border-radius:22px;padding:14px 22px;box-shadow:0 14px 40px rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.06);display:grid;place-items:center;width:min(250px,70vw);box-sizing:border-box;opacity:0;transform:translateY(18px) scale(.96);animation:lgIn .6s cubic-bezier(.2,.8,.2,1) .15s forwards}
.login .lgbadge img{width:100%;height:auto;max-height:110px;object-fit:contain;display:block;filter:none}
.login .brandline{opacity:0;transform:translateY(12px);animation:lgIn .5s cubic-bezier(.2,.8,.2,1) .05s forwards}
.login .in>*:not(.brandline):not(.lgbadge){opacity:0;transform:translateY(14px);animation:lgIn .5s cubic-bezier(.2,.8,.2,1) .35s forwards}
   .login.late .brandline{animation-delay:1.25s}.login.late .lgbadge{animation-delay:1.35s}.login.late .in>*:not(.brandline):not(.lgbadge){animation-delay:1.5s}
@keyframes lgIn{to{opacity:1;transform:none}}/* only the first time it shows, not after every key */
.login.seen .lgbadge,.login.seen .brandline,.login.seen .in>*{animation:none!important;opacity:1!important;transform:none!important}
@media (prefers-reduced-motion:reduce){.login .lgbadge,.login .brandline,.login .in>*{animation:none!important;opacity:1!important;transform:none!important}}`;document.head.appendChild(st);})();
(function(){const RL=renderLogin;window.renderLogin=renderLogin=function(){RL.apply(this,arguments);const lg=document.querySelector('.login');if(lg&&document.getElementById('intro'))lg.classList.add('late');if(lg&&window.__lgSeen)lg.classList.add('seen');window.__lgSeen=1;const img=document.querySelector('.login img.logo');if(!img||!DB.ws.logo)return;
  const b=document.createElement('div');b.className='lgbadge';img.replaceWith(b);b.appendChild(img);img.classList.remove('logo');img.style.visibility='hidden';logoTrimmed(DB.ws.logo,u=>{img.src=u;img.style.visibility='';});};})();
/* tapping a name: everything glides up to make room for the PIN pad (no jump), and the pad rises in */
(function(){const RL2=renderLogin;window.renderLogin=renderLogin=function(){const q=s=>document.querySelector('.login '+s);const keys=['.brandline','.lgbadge','.ob-hero','.in>h2','.people'];
  const before={};let had=!!q('.pad');if(q('.in'))keys.forEach(k=>{const e=q(k);if(e)before[k]=e.getBoundingClientRect().top;});
  RL2.apply(this,arguments);if(!Object.keys(before).length||!(window.matchMedia&&!matchMedia('(prefers-reduced-motion: reduce)').matches))return;
  keys.forEach(k=>{const e=q(k);if(!e||before[k]==null)return;const dy=before[k]-e.getBoundingClientRect().top;if(Math.abs(dy)<1)return;try{e.animate([{transform:`translateY(${dy}px)`},{transform:'none'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});}catch(x){}});
  if(!had){['.dots','.pad'].forEach((k,i)=>{const e=q(k);if(e)try{e.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'none'}],{duration:380,delay:120+i*60,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});}catch(x){}});}};})();
