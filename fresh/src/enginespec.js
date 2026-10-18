/* ---------- maker data for engines (researched: official manuals, Chinese and GCC sources). ENGSPEC by engine code; extra engines for models ---------- */
const ENGSPEC={};
const ENG_EXTRA={};
(function(){const mkKey2=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  Object.entries(ENG_EXTRA).forEach(([k,L])=>{const [mk,md]=k.split('|');let M=CARDB.mk.find(m=>mkKey2(m[0])===mkKey2(mk));
    if(!M){M=[mk,'',[],[]];CARDB.mk.push(M);}const nm=M[0]+'|'+md;
    if(![...M[2],...(M[3]||[])].some(x=>mkKey2(x)===mkKey2(md)))(M[3]=M[3]||[]).push(md);
    const cur=CARDB.eng[nm]=CARDB.eng[nm]||[];L.forEach(r=>{if(!cur.some(c=>c[0]===r[0]))cur.push(r);});});})();
