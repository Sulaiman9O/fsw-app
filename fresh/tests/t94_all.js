const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const W=1366,H=768;const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();save();window.toast=()=>{};},[cat,cu]);
 const R=process.argv.slice(2);
 for(const r of R){await p.evaluate(r=>{const a={};if(r==='part')a.id=DB.parts[0].id;if(r==='custd')a.id=DB.customers[3].id;if(r==='inv')a.id=DB.jobs.find(j=>j.inv).id;go(r,a);},r);await p.waitForTimeout(500);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));
  const info=await p.evaluate(()=>[...document.querySelector('#main').children].map(e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className?'.'+String(e.className).split(' ').join('.'):'')).join(' | ').slice(0,300));console.log(r+': '+info);
  await p.screenshot({path:`a_${r}.png`});}
 await b.close();})();
