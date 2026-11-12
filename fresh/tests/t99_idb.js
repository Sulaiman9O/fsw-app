const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:800}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
 const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 /* A: fresh workshop in a browser */
 await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 ok(await p.evaluate(()=>STORE.kind)==='idb','new workshop uses IndexedDB');
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;
   /* 200 big photos = far over 5 MB */ DB.photos=[];const big='data:image/jpeg;base64,'+'A'.repeat(60000);for(let i=0;i<200;i++)DB.photos.push({id:'ph'+i,img:big,t:Date.now()});save();},[cat,cu]);
 await p.waitForTimeout(1500);await p.evaluate(()=>flushNow());await p.waitForTimeout(800);
 const ls=await p.evaluate(()=>(localStorage.getItem('ws_db_v1')||'').length);console.log('localStorage DB chars',ls);
 await p.reload();await p.waitForTimeout(1500);
 let r=await p.evaluate(()=>({k:STORE.kind,jobs:DB.jobs.length,ph:(DB.photos||[]).length,ws:!!DB.ws,label:storeLabel()}));console.log(JSON.stringify(r));ok(r.k==='idb'&&r.jobs===766&&r.ph===200,'reload keeps 766 jobs + 200 photos (~12 MB)');
 /* B: an old browser copy in localStorage moves over */
 const ctx2=await b.newContext();const q=await ctx2.newPage();await q.route('**/raw.githubusercontent.com/**',r=>r.abort());
 await q.goto('http://localhost:8811/');await q.waitForTimeout(600);
 await q.evaluate(([cat,cu])=>{const d=Object.assign(blankDB(),{ws:{name:'OLD',currency:'OMR'},users:[{id:'u1',name:'S',role:'owner',pin:'1234',color:'#f00'}],customers:cu.customers,vehicles:cu.vehicles,jobs:cu.jobs.slice(0,300)});localStorage.setItem('ws_db_v1',JSON.stringify(d));localStorage.removeItem('ws_store');},[cat,cu]);
 await q.reload();await q.waitForTimeout(1500);
 r=await q.evaluate(()=>({k:STORE.kind,jobs:DB.jobs.length,name:DB.ws&&DB.ws.name,old:!!localStorage.getItem('ws_db_v1'),bk:!!localStorage.getItem('ws_db_v1_pre_idb')}));console.log(JSON.stringify(r));ok(r.k==='idb'&&r.jobs===300&&r.name==='OLD'&&!r.old&&r.bk,'old browser copy moved, backup kept');
 await q.evaluate(()=>{DB.ws.name='NEW';save();});await q.waitForTimeout(600);await q.reload();await q.waitForTimeout(1200);
 ok(await q.evaluate(()=>DB.ws.name)==='NEW','a change after moving is kept');
 console.log('errors',errs);await b.close();})();
