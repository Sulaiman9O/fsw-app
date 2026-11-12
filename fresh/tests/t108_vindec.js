const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:868},colorScheme:'dark'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());let online=true;
 await p.route('**/vpic.nhtsa.dot.gov/**',r=>{if(!online)return r.abort();const vin=r.request().url().split('/').pop().split('?')[0];
   const db={'4T1BF1FK1FU957241':{Make:'TOYOTA',Model:'Camry',ModelYear:'2015',DisplacementL:'2.5',EngineCylinders:'4',EngineModel:'2AR-FE',Trim:'',BodyClass:'Sedan/Saloon',ErrorCode:'0'}};
   r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({Results:[db[vin]||{Make:'',ErrorCode:'11'}]})});});
 const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 await p.evaluate(()=>{DB.ws.lang='ar';S.user.lang='ar';langApply();DB.customers.push({id:'c9',name:'Old',phone:'91'});DB.vehicles.push({id:'v9',cust:'c9',make:'Nissan',model:'Patrol',year:'2018',engine:'5.6L V8 · VK56VD',vin:'JN8AY2NY0J9123456'});save();go('newjob');document.querySelectorAll('#tour').forEach(x=>x.remove());});await p.waitForTimeout(400);
 /* 1: typed VIN, online */
 await p.fill('#nplate','5 A');await p.locator('#nvin').pressSequentially('4T1BF1FK1FU957241',{delay:5});await p.waitForTimeout(800);
 let N=await p.evaluate(()=>({make:S.p.n.make,model:S.p.n.model,year:S.p.n.year,engine:S.p.n.engine,plate:S.p.n.plate,note:(document.querySelector('.vinnote')||{}).innerText}));console.log(N);
 ok(N.make==='Toyota'&&N.model==='Camry'&&N.year==='2015'&&/2AR-FE/.test(N.engine)&&N.plate==='5 A','online: Toyota Camry 2015 2AR-FE, plate kept');await p.screenshot({path:'vd1.png'});
 /* 2: offline, learned from own cars */
 online=false;await p.evaluate(()=>{localStorage.removeItem('ws_vinc');S.p.n=null;go('newjob');});await p.waitForTimeout(300);
 await p.locator('#nvin').pressSequentially('JN8AY2NY5K9654321',{delay:5});await p.waitForTimeout(800);
 N=await p.evaluate(()=>({make:S.p.n.make,model:S.p.n.model,year:S.p.n.year,engine:S.p.n.engine,note:(document.querySelector('.vinnote')||{}).innerText}));console.log(N);ok(N.make==='Nissan'&&N.model==='Patrol'&&/VK56/.test(N.engine),'offline: learned Nissan Patrol from own cars');
 /* 3: conflict → button */
 online=true;await p.evaluate(()=>{S.p.n=null;go('newjob');});await p.waitForTimeout(300);await p.evaluate(()=>{S.p.n.make='Nissan';S.p.n.model='Sunny';render();});await p.waitForTimeout(200);
 await p.locator('#nvin').pressSequentially('4T1BF1FK1FU957241',{delay:5});await p.waitForTimeout(800);
 ok(!!(await p.$('[data-vinforce]')),'different car chosen → «use this car» button');await p.screenshot({path:'vd2.png'});await p.click('[data-vinforce]');await p.waitForTimeout(300);
 N=await p.evaluate(()=>({make:S.p.n.make,model:S.p.n.model,year:S.p.n.year,engine:S.p.n.engine}));ok(N.make==='Toyota'&&N.model==='Camry','button replaces with the VIN car');
 /* 4: edit-car sheet */
 await p.evaluate(()=>go('custd',{id:'c9'}));await p.waitForTimeout(300);await p.click('[data-ve2="v9"]');await p.waitForTimeout(300);await p.fill('#vv','');await p.locator('#vv').pressSequentially('4T1BF1FK1FU957241',{delay:5});await p.waitForTimeout(800);
 const d=await p.evaluate(()=>({m:$('#vm').value,mo:$('#vmo').value,vv:$('#vv').value,note:(document.querySelector('#sheet .vinnote')||{}).innerText}));console.log(d);ok(/4T1BF1FK1FU957241/.test(d.vv)&&!!d.note,'car sheet shows what the VIN is');
 console.log('errors',errs);await b.close();})();
