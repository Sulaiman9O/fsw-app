module.exports=(isEnc)=>`(()=>{const IE=${isEnc};const L=k=>JSON.parse(localStorage.getItem(k)||'null'),W=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const conns={};let secret=localStorage.getItem('__sec');
const file=()=>L('__dbfile');const put=f=>W('__dbfile',f);
const P={isSecretStored:async()=>({result:!!secret}),setEncryptionSecret:async({passphrase})=>{secret=passphrase;localStorage.setItem('__sec',passphrase);},
 isDatabase:async()=>({result:!!file()}),isDatabaseEncrypted:async()=>({result:!!(file()||{}).enc}),
 createConnection:async o=>{if(conns.RW)throw new Error('Connection exists');if(o.encrypted&&!IE)throw new Error('No Encryption set');conns.RW={enc:o.encrypted,mode:o.mode,open:false};},
 closeConnection:async()=>{if(!conns.RW)throw new Error('No available connection');delete conns.RW;},
 open:async()=>{const c=conns.RW;let f=file();if(c.enc&&!secret)throw new Error('No Passphrase');
   if(c.mode==='encryption'){if(f&&!f.enc){f.enc=true;f.key=secret;put(f);}}
   if(!f){f={enc:!!c.enc,key:c.enc?secret:null,kv:{},rec:{}};put(f);}
   if(f.enc&&!c.enc)throw new Error('file is not a database');if(!f.enc&&c.enc)throw new Error('file is not a database (plain)');if(f.enc&&f.key!==secret)throw new Error('wrong key');c.open=true;},
 execute:async()=>{if(!conns.RW||!conns.RW.open)throw new Error('not open');return {};},
 query:async o=>{if(!conns.RW||!conns.RW.open)throw new Error('not open');const f=file();
   if(/sqlite_master/.test(o.statement))return {values:[{n:1}]};
   if(/FROM kv/.test(o.statement))return {values:Object.entries(f.kv).map(([k,v])=>({k,v}))};
   return {values:Object.entries(f.rec).map(([ck,v])=>{const [c,id]=ck.split('\\u0001');return {c,id,v};})};},
 executeSet:async o=>{if(!conns.RW||!conns.RW.open)throw new Error('not open');const f=file();
   for(const s of o.set){const st=s.statement,v=s.values;if(/INTO kv/.test(st))f.kv[v[0]]=v[1];else if(/FROM kv/.test(st))delete f.kv[v[0]];else if(/INTO rec/.test(st))f.rec[v[0]+'\\u0001'+v[1]]=v[2];else if(/FROM rec/.test(st))delete f.rec[v[0]+'\\u0001'+v[1]];}put(f);return {};}};
window.Capacitor={Plugins:{CapacitorSQLite:P},isNativePlatform:()=>false};})();`;
