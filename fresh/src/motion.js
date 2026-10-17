/* ---------- MOTION (GSAP): short, subtle, can be turned off in Settings ---------- */
const motionOn=()=>!!window.gsap&&!(DB.ws&&DB.ws.motionOff)&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
let MV={key:'',t:0};
function motionAfterRender(m){document.documentElement.classList.toggle('mo',motionOn());if(!motionOn()||!m)return;
  const key=S.r+'|'+(S.p&&S.p.id||'');if(key===MV.key)return;MV.key=key;
  const kids=[...m.children].filter(e=>e.offsetParent!==null).slice(0,14);
  gsap.fromTo(kids,{y:12,opacity:0},{y:0,opacity:1,duration:.26,stagger:.022,ease:'power2.out',clearProps:'transform,opacity'});
  countUp(m);}
function countUp(root){root.querySelectorAll('.kpi b, .g .sub i, .total .big').forEach(el=>{const t=el.textContent.trim();if(!/^-?[\d,]+(\.\d+)?$/.test(t))return;const dec=(t.split('.')[1]||'').length,end=parseFloat(t.replace(/,/g,''));if(!end)return;
  const o={v:0};gsap.to(o,{v:end,duration:.55,ease:'power2.out',onUpdate:()=>{el.textContent=dec?o.v.toFixed(dec):Math.round(o.v).toLocaleString('en-US');},onComplete:()=>{el.textContent=t;}});});}
function motionSheetIn(el){if(!motionOn())return;const p=el.querySelector('.pnl');gsap.fromTo(el,{backgroundColor:'rgba(0,0,0,0)'},{backgroundColor:'rgba(0,0,0,.6)',duration:.2});if(p)gsap.fromTo(p,{yPercent:100},{yPercent:0,duration:.3,ease:'power3.out',clearProps:'transform'});}
function motionSheetOut(el){if(!motionOn()||!el)return;const c=el.cloneNode(true);c.id='';c.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));c.querySelectorAll('*').forEach(e=>{[...e.attributes].forEach(at=>{if(at.name.startsWith('data-'))e.removeAttribute(at.name);});});c.className='sghost';c.style.pointerEvents='none';c.setAttribute('aria-hidden','true');document.body.insertBefore(c,document.body.firstChild);const p=c.querySelector('.pnl');
  gsap.to(c,{backgroundColor:'rgba(0,0,0,0)',duration:.2});gsap.to(p||c,{yPercent:100,duration:.22,ease:'power2.in',onComplete:()=>c.remove()});}
function motionPop(el){if(motionOn()&&el)gsap.fromTo(el,{scale:.92,opacity:0},{scale:1,opacity:1,duration:.22,ease:'back.out(2)',clearProps:'transform,opacity'});}
function motionShake(el){if(motionOn()&&el)gsap.fromTo(el,{x:-8},{x:0,duration:.4,ease:'elastic.out(1,.3)'});}
