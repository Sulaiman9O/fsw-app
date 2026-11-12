const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const W=1536,H=864;const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H},colorScheme:'dark'});await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();inspSeed();const j=DB.jobs.find(x=>isInvoiced(x));inspStart(j,DB.insp[0]);j.insp.r[0]='ok';j.insp.r[4]='bad';save();window.toast=()=>{};},[cat,cu]);
 const R=process.argv.slice(2);
 for(const r of R){await p.evaluate(r=>{const a={};const J=DB.jobs.find(x=>x.insp);if(r==='part')a.id=DB.parts[0].id;if(r==='inspr'||r==='inspj')a.id=J.id;if(r==='po'&&DB.pos&&DB.pos[0])a.id=DB.pos[0].id;if(r==='list')a.k='makes';if(r==='pkg'&&DB.pkgs&&DB.pkgs[0])a.id=DB.pkgs[0].id;go(r,a);},r);await p.waitForTimeout(500);
  if(r==='quote'){await p.fill('#qq','camry');await p.waitForTimeout(500);}
  await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));await p.screenshot({path:`b_${r}.png`});console.log(r+': '+await p.evaluate(()=>[...document.querySelector('#main').children].map(e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className?'.'+String(e.className).split(' ').join('.'):'')).join(' | ')));}
 await b.close();})();
