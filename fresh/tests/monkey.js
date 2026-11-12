/* MONKEY: tap random buttons, type random text, go back, open random screens — for N minutes — and record every error.
   Safe: dangerous buttons (delete, reset, sign out, restore) are never tapped. Usage: node monkey.js [minutes] [width] */
const {chromium}=require('playwright');const fs=require('fs');
const MIN=+process.argv[2]||5,WIDTH=+process.argv[3]||400;
const CAT=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const SRC=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
(async()=>{const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});const ctx=await b.newContext({viewport:{width:WIDTH,height:WIDTH<700?868:900},permissions:['camera']});
 const p=await ctx.newPage();const errs=[];let last='';p.on('pageerror',e=>errs.push({m:e.message,stack:(e.stack||'').split('\n').slice(0,3).join(' | '),after:last}));
 p.on('dialog',d=>d.dismiss().catch(()=>{}));p.on('popup',w=>w.close().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.route('**/wa.me/**',r=>r.abort());await p.route('**/api.whatsapp.com/**',r=>r.abort());
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(30);}};
 await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 await p.evaluate(([cat,src])=>{DB.parts=cat.parts;DB.services=cat.services;if(cat.scats)DB.scats=cat.scats;if(cat.pcats)DB.pcats=cat.pcats;DB.customers=src.customers;DB.vehicles=src.vehicles;DB.jobs=src.jobs.slice(-300);DB.reminders=src.reminders||[];
   const n=Date.now();DB.jobs.slice(-12).forEach((j,i)=>{j.stage=['new','work','ready','estimate'][i%4];delete j.inv;j.pays=[];j.t=n-i*3600e3;});
   DB.ws.nextJob=1000;DB.ws.nextInv=1000;save();window.print=()=>{};window.open=()=>null;},[CAT,SRC]);
 /* never tap these */
 const BAD=/delete|remove|حذف|احذف|reset|erase|مسح|sign out|log ?out|تسجيل الخروج|restore|استعادة|wipe|purge|إلغاء الفاتورة|return \/ cancel|reset all/i;
 const ROUTES=['home','work','counter','cust','stock','more','svc','money','reports','settings','insp','lists','debts','checks','exp','close','count','vendors','pkgs','quote','search','stkset','invstyle','users','msgs','stockval','news','setup'];
 const words=['camry','1234','OM 12','toyota','oil','٥٠٠٠','-5','0.5','','<b>x</b>','زيت','99999999','ا'];
 const end=Date.now()+MIN*60e3;let acts=0;const seen={};
 while(Date.now()<end){acts++;
  try{const r=Math.random();
   if(r<0.08){const rt=ROUTES[Math.floor(Math.random()*ROUTES.length)];last='go '+rt;await p.evaluate(rt=>{try{closeSheet();}catch(e){}go(rt);},rt);}
   else if(r<0.13){last='back';await p.evaluate(()=>{try{if(S.sheet)closeSheet();else back();}catch(e){}});}
   else if(r<0.28){const inp=await p.$$('#sheet input.field:not([type=hidden]):not([disabled]),#main input.field:not([type=hidden]):not([disabled]),textarea:not([disabled])');
     if(inp.length){const el=inp[Math.floor(Math.random()*inp.length)];const w=words[Math.floor(Math.random()*words.length)];last='type '+w;await el.fill(w,{timeout:800}).catch(()=>{});await el.dispatchEvent('input').catch(()=>{});}}
   else{const L=await p.$$('#sheet button:visible,#main button:visible,#main [data-go]:visible,#main a:visible,nav.rail button:visible,nav.bottom button:visible');
     if(L.length){const el=L[Math.floor(Math.random()*L.length)];const t=((await el.innerText().catch(()=>''))+' '+((await el.getAttribute('id'))||'')+' '+((await el.getAttribute('title'))||'')).trim();
       if(BAD.test(t))continue;last='tap '+t.slice(0,40)+' @'+(await p.evaluate(()=>S.r));seen[last.split('@')[1]]=(seen[last.split('@')[1]]||0)+1;
       if(Math.random()<0.1)await el.click({timeout:800,delay:600}).catch(()=>{});else await el.click({timeout:800}).catch(()=>{});}}
   await p.waitForTimeout(40);
   /* a file chooser or a camera sheet can pop: close it */
  }catch(e){}
  if(acts%300===0)console.log(acts,'actions',errs.length,'errors');}
 const uniq={};errs.forEach(e=>{const k=e.m.slice(0,140);if(!uniq[k])uniq[k]={n:0,stack:e.stack,after:e.after};uniq[k].n++;});
 fs.writeFileSync('monkey_report_'+WIDTH+'.json',JSON.stringify({minutes:MIN,width:WIDTH,actions:acts,errors:errs.length,unique:uniq,screens:seen},null,1));
 console.log('actions',acts,'errors',errs.length);console.log(JSON.stringify(uniq,null,1).slice(0,4000));await b.close();})();
