const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:820},deviceScaleFactor:2});await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.fill('#obn','Fast Service World');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('سليمان');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;DB.ws.lang='ar';S.user.lang='ar';DB.ws.svcReviewed=true;langApply();go('home');},[cat,cu]);await p.waitForTimeout(400);
 await p.addStyleTag({content:'.hl{outline:4px solid #ef4444!important;outline-offset:3px;border-radius:14px;position:relative;z-index:5}#toast,.upd{display:none!important}'});
 let n=0;const shot=async(sel,name)=>{await p.evaluate(s=>{document.querySelectorAll('.hl').forEach(x=>x.classList.remove('hl'));if(s){const e=document.querySelector(s);if(e){e.classList.add('hl');e.scrollIntoView({block:'center'});}}},sel);await p.waitForTimeout(250);await p.screenshot({path:`g${++n}.png`});};
 // A: build
 await p.evaluate(()=>go('more'));await p.waitForTimeout(300);await shot('[data-go="pkgs"]');
 await p.click('[data-go="pkgs"]');await p.waitForTimeout(300);await shot('#pknew');
 await p.click('#pknew');await p.waitForTimeout(300);await p.fill('#pn1','Full oil change');await p.fill('#pn2','تغيير الزيت الشامل');await shot('#pn2');
 await p.click('#pa-s');await p.waitForTimeout(200);await p.fill('#pfq','engine oil');await p.waitForTimeout(150);await p.locator('[data-pf]:not([hidden])').first().click();await p.waitForTimeout(300);
 await p.click('#pa-o');await p.waitForTimeout(200);await p.locator('.sheet button',{hasText:/الوكالة/}).first().click();await p.waitForTimeout(300);await p.click('#pa-f');await p.waitForTimeout(300);
 await p.evaluate(()=>{const e=document.querySelector('#pa-s').closest('.chips');e.id='chipsx';});await shot('#chipsx');
 await p.locator('[data-pi="1"]').click();await p.waitForTimeout(250);await p.fill('#pii','5');await p.fill('#pix','2.5');await shot('#pii');await p.click('#piok');await p.waitForTimeout(300);
 await p.click('#pa-t');await p.waitForTimeout(250);await p.click('#to [data-or="jp"]');await p.click('#tc [data-cy="4"]');await p.fill('#tpr','15.5');await p.evaluate(()=>{document.querySelector('#to').closest('.pnl').scrollTop=0;});await shot('#tc');await p.evaluate(()=>{const e=document.querySelector('#tpr');e.scrollIntoView({block:'center'});});await shot('#tpr');await p.click('#tok');await p.waitForTimeout(300);
 await p.click('#pa-t');await p.waitForTimeout(250);await p.click('#to [data-or="jp"]');await p.click('#tc [data-cy="6"]');await p.fill('#tpr','19.5');await p.click('#tok');await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('#pa-t').scrollIntoView({block:'center'}));await shot('#pa-t');
 await shot('#psave');await p.click('#psave');await p.waitForTimeout(300);await shot('[data-pkg]');
 // B: use
 await p.evaluate(()=>go('home'));await p.waitForTimeout(300);await shot('.hero, .newcar, [data-go="newjob"]');
 const vid=await p.evaluate(()=>{const v=DB.vehicles.find(v=>/camry/i.test(v.model)&&v.year=='2015'&&/2AR/.test(effEng(v)));return v.id;});
 await p.evaluate(vid=>{const v=byId('vehicles',vid);go('newjob',{n:{phone:'',name:'',plate:'',make:'',model:'',year:'',km:'',vin:'',engine:'',est:false,custId:v.cust,vehId:v.id,dupOk:true}});},vid);await p.waitForTimeout(400);
 await shot('#npk');await p.click('[data-pk]');await p.waitForTimeout(300);await shot('#ngo');await p.click('#ngo');await p.waitForTimeout(600);await shot('.jb-r.pkh');
 console.log(n);await b.close();})();
