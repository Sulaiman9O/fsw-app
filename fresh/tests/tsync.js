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
 /* 1. live */
 const jid=await A.evaluate(()=>{const j=DB.jobs.find(j=>!isInvoiced(j)&&j.stage!=='estimate');j.items.push({k:'labour',d:'Live item',q:1,p:2});save();return j.id;});await W(A,2500);
 ok(await B.evaluate(id=>byId('jobs',id).items.some(i=>i.d==='Live item'),jid),'1. B sees A\'s new item within 2.5 s');
 /* R. B's listener broke (tablet slept / network error): A's km edit still reaches B when B comes back to the screen */
 await B.evaluate(()=>syncUnlisten());const kj=await A.evaluate(()=>{const j=DB.jobs.find(j=>j.km);j.km=+j.km+1234;save();return {id:j.id,km:j.km};});await W(A,2000);
 const before=await B.evaluate(id=>byId('jobs',id).km,kj.id);await B.evaluate(()=>{SYNC.hidAt=Date.now()-60000;Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await W(B,2500);
 const after=await B.evaluate(id=>byId('jobs',id).km,kj.id);ok(before!==kj.km&&after===kj.km,'R. dead listener: B had '+before+', after coming back has '+after+' (A: '+kj.km+')');
 /* 2. both offline, same job: A adds an item, B adds a note + payment */
 await A.evaluate(()=>syncStop());await B.evaluate(()=>syncStop());
 await A.evaluate(id=>{const j=byId('jobs',id);j.items.push({k:'part',d:'Offline A part',q:1,p:3});j.mt=now();save();},jid);await W(A,300);
 await B.evaluate(id=>{const j=byId('jobs',id);j.notes='note from B';j.pays.push({m:'Cash',amt:1,t:now(),by:'B'});j.mt=now();save();},jid);await W(B,300);
 await A.evaluate(()=>{SYNC.on=false;syncStart();});await W(A,1500);await B.evaluate(()=>{SYNC.on=false;syncStart();});await W(B,2500);await W(A,1500);
 const sa=await A.evaluate(id=>{const j=byId('jobs',id);return {a:j.items.some(i=>i.d==='Offline A part'),note:j.notes,pay:j.pays.some(p=>p.by==='B')};},jid);const sb=await B.evaluate(id=>{const j=byId('jobs',id);return {a:j.items.some(i=>i.d==='Offline A part'),note:j.notes,pay:j.pays.some(p=>p.by==='B')};},jid);
 console.log('same job after both offline: A',JSON.stringify(sa),'B',JSON.stringify(sb));ok(JSON.stringify(sa)===JSON.stringify(sb),'2a. both devices end the same');ok(sa.a&&sa.pay,'2b. nothing lost: A\'s item AND B\'s payment both kept');
 /* 3. stock moved on both while offline */
 const pid=await A.evaluate(()=>{const p=DB.parts.find(p=>+p.stock>=3);return p&&p.id;});
 if(pid){const s0=await A.evaluate(id=>+byId('parts',id).stock,pid);await A.evaluate(()=>syncStop());await B.evaluate(()=>syncStop());
   await A.evaluate(id=>{mv(byId('parts',id),-1,'test A');save();},pid);await B.evaluate(id=>{mv(byId('parts',id),5,'test B');save();},pid);await W(A,300);
   await A.evaluate(()=>{SYNC.on=false;syncStart();});await W(A,1500);await B.evaluate(()=>{SYNC.on=false;syncStart();});await W(B,2500);await W(A,1500);
   const a=await A.evaluate(id=>+byId('parts',id).stock,pid),bb=await B.evaluate(id=>+byId('parts',id).stock,pid);console.log('stock',s0,'→ A',a,'B',bb);ok(a===bb,'3a. stock same on both ('+a+')');ok(a===s0+4,'3b. both movements counted (expected '+(s0+4)+')');}
 /* 4. delete on A */
 const dj=await A.evaluate(()=>{const j=DB.jobs.find(j=>!isInvoiced(j)&&j.stage==='new')||DB.jobs.find(j=>!isInvoiced(j));if(!j)return null;DB.jobs=DB.jobs.filter(x=>x!==j);save();return j.id;}).catch(e=>null);
 await W(A,2500);ok(dj&&!(await B.evaluate(id=>!!byId('jobs',id),dj)),'4. job deleted on A is gone on B ('+dj+')');
 /* 5. B offline: new customer + car + job, then online */
 await B.evaluate(()=>syncStop());const nid=await B.evaluate(()=>{const c={id:uid('c'),name:'Offline Customer',phone:'90001111',t:now()};DB.customers.push(c);const v={id:uid('v'),cust:c.id,make:'Kia',model:'Rio',plate:'777 X',t:now()};DB.vehicles.push(v);const j={id:uid('j'),no:DB.ws.nextJob++,dev:syncDev(),cust:c.id,veh:v.id,km:1,stage:'new',items:[],disc:0,t:now(),by:'B',log:[],pays:[]};DB.jobs.push(j);save();return [c.id,v.id,j.id];});
 await W(B,500);await B.evaluate(()=>{SYNC.on=false;syncStart();});await W(B,2500);await W(A,1000);
 ok(await A.evaluate(([c,v,j])=>!!byId('customers',c)&&!!byId('vehicles',v)&&!!byId('jobs',j),nid),'5. customer, car and job made offline on B reach A');
 /* 6. B changes stock + job offline, app CLOSED, A changes the same; B reopens later */
 if(pid){const s0=await A.evaluate(id=>+byId('parts',id).stock,pid);const jj=await A.evaluate(()=>DB.jobs.find(j=>!isInvoiced(j)).id);
   await B.evaluate(()=>syncStop());await B.evaluate(([p,j])=>{mv(byId('parts',p),-2,'B closed');byId('jobs',j).items.push({k:'labour',d:'B closed item',q:1,p:1});save();return flushNow();},[pid,jj]);await W(B,400);await B.close();
   await A.evaluate(([p,j])=>{mv(byId('parts',p),3,'A meanwhile');byId('jobs',j).pays.push({m:'Cash',amt:0.5,t:now(),by:'A2'});save();},[pid,jj]);await W(A,2000);
   B=await cb.newPage();B.on('pageerror',e=>errs.push(e.message));await B.route('**/raw.githubusercontent.com/**',r=>r.abort());await B.goto('http://localhost:8811/');await W(B,3500);await B.click('.person').catch(()=>{});await key(B,'1234').catch(()=>{});await W(B,2500);await W(A,1500);
   const g=async P=>P.evaluate(([p,j])=>({s:+byId('parts',p).stock,it:byId('jobs',j).items.some(i=>i.d==='B closed item'),pay:byId('jobs',j).pays.some(x=>x.by==='A2')}),[pid,jj]);const ga=await g(A),gb=await g(B);console.log('after reopen A',JSON.stringify(ga),'B',JSON.stringify(gb),'start',s0);
   ok(JSON.stringify(ga)===JSON.stringify(gb)&&ga.s===s0+1&&ga.it&&ga.pay,'6. app closed while offline: both sides kept after reopening');}
 ok(!errs.length,'no page errors '+errs.slice(0,2).join(' | '));console.log(R.filter(x=>x).length+'/'+R.length);await b.close();})();
