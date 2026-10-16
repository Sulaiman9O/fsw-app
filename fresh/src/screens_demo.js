/* ---------- TEST DATA: fake customers, cars, suppliers, parts, prices. All ids start with demo_ ---------- */
const isDemo=x=>x&&typeof x.id==='string'&&x.id.indexOf('demo_')===0;
const hasDemo=()=>['customers','vendors','parts'].some(k=>DB[k].some(isDemo));
function loadDemo(){if(hasDemo()){toast('Test data is already in the app');return;}
  const D=864e5,T=now();const P='🧪 ';
  const cust=[['c1','Salim (test)','90000001',[['Toyota','Camry','2016','TEST 1001',148200]]],
   ['c2','Ahmed (test)','90000002',[['Nissan','Patrol','2019','TEST 2002',96500],['Toyota','Corolla','2014','TEST 2003',211000]]],
   ['c3','Fatma (test)','90000003',[['Hyundai','Accent','2020','TEST 3004',61200],['Kia','Sportage','2018','TEST 3005',118700],['Toyota','Hilux','2015','TEST 3006',254300]]],
   ['c4','Khalid (test)','90000004',[['Lexus','ES 350','2017','TEST 4007',132900]]],
   ['c5','Maryam (test)','90000005',[['Honda','Civic','2019','TEST 5008',74300],['Mitsubishi','Pajero','2016','TEST 5009',189400]]]];
  cust.forEach(([id,n,ph,cars])=>{DB.customers.push({id:'demo_'+id,name:P+n,phone:ph,notes:'Test customer · fake data',t:T-40*D});
    cars.forEach(([mk,md,y,pl,km],k)=>DB.vehicles.push({id:'demo_'+id+'v'+k,cust:'demo_'+id,make:mk,model:md,year:y,plate:pl,km,vin:'',t:T-40*D}));});
  const ven=[['v1','Test Oils Trading','90000101','Engine oils, gearbox oils, coolant','Next day','30 days'],
   ['v2','Test Filters & Spares','90000102','Filters, brake pads, plugs, belts','Same day','Cash'],
   ['v3','Test Battery House','90000103','Batteries, bulbs','Same day','Cash']];
  ven.forEach(([id,n,ph,w,d,pay])=>DB.vendors.push({id:'demo_'+id,name:P+n,phone:ph,rep:'Test rep',what:w,del:d,pay}));
  const cats=DB.pcats,ct=c=>cats.includes(c)?c:cats[0];
  // [id,name,num,cat,unit,cost,price,stock,reorder,shelf,fits,vendor prices {v:cost}]
  const parts=[
   ['p1','Test 5W-30 full synthetic oil','T-OIL-530','Engine oil','L',1.6,2.8,48,12,'Oil rack 1','',{v1:1.6}],
   ['p2','Test 10W-40 semi synthetic oil','T-OIL-1040','Engine oil','L',1.1,2.0,36,12,'Oil rack 1','',{v1:1.1}],
   ['p3','Test 20W-50 mineral oil','T-OIL-2050','Engine oil','L',0.8,1.5,20,8,'Oil rack 2','',{v1:0.8}],
   ['p4','Test ATF gearbox oil','T-ATF-1','Gearbox oil','L',1.9,3.2,16,8,'Oil rack 2','',{v1:1.9}],
   ['p5','Test oil filter Toyota/Lexus','T-OF-90915','Oil filters','pc',1.2,2.5,9,4,'Shelf A1','Camry, Corolla, Hilux, Lexus ES',{v2:1.2,v1:1.4}],
   ['p6','Test oil filter Nissan','T-OF-15208','Oil filters','pc',1.3,2.5,2,4,'Shelf A1','Patrol, Sunny',{v2:1.3}],
   ['p7','Test oil filter Hyundai/Kia','T-OF-26300','Oil filters','pc',1.1,2.3,7,4,'Shelf A2','Accent, Sportage, Elantra',{v2:1.1}],
   ['p8','Test air filter Camry','T-AF-17801','Air filters','pc',2.2,4.0,3,2,'Shelf B1','Camry 2012-2017',{v2:2.2}],
   ['p9','Test cabin filter universal','T-CF-UNI','Cabin filters','pc',1.0,2.5,12,4,'Shelf B2','',{v2:1.0}],
   ['p10','Test front brake pads Camry','T-BP-CAM-F','Brake pads','set',6.5,12.0,2,2,'Shelf C1','Camry 2012-2017',{v2:6.5}],
   ['p11','Test front brake pads Patrol','T-BP-PAT-F','Brake pads','set',11.0,19.0,1,1,'Shelf C1','Patrol',{v2:11}],
   ['p12','Test spark plug iridium','T-SP-IR','Spark plugs','pc',2.4,4.5,16,8,'Drawer 1','',{v2:2.4}],
   ['p13','Test coolant 1L green','T-CL-1G','Coolant','L',0.9,1.8,10,4,'Floor 1','',{v1:0.9}],
   ['p14','Test battery 70Ah','T-BAT-70','Batteries','pc',24,36,4,2,'Battery corner','',{v3:24}],
   ['p15','Test bulb H4','T-BU-H4','Bulbs','pc',0.6,1.5,0,4,'Drawer 2','',{v3:0.6}]];
  parts.forEach(([id,n,nm,c,u,co,pr,st,ro,loc,fits,vp])=>{const vprices={};Object.entries(vp).forEach(([v,x])=>vprices['demo_'+v]={cost:x,t:T-10*D});
    DB.parts.push({id:'demo_'+id,name:P+n,num:nm,cat:ct(c),unit:DB.units.includes(u)?u:'pc',cost:co,price:pr,stock:st,reorder:ro,loc,fits,vprices,alts:[],t:T-60*D});});
  const pt=id=>byId('parts','demo_'+id);pt('p5').alts=['demo_p7'];pt('p7').alts=['demo_p5'];
  DB.parts.filter(isDemo).forEach(p=>(DB.moves=DB.moves||[]).push({t:T-60*D,part:p.id,q:p.stock,why:'Test opening stock',ref:'',by:'Test',bal:p.stock}));
  // a few jobs: one in the workshop, one invoiced & paid, one invoiced with money due, one estimate
  const svc=n=>DB.services.find(s=>s.name===n);const it=(n,q)=>{const s=svc(n);return s?{k:'labour',ref:s.id,d:s.name,q:q||1,u:'',p:s.p[1]??s.p[0],tag:s.tag}:{k:'labour',d:n,q:1,u:'',p:3};};
  const ip=(id,q)=>{const p=pt(id);return {k:'part',ref:p.id,d:p.name,num:p.num,q,u:p.unit==='L'?'L':'',p:p.price,cost:p.cost};};
  const mk=(id,c,v,stage,days,items,inv,paid)=>{const t=T-days*D;const j={id:'demo_'+id,no:DB.ws.nextJob++,cust:'demo_'+c,veh:'demo_'+v,km:byId('vehicles','demo_'+v).km,stage,items,disc:0,t,by:'Test',log:[[t,'Test job · fake data']],pays:[]};
    if(inv){j.inv={no:DB.ws.nextInv++,t:t+3600e3,by:'Test'};}if(paid)j.pays.push({m:'Cash',amt:paid,t:t+3600e3,by:'Test'});DB.jobs.push(j);return j;};
  mk('j1','c1','c1v0','work',0,[it('Engine oil change'),ip('p1',4.5),ip('p5',1)]);
  const j2=mk('j2','c3','c3v1','done',12,[it('Engine oil change'),ip('p2',4),ip('p7',1),it('Cabin (AC) filter'),ip('p9',1)],true,0);j2.pays[0]={m:'Card',amt:jobTotals(j2).total,t:j2.inv.t,by:'Test'};
  mk('j3','c2','c2v0','ready',2,[it('Front brake pads'),ip('p11',1),it('Brake check')],true,10);
  mk('j4','c5','c5v1','estimate',1,[it('Gearbox oil drain & refill'),ip('p4',8)]);
  DB.jobs.filter(j=>j.id==='demo_j2').forEach(j=>{try{makeReminders(j);}catch(e){}});
  // an open supplier order for the low parts
  DB.pos.push({id:'demo_o1',no:(DB.pos.length?Math.max(...DB.pos.map(x=>x.no)):0)+1,vendor:'demo_v2',items:[{part:'demo_p6',q:6,cost:1.3},{part:'demo_p10',q:2,cost:6.5}],status:'open',t:T-D,by:'Test'});
  save();render();toast('Test data added. Everything with 🧪 is fake.');}
