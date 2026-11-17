/* 2.42.1 «For the parts shop» card: car (big) + engine/gearbox/drive/body + VIN big in groups of 4. No QR, no parts list
   (Sulaiman 17 Nov), nothing private. From the job (🔩 chip) and the customer's car; send as picture, copy VIN,
   show big (whole card on the screen, nothing pushed off the top); no VIN; wrong VIN; Arabic; sizes. */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const ctx=await b.newContext({viewport:vp||{width:400,height:868},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));return {b,p,errs};}
const W=t=>new Promise(r=>setTimeout(r,t));const VIN='JTHBK1GG5F2012345';
(async()=>{
 for(const [vp,lang] of [[{width:400,height:868},'en'],[{width:360,height:640},'ar'],[{width:1100,height:1400},'en'],[{width:844,height:390},'en']]){const {b,p,errs}=await start(vp);const tag=vp.width+'x'+vp.height+' '+lang+': ';
  const ids=await p.evaluate(([VIN,l])=>{DB.ws.lang=l;DB.ws.name='عالم الخدمات السريعة';const c=DB.customers[0];c.name='Secret Customer Name';c.phone='99112233';
   const v={id:'vT',cust:c.id,make:'Lexus',model:'ES 350',year:'2015',plate:'OM 1234 X',vin:VIN.toLowerCase().replace(/(.{4})/g,'$1 '),engine:'3.5L · 2GR-FE',trans:'Automatic Transmission (AT)',body:'Sedan',ari:JSON.stringify({drivenWheels:'Front-wheel drive'})};DB.vehicles.push(v);
   const j=Object.assign(JSON.parse(JSON.stringify(DB.jobs.find(x=>x.stage==='work'&&!x.inv)||DB.jobs.find(x=>!x.inv))),{id:'jT',no:9901,cust:c.id,veh:'vT',stage:'work',t:now(),km:120000});delete j.inv;
   j.items=[{k:'part',d:'Toyota Oil Filter 04152-YZZD1 (P)',q:1,p:3.5},{k:'part',d:'Front Stabilizer Link – Genuine (both sides)',q:2,p:18}];j.pays=[];DB.jobs.push(j);save();lookApply();go('job',{id:'jT'});return {c:c.id};},[VIN,lang]);
  await W(400);ok(!!(await p.$('#jpcard')),tag+'🔩 chip on the job card');await p.click('#jpcard');await W(400);
  const t=await p.textContent('#pcard');
  ok(t.includes('JTHB K1GG 5F20 1234 5'),tag+'VIN big in groups of 4 (spaces/small letters cleaned)');
  const chips=await p.$$eval('#pcard .pc-spec span',L=>L.map(x=>x.textContent));ok(/Lexus ES 350/.test(t)&&/2015/.test(t)&&chips.some(x=>/2GR-FE/.test(x))&&chips.includes('AT')&&chips.includes('FWD')&&chips.includes('Sedan'),tag+'car, year, engine, AT, FWD, body');
  ok(!(await p.$('#pcard svg'))&&!(await p.$('#pcard .pc-parts'))&&!/Oil Filter|Stabilizer/.test(t),tag+'no QR, no parts');
  ok(!/Secret Customer|99112233|OM 1234|3\.500|18\.000/.test(t),tag+'no customer name, phone, plate or prices');
  ok(await p.$eval('#pcard .pc-vin',e=>e.scrollWidth<=e.clientWidth+1&&(e.clientHeight-parseFloat(getComputedStyle(e).paddingTop)-parseFloat(getComputedStyle(e).paddingBottom))<parseFloat(getComputedStyle(e).fontSize)*1.6),tag+'VIN on one line, not cut');
  ok(await p.$eval('#pcard .pc-car',e=>parseFloat(getComputedStyle(e).fontSize)>=26),tag+'car name big');
  /* picture */
  const pic=await p.evaluate(()=>{const c=pcImage(byId('vehicles','vT'));return {w:c.width,h:c.height,n:c.toDataURL('image/png').length};});ok(pic.w===1080&&pic.h>500&&pic.n>15000,tag+'picture 1080×'+pic.h);
  if(vp.width===400){const im=await p.evaluate(()=>pcImage(byId('vehicles','vT')).toDataURL('image/png'));require('fs').writeFileSync('/tmp/pcB.png',Buffer.from(im.split(',')[1],'base64'));await p.evaluate(()=>document.querySelectorAll('.toast,#toast').forEach(x=>x.remove()));await p.screenshot({path:'/tmp/pcA.png'});}
  await p.evaluate(()=>{window.__dl=null;const A=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download){window.__dl=this.download;return;}return A.call(this);};});
  await p.click('#pcsend');await W(800);ok(await p.evaluate(()=>window.__dl)==='VIN-'+VIN+'.png',tag+'computer: picture saved');
  const nat=await p.evaluate(async()=>{let arg=null;window.CapApp=true;window.Capacitor={Plugins:{FswShare:{sharePdf:async a=>{arg=a;}}}};await pcSend(byId('vehicles','vT'));delete window.CapApp;delete window.Capacitor;return arg&&{mime:arg.mime,name:arg.name,b64:arg.b64.length,phone:arg.phone,txt:arg.text};});
  ok(nat&&nat.mime==='image/png'&&nat.b64>15000&&nat.phone===''&&/VIN: JTHBK1GG5F2012345/.test(nat.txt)&&!/Secret|99112233|Filter/.test(nat.txt),tag+'app: sent as PNG picture, nothing private');
  await p.click('#pccopy');await W(200);ok(await p.evaluate(()=>navigator.clipboard.readText().catch(()=>''))===VIN,tag+'Copy VIN');
  /* big view: whole card on the screen, nothing above the top */
  await p.click('#pcbig');await W(300);
  const fit=await p.$eval('#pcard',e=>{const q=s=>e.querySelector(s).getBoundingClientRect();const r=e.getBoundingClientRect();return {full:e.classList.contains('pc-full')&&r.width>=innerWidth-1&&r.height>=innerHeight-1,top:q('.pc-top').top,car:q('.pc-car').top,vin:q('.pc-vin').bottom,ws:q('.pc-ws').bottom,h:innerHeight,cut:e.querySelector('.pc-vin').scrollWidth>e.querySelector('.pc-vin').clientWidth+1,st:e.scrollTop};});
  ok(fit.full,tag+'Show big fills the screen');ok(fit.top>=0&&fit.car>=0&&fit.vin<=fit.h&&!fit.cut,tag+'big: car and VIN fully on the screen '+JSON.stringify(fit));
  if(vp.height>=600)ok(fit.ws<=fit.h,tag+'big: whole card fits without scrolling');
  if(vp.width===400)await p.screenshot({path:'/tmp/pcC.png'});
  await p.click('#pcard');await W(200);ok(await p.$eval('#pcard',e=>!e.classList.contains('pc-full')),tag+'tap → back to normal');
  if(lang==='ar'){const s=await p.textContent('#sheet');ok(/لمحل القطع/.test(s)&&/إرسال كصورة/.test(s)&&/رقم الشاصي/.test(s),tag+'Arabic words');}
  const bad=await p.evaluate(()=>{const o=[];document.querySelectorAll('#sheet *').forEach(e=>{if(!e.offsetParent)return;const r=e.getBoundingClientRect();if(r.right>innerWidth+1||r.left<-1)o.push(e.className||e.tagName);});return o;});ok(bad.length===0,tag+'nothing off the screen '+JSON.stringify(bad.slice(0,3)));
  const before=await p.evaluate(()=>JSON.stringify([byId('vehicles','vT'),byId('jobs','jT')]));await p.evaluate(()=>back());await W(200);ok(!(await p.$('#sheet .pcard')),tag+'back closes it (no question)');
  ok(await p.evaluate(b=>JSON.stringify([byId('vehicles','vT'),byId('jobs','jT')])===b,before),tag+'car and job unchanged');
  await p.evaluate(c=>go('custd',{id:c}),ids.c);await W(400);ok(!!(await p.$('[data-pcv="vT"]')),tag+'button on the car in the customer page');await p.click('[data-pcv="vT"]');await W(300);
  ok((await p.textContent('#pcard')).includes('JTHB K1GG'),tag+'from the car: same card');await p.evaluate(()=>closeSheet());
  await p.evaluate(()=>{byId('vehicles','vT').vin='';save();go('job',{id:'jT'});});await W(300);await p.click('#jpcard');await W(300);
  ok(!!(await p.$('#pcard .pc-novin'))&&!(await p.$('#pccopy')),tag+'no VIN: warning, no copy');
  await p.click('#pcedit');await W(400);ok(!!(await p.$('#sheet input'))&&!(await p.$('#pcard')),tag+'"Add the VIN" opens the car edit');await p.evaluate(()=>closeSheet());await W(200);
  await p.evaluate(()=>{byId('vehicles','vT').vin='JTN123';save();go('job',{id:'jT'});});await W(300);await p.click('#jpcard');await W(300);ok(!!(await p.$('#pcard .pc-warn')),tag+'VIN not 17 → check it warning');await p.evaluate(()=>closeSheet());
  ok(errs.length===0,tag+'no page errors '+JSON.stringify(errs.slice(0,3)));await b.close();}
})();
