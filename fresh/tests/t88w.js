const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1536,height:864},colorScheme:'dark'});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();save();window.toast=()=>{};},[cat,cu]);
 await p.evaluate(()=>{const v=DB.vehicles.find(v=>/camry/i.test(v.model));go('counter',{vid:v.id});});await p.waitForTimeout(400);await p.fill('#ckm','120000');await p.click('#coil');await p.waitForTimeout(600);
 await p.evaluate(()=>{inspSeed();const j=byId('jobs',S.p.id);inspStart(j,DB.insp[1]);save();go('inspj',{id:j.id});});await p.waitForTimeout(500);
 ok(await p.$('#isw')&&(await p.$$('[data-iai]')).length>1&&await p.$('#iasec'),'change / add buttons');
 // mark item 1 bad, item 4 warn
 await p.click('[data-is="1:bad"]');await p.waitForTimeout(200);await p.click('[data-is="4:warn"]');await p.waitForTimeout(200);
 ok(!(await p.$('.isv')),'no inline suggestion');
 const n0=await p.evaluate(()=>byId('jobs',S.p.id).insp.items.length);
 await p.click('[data-iai="0"]');await p.waitForTimeout(300);await p.fill('#iat','Engine mounts\nOil cap seal');await p.click('#iaok');await p.waitForTimeout(300);
 let r=await p.evaluate(()=>{const I=byId('jobs',S.p.id).insp;return {n:I.items.length,r:I.r,c:I.sec[0].c,it:I.items.slice(0,I.sec[0].c)};});
 ok(r.n===n0+2,'2 checks added');console.log(JSON.stringify(r));
 await p.click('#iasec');await p.waitForTimeout(300);await p.fill('#ian','Under the car');await p.fill('#iat','Exhaust');await p.click('#iaok');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>{const I=byId('jobs',S.p.id).insp;return I.sec.at(-1).n==='Under the car'&&I.items.at(-1)==='Exhaust';}),'section added');
 await p.screenshot({path:'i1.png'});
 // long press delete first added
 const el=p.locator('[data-io]').nth(0);await el.scrollIntoViewIfNeeded();await p.waitForTimeout(200);const bb=await el.boundingBox();await p.mouse.move(bb.x+20,bb.y+10);await p.mouse.down();await p.waitForTimeout(650);await p.mouse.up();await p.waitForTimeout(300);
 const nm=await p.inputValue('#ien');await p.click('#iedel');await p.waitForTimeout(300);
 r=await p.evaluate(()=>{const I=byId('jobs',S.p.id).insp;return {n:I.items.length,r:I.r,first:I.items[0]};});console.log('deleted',nm,JSON.stringify(r));
 // switch list
 await p.click('#isw');await p.waitForTimeout(300);await p.screenshot({path:'i2.png'});await p.locator('[data-ts]').nth(0).click();await p.waitForTimeout(400);
 r=await p.evaluate(()=>{const I=byId('jobs',S.p.id).insp;return {name:I.name,r:Object.entries(I.r).map(([i,s])=>I.items[i]+':'+s)};});console.log('switched',JSON.stringify(r));
 await p.click('#isw');await p.waitForTimeout(300);await p.locator('[data-ts]').nth(1).click();await p.waitForTimeout(400);
 await p.evaluate(()=>{const I=byId('jobs',S.p.id).insp;I.r[2]='bad';I.r[6]='warn';save();render();});await p.waitForTimeout(300);
 await p.click('#idone');await p.waitForTimeout(500);await p.screenshot({path:'sheet1536.png'});
 const q=await p.evaluate(()=>({rows:document.querySelectorAll('.iqr').length,btn:document.querySelector('#iqok').textContent,tot:document.querySelector('#iqtot').textContent}));console.log(JSON.stringify(q));
 const before=await p.evaluate(()=>byId('jobs',S.p.id).items.length);
 const c=await p.$$('[data-qc]');if(c.length)await c[0].click();await p.waitForTimeout(100);
 await p.click('#iqok');await p.waitForTimeout(500);
 r=await p.evaluate(b=>({added:byId('jobs',S.p.id).items.length-b,r:S.r}),before);console.log(JSON.stringify(r));ok(r.r==='job','back to job');
 console.log('errors',errs);await b.close();})();
