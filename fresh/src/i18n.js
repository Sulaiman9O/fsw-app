/* ---------- Language: English or Arabic (MSA). Only the words change; the layout stays the same. ---------- */
const I18N={lang:'en',map:null,tpl:null,cache:new Map(),obs:null};
function langPref(){try{const u=S.user;if(u&&u.lang)return u.lang;if(DB.ws&&DB.ws.lang)return DB.ws.lang;}catch(e){}try{return localStorage.getItem('ws_lang')||'en';}catch(e){return 'en';}}
function i18nBuild(){if(I18N.map)return;const m=new Map(),tp=[];
  for(const [k,v] of Object.entries(AR_DICT)){
    if(/\{n\}|\{x\}/.test(k)){let re='^';const kinds=[];
      for(const p of k.split(/(\{n\}|\{x\})/)){if(p==='{n}'){re+='(-?[0-9][0-9.,]*)';kinds.push('n');}else if(p==='{x}'){re+='(.+?)';kinds.push('x');}else re+=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
      tp.push([new RegExp(re+'$'),v,kinds]);}
    else m.set(k,v);}
  I18N.map=m;I18N.tpl=tp;}
function trCore(s){
  const m0=I18N.map.get(s);if(m0!=null)return m0;
  for(const [re,v,k] of I18N.tpl){const m=s.match(re);if(!m)continue;let out=v,ni=0;
    m.slice(1).forEach((g,i)=>{if(k[i]==='n')out=out.replace('{'+(ni++)+'}',g);else out=out.replace('{x}',trStr(g));});return out;}
  return null;}
const AR_MON={Jan:'يناير',Feb:'فبراير',Mar:'مارس',Apr:'أبريل',May:'مايو',Jun:'يونيو',Jul:'يوليو',Aug:'أغسطس',Sep:'سبتمبر',Oct:'أكتوبر',Nov:'نوفمبر',Dec:'ديسمبر'};
const AR_RE=/[؀-ۿ]/;
/* translate one piece of text; returns the same text when nothing fits */
function trStr(raw){
  if(!raw||!/[A-Za-z]/.test(raw))return raw;
  const c=I18N.cache.get(raw);if(c!==undefined)return c;
  const lead=raw.match(/^\s*/)[0],trail=raw.match(/\s*$/)[0];let s=raw.trim(),r=trCore(s);
  if(r==null){/* emoji / symbols before, › ✓ : after */
    const pm=s.match(/^([^A-Za-z0-9]*?)([A-Za-z0-9][\s\S]*?)([\s›✓:…!?.]*)$/u);
    if(pm&&(pm[1]||pm[3])){const x=trCore(pm[2]);if(x!=null)r=pm[1]+x+pm[3];}}
  if(r==null){const dm=s.match(/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)( \d{4})?( \d\d:\d\d)?$/);if(dm)r=dm[1]+' '+AR_MON[dm[2]]+(dm[3]||'')+(dm[4]||'');}
  if(r==null){const nm=s.match(/^(.*[^\d\s]) (\d+)$/);if(nm){const x=trStr(nm[1]);if(x!==nm[1])r=x+' '+nm[2];}}
  if(r==null&&s.includes(', ')){const segs=s.split(', '),t=segs.map(x=>trStr(x));if(t.every((x,i)=>x!==segs[i]))r=t.join('، ');}
  if(r==null&&s.includes(' · ')){const segs=s.split(' · '),t=segs.map(x=>trStr(x));if(t.some((x,i)=>x!==segs[i]))r=t.join(' · ');}
  if(r==null&&/ → /.test(s)){const segs=s.split(' → '),t=segs.map(x=>trStr(x));if(t.some((x,i)=>x!==segs[i]))r=t.join(' ← ');}
  const out=r==null?raw:lead+r+trail;
  if(I18N.cache.size>20000)I18N.cache.clear();I18N.cache.set(raw,out);return out;}
/* T(): use in code for text that is not in the page (search, WhatsApp is NOT translated) */
const T_=s=>I18N.lang==='ar'?(i18nBuild(),trStr(s)):s;
const NOTR='.inv,.wstk,[data-notr],script,style,textarea,input,select option[data-notr]';
function trEl(root){
  if(I18N.lang!=='ar')return;
  if(root.nodeType===3){const p=root.parentElement;if(p&&!p.closest(NOTR)){const v=root.nodeValue,t=trStr(v);if(t!==v){if(p.tagName==='OPTION'&&!p.hasAttribute('value'))p.setAttribute('value',p.textContent);root.nodeValue=t;}}return;}
  if(root.nodeType!==1||root.closest(NOTR))return;
  const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode:n=>n.nodeType===1?(n.matches(NOTR)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_SKIP):NodeFilter.FILTER_ACCEPT});
  attrs(root);let n;
  while((n=tw.nextNode())){const v=n.nodeValue,t=trStr(v);if(t!==v){const o=n.parentElement;if(o&&o.tagName==='OPTION'&&!o.hasAttribute('value'))o.setAttribute('value',o.textContent);n.nodeValue=t;}}
  root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(e=>{if(!e.closest('.inv,.wstk,[data-notr]'))attrs(e);});
  function attrs(e){if(!e.getAttribute)return;for(const a of ['placeholder','title','aria-label']){const v=e.getAttribute(a);if(v){const t=trStr(v);if(t!==v)e.setAttribute(a,t);}}}}
function langApply(){
  const l=langPref()==='ar'?'ar':'en',was=I18N.lang;I18N.lang=l;
  try{localStorage.setItem('ws_lang',(DB.ws&&DB.ws.lang)||l);}catch(e){}
  const h=document.documentElement;h.lang=l;h.classList.toggle('lang-ar',l==='ar');
  if(l==='ar'){i18nBuild();
    if(!I18N.obs){I18N.obs=new MutationObserver(ms=>{if(I18N.lang!=='ar')return;for(const m of ms){if(m.type==='childList')m.addedNodes.forEach(trEl);else if(m.type==='attributes')trEl(m.target);}});
      I18N.obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['placeholder','title']});}
    trEl(document.body);}
  return was!==l;}
