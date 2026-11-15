/* back undoes the open mode first (selection, long-press strip, sheet), then goes to the screen before; full storage does not lose the sync "last sent" copy */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
await p.goto('http://localhost:8811/');await p.waitForTimeout(700);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();
const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwdemo').catch(()=>{});await p.click('#nwl').catch(()=>{});
const st=()=>p.evaluate(()=>({r:S.r,sel:!!S.selJ,qs:!!document.getElementById('qs'),sheet:!!document.getElementById('sheet')}));
const jid=await p.evaluate(()=>{go('home');const j=DB.jobs.find(j=>!isInvoiced(j)&&j.items.length>1);go('job',{id:j.id});return j.id;});await p.waitForTimeout(300);
await p.evaluate(id=>{const j=byId('jobs',id);S.selJ={id:j.id,set:new Set([0])};render();},jid);await p.waitForTimeout(200);
await p.evaluate(()=>back());await p.waitForTimeout(200);let s=await st();ok(s.r==='job'&&!s.sel,'1. back in selection: selection off, still on the job '+JSON.stringify(s));
await p.evaluate(()=>back());await p.waitForTimeout(200);s=await st();ok(s.r==='home','2. next back: the screen before (home) '+s.r);
await p.evaluate(id=>{go('work');go('job',{id});},jid);await p.waitForTimeout(200);
const r=p.locator('[data-it="0"] b').first();const bb=await r.boundingBox();await p.mouse.move(bb.x+10,bb.y+5);await p.mouse.down();await p.waitForTimeout(700);await p.mouse.up();await p.waitForTimeout(300);
s=await st();ok(s.qs,'3. long-press strip open');await p.evaluate(()=>back());await p.waitForTimeout(200);s=await st();ok(!s.qs&&s.r==='job','4. back closes the strip, stays on job');
await p.evaluate(id=>itemMenu(byId('jobs',id),0),jid);await p.waitForTimeout(200);await p.evaluate(()=>back());s=await st();ok(!s.sheet&&s.r==='job','5. back closes the sheet, stays on job');
await p.evaluate(()=>back());await p.waitForTimeout(200);s=await st();ok(s.r==='work','6. then back to Work (where it came from) '+s.r);
await p.evaluate(()=>{go('stock');selStart('parts',DB.parts[0].id);});await p.waitForTimeout(200);await p.evaluate(()=>back());s=await p.evaluate(()=>({r:S.r,sel:!!S.sel}));ok(s.r==='stock'&&!s.sel,'7. stock list selection: back clears it');
/* storage full */
const f=await p.evaluate(()=>{try{localStorage.removeItem('ws_sync_last');}catch(e){}let big='x'.repeat(1024*256);TRAIL.buf=[];let i=0;try{for(;i<400;i++){TRAIL.buf.push([0,'t',big,'','']);localStorage.setItem('ws_trail',JSON.stringify(TRAIL.buf));}}catch(e){}
  let pad='';try{for(let k=0;k<200000;k++){pad+='y'.repeat(4096);localStorage.setItem('ws_fill',pad);}}catch(e){}SYNC.last={kv:new Map([['ws','{}']]),rec:new Map(Array.from({length:3000},(_,k)=>['jobs\u0001id'+k,'v'+k]))};return Promise.resolve(syncSaveLast()).then(async()=>({kept:!!(await metaGet('sync_last')),loaded:(await syncLoadLast())!==null,trailN:TRAIL.buf.length,cleanup:(localStorage.removeItem('ws_fill'),1),note:TRAIL.q.filter(x=>/last-sent/.test(x[2])).map(x=>x[2])}));});
console.log(JSON.stringify(f));ok(f.kept&&f.loaded,'8. full storage: last-sent copy kept (IndexedDB) and read back');
console.log('errors',JSON.stringify(errs));ok(!errs.length,'no page errors');console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
