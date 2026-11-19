/* 2.42.2: an invoice "paid later" can be paid straight from the lists — Home «Not paid yet» + 💵 on the car row,
   and the job page bar only (19 Nov: not on every list — fewer buttons) — one sheet: method, amount, Save. Partial, too much,
   zero, rights. A payment saved by mistake: the owner presses and holds it on the invoice → cancel (asks first, logged). */
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
 ok(!(await p.$(`[data-pj="${jid}"]`)),tag+'still in the workshop: no 💵 on its row (pay from the job page)');
 await ev(id=>{const j=byId('jobs',id);j.stage='done';save();render();},jid);await W(300);
 ok(/Not paid yet|ما انسدد بعد/.test(await p.textContent('#main'))&&(await p.$$(`[data-pj="${jid}"]`)).length===1,tag+'car left the workshop → Home «Not paid yet» section with it');
 const pj=await p.$(`[data-pj="${jid}"]`);
 await ev(()=>go('work'));await W(300);ok(!(await p.$('[data-pj]')),tag+'Work list: no 💵 buttons');await ev(()=>go('home'));await W(300);
 /* 💵 opens the payment sheet, not the job */
 await (await p.$(`[data-pj="${jid}"]`)).click();await W(400);ok(await ev(()=>S.r)==='home'&&!!(await p.$('#jpok')),tag+'💵 opens the payment sheet right there');
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
 /* debts and the counter warning: no 💵 there any more (one place less) */
 await ev(()=>go('debts'));await W(300);ok(!(await p.$('[data-dpay]')),tag+'Debts: no 💵 button');
 /* a payment saved by mistake: owner presses and holds it on the invoice → asks → cancelled, due again, logged */
 await ev(id=>go('inv',{id}),jid);await W(400);const rows=await p.$$('[data-pyi]');ok(rows.length>=2,tag+'invoice lists the payments ('+rows.length+')');
 ok(/press and hold|ضغطة طويلة/i.test(await p.textContent('#main')),tag+'owner sees the hint how to cancel');
 const n0=await ev(id=>byId('jobs',id).pays.length,jid);const last=rows[rows.length-1];await last.evaluate(e=>e.scrollIntoView({block:'center'}));await W(200);const bb=await last.boundingBox();
 await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await W(900);await p.mouse.up();await W(300);
 ok(/Cancel this payment|تلغي هالدفعة/.test(await p.textContent('#sheet')),tag+'hold → asks first');
 await ev(()=>back());await W(300);ok(await ev(([id,n])=>byId('jobs',id).pays.length===n,[jid,n0]),tag+'back → nothing cancelled');
 await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await W(900);await p.mouse.up();await W(300);await p.click('#cfy');await W(400);
 const after=await ev(id=>{const j=byId('jobs',id);return {n:j.pays.length,due:jobDue(j),st:j.stage,log:JSON.stringify(j.log||[]).includes('Payment cancelled'),aud:DB.audit.slice(-3).some(a=>/Payment cancelled/.test(a.d))};},jid);
 ok(after.n===n0-1&&after.due>0&&after.st==='done'&&after.log&&after.aud,tag+'cancelled → due again '+after.due+', stays done, in the job log and the audit');
 await ev(()=>go('home'));await W(300);ok(!!(await p.$(`[data-pj="${jid}"]`)),tag+'shows again under «Not paid yet»');
 /* a worker: no hint, hold does nothing */
 await ev(()=>{window.__r=S.user.role;S.user.role='worker';});await ev(id=>go('inv',{id}),jid);await W(400);
 ok(!/press and hold|ضغطة طويلة/i.test(await p.textContent('#main')),tag+'worker: no cancel hint');
 const r2=await p.$('[data-pyi]');if(r2){await r2.evaluate(e=>e.scrollIntoView({block:'center'}));await W(200);const b2=await r2.boundingBox();await p.mouse.move(b2.x+b2.width/2,b2.y+b2.height/2);await p.mouse.down();await W(900);await p.mouse.up();await W(300);}
 ok(!/Cancel this payment|تلغي هالدفعة/.test(await ev(()=>(document.querySelector('#sheet')||{}).textContent||'')),tag+'worker: hold does not cancel');await ev(()=>{S.user.role=window.__r;closeSheet();});
 /* rights: someone who cannot invoice nor see money → no 💵 anywhere */
 await ev(()=>{window.__ci=can.invoice;window.__cm=can.money;can.invoice=()=>false;can.money=()=>false;go('home');});await W(300);
 ok(!(await p.$('[data-pj]'))&&!/Not paid yet|ما انسدد بعد/.test(await p.textContent('#main')),tag+'no rights → no pay buttons, no section');await ev(()=>{can.invoice=window.__ci;can.money=window.__cm;});
 /* sizes */
 await ev(()=>go('home'));await W(300);const bad=await ev(()=>{const o=[];document.querySelectorAll('#main .car, #main .car *').forEach(e=>{if(!e.offsetParent)return;const r=e.getBoundingClientRect();if(r.right>innerWidth+1)o.push(e.className);});return o;});ok(bad.length===0,tag+'nothing off the screen');
 if(lang==='ar'){ok(/استلام دفعة|دفع/.test(await p.textContent('#main')),tag+'Arabic button');}
 if(vp.width===400)await p.screenshot({path:'/tmp/pl_home.png'});
 ok(errs.length===0,tag+'no page errors '+JSON.stringify(errs.slice(0,3)));await b.close();}})();
