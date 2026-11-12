/* SERVICE REMINDERS end to end: oil + gearbox + a manual one on a job → paid → reminders made (date + km) →
   clock jumps to the due week → due list on home/customers → WhatsApp text → marked sent → gone from the list;
   the oil sticker's print document is captured at the print command and rendered to an image. Usage: node trem.js */
const {chromium}=require('playwright');const fs=require('fs');
const CAT=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const SRC=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:868}});
 await ctx.addInitScript(()=>{const RD=Date;let off=0;window.__setNow=t=>{off=t-RD.now();};class FD extends RD{constructor(...a){if(!a.length)super(RD.now()+off);else super(...a);}static now(){return RD.now()+off;}}window.Date=FD;
   window.Capacitor={Plugins:{FswPrint:{printHtml:o=>{window.__printed=o;return Promise.resolve();}}}};});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const wa=[];
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.route('**/wa.me/**',r=>{wa.push(decodeURIComponent(r.request().url()));r.abort();});
 const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);R.push({ok:!!c,m});};const R=[];const W=ms=>p.waitForTimeout(ms);const E=(f,a)=>p.evaluate(f,a);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await W(30);}};
 await p.goto('http://localhost:8811/');await W(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await W(900);await p.click('#nwl').catch(()=>{});
 await E(([cat,src])=>{DB.parts=cat.parts;DB.services=cat.services;DB.customers=src.customers;DB.vehicles=src.vehicles;DB.jobs=src.jobs.filter(j=>j.inv);DB.reminders=[];try{fitsFix();}catch(e){}save();window.toast=m=>{window.__toast=m;};document.querySelectorAll('#tour').forEach(x=>x.remove());},[CAT,SRC]);
 const T0=Date.parse('2026-11-14T09:00:00+04:00');await E(t=>__setNow(t),T0);
 /* a car with a phone, oil recipe */
 const v=await E(()=>{const v=DB.vehicles.find(v=>/2GR/.test(v.engine||'')&&(byId('customers',v.cust)||{}).phone);return {id:v.id,plate:v.plate,cust:v.cust};});
 await E(()=>{S.ctr={q:'',vid:null,km:''};go('counter');});await W(80);await p.fill('#cq',v.plate);await W(150);await p.click(`[data-cv="${v.id}"]`);await W(80);await p.fill('#ckm','120000');await p.click('#coil');await W(300);await E(()=>closeSheet());
 const jid=await E(()=>S.p.id);
 /* gearbox oil service too */
 const gs=await E(id=>{const j=byId('jobs',id);const s=DB.services.find(s=>s.tag==='gear')||DB.services.find(s=>/gear|transmission|atf/i.test(s.name));if(!s)return null;j.items.push({k:'labour',d:s.name,q:1,p:+s.price||10,ref:s.id,tag:'gear'});save();render();return s.name;},jid);ok(!!gs,'gearbox service exists: '+gs);
 /* manual reminder in 2 months */
 await p.click('#jrmadd');await W(150);await p.fill('#rmn','Brake check');await p.fill('#rmo','2');await p.click('#rmok');await W(150);
 const plan=await E(id=>(byId('jobs',id).rems||[]).filter(r=>r.on!==false).map(r=>({k:r.kind,mo:r.mo,km:r.km,n:r.name})),jid);console.log('planned',JSON.stringify(plan));ok(plan.some(r=>r.k==='oil')&&plan.some(r=>r.k==='gear')&&plan.some(r=>r.n==='Brake check'),'oil + gearbox + manual planned on the job');
 /* sticker → print command captured */
 await p.click('#jstk');await W(400);await p.click('#sgo3');await W(600);const pr=await E(()=>window.__printed||null);ok(pr&&pr.html&&pr.widthMm>0,'sticker print command sent ('+(pr?pr.widthMm+'×'+pr.heightMm+' mm':'none')+')');
 if(pr){const q=await b.newPage({viewport:{width:Math.round(pr.widthMm*3.78)+20,height:Math.round(pr.heightMm*3.78)+20}});await q.setContent(pr.html);await q.waitForTimeout(500);await q.screenshot({path:'trem_sticker.png'});const tx=await q.evaluate(()=>document.body.innerText+' '+[...document.images].map(i=>i.naturalWidth).join(','));await q.close();
   ok(/12[0-9],?[0-9]{3}|1[23][0-9]{4}/.test(tx.replace(/\s/g,''))||/img/i.test(pr.html),'sticker document renders (next km or image) · '+tx.replace(/\s+/g,' ').slice(0,80));}
 /* pay → job closed → reminders made */
 await E(()=>closeSheet());await p.click('#jpay');await W(150);await p.click('#sheet [data-pm="Cash"]');await W(300);
 const made=await E(id=>DB.reminders.filter(r=>r.job===id).map(r=>({k:r.kind,n:r.name,due:r.due,km:r.dueKm})),jid);console.log('made',JSON.stringify(made.map(r=>({k:r.k,n:r.n,due:new Date(r.due).toISOString().slice(0,10),km:r.km}))));
 ok(made.length>=3,'reminders made on close: '+made.length);const oil=made.find(r=>r.k==='oil');ok(oil&&oil.km>120000&&oil.due>T0+60*864e5,'oil reminder has next km and a date months ahead');
 const brk=made.find(r=>r.n==='Brake check');ok(brk&&Math.abs((brk.due-T0)/864e5-61)<4,'manual reminder ~2 months ahead');
 /* not due yet */
 ok((await E(()=>remindersDue().length))===0,'nothing due today');
 /* jump to 3 days before the manual one */
 await E(t=>__setNow(t),brk.due-3*864e5);await E(()=>go('home'));await W(200);
 const due=await E(()=>remindersDue().map(r=>r.name||r.kind));ok(due.includes('Brake check'),'due list has it 3 days before: '+due.join(','));
 const homeTxt=await E(()=>document.querySelector('#main').innerText);ok(/remind|تذكير|🔔/i.test(homeTxt),'home shows the reminders count');
 await E(()=>remListSheet());await W(200);const btn=await p.$('#sheet [data-rwa]');ok(!!btn,'WhatsApp button on the due list');
 await E(()=>{shareText=function(ph,t){window.__wa='https://wa.me/'+(ph?waNum(ph):'')+'?text='+t;};});if(btn){await btn.click();await W(400);}const txt=await E(()=>window.__wa||'');console.log('wa',txt.replace(/\n/g,' ').slice(0,120));const c=await E(id=>byId('customers',id),v.cust);
 ok(txt.includes(c.phone.replace(/\D/g,'').slice(-8))||txt.includes('968'),'WhatsApp to the customer number');ok(txt.includes(v.plate)||txt.includes(c.name),'text has the plate / name');
 const left=await E(()=>remindersDue().filter(r=>r.name==='Brake check').length);ok(left===0,'marked sent after WhatsApp');
 /* oil reminder: jump to its date */
 await E(t=>__setNow(t),oil.due);ok((await E(()=>remindersDue().some(r=>r.kind==='oil'))),'oil reminder due on its date');
 /* 40 days late: drops out of the list (older than a month) */
 await E(t=>__setNow(t),oil.due+40*864e5);ok(!(await E(()=>remindersDue().some(r=>r.kind==='oil'))),'over a month late: off the list');
 /* the car comes back early for oil: old oil reminder replaced */
 await E(t=>__setNow(t),T0+30*864e5);const n0=await E(vid=>DB.reminders.filter(r=>r.veh===vid&&r.kind==='oil').length,v.id);
 await E(()=>{S.ctr={q:'',vid:null,km:''};go('counter');});await W(80);await p.fill('#cq',v.plate);await W(150);await p.click(`[data-cv="${v.id}"]`);await W(80);await p.fill('#ckm','124000');await p.click('#coil');await W(300);await E(()=>closeSheet());await p.click('#jpay');await W(150);await p.click('#sheet [data-pm="Cash"]');await W(300);
 const n1=await E(vid=>DB.reminders.filter(r=>r.veh===vid&&r.kind==='oil').length,v.id);ok(n0===1&&n1===1,'new oil change replaces the old oil reminder ('+n0+'→'+n1+')');
 ok(!errs.length,'no page errors '+errs.slice(0,2).join(' | '));
 console.log(R.filter(x=>x.ok).length+'/'+R.length);await b.close();})();
