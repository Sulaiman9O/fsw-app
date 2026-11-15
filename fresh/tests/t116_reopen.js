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
 /* reopen B: it must not send everything again */
 await B.evaluate(()=>{const j=DB.jobs[0];j.notes='x';save();});await W(B,2000);
 await B.reload();await W(B,2500);await B.click('.person').catch(()=>{});await key(B,'1234');await W(B,3000);
 await B.evaluate(()=>{const m={};syncSnap().rec.forEach((v,k)=>m[k]=v);localStorage.setItem('_dbg',JSON.stringify(m));});
 await B.reload();await W(B,2500);await B.click('.person').catch(()=>{});await key(B,'1234');await W(B,3000);
 const dd=await B.evaluate(()=>{const o=JSON.parse(localStorage.getItem('_dbg'));const out=[];syncSnap().rec.forEach((v,k)=>{if(o[k]!==v){const a=JSON.parse(o[k]||'{}'),b=JSON.parse(v);out.push(k.replace('\u0001',':')+' '+[...new Set([...Object.keys(a),...Object.keys(b)])].filter(f=>JSON.stringify(a[f])!==JSON.stringify(b[f])).map(f=>f+'='+String(JSON.stringify(a[f])).slice(0,40)+'→'+String(JSON.stringify(b[f])).slice(0,40)).join(' '));}});return out;});console.log(dd.slice(0,15).join('\n'));
 const t=await B.evaluate(()=>TRAIL.q.map(x=>x[1]+' '+x[2]).filter(x=>/^sync (start|sent)/.test(x)));console.log(JSON.stringify(t.slice(-6)));
 const st=t.filter(x=>/start: last-sent/.test(x)).pop()||'';ok(st&&!/MISSING/.test(st),'R1. after reopening, the last-sent copy is there: '+st);
 const big=t.slice(t.lastIndexOf(st)).filter(x=>/^sync sent (\d+)/.test(x)).map(x=>+x.split(' ').pop());ok(!big.some(n=>n>20),'R2. no full resend after reopening '+JSON.stringify(big));
 console.log('errors',JSON.stringify(errs));ok(!errs.length,'no page errors');console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
