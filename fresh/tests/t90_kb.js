const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await p.waitForTimeout(300);
 await p.locator('body').click({position:{x:5,y:5}});await p.keyboard.type('12');await p.keyboard.press('Backspace');await p.keyboard.type('234');await p.waitForTimeout(300);await p.keyboard.type('1234');await p.waitForTimeout(900);
 console.log(await p.evaluate(()=>({r:S.r,user:S.user&&S.user.name})));console.log('errors',errs);await b.close();})();
