/* QA-09: web/desktop: every WhatsApp button sends the ShopFlo tab itself to wa.me (app is gone; reload + PIN needed).
   Build 2.33.1 (app.js 00:54): shareText() always does location.href=u.
   Newer src/screens_job.js:47 (edited 01:42, not built): window.open(u,'_blank','noopener') — per the HTML spec 'noopener' makes window.open return null,
   so the `if(!w)location.href=u` fallback STILL fires: WhatsApp opens twice (new tab + this tab). */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const p=await (await b.newContext({viewport:vp||{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));return {b,p,errs};}
/* a car with a plate, a known km and no open job */
const freeCar=p=>p.evaluate(()=>{const open=new Set(DB.jobs.filter(j=>!j.inv&&j.stage!=='done').map(j=>j.veh));const v=DB.vehicles.find(v=>v.plate&&!open.has(v.id)&&byId('customers',v.cust));v.km=v.km||80000;save();return {id:v.id,plate:v.plate,km:+v.km};});
const counterOpen=async(p,v,km)=>{await p.evaluate(()=>go('home'));await p.evaluate(v=>{S.ctr={q:'',vid:v,km:''};go('counter');},v.id);await p.waitForTimeout(300);if(km!=null){await p.fill('#ckm',String(km));await p.dispatchEvent('#ckm','input');}await p.click('#cadd');await p.waitForTimeout(500);await p.evaluate(()=>closeSheet());await p.waitForTimeout(150);};

(async()=>{const {b,p,errs}=await start({width:1366,height:900});const pops=[];p.context().on('page',x=>pops.push(x));
 await p.route('**/wa.me/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<h1>WA</h1>'}));await p.context().route('**/wa.me/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<h1>WA</h1>'}));
 const c=await p.evaluate(()=>{const c=DB.customers.find(c=>c.phone);go('custd',{id:c.id});return c.id;});await p.waitForTimeout(400);
 await p.click('#cwa');await p.waitForTimeout(1500);
 const url=p.url();const alive=await p.evaluate(()=>typeof S!=='undefined').catch(()=>false);
 console.log('new tabs',pops.length,'app tab url',url);ok(alive&&/localhost/.test(url),'ShopFlo tab stays on ShopFlo after tapping WhatsApp');await b.close();})();
