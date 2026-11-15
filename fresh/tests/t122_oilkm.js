/* next oil km follows the oil on the job: full synthetic 10,000 · semi 7,000 · mineral 5,000; a km typed by hand is kept */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
await p.goto('http://localhost:8811/');await p.waitForTimeout(700);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));
const r=await p.evaluate(cat=>{DB.parts=cat.parts;DB.services=cat.services;save();
  const P=n=>DB.parts.find(x=>x.name===n);const svc=DB.services.find(s=>s.tag==='oil');
  const job=oil=>({id:uid('j'),km:100000,items:[{k:'labour',d:svc.name,ref:svc.id,tag:'oil'},{k:'part',d:oil,ref:P(oil).id}]});
  const km=j=>planRems(j).find(x=>x.kind==='oil').km;
  const out={};
  out.full=km(job('Toyota Motor Oil 5W-30 F/S 4ltrs'));
  out.semi=km(job('Zic 10W-40 S/S 4ltrs'));
  out.semiSynthHC=km(job('Senfineco SynthHC Motor Oil 10W-40 S/S 4ltrs 8928'));
  out.mineral=km(job('Shell Motor Oil 20W-50 Mineral 4ltrs HX5'));
  const unk={id:uid('j'),km:1,items:[{k:'labour',d:svc.name,ref:svc.id,tag:'oil'}]};out.noOil=km(unk);
  /* reminders already saved with 7000 (sheet opened before the oil was added), then the oil goes on */
  const j=job('Toyota Motor Oil 5W-30 F/S 4ltrs');j.rems=[{kind:'oil',name:'',mo:6,km:7000}];out.frozen=km(j);
  /* oil swapped to mineral */
  j.items[1]={k:'part',d:'Shell Motor Oil 20W-50 Mineral 4ltrs HX5',ref:P('Shell Motor Oil 20W-50 Mineral 4ltrs HX5').id};out.swapped=km(j);
  /* hand-set km kept */
  j.rems[0].km=8000;j.rems[0].kmSet=1;out.manual=km(j);
  return out;},cat);
console.log(JSON.stringify(r));
ok(r.full===10000,'full synthetic → 10,000');ok(r.semi===7000&&r.semiSynthHC===7000,'semi synthetic (S/S) → 7,000');ok(r.mineral===5000,'mineral → 5,000');
ok(r.noOil===7000,'no oil on the job → settings default 7,000');ok(r.frozen===10000,'saved reminder follows the oil');ok(r.swapped===5000,'oil swapped → km follows');ok(r.manual===8000,'km typed by hand is kept');
ok(!errs.length,'no page errors '+errs.join('|'));console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
