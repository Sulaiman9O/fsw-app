/* VIN pictures: run every generated picture through the same path as «From a photo» (barcode first, then text reading)
   and count how many give the right VIN. Usage: node tvinimg.js <dir with list.json> */
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const DIR=process.argv[2]||'/tmp/claude-0/vinimg';const L=JSON.parse(fs.readFileSync(path.join(DIR,'list.json')));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:868}});await ctx.addInitScript(()=>{window.__OCR_BASE='http://localhost:8812/ocr/';});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(30);}};
 await p.goto('http://localhost:8811/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 const res=[];for(const it of L){const data='data:image/jpeg;base64,'+fs.readFileSync(path.join(DIR,it.f)).toString('base64');
  const r=await p.evaluate(async src=>{const t0=performance.now();const im=new Image();await new Promise(r=>{im.onload=r;im.src=src;});const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);
    await barcodeReader();let B=[];try{B=(await barcodeRead(c)).flatMap(t=>vinFind(t,true));}catch(e){}if(B.length)return {by:'barcode',c:B.map(x=>x.vin||x),ms:Math.round(performance.now()-t0)};
    const {L:F,raw}=await ocrDeep(c,null,()=>{});return {by:'text',c:F.map(x=>x.vin||x),raw:raw.slice(0,80),ms:Math.round(performance.now()-t0)};},data).catch(e=>({err:e.message}));
  const top=r.c&&r.c[0];const ok=top===it.vin,inL=!!(r.c&&r.c.includes(it.vin));res.push(Object.assign({},it,r,{ok,inL}));console.log(ok?'✅':inL?'🟡':'❌',it.f,r.by||'',r.ms||'',ok?'':JSON.stringify(r.c||r.err).slice(0,90));}
 const g={};res.forEach(x=>{const k=x.kind+'/'+x.eff;g[k]=g[k]||[0,0];g[k][1]++;if(x.ok)g[k][0]++;});
 const ok=res.filter(x=>x.ok).length,inl=res.filter(x=>x.inL).length;const ms=res.map(x=>x.ms||0).sort((a,b)=>a-b);
 const rep={n:res.length,top:ok,inList:inl,medianMs:ms[ms.length>>1],maxMs:ms.at(-1),byGroup:g,errors:errs};fs.writeFileSync('tvinimg_report.json',JSON.stringify(rep,null,1));console.log(JSON.stringify(rep,null,1));await b.close();})();
