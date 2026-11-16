/* suggested quote: an unticked line is kept when the sheet is closed and does not show in the customer's report (page and WhatsApp text); ticking it again brings it back */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;save();window.toast=()=>{};},[cat,cu]);
 await p.evaluate(()=>{const v=DB.vehicles.find(v=>/camry/i.test(v.model));go('counter',{vid:v.id});});await p.waitForTimeout(400);await p.fill('#ckm','120000');await p.click('#coil');await p.waitForTimeout(600);
 await p.evaluate(()=>{inspSeed();const j=byId('jobs',S.p.id);inspStart(j,DB.insp[1]);save();go('inspj',{id:j.id});});await p.waitForTimeout(500);
 /* two yellow/red checks that have a service */
 const two=await p.evaluate(()=>{const I=byId('jobs',S.p.id).insp;const out=[];I.items.forEach((n,i)=>{if(out.length<2&&(I.meta[i]||{}).svc)out.push(i);});return out;});
 await p.click(`[data-is="${two[0]}:bad"]`);await p.waitForTimeout(150);await p.click(`[data-is="${two[1]}:warn"]`);await p.waitForTimeout(150);
 const names=await p.evaluate(t=>t.map(i=>byId('jobs',S.p.id).insp.items[i]),two);
 const inRep=async()=>p.evaluate(n=>{const j=byId('jobs',S.p.id);const h=inspReportHtml(j);const rec=h.split('We recommend')[1]||'';return n.map(x=>rec.includes(x.replace(/&/g,'&amp;')));},names);
 ok((await inRep()).every(x=>x),'both in the report at first');
 await p.click('#idone');await p.waitForTimeout(500);
 ok(await p.$('[data-qc]'),'suggested quote opens after Done');
 ok(/(report|التقرير)/i.test(await p.textContent('.sheet .hint')),'hint says unticked lines leave the report');
 await p.uncheck(`[data-qc="${two[0]}"]`);await p.waitForTimeout(200);
 /* close with the X / back, not "add" */
 await p.evaluate(()=>closeSheet());await p.waitForTimeout(300);
 let r=await inRep();ok(r[0]===false&&r[1]===true,'unticked line gone from the report after Close, the other stays '+JSON.stringify(r));
 const wa=await p.evaluate(()=>{const j=byId('jobs',S.p.id);return typeof inspWaText==='function'?inspWaText(j):null;});
 /* open again: still unticked */
 await p.evaluate(()=>inspQuoteSheet(byId('jobs',S.p.id)));await p.waitForTimeout(300);
 ok(!(await p.isChecked(`[data-qc="${two[0]}"]`)),'still unticked when opened again');
 await p.check(`[data-qc="${two[0]}"]`);await p.waitForTimeout(200);await p.evaluate(()=>closeSheet());await p.waitForTimeout(200);
 r=await inRep();ok(r[0]===true,'ticked again: back in the report');
 /* the report screen itself */
 await p.evaluate(()=>inspQuoteSheet(byId('jobs',S.p.id)));await p.waitForTimeout(300);await p.uncheck(`[data-qc="${two[1]}"]`);await p.evaluate(()=>closeSheet());
 await p.evaluate(()=>go('inspr',{id:S.p.id}));await p.waitForTimeout(400);const txt=await p.textContent('.invwrap');
 ok(!txt.includes(names[1])||!txt.split(/We recommend/)[1]||!txt.split(/We recommend/)[1].includes(names[1]),'report screen leaves it out');
 ok(!errs.length,'no page errors '+errs.join('|'));console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
