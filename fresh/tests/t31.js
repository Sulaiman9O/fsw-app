const {chromium}=require('playwright');const M=require('./fbmock.js');
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async()=>{const ctx=await b.newContext({viewport:{width:412,height:900}});await M.attach(ctx);await ctx.addInitScript(M.init);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());return p;};
 const key=async(p,s)=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 // phone A: owner, with data
 const A=await mk();await A.goto('http://localhost:8811/');await A.waitForTimeout(600);
 await A.fill('#obn','Al Noor Garage');await A.locator('.btn').first().click();await A.locator('input.field').first().fill('Ahmed');await A.locator('.btn').first().click();await key(A,'1234');await key(A,'1234');await A.waitForTimeout(900);
 await A.click('#nwdemo');await A.click('#nwl').catch(()=>{});await A.waitForTimeout(300);
 await A.evaluate(()=>go('settings'));await A.waitForTimeout(300);await A.fill('#syem','shop@test.com');await A.fill('#sypw','secret1');await A.click('#syin');await A.waitForTimeout(2500);
 console.log('A status',await A.evaluate(()=>SYNC.status+' sent '+SYNC.sent),'cloud docs',M.store.size);
 // phone B: fresh install, different workshop data, then signs in
 const B=await mk();await B.goto('http://localhost:8811/');await B.waitForTimeout(600);
 await B.fill('#obn','Other');await B.locator('.btn').first().click();await B.locator('input.field').first().fill('Worker');await B.locator('.btn').first().click();await key(B,'5555');await key(B,'5555');await B.waitForTimeout(900);await B.click('#nwl').catch(()=>{});
 await B.evaluate(()=>go('settings'));await B.waitForTimeout(300);await B.fill('#syem','shop@test.com');await B.fill('#sypw','secret1');await B.click('#syin');await B.waitForTimeout(2500);
 console.log('B after join',await B.evaluate(()=>({ws:DB.ws.name,cust:DB.customers.length,parts:DB.parts.length,users:DB.users.map(u=>u.name),login:!S.user})));
 // B logs in as Ahmed and adds a customer
 await B.click('.person').catch(()=>{});await key(B,'1234');await B.waitForTimeout(500);
 await B.evaluate(()=>{DB.customers.push({id:'cB1',name:'From phone B',phone:'91112222',t:Date.now()});save();});await B.waitForTimeout(1500);
 console.log('A sees B customer',await A.evaluate(()=>!!DB.customers.find(c=>c.id==='cB1')));
 // A edits a part price, B sees it
 await A.evaluate(()=>{DB.parts[0].price=9.999;save();});await A.waitForTimeout(1500);
 console.log('B sees A price',await B.evaluate(()=>DB.parts[0].price));
 // A deletes customer cB1
 await A.evaluate(()=>{DB.customers=DB.customers.filter(c=>c.id!=='cB1');save();});await A.waitForTimeout(1500);
 console.log('B delete seen',await B.evaluate(()=>!DB.customers.find(c=>c.id==='cB1')));
 // B goes offline-ish: reload B and make change before sync starts
 await B.evaluate(()=>{DB.vendors.push({id:'vOff',name:'Offline vendor'});});await B.evaluate(()=>{syncStop();save();});await B.waitForTimeout(500);
 await B.evaluate(()=>{SYNC.on=false;syncStart();});await B.waitForTimeout(1500);
 console.log('A sees offline change',await A.evaluate(()=>!!DB.vendors.find(v=>v.id==='vOff')));
 // reload A (persisted) — still in sync and gets nothing wrong
 await A.reload();await A.waitForTimeout(2000);console.log('A after reload',await A.evaluate(()=>({st:SYNC.status,v:!!DB.vendors.find(v=>v.id==='vOff'),p:DB.parts[0].price})));
 await A.evaluate(()=>{S.user=DB.users[0];go('settings')});await A.waitForTimeout(400);await A.screenshot({path:'SY1.png'});
 await B.evaluate(()=>{syncStop();DB.expenses.push({id:'eOff',cat:'Rent',amt:5,t:Date.now()});DB.customers=DB.customers.filter(c=>c.id!=='demo_c2');_flushNow0();});await B.waitForTimeout(400);await B.reload();await B.waitForTimeout(2500);
 console.log('after B restart, A sees',await A.evaluate(()=>({exp:!!DB.expenses.find(e=>e.id==='eOff'),c2gone:!DB.customers.find(c=>c.id==='demo_c2')})));
 console.log(errs);await b.close();})();
