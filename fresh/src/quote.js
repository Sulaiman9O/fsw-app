/* ---------- QUICK PRICE: the customer asks "how much with this oil? and that one?" — every brand's full price
   (oil for this car's litres + filter + labour) in one list, before any job card exists ---------- */
const QK={oil:{t:'Engine oil change',ic:'🛢'},gear:{t:'Gearbox oil',ic:'⚙️'}};
function quoteCar(Q){if(Q.vid){const v=byId('vehicles',Q.vid);if(v)return v;}return Q.car?Object.assign({id:'_q'},Q.car):null;}
function quoteRows(v,kind,fid){const R=RX[kind];if(!R)return {rows:[],qty:0};const rec=kind==='oil'?oilRecipe(v,'usual'):null;const sp=kind==='oil'?specOf(v):null;
  const qty=kind==='oil'?(rec&&rec.qty)||(sp&&sp.cap)||guessLitres('oil',v):(learned(kind,v)||guessLitres(kind,v));
  const fopts=kind==='oil'?filterOpts(v,rec):[];const pick=fid&&fid!=='none'&&(fopts.find(o=>o.p.id===fid)||(byId('parts',fid)?{p:byId('parts',fid),n:0}:null));const filter=kind==='oil'&&fid!=='none'?((pick&&pick.p)||(rec&&rec.filter)||makerFilter(v)||fitsFilter(v)):null;if(filter&&!fopts.some(o=>o.p.id===filter.id))fopts.unshift({p:filter,n:0});const svc=DB.services.find(s=>rxOf(s)===kind);const lab=svc?svcPrice(svc,v):0;const fP=filter?(+filter.price||0):0;
  const last={};if(v.id!=='_q')DB.jobs.filter(j=>j.veh===v.id).sort((a,b)=>a.t-b.t).forEach(j=>(j.items||[]).forEach(i=>{const p=partOfItem(i);if(p&&R.cat.includes(p.cat))last.id=p.id;}));
  const rows=DB.parts.filter(p=>R.cat.includes(p.cat)&&(+p.price||0)>0).map(p=>{const g=gradeOf(p),next=g&&GRADE[g]?GRADE[g][1]:0;const oil=r3(qty*(+p.price||0));const total=r3(oil+fP+lab);
    const cost=r3(qty*(+p.cost||0)+(filter?(+filter.cost||0):0));return {p,visc:viscTxt(p.name),g,next,oil,total,profit:r3(total-cost),per:next?total/next*1000:0,out:(+p.stock||0)<qty-0.0001,usual:!!(rec&&rec.oil&&rec.oil.id===p.id),last:last.id===p.id};});
  rows.sort((a,b)=>a.total-b.total);const per=rows.filter(r=>r.per).map(r=>r.per);const best=per.length>1?Math.min(...per):0;rows.forEach(r=>r.best=best&&Math.abs(r.per-best)<1e-9);
  const okV=kind==='oil'?[...new Set([rec&&rec.visc,...(sp?sp.visc:[])].filter(Boolean))]:[];
  /* what the app only guessed: litres with no visit and no maker value; a filter only because it "fits" (no visit, not the maker's) */
  const qGuess=kind==='oil'&&!(rec&&rec.qty&&!(rec.qsrc&&rec.qsrc.guess))&&!(sp&&sp.cap);const fGuess=kind==='oil'&&!!filter&&!pick&&!(rec&&rec.filter&&rec.filter.id===filter.id)&&!(makerFilter(v)&&makerFilter(v).id===filter.id);
  return {rows,qty:Math.round(qty*10)/10,filter,fopts,svc,lab,fP,rec,sp,okV,qGuess,fGuess};}
