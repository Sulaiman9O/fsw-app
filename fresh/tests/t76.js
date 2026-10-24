const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:868},deviceScaleFactor:2});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(2200);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(40);}};const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
 await p.fill('#obn','FSW');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('Sulaiman Alyazeedi');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 /* a logo with wide white margins, like the real one */
 await p.evaluate(()=>{const c=document.createElement('canvas');c.width=1000;c.height=560;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,1000,560);x.fillStyle='#e02020';x.font='bold 120px Arial';x.fillText('FSW',200,320);x.fillStyle='#111';x.font='bold 60px Arial';x.fillText('Fast Service',520,290);DB.ws.logo=c.toDataURL('image/png');
   DB.users.push({id:uid('u'),name:'sushan',role:'worker',pin:'1111',color:'#2F80FF'});save();S.user=null;render();});await p.waitForTimeout(1500);
 ok(!!(await p.$('.lgbadge img')),'logo in a rounded card');const r=await p.evaluate(()=>{const i=document.querySelector('.lgbadge img');return [i.naturalWidth,i.naturalHeight];});ok(r[0]<1000,'white margins trimmed '+r);
 await p.screenshot({path:'lg1.png'});console.log('errors',errs);await b.close();})();
