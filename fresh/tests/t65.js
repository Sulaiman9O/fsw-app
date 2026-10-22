const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();},[cat,cu]);
 await p.addStyleTag({content:'#toast{display:none!important}'});
 const mk=()=>p.evaluate(()=>{const v=DB.vehicles.find(v=>/camry/i.test(v.model)&&v.year=='2015');const j={id:uid('j'),no:DB.ws.nextJob++,cust:v.cust,veh:v.id,km:150000,stage:'new',items:[],disc:0,t:now(),log:[],pays:[]};DB.jobs.push(j);save();go('job',{id:j.id});return j.id;});
 const jid=await mk();await p.waitForTimeout(400);
 await p.click('#jinsp');await p.waitForTimeout(300);ok(await p.$$eval('[data-ti]',L=>L.length)>=3,'templates incl. new ones');await p.locator('[data-ti]').first().click();await p.waitForTimeout(400);
 ok(await p.evaluate(()=>S.r)==='inspj','inspection page opened');
 await p.locator('[data-iall]').first().click();await p.waitForTimeout(200);
 // front pads 2 mm → red
 const padI=await p.evaluate(()=>byId('jobs',S.p.id).insp.items.findIndex(n=>/front brake pads/i.test(n)));
 await p.fill(`[data-iv="${padI}"]`,'2');await p.locator(`[data-iv="${padI}"]`).dispatchEvent('change');await p.waitForTimeout(300);
 ok(await p.evaluate(i=>byId('jobs',S.p.id).insp.r[i],padI)==='bad','2 mm pads → red automatically');
 await p.fill(`[data-in="${padI}"]`,'متآكلة من الداخل');await p.locator(`[data-in="${padI}"]`).dispatchEvent('change');
 const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click(`[data-ipa="${padI}"]`)]);await fc.setFiles('logo.png');await p.waitForTimeout(600);
 ok(await p.evaluate(i=>(byId('jobs',S.p.id).insp.d[i].ph||[]).length===1&&DB.photos.length===1,padI),'photo saved');
 const hasAdd=!!(await p.$(`[data-iadd="${padI}"]`));ok(hasAdd,'linked service button on red pads');
 if(hasAdd){await p.click(`[data-iadd="${padI}"]`);await p.waitForTimeout(300);ok(await p.evaluate(()=>byId('jobs',S.p.id).items.some(i=>i.fromInsp)),'service added to the job');}
 // yellow wipers with reminder
 const wI=await p.evaluate(()=>byId('jobs',S.p.id).insp.items.findIndex(n=>/wiper/i.test(n)));await p.click(`[data-is="${wI}:warn"]`);await p.waitForTimeout(300);await p.click(`[data-irem="${wI}:3m"]`);await p.waitForTimeout(300);
 await p.screenshot({path:'i1.png',fullPage:true});
 await p.click('#irep');await p.waitForTimeout(400);await p.screenshot({path:'i2.png',fullPage:true});ok(await p.evaluate(()=>document.querySelector('.irep')!==null),'report page');
 const txt=await p.evaluate(()=>inspReportText(byId('jobs',S.p.id)));console.log(txt.split('\n').slice(0,12).join(' / '));
 await p.evaluate(()=>back());await p.waitForTimeout(300);await p.click('#idone');await p.waitForTimeout(300);
 const R=await p.evaluate(()=>{const j=byId('jobs',S.p.id);return {r:S.r,rem:DB.reminders.filter(r=>r.job===j.id).map(r=>r.name),log:j.log.map(l=>l[1]).join(' | ')};});ok(R.r==='job'&&R.rem.length===1,'reminder for yellow item '+JSON.stringify(R.rem));
 await p.screenshot({path:'i3.png'});
 // next visit shows last result
 await mk();await p.waitForTimeout(300);await p.click('#jinsp');await p.waitForTimeout(300);await p.locator('[data-ti]').first().click();await p.waitForTimeout(400);
 ok(await p.$$eval('.pv',L=>L.length)>=2,'last visit shown on items');await p.screenshot({path:'i4.png'});
 // old-format inspection still opens
 const old=await p.evaluate(()=>{const j=DB.jobs.find(x=>x.id!==S.p.id);j.insp={name:'Old',items:['A','B'],r:{0:'bad'}};go('inspj',{id:j.id});return document.querySelectorAll('.ii').length;});ok(old===2,'old inspections open');
 console.log('errors',errs);await b.close();})();
