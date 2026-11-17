/* a new part has no "In stock" box: it starts at 0 and goes in when the order is received; editing a part still shows stock */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 await p.evaluate(()=>{DB.vendors.push({id:'dV1',name:'German Parts',phone:'91234567',t:now()});save();go('vendors');});await p.waitForTimeout(300);
 await p.click('#poadd');await p.waitForTimeout(300);await p.click('#poadd');await p.waitForTimeout(300);await p.click('#sptop');await p.waitForTimeout(300);
 ok(!(await p.$('#pst')),'new part: no In stock box');ok(/Received/.test(await p.textContent('.sheet')),'hint says stock goes in on Received');
 await p.fill('#pn','Mann Oil Filter HU 7020 z Mercedes');await p.selectOption('#pcat','Oil filters');await p.fill('#ppr','5');const co=await p.$('#pco');if(co)await p.fill('#pco','3.41');
 await p.click('#pok');await p.waitForTimeout(400);
 const r1=await p.evaluate(()=>{const pt=DB.parts.find(x=>/HU 7020/.test(x.name));const o=DB.pos[DB.pos.length-1];o.items[0].q=10;save();return {stock:+pt.stock||0,inOrder:o.items.length,moves:(DB.moves||[]).filter(m=>m.part===pt.id).length};});
 ok(r1.stock===0&&r1.inOrder===1&&r1.moves===0,'part saved with 0 stock and is in the order '+JSON.stringify(r1));
 await p.evaluate(()=>render());await p.waitForTimeout(200);await p.click('#porec');await p.waitForTimeout(300);const cf=await p.$('.sheet .btn');if(cf)await cf.click();await p.waitForTimeout(400);
 const r2=await p.evaluate(()=>{const pt=DB.parts.find(x=>/HU 7020/.test(x.name));return +pt.stock;});ok(r2===10,'after Received: stock 10 (not 20) → '+r2);
 await p.evaluate(()=>partSheet(DB.parts.find(x=>/HU 7020/.test(x.name))));await p.waitForTimeout(300);ok(await p.$('.stkro'),'editing the part shows stock (read-only)');
 await p.click('#pok');await p.waitForTimeout(300);ok(await p.evaluate(()=>+DB.parts.find(x=>/HU 7020/.test(x.name)).stock)===10,'saving the edit keeps 10');
 ok(!errs.length,'no page errors '+errs.join('|'));console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
