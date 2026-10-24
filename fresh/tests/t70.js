const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();save();},[cat,cu]);
 /* maker values beat what was sold before (Pathfinder 2002: history says 8 L) */
 const vid=await p.evaluate(()=>DB.vehicles.find(v=>/pathfinder/i.test(v.model)&&String(v.year)==='2002').id);
 const q0=await p.evaluate(id=>oilRecipe(byId('vehicles',id),'usual').qty,vid);
 await p.evaluate(id=>{const v=byId('vehicles',id);specSheet(v);},vid);await p.waitForTimeout(300);await p.fill('#spc','5');await p.click('#spok');await p.waitForTimeout(300);
 const q1=await p.evaluate(id=>[oilRecipe(byId('vehicles',id),'usual').qty,quoteRows(byId('vehicles',id),'oil').qty],vid);ok(q0===8&&q1[0]===5&&q1[1]===5,'maker litres win over history '+q0+' → '+q1);
 ok(!(await p.$('#qqty'))&&!(await p.$('#rxqty')),'no separate litres button');
 /* quick sale */
 const st0=await p.evaluate(()=>{const p=DB.parts.find(x=>/04152-YZZD1/.test(x.num||''));return [p.id,+p.stock];});const inv0=await p.evaluate(()=>DB.ws.nextInv);
 await p.evaluate(()=>go('counter'));await p.waitForTimeout(400);ok(!!(await p.$('.ctrsale')),'quick sale button on counter');await p.click('.ctrsale');await p.waitForTimeout(400);
 await p.fill('#slq','yzzd1');await p.waitForTimeout(300);await p.click('#slres [data-sp]');await p.waitForTimeout(300);await p.fill('#slq','yzzd1');await p.waitForTimeout(300);await p.click('#slres [data-sp]');await p.waitForTimeout(300);
 await p.fill('#slq','shell motor oil 5w-30');await p.waitForTimeout(300);await p.click('#slres [data-sp]');await p.waitForTimeout(300);await p.click('[data-sq="1|1"]');await p.waitForTimeout(200);
 const bk=await p.evaluate(()=>S.sale.items.map(i=>[i.d.slice(0,20),i.q,i.u]));console.log(JSON.stringify(bk));ok(bk[0][1]===2&&bk[1][1]===1.5,'basket quantities');
 await p.evaluate(()=>document.querySelectorAll('#toast,#undob').forEach(x=>x.hidden=true));await p.screenshot({path:'s1.png'});
 await p.click('#slpay');await p.waitForTimeout(300);await p.click('[data-pm="Credit"]');await p.waitForTimeout(300);ok(await p.evaluate(()=>S.r)==='sale','credit refused without a name');
 await p.click('[data-pm="Cash"]');await p.waitForTimeout(700);
 const r=await p.evaluate(([pid])=>{const j=DB.jobs[DB.jobs.length-1];return {r:S.r,kind:j.kind,veh:j.veh,stage:j.stage,due:jobTotals(j).due,no:j.inv.no,stock:+byId('parts',pid).stock,rem:DB.reminders.filter(x=>x.job===j.id).length,cust:custOf(j).name,vehs:DB.vehicles.length};},st0);console.log(JSON.stringify(r));
 ok(r.r==='inv'&&r.kind==='sale'&&!r.veh&&r.stage==='done'&&r.due===0&&r.no===inv0,'sale invoiced, paid, no car');ok(r.stock===st0[1]-2,'stock taken out');ok(r.rem===0,'no reminders');
 ok((await p.$eval('.inv-pv',x=>x.innerText)).includes('بيع مباشر'),'invoice says counter sale');await p.evaluate(()=>document.querySelectorAll('#toast,#undob').forEach(x=>x.hidden=true));await p.screenshot({path:'s2.png'});
 await p.evaluate(()=>go('work',{f:'today'}));await p.waitForTimeout(400);ok((await p.$eval('#main',x=>x.innerText)).includes('بيع سريع'),'sale in today list');
 await p.click('.car');await p.waitForTimeout(400);ok(await p.evaluate(()=>S.r)==='inv','sale row opens invoice');
 console.log('errors',errs);await b.close();})();
