const {chromium}=require('playwright');const M=require('./fbmock.js');
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async(w,h)=>{const ctx=await b.newContext({viewport:{width:w||412,height:h||900}});await M.attach(ctx);await ctx.addInitScript(M.init);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());return p;};
 const key=async(p,s)=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 const A=await mk();await A.goto('http://localhost:8811/');await A.waitForTimeout(600);
 await A.fill('#obn','Fast Service World');await A.locator('.btn').first().click();await A.locator('input.field').first().fill('Sulaiman');await A.locator('.btn').first().click();await key(A,'1234');await key(A,'1234');await A.waitForTimeout(900);
 await A.click('#nwdemo');await A.click('#nwl').catch(()=>{});await A.evaluate(()=>{DB.ws.lang='ar';save();go('settings');});await A.waitForTimeout(300);
 await A.fill('#syem','shop@test.com');await A.fill('#sypw','secret1');await A.click('#syin');await A.waitForTimeout(2500);
 // tablet
 const B=await mk(800,1100);await B.goto('http://localhost:8811/');await B.waitForTimeout(700);
 await B.click('#oblang [data-l="ar"]');await B.waitForTimeout(300);await B.screenshot({path:'J1.png'});
 await B.click('#objoin');await B.waitForTimeout(400);await B.fill('#jem','shop@test.com');await B.fill('#jpw','wrong');await B.click('#jgo');await B.waitForTimeout(800);await B.screenshot({path:'J2.png'});
 await B.fill('#jpw','secret1');await B.click('#jgo');await B.waitForTimeout(2500);await B.screenshot({path:'J3.png'});
 console.log(await B.evaluate(()=>({ws:DB.ws&&DB.ws.name,jobs:DB.jobs.length,users:DB.users.map(u=>u.name),st:SYNC.status,on:SYNC.on})));
 await B.click('.person').catch(()=>{});await key(B,'1234');await B.waitForTimeout(500);
 await B.evaluate(()=>{DB.customers.push({id:'tab1',name:'From tablet',t:Date.now()});save();});await B.waitForTimeout(1500);
 console.log('A sees',await A.evaluate(()=>!!DB.customers.find(c=>c.id==='tab1')),errs);await b.close();})();
