/* ---------- DESKTOP (wide screens, 1100px+): pages use the width — two columns where a page has a main part and a side part,
   lists in 2–3 columns. Only moves the page's own blocks after it is drawn (their buttons keep working); phones and tablets are unchanged. ---------- */
const DESK_W=1100;
/* for each page: which blocks go to the side column (the rest stay in the main column); 'top' stays above both */
const DESK={
  home:{top:'.srch',side:'.qbtn,.kpis3,.grp,.morerow'},
  customers:{top:'.srch',side:'.qbtn,.kpis3,.grp,.morerow'},
  job:{top:'.nh-head',side:'#jinsp,.jrem,.jrbtns,label.field-l,.jb-log',sideSec:1},
  custd:{top:'.nh-head',side:'.chd,.two,.kpis3'},
  inv:{top:'.nh-head',side:'.lnk,.ops-sec,.jb-list,.two,.btn',main:'.inv-pv'},
  inspr:{top:'.nh-head',side:'.two',main:'.invwrap'},
  invstyle:{top:'.nh-head',from:'#ipv'},
  stkset:{top:'.nh-head',from:'#spvS'}};
/* pages whose repeated blocks sit side by side (a grid of cards) */
const DESK_GRID={};
function deskGrid(m){const sel=DESK_GRID[S.r];if(!sel||m.querySelector(':scope>.dkg'))return;const L=[...m.children].filter(e=>e.matches(sel));if(L.length<2)return;
  const g=document.createElement('div');g.className='dkg dkg-'+S.r;m.insertBefore(g,L[0]);L.forEach(e=>g.appendChild(e));}
function deskLayout(){const m=document.getElementById('main');if(!m)return;document.body.dataset.r=S.r||'';if(window.innerWidth<DESK_W||!S.user)return;
  try{deskGrid(m);}catch(e){}const c=DESK[S.r];if(!c||m.querySelector(':scope>.dk'))return;
  try{const kids=[...m.children];const isTop=e=>c.top&&e.matches(c.top);let fi=c.from?kids.findIndex(e=>e.matches(c.from)):-1;if(fi>0&&kids[fi-1].classList.contains('ops-sec'))fi--;
    const sideSet=new Set(kids.filter((e,i)=>!isTop(e)&&!(c.main&&e.matches(c.main))&&(c.from?(fi>=0&&i>=fi):e.matches(c.side))));
    /* a section title goes with the block right after it */
    if(c.sideSec||1)kids.forEach(e=>{if(e.classList.contains('ops-sec')&&e.nextElementSibling&&sideSet.has(e.nextElementSibling))sideSet.add(e);});
    if(!sideSet.size)return;
    const dk=document.createElement('div');dk.className='dk dk-'+S.r;const A=document.createElement('div');A.className='dkA';const B=document.createElement('div');B.className='dkB';dk.append(A,B);
    const firstBody=kids.find(e=>!isTop(e));m.insertBefore(dk,firstBody||null);
    kids.forEach(e=>{if(isTop(e))return;(sideSet.has(e)?B:A).appendChild(e);});}catch(e){console.warn('desk',e);}}
(function(){const R=render;window.render=render=function(){const r=R.apply(this,arguments);deskLayout();return r;};
  let w0=window.innerWidth;window.addEventListener('resize',()=>{const w=window.innerWidth;if((w0<DESK_W)!==(w<DESK_W)&&S.user&&!S.sheet)render();w0=w;});})();