/* brands as tiles with their picture. Pictures are kept on the phone (SQLite, one small record per brand) and shared to the other devices by sync, so nothing loads from the internet when the app opens */
const BRAND2=['mercedes benz','ac delco','acdelco','can royal','toyota genuine','mobil 1'];
function brandOf(p){if(p.brand)return p.brand;const n=String(p.name||'').trim();const l=n.toLowerCase();const two=BRAND2.find(b=>l.startsWith(b));let b=two?n.slice(0,two.length):n.split(/\s+/)[0]||'';if(/^toyota genuine$/i.test(b))b='Toyota';if(/^acdelco$/i.test(b))b='AC Delco';return b;}
const brandKey=b=>String(b||'').toLowerCase().replace(/[^a-z0-9؀-ۿ]/g,'');
const brandImg=b=>{const k=brandKey(b);const r=(DB.brandImg||[]).find(x=>x.id===k);return r&&r.img||'';};
/* logos: shrink, take away a plain or "fake transparent" (grey checkerboard) background that touches the edges, and trim the empty border so the logo fills its tile */
function cleanLogoCanvas(c){const x=c.getContext('2d');const W=c.width,H=c.height;let d;try{d=x.getImageData(0,0,W,H);}catch(e){return c;}const p=d.data;
  const edge=[];for(let i=0;i<W;i++){edge.push(i,(H-1)*W+i);}for(let j=0;j<H;j++){edge.push(j*W,j*W+W-1);}
  const bg=o=>{if(p[o+3]<20)return true;const r=p[o],g=p[o+1],b=p[o+2];const mx=Math.max(r,g,b),mn=Math.min(r,g,b);return mn>=212&&mx-mn<=22;};
  const nb=edge.filter(k=>bg(k*4)).length;let ew2=0,eg2=0;edge.forEach(k=>{const o=k*4;if(p[o+3]<20||!bg(o))return;if(Math.min(p[o],p[o+1],p[o+2])>=246)ew2++;else eg2++;});const chk=ew2>nb*0.15&&eg2>nb*0.15;
  if(nb>edge.length*0.5){const seen=new Uint8Array(W*H);const st=[];
    edge.forEach(k=>{if(!seen[k]&&bg(k*4)){seen[k]=1;st.push(k);}});
    while(st.length){const k=st.pop();p[k*4+3]=0;const i=k%W,j=(k/W)|0;[[i-1,j],[i+1,j],[i,j-1],[i,j+1]].forEach(([a,b])=>{if(a<0||b<0||a>=W||b>=H)return;const n=b*W+a;if(seen[n])return;if(bg(n*4)){seen[n]=1;st.push(n);}});}
    /* a checkerboard ("fake transparent") also fills closed areas, like inside the Toyota oval: clear big light areas made of both checker tones */
    const ew=edge.filter(k=>p[k*4+3]>=20?false:true).length;const tone=o=>Math.min(p[o],p[o+1],p[o+2])>=246?1:2;
    let w1=0,g1=0;edge.forEach(k=>{const o=k*4;if(!bg(o))return;});for(let k=0;k<W*H;k++){if(seen[k]){/* edge region tones were overwritten */}}
    const vis=new Uint8Array(W*H);for(let s0=0;s0<W*H;s0++){if(seen[s0]||vis[s0]||!bg(s0*4)||p[s0*4+3]<20)continue;const reg=[s0];vis[s0]=1;let w=0,g=0;
      for(let t=0;t<reg.length;t++){const k=reg[t];if(tone(k*4)===1)w++;else g++;const i=k%W,j=(k/W)|0;[[i-1,j],[i+1,j],[i,j-1],[i,j+1]].forEach(([a,b])=>{if(a<0||b<0||a>=W||b>=H)return;const n=b*W+a;if(vis[n]||seen[n]||p[n*4+3]<20||!bg(n*4))return;vis[n]=1;reg.push(n);});}
      if(reg.length>W*H*0.004&&g>reg.length*0.2&&w>reg.length*0.15)reg.forEach(k=>{p[k*4+3]=0;});}
    x.putImageData(d,0,0);}
  let x0=W,y0=H,x1=-1,y1=-1;for(let j=0;j<H;j++)for(let i=0;i<W;i++){if(p[(j*W+i)*4+3]>24){if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j;}}
  if(x1<0)return c;const pad=Math.round(Math.max(x1-x0,y1-y0)*0.04);x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(W-1,x1+pad);y1=Math.min(H-1,y1+pad);
  const o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1-y0+1;o.getContext('2d').drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height);return o;}
function logoFromImage(im,cb){const k=Math.min(1,480/Math.max(im.width,im.height));let c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  c=cleanLogoCanvas(c);const k2=Math.min(1,320/Math.max(c.width,c.height));if(k2<1){const o=document.createElement('canvas');o.width=Math.round(c.width*k2);o.height=Math.round(c.height*k2);o.getContext('2d').drawImage(c,0,0,o.width,o.height);c=o;}
  let u=c.toDataURL('image/webp',.88);if(!u.startsWith('data:image/webp'))u=c.toDataURL('image/png');cb(u);}
