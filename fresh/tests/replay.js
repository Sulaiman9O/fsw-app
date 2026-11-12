/* REPLAY: drive ShopFlo like a worker through months of real past jobs (from the ARI export), with the clock set to each
   job's real time. Every step goes through the screens: counter search → car → km → Other work → items (✏️ Something else)
   → discount → Invoice & pay (or invoice now, pay later on the invoice page) → daily close at night.
   Then every number is checked against the source. Usage: node replay.js [fromYYYY-MM-DD] [toYYYY-MM-DD] [maxJobs]
   Output: replay_report.json (never committed — has customer data). */
const {chromium}=require('playwright');const fs=require('fs');
const FROM=process.argv[2]||'2026-08-01',TO=process.argv[3]||'2026-12-31',MAX=+process.argv[4]||99999;
const SRC=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));const CAT=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));
if(process.env.ADDON){const A=JSON.parse(fs.readFileSync(process.env.ADDON));SRC.customers.push(...A.customers);SRC.vehicles.push(...A.vehicles);SRC.jobs.push(...A.jobs);}
const T0=Date.parse(FROM+'T00:00:00+04:00'),T1=Date.parse(TO+'T23:59:59+04:00');
const r3=x=>Math.round(x*1000)/1000;const dayK=t=>new Date(t+4*3600e3).toISOString().slice(0,10);
const jobTot=j=>r3((j.items||[]).reduce((a,i)=>a+(+i.q)*(+i.p),0)-(+j.disc||0));const jobPaid=j=>r3((j.pays||[]).reduce((a,p)=>a+(+p.amt||0),0));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900}});
 await ctx.addInitScript(()=>{const RD=Date;let off=0;window.__setNow=t=>{off=t-RD.now();};
   class FD extends RD{constructor(...a){if(!a.length)super(RD.now()+off);else super(...a);}static now(){return RD.now()+off;}}window.Date=FD;});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push({t:'page',m:e.message,job:cur}));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push({t:'console',m:m.text().slice(0,200),job:cur});});
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());let cur=null;
 const W=ms=>p.waitForTimeout(ms);const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await W(30);}};
 await p.goto('http://localhost:8811/');await W(900);
 await p.fill('#obn','Fast Service World');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await W(900);await p.click('#nwl').catch(()=>{});
 /* the migrated data: catalog, customers, cars, and every job before the replay window */
 const before=SRC.jobs.filter(j=>j.t<T0),replay=SRC.jobs.filter(j=>j.t>=T0&&j.t<=T1&&j.stage==='done'&&(j.items||[]).length).sort((a,b)=>a.t-b.t).slice(0,MAX);
 await p.evaluate(([cat,src,before])=>{DB.parts=cat.parts;DB.services=cat.services;if(cat.scats)DB.scats=cat.scats;if(cat.pcats)DB.pcats=cat.pcats;DB.customers=src.customers;DB.vehicles=src.vehicles;DB.jobs=before;DB.reminders=[];
   DB.ws.nextJob=Math.max(1,...before.map(j=>+j.no||0))+1;DB.ws.nextInv=Math.max(1,...before.map(j=>j.inv?+j.inv.no:0))+1;DB.ws.lang='ar';S.user.lang='ar';langApply();save();window.toast=()=>{};
   document.querySelectorAll('#tour').forEach(x=>x.remove());},[CAT,SRC,before]);
 console.log('history',before.length,'replay',replay.length);
 /* events: open each job at its time; a later payment at its time; a daily close every evening */
 const ev=[];replay.forEach(j=>{ev.push({t:j.t,k:'job',j});const tot=jobTot(j),paid=jobPaid(j);const pt=(j.pays||[]).length?Math.min(...j.pays.map(x=>x.t)):j.t;
   if(paid>0&&(dayK(pt)!==dayK(j.t)||paid<tot-0.0005))ev.push({t:Math.max(pt,j.t+60e3),k:'pay',j,amt:Math.min(paid,tot)});});
 const days=[...new Set(replay.map(j=>dayK(j.t)))];days.forEach(d=>ev.push({t:Date.parse(d+'T21:30:00+04:00'),k:'close',d}));ev.sort((a,b)=>a.t-b.t);
 const map={};/* source job id → new job id */const issues=[];const iss=(job,what,extra)=>{issues.push(Object.assign({job:job&&job.no,what},extra||{}));};
 const setNow=t=>p.evaluate(t=>window.__setNow(t),t);const sheet=()=>p.$('#sheet');
 let n=0;const t00=Date.now();
 for(const e of ev){
  try{
   if(e.k==='job'){const j=e.j;cur=j.no;await setNow(e.t);
    if(!j.veh){/* no car: a counter sale (used oil, scrap, parts) through 🛒 Quick sale */
      const c=SRC.customers.find(x=>x.id===j.cust)||{};await p.evaluate(()=>{closeSheet();S.sale=null;S.ctr={q:'',vid:null,km:''};go('counter');});await W(60);await p.click('.ctrsale');await W(80);
      for(const it of j.items){await p.click('#slcust');await W(60);await p.fill('#sxd',it.d||'Item');await p.click(`#sheet [data-sk="${it.k==='part'?'part':'labour'}"]`);await p.fill('#sxq',String(it.q));await p.fill('#sxp',String(it.p));await p.click('#sxok');await W(60);}
      const sum=await p.evaluate(()=>S.sale.items.reduce((a,i)=>a+i.q*i.p,0));if(Math.abs(sum-(jobTot(j)+(+j.disc||0)))>0.0006)iss(j,'sale total differs',{exp:jobTot(j),got:sum});
      if(+j.disc){await p.click('#sldisc');await W(60);await p.fill('#sdam',String(j.disc));await p.click('#sdok');await W(80);}
      if(c.phone||c.name){await p.evaluate(()=>{const d=document.querySelector('details.pmore');if(d)d.open=true;});if(c.phone)await p.fill('#slph',c.phone);if(c.name)await p.fill('#slnm',c.name);}
      const paid=jobPaid(j);const pt0=(j.pays||[]).length?Math.min(...j.pays.map(x=>x.t)):j.t;await p.click('#slpay');await W(80);await p.click(paid>=jobTot(j)-0.0005&&dayK(pt0)===dayK(j.t)?'#sheet [data-pm="Cash"]':'#sheet [data-pm="Credit"]').catch(async()=>{iss(j,'no credit button in sale');await p.click('#sheet [data-pm="Cash"]');});await W(120);
      const jid=await p.evaluate(()=>S.p.id);map[j.id]=jid;if(await p.evaluate(id=>jobTotals(byId('jobs',id)).due<=0.0005,jid))ev.forEach(x=>{if(x.k==='pay'&&x.j===j)x.skip=1;});n++;continue;}const v=SRC.vehicles.find(x=>x.id===j.veh)||{};const c=SRC.customers.find(x=>x.id===j.cust)||{};
    await p.evaluate(()=>{closeSheet();go('counter');S.ctr={q:'',vid:null,km:''};render();});await W(60);
    const q=(v.plate||'').trim()||(c.phone||'').trim()||(c.name||'').trim();await p.fill('#cq',q);await W(120);
    const hit=await p.$(`[data-cv="${j.veh}"]`);if(hit)await hit.click();else{iss(j,'counter search did not find the car',{q});await p.evaluate(v=>{S.ctr.vid=v;render();},j.veh);}await W(80);
    if(j.km)await p.fill('#ckm',String(j.km));
    const oj=await p.$('#coj');if(oj)iss(j,'car already had an open job',{});
    await p.click('#cadd');await W(250);
    const jid=await p.evaluate(()=>S.p.id);map[j.id]=jid;
    for(const it of j.items){if(!(await sheet()))await p.click('#jadd');await W(60);
      await p.click('#acust');await W(60);await p.fill('#ed',it.d||'Item');await p.click(`#sheet [data-k="${it.k==='part'?'part':'labour'}"]`);await p.fill('#eq',String(it.q));await p.fill('#ep',String(it.p));await p.click('#eok');await W(70);
      if(await sheet()){const any=await p.$('#acust');if(!any){iss(j,'item sheet did not close',{item:it.d});await p.evaluate(()=>closeSheet());}}}
    if(await sheet())await p.evaluate(()=>closeSheet());
    if(+j.disc){await p.click('#jdisc');await W(60);await p.fill('#dam',String(j.disc));await p.click('#dok');await W(80);}
    const got=await p.evaluate(id=>{const x=byId('jobs',id);return {n:x.items.length,tot:jobTotals(x).total};},jid);const exp=jobTot(j);
    if(got.n!==j.items.length)iss(j,'item count differs',{exp:j.items.length,got:got.n});if(Math.abs(got.tot-exp)>0.0006)iss(j,'job total differs',{exp,got:got.tot});
    /* pay: same day in full → Invoice & pay (Cash); else invoice now, pay later */
    const paid=jobPaid(j);const pt=(j.pays||[]).length?Math.min(...j.pays.map(x=>x.t)):j.t;
    await p.click('#jpay');await W(80);
    if(paid>=exp-0.0005&&dayK(pt)===dayK(j.t)){await p.click('#sheet [data-pm="Cash"]');}else{await p.click('#pmlater');}
    await W(120);const st=await p.evaluate(id=>{const x=byId('jobs',id);return {inv:!!x.inv,stage:x.stage,due:jobTotals(x).due,r:S.r};},jid);
    if(!st.inv)iss(j,'no invoice made');
    n++;if(n%25===0)console.log(n,'jobs',Math.round((Date.now()-t00)/1000)+'s','issues',issues.length,'errors',errs.length);}
   else if(e.k==='pay'){if(e.skip)continue;const j=e.j;cur=j.no;const jid=map[j.id];if(!jid)continue;await setNow(e.t);await p.evaluate(id=>{closeSheet();go('inv',{id});},jid);await W(100);
    const pb=await p.$('[data-pay="Cash"]');if(!pb){iss(j,'no payment button on the invoice',{});continue;}await pb.click();await W(80);await p.fill('#pam',String(e.amt));await p.click('#pok');await W(100);}
   else if(e.k==='close'){cur='close '+e.d;await setNow(e.t);await p.evaluate(()=>{closeSheet();go('close');});await W(120);
    const exp=await p.evaluate(()=>{const td=sumRange(rangeOf('today'));return td.byM.Cash||0;});const c=await p.$('#ccnt');
    if(c){const opening=await p.evaluate(()=>{const last=DB.closes.filter(c=>c.date!==today()).sort((a,b)=>b.t-a.t)[0];return last?last.counted:(+DB.openingCash||0);});await p.fill('#ccnt',String(r3(opening+exp)));await p.click('#cok');await W(100);
      const d=await p.evaluate(()=>{const x=DB.closes.find(c=>c.date===today());return x&&x.diff;});if(d==null||Math.abs(d)>0.0006)iss(null,'daily close does not match',{day:e.d,diff:d});}}
  }catch(err){const m=String(err.message||err);iss(e.j,'robot step failed: '+m.split('\n')[0].slice(0,160),{k:e.k,detail:(m.match(/waiting for (locator\([^)]*\))/)||[])[1]||m.split('\n').slice(1,3).join(' ').slice(0,200)});await p.evaluate(()=>{try{closeSheet();}catch(e){}}).catch(()=>{});}
 }
 /* ---- final checks against the source ---- */
 const fin=await p.evaluate(()=>{const J=DB.jobs.filter(j=>j.src!=='imp');return {jobs:J.map(j=>({id:j.id,no:j.no,inv:j.inv&&j.inv.no,t:j.t,tot:jobTotals(j).total,due:jobTotals(j).due,stage:j.stage,cust:j.cust})),
   rem:DB.reminders.length,closes:DB.closes.length,stockNeg:DB.parts.filter(p=>(+p.stock||0)<0).length,
   month:(()=>{const o={};DB.jobs.filter(j=>j.inv&&j.src!=='imp').forEach(j=>{const k=new Date(j.inv.t+4*3600e3).toISOString().slice(0,7);o[k]=(o[k]||0)+jobTotals(j).total;});return o;})(),
   debts:(()=>{const o={};DB.jobs.filter(j=>j.inv&&!j.returned).forEach(j=>{const d=jobTotals(j).due;if(d>0.0005)o[j.cust]=(o[j.cust]||0)+d;});return o;})()};});
 const srcMonth={},srcDebt={};replay.forEach(j=>{const k=new Date(j.t+4*3600e3).toISOString().slice(0,7);srcMonth[k]=r3((srcMonth[k]||0)+jobTot(j));});
 before.concat(replay).filter(j=>j.inv).forEach(j=>{const d=r3(jobTot(j)-jobPaid(j));if(d>0.0005)srcDebt[j.cust]=r3((srcDebt[j.cust]||0)+d);});
 Object.keys(srcMonth).forEach(k=>{const g=r3(fin.month[k]||0);if(Math.abs(g-srcMonth[k])>0.002)iss(null,'month sales differ',{month:k,exp:srcMonth[k],got:g});});
 Object.keys(srcDebt).forEach(c=>{const g=r3(fin.debts[c]||0);if(Math.abs(g-srcDebt[c])>0.002)iss(null,'customer debt differs',{cust:c,exp:srcDebt[c],got:g});});
 const invNos=fin.jobs.map(j=>j.inv).filter(Boolean).sort((a,b)=>a-b);for(let i=1;i<invNos.length;i++)if(invNos[i]!==invNos[i-1]+1)iss(null,'invoice numbers have a gap or repeat',{a:invNos[i-1],b:invNos[i]});
 const rep={from:FROM,to:TO,replayed:n,secs:Math.round((Date.now()-t00)/1000),srcMonth,gotMonth:Object.fromEntries(Object.entries(fin.month).map(([k,v])=>[k,r3(v)])),reminders:fin.rem,closes:fin.closes,stockNegative:fin.stockNeg,issues,errors:errs.slice(0,200),errorCount:errs.length};
 fs.writeFileSync('replay_report.json',JSON.stringify(rep,null,1));
 console.log(JSON.stringify({replayed:n,secs:rep.secs,issues:issues.length,errors:errs.length,srcMonth,gotMonth:rep.gotMonth,rem:fin.rem,closes:fin.closes,neg:fin.stockNeg},null,1));
 const byWhat={};issues.forEach(x=>byWhat[x.what]=(byWhat[x.what]||0)+1);console.log(byWhat);const ue={};errs.forEach(x=>ue[x.m]=(ue[x.m]||0)+1);console.log(Object.entries(ue).slice(0,15));
 await b.close();})();
