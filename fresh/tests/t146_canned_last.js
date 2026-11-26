/* 2.43.2 (Sulaiman 26 Nov): in «Add to job» search, services and parts (oils) come before canned jobs;
   a joined emoji (🧑‍🔧) is ONE icon — no stray second icon in the item menu.
   Serves the built app through the browser itself (no local server): WWW=<dir of built www> (default ../www). SHOT=<prefix> saves pictures. */
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const WWW=path.resolve(__dirname,process.env.WWW||'../www');const SHOT=process.env.SHOT||'';
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const MIME={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:400,height:868},hasTouch:true,deviceScaleFactor:2});await ctx.addInitScript(()=>{window.__ICONS_ON=1;});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('http://localhost:8811/**',async r=>{let u=new URL(r.request().url()).pathname;if(u.endsWith('/'))u+='index.html';const f=path.join(WWW,decodeURIComponent(u));if(!f.startsWith(WWW)||!fs.existsSync(f))return r.fulfill({status:404,body:''});r.fulfill({status:200,contentType:MIME[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)});});
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.route('**/fonts.g*/**',r=>r.abort());
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(50);}};
 const W=t=>p.waitForTimeout(t),ev=(f,a)=>p.evaluate(f,a);
 await p.goto('http://localhost:8811/');await W(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await W(450);await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await W(450);await key('1234');await W(450);await key('1234');await W(900);
 await p.click('#nwdemo');await W(500);await p.click('#nwl').catch(()=>{});await W(500);await ev(()=>{document.querySelectorAll('#tour').forEach(x=>x.remove());DB.ws.motionOff=1;save();});
 /* make sure a canned job and a part both match «5w» */
 const info=await ev(()=>{const pt=DB.parts.find(p=>/5w/i.test(p.name))||DB.parts[0];if(!/5w/i.test(pt.name))pt.name='Engine Oil 5W-30';
   if(!DB.canned.some(c=>/5w/i.test(c.name)))DB.canned.push({id:'cjt',name:'Corolla 1.6L Zic 5W-30',items:[{k:'part',d:'Oil',q:4,p:2},{k:'labour',d:'Labour',q:1,p:3}]});save();
   const j=DB.jobs.find(j=>!isInvoiced(j)&&j.stage!=='estimate');go('job',{id:j.id});return {jid:j.id,pt:pt.id};});await W(600);
 await p.click('#jadd');await W(500);await p.fill('#aq','5w');await W(500);
 const order=await ev(()=>[...document.querySelectorAll('#sheet .lbl')].map(x=>x.textContent.trim()));
 const ci=order.findIndex(t=>/Canned|جاهزة/.test(t)),pi=order.findIndex(t=>/^Parts|قطع/.test(t)),si=order.findIndex(t=>/^Services|خدمات/.test(t));
 ok(ci>=0,'a canned job matches «5w» ('+order.join(' | ')+')');
 ok(ci>pi&&pi>=0,'Parts (oils) come before Canned jobs');ok(si<0||si<ci,'Services come before Canned jobs');
 if(SHOT)await p.screenshot({path:SHOT+'-search.png'});
 /* item menu: «Customer brought this part» row has one icon only */
 await ev(()=>closeSheet());await W(400);
 await ev(a=>{const j=DB.jobs.find(x=>x.id===a.jid);const pt=DB.parts.find(x=>x.id===a.pt);j.items.push({k:'part',d:pt.name,q:1,p:2.12,ref:pt.id});save();render();itemMenu(j,j.items.length-1);},info);await W(600);
 const icons=await ev(()=>[...document.querySelectorAll('#sheet button, #sheet .act, #sheet [class*=row]')].filter(b=>/Customer brought this part/.test(b.textContent)).map(b=>({svg:b.querySelectorAll('svg').length,txt:b.textContent.replace(/\s+/g,' ').trim().slice(0,60),joiner:/‍/.test(b.textContent)})));
 ok(icons.length>0,'item menu shows «Customer brought this part»');ok(icons.every(x=>x.svg<=1&&!x.joiner),'its row has a single icon and no leftover join mark '+JSON.stringify(icons));
 const stray=await ev(()=>[...document.querySelectorAll('#sheet svg')].filter(s=>{const r=s.getBoundingClientRect();const row=s.closest('button,.act,[class*=row]');if(!row)return false;const q=row.getBoundingClientRect();return r.top<q.top-1||r.bottom>q.bottom+1;}).map(s=>{const row=s.closest('button,.act,[class*=row]');return (row?row.className+': ':'')+(row||s.parentElement).textContent.replace(/\s+/g,' ').trim().slice(0,60);}));
 ok(stray.length===0,'no icon sits outside its row '+JSON.stringify(stray));
 if(SHOT){await p.locator('#sheet').evaluate(e=>{const r=[...e.querySelectorAll('*')].find(x=>/Add a note/.test(x.textContent)&&x.children.length<4);if(r)r.scrollIntoView({block:'center'});});await W(300);await p.screenshot({path:SHOT+'-menu.png'});}
 ok(errs.length===0,'no page errors '+JSON.stringify(errs.slice(0,3)));
 await b.close();})();
