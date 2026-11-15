/* litres → cans: gearbox oil / coolant kept by the can are not counted litre = can */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
await p.goto('http://localhost:8811/');await p.waitForTimeout(700);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();
const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwdemo').catch(()=>{});await p.click('#nwl').catch(()=>{});
const r=await p.evaluate(()=>{
 const mk=(id,name,cat,unit,price,extra)=>{DB.parts.push(Object.assign({id,name,num:id,cat,unit,price,cost:price*0.8,stock:20,reorder:0},extra||{}));};
 mk('pWS','Toyota WS A/T Fluid 08886-81885','Gearbox oil','pc',13,{packL:4});mk('pCVT1','Mannol CVT Fluid NS-3 1ltrs 8220','Gearbox oil','pc',4);mk('pCVT4','Mannol CVT Fluid NS-3 4ltrs 8220','Gearbox oil','pc',16);
 mk('pNS3','Nissan NS-3 CVT Fluid','Gearbox oil','pc',26.5);mk('pMS','Nissan Matic-S Transmission Fluid','Gearbox oil','L',6);
 mk('pCL','Toyota Super Long Life Coolant 5ltrs','Coolant','pc',8);
 const sv={id:'sATF',cat:'Transmission',name:'ATF & Filter Change',p:[14,14,14,14,14,14,14],tag:'gear'};DB.services.push(sv);const sc={id:'sCL',cat:'Cooling',name:'Coolant Change',p:[6,6,6,6,6,6,6]};DB.services.push(sc);save();
 const j=DB.jobs.find(j=>!isInvoiced(j));const by=id=>o=>o.p.id===id;
 const O=smartOptions(j,sv);const g=id=>{const o=O.opts.find(by(id));return o&&{q:o.q,partT:o.partT,total:o.total};};
 const O6=smartOptionsQ(j,sv,6);const g6=id=>{const o=O6.opts.find(by(id));return o&&o.q;};
 const C=smartOptions(j,sc);const cl=C.opts.find(by('pCL'));
 const v=vehOf(j);const Qg=quoteRows(v,'gear');const qws=Qg.rows.find(x=>x.p.id==='pWS');const Qc=quoteRows(v,'coolant');const qcl=Qc.rows.find(x=>x.p.id==='pCL');
 return {litres:O.qty,WS:g('pWS'),CVT1:g('pCVT1'),CVT4:g('pCVT4'),NS3:g('pNS3'),MS:g('pMS'),WS6:g6('pWS'),CVT1_6:g6('pCVT1'),coolL:C.qty,CL:cl&&{q:cl.q,partT:cl.partT},qWS:qws&&{q:qws.q,oil:qws.oil},qCL:qcl&&{q:qcl.q,oil:qcl.oil},nameRead:packL({name:'X 5ltrs',unit:'pc'}),visc:packL({name:'Oil 0W-20 F/S',unit:'pc'})};});
console.log(JSON.stringify(r));
ok(r.WS.q===1&&r.WS.partT===13,'1. WS 4 L → 1 can = 13 (not 52)');ok(r.CVT1.q===4,'2. 1-litre bottles → 4');ok(r.CVT4.q===1&&r.CVT4.partT===16,'3. 4-litre can → 1');ok(r.NS3.q===1,'4. unknown can size → 1 (warned)');ok(r.MS.q===4,'5. drum in litres → 4 L');
ok(r.WS6===2&&r.CVT1_6===6,'6. 6 L → 2 cans of 4, 6 bottles of 1');ok(r.CL.q===1&&r.CL.partT===8,'7. coolant 5 L → 1 can of 5 = 8');ok(r.qWS.q===1&&r.qCL.q===1,'8. quick price same');ok(r.nameRead===5&&r.visc===0,'9. size read from name, not from 0W-20');
/* through the screen: add ATF & Filter Change, pick WS */
const jid=await p.evaluate(()=>{const j=DB.jobs.find(j=>!isInvoiced(j));go('job',{id:j.id});return j.id;});await p.waitForTimeout(500);
await p.evaluate(id=>smartSheet(byId('jobs',id),byId('services','sATF')),jid);await p.waitForTimeout(400);
const txt=await p.locator('.oc',{hasText:'WS A/T'}).first().innerText();console.log(txt.replace(/\n/g,' | '));await p.locator('.oc',{hasText:'WS A/T'}).first().click();await p.waitForTimeout(200);
await p.screenshot({path:'/tmp/claude-0/-home-claude/f4d7ebf3-778c-5d50-a163-5dcd8e8292ed/scratchpad/atf.png'});
await p.click('#smok');await p.waitForTimeout(300);
const it=await p.evaluate(id=>byId('jobs',id).items.filter(i=>i.ref==='pWS'),jid);console.log(JSON.stringify(it));ok(it.length===1&&it[0].q===1&&it[0].u==='','10. job gets 1 can of WS');
const unk=await p.evaluate(id=>{smartSheet(byId('jobs',id),byId('services','sATF'));return 1;},jid);await p.waitForTimeout(300);await p.click('#small').catch(()=>{});await p.waitForTimeout(200);ok((await p.locator('.oc',{hasText:'NS-3 CVT Fluid'}).filter({hasNotText:'Mannol'}).first().innerText()).includes('unknown'),'11. unknown can shows a warning');
console.log('errors',JSON.stringify(errs));ok(!errs.length,'no page errors');console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
