/* 2.42.8: reading the printed VIN. On the Android app Google's reader (FswText, ML Kit) reads it in a second; here it is played by a stand-in.
   📸 and «From a photo» both use it; no VIN in the text → a clear message (no endless «Reading…»); the reader failing → the page reader, with a time limit. */
const {chromium}=require('playwright');const fs=require('fs');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};const W=t=>new Promise(r=>setTimeout(r,t));
(async()=>{const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const ctx=await b.newContext({viewport:{width:400,height:868},permissions:['camera']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 /* the stand-in for Google's reader: answers what window.__OCR says */
 await p.addInitScript(()=>{window.__OCR={mode:'vin',calls:0};const P={read:async o=>{window.__OCR.calls++;window.__OCR.img=(o&&o.image||'').slice(0,23);const m=window.__OCR.mode;
   if(m==='fail')throw new Error('reader broke');if(m==='none')return {text:'TOYOTA MOTOR CORPORATION\nMADE IN JAPAN',lines:[]};
   return {text:'TOYOTA\nVIN '+window.__OCR.vin.slice(0,8)+' '+window.__OCR.vin.slice(8)+'\nMADE IN JAPAN',lines:[]};}};
   Object.defineProperty(window,'Capacitor',{configurable:true,get(){return this.__cap;},set(v){this.__cap=v;if(v){v.Plugins=v.Plugins||{};v.Plugins.FswText=P;}}});window.Capacitor={Plugins:{FswText:P},isNativePlatform:()=>false};});
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.route('**/garage/ocr/**',r=>r.abort());
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));
 const ev=(f,a)=>p.evaluate(f,a);
 /* a made-up VIN that passes the check digit */
 const vin=await ev(()=>{for(const d of '0123456789X'){const v='JTMHV05J'+d+'04012345';if(vinCheck(v))return v;}return '';});ok(vin.length===17,'test VIN '+vin);
 await ev(v=>{window.__OCR.vin=v;},vin);
 ok(await ev(()=>!!textPlugin()),'Google reader seen on the app');
 const open=async()=>{await ev(()=>go('newjob'));await W(500);await p.locator('.vinb').first().click();await W(1500);};
 /* 📸 with the camera */
 await open();ok(!!(await p.$('#vsocr')),'VIN sheet open with 📸');
 const t0=Date.now();await p.click('#vsocr');
 await p.waitForFunction(()=>[...document.querySelectorAll('#vsres input')].some(i=>i.value.length===17),null,{timeout:8000}).catch(()=>{});
 const R=await ev(()=>({res:[...document.querySelectorAll('#vsres input')].map(i=>i.value).join(' '),st:(document.querySelector('#vsst')||{}).textContent||'',calls:window.__OCR.calls,img:window.__OCR.img}));
 ok(R.res.includes(vin),'📸: the VIN is read by Google\'s reader in '+(Date.now()-t0)+' ms → '+R.res.slice(0,60));
 ok(R.calls===1&&/^data:image\/jpeg/.test(R.img),'one picture sent to the reader as a photo');
 ok(Date.now()-t0<4000,'no long «Reading…»');
 /* pick it → goes in the VIN field */
 const pick=await p.$('#vsres .vsc button');if(pick){await pick.click();await W(800);}
 const nv=await ev(()=>{const e=document.querySelector('#nvin');return e?e.value:'';});ok(nv===vin,'chosen VIN goes into the car\'s VIN field ('+nv+')');
 /* no VIN in the picture → a clear message, nothing hangs */
 await ev(()=>{window.__OCR.mode='none';window.__OCR.calls=0;closeSheet&&closeSheet();});await W(300);await open();await p.click('#vsocr');await W(1500);
 const N=await ev(()=>({st:(document.querySelector('#vsres')||{}).textContent||'',calls:window.__OCR.calls}));
 ok(/No VIN found|ما لقيت/.test(N.st)&&N.calls===1,'no VIN in the picture → «No VIN found…» right away ('+N.st+')');
 /* «From a photo» uses the same reader */
 await ev(()=>{window.__OCR.mode='vin';window.__OCR.calls=0;});const png='/tmp/t143.png';
 await p.screenshot({path:png,clip:{x:0,y:0,width:300,height:200}});
 const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#vspic')]);await fc.setFiles(png);await W(1500);
 const F=await ev(()=>({res:[...document.querySelectorAll('#vsres input')].map(i=>i.value).join(' '),calls:window.__OCR.calls}));
 ok(F.res.includes(vin)&&F.calls===1,'«From a photo»: read by Google\'s reader too');
 /* the reader breaks → the page reader is tried, and it ends with a message (here it cannot download: no internet) */
 await ev(()=>{window.__OCR.mode='fail';window.__OCR.calls=0;closeSheet&&closeSheet();});await W(300);await open();await p.click('#vsocr');
 await p.waitForFunction(()=>{const t=(document.querySelector('#vsst')||{}).textContent||'';return t&&!/^(Reading…|نقرأ…|Getting the reader ready|نجهّز)/.test(t)&&!/Photo taken|reading it now/.test(t);},null,{timeout:30000}).catch(()=>{});
 const B=await ev(()=>({st:(document.querySelector('#vsst')||{}).textContent||'',calls:window.__OCR.calls,log:(TRAIL.buf||[]).slice(-6).map(e=>e[1]+' '+e[2]).join(' | ')}));
 ok(B.calls===1&&B.st.length>0&&!/Reading/.test(B.st),'reader broke → page reader tried, ends with a message: '+B.st.slice(0,90));
 ok(/google reader failed/.test(B.log),'logged in the trail');
 /* the laptop (no Google reader): the page reader has a time limit */
 const lim=await ev(async()=>{try{await withLimit(new Promise(()=>{}),300);return 'no';}catch(e){return e.timeout?'timeout':'other';}});ok(lim==='timeout','page reader stops after its time limit');
 /* 2.42.9: the real Land Cruiser plate (Arabic + English lines): one answer, no look-alikes; with the keyboard open the picture does not cover the numbers */
 await ev(()=>{window.__OCR.mode='plate';closeSheet&&closeSheet();});await W(300);
 await ev(()=>{const P=window.Capacitor.Plugins.FswText;P.read=async()=>({text:'اسم الصانع وبلد الصنع : تويوتا موتور كوربوريشن اليابان\n2013.05 :سنة وشهر الانتاج\nJTMHU09JXD5074537 :الرقم المميز\nصنف : سيارة ركاب متعددة الاغراض\n5\nMODEL:GRJ200L-GNANKV C/TR:1F7/FK03\nENGINE:1GR-FE 3956mL A/TM:A02B/A750F\nPLANT:A51 830 MADE IN JAPAN',lines:[]});});
 await open();await p.click('#vsocr');await W(1200);
 const LC=await ev(()=>[...document.querySelectorAll('#vsres input')].map(i=>i.value));
 ok(LC.length===1&&LC[0]==='JTMHU09JXD5074537','Land Cruiser plate → only JTMHU09JXD5074537 '+JSON.stringify(LC));
 await p.locator('#vsres input').first().focus();await p.setViewportSize({width:400,height:470});await W(500);
 const OV=await ev(()=>{const v=document.querySelector('.vsv').getBoundingClientRect(),t=document.querySelector('#vsocr').getBoundingClientRect(),r=document.querySelector('#vsres').getBoundingClientRect();return {vb:Math.round(v.bottom),bt:Math.round(t.top),rt:Math.round(r.top),done:document.querySelector('.vsv').classList.contains('done')};});
 ok(OV.done&&OV.vb<=OV.bt+1&&OV.vb<=OV.rt+1,'keyboard open: the picture stays above the buttons and the numbers (small after a reading) '+JSON.stringify(OV));
 await p.screenshot({path:'/tmp/t143_kb.png'});await p.setViewportSize({width:400,height:868});
 ok(await ev(()=>/camera open \d+ms/.test((TRAIL.buf||[]).map(e=>e[1]+' '+e[2]).join('|'))),'camera opening time logged');
 ok(await ev(()=>{try{return !!localStorage.getItem('ws_cam');}catch(e){return false;}}),'the lens is remembered for the next time');
 ok(errs.length===0,'no page errors '+JSON.stringify(errs.slice(0,3)));await b.close();})();
