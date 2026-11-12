/* ---------- VIN → make, model, year, engine. Three sources, best first:
   1) this workshop's own cars: cars already saved with a VIN that starts the same (the first 8 signs = maker + model + engine)
      teach the app — works without internet and knows GCC cars.
   2) online, the free US government VIN database (NHTSA vPIC) — exact for American/Canadian-built and US-spec cars.
   3) without both: the maker from the first signs, and the year from the 10th sign.
   Answers from the internet are kept on the device, so the same VIN is not looked up twice. ---------- */
const VPIC='https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/';
const vinCacheGet=v=>{try{return (JSON.parse(localStorage.getItem('ws_vinc')||'{}'))[v]||null;}catch(e){return null;}};
const vinCacheSet=(v,o)=>{try{const c=JSON.parse(localStorage.getItem('ws_vinc')||'{}');c[v]=o;const k=Object.keys(c);if(k.length>400)delete c[k[0]];localStorage.setItem('ws_vinc',JSON.stringify(c));}catch(e){}};
const titleCase=s=>String(s||'').toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase()).replace(/\bBmw\b/,'BMW').replace(/\bGmc\b/,'GMC').replace(/\bMg\b/,'MG').replace(/\bByd\b/,'BYD');
/* 1) the workshop's own cars */
function vinLocal(vin,skipId){const pre=vin.slice(0,8);const L=DB.vehicles.filter(v=>v.id!==skipId&&v.make&&String(v.vin||'').toUpperCase().slice(0,8)===pre);if(!L.length)return null;
  const top=(f,arr)=>{const c={};arr.forEach(v=>{const x=f(v);if(x)c[x]=(c[x]||0)+1;});const e=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];return e?e[0]:'';};
  const same10=L.filter(v=>String(v.vin).toUpperCase()[9]===vin[9]);
  return {make:top(v=>v.make,L),model:top(v=>v.model,L),year:+top(v=>v.year,same10)||0,engine:top(v=>v.engine,L),n:L.length,src:'local'};}
/* 2) online */
async function vinOnline(vin){const c=vinCacheGet(vin);if(c)return c;if(navigator.onLine===false)return null;
  try{const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),7000);const r=await fetch(VPIC+vin+'?format=json',{signal:ctl.signal});clearTimeout(to);if(!r.ok)return null;
    const x=((await r.json()).Results||[])[0]||{};if(!x.Make)return null;
    const o={make:titleCase(x.Make),model:x.Model||'',year:+x.ModelYear||0,disp:x.DisplacementL?(+x.DisplacementL).toFixed(1):'',cyl:+x.EngineCylinders||0,code:(x.EngineModel||'').trim(),
      body:x.BodyClass||'',drive:x.DriveType||'',fuel:x.FuelTypePrimary||'',trim:x.Trim||'',country:x.PlantCountry||'',src:'online'};vinCacheSet(vin,o);return o;}catch(e){return null;}}
/* the engine line of our car list that fits what the VIN said (engine code first, then size + cylinders) */
function vinEngine(make,model,year,o){if(!make||!model||typeof carEngines!=='function')return '';let L=[];try{const r=carEngines(make,model,year);L=[...r.L,...(r.other||[])];}catch(e){return '';}
  const code=String(o.code||'').toUpperCase().replace(/\s/g,'');if(code){const h=L.find(e=>String(e.n).toUpperCase().replace(/\s/g,'').includes(code));if(h)return h.n;}
  if(o.disp){const H=L.filter(e=>String(e.n).startsWith(o.disp+'L'));const h2=H.find(e=>!o.cyl||new RegExp('\\b'+o.cyl+' ?cyl|V'+o.cyl,'i').test(e.n))||H[0];if(h2)return h2.n;}
  return '';}
async function vinDecode(vin,skipId){vin=String(vin||'').toUpperCase().trim();if(!VIN_RX.test(vin))return null;
  const loc=vinLocal(vin,skipId);const on=await vinOnline(vin);const out={vin,make:'',model:'',year:0,engine:'',src:[],extra:''};
  if(on){out.make=on.make;out.model=on.model;out.year=on.year;out.src.push('online');}
  if(loc){if(!out.make)out.make=loc.make;if(!out.model)out.model=loc.model;if(!out.year)out.year=loc.year;out.engine=loc.engine;out.src.push('local');}
  if(!out.make)out.make=vinMake(vin);if(!out.year)out.year=vinYear(vin);if(out.make&&typeof fixMake==='function')out.make=fixMake(out.make);
  if(on&&!out.engine)out.engine=vinEngine(out.make,out.model,out.year,on);
  if(on){const e=[on.disp?on.disp+'L':'',on.cyl?on.cyl+' cyl':'',on.code].filter(Boolean).join(' ');out.extra=[e,on.trim].filter(Boolean).join(' · ');if(!out.engine&&e)out.engineHint=e;}
  if(!out.src.length)out.src.push('guess');return out;}
const vinLabel=o=>[o.make,o.model,o.year||''].filter(Boolean).join(' ')+(o.engine?' · '+o.engine:o.engineHint?' · '+o.engineHint:'');
/* put what the VIN said into a car (only into empty fields, unless force) — returns the names of what changed */
function vinFill(d,o,force){const ch=[];['make','model','year','engine'].forEach(k=>{const v=k==='year'?(o.year?String(o.year):''):o[k];if(!v)return;if(force||!d[k]){if(String(d[k]||'')!==v){d[k]=v;ch.push(k);}}});
  if(ch.includes('make')&&!ch.includes('model')&&force)d.model=o.model||d.model;return ch;}
