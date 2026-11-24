/* 2.42.9: (1) an old estimate that got an invoice number (before 2.42.3 its bar said «Invoice & pay») is not a debt:
   not in Home «Not paid yet», no «Take payment» bar, still printed as an estimate; «Customer agreed» drops the old number.
   (2) the job head says the day and AM/PM: «opened today 1:20 PM» / «opened 21 Nov 9:05 AM» (Arabic «فُتح اليوم … م»). */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};const W=t=>new Promise(r=>setTimeout(r,t));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));
 const ev=(f,a)=>p.evaluate(f,a);
 const id=await ev(()=>{const v=DB.vehicles[0];const j=newJobFor(v,0);j.stage='estimate';j.items=[{k:'labour',d:'Brake fluid flush',q:1,p:9}];
   j.t=new Date('2026-11-21T09:05:00+04:00').getTime();j.inv={no:4242,t:j.t+3600e3,by:'S'};j.invLink='x';j.nost=1;DB.jobs.push(j);save();return j.id;});
 await ev(()=>go('home'));await W(500);
 const home=await ev(()=>document.querySelector('#main').innerText);
 ok(!/4242|Not paid yet[\s\S]*Brake fluid/.test(home)&&await ev(id=>jobDue(byId('jobs',id))===0,id),'an estimate with an old invoice number is not in «Not paid yet» and owes nothing');
 await ev(id=>go('job',{id}),id);await W(500);
 ok(!(await p.$('#jtake')),'no «Take payment» bar on the estimate');
 ok(!!(await p.$('#jsendest2')),'the estimate bar still sends the estimate');
 const sub=await ev(()=>document.querySelector('#main').innerText);
 ok(/opened 21 Nov 9:05 AM by/.test(sub),'opened shows the day and AM/PM: '+(sub.match(/opened[^\n]*/)||[''])[0]);
 const html=await ev(id=>invoiceHtml(byId('jobs',id)),id);
 ok(/ESTIMATE|عرض سعر/.test(html)&&!/4242/.test(html),'printed as an estimate, not invoice #4242');
 /* today + Arabic */
 await ev(id=>{const j=byId('jobs',id);j.t=Date.now();},id);await ev(()=>{DB.ws.lang='ar';});await ev(id=>go('job',{id}),id);await W(500);
 const ar=await ev(()=>document.querySelector('#main').innerText);
 ok(/فُتح اليوم \d{1,2}:\d\d (ص|م) بواسطة/.test(ar),'Arabic: '+(ar.match(/فُتح[^\n]*/)||[''])[0]);
 await ev(()=>{DB.ws.lang='en';});await ev(id=>go('job',{id}),id);await W(500);
 ok(/opened today \d{1,2}:\d\d (AM|PM) by/.test(await ev(()=>document.querySelector('#main').innerText)),'today shows «today»');
 /* customer agreed */
 await p.click('#jnext');await W(500);
 const j=await ev(id=>{const j=byId('jobs',id);return {st:j.stage,inv:!!j.inv,lk:!!j.invLink,log:j.log.map(x=>x[1]).join('|')};},id);
 ok(j.st==='new'&&!j.inv&&!j.lk&&/Old estimate invoice #4242 dropped/.test(j.log),'«Customer agreed» → job card without the old invoice number '+JSON.stringify(j));
 ok(!errs.length,'no page errors '+errs.join(' | '));
 await b.close();})();
