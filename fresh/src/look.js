/* ---------- Look: light / dark / auto (follows the phone) and colour themes ---------- */
const LOOKS=[['shopflo','ShopFlo','#2F80FF','#0B1F3A'],['red','Red','#ee3a39','#f27b21'],['indigo','Indigo','#2a49f4','#7c3aed']];
let lookMQ=null;
function lookPref(){let w=null;try{w=DB&&DB.ws;}catch(e){}
  if(w){if(!w.themeV2){w.theme='shopflo';w.themeV2=1;try{save();}catch(e){}}return {mode:w.mode||'auto',theme:w.theme||'shopflo'};}
  try{const o=JSON.parse(localStorage.getItem('ws_look')||'{}');return {mode:o.mode||'auto',theme:o.theme||'shopflo'};}catch(e){return {mode:'auto',theme:'shopflo'};}}
function lookApply(){
  const {mode,theme}=lookPref();const mq=window.matchMedia?matchMedia('(prefers-color-scheme: light)'):null;
  if(mq&&!lookMQ){lookMQ=mq;try{mq.addEventListener('change',()=>{lookApply();});}catch(e){try{mq.addListener(()=>lookApply());}catch(_){}}}
  const light=mode==='light'||(mode==='auto'&&!!(mq&&mq.matches));
  const h=document.documentElement;h.classList.toggle('m-light',light);h.classList.toggle('t-indigo',theme==='indigo');h.classList.toggle('t-shopflo',theme==='shopflo');
  try{localStorage.setItem('ws_look',JSON.stringify({mode,theme}));}catch(e){}
  const bg=getComputedStyle(h).getPropertyValue('--bg').trim()||(light?'#F3F6FB':'#0B1F3A');
  let mt=document.querySelector('meta[name="theme-color"]');if(!mt){mt=document.createElement('meta');mt.name='theme-color';document.head.appendChild(mt);}mt.content=bg;
  try{const SB=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.StatusBar;if(SB){SB.setStyle({style:light?'LIGHT':'DARK'});SB.setBackgroundColor&&SB.setBackgroundColor({color:bg.length===7?bg:(light?'#F3F6FB':'#0B1F3A')});}}catch(e){}
  return light;}
lookApply();
