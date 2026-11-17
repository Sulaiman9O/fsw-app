/* every long drop-down opens a searchable list (also inside a sheet, without losing the sheet); long sheet lists get a search box */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:868},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/raw.githubusercontent.com/**',r=>r.abort());await p.goto('http://localhost:8811/');await p.waitForTimeout(900);
 const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().tap();await p.waitForTimeout(40);}};const R=[];const ok=(c,m)=>{R.push(!!c);console.log((c?'PASS ':'FAIL ')+m);};
 await p.fill('#obn','FSW');await p.locator('.btn').first().tap();await p.locator('input.field').first().fill('S');await p.locator('.btn').first().tap();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
 const cat=JSON.parse(fs.readFileSync('/mnt/user-data/outputs/shopflo-services-parts.json'));
 await p.evaluate(cat=>{DB.parts=cat.parts;for(let i=0;i<12;i++)DB.vendors.push({id:'dv'+i,name:'Vendor '+i+(i==5?' German':''),t:now()});save();},cat);
 /* part sheet → More details → add an alternative (select with hundreds of parts) */
 await p.evaluate(()=>partSheet(DB.parts.find(x=>/A2701800109/.test(x.name))));await p.waitForTimeout(400);await p.evaluate(()=>{document.querySelector('.pmore').open=true;});await p.waitForTimeout(200);
 await p.tap('#paltadd');await p.waitForTimeout(300);ok(await p.$('#spov'),'alternative drop-down opens a search list');ok(await p.$('#sheet'),'part sheet is still there underneath');
 await p.fill('#spovq','a0001802609');await p.waitForTimeout(150);const n=(await p.$$('#spovl [data-si]')).length;ok(n===1,'search by number finds 1 ('+n+')');
 await p.tap('#spovl [data-si]');await p.waitForTimeout(300);ok(!(await p.$('#spov')),'list closes after picking');
 ok(await p.evaluate(()=>/A0001802609/.test(document.querySelector('#palt').textContent)),'alternative added in the sheet');
 /* supplier price drop-down */
 await p.tap('#pvv');await p.waitForTimeout(300);await p.fill('#spovq','germ');await p.waitForTimeout(150);await p.tap('#spovl [data-si]');await p.waitForTimeout(200);ok(await p.evaluate(()=>document.querySelector('#pvv').value)==='dv5','supplier picked by search');
 /* back closes only the list */
 await p.tap('#pvv');await p.waitForTimeout(300);await p.evaluate(()=>back());await p.waitForTimeout(200);ok(!(await p.$('#spov'))&&await p.$('#sheet'),'back closes the list, sheet stays');
 /* Arabic letters: أ/ا */
 await p.tap('#paltadd');await p.waitForTimeout(300);ok(await p.$('#spovq'),'reopens');await p.evaluate(()=>closeSelSearch());
 await p.click('#pok');await p.waitForTimeout(300);ok(await p.evaluate(()=>DB.parts.find(x=>/A2701800109/.test(x.name)).alts.length>0),'saved with the alternative');
 /* a short drop-down stays normal */
 await p.evaluate(()=>{openSheet('<h3>t</h3><select class="field" id="sh"><option>a</option><option>b</option></select>');});await p.waitForTimeout(200);await p.tap('#sh').catch(()=>{});await p.waitForTimeout(200);ok(!(await p.$('#spov')),'short drop-down unchanged');await p.evaluate(()=>closeSheet());
 /* long list in a sheet with no box gets a search box */
 await p.evaluate(()=>pickSheet('Pick',Array.from({length:20},(_,i)=>'Item '+i+(i==7?' special':'')),()=>{}));await p.waitForTimeout(300);ok(await p.$('#sheet .srchbox'),'long list gets a search box');
 await p.fill('#sheet .srchbox','special');await p.waitForTimeout(100);ok(await p.evaluate(()=>[...document.querySelectorAll('#sheet [data-pk]')].filter(r=>r.style.display!=='none').length)===1,'filters the rows');
 await p.evaluate(()=>back());await p.waitForTimeout(200);ok(!(await p.$('#sheet')),'typing in search does not trigger the save question');
 /* a long screen list (activity log) gets a search box that survives a redraw */
 await p.evaluate(()=>{for(let i=0;i<30;i++)audit('test','Row '+i+(i==9?' needle':''));save();go('audit');});await p.waitForTimeout(400);ok(await p.$('#main .pgsrch'),'activity log has a search box');
 await p.fill('#main .pgsrch','needle');await p.waitForTimeout(150);await p.evaluate(()=>render());await p.waitForTimeout(200);ok((await p.inputValue('#main .pgsrch'))==='needle','search words stay after redraw');
 await p.evaluate(()=>go('more'));await p.waitForTimeout(300);ok(!(await p.$('#main .pgsrch')),'More menu has no extra search box');
 ok(!errs.length,'no page errors '+errs.join('|'));console.log(R.every(x=>x)?'ALL PASS':'SOME FAIL');await b.close();})();