function shrinkLogo(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>logoFromImage(im,cb);im.onerror=()=>toast('Could not read this picture');im.src=r.result;};r.readAsDataURL(file);}
/* pictures added before 2.15.4 get cleaned once */
function cleanOldLogos(){(DB.brandImg||[]).filter(r=>r.img&&!r.cl).forEach(r=>{const im=new Image();im.onload=()=>logoFromImage(im,u=>{r.img=u;r.cl=1;save();try{if(S.r==='quote')render();}catch(e){}});im.src=r.img;});}
function brandPicSheet(b){if(!can.settings()){toast('Ask the owner to add pictures');return;}const has=!!brandImg(b);
  const pick=()=>{const f=document.createElement('input');f.type='file';f.accept='image/*';f.onchange=()=>{const x=f.files&&f.files[0];if(!x)return;shrinkLogo(x,u=>{DB.brandImg=DB.brandImg||[];const k=brandKey(b);const r=DB.brandImg.find(y=>y.id===k);if(r){r.img=u;r.t=now();r.cl=1;}else DB.brandImg.push({id:k,name:b,img:u,t:now(),cl:1});audit('settings','Picture for '+b);save();render();toast(T_('Picture saved'));});};f.click();};
  if(!has){pick();return;}
  actionSheet(esc(b),'',[{ic:'🖼',t:'Change picture',fn:pick},{ic:'🗑',t:'Remove picture',danger:1,fn:()=>{DB.brandImg=(DB.brandImg||[]).filter(y=>y.id!==brandKey(b));save();render();}}]);}
