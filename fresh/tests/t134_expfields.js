/* 2.42.0 expenses: receipt date, receipt photo, shop/supplier, how it was paid (or not paid yet → pay later, all or part).
   Every path: new, edit, back without saving, wrong input, delete, old expenses, daily close, suppliers page, Arabic, small phone. */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const p=await (await b.newContext({viewport:vp||{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>{document.querySelectorAll('#tour').forEach(x=>x.remove());DB.expenses=[];save();});return {b,p,errs};}
const W=t=>new Promise(r=>setTimeout(r,t));
(async()=>{const {b,p,errs}=await start();const ev=(f,a)=>p.evaluate(f,a);const st=async()=>!!(await p.$('#sheet'));const ask=async()=>!!(await p.$('.leaveask'));
 const today=await ev(()=>today());const yday=await ev(()=>dayKey(now()-864e5));const tmrw=await ev(()=>dayKey(now()+864e5));
 const nv0=await ev(()=>DB.vendors.length);const ph0=await ev(()=>(DB.photos||[]).length);
 await ev(()=>go('exp'));await W(300);
 /* 1 new, paid from the drawer, new shop, today */
 await p.click('#eadd');await W(300);
 ok(await p.inputValue('#ed')===today,'date starts at today');ok(await p.$eval('[data-em="Cash"]',e=>e.getAttribute('aria-pressed'))==='true','"Cash drawer" chosen by default');
 ok(await p.$eval('#ec',e=>e.value)==='Workshop supplies','type starts at Workshop supplies');
 await p.fill('#ea','7.670');await p.fill('#ev','  Al Sharqiyah   Discount ');await p.fill('#en','zip ties, mop');await p.click('#eok');await W(300);
 let E=await ev(()=>DB.expenses.slice(-1)[0]);
 ok(!(await st())&&E.amt===7.67&&E.pays.length===1&&E.pays[0].m==='Cash'&&E.pays[0].amt===7.67&&E.cash===true,'saved paid from the drawer');
 ok(await ev(()=>DB.vendors.length)===nv0+1&&E.vname==='Al Sharqiyah Discount'&&!!E.vend,'new shop added to Suppliers (spaces tidied)');
 ok(await ev(()=>Math.abs(expCashOn(today())-7.67)<1e-9),'daily close counts 7.670 from the drawer');
 /* 2 same shop, different letters case → no second supplier; card; yesterday */
 await p.click('#eadd');await W(300);await p.fill('#ea','12');await p.fill('#ed',yday);await p.fill('#ev','al sharqiyah discount');await p.click('[data-em="Card"]');await p.click('#eok');await W(300);
 E=await ev(()=>DB.expenses.slice(-1)[0]);
 ok(await ev(()=>DB.vendors.length)===nv0+1&&await ev(i=>DB.expenses[0].vend===i,E.vend),'same shop typed in small letters → same supplier');
 ok(await ev(e=>dayKey(e.t),E)===yday&&await ev(e=>dayKey(e.pays[0].t),E)===yday&&E.cash===false,'yesterday\'s receipt: dated yesterday, paid by card, not from the drawer');
 ok(await ev(()=>Math.abs(expCashOn(today())-7.67)<1e-9),'card payment not in the daily close');
 /* 3 wrong input: no amount, zero, tomorrow, no date */
 await p.click('#eadd');await W(300);const n1=await ev(()=>DB.expenses.length);
 await p.click('#eok');await W(150);ok(await st()&&await ev(()=>DB.expenses.length)===n1,'no amount → refused');
 await p.fill('#ea','0');await p.click('#eok');await W(150);ok(await st()&&await ev(()=>DB.expenses.length)===n1,'0 → refused');
 await p.fill('#ea','abc');await p.click('#eok');await W(150);ok(await st()&&await ev(()=>DB.expenses.length)===n1,'letters → refused');
 await p.fill('#ea','3');await p.fill('#ed',tmrw);await p.click('#eok');await W(150);ok(await st()&&await ev(()=>DB.expenses.length)===n1,'tomorrow → refused');
 await p.fill('#ed','');await p.click('#eok');await W(150);ok(await st()&&await ev(()=>DB.expenses.length)===n1,'no date → refused');
 /* 4 back after typing → asks; don't save → nothing */
 await ev(()=>back());await W(200);ok(await ask(),'typed then back → asks to save');await p.click('[data-la=d]');await W(200);ok(!(await st())&&await ev(()=>DB.expenses.length)===n1,"don't save → nothing saved");
 /* 5 untouched new sheet → back closes without asking */
 await p.click('#eadd');await W(500);await ev(()=>back());await W(200);ok(!(await st()),'untouched → closes without asking');
 /* 6 changing only the chip counts as a change */
 await p.click('#eadd');await W(500);await p.click('[data-em="Own"]');await ev(()=>back());await W(200);ok(await ask(),'only "paid how" changed → asks');await p.click('[data-la=d]');await W(200);
 /* 7 photo then back → asks; don't save → no photo kept */
 await p.click('#eadd');await W(500);let fc=p.waitForEvent('filechooser');await p.click('#egal');(await fc).setFiles(['car1.jpg','car2.jpg']);await W(1500);
 ok((await p.$$('#ephs .xph1')).length===2,'two pictures shown');await ev(()=>back());await W(200);ok(await ask(),'pictures added then back → asks');await p.click('[data-la=d]');await W(200);
 ok(await ev(()=>(DB.photos||[]).length)===ph0,"don't save → no picture kept");
 /* 8 not paid yet + photo + saved → owed; photo record */
 await p.click('#eadd');await W(400);await p.fill('#ea','111.526');await p.fill('#ev','Nama electricity');await p.click('[data-em="Due"]');
 fc=p.waitForEvent('filechooser');await p.click('#egal');(await fc).setFiles(['car3.jpg']);await W(1200);await p.click('#eok');await W(300);
 E=await ev(()=>DB.expenses.slice(-1)[0]);const pid=E.ph&&E.ph[0];
 ok(E.pays.length===0&&await ev(e=>expOwed(DB.expenses.find(x=>x.id===e.id)),E)===111.526,'not paid yet → whole 111.526 owed');
 ok(!!pid&&await ev(i=>{const x=photoOf(i);return !!x&&/^data:image\/jpeg/.test(x.img)&&x.exp;},pid),'receipt picture saved with the expense');
 const sz=await ev(i=>photoOf(i).img.length,pid);ok(sz<700000,'picture small enough to sync ('+Math.round(sz/1024)+' KB)');
 ok(/111\.526/.test(await p.textContent('#eowed')),'"Owed to shops 111.526" on top');
 await p.click('#eowed');await W(300);ok((await p.$$('[data-ee]')).length===1,'tap owed → only the unpaid one');await p.click('#eflt');await W(300);ok((await p.$$('[data-ee]')).length===3,'Show all → all 3');
 /* 9 pay part by card, more than owed refused, then remove it and don't save */
 await p.click(`[data-ee="${E.id}"]`);await W(400);ok(/111\.526/.test(await p.textContent('.xowed')),'sheet shows still owed 111.526');
 await p.fill('#epa','200');await p.click('#epadd');await W(150);ok((await p.$$('.xpays [data-epx]')).length===0,'paying more than owed → refused');
 await p.fill('#epa','0');await p.click('#epadd');await W(150);ok((await p.$$('.xpays [data-epx]')).length===0,'paying 0 → refused');
 await p.click('[data-pm="Card"]');await p.fill('#epa','40');await p.click('#epadd');await W(200);
 ok((await p.$$('.xpays [data-epx]')).length===1&&/71\.526/.test(await p.textContent('.xowed')),'paid 40 by card → still owed 71.526');
 await ev(()=>back());await W(200);ok(await ask(),'payment added then back → asks');await p.click('[data-la=d]');await W(200);
 ok(await ev(id=>DB.expenses.find(x=>x.id===id).pays.length===0,E.id),"don't save → payment not kept");
 await p.click(`[data-ee="${E.id}"]`);await W(400);await p.click('[data-pm="Card"]');await p.fill('#epa','40');await p.click('#epadd');await W(200);await p.click('#eok');await W(300);
 ok(await ev(id=>{const e=DB.expenses.find(x=>x.id===id);return e.pays.length===1&&e.pays[0].m==='Card'&&expOwed(e)===71.526&&e.cash===false;},E.id),'saved: 40 by card, 71.526 owed');
 ok(/71\.526/.test(await p.textContent(`[data-ee="${E.id}"] .v`)),'list shows Unpaid 71.526');
 /* 10 pay the rest from the drawer → paid in full, today's close + 71.526 */
 await p.click(`[data-ee="${E.id}"]`);await W(400);ok(await p.inputValue('#epa')==='71.526','pay box starts with what is owed');await p.click('[data-pm="Cash"]');await p.click('#epadd');await W(200);
 ok(/Paid in full|مدفوع كامل/.test(await p.textContent('#epay')),'shows paid in full');await p.click('#eok');await W(300);
 ok(await ev(id=>expOwed(DB.expenses.find(x=>x.id===id))===0,E.id)&&!(await p.$('#eowed')),'nothing owed any more; owed box gone');
 ok(await ev(()=>Math.abs(expCashOn(today())-(7.67+71.526))<1e-9),'daily close: 7.670 + 71.526 from the drawer');
 await ev(()=>go('close'));await W(300);ok(/79\.196/.test(await p.textContent('#main')),'Daily close screen shows 79.196 cash expenses');await ev(()=>go('exp'));await W(300);
 /* 11 remove a payment (✕) and save → owed again */
 await p.click(`[data-ee="${E.id}"]`);await W(400);await p.click('[data-epx="1"]');await W(150);await p.click('#eok');await W(300);
 ok(await ev(id=>expOwed(DB.expenses.find(x=>x.id===id))===71.526,E.id),'removing the drawer payment → 71.526 owed again');
 /* 12 lower the amount below what was paid → refused */
 await p.click(`[data-ee="${E.id}"]`);await W(400);await p.fill('#ea','30');await p.click('#eok');await W(200);ok(await st()&&await ev(id=>DB.expenses.find(x=>x.id===id).amt===111.526,E.id),'amount below what was paid → refused');
 await p.click('[data-la=d]').catch(()=>{});await ev(()=>closeSheet());await W(150);
 /* 13 one payment covering it all: change the amount → payment follows; change the date → payment date follows */
 const E1=await ev(()=>DB.expenses[0].id);await p.click(`[data-ee="${E1}"]`);await W(400);await p.fill('#ea','8');await p.fill('#ed',yday);await p.click('#eok');await W(300);
 ok(await ev(id=>{const e=DB.expenses.find(x=>x.id===id);return e.amt===8&&e.pays[0].amt===8&&dayKey(e.t)===dayKey(now()-864e5)&&dayKey(e.pays[0].t)===dayKey(now()-864e5)&&expOwed(e)===0;},E1),'paid one: amount 8 and date yesterday → payment follows both');
 ok(await ev(()=>Math.abs(expCashOn(today())-0)<1e-9),'it left today\'s drawer (moved to yesterday)');
 /* 14 photo delete: ✕ once warns, twice removes; save → photo record gone */
 await p.click(`[data-ee="${E.id}"]`);await W(400);await p.click('[data-xpx]');await W(100);ok((await p.$$('#ephs .xph1')).length===1,'one tap on ✕ does not delete');
 await p.click('[data-xpx]');await W(150);ok((await p.$$('#ephs .xph1')).length===0,'second tap removes it from the sheet');await p.click('#eok');await W(300);
 ok(await ev(([id,i])=>!DB.expenses.find(x=>x.id===id).ph&&!photoOf(i),[E.id,pid]),'saved → picture deleted');
 /* 15 empty shop → no supplier; clearing the shop on an old one removes the link */
 await p.click(`[data-ee="${E1}"]`);await W(400);await p.fill('#ev','');await p.click('#eok');await W(300);ok(await ev(id=>{const e=DB.expenses.find(x=>x.id===id);return !e.vend&&!e.vname;},E1),'shop cleared → no supplier on it');
 /* 16 old expenses (before 2.42): drawer / not drawer — daily close, open & save untouched */
 await ev(()=>{DB.expenses.push({id:'old1',cat:'Rent',amt:50,t:now(),note:'old'},{id:'old2',cat:'Other',amt:9,t:now(),cash:false});save();go('exp');});await W(300);
 ok(await ev(()=>Math.abs(expCashOn(today())-50)<1e-9),'old drawer expense counts in the close, old non-drawer does not');
 await p.click('[data-ee="old2"]');await W(400);ok(/not from the drawer|مو من الدرج/i.test(await p.textContent('#epay')),'old non-drawer shows as "Paid (not from the drawer)"');
 await ev(()=>back());await W(200);ok(!(await st()),'old one opened and left untouched → no question');
 await p.click('[data-ee="old2"]');await W(400);await p.click('#eok');await W(300);ok(await ev(()=>{const e=DB.expenses.find(x=>x.id==='old2');return e.pays.length===1&&e.pays[0].m==='Other'&&e.cash===false&&expOwed(e)===0&&e.amt===9;}),'old one saved without changes stays paid, not from drawer');
 /* 17 delete asks first; photos go with it */
 await ev(()=>{const id='phT';DB.photos.push({id,exp:'old1',img:'data:image/jpeg;base64,AA',t:now()});DB.expenses.find(x=>x.id==='old1').ph=[id];save();render();});await W(200);
 await p.click('[data-ee="old1"]');await W(400);await p.click('#edel');await W(200);ok(await ev(()=>DB.expenses.some(x=>x.id==='old1'))&&!!(await p.$('#cfy')),'Delete asks first');
 await ev(()=>back());await W(200);ok(await ev(()=>DB.expenses.some(x=>x.id==='old1')),'back from the question → not deleted');
 await p.click('[data-ee="old1"]');await W(400);await p.click('#edel');await W(200);await p.click('#cfy');await W(300);ok(await ev(()=>!DB.expenses.some(x=>x.id==='old1')&&!photoOf('phT')),'confirmed → expense and its picture deleted');
 /* 18 suppliers page: owed tag, expenses row → filtered list, + Expense from there keeps the shop */
 await ev(()=>go('vendors'));await W(300);const vid=E.vend||(await ev(id=>DB.expenses.find(x=>x.id===id).vend,E.id));
 ok(/71\.526/.test(await p.textContent(`[data-ve="${vid}"]`)),'supplier row shows Owed 71.526');
 await p.click(`[data-ve="${vid}"]`);await W(400);ok(!!(await p.$('#vexp')),'supplier sheet shows its expenses');await p.click('#vexp');await W(400);
 ok(await ev(()=>S.r==='exp'&&!!S.p.vend)&&(await p.$$('[data-ee]')).length===1,'opens the expenses of that shop only');
 await p.click('#eadd');await W(400);ok(await p.inputValue('#ev')==='Nama electricity','＋ Expense from a shop starts with that shop');await ev(()=>closeSheet());
 /* 19 deleting a supplier keeps the shop name on its expenses */
 await ev(id=>{DB.vendors=DB.vendors.filter(v=>v.id!==id);save();go('exp');},vid);await W(300);ok(/Nama electricity/.test(await p.textContent(`[data-ee="${E.id}"]`)),'supplier deleted → name still on the expense');
 /* 20 Arabic */
 await ev(()=>{DB.ws.lang='ar';save();lookApply();go('exp');});await W(300);await p.click('#eadd');await W(400);const ar=await p.textContent('#sheet');
 ok(/درج الكاش/.test(ar)&&/ما انسدد بعد/.test(ar)&&/صورة الفاتورة/.test(ar)&&/كيف انسدد/.test(ar),'Arabic words in the sheet');await ev(()=>closeSheet());
 ok(/عليك للمحلات/.test(await p.textContent('#main')),'Arabic: owed box');
 ok(errs.length===0,'no page errors '+JSON.stringify(errs.slice(0,3)));
 await b.close();
 /* 21 small phone and tablet: nothing cut in the sheet with payments and a picture */
 for(const vp of [{width:360,height:740},{width:1100,height:1400}]){const {b,p,errs}=await start(vp);
  await p.evaluate(()=>{DB.expenses.push({id:'s1',cat:'Electricity',amt:12345.678,t:now(),vend:null,vname:'Very long shop name for the small phone screen test LLC',pays:[{amt:40,m:'Card',t:now()},{amt:1000.5,m:'Transfer',t:now()}],note:'n'});save();go('exp');});await W(300);
  await p.click('[data-ee="s1"]');await W(400);
  const bad=await p.evaluate(()=>{const o=[];document.querySelectorAll('#sheet *').forEach(e=>{if(!e.offsetParent)return;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);if(r.right>innerWidth+1)o.push('screen '+e.className);if(cs.textOverflow!=='ellipsis'&&cs.overflowX==='visible'&&e.scrollWidth>e.clientWidth+2&&cs.display!=='inline'&&!['INPUT','SELECT','DATALIST','OPTION'].includes(e.tagName))o.push('cut '+e.tagName+'.'+e.className+' '+e.textContent.slice(0,20));});return o;});
  ok(bad.length===0,vp.width+': nothing cut in the sheet '+JSON.stringify(bad.slice(0,4)));ok(errs.length===0,vp.width+': no page errors');await b.close();}
})();
