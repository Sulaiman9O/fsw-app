const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:412,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));
 const r=await p.evaluate(cat=>{const D2=cat.parts.find(x=>x.name.includes('YZZD2'));const D1=cat.parts.find(x=>x.name.includes('YZZD1'));
   // old state: broad lists, no flag
   DB.parts=cat.parts.map(x=>{const y=Object.assign({},x);delete y.fitsV;return y;});const d2=DB.parts.find(x=>x.id===D2.id);d2.fits='camry 1997-2001, toyota camry 2002-2017, toyota corolla 2001-2016';
   const n=fitsFix();const v={make:'Toyota',model:'Camry',year:'2015',engine:'2.5L'};const v99={make:'Toyota',model:'Camry',year:'1999',engine:''};
   const d1=DB.parts.find(x=>x.id===D1.id);const n2=fitsFix();d2.fits='my edit';fitsFix();
   return {n,n2,d2camry15:fitsCar(Object.assign({},d2,{fits:FITS_FIX[D2.name]}),v),d1camry15:fitsCar(d1,v),d2camry99:fitsCar(Object.assign({},d2,{fits:FITS_FIX[D2.name]}),v99),kept:d2.fits,
     fit15:DB.parts.filter(x=>fitsCar(x,v)).map(x=>x.name)};},cat);
 console.log(JSON.stringify(r,null,1));console.log('errors',errs);await b.close();})();
