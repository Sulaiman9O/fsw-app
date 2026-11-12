const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(30);}};
await p.goto('http://localhost:8811/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
// update banner with html in name
await p.evaluate(()=>window.dispatchEvent(new CustomEvent('ws-update',{detail:{name:'2.31<img src=x onerror=window.__x=1>'}})));await p.waitForTimeout(300);
ok(await p.evaluate(()=>!window.__x&&!document.querySelector('.upd img')&&/2\.31/.test(document.querySelector('.upd').innerText)),'update banner shows name as text: '+await p.evaluate(()=>document.querySelector('.upd').innerText.replace(/\n/g,' ')));
// invoice header escape
const h=await p.evaluate(()=>{DB.ws.addr='<bdi><img src=x onerror=window.__y=1></bdi>';DB.ws.phone='2400';save();const j={id:'jx',no:1,items:[{k:'labour',d:'x',q:1,p:1}],pays:[],inv:{no:1,t:Date.now()},t:Date.now(),log:[]};DB.jobs.push(j);return invoiceHtml(j,true);});
ok(!/<img src=x/.test(h),'invoice header escapes address with <bdi>');
// worker cannot edit services by long press
await p.evaluate(async()=>{DB.users.push({id:'u2',name:'W',role:'tech',pin:await hashPin('1111')});save();S.user=DB.users.find(u=>u.id==='u2');go('svc');});await p.waitForTimeout(200);
ok(await p.evaluate(()=>{window.toast=m=>window.__t=m;svcSheet(DB.services[0]);return !document.querySelector('#sheet')&&/manager/.test(window.__t||'');}),'worker blocked from svcSheet');
// PIN lock survives reload
await p.evaluate(()=>{S.user=null;});await p.reload();await p.waitForTimeout(900);const pk=async()=>{const u=await p.$('[data-u]:not([data-u="u2"])');if(u)await u.click();await p.waitForTimeout(200);};await pk();
for(let i=0;i<5;i++){await key('9999');await p.waitForTimeout(150);}
const L1=await p.evaluate(()=>JSON.parse(localStorage.getItem('ws_pinlock')||'{}'));ok(L1.until>Date.now(),'locked after 5 wrong PINs');
await p.reload();await p.waitForTimeout(900);await pk();await key('1234');await p.waitForTimeout(300);ok(await p.evaluate(()=>!S.user||!S.user.id),'still locked after restart: '+await p.evaluate(()=>($('#err')||{}).textContent));
ok(!errs.length,'no errors '+errs.join('|'));await b.close();})();
