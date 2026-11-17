/* leaving a Save sheet with unsaved changes asks; untouched sheets close; empty orders removed; supplier price kept without ＋ */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const open=async()=>!!(await p.$('#sheet'));const ask=async()=>!!(await p.$('.leaveask'));
 /* 1 untouched sheet: back closes */
 await p.evaluate(()=>vendorSheet());await p.waitForTimeout(500);await p.evaluate(()=>back());await p.waitForTimeout(200);ok(!(await open()),'untouched sheet closes on back');
 /* 2 typed, back → ask; keep editing */
 await p.evaluate(()=>vendorSheet());await p.waitForTimeout(500);await p.fill('#vn','Rayyan');await p.evaluate(()=>back());await p.waitForTimeout(200);
 ok(await open()&&await ask(),'typed + back → asks');await p.click('[data-la=k]');await p.waitForTimeout(150);ok(await open()&&!(await ask())&&(await p.inputValue('#vn'))==='Rayyan','keep editing keeps the text');
 /* 3 Close button → ask → don't save */
 await p.click('[data-close]');await p.waitForTimeout(150);ok(await ask(),'Close button also asks');await p.click('[data-la=d]');await p.waitForTimeout(200);
 ok(!(await open())&&!(await p.evaluate(()=>DB.vendors.some(v=>v.name==='Rayyan'))),"don't save → closed, nothing saved");
 /* 4 back → ask → Save */
 await p.evaluate(()=>vendorSheet());await p.waitForTimeout(500);await p.fill('#vn','Rayyan');await p.evaluate(()=>back());await p.waitForTimeout(200);await p.click('[data-la=s]');await p.waitForTimeout(300);
 ok(!(await open())&&await p.evaluate(()=>DB.vendors.some(v=>v.name==='Rayyan')),'Save from the question saves');
 /* 5 a second back while asking = keep editing */
 await p.evaluate(()=>vendorSheet(DB.vendors.find(v=>v.name==='Rayyan')));await p.waitForTimeout(500);await p.fill('#vph','99');await p.evaluate(()=>back());await p.waitForTimeout(150);await p.evaluate(()=>back());await p.waitForTimeout(150);ok(await open()&&!(await ask()),'back again closes the question, sheet stays');
 await p.click('[data-la=d]').catch(()=>{});await p.evaluate(()=>closeSheet());
 /* 6 sheet with no Save button closes straight away */
 await p.evaluate(()=>confirmSheet('Sure?','Yes',()=>{}));await p.waitForTimeout(300);await p.evaluate(()=>back());await p.waitForTimeout(150);ok(!(await open()),'sheet without Save closes on back');
 /* 7 empty order removed when the supplier list opens */
 await p.evaluate(()=>{go('vendors');});await p.waitForTimeout(200);await p.click('#poadd');await p.waitForTimeout(300);await p.evaluate(()=>back());await p.waitForTimeout(300);
 ok(await p.evaluate(()=>DB.pos.filter(o=>!(o.items||[]).length).length)===0,'empty order is removed');
 /* 8 supplier price typed without ＋ is kept on Save */
 await p.evaluate(()=>partSheet(null));await p.waitForTimeout(400);await p.fill('#pn','Test Filter X1');await p.evaluate(()=>{const d=document.querySelector('.pmore');if(d)d.open=true;});
 const hasVp=!!(await p.$('#pvv'));if(hasVp){await p.selectOption('#pvv',{index:0});await p.fill('#pvc','3.4');}
 await p.click('#pok');await p.waitForTimeout(300);
 ok(!hasVp||await p.evaluate(()=>{const x=DB.parts.find(q=>q.name==='Test Filter X1');return x&&Object.values(x.vprices||{}).some(v=>v.cost===3.4);}),'supplier price kept without pressing ＋');
 /* 9 Arabic */
 await p.evaluate(()=>{try{setLang('ar');}catch(e){DB.ws.lang='ar';}render();vendorSheet();});await p.waitForTimeout(500);await p.fill('#vn','ب');await p.evaluate(()=>back());await p.waitForTimeout(200);ok(await ask(),'asks in Arabic too: '+(await p.textContent('.leaveask').catch(()=>'')).slice(0,40));
 ok(!errs.length,'no page errors '+errs.join('|'));console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
