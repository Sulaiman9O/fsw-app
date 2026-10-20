const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 await p.evaluate(()=>{loadDemo();go('home');});await p.waitForTimeout(300);
 const r=()=>p.evaluate(()=>S.r);const BK=async()=>{await p.click('[data-back]');await p.waitForTimeout(250);};const nav=async t=>{await p.locator(`nav [data-go="${t}"], .nav [data-go="${t}"], [data-nav="${t}"]`).first().click().catch(()=>p.evaluate(t=>go(t),t));await p.waitForTimeout(250);};
 const go=(x,pp)=>p.evaluate(([x,pp])=>go(x,pp),[x,pp||{}]).then(()=>p.waitForTimeout(250));
 await go('home');await go('newjob');await BK();ok(await r()==='home','home→new car in→back = '+await r());
 await go('work');await go('newjob');await BK();ok(await r()==='work','work→new car in→back = '+await r());
 // create job from newjob opened at home
 await go('home');await p.evaluate(()=>{const v=DB.vehicles[0];go('newjob',{n:{phone:'',name:'',plate:v.plate,make:'',model:'',year:'',km:'',vin:'',engine:'',est:false,custId:v.cust,vehId:v.id}});});await p.waitForTimeout(300);
 const jid=await p.evaluate(()=>{const v=DB.vehicles[0];const j={id:uid('j'),no:DB.ws.nextJob++,cust:v.cust,veh:v.id,stage:'new',items:[],t:now(),log:[],pays:[]};DB.jobs.push(j);save();go('job',{id:j.id});return j.id;});await p.waitForTimeout(300);
 await BK();ok(await r()==='home','new job saved → job → back = '+await r()+' (form not repeated)');
 // customer → customer file → job → back → file → back → customers
 await go('cust');const cid=await p.evaluate(()=>DB.jobs[0].cust);await go('custd',{id:cid});await go('job',{id:await p.evaluate(()=>DB.jobs[0].id)});
 await BK();ok(await r()==='custd','job opened from customer → back = '+await r());await BK();ok(await r()==='cust','→ back = '+await r());
 // job → invoice → back → job → back → work list
 await go('work');const j0=await p.evaluate(()=>(DB.jobs.find(j=>j.inv)||DB.jobs[0]).id);await go('job',{id:j0});await go('inv',{id:j0});await BK();ok(await r()==='job','invoice → back = '+await r());await BK();ok(await r()==='work','job → back = '+await r());
 // more → lists → list → back → lists → back → more
 await go('more');await go('lists');await go('list',{id:'scat'});await BK();ok(await r()==='lists','list → back = '+await r());await BK();ok(await r()==='more','lists → back = '+await r());
 // home → stock → back home ; more → stock → back more
 await go('home');await go('stock');await BK();ok(await r()==='home','home→stock→back = '+await r());
 await go('more');await go('stock');await BK();ok(await r()==='more','more→stock→back = '+await r());
 // ping-pong does not grow history: home→quote→debts→quote→back
 await go('home');await go('quote');await go('debts');await go('quote');await BK();ok(await r()==='home','quote→debts→quote→back = '+await r());
 console.log('errors',errs);await b.close();})();