function removeDemo(){const ids=new Set();['customers','vehicles','vendors','parts','jobs','pos'].forEach(k=>DB[k].forEach(x=>{if(isDemo(x))ids.add(x.id);}));
  ['customers','vehicles','vendors','parts','jobs','pos'].forEach(k=>DB[k]=DB[k].filter(x=>!isDemo(x)));
  DB.reminders=DB.reminders.filter(r=>!ids.has(r.veh)&&!ids.has(r.cust));DB.moves=(DB.moves||[]).filter(m=>!ids.has(m.part));DB.counts=DB.counts.filter(c=>!ids.has(c.part));
  DB.parts.forEach(p=>{if(p.alts)p.alts=p.alts.filter(a=>!ids.has(a));if(p.vprices)Object.keys(p.vprices).forEach(v=>{if(ids.has(v))delete p.vprices[v];});});
  DB.jobs.forEach(j=>(j.items||[]).forEach(i=>{if(ids.has(i.ref))delete i.ref;}));
  if(!DB.jobs.length){DB.ws.nextJob=1;DB.ws.nextInv=DB.ws.invStart||1001;}
  save();render();toast('Test data removed');}
function demoBanner(){return hasDemo()?`<div class="demob"><span>🧪 <b>Test data is in the app.</b> Names with 🧪 are fake.</span>${can.settings()?'<button id="demox">Remove</button>':''}</div>`:'';}
