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
 /* B was closed; A changed a job; B opens and the worker taps something before B even loaded its last-sent copy.
    Old behaviour: B sent ALL its records at once, its old copy of that job went over A's newer one. */
 const jid=await A.evaluate(()=>DB.jobs.find(j=>!isInvoiced(j)&&j.items.length).id);
 await B.evaluate(()=>{syncStop();});
 await A.evaluate(id=>{const j=byId('jobs',id);j.items[0].p=77.7;j.items.push({k:'labour',d:'Added on A while B closed',q:1,p:5});save();},jid);await W(A,1500);
 await B.evaluate(()=>{window._ra0=resetAt;resetAt=async()=>{await new Promise(r=>setTimeout(r,2500));return window._ra0();};window._sent=[];const T=window.trail;});
 await B.evaluate(()=>{SYNC.on=false;syncStart();});await W(B,300);
 await B.evaluate(()=>{const c=DB.customers[0];c.note='typed on B during start';save();});await W(B,1200);
 const midSent=await B.evaluate(()=>TRAIL.q.filter(x=>x[1]==='sync'&&/^sent /.test(x[2])).map(x=>x[2]).slice(-3));console.log('B sends while starting',JSON.stringify(midSent));
 await W(B,4500);await W(A,2000);
 const a=await A.evaluate(id=>{const j=byId('jobs',id);return {p:j.items[0].p,added:j.items.some(i=>i.d==='Added on A while B closed')};},jid);
 const bb=await B.evaluate(id=>{const j=byId('jobs',id);return {p:j.items[0].p,added:j.items.some(i=>i.d==='Added on A while B closed'),st:SYNC.status};},jid);
 const note=await A.evaluate(()=>DB.customers[0].note);
 const dbg=await B.evaluate(()=>{const c=DB.customers[0];const k='customers\u0001'+c.id;return {note:c.note,last:(SYNC.last&&SYNC.last.rec.get(k)||'').slice(0,80),snap:(syncSnap().rec.get(k)||'').slice(0,80),q:TRAIL.q.filter(x=>x[1]==='sync'||x[1]==='SYNC-ERR').map(x=>x[2]).slice(-12)};});console.log(JSON.stringify(dbg,null,1));
 console.log('A',JSON.stringify(a),'B',JSON.stringify(bb),'note on A',note);
 ok(a.p===77.7&&a.added,'1. A keeps its newer job (price and new line)');ok(bb.p===77.7&&bb.added,'2. B receives it');ok(note==='typed on B during start','3. what B typed during start still reaches A');
 const big=await B.evaluate(()=>TRAIL.q.filter(x=>x[1]==='sync'&&/^sent (\d+)/.test(x[2])).map(x=>+x[2].split(' ')[1]));ok(!big.some(n=>n>20),'4. no send-everything '+JSON.stringify(big));
 console.log('errors',JSON.stringify(errs));ok(!errs.length,'no page errors');console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
