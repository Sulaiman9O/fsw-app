/* STRESS: a workshop after years — 10,000 jobs, 3,000 customers, 600 photos. How long does each screen take,
   how long does saving and reopening take, and does anything break. Usage: node stress.js [jobs] [width] */
const {chromium}=require('playwright');const fs=require('fs');
const NJ=+process.argv[2]||10000,WIDTH=+process.argv[3]||1366;
const CAT=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const SRC=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:WIDTH,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(30);}};
 await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const gen=await p.evaluate(([cat,src,NJ])=>{const t0=performance.now();DB.parts=cat.parts;DB.services=cat.services;if(cat.scats)DB.scats=cat.scats;if(cat.pcats)DB.pcats=cat.pcats;
   const C=[],V=[];for(let i=0;i<3000;i++){const s=src.customers[i%src.customers.length];C.push(Object.assign({},s,{id:'c'+i,name:s.name+' '+i,phone:String(90000000+i)}));const v=src.vehicles[i%src.vehicles.length];V.push(Object.assign({},v,{id:'v'+i,cust:'c'+i,plate:(10000+i)+' A',ph:[]}));}
   const J=[];const T=Date.now()-3*365*864e5;for(let i=0;i<NJ;i++){const s=src.jobs[i%src.jobs.length];const t=T+i*(3*365*864e5/NJ);const vi=Math.floor(Math.random()*3000);
     const j=Object.assign({},s,{id:'j'+i,no:i+1,cust:'c'+vi,veh:'v'+vi,t,items:s.items.map(x=>Object.assign({},x)),log:[],inv:{no:i+1,t,by:'S'},pays:(s.pays||[]).map(x=>Object.assign({},x,{t})),stage:'done'});J.push(j);}
   const n=Date.now();J.slice(-15).forEach((j,i)=>{j.stage=['new','work','ready'][i%3];delete j.inv;j.pays=[];j.t=n-i*3600e3;});
   const img='data:image/jpeg;base64,'+'/9j/'+'A'.repeat(40000);DB.photos=[];for(let i=0;i<600;i++){DB.photos.push({id:'ph'+i,veh:'v'+i,img,t:n});V[i].ph=['ph'+i];}
   DB.customers=C;DB.vehicles=V;DB.jobs=J;DB.ws.nextJob=NJ+1;DB.ws.nextInv=NJ+1;window.toast=()=>{};return Math.round(performance.now()-t0);},[CAT,SRC,NJ]);
 if(process.env.CPU){const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:+process.env.CPU});}
 const tSave=Date.now();await p.evaluate(()=>{save();return flushNow();});const saveMs=Date.now()-tSave;
 const st=await p.evaluate(()=>storeLabel());
 const times={};for(const r of ['home','work','cust','stock','money','reports','debts','checks','more','counter']){const t=await p.evaluate(r=>{const a=performance.now();go(r);return Math.round(performance.now()-a);},r);times[r]=t;await p.waitForTimeout(150);}
 await p.evaluate(()=>go('counter'));await p.fill('#cq','1234');const tq=Date.now();await p.waitForTimeout(50);times['counter search']=await p.evaluate(()=>{const a=performance.now();ctrFind('12345');return Math.round(performance.now()-a);});
 times.job=await p.evaluate(()=>{const a=performance.now();go('job',{id:DB.jobs.at(-1).id});return Math.round(performance.now()-a);});
 times.custd=await p.evaluate(()=>{const a=performance.now();go('custd',{id:'c5'});return Math.round(performance.now()-a);});
 /* add an item and see how long a save of one change takes */
 const one=await p.evaluate(async()=>{const j=DB.jobs.at(-1);j.items.push({k:'labour',d:'x',q:1,p:1});const a=performance.now();save();await flushNow();return Math.round(performance.now()-a);});
 const tR=Date.now();await p.reload();await p.waitForFunction(()=>{try{return DB&&DB.jobs&&DB.jobs.length>100&&document.querySelector('.key,.login,#main');}catch(e){return false;}},null,{timeout:60000,polling:50}).catch(()=>{});const reloadMs=Date.now()-tR;
 const after=await p.evaluate(()=>({jobs:DB.jobs.length,photos:(DB.photos||[]).length,kind:STORE.kind,last:DB.jobs.at(-1).items.length}));
 const rep={jobs:NJ,generateMs:gen,firstSaveMs:saveMs,oneChangeSaveMs:one,reloadMs,storage:st,screensMs:times,after,errors:errs};fs.writeFileSync('stress_report'+(process.env.CPU?'_cpu'+process.env.CPU:'')+'.json',JSON.stringify(rep,null,1));console.log(JSON.stringify(rep,null,1));await b.close();})();
