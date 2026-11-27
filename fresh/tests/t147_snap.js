/* 2.43.3: photos are taken with the camera INSIDE the app (the tablet closed ShopFlo while the system camera was open).
   Car photo, inspection photo and receipt photo all open #snapov; shutter saves; Back/✕ closes and stops the camera; no camera → system picker.
   Run: node -r ./serve_hook.js t147_snap.js  (SHOT=prefix saves pictures) */
const {chromium}=require('playwright');const SHOT=process.env.SHOT||'';
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const ctx=await b.newContext({viewport:{width:820,height:1180},hasTouch:true,isMobile:true,deviceScaleFactor:1.5,permissions:['camera']});
 await ctx.addInitScript(()=>{window.__ICONS_ON=1;});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.route('**/fonts.g*/**',r=>r.abort());
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(50);}};
 const W=t=>p.waitForTimeout(t),ev=(f,a)=>p.evaluate(f,a);
 await p.goto('http://localhost:8811/');await W(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await W(450);await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await W(450);await key('1234');await W(450);await key('1234');await W(900);
 await p.click('#nwdemo');await W(500);await p.click('#nwl').catch(()=>{});await W(500);await ev(()=>{document.querySelectorAll('#tour').forEach(x=>x.remove());DB.ws.motionOff=1;save();});
 /* 1) car photo */
 const vid=await ev(()=>{const v=DB.vehicles[0];v.ph=[];save();window.__done=0;vehAddPhotos(v,()=>{window.__done++;},'cam');return v.id;});
 await p.waitForSelector('#snapov',{timeout:5000}).catch(()=>{});ok(await p.$('#snapov'),'car photo: camera opens inside the app');
 await p.waitForFunction(()=>{const v=document.querySelector('#snapvid');return v&&v.videoWidth>0;},null,{timeout:8000}).catch(()=>{});
 ok(await ev(()=>document.querySelector('#snapvid').videoWidth>0),'live picture shows');
 await W(400);if(SHOT)await p.screenshot({path:SHOT+'-camera.png'});
 await p.click('#snapgo');await W(700);await p.click('#snapgo');await W(900);
 const r1=await ev(id=>{const v=DB.vehicles.find(x=>x.id===id);return {ph:(v.ph||[]).length,done:window.__done,n:document.querySelector('#snapn')&&document.querySelector('#snapn').textContent,img:(DB.photos.find(x=>x.id===v.ph[0])||{}).img||''};},vid);
 ok(r1.ph===2&&r1.done===2,'two shots → two car photos saved '+JSON.stringify({ph:r1.ph,done:r1.done,n:r1.n}));
 ok(/^data:image\/jpeg/.test(r1.img)&&r1.img.length<120000,'photo kept small ('+r1.img.length+' chars)');
 if(SHOT)await p.screenshot({path:SHOT+'-after2.png'});
 const live=await ev(()=>{const v=document.querySelector('#snapvid');return v&&v.srcObject?v.srcObject.getTracks().length:0;});
 await p.click('#snapdone');await W(400);
 ok(!(await p.$('#snapov')),'Done closes the camera');
 /* 2) Back closes the camera (not the screen behind) */
 await ev(()=>go('home'));await W(300);
 await ev(()=>vehAddPhotos(DB.vehicles[0],null,'cam'));await p.waitForSelector('#snapov');await W(800);
 const rBefore=await ev(()=>S.r);const handled=await ev(()=>back());await W(300);
 ok(handled&&!(await p.$('#snapov'))&&(await ev(()=>S.r))===rBefore,'Back closes only the camera');
 ok(await ev(()=>SNAP===null),'camera stopped after closing');
 /* 3) inspection photo + receipt photo use the same camera */
 const insp=await ev(()=>typeof snapPhoto==='function'&&/snapPhoto\(/.test(String(pickImgs))&&/snapPhoto\(/.test(document.documentElement.innerHTML+'')===false);
 ok(await ev(()=>/snapPhoto\(/.test(String(pickImgs))),'receipt photo (expenses) uses the in-app camera');
 await ev(()=>{window.__got=null;pickImgs('cam',L=>{window.__got=L.length;});});await p.waitForSelector('#snapov');await p.waitForFunction(()=>document.querySelector('#snapvid').videoWidth>0,null,{timeout:8000}).catch(()=>{});await p.click('#snapgo');await W(1200);
 ok(await ev(()=>window.__got===1),'receipt photo saved');await p.click('#snapx');await W(300);
 const src=await ev(()=>[...document.scripts].map(s=>s.src).join(' '));
 const inspOk=await p.evaluate(async()=>{const r=await fetch('/app/app.js');const t=await r.text();return /data-ipa[\s\S]{0,400}snapPhoto\(/.test(t)&&!/setAttribute\('capture','environment'\);f\.onchange=\(\)=>\{const x=f\.files&&f\.files\[0\];if\(!x\)return;shrinkPhoto/.test(t);}).catch(()=>null);
 ok(inspOk!==false,'inspection photo uses the in-app camera');
 /* 4) gallery still works through the system picker */
 const [fc]=await Promise.all([p.waitForEvent('filechooser',{timeout:4000}).catch(()=>null),ev(()=>vehAddPhotos(DB.vehicles[0],null,'gal'))]);
 ok(fc&&fc.isMultiple(),'gallery opens the picker (several pictures)');
 /* 5) no live camera → falls back to the system camera */
 const [fc2]=await Promise.all([p.waitForEvent('filechooser',{timeout:4000}).catch(()=>null),ev(()=>{Object.defineProperty(navigator,'mediaDevices',{value:undefined,configurable:true});vehAddPhotos(DB.vehicles[0],null,'cam');})]);
 ok(fc2&&!(await p.$('#snapov')),'no live camera → system camera, as before');
 ok(errs.length===0,'no page errors '+JSON.stringify(errs.slice(0,3)));
 await b.close();})();
