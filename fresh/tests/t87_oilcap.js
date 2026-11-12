const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.jobs=cu.jobs;DB.vehicles=cu.vehicles;DB.customers=cu.customers;save();window.toast=()=>{};},[cat,cu]);
 const r=await p.evaluate(()=>{const E=carEngines('Toyota','Camry',2020).L.map(e=>e.n);const out={E};
   E.forEach(n=>{const v={id:'tz'+n,make:'Toyota',model:'Camry',year:2020,engine:n};const R=oilRecipe(v,'usual'),M=oilRecipe(v,'maker');out[n]=[R&&R.qty,R&&JSON.stringify(R.qsrc),M&&M.qty,engCodeX(v),dispOf(v)];});return out;});
 console.log(JSON.stringify(r,null,1));console.log('errors',errs);await b.close();})();
