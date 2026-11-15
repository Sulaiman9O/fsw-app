/* discount on labour only or on everything; empty / 0 removes it; invoice says "on labour" */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
await p.goto('http://localhost:8811/');await p.waitForTimeout(700);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();
const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwdemo').catch(()=>{});await p.click('#nwl').catch(()=>{});
const jid=await p.evaluate(()=>{try{langSet('ar');}catch(e){}const j=DB.jobs.find(j=>!isInvoiced(j));j.items=[{k:'labour',d:'Link Rod Replace',q:1,p:4},{k:'labour',d:'Brake service',q:1,p:13},{k:'part',d:'Link',q:2,p:12.968,cost:12.968},{k:'part',d:'Boot',q:1,p:16.8,cost:16.8}];j.disc=0;delete j.discPct;save();go('job',{id:j.id});return j.id;});await p.waitForTimeout(400);
const T=()=>p.evaluate(id=>{const t=jobTotals(byId('jobs',id));return {disc:t.disc,total:t.total};},jid);
const setD=async(on,pc,am)=>{await p.click('#jdisc');await p.waitForTimeout(200);if(on)await p.click(`[data-don="${on}"]`);await p.fill('#dpc',pc);await p.fill('#dam',am);await p.click('#dok');await p.waitForTimeout(300);};
await setD('labour','10','');let t=await T();ok(t.disc===1.7&&t.total===58.036,'1. 10% on labour (17) = 1.700, total 58.036 (of 59.736): '+JSON.stringify(t));
await p.screenshot({path:'/tmp/claude-0/-home-claude/f4d7ebf3-778c-5d50-a163-5dcd8e8292ed/scratchpad/disc1.png'});
await setD('all','10','');t=await T();ok(t.disc===5.974,'2. 10% on all (59.736) = 5.974: '+JSON.stringify(t));
await setD('labour','','5');t=await T();ok(t.disc===5,'3. amount 5 on labour: '+JSON.stringify(t));
await setD('labour','','30');t=await T();ok(t.disc===17,'4. amount over labour is capped at labour 17: '+JSON.stringify(t));
await setD(null,'0','0');t=await T();const j=await p.evaluate(id=>{const j=byId('jobs',id);return {disc:j.disc,pc:j.discPct,on:j.discOn};},jid);ok(t.disc===0&&!j.pc&&!j.on,'5. zero removes it: '+JSON.stringify(j));
await setD('labour','15','');await p.click('#jdisc');await p.waitForTimeout(200);const pressed=await p.getAttribute('[data-don="labour"]','aria-pressed');await p.click('[data-close]');ok(pressed==='true','6. sheet reopens remembering "on labour"');
const inv=await p.evaluate(id=>{const j=byId('jobs',id);return invoiceModern(j);},jid);ok(/خصم على الأجور|Discount on labour/.test(inv),'7. invoice says discount on labour');
await setD(null,'','');t=await T();ok(t.disc===0,'8. both empty removes it');
console.log('errors',JSON.stringify(errs));ok(!errs.length,'no page errors');console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
