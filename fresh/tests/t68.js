const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','Fast Service World');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';DB.ws.phone='+968 9xxx xxxx';DB.ws.addr='Sanaiya, Ibra';DB.ws.warranty='ضمان 3 شهور على الأجور. القطع حسب ضمان الشركة.';S.user.lang='ar';langApply();save();},[cat,cu]);
 const logo=fs.readFileSync('logo.png').toString('base64');await p.evaluate(l=>{DB.ws.logo='data:image/png;base64,'+l;save();},logo);
 /* make one real invoice through the counter so it has a next service */
 await p.evaluate(()=>{const v=DB.vehicles.find(v=>v.plate&&/31838/.test(v.plate));go('counter',{vid:v.id});});await p.waitForTimeout(500);await p.click('#coil');await p.waitForTimeout(500);await p.click('#jpay');await p.waitForTimeout(300);await p.click('[data-pm="Cash"]');await p.waitForTimeout(800);
 ok(!!(await p.$('.inv-pv .iv2')),'modern invoice by default');ok(!!(await p.$('.iv2-next')),'next service on invoice');
 await p.evaluate(()=>document.querySelectorAll('#toast,#undob').forEach(x=>x.hidden=true));const el=await p.$('.inv-pv');await el.screenshot({path:'inv_modern.png'});
 await p.evaluate(()=>go('settings'));await p.waitForTimeout(400);await p.click('text=شكل الفاتورة');await p.waitForTimeout(500);ok(await p.evaluate(()=>S.r)==='invstyle','settings → invoice look');
 await p.click('[data-ac="#1D6FE0"]');await p.waitForTimeout(200);await p.click('[data-it2="clean"]');await p.waitForTimeout(400);ok(await p.evaluate(()=>DB.ws.invS.t==='clean'&&DB.ws.invS.acc==='#1D6FE0'),'saved template+colour');
 await p.check('[data-sh="sign"]');await p.waitForTimeout(200);ok(!!(await p.$('#ipv .iv2-sl')),'signature lines toggle');
 await p.fill('#inote','Bank Muscat 0123-456789');await p.waitForTimeout(200);ok((await p.$eval('#ipv',x=>x.innerText)).includes('Bank Muscat'),'extra line in preview');
 const pv=await p.$('#ipv');await pv.screenshot({path:'inv_clean.png'});await p.screenshot({path:'inv_settings.png'});
 await p.click('[data-lg="en"]');await p.waitForTimeout(300);ok((await p.$eval('#ipv',x=>x.innerText)).includes('Balance due'),'english labels');
 await p.click('[data-it2="classic"]');await p.waitForTimeout(300);ok(!!(await p.$('#ipv .inv-hd')),'classic still there');
 console.log('errors',errs);await b.close();})();
