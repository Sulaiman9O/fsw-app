/* 2.42.3: an estimate page has no «Invoice & pay» and no sticker; its bar sends the estimate; the message says
   «عرض سعر … (هذا عرض سعر وليس فاتورة)» with no payment lines; «Customer agreed» → job card → then «Invoice & pay» shows. */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const p=await (await b.newContext({viewport:vp||{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));return {b,p,errs};}
const W=t=>new Promise(r=>setTimeout(r,t));
(async()=>{for(const [vp,lang] of [[{width:400,height:868},'en'],[{width:360,height:740},'ar'],[{width:1100,height:1400},'en']]){const {b,p,errs}=await start(vp);const ev=(f,a)=>p.evaluate(f,a);const tag=vp.width+' '+lang+': ';
 const id=await ev(l=>{DB.ws.lang=l;const j=JSON.parse(JSON.stringify(DB.jobs.find(x=>!isInvoiced(x)&&(x.items||[]).length&&!(x.items||[]).some(i=>i.pend))));j.id='eT';j.no=8801;j.stage='estimate';delete j.inv;j.pays=[];DB.jobs.push(j);save();lookApply();go('job',{id:'eT'});return j.id;},lang);await W(500);
 ok(!(await p.$('#jpay')),tag+'estimate: no «Invoice & pay»');ok(!(await p.$('#jinv')),tag+'estimate: no «Make invoice»');
 ok(!!(await p.$('#jsendest2'))&&await p.$eval('#jsendest2',e=>e.offsetParent!==null),tag+'bar button «Send estimate»');
 ok(await p.$eval('#jsendest',e=>getComputedStyle(e).display==='none'),tag+'old send button hidden (one send button)');
 ok(!(await p.$('#jstk'))&&!(await p.$('#jrstk')),tag+'no sticker buttons on an estimate');
 const bar=await p.textContent('.paybar');ok(/Estimate total|مجموع عرض السعر/.test(bar)&&!/Invoice|pay|دفع|فاتورة/i.test(bar.replace(/Send estimate|إرسال عرض السعر/,'')),tag+'bar: estimate total, nothing about invoice/pay → '+bar.trim().slice(0,60));
 /* sending: the WhatsApp text */
 const sent=await ev(()=>{let got=null;const S0=window.shareText;window.shareText=(ph,t)=>{got=t;};document.querySelector('#jsendest2').click();window.shareText=S0;return got;});
 ok(/عرض سعر رقم 8801/.test(sent)&&/وليس فاتورة/.test(sent)&&!/فاتورة رقم|المدفوع|المتبقي|المستحق|دفع/.test(sent.replace('وليس فاتورة','')),tag+'message: «عرض سعر رقم 8801 … وليس فاتورة», no payment lines');
 /* customer agreed → job card: now invoice & pay is there, stickers back */
 await p.click('#jnext');await W(400);ok(await ev(()=>byId('jobs','eT').stage)==='new'&&!!(await p.$('#jpay'))&&!(await p.$('#jsendest2')),tag+'customer agreed → job card: «Invoice & pay» back, no estimate button');
 ok(!!(await p.$('#jstk')),tag+'job card: sticker button back');
 const bad=await ev(()=>{const o=[];document.querySelectorAll('#main *').forEach(e=>{if(!e.offsetParent)return;const r=e.getBoundingClientRect();if(r.right>innerWidth+1)o.push(e.className);});return o;});ok(bad.length===0,tag+'nothing off the screen');
 ok(errs.length===0,tag+'no page errors '+JSON.stringify(errs.slice(0,3)));if(vp.width===400){await ev(()=>go('job',{id:'eT'}));}await b.close();}})();
