/* 2.42.2 — fixes from the 18 Nov review:
   1) sync mark saved only after the received changes are saved (tablet gave invoice #1022 twice)
   2) a typed item ("Something else") starts as Labour / service and asks what it is
   3) an estimate on another saved copy of the same car (same plate/make or VIN) is found; agreeing moves it to the car picked */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const p=await (await b.newContext({viewport:vp||{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));return {b,p,errs};}
const W=t=>new Promise(r=>setTimeout(r,t));
(async()=>{const {b,p,errs}=await start();const ev=(f,a)=>p.evaluate(f,a);
 /* 1 sync mark */
 const r1=await ev(async()=>{const o={};tsReset();o.s0=tsGet();
  let held=true;const F=flushNow;window.flushNow=()=>new Promise(r=>{const t=setInterval(()=>{if(!held){clearInterval(t);r(F());}},20);});
  tsSet(1000);tsSet(2000);tsSet(1500);o.mem=tsGet();o.stored1=+localStorage.getItem('ws_sync_ts')||0;
  await new Promise(r=>setTimeout(r,700));o.stored2=+localStorage.getItem('ws_sync_ts')||0;   /* save still running → not written */
  held=false;await new Promise(r=>setTimeout(r,300));o.stored3=+localStorage.getItem('ws_sync_ts')||0;
  window.flushNow=F;
  /* a failed save → mark not written */
  STORE.err='x';tsSet(5000);await new Promise(r=>setTimeout(r,700));o.stored4=+localStorage.getItem('ws_sync_ts')||0;STORE.err='';
  /* app closed before the save: a fresh start only knows the stored mark */
  o.afterRestart=tsStored();tsReset();o.reset=tsGet()+'/'+(localStorage.getItem('ws_sync_ts'));return o;});
 ok(r1.s0===0&&r1.mem===2000,'mark kept in memory at once ('+r1.mem+')');
 ok(r1.stored1===0&&r1.stored2===0,'not written while the received changes are not saved yet');
 ok(r1.stored3===2000,'written after the save finished ('+r1.stored3+')');
 ok(r1.stored4===2000,'save failed → mark not moved ('+r1.stored4+')');
 ok(r1.afterRestart===2000,'after closing, the next start asks again from the last saved mark');
 ok(r1.reset==='0/0','reset clears memory and storage');
 /* 2 typed item = labour by default, asks what it is; switch to part works; Close removes the empty new item */
 const jid=await ev(()=>{const j=DB.jobs.find(x=>!x.inv&&x.stage!=='estimate');go('job',{id:j.id});return j.id;});await W(400);
 const n0=await ev(id=>byId('jobs',id).items.length,jid);
 const openAdd=async()=>{await ev(id=>addItemSheet(byId('jobs',id)),jid);await W(300);};await openAdd();
 ok(!!(await p.$('#acust')),'add sheet open');await p.click('#acust');await W(300);
 ok(await p.$eval('[data-k="labour"]',e=>e.getAttribute('aria-pressed'))==='true'&&await p.$eval('[data-k="part"]',e=>e.getAttribute('aria-pressed'))==='false','new typed item: Labour / service chosen');
 ok(/What is it|وش هو/.test(await p.textContent('#sheet')),'asks "What is it?"');
 const firstChip=await p.$eval('#sheet .chips button',e=>e.dataset.k);ok(firstChip==='labour','Labour is the first choice');
 await p.fill('#ed','Check for leak');await p.fill('#ep','1');await p.click('#eok');await W(300);
 let it=await ev(id=>byId('jobs',id).items.slice(-1)[0],jid);ok(it.d==='Check for leak'&&it.k==='labour'&&it.p===1&&!('cost' in it&&it.cost),'saved as labour 1.000 → '+it.k);
 await openAdd();await p.click('#acust');await W(300);
 await p.fill('#ed','Wiper blade');await p.click('[data-k="part"]');await p.fill('#ep','2.5');await p.click('#eok');await W(300);
 it=await ev(id=>byId('jobs',id).items.slice(-1)[0],jid);ok(it.d==='Wiper blade'&&it.k==='part','switch to Part works');
 await openAdd();await p.click('#acust');await W(300);
 await p.click('[data-close]');await W(300);ok(await ev(([id,n])=>byId('jobs',id).items.length===n+2,[jid,n0]),'Close on a new empty item → nothing added');
 /* editing an existing item: no "What is it?" line, type kept */
 await ev(id=>{const j=byId('jobs',id);editItemSheet(j,j.items.length-1,false);},jid);await W(300);ok(!/What is it|وش هو/.test(await p.textContent('#sheet'))&&await p.$eval('[data-k="part"]',e=>e.getAttribute('aria-pressed'))==='true','old item: type kept, no question');await ev(()=>closeSheet());
 /* 3 same car saved twice */
 const r3=await ev(()=>{const c1=DB.customers[0],c2=DB.customers[1];const A={id:'vA',cust:c1.id,make:'Toyota',model:'camry',plate:'27084'},B={id:'vB',cust:c2.id,make:'Toyota',model:'Camry',plate:'27084 R4'},C={id:'vC',cust:c2.id,make:'Toyota',model:'Camry',plate:'27084 AB'},C2={id:'vC2',cust:c2.id,make:'Toyota',model:'Camry',plate:'27084 AB'},D={id:'vD',cust:c2.id,make:'Kia',plate:'27084'},E={id:'vE',cust:c2.id,make:'Nissan',plate:'',vin:'JN1AA0000X0000001'},F={id:'vF',cust:c1.id,make:'Nissan',plate:'',vin:'jn1aa0000x0000001'},G={id:'vG',cust:c1.id,make:'Toyota',plate:'84'};
  DB.vehicles.push(A,B,C,D,E,F,G);const base=JSON.parse(JSON.stringify(DB.jobs.find(x=>!x.inv)));
  const mk=(id,no,veh,cust,t)=>Object.assign(JSON.parse(JSON.stringify(base)),{id,no,veh,cust,stage:'estimate',t,items:[{k:'labour',d:'Brake check',q:1,p:5}],pays:[]});
  DB.jobs.forEach(j=>{if(j.stage==='estimate')j.stage='done';});
  const e1=mk('eA',7001,'vA',c1.id,now()-3*864e5);delete e1.inv;const e2=mk('eF',7002,'vF',c1.id,now()-864e5);delete e2.inv;const e3=mk('eOld',7003,'vA',c1.id,now()-50*864e5);delete e3.inv;DB.jobs.push(e1,e2,e3);save();
  const o={};o.B=(estOf(B)||{}).no;o.C=(estOf(C)||{}).no;o.D=(estOf(D)||{}).no;o.E=(estOf(E)||{}).no;o.G=(estOf(G)||{}).no;o.A=(estOf(A)||{}).no;return o;});
 ok(r3.A===7001,'same car: its own estimate found');ok(r3.B===7001,'«27084 R4» Toyota finds the estimate on «27084» Toyota (worker\'s copy)');
 ok(r3.C===7001,'«27084 AB»: the worker\'s copy has no letters → still matches → '+r3.C);ok(r3.D===undefined,'same number but Kia → not the same car');ok(r3.E===7002,'same VIN (small letters) → found');ok(r3.G===undefined,'short plate «84» never matches');
const sc=await ev(()=>[sameCar({id:1,make:'Toyota',plate:'27084 AB'},{id:2,make:'toyota ',plate:'27084 R'}),sameCar({id:1,make:'Toyota',plate:'OM 27084 R'},{id:2,make:'Toyota',plate:'27084'}),sameCar({id:1,make:'',plate:'27084'},{id:2,make:'',plate:'27084'}),sameCar({id:1,make:'Toyota',plate:'2708'},{id:2,make:'Toyota',plate:'27084'})]);
 ok(JSON.stringify(sc)==='[false,true,false,false]','sameCar: different letters no · OM prefix ok · no make no · different number no → '+JSON.stringify(sc));
 /* agree from the other copy: the job moves to the car and customer picked */
 await ev(()=>{const B=byId('vehicles','vB');estGuard(B,()=>{});});await W(300);ok(/7001/.test(await p.textContent('#sheet')),'new card for «27084 R4» asks about estimate #7001');
 await p.click('#egu');await W(400);const e=await ev(()=>{const e=byId('jobs','eA');return {st:e.stage,veh:e.veh,cust:e.cust,c2:DB.customers[1].id,log:JSON.stringify(e.log||[]).includes('Moved from')};});
 ok(e.st==='new'&&e.veh==='vB'&&e.cust===e.c2&&e.log,'agreed → job on «27084 R4» and its customer, log says moved');
 ok(errs.length===0,'no page errors '+JSON.stringify(errs.slice(0,3)));await b.close();})();
