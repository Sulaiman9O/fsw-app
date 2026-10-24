const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();save();},[cat,cu]);
 const hide=()=>p.evaluate(()=>document.querySelectorAll('#toast,#undob').forEach(x=>x.hidden=true));
 const cid=await p.evaluate(()=>{const c=DB.customers.find(c=>custDebt(c.id).due>50);return c.id;});await p.evaluate(id=>go('custd',{id}),cid);await p.waitForTimeout(500);
 const k=await p.$$eval('.kpis3 .kpi b',L=>L.map(x=>x.innerText));console.log(k);ok(k.length===3,'invoiced/paid/due');
 const tabs=await p.$$eval('[data-ct]',L=>L.map(x=>x.dataset.ct));ok(tabs.join()==='cars,visits,est,stmt,notes,msgs','tabs '+tabs);await hide();await p.screenshot({path:'cp1.png'});
 /* car note */
 await p.click('[data-vn]');await p.waitForTimeout(300);await p.fill('#vnx','400ml 5W-30 added');await p.click('#vnok');await p.waitForTimeout(300);ok((await p.$eval('.ccar .cnote',x=>x.innerText)).includes('400ml'),'car note on card');
 const vid=await p.$eval('[data-ctr]',x=>x.dataset.ctr);await p.click('[data-ctr]');await p.waitForTimeout(400);ok((await p.$eval('.ctrcar',x=>x.innerText)).includes('400ml'),'car note on counter');
 await p.evaluate(id=>go('custd',{id}),cid);await p.waitForTimeout(300);
 /* label */
 await p.click('#ctag');await p.waitForTimeout(300);await p.click('[data-tg="VIP"]');await p.click('#tgok');await p.waitForTimeout(300);ok((await p.$eval('.ctags',x=>x.innerText)).includes('VIP'),'label');
 /* statement */
 await p.click('[data-ct="stmt"]');await p.waitForTimeout(300);const last=await p.$eval('.ctab .jb-r b small bdi',x=>x.innerText);const due=await p.evaluate(id=>f3(custDebt(id).due),cid);ok(last===due,'statement balance = due '+last+' '+due);await hide();await p.screenshot({path:'cp2.png'});
 /* notes + messages */
 await p.click('[data-ct="notes"]');await p.waitForTimeout(300);await p.fill('#cnx','Wants Shell oil next time');await p.click('#cnok');await p.waitForTimeout(300);ok((await p.$eval('.ctab',x=>x.innerText)).includes('Shell'),'note saved');
 await p.evaluate(id=>{const c=byId('customers',id);shareText(c.phone,'test message');},cid).catch(()=>{});await p.waitForTimeout(500);
 await p.goto('http://localhost:8811/').catch(()=>{});
 console.log('errors',errs);await b.close();})();
