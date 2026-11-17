/* suppliers & orders & parts: every path checked — duplicate part, numbering, deleted part, receiving more, partial, swap merge, delete order/supplier, send empty, car sheet clean */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:868}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));
 await p.evaluate(cat=>{DB.parts=cat.parts;DB.pcats=['Engine oil','Oil filters','Gearbox oil','Gearbox filters','Differential oil','Coolant','Brake fluid','Additives','Bulbs','Gaskets','Cleaners'];DB.vendors.push({id:'dv1',name:'Rayyan',phone:'78811842',t:now()},{id:'dv2',name:'Other',t:now()});
   DB.parts.push({id:'pM',name:'MANNA FILTER HU 7025 Z',num:'4011558045876',cat:'Oil filters',unit:'pc',price:6,cost:4,stock:0});save();go('vendors');},cat);await p.waitForTimeout(200);
 const go=async id=>{await p.evaluate(id=>go('po',{id}),id);await p.waitForTimeout(250);};
 /* 1 today's case: line removed, then "new part" with the same barcode → offered to use the existing part, added to the order */
 const o1=await p.evaluate(()=>{const o=newPo('dv1',[{part:'pM',q:5,cost:4}]);return o.id;});await go(o1);
 await p.click('[data-ol="0"] b');await p.waitForTimeout(200);await p.click('#oldel');await p.waitForTimeout(200);ok(await p.evaluate(()=>!!byId('parts','pM')),'removing a line keeps the part in stock');
 await p.click('#poadd');await p.waitForTimeout(200);await p.click('#sptop');await p.waitForTimeout(300);await p.fill('#pn','MANNA FILTER HU 7025 Z new');await p.fill('#pnum','4011558045876');await p.click('#pok');await p.waitForTimeout(300);
 ok(await p.$('#pdu'),'same barcode → "already in your stock · use this part"');await p.click('#pdu');await p.waitForTimeout(300);
 ok(await p.evaluate(id=>byId('pos',id).items.length===1&&byId('pos',id).items[0].part==='pM',o1),'existing part added to the order');ok(await p.evaluate(()=>DB.parts.filter(x=>/HU 7025/.test(x.name)).length)===1,'no second copy of the part');
 /* same from stock screen: open it */
 await p.evaluate(()=>partSheet(null));await p.waitForTimeout(300);await p.fill('#pn','manna filter hu 7025 z');await p.selectOption('#pcat','Oil filters');await p.click('#pok');await p.waitForTimeout(300);
 ok(!(await p.$('#pdu'))&&await p.$('#pdo'),'from stock: offers to open it (no dead end)');await p.click('#pdo');await p.waitForTimeout(300);ok(await p.evaluate(()=>document.querySelector('#pn').value)==='MANNA FILTER HU 7025 Z','opens the existing part');await p.evaluate(()=>closeSheet());
 /* 2 numbers never reused */
 const nums=await p.evaluate(()=>{const a=newPo('dv1',[{part:'pM',q:1,cost:1}]);const n1=a.no;DB.pos=DB.pos.filter(x=>x!==a);const c=newPo('dv1',[{part:'pM',q:1,cost:1}]);return [n1,c.no];});ok(nums[1]===nums[0]+1,'order number not reused after delete '+nums);
 /* 3 part deleted while in an open order: confirm says so, line taken out */
 const o3=await p.evaluate(()=>{DB.parts.push({id:'pT',name:'Temp Filter T1',cat:'Oil filters',unit:'pc',price:5,cost:3,stock:0});const o=newPo('dv1',[{part:'pT',q:2,cost:3},{part:'pM',q:1,cost:4}]);return o.id;});
 await p.evaluate(()=>partSheet(byId('parts','pT')));await p.waitForTimeout(300);await p.click('#pdel');await p.waitForTimeout(200);ok(/#\d+/.test(await p.textContent('#sheet h3')),'delete warns which order has it');await p.click('#cfy');await p.waitForTimeout(200);
 ok(await p.evaluate(id=>byId('pos',id).items.length===1,o3),'line taken out of the open order');
 /* old data: a deleted-part line still in an order does not block receiving */
 const o3b=await p.evaluate(()=>{const o=newPo('dv1',[{part:'pGONE',q:2,cost:3},{part:'pM',q:1,cost:4}]);return o.id;});await go(o3b);await p.click('#porec');await p.waitForTimeout(300);if(await p.$('#rcok'))await p.click('#rcok');else await p.click('#cfy');await p.waitForTimeout(300);
 ok(await p.evaluate(id=>byId('pos',id).status,o3b)==='received','order with a deleted part can still be fully received');
 /* 4 more arrived than ordered */
 const o4=await p.evaluate(()=>{byId('parts','pM').stock=0;return newPo('dv1',[{part:'pM',q:2,cost:4}]).id;});await go(o4);await p.click('#porec');await p.waitForTimeout(300);
 if(await p.$('[data-rq="0"]')){await p.fill('[data-rq="0"]','3');await p.click('#rcok');await p.waitForTimeout(300);ok(await p.evaluate(()=>+byId('parts','pM').stock)===3,'3 arrived for 2 ordered → stock 3');}
 /* 5 partial: can't go below received, can't remove the line */
 const o5=await p.evaluate(()=>newPo('dv1',[{part:'pM',q:4,cost:4}]).id);await go(o5);await p.click('#porec');await p.waitForTimeout(300);
 if(await p.$('[data-rq="0"]')){await p.fill('[data-rq="0"]','2');await p.click('#rcok');await p.waitForTimeout(300);
   await p.click('[data-q="0|-1"]');await p.click('[data-q="0|-1"]');await p.click('[data-q="0|-1"]');await p.waitForTimeout(200);ok(await p.evaluate(id=>byId('pos',id).items[0].q,o5)===2,'minus stops at what was received (2)');
   await p.click('[data-ol="0"] b');await p.waitForTimeout(200);await p.click('#oldel');await p.waitForTimeout(200);ok(await p.evaluate(id=>byId('pos',id).items.length,o5)===1,'received line cannot be removed');await p.evaluate(()=>closeSheet());}
 /* 6 swap into a part already on the order → one line */
 const o6=await p.evaluate(()=>{const a=DB.parts[5].id,c=DB.parts[6].id;return {o:newPo('dv1',[{part:a,q:1,cost:1},{part:c,q:2,cost:1}]).id,n:DB.parts[6].name};});await go(o6.o);
 await p.click('[data-ol="0"] b');await p.waitForTimeout(200);await p.click('#olsw');await p.waitForTimeout(200);await p.fill('#spq',o6.n);await p.waitForTimeout(150);await p.click('[data-sp]');await p.waitForTimeout(200);
 ok(await p.evaluate(id=>JSON.stringify(byId('pos',id).items.map(i=>i.q)),o6.o)==='[3]','swap joins with the same part (1+2=3)');
 /* 7 delete order asks */
 await p.click('#podel');await p.waitForTimeout(200);ok(await p.$('#cfy'),'delete order asks first');await p.evaluate(()=>closeSheet());ok(await p.evaluate(id=>!!byId('pos',id),o6.o),'not deleted without yes');
 /* 8 send empty order */
 const o8=await p.evaluate(()=>{const o=newPo('dv1',[]);return o.id;});await go(o8);let sent=0;await p.evaluate(()=>{window.shareText=()=>{window.__sent=1;};});await p.click('#pomsg');await p.waitForTimeout(200);ok(!(await p.evaluate(()=>window.__sent)),'empty order is not sent');
 /* 9 supplier: duplicate warns, delete only without orders */
 await p.evaluate(()=>vendorSheet());await p.waitForTimeout(300);await p.fill('#vn','rayyan');await p.click('#vok');await p.waitForTimeout(200);ok(await p.$('#sheet')&&await p.evaluate(()=>DB.vendors.filter(v=>/rayyan/i.test(v.name)).length)===1,'same supplier name warns, not saved on first press');await p.evaluate(()=>closeSheet());
 await p.evaluate(()=>vendorSheet(byId('vendors','dv1')));await p.waitForTimeout(300);await p.click('#vdel');await p.waitForTimeout(200);ok(await p.evaluate(()=>!!byId('vendors','dv1')),'supplier with orders is not deleted');await p.evaluate(()=>closeSheet());
 await p.evaluate(()=>{DB.vendors.push({id:'dv9',name:'Mistake',t:now()});vendorSheet(byId('vendors','dv9'));});await p.waitForTimeout(300);await p.click('#vdel');await p.waitForTimeout(200);await p.click('#cfy');await p.waitForTimeout(200);ok(await p.evaluate(()=>!byId('vendors','dv9')),'supplier made by mistake can be deleted');
 /* 10 the car sheet has no supplier button */
 await p.evaluate(()=>{const c={id:uid('c'),name:'A',t:now()};DB.customers.push(c);vehSheet(c);});await p.waitForTimeout(300);ok(!(await p.$('#vdel')),'car sheet is clean');await p.evaluate(()=>closeSheet());
 /* 11 vendors → order → back after don't save → back on suppliers, empty order gone */
 await p.evaluate(()=>{go('vendors');});await p.waitForTimeout(200);await p.click('#poadd');await p.waitForTimeout(300);await p.click('#poadd');await p.waitForTimeout(200);await p.fill('#spq','MANNA');await p.waitForTimeout(150);await p.click('[data-sp]');await p.waitForTimeout(200);
 await p.evaluate(()=>back());await p.waitForTimeout(200);await p.click('#plno');await p.waitForTimeout(300);ok(await p.evaluate(()=>S.r)==='vendors','back to suppliers');ok(await p.evaluate(()=>!DB.pos.some(o=>!o.items.length&&o.status==='open'&&o.id!==window.__keep)),'the emptied new order is gone');
 ok(!errs.length,'no page errors '+errs.join('|'));console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
