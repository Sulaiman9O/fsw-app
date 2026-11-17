/* 2.41.1: Expenses list — amount always whole, a note written twice shows once, "Not paid yet: X" shows in red under the amount,
   the saved note is not changed, and add / edit / cancel / delete still work. */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const p=await (await b.newContext({viewport:vp||{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));return {b,p,errs};}
const RENT='Sulaiman Almalki • October 2026 rent (workshop + workers room, water included). Paid 31-Oct-2026. • October 2026 rent (workshop + workers room, water included). Paid to Sulaiman Almalki 31-Oct-2026 (confirmed by Sulaiman).';
const ELEC='نماء • كهرباء الشقة - حساب 01732067 (flat electrical) - دفعة جزئية 40.000 عبر تطبيق بنك صحار بتاريخ 2026-10-20. الباقي 71.526 رصيد متأخر لأكثر من شهر - لم يُدفع بعد • Not paid yet: 71.530';
(async()=>{
 /* the note helper on its own */
 {const {b,p}=await start();const r=await p.evaluate(([R,E])=>[expNote(R),expNote(E),expNote(''),expNote('Coffee for the workshop'),expNote('A · A'),expNote('Not paid yet: 0'),expNote('Shop • Not paid yet: 1,250.500')],[RENT,ELEC]);
  ok(r[0].text==='Sulaiman Almalki · October 2026 rent (workshop + workers room, water included). Paid to Sulaiman Almalki 31-Oct-2026 (confirmed by Sulaiman).','rent: the repeated sentence shows once, the longer one kept → '+r[0].text);
  ok(r[0].due===null,'rent: nothing unpaid');
  ok(Math.abs(r[1].due-71.53)<1e-9&&!/Not paid/.test(r[1].text)&&/كهرباء الشقة/.test(r[1].text),'electricity: unpaid 71.530 pulled out, Arabic text kept');
  ok(r[2].text===''&&r[2].due===null,'empty note → nothing');ok(r[3].text==='Coffee for the workshop','plain note unchanged');ok(r[4].text==='A','"A · A" → "A"');
  ok(r[5].due===null,'"Not paid yet: 0" → no red tag');ok(Math.abs(r[6].due-1250.5)<1e-9&&r[6].text==='Shop','thousands comma read right');await b.close();}
 for(const [vp,lang] of [[{width:360,height:780},'en'],[{width:400,height:868},'ar'],[{width:1100,height:1400},'en'],[{width:1100,height:1400},'ar']]){const {b,p,errs}=await start(vp);
  await p.evaluate(([R,E,l])=>{DB.ws.lang=l;DB.expenses.push({id:'r1',cat:'Rent',amt:350,t:now()-864e5,note:R,monthly:true},{id:'e1',cat:'Electricity',amt:111.526,t:now()-2*864e5,note:E},{id:'b1',cat:'Other',amt:98765.432,t:now()-3*864e5,note:R+' '+R+' '+R});save();lookApply();go('exp');},[RENT,ELEC,lang]);await p.waitForTimeout(500);
  const tag=vp.width+' '+lang+': ';
  const rows=await p.evaluate(()=>['r1','e1','b1'].map(id=>{const r=document.querySelector(`[data-ee="${id}"]`),v=r.querySelector('.v'),rb=r.getBoundingClientRect(),vb=v.getBoundingClientRect(),n=r.querySelector('.xn');
   return {v:v.firstChild.nodeValue,vw:v.scrollWidth-v.clientWidth,inside:vb.right<=rb.right+0.5&&vb.left>=rb.left,red:(v.querySelector('small.bad')||{}).textContent||'',note:n?n.textContent:'',lines:n?Math.round(n.getBoundingClientRect().height/parseFloat(getComputedStyle(n).lineHeight)):0,h:Math.round(rb.height)};}));
  ok(rows[0].v==='350.000'&&rows[1].v==='111.526'&&rows[2].v==='98765.432',tag+'amounts written in full ('+rows.map(r=>r.v).join(', ')+')');
  ok(rows.every(r=>r.vw<=0&&r.inside),tag+'no amount cut or outside its card');
  ok((rows[0].note.match(/October 2026 rent/g)||[]).length===1,tag+'rent sentence once');
  ok(/71\.530/.test(rows[1].red)&&!/Not paid yet/.test(rows[1].note),tag+'unpaid 71.530 in red under the amount ('+rows[1].red+')');
  ok(rows.every(r=>r.lines<=3),tag+'notes at most 3 lines (lines '+rows.map(r=>r.lines).join(',')+')');
  if(lang==='ar'){const t=await p.evaluate(()=>document.querySelector('[data-ee="e1"] .v small').textContent+'|'+document.querySelector('[data-ee="r1"] span').textContent);ok(/غير مدفوع/.test(t)&&/شهري/.test(t),tag+'Arabic words: '+t);}
  /* open → full note in the box, Cancel/back keeps it, Save without change keeps the note exactly */
  await p.click('[data-ee="r1"]');await p.waitForTimeout(300);ok(await p.inputValue('#en')===RENT,tag+'edit shows the whole saved note');
  await p.evaluate(()=>closeSheet());await p.waitForTimeout(200);
  await p.click('[data-ee="r1"]');await p.waitForTimeout(300);await p.click('#eok');await p.waitForTimeout(300);
  ok(await p.evaluate(R=>{const e=DB.expenses.find(x=>x.id==='r1');return e.note===R&&e.amt===350&&e.monthly===true;},RENT),tag+'Save without changes keeps note, amount, monthly');
  /* change the amount */
  await p.click('[data-ee="e1"]');await p.waitForTimeout(300);await p.fill('#ea','120.5');await p.click('#eok');await p.waitForTimeout(300);
  ok(await p.evaluate(E=>{const e=DB.expenses.find(x=>x.id==='e1');return e.amt===120.5&&e.note===E;},ELEC),tag+'edit amount saves, note kept');
  ok((await p.textContent('[data-ee="e1"] .v')).startsWith('120.500'),tag+'list shows the new amount');
  /* empty amount refused */
  await p.click('[data-ee="e1"]');await p.waitForTimeout(300);await p.fill('#ea','');await p.click('#eok');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>DB.expenses.find(x=>x.id==='e1').amt===120.5&&!!document.querySelector('#ea')),tag+'empty amount refused, sheet stays open');await p.evaluate(()=>closeSheet());await p.waitForTimeout(200);
  /* new expense with a short note */
  const n0=await p.evaluate(()=>DB.expenses.length);await p.click('#eadd');await p.waitForTimeout(300);await p.fill('#ea','5');await p.fill('#en','Water');await p.click('#eok');await p.waitForTimeout(300);
  ok(await p.evaluate(n=>DB.expenses.length===n+1&&DB.expenses.some(e=>e.note==='Water'&&e.amt===5),n0),tag+'new expense added');
  /* delete */
  await p.click('[data-ee="b1"]');await p.waitForTimeout(300);const d=await p.$('#edel');if(d){await d.click();await p.waitForTimeout(300);ok(await p.evaluate(()=>DB.expenses.some(e=>e.id==='b1')),tag+'delete asks first');await p.click('#cfy');await p.waitForTimeout(300);}
  ok(await p.evaluate(()=>!DB.expenses.some(e=>e.id==='b1')&&!document.querySelector('[data-ee="b1"]')),tag+'delete removes it from the list');
  ok(errs.length===0,tag+'no page errors '+JSON.stringify(errs.slice(0,3)));
  if(vp.width===400||vp.width===1100&&lang==='en'){await p.evaluate(()=>{closeSheet();render();});await p.waitForTimeout(300);await p.screenshot({path:'/tmp/t133_'+vp.width+lang+'.png'});}
  await b.close();}})();
