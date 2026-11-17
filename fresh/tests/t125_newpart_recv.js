/* a part made inside an order is only on the order until it is received; then it joins the stock list with the received quantity */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));
 await p.evaluate(cat=>{DB.parts=cat.parts;DB.pcats=['Engine oil','Oil filters','Gearbox oil','Gearbox filters','Differential oil','Coolant','Brake fluid','Additives','Bulbs','Gaskets','Cleaners'];DB.vendors.push({id:'dv1',name:'Rayyan',phone:'78811842',t:now()});save();go('vendors');},cat);await p.waitForTimeout(200);
 const nParts=()=>p.evaluate(()=>DB.parts.length);const has=n=>p.evaluate(n=>DB.parts.some(x=>x.name===n),n);
 const mkDraft=async(name,num)=>{await p.click('#poadd');await p.waitForTimeout(250);await p.click('#sptop');await p.waitForTimeout(300);
   ok(/received/i.test(await p.textContent('#sheet .hint')),'new part from an order says it joins stock when received');ok(!(await p.$('#pst'))&&!(await p.$('#pdel'))&&!(await p.$('#prcv')),'no stock box, no delete, no received-stock in a draft');
   await p.fill('#pn',name);if(num)await p.fill('#pnum',num);await p.selectOption('#pcat','Oil filters');await p.fill('#ppr','6');const co=await p.$('#pco');if(co)await p.fill('#pco','4');await p.click('#pok');await p.waitForTimeout(300);};
 const n0=await nParts();
 /* 1 make a new part in an order: it is not in the stock list */
 const o1=await p.evaluate(()=>{const o=newPo('dv1',[]);go('po',{id:o.id});return o.id;});await p.waitForTimeout(300);
 await mkDraft('Mann Oil Filter HU 7025 z','4011558045876');ok((await nParts())===n0&&!(await has('Mann Oil Filter HU 7025 z')),'not in the stock list yet');
 ok(/Mann Oil Filter HU 7025 z/.test(await p.textContent('#main'))&&/new|جديد/.test(await p.textContent('#main')),'shown on the order, marked new');
 /* 2 edit the draft from the line */
 await p.click('[data-ol="0"] b');await p.waitForTimeout(250);await p.click('#olpt');await p.waitForTimeout(300);await p.fill('#pn','Mann Oil Filter HU 7025 Z (Mercedes)');await p.click('#pok');await p.waitForTimeout(300);
 ok(/HU 7025 Z \(Mercedes\)/.test(await p.textContent('#main'))&&(await nParts())===n0,'edited on the order, still not in stock');
 /* 3 back → don't save → gone */
 await p.evaluate(()=>back());await p.waitForTimeout(250);await p.click('#plno');await p.waitForTimeout(300);ok((await nParts())===n0&&!(await p.evaluate(id=>{const o=byId('pos',id);return o&&o.items.length;},o1)),"don't save: the new part is gone");
 /* 4 make it again, remove the line → gone */
 const o2=await p.evaluate(()=>{const o=newPo('dv1',[]);go('po',{id:o.id});return o.id;});await p.waitForTimeout(300);await mkDraft('Draft Two F2');
 await p.click('[data-ol="0"] b');await p.waitForTimeout(250);await p.click('#oldel');await p.waitForTimeout(250);ok((await nParts())===n0,'removed from the order: not in stock');
 /* 5 receive: joins the stock with the quantity */
 await mkDraft('Mann Oil Filter HU 711/6z','4011558042189');await p.fill('[data-qi="0"]','10');await p.press('[data-qi="0"]','Enter');await p.waitForTimeout(200);
 await p.click('#porec');await p.waitForTimeout(300);if(await p.$('#rcok'))await p.click('#rcok');else await p.click('#cfy');await p.waitForTimeout(400);
 const r5=await p.evaluate(()=>{const x=DB.parts.find(q=>q.name==='Mann Oil Filter HU 711/6z');return x&&{stock:+x.stock,cost:x.cost,cat:x.cat,price:x.price,moves:(DB.moves||[]).filter(m=>m.part===x.id).length};});
 ok(r5&&r5.stock===10&&r5.cost===4&&r5.cat==='Oil filters'&&r5.price===6&&r5.moves===1,'received: in stock with 10, cost and price kept '+JSON.stringify(r5));
 ok(await p.evaluate(id=>{const i=byId('pos',id).items[0];return !i.np&&!!byId('parts',i.part);},o2),'order line now points to the real part');
 /* 6 partial: receive 1 of 3, then the rest — one part, stock 3 */
 const o3=await p.evaluate(()=>{const o=newPo('dv1',[]);go('po',{id:o.id});return o.id;});await p.waitForTimeout(300);await mkDraft('Partial Filter P3');await p.fill('[data-qi="0"]','3');await p.press('[data-qi="0"]','Enter');await p.waitForTimeout(200);
 await p.click('#porec');await p.waitForTimeout(300);if(await p.$('[data-rq="0"]')){await p.fill('[data-rq="0"]','1');await p.click('#rcok');await p.waitForTimeout(300);await p.click('#porec');await p.waitForTimeout(300);await p.click('#rcok');await p.waitForTimeout(300);
   ok(await p.evaluate(()=>{const L=DB.parts.filter(q=>q.name==='Partial Filter P3');return L.length===1&&+L[0].stock===3;}),'partial then rest: one part, stock 3');}
 /* 7 same new part on two orders → one part after both received */
 const two=await p.evaluate(()=>{const mk=()=>{const np={id:uid('p'),name:'Twin Filter TW',num:'TW-1',cat:'Oil filters',unit:'pc',price:5,cost:3,stock:0};return newPo('dv1',[{part:np.id,np,q:2,cost:3}]);};return [mk().id,mk().id];});
 for(const id of two){await p.evaluate(id=>go('po',{id}),id);await p.waitForTimeout(250);await p.click('#porec');await p.waitForTimeout(250);if(await p.$('#rcok'))await p.click('#rcok');else await p.click('#cfy');await p.waitForTimeout(300);}
 ok(await p.evaluate(()=>{const L=DB.parts.filter(q=>q.num==='TW-1');return L.length===1&&+L[0].stock===4;}),'drafted twice, received twice: one part with 4');
 /* 8 the supplier message has the new part */
 const o4=await p.evaluate(()=>{const o=newPo('dv1',[]);go('po',{id:o.id});return o.id;});await p.waitForTimeout(300);await mkDraft('Message Filter M1','M1-99');
 const txt=await p.evaluate(()=>{let t='';window.shareText=(ph,m)=>{t=m;};document.querySelector('#pomsg').click();return t;});ok(/Message Filter M1/.test(txt),'supplier message lists the new part');
 /* 9 a job card cannot pick the draft */
 ok(await p.evaluate(()=>!DB.parts.some(x=>x.name==='Message Filter M1')),'draft not offered anywhere else (not in the parts list)');
 /* 10 new part with the name of a real part → use the real one */
 await p.click('#poadd');await p.waitForTimeout(250);await p.click('#sptop');await p.waitForTimeout(300);await p.fill('#pn','Mann Oil Filter HU 711/6z');await p.selectOption('#pcat','Oil filters');await p.click('#pok');await p.waitForTimeout(300);ok(await p.$('#pdu'),'name of an existing part → use the existing one');
 ok(!errs.length,'no page errors '+errs.join('|'));console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
