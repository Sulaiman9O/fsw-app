/* QA-01: a km typo typed on the counter stays on the car after the mistaken job is deleted with Back → Delete (2.33.x) */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
async function start(vp){const b=await chromium.launch();const p=await (await b.newContext({viewport:vp||{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 await p.click('#nwdemo');await p.click('#nwl').catch(()=>{});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelectorAll('#tour').forEach(x=>x.remove()));return {b,p,errs};}
/* a car with a plate, a known km and no open job */
const freeCar=p=>p.evaluate(()=>{const open=new Set(DB.jobs.filter(j=>!j.inv&&j.stage!=='done').map(j=>j.veh));const v=DB.vehicles.find(v=>v.plate&&!open.has(v.id)&&byId('customers',v.cust));v.km=v.km||80000;save();return {id:v.id,plate:v.plate,km:+v.km};});
const counterOpen=async(p,v,km)=>{await p.evaluate(()=>go('home'));await p.evaluate(v=>{S.ctr={q:'',vid:v,km:''};go('counter');},v.id);await p.waitForTimeout(300);if(km!=null){await p.fill('#ckm',String(km));await p.dispatchEvent('#ckm','input');}await p.click('#cadd');await p.waitForTimeout(500);await p.evaluate(()=>closeSheet());await p.waitForTimeout(150);};

(async()=>{const {b,p,errs}=await start();const v=await freeCar(p);
 await counterOpen(p,v,v.km*10+3);ok(await p.evaluate(id=>byId('vehicles',id).km,v.id)===v.km*10+3,'precondition: typo stored on the car');
 await p.evaluate(()=>back());await p.waitForTimeout(300);ok(!!(await p.$('#fjdel')),'Back asks keep/delete');await p.click('#fjdel');await p.waitForTimeout(300);
 const km=await p.evaluate(id=>byId('vehicles',id).km,v.id);ok(km===v.km,'car km back to '+v.km+' after Delete (now '+km+')');console.log('errors',errs);await b.close();})();
