const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const W=+process.argv[2]||400;const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:868},colorScheme:'dark'});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const img=fs.readFileSync('car3.jpg').toString('base64');
 await p.evaluate(img=>{DB.ws.lang='ar';S.user.lang='ar';langApply();DB.customers.push({id:'c1',name:'Ali',phone:'99112233'},{id:'c2',name:'Saif',phone:'99445566'});
   DB.photos=[{id:'p1',veh:'v1',img:'data:image/jpeg;base64,'+img,t:1}];DB.vehicles.push({id:'v1',cust:'c1',make:'Toyota',model:'Camry',year:'2020',plate:'111 A',ph:['p1']},{id:'v2',cust:'c2',make:'Nissan',model:'Patrol',year:'2019',plate:'222 B'});
   DB.jobs.push({id:'j1',no:1,cust:'c1',veh:'v1',stage:'work',items:[],t:Date.now(),by:'S',log:[]},{id:'j2',no:2,cust:'c2',veh:'v2',stage:'new',items:[],t:Date.now()-1000,by:'S',log:[]});save();go('home');document.querySelectorAll('#tour').forEach(x=>x.remove());},img);await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.querySelectorAll('.car .cth').length===1&&document.querySelectorAll('.car').length===2),'home: picture on the car that has one, none on the other');await p.screenshot({path:'th1.png'});
 await p.evaluate(()=>go('work'));await p.waitForTimeout(300);ok(await p.evaluate(()=>document.querySelectorAll('.car .cth').length===1),'work list');
 await p.evaluate(()=>go('counter'));await p.waitForTimeout(300);await p.fill('#cq','111');await p.waitForTimeout(300);ok(await p.evaluate(()=>!!document.querySelector('[data-cv] .cth')),'counter search');await p.screenshot({path:'th2.png'});
 await p.click('[data-cv]');await p.waitForTimeout(300);ok(await p.evaluate(()=>!!document.querySelector('.ctrcar .cth')),'counter car card');await p.screenshot({path:'th3.png'});
 await p.evaluate(()=>go('search'));await p.waitForTimeout(300);const si=await p.$('#main input');if(si){await si.fill('Camry');await p.waitForTimeout(400);ok(await p.evaluate(()=>!!document.querySelector('[data-go^="custd"] .cth')),'search screen');}
 console.log('errors',errs);await b.close();})();
