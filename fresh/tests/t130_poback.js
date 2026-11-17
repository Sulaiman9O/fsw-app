/* order page: back after changes asks; "don't save" puts the order back; "save" keeps; no changes → no question; new part needs a category, guessed from the name */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));
 const oid=await p.evaluate(cat=>{DB.parts=cat.parts;DB.pcats=['Engine oil','Oil filters','Gearbox oil','Gearbox filters','Differential oil','Coolant','Brake fluid','Additives','Bulbs','Gaskets','Cleaners'];DB.vendors.push({id:'dv1',name:'Rayyan',t:now()},{id:'dv2',name:'Other',t:now()});const o=newPo('dv1',[{part:DB.parts[0].id,q:10,cost:3.41}]);save();go('vendors');go('po',{id:o.id});return o.id;},cat);await p.waitForTimeout(300);
 const st=()=>p.evaluate(id=>JSON.stringify(byId('pos',id).items.map(i=>[i.q,i.cost])),oid);
 /* no change → back goes straight out */
 await p.evaluate(()=>back());await p.waitForTimeout(300);ok(await p.evaluate(()=>S.r)==='vendors'&&!(await p.$('#plno')),'no changes: back leaves without asking');
 /* change qty and price, back → don't save */
 await p.evaluate(id=>go('po',{id}),oid);await p.waitForTimeout(300);await p.click('[data-q="0|1"]');await p.waitForTimeout(150);
 await p.click('[data-ol="0"] b');await p.waitForTimeout(300);await p.fill('#olc','9');await p.click('#olok');await p.waitForTimeout(300);
 ok(await st()==='[[11,9]]','changed to 11 × 9');await p.evaluate(()=>back());await p.waitForTimeout(300);ok(await p.$('#plno'),'back asks: save the changes?');
 await p.click('#plno');await p.waitForTimeout(300);ok(await st()==='[[10,3.41]]'&&await p.evaluate(()=>S.r)==='vendors',"don't save → back to 10 × 3.410");
 /* change, back → keep editing, then save */
 await p.evaluate(id=>go('po',{id}),oid);await p.waitForTimeout(300);await p.click('[data-q="0|1"]');await p.waitForTimeout(150);await p.evaluate(()=>back());await p.waitForTimeout(300);await p.click('#plk');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>S.r)==='po'&&await st()==='[[11,3.41]]','keep editing stays on the order');await p.evaluate(()=>back());await p.waitForTimeout(300);await p.click('#plsv');await p.waitForTimeout(300);
 ok(await st()==='[[11,3.41]]'&&await p.evaluate(()=>S.r)==='vendors','save keeps 11');
 /* supplier changed, don't save → supplier back */
 await p.evaluate(id=>go('po',{id}),oid);await p.waitForTimeout(300);await p.evaluate(id=>{byId('pos',id).vendor='dv2';save();render();},oid);await p.evaluate(()=>back());await p.waitForTimeout(300);await p.click('#plno');await p.waitForTimeout(300);
 ok(await p.evaluate(id=>byId('pos',id).vendor,oid)==='dv1','supplier put back');
 /* new part: category required, guessed from the name */
 await p.evaluate(()=>partSheet(null));await p.waitForTimeout(400);ok(await p.inputValue('#pcat')==='','new part starts with no category');
 await p.fill('#pn','Mann Oil Filter HU 7025 z');await p.waitForTimeout(150);ok(await p.inputValue('#pcat')==='Oil filters','name with "filter" → Oil filters');
 ok(await p.evaluate(()=>document.querySelector('#ppkw').hidden),'no litres box for a filter');
 await p.fill('#pn','Shell 5W-30 4L');await p.waitForTimeout(150);ok(await p.inputValue('#pcat')==='Engine oil'&&!(await p.evaluate(()=>document.querySelector('#ppkw').hidden)),'5W-30 → Engine oil with the litres box');
 await p.evaluate(()=>closeSheet());await p.evaluate(()=>partSheet(null));await p.waitForTimeout(400);await p.fill('#pn','Something');await p.click('#pok');await p.waitForTimeout(200);ok(await p.$('#sheet')&&!(await p.evaluate(()=>DB.parts.some(x=>x.name==='Something'))),'save without a category is stopped');
 ok(!errs.length,'no page errors '+errs.join('|'));console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
