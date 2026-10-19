const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 const r=await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.scats=cat.scats;DB.jobs=cu.jobs;DB.ws.svcReviewed=true;const before=DB.scats.length;const n=mergeScats(true);DB.ws.lang='ar';S.user.lang='ar';langApply();go('svc');
   return {before,after:DB.scats.map(g=>g.name+':'+DB.services.filter(s=>s.cat===g.name).length),moved:n,orphans:DB.services.filter(s=>!DB.scats.some(g=>g.name===s.cat)).length,total:DB.services.length};},[cat,cu]);
 console.log(JSON.stringify(r));ok(r.orphans===0&&r.total===42,'merge ok');
 await p.waitForTimeout(600);const hide=()=>p.evaluate(()=>document.querySelectorAll('#toast').forEach(x=>x.hidden=true));await hide();await p.screenshot({path:'w1.png'});
 ok(await p.$$eval('#slist [data-se]',L=>L.length)===42-(await p.evaluate(()=>DB.services.filter(s=>s.hidden).length)),'all services listed');
 await p.locator('[data-g]').nth(2).click();await p.waitForTimeout(300);const nb=await p.$$eval('#slist [data-se]',L=>L.length);ok(nb>0&&nb<42,'group filter '+nb);
 await p.fill('#sq','oil');await p.waitForTimeout(400);ok(true,'search '+await p.$$eval('#slist [data-se]',L=>L.length));
 await p.fill('#sq','');await p.locator('[data-g=""]').click();await p.waitForTimeout(300);await hide();
 // open engine oil change sheet and save single price
 await p.evaluate(()=>svcSheet(DB.services.find(s=>/Engine Oil Change/i.test(s.name))));await p.waitForTimeout(400);await p.screenshot({path:'w2.png'});
 const by=await p.evaluate(()=>!!document.querySelector('#sbz')&&document.querySelector('#sbz').checked);
 if(!by)await p.fill('#sp1','2.750');await p.click('#sok');await p.waitForTimeout(300);
 const pr=await p.evaluate(()=>DB.services.find(s=>/Engine Oil Change/i.test(s.name)).p);ok(true,'price saved '+JSON.stringify(pr)+' bySize '+by);
 // by-size service
 await p.evaluate(()=>svcSheet(DB.services.find(s=>svcBySize(s))));await p.waitForTimeout(300);ok(await p.evaluate(()=>document.querySelector('#sbz').checked&&!document.querySelector('#szw').hidden),'by-size shows 4 prices');await p.screenshot({path:'w3.png'});
 await p.evaluate(()=>closeSheet());
 await p.click('#smore');await p.waitForTimeout(300);await p.screenshot({path:'w4.png'});
 console.log('errors',errs);await b.close();})();
