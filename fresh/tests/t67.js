const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();save();go('home');},[cat,cu]);await p.waitForTimeout(600);
 const hide=()=>p.evaluate(()=>document.querySelectorAll('#toast,#undob').forEach(x=>x.hidden=true));
 /* one due total */
 const dues=[];for(const r of ['home','money','debts']){await p.evaluate(r=>go(r),r);await p.waitForTimeout(1800);dues.push(await p.evaluate(r=>{const k=document.querySelector(r==='home'?'.kpi.org b':'#main .kpi.org b');return k&&k.innerText;},r));}
 console.log('dues',dues);ok(dues[0]===dues[1]&&dues[1]===dues[2],'same due everywhere');
 await p.evaluate(()=>go('work'));await p.waitForTimeout(300);const all=await p.evaluate(()=>document.querySelector('[data-f="all"] span').innerText);ok(+all>0,'work All count '+all);
 /* counter */
 await p.evaluate(()=>go('home'));await p.waitForTimeout(300);await p.click('.bigbtn');await p.waitForTimeout(400);ok(await p.evaluate(()=>S.r)==='counter','big button → counter');
 await p.fill('#cq','31838');await p.waitForTimeout(400);await hide();await p.screenshot({path:'c1.png'});await p.click('[data-cv]');await p.waitForTimeout(500);await hide();await p.screenshot({path:'c2.png'});
 ok(!!(await p.$('#crep')),'repeat card');ok(!!(await p.$('#coil')),'oil card');const repPrice=await p.$eval('#crep em',x=>x.innerText);console.log('repeat price',repPrice);
 const stock0=await p.evaluate(()=>{const v=byId('vehicles',S.ctr.vid);const lv=DB.jobs.filter(j=>j.veh===v.id&&(j.items||[]).length).sort((a,b)=>b.t-a.t)[0];const oil=lv.items.map(partOfItem).find(x=>x&&x.cat==='Engine oil');return [oil.id,+oil.stock];});
 await p.click('#crep');await p.waitForTimeout(600);ok(await p.evaluate(()=>S.r)==='job','job opened');
 const it=await p.evaluate(()=>byId('jobs',S.p.id).items.map(i=>({d:i.d,ref:!!i.ref,p:i.p})));console.log(JSON.stringify(it));ok(it.every(i=>i.ref),'all lines linked to today\'s parts/services');
 const tot=await p.evaluate(()=>f3(jobTotals(byId('jobs',S.p.id)).total));ok(tot===repPrice,'card price = job total '+tot);
 ok(!(await p.$('.jb-r.tot small'))||!(await p.$eval('.jb-r.tot small',x=>/profit|الربح/.test(x.innerText))),'profit hidden by default');
 ok(!!(await p.$('.paybar #jpay')),'pay bar');await hide();await p.screenshot({path:'c3.png'});
 /* tap a line → actions with Change */
 await p.click('[data-it="0"]');await p.waitForTimeout(400);const acts=await p.evaluate(()=>[...document.querySelectorAll('#sheet [data-ai] b')].map(x=>x.innerText));console.log(acts.join(' | '));ok(/غيّرها|Change/.test(acts[0]||''),'Change is first');
 await hide();await p.screenshot({path:'c4.png'});await p.evaluate(()=>closeSheet());await p.waitForTimeout(300);
 await p.click('#jpay');await p.waitForTimeout(400);await hide();await p.screenshot({path:'c5.png'});await p.click('[data-pm="Cash"]');await p.waitForTimeout(700);
 const st=await p.evaluate(([oid])=>{const j=DB.jobs[DB.jobs.length-1];return {r:S.r,stage:j.stage,due:jobTotals(j).due,inv:!!j.inv,stock:+byId('parts',oid).stock,rem:DB.reminders.filter(x=>x.job===j.id||x.veh===j.veh).length};},stock0);
 console.log(JSON.stringify(st),'stock before',stock0[1]);ok(st.r==='inv'&&st.stage==='done'&&st.due===0&&st.inv,'invoice+paid+closed in 2 taps');ok(st.stock<stock0[1],'oil taken out of stock');
 await hide();await p.screenshot({path:'c6.png'});
 /* bug button */
 await p.click('[data-bug]');await p.waitForTimeout(300);await p.fill('#bgn','test problem');await p.click('#bgok');await p.waitForTimeout(300);ok(await p.evaluate(()=>DB.bugs.length===1&&DB.bugs[0].r==='inv'),'bug saved with screen');
 /* quick price guess flag: a car with no maker data and no visit */
 await p.evaluate(()=>{S.quote={vid:null,car:{make:'Jaguar',model:'XF',year:'2012',engine:''},kind:'oil',vf:'all',cv:false,q:''};go('quote');});await p.waitForTimeout(500);
 ok(!!(await p.$('.guess')),'quote shows guess warning');await hide();await p.screenshot({path:'c7.png'});
 /* customer page: car row → counter */
 await p.evaluate(()=>{const v=DB.vehicles.find(v=>/camry/i.test(v.model));go('custd',{id:v.cust});});await p.waitForTimeout(400);await p.click('[data-ve] .ctrgo');await p.waitForTimeout(400);ok(await p.evaluate(()=>S.r)==='counter','car row → counter');
 console.log('errors',errs);await b.close();})();
