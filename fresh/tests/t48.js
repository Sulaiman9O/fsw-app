const {chromium}=require('playwright');const M=require('./fbmock.js');
(async()=>{const b=await chromium.launch();const errs=[];const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 const mk=async()=>{const ctx=await b.newContext({viewport:{width:412,height:900}});await M.attach(ctx);await ctx.addInitScript(M.init);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());return [ctx,p];};
 const key=async(p,s)=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 let [ca,A]=await mk();await A.goto('http://localhost:8811/');await A.waitForTimeout(600);await A.fill('#obn','FSW');await A.locator('.btn').first().click();await A.locator('input.field').first().fill('S');await A.locator('.btn').first().click();await key(A,'1234');await key(A,'1234');await A.waitForTimeout(900);await A.click('#nwdemo');await A.click('#nwl').catch(()=>{});
 await A.evaluate(()=>go('settings'));await A.waitForTimeout(300);await A.fill('#syem','shop@test.com');await A.fill('#sypw','secret1');await A.click('#syin');await A.waitForTimeout(2500);
 let [cb,B]=await mk();await B.goto('http://localhost:8811/');await B.waitForTimeout(600);await B.click('#objoin');await B.fill('#jem','shop@test.com');await B.fill('#jpw','secret1');await B.click('#jgo');await B.waitForTimeout(2500);await B.click('.person').catch(()=>{});await key(B,'1234');await B.waitForTimeout(400);
 // B closes app
 const bState=await B.evaluate(()=>({db:localStorage.getItem('workshop_v1')||'',}));await B.close();
 // A: add a payment on demo job
 const jid=await A.evaluate(()=>{const j=DB.jobs.find(j=>j.inv&&jobTotals(j).due>0.01)||DB.jobs.find(j=>j.inv);j.pays.push({m:'Cash',amt:1.234,t:now(),by:'A'});save();return j.id;});await A.waitForTimeout(1500);
 // B reopens (same context = same storage)
 B=await cb.newPage();B.on('pageerror',e=>errs.push(e.message));await B.route('**/raw.githubusercontent.com/**',r=>r.abort());await B.goto('http://localhost:8811/');await B.waitForTimeout(3000);
 const bHas=await B.evaluate(id=>{const j=DB.jobs.find(x=>x.id===id);return j&&j.pays.some(p=>p.amt===1.234);},jid);ok(bHas,'B got the payment made while closed');
 await A.waitForTimeout(1500);const aHas=await A.evaluate(id=>DB.jobs.find(x=>x.id===id).pays.some(p=>p.amt===1.234),jid);ok(aHas,'A still has its payment after B reopened');
 // duplicate invoice numbers: both offline make invoice
 await A.evaluate(()=>syncStop());await B.evaluate(()=>syncStop());
 const mkInv=async(P,tag)=>P.evaluate(tag=>{const v=DB.vehicles[0];const j={id:'jd'+tag,no:DB.ws.nextJob++,dev:syncDev(),cust:v.cust,veh:v.id,km:0,stage:'ready',items:[{k:'labour',d:'x',q:1,p:1}],disc:0,t:now(),by:tag,log:[],pays:[]};j.inv={no:DB.ws.nextInv++,t:now(),by:tag,dev:syncDev()};DB.jobs.push(j);save();return j.inv.no+'/'+j.no;},tag);
 const na=await mkInv(A,'A');await A.waitForTimeout(50);const nb=await mkInv(B,'B');console.log('offline numbers A',na,'B',nb);
 await A.evaluate(()=>{SYNC.on=false;syncStart();});await A.waitForTimeout(1500);await B.evaluate(()=>{SYNC.on=false;syncStart();});await B.waitForTimeout(2500);await A.waitForTimeout(1500);
 const nums=async P=>P.evaluate(()=>['jdA','jdB'].map(id=>{const j=DB.jobs.find(x=>x.id===id);return j?j.inv.no+'/'+j.no:'-';}).join(' '));
 const ra=await nums(A),rb=await nums(B);console.log('after sync A sees',ra,'B sees',rb);const pa=ra.split(' ');ok(pa[0]!==pa[1]&&ra===rb,'invoice numbers unique and same on both');
 console.log('A jobs',await A.evaluate(()=>DB.jobs.map(j=>j.id+':'+j.no).join(' ')+' | sync '+SYNC.status+' '+SYNC.err+' on '+SYNC.on));console.log('B jobs',await B.evaluate(()=>DB.jobs.map(j=>j.id+':'+j.no+':'+(j.dev||'').slice(0,4)).join(' ')+' me '+syncDev().slice(0,4)+' | '+SYNC.status+' '+SYNC.err));
console.log('store',[...M.store.keys()].filter(k=>/jd|order%3Ajobs|order:jobs/.test(k)).join(' '));
console.log(errs);await b.close();})();