/* car makes as tiles (their picture is shared with the oil brand of the same name, e.g. Toyota) */
function makeTile(o,cam){const n=o.m[0],img=brandImg(n);const ini=n.split(/[\s-]+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return `<button class="mtile" data-mk="${esc(n)}"><div class="mimg">${img?`<img src="${img}" alt="">`:`<span class="qini">${esc(ini)}</span>`}${cam&&can.settings()?`<i class="qcam" data-qimg="${esc(n)}" title="Picture">📷</i>`:''}</div><b>${esc(n)}</b>${o.u?`<small>${o.u}</small>`:o.m[1]?`<small><bdi>${esc(o.m[1])}</bdi></small>`:''}</button>`;}
function qTile(r){const b=brandOf(r.p),img=brandImg(b),Q=S.quote||{};const ini=b.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return `<button class="qtile${r.out?' out':''}" data-qp="${r.p.id}"><div class="qtx"><b>${esc(b)}</b><span dir="ltr" data-notr>${[r.visc,r.g&&GRADE[r.g]?GRADE[r.g][0]:''].filter(Boolean).join(' · ')}</span>
   <em>${f3(r.total)}</em>${r.next?`<small dir="ltr" data-notr>${kmf(r.next)} km · ${f3(r.per)}/1000</small>`:''}
   <div class="qtags">${r.usual?`<i class="tg tok">${T_('usual')}</i>`:''}${r.last?`<i class="tg">${T_('last time')}</i>`:''}${r.best?`<i class="tg tok">${T_('best per km')}</i>`:''}${r.out?`<i class="tg tgr">${T_('not enough in stock')}</i>`:''}</div>
   ${!Q.cv&&showCost()?`<small class="qpr">${T_('profit')} ${f3(r.profit)}</small>`:''}</div></button>`;}
/* Back from a car's prices: picked by make → that make's models again; picked by plate/name → the search */
function quoteBack(){const Q=S.quote;if(!Q)return;const mk=Q.car&&Q.car.make;Q.vid=null;Q.car=null;Q.vf='auto';Q.fid=null;render();
  if(mk)carPicker({make:mk},r=>{Q.car=r;Q.vid=null;Q.vf='auto';Q.fid=null;render();});}
SCREENS.quote=m=>{const Q=S.quote||(S.quote={vid:null,car:null,kind:'oil',vf:'auto',cv:false,q:''});const v=quoteCar(Q);
  let h=head('Quick price',v?`${eyeBtn()}<button class="lnk" id="qcv">${Q.cv?T_('Workshop view'):'👁 '+T_('Customer view')}</button>`:'');
  if(!v){h+=`<p class="hint">${T_('Type the plate or the customer, or choose the make and model.')}</p><input class="field" id="qq" placeholder="${T_('Plate, phone or name…')}" value="${esc(Q.q)}" autocomplete="off" autocorrect="off" spellcheck="false"><div id="qres"></div><button class="btn ghost" id="qpick">🚗 ${T_('Choose make, model, year')}</button>`;
    m.innerHTML=h;const inp=$('#qq');const draw=()=>{const q=lc(inp.value).trim();Q.q=inp.value;const box=$('#qres');if(q.length<2){box.innerHTML='';return;}
      const cs=DB.customers.filter(c=>lc(c.name).includes(q)||(c.phone||'').includes(q)).map(c=>c.id);
      const vs=DB.vehicles.filter(x=>lc(x.plate).replace(/\s/g,'').includes(q.replace(/\s/g,''))||lc(carName(x)).includes(q)||cs.includes(x.cust)).slice(0,8);
      box.innerHTML=vs.length?`<div class="list">${vs.map(x=>`<button class="row" data-qv="${x.id}"><div><b>${esc(carName(x))} ${x.plate?`<span class="pl">${esc(x.plate)}</span>`:''}</b><span>${esc((byId('customers',x.cust)||{}).name||'')}${effEng(x)?' · '+esc(effEng(x)):''}</span></div><span class="v">›</span></button>`).join('')}</div>`:'';
      box.querySelectorAll('[data-qv]').forEach(b=>b.onclick=()=>{Q.vid=b.dataset.qv;Q.car=null;Q.vf='auto';Q.fid=null;render();});};
    inp.oninput=draw;draw();setTimeout(()=>inp.focus(),60);
    const setCar=r=>{Q.car=r;Q.vid=null;Q.vf='auto';Q.fid=null;render();};$('#qpick').onclick=()=>carPicker({},setCar);
    return;}
  const D=quoteRows(v,Q.kind,Q.fid);const cust=v.id!=='_q'&&byId('customers',v.cust);
  let rows=D.rows;const visc=[...new Set(rows.map(r=>r.visc).filter(Boolean))].sort();
  /* the car's own viscosities, but 0W-xx is never mixed with 5W-xx (0W-20 is a different oil) */
  const z=x=>/^0W/.test(x);const okG=[D.okV.filter(z),D.okV.filter(x=>!z(x))].filter(g=>g.length&&rows.some(r=>g.includes(r.visc)));
  const gk=g=>'ok:'+g.join('/');const pref=(D.rec&&D.rec.visc)||D.okV[0];
  const vf=Q.vf==='auto'?(okG.length?gk(okG.find(g=>g.includes(pref))||okG[0]):'all'):Q.vf;
  if(vf.startsWith('ok:')){const g=vf.slice(3).split('/');rows=rows.filter(r=>g.includes(r.visc));}else if(vf!=='all')rows=rows.filter(r=>r.visc===vf);
  const ex=[D.qty+' L',D.filter?'🔩 '+(D.filter.num||D.filter.name):'',D.svc?T_('labour')+' '+f3(D.lab):''].filter(Boolean).join(' · ');
  h+=`<div class="card qcar"><div class="h"><b>${esc(carName(v)||'')}${v.plate?` <span class="pl">${esc(v.plate)}</span>`:''}</b><button class="lnk" id="qchg">${T_('Change')}</button></div><span class="sub">${cust?esc(cust.name)+' · ':''}${esc(effEng(v)||T_('engine not known'))}</span></div>
   <div class="chips" id="qkind">${Object.entries(QK).map(([k,o])=>`<button data-k="${k}" aria-pressed="${Q.kind===k}">${o.ic} ${T_(o.t)}</button>`).join('')}</div>
   ${Q.kind==='oil'?`<div class="chips qvf" data-notr>${okG.map(g=>`<button data-vf="${esc(gk(g))}" aria-pressed="${vf===gk(g)}">✓ ${esc(g.join(' / '))}</button>`).join('')}${visc.filter(x=>!okG.some(g=>g.includes(x))).map(x=>`<button data-vf="${esc(x)}" aria-pressed="${vf===x}">${esc(x)}</button>`).join('')}<button data-vf="all" aria-pressed="${vf==='all'}">${T_('All')}</button></div>`:''}
   <p class="hint qex" dir="ltr" data-notr>${esc(ex)}</p>
   ${D.qGuess||D.fGuess?`<div class="guess">⚠️ ${[D.qGuess?T_('Litres are a guess'):'',D.fGuess?T_('Filter is a guess'):''].filter(Boolean).join(' · ')} · ${T_('check before you tell the customer')}</div>`:''}
   ${Q.kind==='oil'&&!Q.cv?`<div class="lbl">${T_('Filter')}</div><div class="chips qfo" data-notr>${D.fopts.slice(0,6).map(o=>`<button data-fo="${o.p.id}" aria-pressed="${D.filter&&D.filter.id===o.p.id}">${esc(o.p.num||o.p.name)} · ${f3(o.p.price)}${o.n?` <small>×${o.n}</small>`:''}${(+o.p.stock||0)<=0?' ⚠':''}</button>`).join('')}${D.filter&&!D.fopts.slice(0,6).some(o=>o.p.id===D.filter.id)?`<button data-fo="${D.filter.id}" aria-pressed="true">${esc(D.filter.num||D.filter.name)} · ${f3(D.filter.price)}</button>`:''}${Q.fid==='none'?`<button aria-pressed="true">${T_('No filter')}</button>`:''}<button class="qfx" data-fx="1">🔍 ${T_('Other filter')}</button></div>`:''}
   ${rows.length?`<div class="qtiles${Q.cv?' cv':''}">${rows.map(qTile).join('')}</div>`:empty('🛢','No oils in the parts list for this.')}
   ${rows.length&&cust&&cust.phone?`<button class="btn wa" id="qwa">📤 ${T_('Send these prices on WhatsApp')}</button>`:''}`;
  m.innerHTML=h;
  $('#qchg').onclick=()=>{Q.vid=null;Q.car=null;Q.q='';Q.fid=null;render();};const cv=$('#qcv');if(cv)cv.onclick=()=>{Q.cv=!Q.cv;render();};
  $$('#qkind [data-k]').forEach(b=>b.onclick=()=>{Q.kind=b.dataset.k;Q.vf='auto';render();});
  $$('[data-vf]').forEach(b=>b.onclick=()=>{Q.vf=b.dataset.vf;render();});$$('[data-fo]').forEach(b=>b.onclick=()=>{Q.fid=b.dataset.fo;render();});const fx=$('[data-fx]');if(fx)fx.onclick=()=>qFilterPick(v,D,id=>{Q.fid=id;render();});
  const wa=$('#qwa');if(wa)wa.onclick=()=>{const cur=DB.ws.currency==='OMR'?'ر.ع':DB.ws.currency;const items=rows.slice(0,6).map(r=>'• '+r.p.name+(r.next?' ('+kmf(r.next)+' كم)':'')+': '+f3(r.total)+' '+cur).join('\n');
    shareText(cust.phone,msg('options',{name:cust.name||'',car:carName(v),plate:v.plate||'',service:Q.kind==='oil'?'تغيير زيت المحرك':'تغيير زيت ناقل الحركة',items}));};
  $$('[data-qimg]').forEach(x=>{['pointerdown','touchstart'].forEach(ev=>x.addEventListener(ev,e=>e.stopPropagation()));x.onclick=e=>{e.stopPropagation();e.preventDefault();brandPicSheet(x.dataset.qimg);};});
  $$('[data-qp]').forEach(b=>b.onclick=()=>{const r=D.rows.find(x=>x.p.id===b.dataset.qp);openSheet(`<h3>${esc(r.p.name)}</h3><div class="card"><div class="jb-r"><div>${esc(r.p.name)}<small><bdi dir="ltr">${D.qty} L × ${f3(r.p.price)}</bdi>${D.qGuess?` <i class="tg tgw">⚠️ ${T_('guess')}</i>`:''}</small></div><b>${f3(r.oil)}</b></div>${Q.kind==='oil'?`<button class="jb-r qfrow" id="qfch"><div>${D.filter?esc(D.filter.name):`<i class="hint">${T_('No filter')}</i>`}${D.fGuess?` <i class="tg tgw">⚠️ ${T_('guess')}</i>`:''}<small class="qchg">🔄 ${T_('Change the filter')}</small></div><b>${D.filter?f3(D.fP):''}</b></button>`:''}${D.svc?`<div class="jb-r"><div>${esc(D.svc.name)}</div><b>${f3(D.lab)}</b></div>`:''}<div class="jb-r tot"><div>${T_('Total')}</div><b>${f3(r.total)}</b></div></div>
     <button class="btn" id="qok">✅ ${T_('Customer agreed · open job card')}</button><button class="btn ghost" id="qest">🧾 ${T_('Make an estimate')}</button>`,el=>{
     const make=est=>{closeSheet();const items=[];if(D.svc){const it=svcItem(D.svc,v);it.grp='rxsvc';items.push(it);}if(D.filter)items.push({k:'part',ref:D.filter.id,d:D.filter.name,num:D.filter.num,q:1,u:'',p:+D.filter.price,cost:+D.filter.cost||0,grp:'rxoil',by:S.user.name});
       items.push({k:'part',ref:r.p.id,d:r.p.name,num:r.p.num,q:D.qty,u:'L',p:+r.p.price,cost:+r.p.cost||0,grp:Q.kind==='oil'?'rxoil':'',by:S.user.name});
       if(v.id!=='_q'){const j={id:uid('j'),no:DB.ws.nextJob++,dev:(typeof syncDev==='function'?syncDev():''),cust:v.cust,veh:v.id,km:v.km||0,stage:est?'estimate':'new',items,disc:0,t:now(),by:S.user.name,log:[[now(),(est?'Estimate':'Job')+' opened from quick price · '+S.user.name]],pays:[]};if(Q.kind==='oil')j.rx={oil:{mode:'usual',at:now()}};
         DB.jobs.push(j);save();S.quote=null;go('job',{id:j.id});toast((est?'Estimate':'Job')+' #'+j.no+' opened');}
       else{S.pendQuote={items,kind:Q.kind};S.quote=null;go('newjob',{n:{phone:'',name:'',plate:'',make:v.make||'',model:v.model||'',year:v.year||'',km:'',vin:'',engine:v.engine||'',est:!!est,custId:null,vehId:null}});toast(T_('Add the customer and the plate; the prices are kept.'));}};
     const fc=el.querySelector('#qfch');if(fc)fc.onclick=()=>{const pid=r.p.id;closeSheet();setTimeout(()=>qFilterPick(v,D,id=>{Q.fid=id;render();setTimeout(()=>{const t=document.querySelector('[data-qp="'+pid+'"]');if(t)t.click();},40);}),60);};
     el.querySelector('#qok').onclick=()=>make(false);el.querySelector('#qest').onclick=()=>make(true);});});};
/* change the filter: the ones that fit this car first, then search every oil filter in the parts list, or no filter */
function qFilterPick(v,D,cb){const cur=D.filter&&D.filter.id;const all=DB.parts.filter(p=>p.cat==='Oil filters');
  const row=(p,n)=>`<button class="row${p.id===cur?' sel':''}" data-qf="${p.id}"><div><b dir="ltr" data-notr>${esc(p.num||p.name)}</b><span>${esc(p.num?p.name:'')}${n?' · ×'+n:''} · ${T_('stock')} ${+p.stock||0}</span></div><span class="v">${f3(p.price)}</span></button>`;
  openSheet(`<h3>🔩 ${T_('Change the filter')}</h3>${D.fopts.length?`<div class="lbl">${T_('Fits this car')}</div><div class="list">${D.fopts.map(o=>row(o.p,o.n)).join('')}</div>`:''}
    <div class="lbl">${T_('All oil filters')}</div><input class="field" id="qfq" placeholder="${T_('Number or name…')}" autocomplete="off" autocorrect="off" spellcheck="false"><div class="list" id="qfl"></div>
    <button class="btn ghost" id="qfn">🚫 ${T_('Without a filter')}</button>`,el=>{
    const bind=()=>el.querySelectorAll('[data-qf]').forEach(b=>b.onclick=()=>{closeSheet();cb(b.dataset.qf);});
    const q=el.querySelector('#qfq'),l=el.querySelector('#qfl');const draw=()=>{const t=lc(q.value).replace(/[\s-]/g,'');const L=all.filter(p=>!t||lc((p.num||'')+' '+p.name).replace(/[\s-]/g,'').includes(t)).sort((a,b)=>((+b.stock||0)>0)-((+a.stock||0)>0)).slice(0,t?30:12);l.innerHTML=L.map(p=>row(p,0)).join('')||`<p class="hint">${T_('Nothing found')}</p>`;bind();};
    q.oninput=draw;draw();el.querySelector('#qfn').onclick=()=>{closeSheet();cb('none');};});}
