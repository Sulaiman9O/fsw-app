const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:868},colorScheme:'dark'});await ctx.addInitScript(()=>{window.__OCR_BASE='http://localhost:8812/ocr/';});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
 const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const vin=fs.readFileSync('vin.txt','utf8');
 await p.evaluate(()=>{go('newjob');document.querySelectorAll('#tour').forEach(x=>x.remove());});await p.waitForTimeout(500);
 ok(!!(await p.$('.vinb')),'📷 next to the VIN field');
 await p.fill('#nplate','12345 A');
 await p.click('.vinb');await p.waitForTimeout(500);
 /* barcode from a photo */
 let fc=p.waitForEvent('filechooser');await p.click('#vspic');(await fc).setFiles('vin_bar.png');
 await p.waitForSelector('.vsc input',{timeout:20000}).catch(()=>{});
 let got=await p.evaluate(()=>[...document.querySelectorAll('.vsc input')].map(i=>i.value));console.log('barcode ->',got,await p.textContent('#vsst'));ok(got[0]===vin,'barcode photo gives the VIN');
 /* text from a photo */
 await p.evaluate(()=>{document.querySelector('#vsres').innerHTML='';});
 const t0=Date.now();fc=p.waitForEvent('filechooser');await p.click('#vspic');(await fc).setFiles('vin_text.jpg');
 await p.waitForSelector('.vsc input',{timeout:90000}).catch(()=>{});
 got=await p.evaluate(()=>[...document.querySelectorAll('.vsc input')].map(i=>i.value));console.log('ocr ->',got,Math.round((Date.now()-t0)/1000)+'s',await p.evaluate(()=>(document.querySelector('#vsres')||{}).innerText));ok(got.includes(vin),'printed number read');
 await p.screenshot({path:'v1.png'});
 await p.locator('.vsc .btn').first().click();await p.waitForTimeout(500);
 const N=await p.evaluate(()=>({vin:S.p.n.vin,make:S.p.n.make,plate:S.p.n.plate,field:$('#nvin')&&$('#nvin').value}));console.log(N);ok(N.vin===vin&&N.make==='Toyota'&&N.plate==='12345 A','VIN + make filled, plate kept');
 /* offline second time: no network for the ocr files */
 await p.route('**/localhost:8812/**',r=>r.abort());await p.evaluate(()=>{OCRW&&OCRW.terminate();OCRW=null;delete window.Tesseract;});
 await p.click('.vinb');await p.waitForTimeout(400);fc=p.waitForEvent('filechooser');await p.click('#vspic');(await fc).setFiles('vin_text.jpg');
 await p.waitForSelector('.vsc input',{timeout:90000}).catch(()=>{});got=await p.evaluate(()=>[...document.querySelectorAll('.vsc input')].map(i=>i.value));ok(got.includes(vin),'works again without internet: '+got.join(','));
 console.log('errors',errs.slice(0,5));await b.close();})();
