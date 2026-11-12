const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const W=+process.argv[2]||1920,H=+process.argv[3]||1000;const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';DB.ws.theme='dark';langApply();
   const now0=Date.now();DB.jobs.slice(-8).forEach((j,i)=>{j.stage=i%2?'work':'new';j.t=now0-i*3600e3;});save();window.toast=()=>{};document.querySelectorAll('#tour,.tb').forEach(x=>x.remove());},[cat,cu]);
 const shots=[['home',{}],['work',{}],['customers',{}],['stock',{}],['more',{}],['job',null],['counter',{}]];
 for(const [r,a] of shots){if(r==='job')await p.evaluate(()=>go('job',{id:DB.jobs.at(-1).id}));else await p.evaluate(([r,a])=>go(r,a),[r,a]);await p.waitForTimeout(600);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));await p.screenshot({path:`d_${W}_${r}.png`});}
 await b.close();})();
