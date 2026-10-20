const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';langApply();},[cat,cu]);
 const hide=()=>p.evaluate(()=>document.querySelectorAll('#toast').forEach(x=>x.hidden=true));
 // owner builds a package through the builder screen
 await p.evaluate(()=>go('pkgs'));await p.waitForTimeout(300);await p.click('#pknew');await p.waitForTimeout(300);
 await p.fill('#pn1','Full oil change');await p.fill('#pn2','تغيير الزيت الشامل');await p.fill('#pn3','Agency oil, filter, 20-point check');
 await p.click('#pa-s');await p.waitForTimeout(200);await p.fill('#pfq','engine oil');await p.waitForTimeout(100);await p.locator('[data-pf]:not([hidden])').first().click();await p.waitForTimeout(300);
 await p.click('#pa-o');await p.waitForTimeout(200);await p.locator('.sheet button',{hasText:/الوكالة|agency/i}).first().click();await p.waitForTimeout(300);
 await p.click('#pa-f');await p.waitForTimeout(300);
 // set included 5 L, extra 2.5 on the oil line
 await p.locator('[data-pi="1"]').click();await p.waitForTimeout(200);await p.fill('#pii','5');await p.fill('#pix','2.5');await p.click('#piok');await p.waitForTimeout(300);
 const addTier=async(f)=>{await p.click('#pa-t');await p.waitForTimeout(200);await f();await p.click('#tok');await p.waitForTimeout(300);};
 await addTier(async()=>{await p.click('#tc [data-cy="4"]');await p.fill('#tpr','15.5');});
 await addTier(async()=>{await p.click('#tc [data-cy="6"]');await p.fill('#tpr','19.5');});
 await addTier(async()=>{await p.fill('#tmk','Toyota');await p.fill('#tmo','Land Cruiser 300');await p.fill('#tpr','24.5');});
 await p.click('#pa-of');await p.waitForTimeout(200);await p.fill('#ov','10');await p.selectOption('#ot',{index:1});await p.click('#ook');await p.waitForTimeout(300);
 await p.click('#pa-a');await p.waitForTimeout(200);await p.fill('#an','Car wash');await p.fill('#aa','غسيل');await p.fill('#ap','2');await p.click('#aok');await p.waitForTimeout(300);
 if(await p.$('#pmin'))await p.fill('#pmin','5');
 await hide();await p.screenshot({path:'pk1.png',fullPage:true});await p.click('#psave');await p.waitForTimeout(300);
 const P=await p.evaluate(()=>DB.pkgs[0]);ok(P&&P.items.length===3&&P.tiers.length===3&&P.offers.length===1&&P.addons.length===1,'package built '+JSON.stringify({i:P.items.map(x=>x.k+':'+(x.auto||'')),t:P.tiers.map(t=>t.cond)}));
 const agency=await p.evaluate(()=>DB.ws.agencyOil);ok(agency.toyota,'agency oil prefilled '+JSON.stringify(agency));
 // matching
 const fit=await p.evaluate(()=>{const P=DB.pkgs[0];const f=v=>{const r=pkgFor(P,v);return r.tier?(r.tier.cond.cyl||r.tier.cond.model)+'@'+pkgPrice(P,r.tier).price:JSON.stringify(r);};
   return {camry:f({id:'_t',make:'Toyota',model:'Camry',year:'2015',engine:'2.5L 4 cyl · 2AR-FE'}),lc300:f({id:'_t',make:'Toyota',model:'Land Cruiser 300',year:'2023',engine:'3.5L V6 · V35A-FTS'}),patrol:f({id:'_t',make:'Nissan',model:'Patrol',year:'2015',engine:''}),v6:f({id:'_t',make:'Lexus',model:'ES 350',year:'2016',engine:'3.5L V6 · 2GR-FE'})};});
 console.log(JSON.stringify(fit));ok(fit.camry==='4@13.95'&&fit.lc300.startsWith('Land Cruiser 300@24.5')&&fit.patrol.includes('engine')&&fit.v6==='6@19.5','tiers: 4cyl with offer, LC300 beats 6 cyl, unknown engine asks');
 // worker: New car in for a known Camry
 const vid=await p.evaluate(()=>{const v=DB.vehicles.find(v=>/camry/i.test(v.model)&&v.year=='2015'&&/2AR/.test(effEng(v)));return v.id;});
 const st0=await p.evaluate(()=>DB.parts.filter(x=>x.cat==='Engine oil'||x.cat==='Oil filters').reduce((a,x)=>a+(+x.stock||0),0));
 await p.evaluate(vid=>{const v=byId('vehicles',vid);go('newjob',{n:{phone:'',name:'',plate:'',make:'',model:'',year:'',km:'',vin:'',engine:'',est:false,custId:v.cust,vehId:v.id,dupOk:true}});},vid);await p.waitForTimeout(400);
 ok(!!(await p.$('[data-pk]')),'package shown at New car in');await p.click('[data-pk]');await p.waitForTimeout(300);await p.click('[data-pka]');await hide();await p.screenshot({path:'pk2.png',fullPage:true});
 await p.click('#ngo');await p.waitForTimeout(600);
 const J=await p.evaluate(()=>{const j=byId('jobs',S.p.id);return {r:S.r,items:j.items.map(i=>[i.k,i.d.slice(0,28),i.q,i.p,!!i.inPkg]),T:jobTotals(j)};});
 console.log(JSON.stringify(J));ok(J.r==='job'&&J.items[0][0]==='pkg'&&Math.abs(J.T.total-(13.95+2))<0.001,'job has package 13.950 + wash 2 = '+J.T.total);
 await hide();await p.screenshot({path:'pk3.png',fullPage:true});
 // worker raises the oil to 6.5 L → extra 1.5 × 2.5
 await p.evaluate(()=>{const j=byId('jobs',S.p.id);const i=j.items.findIndex(x=>x.inPkg&&x.u==='L');editItemSheet(j,i);});await p.waitForTimeout(300);await p.fill('#pkq','6.5');await p.click('#pkok');await p.waitForTimeout(400);
 const J2=await p.evaluate(()=>{const j=byId('jobs',S.p.id);return {x:j.items.filter(i=>i.pkgx).map(i=>[i.q,i.p]),T:jobTotals(j).total};});ok(J2.x.length===1&&Math.abs(J2.x[0][0]-1.5)<1e-9&&Math.abs(J2.T-(13.95+2+3.75))<0.001,'extra 1.5 L × 2.5 added → '+J2.T);
 // price of package cannot be edited
 await p.evaluate(()=>{const j=byId('jobs',S.p.id);editItemSheet(j,0);});await p.waitForTimeout(300);ok(!(await p.$('#ep'))&&!!(await p.$('#pkdel')),'package price locked');await p.evaluate(()=>closeSheet());
 // invoice
 await p.evaluate(()=>{const j=byId('jobs',S.p.id);makeInvoice(j);});await p.waitForTimeout(400);await p.click('#cfy').catch(()=>{});await p.waitForTimeout(400);
 const inv=await p.evaluate(()=>{const j=byId('jobs',S.p.id);return {h:invoiceHtml(j),T:jobTotals(j)};});
 ok(inv.h.includes('ضمن الباقة')&&inv.h.includes('تغيير الزيت الشامل'),'invoice shows the package with included lines');
 ok(inv.h.includes((19.7).toFixed(3)),'invoice total 19.700');
 const st1=await p.evaluate(()=>DB.parts.filter(x=>x.cat==='Engine oil'||x.cat==='Oil filters').reduce((a,x)=>a+(+x.stock||0),0));ok(Math.abs((st0-st1)-(6.5+1))<0.01,'stock deducted oil 6.5 + filter 1 → '+(st0-st1));
 await p.evaluate(()=>go('inv',{id:S.p.id}));await p.waitForTimeout(400);await hide();await p.screenshot({path:'pk4.png',fullPage:true});
 // report
 const rep=await p.evaluate(()=>{const s=pkgStats();return s[DB.pkgs[0].id];});ok(rep&&rep.n===1&&rep.cost>0,'report '+JSON.stringify({n:rep.n,rev:rep.rev,cost:rep.cost}));
 await p.evaluate(()=>go('pkgs'));await p.waitForTimeout(300);await hide();await p.screenshot({path:'pk5.png',fullPage:true});
 // unknown engine at New car in shows the engine button
 const pid=await p.evaluate(()=>{const v=DB.vehicles.find(v=>/patrol/i.test(v.model)&&!v.engine);if(v){v.engine='';go('newjob',{n:{phone:'',name:'',plate:'',make:'',model:'',year:'',km:'',vin:'',engine:'',est:false,custId:v.cust,vehId:v.id,dupOk:true}});}return v&&v.id;});await p.waitForTimeout(300);
 if(pid)ok(!!(await p.$('[data-pkeng]')),'unknown engine → choose engine button');
 console.log('errors',errs);await b.close();})();
