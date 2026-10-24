const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const W=+process.argv[2]||400;const p=await b.newPage({viewport:{width:W,height:W>700?820:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='en';S.user.lang='en';langApply();
   const bf=DB.services.find(s=>s.name==='Brake Fluid Flush');bf.rem={mo:24,km:40000};save();},[cat,cu]);
 /* a job like the photo: oil change, then ATF service, ATF fluid, spark plugs, brake flush, brake fluid — added in a mixed order */
 const jid=await p.evaluate(()=>{const v=DB.vehicles.find(v=>v.plate&&/31838/.test(v.plate));const j=newJobFor(v,'');applyOilRecipe(j,'usual');
   const S_=n=>{const s=DB.services.find(x=>x.name===n);j.items.push(svcItem(s,v));};const P_=(re,q)=>{const pt=DB.parts.find(x=>re.test(x.name));j.items.push({k:'part',ref:pt.id,d:pt.name,num:pt.num,q,u:'',p:+pt.price,cost:+pt.cost||0});};
   S_('ATF & Filter Change');P_(/brake fluid/i,4);P_(/WS A\/T/i,4);S_('Spark Plugs – 4 Cyl');S_('Brake Fluid Flush');save();return j.id;});
 await p.evaluate(id=>go('job',{id}),jid);await p.waitForTimeout(600);
 const order=await p.evaluate(()=>[...document.querySelectorAll('.jb-list .jb-r.it, .jb-list .jb-gh')].map(r=>(r.classList.contains('jb-sub')?'   └ ':r.classList.contains('jb-gh')?'## ':'')+r.innerText.split('\n')[0].slice(0,40)));console.log(order.join('\n'));
 const idx=n=>order.findIndex(x=>x.includes(n));ok(idx('WS A/T')===idx('ATF & Filter')+1&&order[idx('WS A/T')].startsWith('   └'),'ATF fluid under ATF service');ok(order[idx('Brake Fluid DOT')]&&order[idx('Brake Fluid DOT')].startsWith('   └')&&idx('Brake Fluid DOT')>idx('Brake Fluid Flush'),'brake fluid under brake flush');
 const rem=await p.evaluate(()=>[...document.querySelectorAll('.jrem [data-rm] b')].map(x=>x.innerText));console.log('reminders',rem);ok(rem.length===3,'oil + gearbox + brake flush reminders planned');
 await p.evaluate(()=>document.querySelectorAll('#toast,#undob').forEach(x=>x.hidden=true));await p.screenshot({path:'r1.png',fullPage:true});
 await p.click('#jrmadd');await p.waitForTimeout(300);await p.fill('#rmn','Tyre rotation');await p.click('[data-rq="3"]');await p.click('#rmok');await p.waitForTimeout(400);
 ok(await p.evaluate(id=>byId('jobs',id).rems.length===4,jid),'manual reminder added');
 await p.click('[data-rm="0"]');await p.waitForTimeout(300);await p.fill('#rkm','10000');await p.click('#rmok');await p.waitForTimeout(300);
 /* sticker preview */
 await p.click('#jstk');await p.waitForTimeout(400);const sp=await p.evaluate(()=>{const e=document.querySelector('#spv');return e?e.innerText.slice(0,80):'none';});console.log('sticker',sp);ok(sp!=='none'&&sp.length>5,'sticker preview shows');await p.screenshot({path:'r2.png'});await p.evaluate(()=>closeSheet());await p.waitForTimeout(300);
 await p.click('#jpay');await p.waitForTimeout(300);await p.click('[data-pm="Cash"]');await p.waitForTimeout(600);
 const R=await p.evaluate(id=>DB.reminders.filter(r=>r.job===id).map(r=>[r.kind,r.name||'',r.dueKm,new Date(r.due).toISOString().slice(0,10)]),jid);console.log(JSON.stringify(R));ok(R.length===4,'4 reminders made on close');
 ok(await p.evaluate(()=>!!document.querySelector('.iv2-next')),'invoice next service');
 console.log('errors',errs);await b.close();})();
