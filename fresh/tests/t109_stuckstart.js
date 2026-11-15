/* TWO DEVICES: live edits, both editing the same job while offline, stock moved on both, delete, new customer made offline.
   Uses the fake Firebase (fbmock). Usage: node tsync.js */
const {chromium}=require('playwright');const M=require('./fbmock.js');
(async()=>{const b=await chromium.launch();const errs=[];const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
 const mk=async()=>{const ctx=await b.newContext({viewport:{width:412,height:900}});await M.attach(ctx);await ctx.addInitScript(M.init);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());return [ctx,p];};
 const key=async(p,s)=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const W=(P,ms)=>P.waitForTimeout(ms);
 let [ca,A]=await mk();await A.goto('http://localhost:8811/');await W(A,600);await A.fill('#obn','FSW');await A.locator('.btn').first().click();await A.locator('input.field').first().fill('S');await A.locator('.btn').first().click();await key(A,'1234');await key(A,'1234');await W(A,900);await A.click('#nwdemo');await A.click('#nwl').catch(()=>{});
 await A.evaluate(()=>go('settings'));await W(A,300);await A.fill('#syem','shop@test.com');await A.fill('#sypw','secret1');await A.click('#syin');await W(A,2500);
 let [cb,B]=await mk();await B.goto('http://localhost:8811/');await W(B,600);await B.click('#objoin');await B.fill('#jem','shop@test.com');await B.fill('#jpw','secret1');await B.click('#jgo');await W(B,2500);await B.click('.person').catch(()=>{});await key(B,'1234');await W(B,600);
 const n=await B.evaluate(()=>DB.jobs.length);ok(n>0,'B joined and has the jobs: '+n);
 /* S. start stuck (catch-up never answers, like a big download on a slow tablet) */
 await B.evaluate(()=>{syncStop();window._cu=syncCatchUp;syncCatchUp=()=>new Promise(()=>{});SYNC.on=false;syncStart();});await W(B,800);
 ok(await B.evaluate(()=>SYNC.status==='starting'),'S0. B is stuck starting');
 const jid=await A.evaluate(()=>{const j=DB.jobs.find(j=>!isInvoiced(j)&&j.stage!=='estimate');j.items.push({k:'labour',d:'While B stuck',q:1,p:2});save();return j.id;});await W(A,1500);
 ok(!(await B.evaluate(id=>byId('jobs',id).items.some(i=>i.d==='While B stuck'),jid)),'S1. B does not see it yet');
 await B.evaluate(()=>{SYNC.startAt=Date.now()-70000;SYNC.badAt=Date.now()-70000;syncBadge();});
 ok(await B.evaluate(()=>!$('#synb').hidden),'S2. B shows the not-synced badge');
 const bt=await B.evaluate(()=>$('#synb').textContent);console.log('badge',bt);
 await B.evaluate(()=>syncRelisten(10));await W(B,2500);
 ok(await B.evaluate(id=>byId('jobs',id).items.some(i=>i.d==='While B stuck'),jid),'S3. after rescue B receives A\'s change');
 await B.evaluate(id=>{const j=byId('jobs',id);j.items.push({k:'labour',d:'From B after rescue',q:1,p:1});save();},jid);await W(B,2500);
 ok(await A.evaluate(id=>byId('jobs',id).items.some(i=>i.d==='From B after rescue'),jid),'S4. B\'s change reaches A');
 await B.evaluate(()=>{syncBadge();});ok(await B.evaluate(()=>SYNC.status==='ok'&&$('#synb').hidden),'S5. badge gone when synced');
 const tr=await B.evaluate(()=>TRAIL.q.filter(x=>JSON.stringify(x).includes('start slow')).length);ok(tr>0,'S6. trail has the stuck note');
 console.log('errors',JSON.stringify(errs));ok(!errs.length,'no page errors');
 console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
