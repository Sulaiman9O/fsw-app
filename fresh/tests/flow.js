const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(30);}};
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
await p.goto('http://localhost:8811/');await p.waitForTimeout(800);await p.click('#oblang [data-l="ar"]');
await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('Sulaiman');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
await p.evaluate(()=>go('settings'));await p.waitForTimeout(300);await p.click('#scat');await p.setInputFiles('#cf','/mnt/user-data/outputs/shopflo-services-parts.json');await p.waitForTimeout(600);await p.click('#cfok');await p.waitForTimeout(800);
await p.evaluate(()=>go('settings'));await p.waitForTimeout(300);await p.click('#scust');await p.setInputFiles('#ccf','/mnt/user-data/uploads/Downloads/shopflo-customers-v2.json');await p.waitForTimeout(800);await p.click('#ccok');await p.waitForTimeout(1500);
// new job through UI for existing camry by plate
await p.evaluate(()=>go('newjob'));await p.waitForTimeout(300);
const plate=await p.evaluate(()=>{const v=DB.vehicles.find(v=>/camry/i.test(v.model)&&v.plate&&/2AR/.test(effEng(v))&&!openJobs().some(j=>j.veh===v.id));return v.plate;});
await p.fill('#nplate',plate);await p.waitForTimeout(300);await p.locator('[data-pvf]').first().click();await p.waitForTimeout(300);await p.click('#ngo');await p.waitForTimeout(500);
const jid=await p.evaluate(()=>S.p.id);ok(!!jid,'job opened '+jid);
const stock0=await p.evaluate(()=>JSON.stringify(DB.parts.map(x=>[x.id,x.stock])));
await p.click('#jadd');await p.waitForTimeout(300);await p.fill('#aq','oil change');await p.waitForTimeout(300);await p.locator('[data-sv]').first().click();await p.waitForTimeout(500);
const items=await p.evaluate(id=>byId('jobs',id).items.map(i=>[i.k,i.d,i.q,i.p]),jid);ok(items.length===3,'oil recipe items '+JSON.stringify(items));
// stages
await p.click('#jnext');await p.waitForTimeout(300);await p.locator('[data-eta]').first().click();await p.waitForTimeout(300);
const st1=await p.evaluate(id=>byId('jobs',id).stage,jid);ok(st1==='work','stage work: '+st1);
await p.evaluate(id=>{makeInvoice(byId('jobs',id));},jid);await p.waitForTimeout(300);await p.click('#cfy');await p.waitForTimeout(500);
const inv=await p.evaluate(id=>{const j=byId('jobs',id);return {inv:j.inv,stage:j.stage,T:jobTotals(j)};},jid);ok(inv.inv&&inv.inv.no>=1001,'invoice '+JSON.stringify(inv.inv)+' stage '+inv.stage+' total '+inv.T.total);
const moved=await p.evaluate(([id,s0])=>{const before=new Map(JSON.parse(s0));const j=byId('jobs',id);return j.items.filter(i=>i.k==='part').map(i=>{const pp=byId('parts',i.ref);return [pp.name,before.get(pp.id),pp.stock,i.q];});},[jid,stock0]);ok(moved.every(m=>Math.abs((m[1]-m[3])-m[2])<1e-9),'stock deducted '+JSON.stringify(moved));
// partial payment
await p.evaluate(()=>{});const payBtn=p.locator('[data-pay]').first();await payBtn.click();await p.waitForTimeout(400);await p.screenshot({path:'F1.png'});
const sheetTxt=await p.evaluate(()=>document.querySelector('#sheet')?document.querySelector('#sheet').innerText.slice(0,300):'nosheet');console.log('pay sheet:',sheetTxt.replace(/\n/g,' | '));
await p.fill('#pam','5');await p.click('#pok');await p.waitForTimeout(300);
let T=await p.evaluate(id=>jobTotals(byId('jobs',id)),jid);ok(Math.abs(T.due-(T.total-5))<0.001,'partial pay due '+T.due);const TOT=T.total;
await p.locator('[data-pay]').first().click();await p.waitForTimeout(300);await p.click('#pok');await p.waitForTimeout(300);
T=await p.evaluate(id=>jobTotals(byId('jobs',id)),jid);ok(T.due<0.0005,'paid full due '+T.due);
await p.evaluate(id=>go('job',{id}),jid);await p.waitForTimeout(300);await p.click('#jnext').catch(()=>{});await p.waitForTimeout(300);
const st=await p.evaluate(id=>{const j=byId('jobs',id);return j.stage+' rem:'+DB.reminders.filter(r=>r.job===id).map(r=>r.kind+'@'+new Date(r.due).toISOString().slice(0,10)+'/'+r.dueKm).join(',');},jid);ok(/done/.test(st)&&/oil/.test(st),'done + reminder: '+st);
const ckc=await p.evaluate(id=>jobChecks(byId('jobs',id)).map(c=>c[1]),jid);ok(ckc.length===0,'no checks on clean job '+JSON.stringify(ckc));
// money today
const td=await p.evaluate(()=>JSON.stringify(sumRange(rangeOf('today'))));console.log('today',td);
// return invoice
await p.evaluate(id=>go('inv',{id}),jid);await p.waitForTimeout(300);await p.click('#iret');await p.waitForTimeout(200);await p.click('#cfy');await p.waitForTimeout(300);
const back=await p.evaluate(id=>{const j=byId('jobs',id);return j.items.filter(i=>i.k==='part').map(i=>byId('parts',i.ref).stock).join(',')+' pays:'+j.pays.length;},jid);console.log('after return stock',back);
const td2=await p.evaluate(()=>JSON.stringify(sumRange(rangeOf('today'))));console.log('today after return',td2);
const pays=await p.evaluate(id=>JSON.stringify(byId('jobs',id).pays.map(x=>[x.m,x.amt,!!x.refund])),jid);ok(pays.includes(String(-Math.round(TOT*1000)/1000)),'refund recorded '+pays);
ok(JSON.parse(td2).paid<0.001,'today net paid 0 after refund');
// re-invoice after return
await p.evaluate(id=>go('job',{id}),jid);await p.waitForTimeout(300);const hasInv=await p.evaluate(()=>!!document.querySelector('#jinv'));ok(hasInv,'can invoice again after return');
await p.evaluate(id=>makeInvoice(byId('jobs',id)),jid);await p.waitForTimeout(200);await p.click('#cfy');await p.waitForTimeout(300);
let J=await p.evaluate(id=>{const j=byId('jobs',id);return {ret:!!j.returned,inv:j.inv.no,due:jobTotals(j).due};},jid);ok(!J.ret&&J.inv===1002,'re-invoiced '+JSON.stringify(J));
// credit
await p.locator('[data-pay="Credit"]').click();await p.waitForTimeout(300);
J=await p.evaluate(id=>{const j=byId('jobs',id);return {due:jobTotals(j).due,credit:!!j.credit,inDebts:custDebt(j.cust).due};},jid);ok(J.due>13&&J.credit&&J.inDebts>13,'credit keeps debt '+JSON.stringify(J));
// arabic digits
ok(await p.evaluate(()=>num('٥٫٥')===5.5&&num('۱۲')===12&&num('1,250.5')===1250.5),'num arabic digits');
// daily close with cash expense
await p.evaluate(()=>{DB.expenses.push({id:'e1',t:now(),amt:2,cat:'Other',cash:true});save();go('close');});await p.waitForTimeout(300);
const cl=await p.evaluate(()=>document.querySelector('#root').innerText.match(/[\d.]+/g).slice(0,8).join(' '));console.log('close screen numbers',cl);
console.log('errors',errs);await b.close();})();
