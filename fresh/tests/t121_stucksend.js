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
 /* a send that never answers (phone after the camera): later changes must not wait behind it for hours */
 const jid=await A.evaluate(()=>DB.jobs.find(j=>!isInvoiced(j)).id);
 await B.evaluate(()=>{SYNC.commitMs=1500;const ob=FBS.batch.bind(FBS);let first=1;FBS.batch=()=>{const bt=ob();if(first){first=0;bt.commit=()=>new Promise(()=>{});}return bt;};});
 await B.evaluate(id=>{const j=byId('jobs',id);j.km=219981;save();},jid);await W(B,800);
 await B.evaluate(id=>{const j=byId('jobs',id);j.notes='second change';save();},jid);
 await W(B,7000);await W(A,1500);
 const a=await A.evaluate(id=>{const j=byId('jobs',id);return {km:j.km,notes:j.notes};},jid);console.log(JSON.stringify(a));
 const tr=await B.evaluate(()=>TRAIL.q.filter(x=>x[1]==='SYNC-ERR'||(x[1]==='sync'&&/^sent/.test(x[2]))).map(x=>x[2]));console.log(JSON.stringify(tr));
 ok(a.km===219981,'1. the km reaches the other device after the stuck send');ok(a.notes==='second change','2. the change made after it too');
 ok(tr.some(x=>/send timeout/.test(x)),'3. the stuck send is in the trail');
 console.log('errors',JSON.stringify(errs));ok(!errs.length,'no page errors');console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
