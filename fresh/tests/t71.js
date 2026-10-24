const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();save();go('cust');},[cat,cu]);await p.waitForTimeout(800);
 const hide=()=>p.evaluate(()=>document.querySelectorAll('#toast,#undob').forEach(x=>x.hidden=true));
 const n0=await p.$$eval('.crow2',L=>L.length);ok(n0===60,'first 60 rows '+n0);await hide();await p.screenshot({path:'cu1.png'});
 await p.fill('#cq','31838');await p.waitForTimeout(600);const r1=await p.$$eval('.crow2 b',L=>L.map(x=>x.innerText));console.log(r1);ok(r1.length>=1&&r1.some(x=>/Salem/i.test(x)),'search by plate');
 await p.fill('#cq','');await p.waitForTimeout(500);await p.click('[data-cf="dup"]');await p.waitForTimeout(500);const nd=await p.$$eval('.crow2',L=>L.length);ok(nd>=2,'same-phone filter '+nd);
 await p.click('[data-cf="due"]');await p.waitForTimeout(400);await p.click('[data-cs="due"]');await p.waitForTimeout(400);const dues=await p.$$eval('.crow2 .due',L=>L.slice(0,3).map(x=>+x.innerText));ok(dues.length&&dues[0]>=dues[1],'owe most first '+dues);
 /* move a car */
 const ids=await p.evaluate(()=>{const v=DB.vehicles.find(v=>v.plate&&/31838/.test(v.plate));const to=DB.customers.find(c=>c.id!==v.cust&&/alyazeedi/i.test(c.name||''));return [v.id,v.cust,to.id,to.name];});
 await p.evaluate(([vid,cid])=>go('custd',{id:cid}),ids);await p.waitForTimeout(400);await p.click(`[data-ve="${ids[0]}"] [data-vedit]`);await p.waitForTimeout(400);
 ok(!!(await p.$('text=نقل السيارة لعميل ثاني')),'move button in car sheet');await p.click('text=نقل السيارة لعميل ثاني');await p.waitForTimeout(400);
 await p.fill('#pcq',ids[3].slice(0,8));await p.waitForTimeout(400);await p.click(`[data-pc="${ids[2]}"]`);await p.waitForTimeout(400);await p.click('#cfy').catch(async()=>{await p.locator('#sheet .btn').first().click();});await p.waitForTimeout(500);
 ok(await p.evaluate(([vid,,to])=>byId('vehicles',vid).cust===to&&S.p.id===to,ids),'car moved to the other customer');
 ok(await p.evaluate(([vid,from])=>DB.jobs.filter(j=>j.veh===vid&&j.cust===from).length>0,ids),'old visits stay with old owner');
 /* merge */
 const pair=await p.evaluate(()=>{const ph={};for(const c of DB.customers){const k=phoneKey(c.phone);if(k.length<7)continue;if(ph[k])return [ph[k].id,c.id];ph[k]=c;}});
 const before=await p.evaluate(([a,b])=>[DB.jobs.filter(j=>j.cust===a||j.cust===b).length,DB.customers.length],pair);
 await p.evaluate(([a])=>go('custd',{id:a}),pair);await p.waitForTimeout(400);ok(!!(await p.$('#cmg1')),'same-phone warning');await hide();await p.screenshot({path:'cu2.png'});
 await p.click('#cmg1');await p.waitForTimeout(300);await p.click('#cfy').catch(async()=>{await p.locator('#sheet .btn').first().click();});await p.waitForTimeout(500);
 const after=await p.evaluate(([a,b])=>[DB.jobs.filter(j=>j.cust===b).length,DB.customers.length,!!byId('customers',a)],pair);ok(after[0]===before[0]&&after[1]===before[1]-1&&!after[2],'merged '+JSON.stringify(after));
 /* rename */
 await p.evaluate(()=>go('users'));await p.waitForTimeout(400);const txt=await p.evaluate(()=>document.body.innerText);ok(!/عامل|العمال/.test(txt),'no "عامل" on users page');
 console.log('errors',errs);await b.close();})();
