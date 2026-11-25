/* 2.43.0 slips guard (UX audit 25 Nov): a double tap never lands on what opened under the finger; action buttons run once;
   New car in keeps what was typed; the short message does not eat taps; «Add X as a service/part»; item checks; Undo «Car is ready». */
const {chromium}=require('playwright');const PORT=process.env.PORT||8811;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();
 const open=async(w,h)=>{const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true});await ctx.addInitScript(()=>{window.__GUARD_ON=1;});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.route('**/raw.githubusercontent.com/**',r=>r.abort());const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(50);}};
  await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(900);await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.waitForTimeout(450);await p.locator('input.field').first().fill('S');await p.locator('.btn').first().click();await p.waitForTimeout(450);await key('1234');await p.waitForTimeout(450);await key('1234');await p.waitForTimeout(900);
  await p.click('#nwdemo');await p.waitForTimeout(500);await p.click('#nwl').catch(()=>{});await p.waitForTimeout(500);await p.evaluate(()=>{document.querySelectorAll('#tour').forEach(x=>x.remove());DB.ws.motionOff=1;save();});
  return {p,errs,ev:(f,a)=>p.evaluate(f,a),W:t=>p.waitForTimeout(t),ctx};};
 const dbl=async(p,sel,gap)=>{const r=await p.locator(sel).first().boundingBox();const x=r.x+r.width/2,y=r.y+r.height/2;await p.mouse.click(x,y);await p.waitForTimeout(gap);await p.mouse.click(x,y);await p.waitForTimeout(500);};
 for(const [w,h] of [[360,640],[400,868],[800,1280]]){const {p,ev,W,errs,ctx}=await open(w,h);
  ok(await ev(()=>!!S.user&&S.r==='home'),`${w}x${h}: quick PIN typing still logs in`);
  const jid=await ev(()=>DB.jobs.find(j=>!j.inv&&j.stage==='work').id);
  for(const gap of [60,200,330]){await ev(id=>{closeSheet();go('job',{id});},jid);await W(500);const n0=await ev(()=>DB.ws.nextInv);await p.locator('#jpay').scrollIntoViewIfNeeded();await dbl(p,'#jpay',gap);
   ok(await ev(n0=>DB.ws.nextInv===n0&&!!document.getElementById('sheet')&&!DB.jobs.find(j=>j.id===S.p.id).inv,n0),`${w}x${h}: double tap on Invoice & pay (${gap}ms) makes no invoice, sheet stays`);}
  await ev(()=>closeSheet());await W(450);
  if(w===400){
   /* a single tap after the guard time still works */
   await p.click('#jpay');await W(500);ok(await ev(()=>!!document.getElementById('sheet')),'pay sheet opens with one tap');await ev(()=>closeSheet());await W(400);
   /* New job stage: double tap on Start work keeps the time sheet open */
   const nj=await ev(()=>{const j=DB.jobs.find(j=>j.stage==='new');if(j){go('job',{id:j.id});return j.id;}return null;});
   if(nj){await W(500);await dbl(p,'#jnext',120);ok(await ev(()=>!!document.getElementById('sheet')&&/How long/.test(document.querySelector('#sheet h3').textContent)),'double tap on Start work: the sheet stays open');await ev(()=>closeSheet());}else ok(true,'(no job in New stage in demo data)');
   /* Home: double tap on a car opens the job and nothing inside it */
   await ev(()=>go('home'));await W(500);await dbl(p,'#main .list .car',150);ok(await ev(()=>S.r==='job'&&!document.getElementById('sheet')),'double tap on a car on Home: job opens, no sheet opens inside');
   /* action buttons run once */
   await ev(id=>go('job',{id}),jid);await W(450);
   const r1=await ev(()=>{const j=DB.jobs.find(j=>j.inv&&!j.inv.void&&jobDue(j)>3);if(!j)return null;go('job',{id:j.id});jobPaySheet(j);return {id:j.id,n:(j.pays||[]).length};});await W(500);
   if(r1&&await ev(()=>!!document.querySelector('#sheet #jpa'))){await ev(()=>{document.querySelector('#jpa').value='1';const k=document.querySelector('#jpok');k.click();k.click();k.click();});await W(400);ok(await ev(r=>(DB.jobs.find(j=>j.id===r.id).pays||[]).length===r.n+1,r1),'Save payment clicked 3 times saves one payment');
    await ev(r=>{closeSheet();jobPaySheet(DB.jobs.find(j=>j.id===r.id));},r1);await W(500);
    await ev(()=>{document.querySelector('#jpa').value='1,5';document.querySelector('#jpok').click();});await W(400);ok(await ev(r=>{const ps=DB.jobs.find(j=>j.id===r.id).pays;return Math.abs(ps[ps.length-1].amt-1.5)<1e-9;},r1),'«1,5» in the amount is 1.500');}
   else ok(false,'pay sheet with #jpa not found');
   await ev(()=>closeSheet());await W(300);
   ok(await ev(()=>{window.__n=0;confirmSheet('Sure?','Yes',()=>{window.__n++;});const k=document.querySelector('#cfy');k.click();k.click();k.click();return window.__n===1;}),'a confirm runs its action once for 3 clicks');
   ok(await ev(()=>numDec('5,5')===5.5&&numDec('5,500')===5.5&&numDec('1,234.5')===1234.5&&numDec('٥٫٥')===5.5&&numDec('12')===12),'numDec: comma is a decimal mark only without a dot');
   /* the short message lets taps through and sits above the pay bar */
   const j2=await ev(id=>{go('job',{id});return id;},jid);await W(450);
   const tp=await ev(()=>{toast('Saved');const t=document.getElementById('toast'),pb=document.querySelector('#main .paybar');const a=t.getBoundingClientRect(),c=pb?pb.getBoundingClientRect():null;return {pe:getComputedStyle(t).pointerEvents,over:c?!(a.bottom<=c.top+1||a.top>=c.bottom):false,pb:!!c};});
   ok(tp.pe==='none','the short message does not take taps');ok(!tp.over,'the short message does not cover the pay bar'+(tp.pb?'':' (no pay bar here)'));
   /* add X as a service */
   await W(400);await p.click('#jadd');await W(500);await p.fill('#aq','wheel weld zz');await W(400);const n1=await ev(()=>DB.jobs.find(j=>j.id===S.p.id).items.length);
   ok(await ev(()=>document.querySelectorAll('#sheet [data-addx]').length===2),'empty search offers «Add … as a service / as a part»');
   await ev(()=>document.querySelector('#sheet [data-addx="labour"]').click());await W(500);
   ok(await ev(()=>document.querySelector('#sheet #ed')&&document.querySelector('#sheet #ed').value==='wheel weld zz'),'the item sheet opens with the typed name');
   /* item checks */
   await ev(()=>{document.querySelector('#eq').value='-2';document.querySelector('#ep').value='3';document.querySelector('#eok').click();});await W(950);ok(await ev(()=>!!document.querySelector('#sheet #eok')),'quantity −2 is refused');
   await ev(()=>{document.querySelector('#eq').value='1';document.querySelector('#ep').value='abc';document.querySelector('#eok').click();});await W(950);ok(await ev(()=>!!document.querySelector('#sheet #eok')),'price «abc» is refused');
   await ev(()=>{document.querySelector('#eq').value='1';document.querySelector('#ep').value='-10';document.querySelector('#eok').click();});await W(950);ok(await ev(()=>!!document.querySelector('#sheet #eok')),'price −10 is refused');
   await ev(()=>{document.querySelector('#eq').value='2';document.querySelector('#ep').value='4.5';document.querySelector('#eok').click();});await W(500);
   ok(await ev(n1=>{const j=DB.jobs.find(j=>j.id===S.p.id);const it=j.items[j.items.length-1];return j.items.length===n1+1&&it.d==='wheel weld zz'&&it.k==='labour'&&it.q===2&&it.p===4.5;},n1),'a correct item saves (labour, 2 × 4.500)');
   /* Esc closes a sheet */
   await ev(()=>closeSheet());await W(400);await p.click('#jadd');await W(500);await p.keyboard.press('Escape');await W(400);ok(await ev(()=>!document.getElementById('sheet')&&S.r==='job'),'Esc closes the sheet and stays on the job');
   /* Undo «Car is ready» */
   const wj=await ev(()=>{const j=DB.jobs.find(j=>j.stage==='work'&&!j.inv);if(!j)return null;go('job',{id:j.id});return j.id;});
   if(wj){await W(500);await p.click('#jnext');await W(500);const st1=await ev(id=>DB.jobs.find(j=>j.id===id).stage,wj);await ev(()=>{const u=document.querySelector('#undob button');if(u)u.click();});await W(300);
    ok(st1==='ready'&&await ev(id=>DB.jobs.find(j=>j.id===id).stage==='work',wj),'Car is ready shows Undo, and Undo puts it back to Working');}else ok(true,'(no working job left)');
   /* New car in keeps what was typed */
   await ev(()=>go('newjob'));await W(500);await p.fill('#nphone','99887766');await p.fill('#nplate','7788 B');await W(200);await ev(()=>go('cust'));await W(450);await ev(()=>go('newjob'));await W(500);
   ok(await ev(()=>document.querySelector('#nphone').value==='99887766'&&document.querySelector('#nplate').value==='7788 B'&&!!document.querySelector('#nclr')),'New car in: phone and plate are still there after visiting Customers, with «Clear»');
   await p.reload();await p.waitForTimeout(1200);for(const k of '1234'){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(60);}await W(900);await ev(()=>{document.querySelectorAll('#tour').forEach(x=>x.remove());go('newjob');});await W(500);
   ok(await ev(()=>document.querySelector('#nphone')&&document.querySelector('#nphone').value==='99887766'),'New car in: still there after a reload');
   await W(400);await p.click('#nclr');await W(400);ok(await ev(()=>document.querySelector('#nphone').value===''&&!localStorage.getItem('ws_nj')),'«Clear» empties it');
   await p.fill('#nphone','99000111');await W(100);await ev(()=>{njDraftSet(S.p.n);const j=DB.jobs[0];go('job',{id:j.id});});await W(400);ok(await ev(()=>!localStorage.getItem('ws_nj')&&!S.njDraft),'opening a job from New car in clears the draft');
  }
  ok(errs.length===0,`${w}x${h}: no page errors `+errs.slice(0,2).join(' | ').slice(0,160));await ctx.close();}
 await b.close();})();
