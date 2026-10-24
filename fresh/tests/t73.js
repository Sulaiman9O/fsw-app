const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();save();},[cat,cu]);
 await p.evaluate(()=>{const v=DB.vehicles.find(v=>v.plate&&/31838/.test(v.plate));go('counter',{vid:v.id});});await p.waitForTimeout(400);await p.click('#coil');await p.waitForTimeout(400);
 const oilId=await p.evaluate(()=>{const j=byId('jobs',S.p.id);return partOfItem(j.items.find(i=>i.u==='L')).id;});const s0=await p.evaluate(id=>+byId('parts',id).stock,oilId);
 await p.click('#jpay');await p.waitForTimeout(300);await p.click('[data-pm="Cash"]');await p.waitForTimeout(600);
 const A=await p.evaluate(()=>{const j=DB.jobs[DB.jobs.length-1];return {id:j.id,no:j.inv.no,next:DB.ws.nextInv,total:jobTotals(j).total};});const s1=await p.evaluate(id=>+byId('parts',id).stock,oilId);
 ok(!!(await p.$('text=تعديل الفاتورة')),'edit button on invoice');
 await p.evaluate(id=>go('job',{id}),A.id);await p.waitForTimeout(400);await p.click('[data-it="0"]');await p.waitForTimeout(300);ok(!!(await p.$('#ieok')),'tapping a line offers edit');
 await p.click('#ieok');await p.waitForTimeout(500);const st=await p.evaluate(id=>{const j=byId('jobs',id);return [isInvoiced(j),j.invEdit&&j.invEdit.no,j.stage];},A.id);ok(!st[0]&&st[1]===A.no,'invoice opened to edit, same number kept '+st);
 ok(await p.evaluate(id=>+byId('parts',id).stock,oilId)===s0,'parts back to stock while editing');
 /* add a car wash */
 await p.evaluate(id=>{const j=byId('jobs',id);const s=DB.services.find(x=>/car wash/i.test(x.name));j.items.push(svcItem(s,vehOf(j)));save();render();},A.id);await p.waitForTimeout(300);
 await p.click('#jpay');await p.waitForTimeout(300);await p.click('[data-pm="Cash"]');await p.waitForTimeout(600);
 const B=await p.evaluate(id=>{const j=byId('jobs',id);const T=jobTotals(j);return {no:j.inv.no,next:DB.ws.nextInv,total:T.total,paid:T.paid,due:T.due,pays:j.pays.map(p=>p.amt),stage:j.stage};},A.id);console.log(JSON.stringify(A),JSON.stringify(B));
 ok(B.no===A.no&&B.next===A.next,'same invoice number, counter unchanged');ok(B.due===0&&Math.abs(B.pays[1]-(B.total-A.total))<0.001,'only the difference paid');ok(await p.evaluate(id=>+byId('parts',id).stock,oilId)===s1,'stock out again once');
 /* edit and remove the wash → give back */
 await p.evaluate(id=>{const j=byId('jobs',id);reopenInvoice(j);j.items=j.items.filter(i=>!/car wash/i.test(i.d));issueInvoice(j);closeJob(j);save();},A.id);
 const C=await p.evaluate(id=>{const j=byId('jobs',id);const T=jobTotals(j);return {paid:T.paid,total:T.total,last:j.pays.slice(-1)[0]};},A.id);ok(Math.abs(C.paid-C.total)<0.001&&C.last.refund,'too much paid given back '+JSON.stringify(C));
 ok(await p.evaluate(()=>!/Duplicate|تكرار/.test(JSON.stringify(itemMenu.toString()))),'no duplicate in the menu');
 console.log('errors',errs);await b.close();})();
