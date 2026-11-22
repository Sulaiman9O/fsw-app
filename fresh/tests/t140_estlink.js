/* 2.42.4: the estimate is sent as a LINK like the invoice. The page (same look as the invoice) says «عرض سعر» / ESTIMATE,
   never «فاتورة» / INVOICE, has no paid / balance due / PAID; the WhatsApp text has the link; no internet or a failed link → text as before.
   The link viewer says «عرض سعر رقم …» for kind 'est', and still «فاتورة» for invoices. */
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const p=await (await b.newContext({viewport:vp||{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));return {b,p,errs};}
const W=t=>new Promise(r=>setTimeout(r,t));
(async()=>{
 {const {b,p,errs}=await start();const ev=(f,a)=>p.evaluate(f,a);
  await ev(()=>{const j=JSON.parse(JSON.stringify(DB.jobs.find(x=>!isInvoiced(x)&&(x.items||[]).length&&!(x.items||[]).some(i=>i.pend))));j.id='eL';j.no=8802;j.stage='estimate';delete j.inv;j.pays=[];DB.jobs.push(j);save();});
  /* the page, in every invoice look and language */
  for(const t of ['modern','clean','classic'])for(const lang of ['both','ar','en']){
   const r=await ev(([t,lang])=>{const s=invS();const keep=JSON.stringify(s);Object.assign(DB.ws.invStyle||(DB.ws.invStyle={}),{t,lang});let h;try{h=invoiceHtml(byId('jobs','eL'),true);}catch(e){h='ERR '+e.message;}DB.ws.invStyle=JSON.parse(keep);
     const d=document.createElement('div');d.innerHTML=h;const tx=d.textContent;return {tx,err:h.startsWith('ERR')};},[t,lang]);
   const tag=t+'/'+lang+': ';const tx=r.tx.replace(/وليس فاتورة|not an invoice/g,'');
   ok(!r.err,tag+'estimate page is made '+(r.err?r.tx:''));
   ok((lang==='en'||/عرض سعر/.test(r.tx))&&(lang==='ar'||/ESTIMATE/.test(r.tx)),tag+'title عرض سعر / ESTIMATE');
   ok(!/فاتورة|INVOICE|Invoice/.test(tx),tag+'no «فاتورة / INVOICE» on the estimate');
   ok(!/المستحق|Balance due|PAID|مدفوعة|Paid\b|مستحقة|\bDue\b/.test(tx),tag+'no paid / balance due');
   ok(/8802/.test(r.tx),tag+'estimate number 8802');}
  const inv=await ev(()=>{const j=DB.jobs.find(x=>isInvoiced(x)&&x.inv&&!x.inv.void);const d=document.createElement('div');d.innerHTML=invoiceHtml(j,true);return d.textContent;});
  ok(/INVOICE|فاتورة/.test(inv)&&/Balance due|المستحق/.test(inv)&&!/عرض سعر|ESTIMATE/.test(inv),'invoices unchanged: still INVOICE / فاتورة with balance due');
  /* the page draws to a picture (what goes behind the link) */
  const cv=await ev(async()=>{const c=await htmlCanvas(invoiceHtml(byId('jobs','eL'),true),invDocCss(),210,1.2);return {w:c.width,h:c.height,pages:cutPages(c).length};});
  ok(cv.w>500&&cv.h>500&&cv.pages>=1,'estimate drawn as a picture '+JSON.stringify(cv));
  /* sending with a link: kind est, number, text has the link and عرض سعر, no فاتورة */
  const L=await ev(async()=>{const o={};const S0=shareText,U0=docUploadLink,K0=[FBS,SYNC.user],O0=window.open;
    window.open=()=>null;window.shareText=shareText=(ph,t)=>{o.text=t;o.ph=ph;};window.docUploadLink=docUploadLink=async(kind,html,css,meta)=>{o.kind=kind;o.meta=meta;o.html=html.includes('عرض سعر');return EST_VIEW+'TESTabcdefghijklmnop';};FBS=FBS||{};SYNC.user=SYNC.user||{uid:'t'};
    document.querySelector('#main')&&go('job',{id:'eL'});await new Promise(r=>setTimeout(r,400));document.querySelector('#jsendest2').click();await new Promise(r=>setTimeout(r,600));
    window.shareText=shareText=S0;window.docUploadLink=docUploadLink=U0;FBS=K0[0];SYNC.user=K0[1];window.open=O0;o.link=byId('jobs','eL').estLink;o.log=byId('jobs','eL').log.slice(-1)[0][1];return o;});
  ok(L.kind==='est'&&L.meta&&L.meta.no==='8802'&&L.html,'link made as kind est, no 8802, page says عرض سعر');
  ok(/عرض سعر رقم 8802/.test(L.text||'')&&/github\.io\/fsw-app\/f\/\?k=TEST/.test(L.text||'')&&!/فاتورة/.test((L.text||'').replace('وليس فاتورة','')),'WhatsApp text: عرض سعر رقم 8802 + the link → '+(L.text||'').replace(/\n/g,' | ').slice(0,160));
  ok(/وليس فاتورة/.test(L.text||''),'text says «وليس فاتورة»');
  ok(/TEST/.test(L.link||'')&&/Estimate link sent/.test(L.log||''),'job keeps the link and logs it');
  /* the link fails → text as before */
  const F=await ev(async()=>{const o={};const S0=shareText,U0=docUploadLink,K0=[FBS,SYNC.user],O0=window.open;
    window.open=()=>null;window.shareText=shareText=(ph,t)=>{o.text=t;};window.docUploadLink=docUploadLink=async()=>{throw new Error('offline');};FBS=FBS||{};SYNC.user=SYNC.user||{uid:'t'};
    document.querySelector('#jsendest2').click();await new Promise(r=>setTimeout(r,800));window.shareText=shareText=S0;window.docUploadLink=docUploadLink=U0;FBS=K0[0];SYNC.user=K0[1];window.open=O0;return o;});
  ok(/عرض سعر رقم 8802/.test(F.text||'')&&!/http/.test(F.text||''),'link failed → sent as text (no link)');
  /* no internet / not signed in → text right away */
  const N=await ev(()=>{let t=null;const S0=shareText;window.shareText=shareText=(ph,x)=>{t=x;};document.querySelector('#jsendest2').click();window.shareText=shareText=S0;return t;});
  ok(/عرض سعر رقم 8802/.test(N||''),'offline → text right away');
  /* an empty estimate: nothing is sent */
  const E=await ev(()=>{const j=byId('jobs','eL');const it=j.items;j.items=[];let t=null;const S0=shareText;window.shareText=shareText=(ph,x)=>{t=x;};sendEstimate(j);window.shareText=shareText=S0;j.items=it;return t;});
  ok(E===null,'empty estimate: nothing sent');
  await ev(()=>{go('job',{id:'eL'});});await W(400);await p.screenshot({path:'/tmp/t140_job.png'});
  await ev(()=>{const d=document.createElement('div');d.id='pvx';d.style.cssText='position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto';d.innerHTML='<style>'+invDocCss()+'</style><div style="width:210mm;zoom:.5">'+invoiceHtml(byId('jobs','eL'),true)+'</div>';document.body.appendChild(d);});await W(300);await p.screenshot({path:'/tmp/t140_est.png',fullPage:false});
  /* 2.42.5: a bit longer than A4 (≤ 1.5 pages) → one page; longer → stays more pages, not shrunk */
  for(const [n,want] of [[3,'one'],[11,'one'],[15,'one'],[45,'many']]){
   const R=await ev(async n=>{const j=byId('jobs','eL');const it=j.items;const base=it.filter(i=>!i.pend)[0];j.items=[];for(let k=0;k<n;k++)j.items.push(Object.assign({},base,{d:base.d+' '+k,ar:'بند عربي '+k,num:'NUM-'+k,note:k%3?'':'ملاحظة طويلة للبند رقم '+k}));
     j.notes='القطع التالية غير متوفرة لدينا:\n- فلتر الهواء\n- فلتر المكيف\n- سير المكينة\n- 6 بواجي\nCustomer to bring: air filter, A/C cabin filter, engine drive belt, 6 spark plugs.';
     const S0=DB.ws.invStyle&&JSON.stringify(DB.ws.invStyle);DB.ws.invStyle=Object.assign(DB.ws.invStyle||{},{show:Object.assign({},invS().show,{notes:1,num:1,ar:1})});
     const raw=await htmlCanvas(invoiceHtml(j,true),invDocCss(),210,1);const before=cutPages(raw).length;
     const F=fitLink(invoiceHtml(j,true),invDocCss());const c=await htmlCanvas(F.html,F.css,210,1);const after=cutPages(c).length;
     const tx=(()=>{const d=document.createElement('div');d.innerHTML=F.html;return d.textContent;})();
     j.items=it;j.notes='';if(S0)DB.ws.invStyle=JSON.parse(S0);return {before,after,z:F.z,hasEnd:/شكراً لثقتكم|Thank you/.test(tx),last:tx.includes('NUM-'+(n-1))};},n);
   if(want==='one')ok(R.after===1&&R.z>=1/1.5-0.01&&R.hasEnd&&R.last,n+' items: '+R.before+' page(s) → '+R.after+' page, zoom '+R.z.toFixed(2)+' (not below 0.67), nothing lost');
   else ok(R.after===R.before&&R.after>=2&&R.z===1,n+' items: long ('+R.before+' pages) → stays '+R.after+' pages, not shrunk');}
  const LP=await ev(async()=>{const o={};const U0=docUploadLink,K0=[FBS,SYNC.user],O0=window.open,S0=shareText;window.open=()=>null;window.shareText=shareText=()=>{};
    const FL=fitLink;window.fitLink=fitLink=(h,c)=>{o.fit=1;return {html:h+'<i>FITTED</i>',css:c,z:1};};window.docUploadLink=docUploadLink=async(kind,html,css)=>{o.css=o.fit&&html.includes('FITTED');return EST_VIEW+'TESTabcdefghijklmnop';};FBS=FBS||{};SYNC.user=SYNC.user||{uid:'t'};
    await sendEstimate(byId('jobs','eL'));window.fitLink=fitLink=FL;window.docUploadLink=docUploadLink=U0;FBS=K0[0];SYNC.user=K0[1];window.open=O0;window.shareText=shareText=S0;return o;});
  ok(LP.css,'sending an estimate goes through the one-page fit');
  ok(errs.length===0,'no page errors '+JSON.stringify(errs.slice(0,3)));await b.close();}
 /* the link viewer page (docs/f = hosting/f) */
 {const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:400,height:800}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  const html=fs.readFileSync(path.join(__dirname,'../../docs/f/index.html'),'utf8');ok(html===fs.readFileSync(path.join(__dirname,'../../hosting/f/index.html'),'utf8'),'docs/f and hosting/f are the same page');
  const png1='/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AN//Z';
  for(const kind of ['est','inv']){await p.unrouteAll().catch(()=>{});
   await p.route('https://viewer.test/**',r=>r.fulfill({status:200,contentType:'text/html',body:html}));
   await p.route('https://firestore.googleapis.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({fields:{kind:{stringValue:kind},n:{integerValue:'1'},no:{stringValue:'8802'},ws:{stringValue:'Fast Service World'},ph:{stringValue:'+968 1234'},img:{stringValue:png1},w:{integerValue:'1'},h:{integerValue:'1'}}})}));
   await p.goto('https://viewer.test/f/?k=TESTabcdefghijklmnop');await W(700);const top=await p.textContent('#top');const ttl=await p.title();
   if(kind==='est')ok(/عرض سعر رقم 8802/.test(top)&&!/فاتورة/.test(top)&&/عرض سعر/.test(ttl),'viewer, estimate: «عرض سعر رقم 8802», no فاتورة → '+top.slice(0,70));
   else ok(/فاتورة رقم 8802/.test(top),'viewer, invoice: still «فاتورة رقم 8802»');
   if(kind==='est'){await p.screenshot({path:'/tmp/t140_viewer.png'});const [dl]=await Promise.all([p.waitForEvent('download',{timeout:4000}).catch(()=>null),p.click('#dl')]);ok(dl&&/^Estimate-8802\.pdf$/.test(dl.suggestedFilename()),'viewer download name Estimate-8802.pdf');}}
  ok(errs.length===0,'viewer: no page errors '+JSON.stringify(errs));await b.close();}
})();
