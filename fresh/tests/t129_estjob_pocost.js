/* estimate → job: the counter shows the waiting estimate and turns it into the job card; a new card asks first; estimates show in Open; order line cost can be edited */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));
 const ids=await p.evaluate(cat=>{DB.parts=cat.parts;DB.services=cat.services;const c={id:uid('c'),name:'Ali',phone:'91111111',t:now()};DB.customers.push(c);
   const v={id:uid('v'),cust:c.id,make:'Toyota',model:'Camry',year:'2023',plate:'27084',t:now()};DB.vehicles.push(v);
   const e={id:uid('j'),no:DB.ws.nextJob++,cust:c.id,veh:v.id,km:0,stage:'estimate',items:[{k:'part',d:'Toyota Oil Filter',q:1,p:3}],disc:0,t:now(),by:'S',log:[],pays:[]};DB.jobs.push(e);save();return {v:v.id,e:e.id,n:DB.jobs.length};},cat);
 await p.evaluate(()=>go('work'));await p.waitForTimeout(300);ok(await p.evaluate(id=>!!document.querySelector('#main [data-go="job:'+id+'"]')||document.querySelector('#main').textContent.includes('Estimate'),ids.e),'recent estimate shows in the Open work list');
 await p.evaluate(v=>go('counter',{vid:v}),ids.v);await p.waitForTimeout(400);ok(await p.$('#cest'),'counter shows the waiting estimate');
 await p.fill('#ckm','120000');await p.click('#cest');await p.waitForTimeout(400);
 let r=await p.evaluate(ids=>{const e=byId('jobs',ids.e);return {stage:e.stage,from:e.fromEst,km:e.km,n:DB.jobs.length,route:S.r,pid:S.p.id};},ids);
 ok(r.stage==='new'&&r.from&&r.n===ids.n&&r.route==='job'&&r.pid===ids.e,'estimate became the job card, no second card '+JSON.stringify(r));ok(r.km===120000,'km kept');
 /* second estimate, then Oil change from the counter: asks first */
 const e2=await p.evaluate(v=>{const vv=byId('vehicles',v);byId('jobs',DB.jobs.find(j=>j.veh===v).id).stage='done';const e={id:uid('j'),no:DB.ws.nextJob++,cust:vv.cust,veh:v,km:0,stage:'estimate',items:[],disc:0,t:now(),by:'S',log:[],pays:[]};DB.jobs.push(e);save();go('counter',{vid:v});return e.id;},ids.v);await p.waitForTimeout(400);
 const n0=await p.evaluate(()=>DB.jobs.length);await p.click('#cadd');await p.waitForTimeout(400);ok(await p.$('#egu'),'other work on a car with an estimate asks first');
 await p.click('#egn');await p.waitForTimeout(400);r=await p.evaluate(e2=>({n:DB.jobs.length,st:byId('jobs',e2).stage}),e2);ok(r.n===n0+1&&r.st==='estimate','"new job card" makes a new card and keeps the estimate');
 /* old estimate (60 days) does not ask */
 await p.evaluate(e2=>{const e=byId('jobs',e2);e.t=Date.now()-60*864e5;DB.jobs.filter(j=>j.stage==='new').forEach(j=>j.stage='done');save();},e2);
 await p.evaluate(v=>go('counter',{vid:v}),ids.v);await p.waitForTimeout(300);ok(!(await p.$('#cest')),'old estimate is not offered');
 /* order cost edit */
 await p.evaluate(()=>{DB.vendors.push({id:'dv1',name:'Rayyan',t:now()});const pt=DB.parts[0];const o=newPo('dv1',[{part:pt.id,q:10,cost:3.41}]);go('po',{id:o.id});});await p.waitForTimeout(300);
 await p.click('[data-oc="0"]');await p.waitForTimeout(300);await p.fill('#ocv','4');await p.click('#ocok');await p.waitForTimeout(300);
 r=await p.evaluate(()=>({c:DB.pos[DB.pos.length-1].items[0].cost,t:document.querySelector('#potot').textContent}));ok(r.c===4&&/40\.000/.test(r.t),'order line cost edited → total 40 '+JSON.stringify(r));
 ok(!errs.length,'no page errors '+errs.join('|'));console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
