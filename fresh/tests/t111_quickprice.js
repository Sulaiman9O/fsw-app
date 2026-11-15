/* price typed straight in the item menu (tap and long-press strip), with undo; worker cannot lower a stock part price */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
await p.goto('http://localhost:8811/');await p.waitForTimeout(700);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();
const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwdemo').catch(()=>{});await p.click('#nwl').catch(()=>{});
await p.evaluate(()=>{try{langSet('ar');}catch(e){DB.ws.lang='ar';}save();render();});
const jid=await p.evaluate(()=>{const j=DB.jobs.find(j=>!isInvoiced(j)&&j.items.some(i=>i.k!=='part'&&+i.p>0));go('job',{id:j.id});return j.id;});await p.waitForTimeout(600);
const li=await p.evaluate(id=>byId('jobs',id).items.findIndex(i=>i.k!=='part'&&+i.p>0),jid);const p0=await p.evaluate(([id,i])=>+byId('jobs',id).items[i].p,[jid,li]);
await p.locator(`[data-it="${li}"] b`).first().click();await p.waitForTimeout(500);await p.screenshot({path:'/tmp/claude-0/-home-claude/f4d7ebf3-778c-5d50-a163-5dcd8e8292ed/scratchpad/qprice.png'});
ok(await p.isVisible('#lpp'),'1. price box in the menu');await p.fill('#lpp','17');await p.click('#lppok');await p.waitForTimeout(400);
ok(await p.evaluate(([id,i])=>+byId('jobs',id).items[i].p,[jid,li])===17,'2. price saved 17');ok(!(await p.isVisible('#sheet')),'3. menu closed');
const lg=await p.evaluate(id=>byId('jobs',id).log.slice(-1)[0][1],jid);console.log(lg);ok(/was/.test(lg),'4. log has old price');
await p.screenshot({path:'/tmp/claude-0/-home-claude/f4d7ebf3-778c-5d50-a163-5dcd8e8292ed/scratchpad/qprice2.png'});
await p.click('#undob button');await p.waitForTimeout(300);ok(await p.evaluate(([id,i])=>+byId('jobs',id).items[i].p,[jid,li])===p0,'5. undo back to '+p0);
/* Enter key */
await p.locator(`[data-it="${li}"] b`).first().click();await p.waitForTimeout(400);await p.fill('#lpp','8.5');await p.press('#lpp','Enter');await p.waitForTimeout(300);ok(await p.evaluate(([id,i])=>+byId('jobs',id).items[i].p,[jid,li])===8.5,'6. Enter saves');
/* long press strip */
const r=p.locator(`[data-it="${li}"]`);const bb=await r.locator("b").first().boundingBox();await p.mouse.move(bb.x+20,bb.y+10);await p.mouse.down();await p.waitForTimeout(700);await p.mouse.up();await p.waitForTimeout(300);
ok(await p.isVisible('#qs #lpp'),'7. price box in the long-press strip');await p.fill('#qs #lpp','9');await p.click('#qs #lppok');await p.waitForTimeout(300);ok(await p.evaluate(([id,i])=>+byId('jobs',id).items[i].p,[jid,li])===9,'8. strip saves 9');ok(!(await p.isVisible('#qs')),'9. strip closed');
/* worker cannot lower a stock part */
const pi=await p.evaluate(id=>byId('jobs',id).items.findIndex(i=>i.k==='part'&&i.ref&&byId('parts',i.ref)&&+byId('parts',i.ref).price>1),jid);
if(pi>=0){await p.evaluate(()=>{window._cd=can.discount;can.discount=()=>false;});await p.locator(`[data-it="${pi}"] b`).first().click();await p.waitForTimeout(400);const base=await p.evaluate(([id,i])=>+byId('parts',byId('jobs',id).items[i].ref).price,[jid,pi]);
 if(await p.isVisible('#lpp')){await p.fill('#lpp','0.1');await p.click('#lppok');await p.waitForTimeout(300);ok(await p.evaluate(([id,i])=>+byId('jobs',id).items[i].p,[jid,pi])>=base-0.0005,'10. worker cannot go below '+base);}else ok(true,'10. locked price: no box');await p.evaluate(()=>{can.discount=window._cd;closeSheet();});}
console.log('errors',JSON.stringify(errs));ok(!errs.length,'no page errors');console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
