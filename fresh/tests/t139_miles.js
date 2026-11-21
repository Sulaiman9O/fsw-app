/* 2.42.3: cars whose odometer counts miles. The reading stays as the car shows it; labels say «mi»; every
   «after X km» interval becomes miles for that car (10,000 km → 6,200 mi). km cars unchanged. */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const p=await (await b.newContext({viewport:vp||{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));return {b,p,errs};}
const W=t=>new Promise(r=>setTimeout(r,t));
(async()=>{for(const [vp,lang] of [[{width:400,height:868},'en'],[{width:360,height:740},'ar']]){const {b,p,errs}=await start(vp);const ev=(f,a)=>p.evaluate(f,a);const tag=vp.width+' '+lang+': ';
 await ev(l=>{DB.ws.lang=l;const base=DB.jobs.find(x=>!isInvoiced(x)&&(x.items||[]).length&&!(x.items||[]).some(i=>i.pend));
   const c=DB.customers[0];const vm={id:'vMI',cust:c.id,make:'Ford',model:'Mustang',year:'2012',plate:'MI 1',odo:'mi',km:85000},vk={id:'vKM',cust:c.id,make:'Toyota',model:'Camry',year:'2015',plate:'KM 1',km:85000};DB.vehicles.push(vm,vk);
   const mk=(id,no,veh)=>{const j=JSON.parse(JSON.stringify(base));Object.assign(j,{id,no,veh,cust:c.id,km:85000,stage:'work',t:now()});delete j.inv;j.pays=[];j.rems=[{kind:'oil',name:'',mo:6,km:10000}];return j;};
   DB.jobs.push(mk('jMI',9101,'vMI'),mk('jKM',9102,'vKM'));save();lookApply();},lang);
 /* math */
 const m=await ev(()=>({mi:remWhen(byId('jobs','jMI'),byId('jobs','jMI').rems[0]).km,km:remWhen(byId('jobs','jKM'),byId('jobs','jKM').rems[0]).km,i3:intU(3000,{odo:'mi'}),i5:intU(5000,{odo:'mi'}),k:intU(5000,{}),z:intU(0,{odo:'mi'})}));
 ok(m.mi===91200,tag+'miles car: next oil 85,000 + 6,200 = '+m.mi);ok(m.km===95000,tag+'km car: next oil 85,000 + 10,000 = '+m.km);
 ok(m.i3===1900&&m.i5===3100&&m.k===5000&&m.z===0,tag+'3,000 km → 1,900 mi · 5,000 km → 3,100 mi · km car unchanged · 0 stays 0');
 /* job page */
 await ev(()=>go('job',{id:'jMI'}));await W(400);const jt=await p.textContent('[data-kmj]');ok(/85,000\s*mi/.test(jt),tag+'job chip: '+jt.trim());
 const rc=await p.textContent('#main');ok(/6,200 mi/.test(rc)&&/91,200/.test(rc),tag+'reminder: «6,200 mi (91,200)»');
 /* reminder edit: label mi, typed 5000 mi */
 await p.click('[data-rm="0"]');await W(300);ok(/\(mi\)|ميل/.test(await p.textContent('#sheet'))&&await p.inputValue('#rkm')==='6200',tag+'reminder edit says mi, shows 6200');
 await p.fill('#rkm','5000');await p.click('#rmok');await W(300);const r=await ev(()=>{const j=byId('jobs','jMI');return {km:j.rems[0].km,due:remWhen(j,j.rems[0]).km};});
 ok(r.due===90000&&Math.abs(r.km-8047)<=1,tag+'typed 5,000 mi → due at 90,000 (kept as '+r.km+' km inside)');
 /* invoice + sticker */
 const inv=await ev(()=>{const j=byId('jobs','jMI');j.inv={no:99,t:now()};const h=invoiceModern(j);delete j.inv;return h;});ok(/85,000 mi/.test(inv)&&/90,000 mi/.test(inv)&&!/85,000 km/.test(inv),tag+'invoice: odometer and next service in mi');
 const stk=await ev(()=>{const j=byId('jobs','jMI');return ['A','B','C','D'].map(t=>stickerHtml3(t,{kind:'oil',next:now()+864e5*180,nextKm:90000,km:85000,mi:true},0)).join('');});
 ok(!/>km<|\bKM\b|الكيلومتر|85,000 km/.test(stk)&&/mi|MI|ميل/.test(stk),tag+'sticker: MI / ميل, no km');
 const stkK=await ev(()=>stickerHtml3('B',{kind:'oil',next:now(),nextKm:95000,km:85000},0));ok(/KM|km|كم/.test(stkK),tag+'km car sticker still km');
 /* km sheet: switch to km and back */
 await ev(()=>go('job',{id:'jMI'}));await W(300);await p.click('[data-kmj]');await W(300);ok(await p.$eval('[data-odo="mi"]',e=>e.getAttribute('aria-pressed'))==='true',tag+'km sheet shows «miles» chosen');
 await p.click('[data-odo="km"]');await p.click('#jkmok');await W(300);ok(await ev(()=>!byId('vehicles','vMI').odo&&remWhen(byId('jobs','jMI'),byId('jobs','jMI').rems[0]).km===85000+8047),tag+'switched to km → unit gone, interval back in km');
 await p.click('[data-kmj]');await W(300);await p.click('[data-odo="mi"]');await p.fill('#jkm','86000');await p.click('#jkmok');await W(300);
 ok(await ev(()=>byId('vehicles','vMI').odo==='mi'&&byId('jobs','jMI').km===86000),tag+'switched to miles + new reading saved');
 /* close the job → customer reminder in miles */
 await ev(()=>{const j=byId('jobs','jMI');j.rems[0]={kind:'oil',name:'',mo:6,km:10000};j.inv={no:98,t:now()};j.stage='done';makeReminders(j);});
 ok(await ev(()=>DB.reminders.some(r=>r.veh==='vMI'&&r.dueKm===86000+6200)),tag+'customer reminder due at 92,200 mi');
 /* car edit sheet: select */
 await ev(()=>{const v=byId('vehicles','vKM');vehSheet(byId('customers',v.cust),v);});await W(300);ok(await p.$eval('#vodo',e=>e.value)==='',tag+'car edit: km car shows km');await p.selectOption('#vodo','mi');await p.click('#vok');await W(300);
 ok(await ev(()=>byId('vehicles','vKM').odo==='mi'),tag+'car edit: changed to miles');
 await ev(()=>{const v=byId('vehicles','vKM');vehSheet(byId('customers',v.cust),v);});await W(300);await p.selectOption('#vodo','');await p.click('#vok');await W(300);ok(await ev(()=>!byId('vehicles','vKM').odo),tag+'car edit: back to km');
 /* customer page */
 await ev(()=>go('custd',{id:byId('vehicles','vMI').cust}));await W(400);ok(/86,000 mi/.test(await p.textContent('#main')),tag+'customer page shows mi');
 ok(errs.length===0,tag+'no page errors '+JSON.stringify(errs.slice(0,3)));await b.close();}})();
