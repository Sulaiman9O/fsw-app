const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();save();window.toast=()=>{};},[cat,cu]);
 const stkKm=async()=>{await p.click('#jrstk');await p.waitForTimeout(500);const r=await p.evaluate(()=>(document.querySelector('#spv3')._stk.match(/\d{3},\d{3}/g)||[]).join(' '));await p.evaluate(()=>closeSheet());await p.waitForTimeout(300);return r;};
 await p.evaluate(()=>{const v=DB.vehicles.find(v=>v.plate&&/31838/.test(v.plate));go('counter',{vid:v.id});});await p.waitForTimeout(400);
 await p.fill('#ckm','٢٥٠٠٠٠');await p.click('#coil');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>byId('jobs',S.p.id).km===250000),'counter km (Arabic digits) goes to the job');
 ok(/257,000/.test(await stkKm()),'sticker uses it');
 await p.locator('[data-kmj]').scrollIntoViewIfNeeded();await p.click('[data-kmj]');await p.waitForTimeout(400);await p.fill('#jkm','251000');await p.click('#jkmok');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>byId('jobs',S.p.id).km===251000),'km changed in the job');ok(/258,000/.test(await stkKm()),'sticker follows');
 await p.evaluate(()=>window.scrollTo(0,0));await p.evaluate(()=>document.querySelectorAll('*').forEach(e=>{if(e.scrollTop)e.scrollTop=0;}));await p.waitForTimeout(300);await p.screenshot({path:'km1.png',clip:{x:0,y:0,width:400,height:420}});
 /* open job again from the counter with a new km */
 const id=await p.evaluate(()=>S.p.id);await p.evaluate(()=>{const v=vehOf(byId('jobs',S.p.id));go('counter',{vid:v.id});});await p.waitForTimeout(400);await p.fill('#ckm','252000');await p.click('#coj');await p.waitForTimeout(400);
 ok(await p.evaluate(id=>byId('jobs',id).km===252000,id),'open job takes the new km');
 console.log('errors',errs);await b.close();})();
