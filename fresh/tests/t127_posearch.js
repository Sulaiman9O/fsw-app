/* supplier order: supplier and part pickers can be searched; supplier list has a search box */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));
 await p.evaluate(cat=>{DB.parts=cat.parts;['Shopping','Naimi oil truck','Omantell','Al RAYYAN GERMAN PARTS','Best Lube','Mufid','Namaa','Senfineco centre'].forEach((n,i)=>DB.vendors.push({id:'dv'+i,name:n,phone:'9000000'+i,what:i==3?'german parts':'',t:now()}));save();go('vendors');},cat);await p.waitForTimeout(300);
 ok(await p.$('#vq'),'supplier list has a search box');await p.fill('#vq','german');await p.waitForTimeout(150);
 const vis=await p.evaluate(()=>[...document.querySelectorAll('#vlist [data-vs]')].filter(r=>r.style.display!=='none').map(r=>r.textContent));ok(vis.length===1&&/RAYYAN/.test(vis[0]),'search "german" leaves Al Rayyan');
 await p.click('#poadd');await p.waitForTimeout(300);
 await p.click('#pov');await p.waitForTimeout(300);ok(await p.$('#spq'),'supplier picker has search');await p.fill('#spq','rayy');await p.waitForTimeout(150);
 ok((await p.$$('[data-sp]')).length===1,'one supplier found');await p.click('[data-sp]');await p.waitForTimeout(300);
 ok(/RAYYAN/.test(await p.textContent('#pov')),'order supplier set to Al Rayyan');
 await p.click('#poadd');await p.waitForTimeout(300);await p.fill('#spq','a2701800109');await p.waitForTimeout(150);const n=(await p.$$('[data-sp]')).length;ok(n>=1,'part found by number ('+n+')');
 await p.click('[data-sp]');await p.waitForTimeout(300);await p.click('#poadd');await p.waitForTimeout(300);await p.fill('#spq','mercedes 2701');await p.waitForTimeout(150);await p.click('[data-sp]');await p.waitForTimeout(300);
 const it=await p.evaluate(()=>{const o=DB.pos[DB.pos.length-1];return o.items.map(i=>[byId('parts',i.part).name,i.q]);});ok(it.length===1&&it[0][1]===2,'picked twice → one line, qty 2 '+JSON.stringify(it));
 await p.click('#poadd');await p.waitForTimeout(300);await p.fill('#spq','zzzzqq');await p.waitForTimeout(150);ok(/Nothing|ما في/.test(await p.textContent('#spl')),'nothing found message');
 await p.evaluate(()=>closeSheet());
 ok(!errs.length,'no page errors '+errs.join('|'));console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
