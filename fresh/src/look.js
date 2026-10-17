/* ---------- Look: light / dark / auto (follows the phone) and colour themes ---------- */
const LOOKS=[['red','Red','#ee3a39','#f27b21'],['indigo','Indigo','#2a49f4','#7c3aed']];
let lookMQ=null;
function lookPref(){let w=null;try{w=DB&&DB.ws;}catch(e){}
  if(w)return {mode:w.mode||'auto',theme:w.theme||'red'};
  try{const o=JSON.parse(localStorage.getItem('ws_look')||'{}');return {mode:o.mode||'auto',theme:o.theme||'red'};}catch(e){return {mode:'auto',theme:'red'};}}
function lookApply(){
  const {mode,theme}=lookPref();const mq=window.matchMedia?matchMedia('(prefers-color-scheme: light)'):null;
  if(mq&&!lookMQ){lookMQ=mq;try{mq.addEventListener('change',()=>{lookApply();});}catch(e){try{mq.addListener(()=>lookApply());}catch(_){}}}
  const light=mode==='light'||(mode==='auto'&&!!(mq&&mq.matches));
  const h=document.documentElement;h.classList.toggle('m-light',light);h.classList.toggle('t-indigo',theme==='indigo');
  try{localStorage.setItem('ws_look',JSON.stringify({mode,theme}));}catch(e){}
  const bg=getComputedStyle(h).getPropertyValue('--bg').trim()||(light?'#f3f3f6':'#0b0b0c');
  let mt=document.querySelector('meta[name="theme-color"]');if(!mt){mt=document.createElement('meta');mt.name='theme-color';document.head.appendChild(mt);}mt.content=bg;
  try{const SB=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.StatusBar;if(SB){SB.setStyle({style:light?'LIGHT':'DARK'});SB.setBackgroundColor&&SB.setBackgroundColor({color:bg.length===7?bg:(light?'#f3f3f6':'#0b0b0c')});}}catch(e){}
  return light;}
lookApply();
