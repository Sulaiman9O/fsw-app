const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2,hasTouch:false});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(500);
 const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);ok(!!(await p.$('#intro')),'opening animation shows');await p.screenshot({path:'in1.png'});await p.waitForTimeout(1700);ok(!(await p.$('#intro')),'opening gone');
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.fill('#obn','Fast Service World');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';DB.ws.phone='99112233';DB.ws.addr='الصناعية - إبراء';S.user.lang='ar';langApply();save();go('invstyle');},[cat,cu]);await p.waitForTimeout(600);
 /* draw a signature */
 await p.click('#sgdraw');await p.waitForTimeout(400);const c=await p.$('#sgc');const bb=await c.boundingBox();await p.mouse.move(bb.x+30,bb.y+120);await p.mouse.down();for(let i=0;i<30;i++){await p.mouse.move(bb.x+30+i*9,bb.y+120-Math.sin(i/3)*50);}await p.mouse.up();await p.click('#sgok');await p.waitForTimeout(500);
 ok(await p.evaluate(()=>!!DB.ws.sig&&invS().sig===1),'signature saved');
 await p.click('#stmk');await p.waitForTimeout(400);await p.fill('#sta','ورشة عالم الخدمات السريعة');await p.click('[data-ink="#C8282B"]');await p.click('#stok');await p.waitForTimeout(500);ok(await p.evaluate(()=>!!DB.ws.stamp&&invS().stamp===1),'stamp saved');
 ok(!!(await p.$('#ipv .iv2-seal img[data-sd="s"]'))&&!!(await p.$('#ipv .iv2-seal img[data-sd="t"]')),'both on the preview');
 const im=await p.$('#ipv img[data-sd="t"]');await im.scrollIntoViewIfNeeded();const ib=await im.boundingBox();await p.mouse.move(ib.x+ib.width/2,ib.y+ib.height/2);await p.mouse.down();await p.mouse.move(ib.x+ib.width/2-80,ib.y+ib.height/2+10,{steps:8});await p.mouse.up();await p.waitForTimeout(300);
 const pos=await p.evaluate(()=>invS().pos.t);console.log(JSON.stringify(pos));ok(pos.x<58,'stamp moved by dragging');
 const html=await p.evaluate(()=>invoiceHtml(invSample()));ok(!/[\u{1F300}-\u{1FAFF}●✓]/u.test(html.replace(/data:[^"]*/g,'')),'no emoji in the invoice');
 await p.evaluate(()=>document.querySelectorAll('#toast,#undob').forEach(x=>x.hidden=true));const pv=await p.$('#ipv');await pv.scrollIntoViewIfNeeded();await pv.screenshot({path:'seal.png'});
 /* long-press strip: scrolling it does not close it */
 await p.evaluate(()=>{const v=DB.vehicles.find(v=>v.plate&&/31838/.test(v.plate));go('counter',{vid:v.id});});await p.waitForTimeout(400);await p.click('#coil');await p.waitForTimeout(400);
 const it=await p.locator('[data-it="0"]').boundingBox();await p.mouse.move(it.x+it.width/2,it.y+it.height/2);await p.mouse.down();await p.waitForTimeout(700);await p.mouse.up();await p.waitForTimeout(400);
 ok(!!(await p.$('#qs')),'strip open');await p.evaluate(()=>{const r=document.querySelector('#qs .qs-row');r.scrollLeft=200;r.dispatchEvent(new Event('scroll'));});await p.waitForTimeout(400);ok(!!(await p.$('#qs')),'strip stays after sliding');
 console.log('errors',errs);await b.close();})();
