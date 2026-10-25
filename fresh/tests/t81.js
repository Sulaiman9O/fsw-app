const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;save();},[cat,cu]);
 const ids=await p.evaluate(()=>{const js=DB.jobs.filter(j=>j.veh&&(j.items||[]).length).slice(-2);return js.map(j=>j.id);});
 await p.evaluate(id=>go('job',{id}),ids[0]);await p.waitForTimeout(400);await p.click('[data-eye]');await p.waitForTimeout(300);ok(await p.evaluate(()=>showCost()),'eye on');
 await p.evaluate(()=>render());ok(await p.evaluate(()=>showCost()),'stays on same screen');
 await p.evaluate(()=>go('jobs'));await p.evaluate(id=>go('job',{id}),ids[0]);ok(!(await p.evaluate(()=>showCost())),'hidden after leaving and coming back');
 await p.click('[data-eye]');await p.evaluate(id=>go('job',{id}),ids[1]);ok(!(await p.evaluate(()=>showCost())),'hidden on another job');
 /* print doc: sticker sits inside the 62 mm paper */
 const r=await p.evaluate(()=>{let doc='';window.printHtml=(d)=>{doc=d;};DB.ws.stk={};printSticker3('B',{kind:'oil',next:Date.now(),nextKm:100000,km:93000,line:'x'},0);return doc;});
 const q=await b.newPage({viewport:{width:234,height:400}});await q.setContent(r);const bx=await q.evaluate(()=>{const e=document.querySelector('.stk').getBoundingClientRect();const mm=96/25.4;return [e.left/mm,e.right/mm];});console.log(bx);ok(bx[0]>=0&&bx[1]<=62,'inside the paper');
 console.log('errors',errs);await b.close();})();
