const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();await p.route('**/raw.githubusercontent.com/**',r=>r.abort());
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+cur+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+cur+': '+m.text().slice(0,200));});let cur='boot';
const key=async s=>{for(const k of s){await p.locator('.key',{hasText:new RegExp('^'+k+'$')}).first().click();await p.waitForTimeout(30);}};
await p.goto('http://localhost:8811/');await p.waitForTimeout(800);
await p.fill('#obn','Fast Service World');await p.locator('.btn').first().click();await p.locator('input.field').first().fill('Sulaiman');await p.locator('.btn').first().click();await key('1234');await key('1234');await p.waitForTimeout(900);await p.click('#nwl').catch(()=>{});
await p.evaluate(()=>go('settings'));await p.waitForTimeout(300);await p.click('#scat');await p.setInputFiles('#cf','/mnt/user-data/outputs/shopflo-services-parts.json');await p.waitForTimeout(600);await p.click('#cfok');await p.waitForTimeout(800);
await p.evaluate(()=>go('settings'));await p.waitForTimeout(300);await p.click('#scust');await p.setInputFiles('#ccf','/mnt/user-data/uploads/Downloads/shopflo-customers-v2.json');await p.waitForTimeout(800);await p.click('#ccok');await p.waitForTimeout(1500);
// make an open job + po + expense for coverage
await p.evaluate(()=>{const v=DB.vehicles.find(v=>/camry/i.test(v.model));DB.jobs.push({id:'jo1',no:DB.ws.nextJob++,cust:v.cust,veh:v.id,km:100000,stage:'work',items:[],disc:0,t:now(),by:'S',log:[[now(),'x']],pays:[]});save();});
await p.evaluate(()=>{const u={id:'uw',name:'Worker',role:'worker',pin:'x',color:'#333'};DB.users.push(u);S.user=u;save();});const routes=await p.evaluate(()=>Object.keys(SCREENS));
const params=await p.evaluate(()=>({job:{id:DB.jobs.find(j=>j.inv&&j.pays.length).id},job2:{id:'jo1'},custd:{id:DB.customers.find(c=>DB.jobs.some(j=>j.cust===c.id&&jobTotals(j).due>0.01)).id},inv:{id:DB.jobs.find(j=>j.inv).id},part:{id:DB.parts[0].id},po:{id:(DB.pos[0]||{}).id}}));
const names=await p.evaluate(()=>{const s=new Set();DB.customers.forEach(c=>s.add(c.name));DB.parts.forEach(x=>s.add(x.name));DB.services.forEach(x=>{s.add(x.name);});DB.vehicles.forEach(v=>{s.add(carName(v));s.add(v.make);s.add(v.model);});return [...s];});
const nameSet=new Set(names.map(x=>String(x).trim().toLowerCase()));
const report={};
for(const lang of ['ar'])for(const mode of ['light']){
 await p.evaluate(([l,m])=>{DB.ws.lang=l;DB.ws.mode=m;save();lookApply();},[lang,mode]);
 for(const r of routes){const list=r==='job'?[params.job,params.job2]:[params[r]||{}];for(const prm of list){cur=lang+'/'+mode+'/'+r;
  await p.evaluate(([r,prm])=>{try{closeSheet();}catch(e){}go(r,prm);},[r,prm]);await p.waitForTimeout(250);
  const res=await p.evaluate((isAr)=>{const out={over:[],bad:[],latin:[]};const W=innerWidth;
    document.querySelectorAll('#root *').forEach(e=>{const rc=e.getBoundingClientRect();if(rc.width>0&&rc.right>W+2&&getComputedStyle(e).position!=='fixed'&&!e.closest('.hscroll,.chips,.atabs,.cpath,.ygrid,.ktable,table'))out.over.push((e.className||e.tagName)+':'+Math.round(rc.right));});
    const tw=document.createTreeWalker(document.querySelector('#root'),NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){const t=n.nodeValue.trim();if(!t)continue;const el=n.parentElement;if(!el||!el.offsetParent)continue;
      if(/undefined|NaN|\[object|null\b/.test(t))out.bad.push(t.slice(0,80));
      if(isAr&&/[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(t)&&!el.closest('[data-notr],.pl,input,textarea'))out.latin.push(t.slice(0,90));}
    out.over=[...new Set(out.over)].slice(0,5);return out;},lang==='ar');
  report[cur+(prm.id?'#'+String(prm.id).slice(0,6):'')]=res;}}}
fs.writeFileSync('crawl.json',JSON.stringify({report,errs},null,1));
const nm=[...nameSet].filter(x=>x&&x.length>2).sort((a,b)=>b.length-a.length);const lat={};Object.entries(report).forEach(([k,r])=>r.latin.forEach(t=>{let x=t.toLowerCase();for(const n of nm){if(x.includes(n))x=x.split(n).join(' ');}x=x.replace(/[^a-z ]/g,' ');if(/[a-z]{3,}\s+[a-z]{3,}/.test(x)){const kk=k.split('/')[2]+' | '+t;lat[kk]=(lat[kk]||0)+1;}}));
console.log('errors',errs.length);errs.slice(0,30).forEach(e=>console.log(e));
console.log('overflow:');Object.entries(report).filter(([k,r])=>r.over.length).forEach(([k,r])=>console.log(k,r.over.join(' ')));
console.log('bad text:');Object.entries(report).filter(([k,r])=>r.bad.length).forEach(([k,r])=>console.log(k,r.bad.slice(0,4).join(' || ')));
const cost=await p.evaluate(()=>{const out=[];for(const r of ['job','inv','quote','custd','stock','reports','money','debts']){try{go(r,{});}catch(e){out.push(r+' ERR '+e.message);}out.push(r+'->'+S.r+(/profit|الربح|cost|التكلفة/i.test(document.querySelector('#root').innerText)?' SHOWS-COST':''));}return out.join(' | ');});console.log('worker:',cost);console.log('untranslated candidates:',Object.keys(lat).length);Object.entries(lat).sort((a,b)=>b[1]-a[1]).slice(0,120).forEach(([t,n])=>console.log(n,'|',t));
await b.close();})();
