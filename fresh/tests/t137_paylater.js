/* 2.42.2: an invoice "paid later" can be paid straight from the lists — Home «Not paid yet» + 💵 on the car row,
   the job page bar, Debts 💵, the counter warning — one sheet: method, amount, Save. Partial, too much, zero, rights. */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const p=await (await b.newContext({viewport:vp||{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));return {b,p,errs};}
const W=t=>new Promise(r=>setTimeout(r,t));
(async()=>{for(const [vp,lang] of [[{width:400,height:868},'en'],[{width:360,height:740},'ar'],[{width:1100,height:1400},'en']]){const {b,p,errs}=await start(vp);const ev=(f,a)=>p.evaluate(f,a);const tag=vp.width+' '+lang+': ';
 /* clear old debts, make one job with items, invoice it "payment later" through the real buttons */
 const jid=await ev(l=>{DB.ws.lang=l;DB.jobs.forEach(j=>{if(isInvoiced(j)&&jobTotals(j).due>0){j.pays=j.pays||[];j.pays.push({m:'Cash',amt:jobTotals(j).due,t:now()-864e5,by:'x'});}});
   const j=DB.jobs.find(x=>!isInvoiced(x)&&x.stage!=='estimate'&&(x.items||[]).length&&!(x.items||[]).some(i=>i.pend));j.stage='work';save();lookApply();go('job',{id:j.id});return j.id;},lang);await W(400);
 await p.click('#jpay');await W(300);await p.click('#pmlater');await W(400);
 const due0=await ev(id=>jobDue(byId('jobs',id)),jid);ok(due0>0&&await ev(id=>isInvoiced(byId('jobs',id)),jid),tag+'invoiced, payment later: due '+due0);
 /* home: Not paid yet section with 💵 */
 await ev(()=>go('home'));await W(400);const home=await p.textContent('#main');
 ok(!/Not paid yet ·|ما انسدد بعد ·/.test(home),tag+'still in the workshop → shown there (not twice)');
 await ev(id=>{const j=byId('jobs',id);j.stage='done';save();render();},jid);await W(300);
 ok(/Not paid yet|ما انسدد بعد/.test(await p.textContent('#main'))&&(await p.$$(`[data-pj="${jid}"]`)).length===1,tag+'car left the workshop → Home «Not paid yet» section with it');
 const pj=await p.$(`[data-pj="${jid}"]`);ok(!!pj,tag+'💵 Pay on the car row');
 /* 💵 opens the payment sheet, not the job */
 await pj.click();await W(400);ok(await ev(()=>S.r)==='home'&&!!(await p.$('#jpok')),tag+'💵 opens the payment sheet right there');
 ok(await p.inputValue('#jpa')===await ev(d=>f3(d),due0),tag+'amount starts at what is due');
 ok(await p.$eval('#jpm [aria-pressed="true"]',e=>e.dataset.m)!=='',tag+'a payment method is chosen');
 ok(!(await p.$('#jpm [data-m="Credit"]'))&&!(await p.$$eval('#jpm [data-m]',L=>L.some(x=>/later|credit|آجل/i.test(x.dataset.m)))),tag+'no "pay later" choice inside "take payment"');
 /* wrong amounts */
 await p.fill('#jpa','0');await p.click('#jpok');await W(200);ok(!!(await p.$('#jpok'))&&await ev(id=>jobDue(byId('jobs',id)),jid)===due0,tag+'0 refused');
 await p.fill('#jpa',String(due0+5));await p.click('#jpok');await W(200);ok(!!(await p.$('#jpok'))&&await ev(id=>jobDue(byId('jobs',id)),jid)===due0,tag+'more than due refused');
 await p.fill('#jpa','abc');await p.click('#jpok');await W(200);ok(!!(await p.$('#jpok')),tag+'letters refused');
 /* back without saving → nothing */
 await ev(()=>back());await W(300);if(await p.$('.leaveask'))await p.click('[data-la=d]');await W(200);ok(!(await p.$('#jpok'))&&await ev(id=>jobDue(byId('jobs',id)),jid)===due0,tag+'closed without saving → nothing paid');
 /* part payment by Card */
 await p.click(`[data-pj="${jid}"]`);await W(300);await p.click('#jpm [data-m="Card"]');await p.fill('#jpa','2');await p.click('#jpok');await W(400);
 const d1=await ev(id=>jobDue(byId('jobs',id)),jid);ok(Math.abs(d1-(due0-2))<1e-6&&await ev(id=>{const p=byId('jobs',id).pays.slice(-1)[0];return p.m==='Card'&&p.amt===2;},jid),tag+'part 2.000 by card saved, still due '+d1);
 ok(!!(await p.$(`[data-pj="${jid}"]`))&&(await p.textContent(`[data-go="job:${jid}"]`)).includes(await ev(d=>f3(d),d1)),tag+'row stays with the new due');
 /* tap the row itself → job page with the due bar */
 await p.click(`[data-go="job:${jid}"] .tx`);await W(400);ok(await ev(()=>S.r)==='job'&&!!(await p.$('#jtake')),tag+'row → job page, bar «Take payment» shown');
 /* invoice page chip → same sheet with that method chosen */
 await ev(id=>go('inv',{id}),jid);await W(400);const cash=await p.$('[data-pay="Cash"]');ok(!!cash,tag+'invoice page still has the payment chips');await cash.click();await W(300);
 ok(await p.$eval('#jpm [aria-pressed="true"]',e=>e.dataset.m)==='Cash'&&!!(await p.$('#jpok')),tag+'invoice chip «Cash» → same sheet with Cash chosen');await ev(()=>closeSheet());await W(200);
 /* job page bar → pay the rest cash → paid, job closed, section gone */
 await ev(id=>go('job',{id}),jid);await W(400);await p.click('#jtake');await W(300);await p.click('#jpm [data-m="Cash"]');await p.click('#jpok');await W(400);
 ok(await ev(id=>{const j=byId('jobs',id);return jobDue(j)===0&&j.stage==='done';},jid),tag+'rest paid cash → nothing due, job done');ok(!(await p.$('#jtake')),tag+'bar gone');
 await ev(()=>go('home'));await W(300);ok(!(await p.$(`[data-pj="${jid}"]`))&&!/Not paid yet|ما انسدد بعد/.test(await p.textContent('#main')),tag+'Home section gone');
 /* debts: one invoice → its sheet; two invoices → the customer sheet (oldest first) */
 const two=await ev(id=>{const j=byId('jobs',id);const c=custOf(j);const k=JSON.parse(JSON.stringify(j));k.id='jK';k.no=99901;k.pays=[];k.inv=Object.assign({},j.inv,{no:99901,t:now()});DB.jobs.push(k);save();go('debts');return {c:c.id,due:jobDue(k)};},jid);await W(400);
 let dp=await p.$(`[data-dpay="${two.c}"]`);ok(!!dp,tag+'Debts: 💵 on the customer');await dp.click();await W(300);ok(/99901/.test(await p.textContent('#sheet'))&&!!(await p.$('#jpok')),tag+'one invoice → its payment sheet');await ev(()=>closeSheet());
 await ev(()=>{const k=byId('jobs','jK');const m=JSON.parse(JSON.stringify(k));m.id='jK2';m.no=99902;m.inv=Object.assign({},k.inv,{no:99902,t:now()-864e5});DB.jobs.push(m);save();render();});await W(300);
 dp=await p.$(`[data-dpay="${two.c}"]`);await dp.click();await W(300);ok(!!(await p.$('#dpok')),tag+'two invoices → the customer\'s pay sheet');await ev(()=>closeSheet());
 /* counter: search the car → warning with 💵 */
 await ev(id=>{const v=vehOf(byId('jobs','jK'));go('counter');S.p={};},jid);await W(300);
 const shown=await ev(()=>{const k=byId('jobs','jK');const v=vehOf(k);return typeof debtNote==='function'?debtNote(v.cust):'';});ok(/data-dpay/.test(shown),tag+'counter warning has the 💵 button');
 /* rights: someone who cannot invoice nor see money → no 💵 anywhere */
 await ev(()=>{window.__ci=can.invoice;window.__cm=can.money;can.invoice=()=>false;can.money=()=>false;go('home');});await W(300);
 ok(!(await p.$('[data-pj]'))&&!/Not paid yet|ما انسدد بعد/.test(await p.textContent('#main')),tag+'no rights → no pay buttons, no section');await ev(()=>{can.invoice=window.__ci;can.money=window.__cm;});
 /* sizes */
 await ev(()=>go('home'));await W(300);const bad=await ev(()=>{const o=[];document.querySelectorAll('#main .car, #main .car *').forEach(e=>{if(!e.offsetParent)return;const r=e.getBoundingClientRect();if(r.right>innerWidth+1)o.push(e.className);});return o;});ok(bad.length===0,tag+'nothing off the screen');
 if(lang==='ar'){ok(/استلام دفعة|دفع/.test(await p.textContent('#main')),tag+'Arabic button');}
 if(vp.width===400)await p.screenshot({path:'/tmp/pl_home.png'});
 ok(errs.length===0,tag+'no page errors '+JSON.stringify(errs.slice(0,3)));await b.close();}})();
