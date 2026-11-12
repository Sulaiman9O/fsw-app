const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});const ctx=await b.newContext({viewport:{width:400,height:868},permissions:['camera']});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
 const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 await p.evaluate(()=>{go('newjob');document.querySelectorAll('#tour').forEach(x=>x.remove());});await p.waitForTimeout(400);
 // slow getUserMedia so we can see the waiting state
 await p.evaluate(()=>{const g=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=c=>new Promise(r=>setTimeout(()=>r(g(c)),1200));});
 await p.click('.vinb');await p.waitForTimeout(300);
 let r=await p.evaluate(()=>{const v=$('#vsvid'),b=v.closest('.camv');return {poster:!!v.getAttribute('poster'),op:getComputedStyle(v).opacity,live:b.classList.contains('live'),wait:getComputedStyle(b.querySelector('.scwait')).opacity,bg:getComputedStyle(b).backgroundColor,txt:b.querySelector('.scwait').textContent};});
 console.log('before',r);ok(r.poster&&r.op==='0'&&!r.live&&r.wait==='1','VIN: hidden video + spinner while opening');await p.screenshot({path:'cam_wait.png'});
 await p.waitForTimeout(2500);
 r=await p.evaluate(()=>{const v=$('#vsvid'),b=v.closest('.camv');return {op:getComputedStyle(v).opacity,live:b.classList.contains('live'),wait:getComputedStyle(b.querySelector('.scwait')).opacity,w:v.videoWidth};});
 console.log('after',r);ok(r.live&&r.op==='1'&&r.wait==='0'&&r.w>0,'VIN: camera fades in, spinner gone');await p.screenshot({path:'cam_live.png'});
 await p.click('#vsocr');await p.waitForTimeout(500);await p.click('#vsocr');await p.waitForTimeout(150);
 r=await p.evaluate(()=>{const b=$('#vsvid').closest('.camv');return b.classList.contains('live');});ok(!r,'VIN: "another photo" shows the spinner again until the new frame');
 await p.waitForTimeout(2500);r=await p.evaluate(()=>$('#vsvid').closest('.camv').classList.contains('live'));ok(r,'VIN: live again');
 await p.click('[data-close]');await p.waitForTimeout(300);
 // barcode sheet
 const has=await p.evaluate(()=>typeof scanSheet==='function');
 if(has){await p.evaluate(()=>{window.BarcodeDetector=window.BarcodeDetector||class{async detect(){return []}};scanSheet(()=>{});});await p.waitForTimeout(300);
  r=await p.evaluate(()=>{const v=$('#scv'),b=v.closest('.camv');return {poster:!!v.getAttribute('poster'),op:getComputedStyle(v).opacity,live:b.classList.contains('live')};});ok(r.poster&&r.op==='0'&&!r.live,'Barcode: hidden while opening');
  await p.waitForTimeout(2500);r=await p.evaluate(()=>{const v=$('#scv'),b=v.closest('.camv');return {op:getComputedStyle(v).opacity,live:b.classList.contains('live')};});ok(r.live&&r.op==='1','Barcode: fades in');}
 console.log('errors',errs);await b.close();})();
