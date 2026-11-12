const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1000}});await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();save();go('home');},[cat,cu]);await p.waitForTimeout(600);
 const w=process.argv[2];if(w)await p.evaluate(r=>go(r),w);await p.waitForTimeout(500);
 console.log(await p.evaluate(()=>{let e=document.querySelector('#main');const o=[];while(e&&e!==document.documentElement){const r=e.getBoundingClientRect(),cs=getComputedStyle(e);o.push((e.id||e.className||e.tagName)+' x'+Math.round(r.x)+' w'+Math.round(r.width)+' mw:'+cs.maxWidth+' m:'+cs.margin+' disp:'+cs.display);e=e.parentElement;}return o.join('\n');}));
 await p.screenshot({path:'w1.png',scale:'css'});await b.close();})();
