const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();save();},[cat,cu]);
 await p.evaluate(()=>{const v=DB.vehicles.find(v=>v.plate&&/31838/.test(v.plate));go('counter',{vid:v.id});});await p.waitForTimeout(400);await p.click('#coil');await p.waitForTimeout(400);
 const ids=await p.evaluate(()=>{const j=byId('jobs',S.p.id);const to=DB.customers.find(c=>c.id!==j.cust&&/alyazeedi/i.test(c.name||''));return [j.id,j.cust,j.veh,to.id,to.name];});
 const a=p.locator('.card [data-go^="custd:"]');const bb=await a.boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.waitForTimeout(700);await p.mouse.up();await p.waitForTimeout(500);
 ok(await p.evaluate(()=>S.r)==='job','long press stays on the job');const acts=await p.evaluate(()=>[...document.querySelectorAll('#qs [data-qi] small,#sheet [data-ai] b')].map(x=>x.innerText));console.log(acts);ok(acts.length>=3,'menu shows');
 await p.evaluate(()=>{const q=document.querySelector('#qs [data-qi="0"]')||document.querySelector('#sheet [data-ai="0"]');q.click();});await p.waitForTimeout(400);
 await p.fill('#pcq',ids[4].slice(0,8));await p.waitForTimeout(400);await p.click(`[data-pc="${ids[3]}"]`);await p.waitForTimeout(400);
 const r=await p.evaluate(([jid,,vid])=>[byId('jobs',jid).cust,byId('vehicles',vid).cust],ids);ok(r[0]===ids[3]&&r[1]===ids[1],'job customer changed, car stays with owner');
 /* customer page: no merge button; merge inside edit */
 await p.evaluate(id=>go('custd',{id}),ids[1]);await p.waitForTimeout(400);ok(!(await p.$('#cmg2')),'no merge button on page');await p.click('#cedit');await p.waitForTimeout(300);ok(!!(await p.$('text=ادمجهم')),'merge inside edit');
 console.log('errors',errs);await b.close();})();
