/* oil change on an SUV / pickup takes the SUV service, a sedan the sedan one; VIN "ES" keeps the chosen "ES 350" */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));
 const r=await p.evaluate(cat=>{DB.parts=cat.parts;DB.services=cat.services.filter(s=>rxOf(s)!=='oil');
   DB.services.push({id:'sSed',name:'Engine Oil Change – Sedan',tag:'oil',p:[2.5,2.5,2.5,2.5,2.5,2.5,2.5]},{id:'sSuv',name:'Engine Oil Change – SUV',tag:'oil',p:[3.5,3.5,3.5,3.5,3.5,3.5,3.5]});save();
   const car=(make,model,body)=>{const v={id:uid('v'),make,model,year:'2020',body};DB.vehicles.push(v);return v;};
   const lc=car('Toyota','Land Cruiser','SUV');lc.engine='4.0L V6 · 1GR-FE';lc.year='2015',paj=car('Mitsubishi','Pajero'),hil=car('Toyota','Hilux'),cam=car('Toyota','Camry','Sedan'),rav=car('Toyota','RAV4','SUV');
   const out={lc:rxSvcFor('oil',lc).id,paj:rxSvcFor('oil',paj).id,hil:rxSvcFor('oil',hil).id,cam:rxSvcFor('oil',cam).id,rav:rxSvcFor('oil',rav).id};
   /* the counter oil button on a Land Cruiser */
   const j={id:uid('j'),no:9001,veh:lc.id,items:[],stage:'new',t:Date.now()};DB.jobs.push(j);applyOilRecipe(j,'usual');out.jobSvc=(j.items.find(isOilSvc)||{}).ref;out.jobLab=jobTotals(j).labour;
   /* VIN: "ES" from the database, "ES 350" chosen */
   const d={make:'Lexus',model:'ES 350',year:'2017',engine:'3.5L 2GR-FE'};vinFill(d,{make:'Lexus',model:'ES',year:2017,engine:''},true);out.vinModel=d.model;out.vinEng=d.engine;
   const d2={make:'Lexus',model:'IS 250'};vinFill(d2,{make:'Lexus',model:'ES'},true);out.vinOther=d2.model;
   out.same=[vinSame('ES 350','ES'),vinSame('Camry','Corolla')];return out;},cat);
 console.log(JSON.stringify(r));
 ok(r.lc==='sSuv'&&r.paj==='sSuv'&&r.hil==='sSuv'&&r.rav==='sSuv','Land Cruiser, Pajero, Hilux, RAV4 → SUV oil change');ok(r.cam==='sSed','Camry → sedan oil change');
 ok(r.jobSvc==='sSuv'&&r.jobLab>=3.5,'oil button on a Land Cruiser adds the SUV service (labour 3.5)');
 ok(r.vinModel==='ES 350','VIN "ES" keeps "ES 350"');ok(r.vinEng==='3.5L 2GR-FE','engine kept when the VIN has none');ok(r.vinOther==='ES','a different model is still replaced');ok(r.same[0]&&!r.same[1],'same-model check');
 ok(!errs.length,'no page errors '+errs.join('|'));console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
