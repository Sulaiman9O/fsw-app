/* 2.41.1: numbers and labels on the right of a row (amounts, prices, counts) must never be cut off or stick out of their card,
   on every screen, phone and tablet width, Arabic and English, even when the text beside them is very long.
   Before: the Expenses list cut "350.000" to "350.0" / pushed it past the card edge when the note was long. */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const p=await (await b.newContext({viewport:vp})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));return {b,p,errs};}
const LONG='Sulaiman Almalki • October 2026 rent (workshop + workers room, water included). Paid 31-Oct-2026. • October 2026 rent (workshop + workers room, water included). Paid to Sulaiman Almalki 31-Oct-2026 (confirmed by Sulaiman).';
const LONGAR='نماء • كهرباء الشقة - حساب 01732067 (flat electrical) - دفعة جزئية 40.000 عبر تطبيق بنك صحار بتاريخ 2026-10-20. الباقي 71.526 رصيد متأخر لأكثر من شهر - لم يُدفع بعد • Not paid yet: 71.530';
const seed=p=>p.evaluate(([L,LA])=>{const d=864e5;
 DB.expenses.push({id:'xl1',cat:'Rent',amt:350,t:now()-d,note:L},{id:'xl2',cat:'Electricity',amt:111.526,t:now()-2*d,note:LA},{id:'xl3',cat:'Salaries',amt:12345.678,t:now()-3*d,note:L+' '+L});
 const c=DB.customers[0];c.name='Mohammed bin Abdullah bin Saif Al Yazeedi Trading and Contracting LLC';
 if(DB.parts[0])DB.parts[0].name='MANN Oil Filter HU 711/6z (Mercedes) extra long name for testing the row width on small phones';
 if(DB.vendors&&DB.vendors[0])DB.vendors[0].name='Al Sharqiyah Discount Centre for Auto Spare Parts and Accessories Ibra Branch';
 (DB.services||[]).slice(0,2).forEach(s=>s.name=s.name+' — full synthetic oil change with filter and 21-point inspection');
 save();},[LONG,LONGAR]);
const scan=p=>p.evaluate(()=>{const out=[];const W=innerWidth;
 const box=e=>e.closest('.row,.jb-r,.card,.kpi,.mitem,.crow2,.prow,.oc,.car,.it,button,li')||document.body;
 document.querySelectorAll('#root *, .sheet *').forEach(e=>{if(!e.offsetParent&&getComputedStyle(e).position!=='fixed')return;const cs=getComputedStyle(e);if(e.closest('.hscroll,.chips,.atabs,.cpath,.ygrid,.ktable,table,input,textarea,select,.jph,svg,canvas'))return;
  if(!e.childNodes.length||![...e.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim()))return;const rc=e.getBoundingClientRect();if(!rc.width)return;
  const nm=(e.className&&typeof e.className==='string'?e.className:e.tagName)+' «'+e.textContent.trim().slice(0,24)+'»';
  /* cut inside itself (no … on purpose) */
  if(cs.textOverflow!=='ellipsis'&&cs.overflowX!=='auto'&&cs.overflowX!=='scroll'&&e.scrollWidth>e.clientWidth+2&&cs.display!=='inline'&&!/-webkit-box/.test(cs.display))out.push('cut '+nm+' '+e.scrollWidth+'>'+e.clientWidth);
  /* sticks out of its card / the screen */
  let el=e.parentElement,ell=false;while(el&&el!==document.body){if(getComputedStyle(el).textOverflow==='ellipsis'){ell=true;break;}el=el.parentElement;}
  const bx=box(e.parentElement||e);if(bx!==document.body&&!ell){const br=bx.getBoundingClientRect();if(rc.right>br.right+2||rc.left<br.left-2)out.push('out '+nm+' '+Math.round(rc.left)+'-'+Math.round(rc.right)+' card '+Math.round(br.left)+'-'+Math.round(br.right));}
  if(rc.right>W+2||rc.left<-2)out.push('screen '+nm);});
 return [...new Set(out)];});
(async()=>{let total=0;const seen={};
 for(const vp of [{width:360,height:780},{width:400,height:868},{width:1100,height:1400}]){const {b,p,errs}=await start(vp);await seed(p);
  const routes=await p.evaluate(()=>Object.keys(SCREENS));
  const prm=await p.evaluate(()=>({job:{id:(DB.jobs.find(j=>!j.inv)||DB.jobs[0]).id},inv:{id:(DB.jobs.find(j=>j.inv)||DB.jobs[0]).id},custd:{id:DB.customers[0].id},part:{id:(DB.parts[0]||{}).id},po:{id:(DB.pos[0]||{}).id},veh:{id:(DB.vehicles[0]||{}).id}}));
  for(const lang of ['en','ar']){await p.evaluate(l=>{DB.ws.lang=l;save();lookApply();},lang);
   for(const r of routes){await p.evaluate(([r,x])=>{try{closeSheet();}catch(e){}try{go(r,x);}catch(e){}},[r,prm[r]||{}]);await p.waitForTimeout(160);
    const bad=await scan(p);bad.forEach(x=>{const k=r+' | '+x.replace(/\d+(-\d+)?/g,'#');if(!seen[k]){seen[k]=1;total++;if(total<=60)console.log(vp.width,lang,r,'|',x);}});}}
  /* the expense edit sheet with the long note */
  await p.evaluate(()=>go('exp'));await p.waitForTimeout(300);await p.click('[data-ee="xl1"]');await p.waitForTimeout(300);(await scan(p)).forEach(x=>{total++;console.log(vp.width,'exp sheet |',x);});
  if(errs.length){console.log('page errors',errs.slice(0,5));process.exitCode=1;}await b.close();}
 ok(total===0,'nothing cut off or sticking out of its card on any screen ('+total+' places)');})();
