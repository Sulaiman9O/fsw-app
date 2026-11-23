/* 2.42.7: (1) quick price: the litres can be changed (this time only / this car / this model) and the prices follow;
   (2) Home «Opened and forgotten»: job cards never started, no change for 2 days → hold: make an estimate / delete;
   (3) estimates with no change for 30 days leave the Work list (a button shows them); (4) engine sizes typed in cc are read. */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};const W=t=>new Promise(r=>setTimeout(r,t));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));
 const ev=(f,a)=>p.evaluate(f,a);
 /* (4) cc sizes */
 const D=await ev(()=>['2500','3445mL','3456 CC','1971','VR30 (DDTT) 2997CC','Toyota 2018','2.4L 2AZ-FE','engine 2018','12345'].map(x=>dispTxt(x)));
 ok(JSON.stringify(D)===JSON.stringify(['2.5','3.4','3.5','2.0','3.0','','2.4','','']),'engine sizes in cc read: '+JSON.stringify(D));
 const E=await ev(()=>{const mk=(m,md,y,e)=>effEng({id:'_t'+Math.random(),make:m,model:md,year:y,engine:e});return [mk('Toyota','RAV4',2017,'2500'),mk('Toyota','FJ Cruiser',2014,'3.9L'),mk('Toyota','Camry',2020,'')];});
 ok(/2AR-FE/.test(E[0])&&/1GR-FE/.test(E[1])&&E[2]==='','engine found from «2500» (RAV4 → 2AR-FE) and «3.9L» (FJ → 1GR-FE); unknown stays unknown → '+JSON.stringify(E));
 /* (1) quick price litres */
 const vid=await ev(()=>{const v=DB.vehicles.find(x=>/camry/i.test(x.model||''))||DB.vehicles[0];delete v.oilQ;save();return v.id;});
 await ev(vid=>{S.quote={vid,car:null,kind:'oil',vf:'all',cv:false,q:''};go('quote');},vid);await W(500);
 ok(!!(await p.$('#qlit')),'quick price shows the litres as a button');
 const q0=await ev(()=>{const t=document.querySelector('#qlit').textContent;return {t,price:document.querySelector('.qtile em')&&document.querySelector('.qtile em').textContent};});
 await p.click('#qlit');await W(300);ok(!!(await p.$('#qtonce'))&&!!(await p.$('#qtcar'))&&!!(await p.$('#qtmod')),'litres sheet: this time only / this car / this model');
 await p.fill('#qtl','6.2');await p.click('#qtonce');await W(400);
 const q1=await ev(()=>({t:document.querySelector('#qlit').textContent,price:document.querySelector('.qtile em').textContent,car:byId('vehicles',S.quote.vid).oilQ}));
 ok(/6\.2 L/.test(q1.t)&&q1.price!==q0.price&&!q1.car,'this time only: 6.2 L, prices changed, car not changed '+JSON.stringify([q0,q1]));
 /* the job card made from these prices uses 6.2 L */
 await p.locator('.qtile').first().click();await W(300);await p.click('#qest');await W(500);
 const jq=await ev(()=>{const j=byId('jobs',S.p.id);const o=(j.items||[]).find(i=>i.u==='L');return {st:j.stage,q:o&&o.q};});
 ok(jq.st==='estimate'&&Math.abs((jq.q||0)-6.2)<0.051,'estimate from quick price takes 6.2 L '+JSON.stringify(jq));
 await ev(vid=>{S.quote={vid,car:null,kind:'oil',vf:'all',cv:false,q:''};go('quote');},vid);await W(400);
 ok(!/6\.2 L/.test(await p.textContent('#qlit')),'«this time only» is not kept for the next quick price');
 await p.click('#qlit');await W(300);await p.fill('#qtl','5.1');await p.click('#qtcar');await W(400);
 ok(await ev(vid=>byId('vehicles',vid).oilQ,vid)===5.1&&/5\.1 L/.test(await p.textContent('#qlit')),'for this car: saved on the car (5.1 L)');
 await ev(()=>{S.quote.kind='gear';render();});await W(300);await p.click('#qlit');await W(300);await p.fill('#qgl','3.3');await p.click('#qglok');await W(300);
 ok(/3\.3 L/.test(await p.textContent('#qlit')),'gearbox oil litres can be changed too');
 await p.click('#qlit');await W(300);await p.fill('#qgl','abc');await p.click('#qglok');await W(200);ok(!!(await p.$('#qgl')),'wrong litres: sheet stays open');await ev(()=>closeSheet());
 await ev(vid=>{delete byId('vehicles',vid).oilQ;save();},vid);
 /* (2) removed in 2.42.7 at Sulaiman's word («makes the app more complicated»): no forgotten section on Home */
 const ids=await ev(()=>{const v=DB.vehicles[1],v2=DB.vehicles[2];const mk=(v,st,days,no)=>{const j={id:'fg'+no,no,cust:v.cust,veh:v.id,km:0,stage:st,items:[{k:'labour',d:'Test check',q:1,p:5}],disc:0,t:Date.now()-days*864e5,by:'S',log:[[Date.now()-days*864e5,'Job opened']],pays:[]};DB.jobs.push(j);return j.id;};
   const a=mk(v,'new',3,9901),e=mk(v2,'estimate',40,9905),f=mk(v2,'estimate',10,9906);save();go('home');return [a,e,f];});
 await W(500);
 const H=await ev(()=>({forg:!!document.querySelector('#forg'),inShop:!!document.querySelector('[data-go="job:fg9901"]')}));
 ok(!H.forg&&H.inShop,'Home: no forgotten section; the 3-day-old card is in «In the workshop now» as before');
 /* (3) old estimates */
 await ev(()=>go('work',{f:'estimate'}));await W(400);
 const L=await ev(()=>({ids:[...document.querySelectorAll('.list [data-go]')].map(r=>r.dataset.go),old:!!document.querySelector('#wold')}));
 ok(!L.ids.includes('job:fg9905')&&L.ids.includes('job:fg9906')&&L.old,'Work › Estimates: the 40-day-old one hidden, the 10-day one shown, button for older');
 await p.click('#wold');await W(300);ok(await ev(()=>!!document.querySelector('[data-go="job:fg9905"]')),'button shows the older estimates');
 ok(await ev(()=>!!byId('jobs','fg9905')),'old estimate is not deleted');
 ok(errs.length===0,'no page errors '+JSON.stringify(errs.slice(0,3)));await b.close();})();
