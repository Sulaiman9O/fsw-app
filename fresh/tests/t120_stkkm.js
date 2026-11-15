/* a job with no km: the sticker sheet asks for the km, will not print without it, and the next km follows once typed */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
await p.goto('http://localhost:8811/');await p.waitForTimeout(700);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();
const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwdemo').catch(()=>{});await p.click('#nwl').catch(()=>{});
const jid=await p.evaluate(()=>{const j=DB.jobs.find(j=>!isInvoiced(j));j.km=0;j.rems=[{kind:'oil',name:'',mo:6,km:10000,on:true}];save();go('job',{id:j.id});window._pr=[];printSticker3=(t,d,rb,done)=>{window._pr.push(d);done&&done();};return j.id;});await p.waitForTimeout(400);
await p.evaluate(id=>stickerSheet(byId('jobs',id)),jid);await p.waitForTimeout(400);
ok(await p.isVisible('#skm'),'1. "Km now" field shows when the job has no km');
await p.click('#sgo3');await p.waitForTimeout(300);ok((await p.evaluate(()=>window._pr.length))===0,'2. print refused without km');
await p.fill('#skm','219981');await p.waitForTimeout(800);
const nk=await p.inputValue('#snk');ok(/229,?981/.test(nk),'3. next km follows: '+nk);
const jk=await p.evaluate(id=>({j:byId('jobs',id).km,v:vehOf(byId('jobs',id)).km}),jid);ok(jk.j===219981,'4. km kept on the job '+JSON.stringify(jk));
await p.click('#sgo3');await p.waitForTimeout(300);const pr=await p.evaluate(()=>window._pr);ok(pr.length===1&&pr[0].nextKm===229981&&pr[0].km===219981,'5. sticker printed with next km 229,981: '+JSON.stringify(pr[0]&&{n:pr[0].nextKm,k:pr[0].km}));
await p.evaluate(id=>stickerSheet(byId('jobs',id)),jid);await p.waitForTimeout(300);ok(!(await p.isVisible('#skm')),'6. with km, no km field');await p.evaluate(()=>closeSheet());
console.log('errors',JSON.stringify(errs));ok(!errs.length,'no page errors');console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
