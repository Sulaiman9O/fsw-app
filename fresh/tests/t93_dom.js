const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1000}});await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;save();},[cat,cu]);
 await p.evaluate(()=>{const n=Date.now();DB.jobs.slice(-8).forEach((j,i)=>{j.stage=i%2?'work':'new';j.t=n-i*3600e3;});save();});for(const r of ['home','work','custd','inv']){await p.evaluate(r=>{if(r==='job')go('job',{id:DB.jobs.at(-1).id});else if(r==='custd')go('custd',{id:DB.customers[5].id});else if(r==='inv')go('inv',{id:DB.jobs.find(j=>j.inv||j.no).id});else go(r);},r);await p.waitForTimeout(400);
  console.log('== '+r,await p.evaluate(()=>[...document.querySelector('#main').children].map(e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className?'.'+String(e.className).replace(/ /g,'.'):'')+'['+Math.round(e.getBoundingClientRect().height)+']').join(' | ')));}
 await b.close();})();
