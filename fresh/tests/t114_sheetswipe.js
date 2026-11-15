/* real finger swipe (touch) on horizontal rows inside a sheet: parts categories in "Add to job" must scroll sideways */
const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['Pixel 7']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
await p.goto('http://localhost:8811/');await p.waitForTimeout(800);await p.fill('#obn','FSW');await p.locator('.btn').first().tap();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().tap();
const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().tap();await p.waitForTimeout(40);}};await key('1234');await key('1234');await p.waitForTimeout(900);await p.tap('#nwdemo').catch(()=>{});await p.tap('#nwl').catch(()=>{});
await p.evaluate(()=>{try{langSet('ar');}catch(e){}for(let i=0;i<8;i++)DB.parts.push({id:'px'+i,name:'Part '+i,num:'x'+i,cat:['Engine oil','Oil filters','Gearbox oil','Coolant','Brake fluid','Bulbs','Cleaners','Additives'][i],unit:'pc',price:1,cost:1,stock:1});save();const j=DB.jobs.find(j=>!isInvoiced(j));go('job',{id:j.id});});await p.waitForTimeout(500);
await p.locator('#jadd').tap();await p.waitForTimeout(600);
/* headless Chrome here cannot replay a finger swipe, so check what decides it: every sideways row (and what is inside it)
   must allow sideways panning (touch-action with pan-x or auto); "pan-y" alone blocks a finger that starts on a button */
const bad=await p.evaluate(()=>{const out=[];[...document.querySelectorAll('#sheet *')].filter(e=>{const s=getComputedStyle(e);return /(auto|scroll)/.test(s.overflowX)&&e.scrollWidth>e.clientWidth+4;}).forEach(row=>{
  [row,...row.querySelectorAll('*')].forEach(e=>{const t=getComputedStyle(e).touchAction;if(!/auto|pan-x|manipulation/.test(t))out.push((row.className||row.id)+' > '+e.tagName+' '+t);});});return {rows:[...document.querySelectorAll('#sheet .atabs')].length,out:[...new Set(out)].slice(0,8)};});
console.log(JSON.stringify(bad));ok(bad.rows>0,'rows found in Add sheet');ok(!bad.out.length,'every sideways row lets a finger pan sideways');
await p.screenshot({path:'/tmp/claude-0/-home-claude/f4d7ebf3-778c-5d50-a163-5dcd8e8292ed/scratchpad/swipe.png'});
console.log('errors',JSON.stringify(errs));ok(!errs.length,'no page errors');console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
