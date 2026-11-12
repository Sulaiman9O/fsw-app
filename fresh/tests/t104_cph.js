const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const W=+process.argv[2]||400;const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:868},colorScheme:'dark'});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 await p.evaluate(()=>{DB.ws.lang='ar';S.user.lang='ar';langApply();DB.customers.push({id:'c1',name:'Ali',phone:'9'});DB.vehicles.push({id:'v1',cust:'c1',make:'Toyota',model:'Camry',year:'2020',plate:'1 A'});DB.jobs.push({id:'j1',no:1,cust:'c1',veh:'v1',stage:'work',items:[],t:Date.now(),by:'S',log:[]});save();go('custd',{id:'c1'});document.querySelectorAll('#tour').forEach(x=>x.remove());});await p.waitForTimeout(300);
 const cnt=()=>p.evaluate(()=>({ph:(byId('vehicles','v1').ph||[]).length,db:(DB.photos||[]).length}));
 let fc=p.waitForEvent('filechooser');await p.click('[data-vpa]');(await fc).setFiles(['car3.jpg','car4.jpg','car5.jpg']);await p.waitForTimeout(1000);
 ok((await cnt()).ph===3,'3 added');await p.screenshot({path:'cph1.png'});
 /* ✕ on the 2nd picture: first tap asks, second deletes */
 await p.locator('[data-vpx]').nth(1).click();await p.waitForTimeout(150);ok((await cnt()).ph===3&&/حذف/.test(await p.locator('[data-vpx]').nth(1).textContent()),'first ✕ asks');await p.screenshot({path:'cph2.png'});
 await p.locator('[data-vpx]').nth(1).click();await p.waitForTimeout(300);let c=await cnt();ok(c.ph===2&&c.db===2,'second ✕ deletes (car + stored photo)');
 /* viewer: next, make main, delete */
 await p.locator('[data-vph]').first().click();await p.waitForTimeout(300);ok(/1 \/ 2/.test(await p.textContent('#vpn')),'viewer 1/2');await p.click('#vpnext');ok(/2 \/ 2/.test(await p.textContent('#vpn')),'next → 2/2');await p.screenshot({path:'cph3.png'});
 const second=await p.evaluate(()=>byId('vehicles','v1').ph[1]);await p.click('#vpmain');await p.waitForTimeout(300);ok(await p.evaluate(s=>byId('vehicles','v1').ph[0]===s,second),'made main');
 await p.locator('[data-vph]').first().click();await p.waitForTimeout(300);await p.click('#vpdel');await p.click('#vpdel');await p.waitForTimeout(300);ok((await cnt()).ph===1,'deleted in viewer, viewer stays: '+await p.evaluate(()=>!!$('#vpimg')));
 await p.evaluate(()=>closeSheet());
 /* job: gallery ✕ */
 await p.evaluate(()=>go('job',{id:'j1'}));await p.waitForTimeout(300);await p.click('.vth');await p.waitForTimeout(300);await p.screenshot({path:'cph4.png'});
 await p.locator('#sheet [data-vpx]').first().click();await p.locator('#sheet [data-vpx]').first().click();await p.waitForTimeout(400);
 c=await cnt();ok(c.ph===0&&c.db===0,'gallery ✕ deletes the last one');ok(await p.evaluate(()=>!$('#sheet')&&$('.vth.none')),'job shows 📷 again');
 console.log('errors',errs);await b.close();})();
