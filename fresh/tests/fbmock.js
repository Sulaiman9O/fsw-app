// fake Firebase (auth + a small Firestore) shared by all pages through node
const store=new Map();let clock=Date.now();const listeners=[];let lid=0;
function attach(ctx){return ctx.exposeBinding('__fbNode',async({page},op,a)=>{
  if(op==='auth')return a.e==='shop@test.com'&&a.p==='secret1'?{uid:'U1',email:a.e}:null;
  if(op==='get'){const out=[];store.forEach((d,path)=>{if(path.startsWith(a.coll+'/')&&!path.slice(a.coll.length+1).includes('/'))if(!a.since||d.t>a.since)out.push({id:path.slice(a.coll.length+1),data:d});});return a.limit?out.slice(0,a.limit):out;}
  if(op==='commit'){const ch=[];for(const w of a.writes){clock=Math.max(clock+1,Date.now());if(w.del){store.delete(w.path);continue;}const d=JSON.parse(JSON.stringify(w.data));if(d.t==='__ts__')d.t=clock;store.set(w.path,d);ch.push({path:w.path,d});}
    for(const L of listeners){const docs=ch.filter(c=>c.path.startsWith(L.coll+'/')&&(!L.since||c.d.t>L.since)).map(c=>({id:c.path.slice(L.coll.length+1),data:c.d}));if(docs.length)L.page.evaluate(([id,docs])=>window.__fbEmit&&window.__fbEmit(id,docs),[L.id,docs]).catch(()=>{});}return true;}
  if(op==='listen'){const id=++lid;listeners.push({id,page,coll:a.coll,since:a.since});const out=[];store.forEach((d,path)=>{if(path.startsWith(a.coll+'/')&&(!a.since||d.t>a.since))out.push({id:path.slice(a.coll.length+1),data:d});});return {id,docs:out};}
});}
const init=`(()=>{const node=(op,a)=>window.__fbNode(op,a);let user=JSON.parse(localStorage.getItem('__fbu')||'null');const authCbs=[];
 const TS=ms=>({toMillis:()=>ms});const wrap=d=>{const o=Object.assign({},d);if(typeof o.t==='number')o.t=TS(o.t);return o;};
 const mkDoc=x=>({id:x.id,ref:{path:x.path},data:()=>wrap(x.data),metadata:{hasPendingWrites:false}});
 const QS=(arr)=>({empty:!arr.length,size:arr.length,forEach:f=>arr.map(mkDoc).forEach(f),docChanges:()=>arr.map(x=>({type:'added',doc:mkDoc(x)}))});
 const emitters={};window.__fbEmit=(id,docs)=>{const f=emitters[id];if(f)f(QS(docs));};
 function Coll(path,since,lim){return {path,doc:id=>Doc(path+'/'+id),where:(f,op,v)=>Coll(path,v.toMillis(),lim),limit:n=>Coll(path,since,n),
   get:async()=>QS((await node('get',{coll:path,since,limit:lim})).map(x=>Object.assign(x,{path:path+'/'+x.id}))),
   onSnapshot:(cb,err)=>{let id=null,dead=false;node('listen',{coll:path,since}).then(r=>{id=r.id;emitters[id]=cb;if(!dead)cb(QS(r.docs));});return ()=>{dead=true;if(id)delete emitters[id];};}};}
 function Doc(path){const par=path.slice(0,path.lastIndexOf('/')),id=path.split('/').pop();return {path,id,collection:n=>Coll(path+'/'+n),
   get:async()=>{const r=(await node('get',{coll:par})).find(x=>x.id===id);return {exists:!!r,id,data:()=>r?wrap(r.data):undefined};},
   set:async data=>{const d=Object.assign({},data);if(d.t&&d.t.__ts)d.t='__ts__';await node('commit',{writes:[{path,data:d}]});}};}
 const fs={enablePersistence:()=>Promise.resolve(),collection:n=>Coll(n),batch:()=>{const w=[];return {set:(ref,data)=>{const d=Object.assign({},data);if(d.t&&d.t.__ts)d.t='__ts__';w.push({path:ref.path,data:d});},delete:ref=>w.push({path:ref.path,del:1}),commit:()=>node('commit',{writes:w})};}};
 const auth={onAuthStateChanged:cb=>{authCbs.push(cb);setTimeout(()=>cb(user),0);},signInWithEmailAndPassword:async(e,p)=>{const u=await node('auth',{e,p});if(!u)throw {code:'auth/wrong-password'};user=u;localStorage.setItem('__fbu',JSON.stringify(u));authCbs.forEach(c=>c(u));return {user:u};},signOut:async()=>{user=null;localStorage.removeItem('__fbu');authCbs.forEach(c=>c(null));}};
 const fb={initializeApp:()=>({}),auth:()=>auth,firestore:Object.assign(()=>fs,{FieldValue:{serverTimestamp:()=>({__ts:1})},Timestamp:{fromMillis:ms=>TS(ms)}})};
 Object.defineProperty(window,'firebase',{get:()=>fb,set:()=>{},configurable:false});
 window.__FB_TEST_CFG={projectId:'demo'};})();`;
module.exports={attach,init,store};
