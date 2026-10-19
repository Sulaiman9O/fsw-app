const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));const cu=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-customers-v2.json'));
 const r=await p.evaluate(([cat,cu])=>{DB.parts=cat.parts;DB.services=cat.services;DB.customers=cu.customers;DB.vehicles=cu.vehicles;DB.jobs=cu.jobs;
   const out={tot:0,ok:0,none:0,bad:[]};
   DB.vehicles.forEach(v=>{const js=DB.jobs.filter(j=>j.veh===v.id&&j.stage!=='estimate').sort((a,b)=>b.t-a.t);let last=null;
     for(const j of js){const o=oilParts(j);const f=o.filters.find(x=>x.p);if(f){last=f.p;break;}}if(!last||!v.year)return;
     const q={id:'_q',make:v.make,model:v.model,year:v.year,engine:v.engine};const rec=oilRecipe(q,'usual');const R={filter:(rec&&rec.filter)||makerFilter(q)||fitsFilter(q)};out.tot++;
     if(!R.filter){out.none++;out.bad.push([v.make,v.model,v.year,v.engine.slice(0,20),'-',last.name]);return;}
     if(R.filter.id===last.id)out.ok++;else out.bad.push([v.make,v.model,v.year,(v.engine||'').slice(0,20),R.filter.name,last.name]);});
   return out;},[cat,cu]);
 console.log('total',r.tot,'match',r.ok,'none',r.none);fs.writeFileSync(process.argv[2]||'bad.json',JSON.stringify(r.bad,null,0).replace(/\],\[/g,'],\n['));console.log('errors',errs.slice(0,3));await b.close();})();
