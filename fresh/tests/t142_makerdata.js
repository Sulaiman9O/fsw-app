/* 2.42.7: maker oil data for the cars of the workshop (researched: engines of Toyota/Lexus, Nissan, Toyota diesel, GM/Ford/Jeep/Mercedes/VW,
   Honda/Mazda/Subaru/Suzuki/MG, Hyundai/Kia/Mitsubishi) + engine lists by model and year. The lookup also finds engines whose name has no digit (GM LMG, Ford Coyote). */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};const W=t=>new Promise(r=>setTimeout(r,t));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:400,height:868}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);
 const R=await p.evaluate(()=>{const t=(make,model,year,engine)=>{const v={id:'_t'+Math.random(),make,model,year,engine};const s=specOf(v);return {e:effEng(v),visc:s&&s.visc,cap:s&&s.cap,f:s&&(s.filter||[]).length,conf:s&&s.conf};};
  return {
   camry09:t('Toyota','Camry',2009,'2AZ-FE'),patrol16:t('Nissan','Patrol',2016,'4.0L VQ40DE'),yukon:t('GMC','Yukon',2011,'5.3L V8 · LMG/LY5 (Vortec)'),
   bronco:t('Ford','Bronco',2022,'2.7L V6 EcoBoost'),mustang:t('Ford','Mustang',2015,'5.0L V8 · Coyote'),rav18:t('Toyota','RAV4',2018,'2.494L'),
   accord19:t('Honda','Accord',2019,'2.0L 4 cyl turbo · K20C4'),hilux:t('Toyota','Hilux',2010,'2.0L 1TR-FE'),lc100:t('Toyota','Land Cruiser 100',2004,'4.7L 2UZ-FE'),
   ls430:t('Lexus','LS 430',2004,'4.3L 3UZ-FE'),mazda3:t('Mazda','Mazda3',2017,'2.0L 4 cyl · PE (SkyActiv)'),xj:t('Jeep','Cherokee',1998,'4.0L 6 cyl · AMC 242'),
   camry20:t('Toyota','Camry',2020,''),camry19g:t('Toyota','Camry',2019,'2.5L'),byd:t('BYD','Seal',2024,'1.5L 4 cyl PHEV (DM-i) · BYD472QC'),patrolOld:t('Nissan','Patrol',2010,'4.8L TB48DE'),
   q50:t('Nissan','Infinity Q50',2017,'VR30 (DDTT) 2997CC'),lc300:t('Toyota','Land Cruiser 300',2021,'3.4L V6')};});
 const has=(x,v)=>x&&x.visc&&x.visc.includes(v);
 ok(has(R.camry09,'5W-30')||has(R.camry09,'0W-20'),'Camry 2009 2AZ-FE has maker oil '+JSON.stringify(R.camry09));
 ok(R.camry09.cap>3.5&&R.camry09.cap<5,'2AZ-FE litres '+R.camry09.cap);
 ok(R.patrol16.visc&&R.patrol16.cap>4,'Patrol VQ40DE '+JSON.stringify(R.patrol16));
 ok(R.yukon.visc&&R.yukon.cap>5,'GMC LMG/LY5 (no digit in the name) found '+JSON.stringify(R.yukon));
 ok(R.bronco.visc&&R.mustang.visc,'Ford 2.7 EcoBoost / Coyote found '+JSON.stringify([R.bronco,R.mustang]));
 ok(R.rav18.visc&&R.rav18.cap>4,'RAV4 2018 «2.494L» (2AR-FE or 2.5 hybrid, same oil) → maker data '+JSON.stringify(R.rav18));
 ok(R.accord19.visc&&R.accord19.cap>4,'Accord 2019 «2.0L»: 2.0 turbo or 2.0 hybrid — stays for the user to pick '+JSON.stringify(R.accord19));
 ok(R.hilux.visc&&R.lc100.visc&&R.ls430.visc&&R.mazda3.visc&&R.xj.visc,'Hilux 1TR, LC100 2UZ, LS430 3UZ, Mazda PE, Jeep 4.0 all found');
 ok(R.camry20.visc===null||R.camry20.visc===undefined,'Camry 2020 with no engine stays unknown (2.5 or 3.5?)');
 ok(R.camry19g.visc&&R.camry19g.cap>=4.3,'Camry 2019 «2.5L» (2AR-FE GCC or A25A-FKS, same oil) → maker data '+JSON.stringify(R.camry19g));
 ok(R.byd.visc&&R.byd.visc.length,'Chinese data still there (BYD)');
 ok(R.patrolOld.visc&&R.q50.visc&&R.lc300.visc,'Patrol TB48DE, Q50 VR30, LC300 3.4 found '+JSON.stringify([R.patrolOld,R.q50,R.lc300]));
 /* every researched value is sane */
 const bad=await p.evaluate(()=>Object.entries(ENGSPEC).filter(([k,e])=>(e.visc||[]).some(x=>!/^\d+W-\d+$/.test(x))||(e.oil_l&&(e.oil_l<2||e.oil_l>16))).map(([k])=>k));
 ok(bad.length===0,'all engine data sane (viscosity format, 2–16 L) '+JSON.stringify(bad));
 ok(errs.length===0,'no page errors '+JSON.stringify(errs.slice(0,3)));await b.close();})();
