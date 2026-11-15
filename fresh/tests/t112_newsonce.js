/* What's new opens once after an update, however it is closed */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
await p.goto('http://localhost:8811/');await p.waitForTimeout(700);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();
const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
const cnt=async()=>p.evaluate(()=>{const before=!!$('#sheet');closeSheet();DB.seenNews='2.30.0';save();showNewsPrompt();const a=!!$('#sheet h3')&&/New in version/.test($('#sheet h3').textContent);return a;});
for(const how of ['back','outside','tour']){ok(await cnt(),how+': opens after update');
 if(how==='back')await p.evaluate(()=>back());if(how==='outside')await p.evaluate(()=>closeSheet());if(how==='tour'){await p.click('#nwnew');await p.waitForTimeout(300);await p.evaluate(()=>{try{tourEnd&&tourEnd();}catch(e){}closeSheet();});}
 await p.waitForTimeout(200);ok(await p.evaluate(()=>{showNewsPrompt();const s=!!$('#sheet h3')&&/New in version/.test($('#sheet h3').textContent);closeSheet();return !s;}),how+': not again next time');}
console.log('errors',JSON.stringify(errs));ok(!errs.length,'no page errors');console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
