/* 2.42.0 «For the parts shop» card: car + engine + VIN (groups of 4, QR) + job parts without prices; nothing private.
   From the job (🔩 chip) and the customer's car; send as picture, copy VIN, show big; no VIN; wrong VIN; Arabic; sizes. */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const ctx=await b.newContext({viewport:vp||{width:400,height:868},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));return {b,p,errs};}
const W=t=>new Promise(r=>setTimeout(r,t));const VIN='4T1BF1FK5FU012345';
(async()=>{
 /* the QR really holds the VIN: decode it with the library's own matrix → compare against a fresh encode */
 for(const [vp,lang] of [[{width:400,height:868},'en'],[{width:360,height:740},'ar'],[{width:1100,height:1400},'en']]){const {b,p,errs}=await start(vp);const tag=vp.width+' '+lang+': ';
  const ids=await p.evaluate(([VIN,l])=>{DB.ws.lang=l;const c=DB.customers[0];c.name='Secret Customer Name';c.phone='99112233';
   const v={id:'vT',cust:c.id,make:'Toyota',model:'Camry',year:'2015',plate:'OM 1234 X',vin:VIN.toLowerCase().replace(/(.{4})/g,'$1 '),engine:'2.5L · 2AR-FE',trans:'Automatic Transmission (AT)',body:'Sedan',ari:JSON.stringify({drivenWheels:'Front-wheel drive'})};DB.vehicles.push(v);
   const j=Object.assign(JSON.parse(JSON.stringify(DB.jobs.find(x=>x.stage==='work'&&!x.inv)||DB.jobs.find(x=>!x.inv))),{id:'jT',no:9901,cust:c.id,veh:'vT',stage:'work',t:now(),km:120000});delete j.inv;j.items=[{k:'labour',d:'Front brake pads replace',q:1,p:12},{k:'part',d:'Brake pads front (Toyota 04465-33471)',q:1,p:18.5,c:12},{k:'part',d:'Brake cleaner',q:2,p:1.1},{k:'part',d:'Customer own oil',q:4,p:0,custPart:true}];j.pays=[];DB.jobs.push(j);save();lookApply();go('job',{id:'jT'});return {c:c.id};},[VIN,lang]);
  await W(400);
  ok(!!(await p.$('#jpcard')),tag+'🔩 chip on the job card');await p.click('#jpcard');await W(400);
  const t=await p.textContent('#pcard');
  ok(t.includes('4T1B F1FK 5FU0 1234 5'),tag+'VIN big in groups of 4 (spaces/letters cleaned) → '+(t.match(/4T1B[ A-Z0-9]+/)||[''])[0]);
  ok(/Toyota Camry 2015/.test(t)&&/2AR-FE/.test(t)&&/AT/.test(t)&&/FWD/.test(t)&&/Sedan/.test(t),tag+'car + engine + AT + FWD + body');
  ok(!/Secret Customer|99112233|OM 1234|18\.5|18\.500|12\.000|1\.100/.test(t),tag+'no customer name, phone, plate or prices');
  ok(/Brake pads front/.test(t)&&/Brake cleaner/.test(t)&&!/Customer own oil/.test(t)&&!/Front brake pads replace/.test(t),tag+'job parts listed (not labour, not the customer\'s own parts)');
  ok(!!(await p.$('#pcard svg.pcqr path')),tag+'QR code drawn');ok(await p.$eval('#pcard .pc-vin',e=>e.getBoundingClientRect().height<parseFloat(getComputedStyle(e).fontSize)*1.6&&e.scrollWidth<=e.clientWidth+1),tag+'VIN on one line, not cut');
  const qrOk=await p.evaluate(V=>{const q=qrcode(0,'M');q.addData(V);q.make();const n=q.getModuleCount(),b=4;let d='';for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c+b} ${r+b}h1v1h-1z`;return document.querySelector('#pcard svg.pcqr path').getAttribute('d')===d;},VIN);
  ok(qrOk,tag+'QR holds exactly the VIN');
  /* untick a part */
  await p.click('[data-pcp="1"]');await W(100);ok(await p.$eval('[data-pcp="1"]',e=>!e.checked&&e.closest('.pc-p').classList.contains('off')),tag+'part can be unticked');
  /* picture: catch what would be shared */
  const pic=await p.evaluate(async()=>{let got=null;const v=byId('vehicles','vT'),j=byId('jobs','jT');const P=pcParts(j).filter((_,i)=>i!==1);const c=pcImage(v,P,pcQr(pcVin(v)));return {w:c.width,h:c.height,n:P.length,url:c.toDataURL('image/png').length};});
  ok(pic.w===1080&&pic.h>900&&pic.url>20000,tag+'picture made 1080×'+pic.h);
  await p.evaluate(()=>{window.__dl=null;const A=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download){window.__dl=this.download;return;}return A.call(this);};});
  await p.click('#pcsend');await W(800);const dl=await p.evaluate(()=>window.__dl);ok(dl==='VIN-'+VIN+'.png',tag+'computer: picture saved as '+dl);
  /* app: goes to the native share with mime image/png */
  const nat=await p.evaluate(async()=>{let arg=null;window.CapApp=true;window.Capacitor={Plugins:{FswShare:{sharePdf:async a=>{arg=a;}}}};await pcSend(byId('vehicles','vT'),pcParts(byId('jobs','jT')),pcQr(pcVin(byId('vehicles','vT'))));delete window.CapApp;delete window.Capacitor;return arg&&{mime:arg.mime,name:arg.name,b64:arg.b64.length,phone:arg.phone,txt:arg.text};});
  ok(nat&&nat.mime==='image/png'&&nat.name==='VIN-'+VIN+'.png'&&nat.b64>20000&&nat.phone===''&&/VIN: 4T1BF1FK5FU012345/.test(nat.txt)&&!/Secret|99112233/.test(nat.txt),tag+'app: sent as PNG picture, no customer in it');
  /* copy */
  await p.click('#pccopy');await W(200);const clip=await p.evaluate(()=>navigator.clipboard.readText().catch(()=>''));ok(clip===VIN,tag+'Copy VIN → '+clip);
  /* show big, tap to leave */
  await p.click('#pcbig');await W(200);const full=await p.$eval('#pcard',e=>{const r=e.getBoundingClientRect();return e.classList.contains('pc-full')&&r.width>=innerWidth-1&&r.height>=innerHeight-1;});ok(full,tag+'Show big fills the screen');
  await p.click('#pcard');await W(200);ok(await p.$eval('#pcard',e=>!e.classList.contains('pc-full')),tag+'tap → back to normal');
  /* nothing cut */
  const bad=await p.evaluate(()=>{const o=[];document.querySelectorAll('#sheet *').forEach(e=>{if(!e.offsetParent)return;const r=e.getBoundingClientRect();if(r.right>innerWidth+1||r.left<-1)o.push(e.className||e.tagName);});return o;});ok(bad.length===0,tag+'nothing off the screen '+JSON.stringify(bad.slice(0,3)));
  if(lang==='ar'){ok(/لمحل القطع/.test(await p.textContent('#sheet'))&&/إرسال كصورة/.test(await p.textContent('#sheet')),tag+'Arabic words');}
  /* back closes, nothing changed in the data */
  const before=await p.evaluate(()=>JSON.stringify([byId('vehicles','vT'),byId('jobs','jT')]));await p.evaluate(()=>back());await W(200);ok(!(await p.$('#sheet .pcard')),tag+'back closes it (no question)');
  ok(await p.evaluate(b=>JSON.stringify([byId('vehicles','vT'),byId('jobs','jT')])===b,before),tag+'car and job unchanged');
  await p.screenshot({path:'/tmp/pc_'+vp.width+lang+'.png'});
  /* customer page → car card button (no parts list) */
  await p.evaluate(c=>go('custd',{id:c}),ids.c);await W(400);ok(!!(await p.$('[data-pcv="vT"]')),tag+'button on the car in the customer page');await p.click('[data-pcv="vT"]');await W(300);
  ok(!(await p.$('#pcard .pc-parts'))&&(await p.textContent('#pcard')).includes('4T1B F1FK'),tag+'from the car: VIN, no parts list');await p.evaluate(()=>closeSheet());
  /* no VIN → warning + Add the VIN opens the car edit */
  await p.evaluate(()=>{byId('vehicles','vT').vin='';save();go('job',{id:'jT'});});await W(300);await p.click('#jpcard');await W(300);
  ok(!!(await p.$('#pcard .pc-novin'))&&!(await p.$('#pccopy'))&&!(await p.$('#pcard svg.pcqr')),tag+'no VIN: warning, no copy, no QR');
  await p.click('#pcedit');await W(400);ok(!!(await p.$('#sheet input'))&&!(await p.$('#pcard')),tag+'"Add the VIN" opens the car edit');await p.evaluate(()=>closeSheet());await W(200);
  /* short / wrong VIN → warning */
  await p.evaluate(()=>{byId('vehicles','vT').vin='JTN123';save();go('job',{id:'jT'});});await W(300);await p.click('#jpcard');await W(300);ok(!!(await p.$('#pcard .pc-warn')),tag+'VIN not 17 → check it warning');await p.evaluate(()=>closeSheet());
  /* job with no parts → no parts list */
  await p.evaluate(()=>{byId('jobs','jT').items=[];byId('vehicles','vT').vin='4T1BF1FK5FU012345';save();go('job',{id:'jT'});});await W(300);await p.click('#jpcard');await W(300);ok(!(await p.$('#pcard .pc-parts')),tag+'job without parts → no parts list');
  ok(errs.length===0,tag+'no page errors '+JSON.stringify(errs.slice(0,3)));await b.close();}
})();
