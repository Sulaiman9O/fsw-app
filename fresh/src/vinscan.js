/* ---------- VIN SCANNER: read the chassis number (VIN) with the camera — its barcode, or the printed number (text reading).
   Everything runs on the device: the reading files (about 7 MB) download once from the app's site and are kept in the
   browser database, so after the first time it works without internet. Nothing is sent anywhere. ---------- */
const OCR_BASE=()=>window.__OCR_BASE||(/github\.io$/.test(location.hostname)?'ocr/':'https://sulaiman9o.github.io/fsw-app/garage/ocr/');
const OCR_V='2';/* bump when the files in docs/garage/ocr change — and update OCR_SHA */
const OCR_SHA={"tesseract.min.js": "10fff78484067759c43028a02a72d76d0b90eb17302bb23b58a9ec5410bc928b", "worker.min.js": "38645599043239c0eb6db08a6504a92dcdc292200535f3e9339cd77c4443b842", "tesseract-core-lstm.wasm.js": "775a35df6f2ae100e02609443e6bd5cafcd07983dd6175454ca4a432a7730687", "tesseract-core-simd-lstm.wasm.js": "9d7c43fb206dc9f48475228b46bf35f888fa9e6259da2e67d5a75c77049f2dc7", "zxing.min.js": "d7cc8f69dd70bdcf3ac00c9ae572bf2acb9f4132ba379c72df842e4db918652d"};/* SHA-256 of each reader file: a changed file is refused */
let OCRDB=null;
async function ocrDb(){if(OCRDB)return OCRDB;const r=indexedDB.open('shopflo-ocr',1);r.onupgradeneeded=()=>{try{r.result.createObjectStore('f');}catch(e){}};OCRDB=await idbReq(r);return OCRDB;}
/* one file: from the device if kept, else download and keep it */
async function ocrFile(name,type){const db=await ocrDb();const k=OCR_V+':'+name;
  let b=await idbReq(db.transaction('f','readonly').objectStore('f').get(k));
  if(!b){const r=await fetch(OCR_BASE()+name);if(!r.ok)throw new Error('download '+name+' '+r.status);const ab=await r.arrayBuffer();if(OCR_SHA[name]){const h=[...new Uint8Array(await crypto.subtle.digest('SHA-256',ab))].map(x=>x.toString(16).padStart(2,'0')).join('');if(h!==OCR_SHA[name])throw new Error('reader file changed: '+name);}b=new Blob([ab],{type});
    await new Promise((ok,no)=>{const tx=db.transaction('f','readwrite');tx.objectStore('f').put(b,k);tx.oncomplete=ok;tx.onerror=()=>no(tx.error);});}
  return URL.createObjectURL(b);}
const loadScript=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('script'));document.head.appendChild(s);});
const wasmSimd=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]));}catch(e){return false;}};
let OCRW=null;
async function ocrWorker(step){if(OCRW)return OCRW;
  step&&step(T_('Getting the reader ready…'));
  if(!window.Tesseract)await loadScript(await ocrFile('tesseract.min.js','text/javascript'));
  const w=await ocrFile('worker.min.js','text/javascript');const core=await ocrFile(wasmSimd()?'tesseract-core-simd-lstm.wasm.js':'tesseract-core-lstm.wasm.js','text/javascript');
  /* the language file is kept by the reader itself (its own browser database) after the first download */
  OCRW=await Tesseract.createWorker('eng',1,{workerPath:w,corePath:core+'#.js',workerBlobURL:false,langPath:OCR_BASE()+'lang',gzip:true,
    logger:m=>{if(step&&m&&m.status&&/loading|initializ/i.test(m.status))step(T_('Getting the reader ready…')+(m.progress?' '+Math.round(m.progress*100)+'%':''));}});
  await OCRW.setParameters({tessedit_char_whitelist:'ABCDEFGHJKLMNPRSTUVWXYZ0123456789',preserve_interword_spaces:'0'});
  return OCRW;}
/* ---- VIN rules ---- */
const VIN_RX=/^[A-HJ-NPR-Z0-9]{17}$/;
function vinCheck(v){const T='0123456789.ABCDEFGH..JKLMN.P.R..STUVWXYZ';const W=[8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];let s=0;
  for(let i=0;i<17;i++){const c=v[i];const n=/\d/.test(c)?+c:(T.indexOf(c)%10);s+=n*W[i];}const d=s%11;return v[8]===(d===10?'X':String(d));}
const WMI={KL:'Chevrolet',KPT:'SsangYong',KMF:'Hyundai',JT:'Toyota',MR0:'Toyota',MR2:'Toyota',MHF:'Toyota',AHT:'Toyota','4T':'Toyota','5T':'Toyota','2T1':'Toyota','2T3':'Toyota',JTH:'Lexus',JTJ:'Lexus','2T2':'Lexus','58A':'Lexus',
  JN:'Nissan','1N':'Nissan','3N':'Nissan','5N1':'Nissan',MNT:'Nissan',KMH:'Hyundai',KM8:'Hyundai','5NP':'Hyundai',KNA:'Kia',KND:'Kia','5XY':'Kia',JHM:'Honda','1HG':'Honda','2HG':'Honda','5FN':'Honda',
  JM1:'Mazda',JM3:'Mazda',JMZ:'Mazda',JF1:'Subaru',JF2:'Subaru',JA3:'Mitsubishi',JA4:'Mitsubishi',JMB:'Mitsubishi',MMB:'Mitsubishi',MMC:'Mitsubishi',WDB:'Mercedes-Benz',WDD:'Mercedes-Benz',W1K:'Mercedes-Benz',W1N:'Mercedes-Benz',
  WBA:'BMW',WBS:'BMW',WVW:'Volkswagen',WV1:'Volkswagen',WV2:'Volkswagen',WAU:'Audi',SAL:'Land Rover',SAJ:'Jaguar','1FA':'Ford','1FM':'Ford','1FT':'Ford','3FA':'Ford','1GC':'Chevrolet','1G1':'Chevrolet','1GN':'Chevrolet','1GK':'GMC','1GT':'GMC','3GC':'Chevrolet',
  '1C4':'Jeep','1J4':'Jeep','1C6':'Ram','2C3':'Dodge',LSJ:'MG',LVV:'Chery',LGW:'Haval',LB3:'Geely',LGX:'BYD',LC0:'BYD',LS5:'Changan',LJD:'Jetour',LNB:'BAIC',MAJ:'Ford',MA3:'Suzuki',JS1:'Suzuki',JS2:'Suzuki',TSM:'Suzuki'};
function vinMake(v){for(const n of [3,2])if(WMI[v.slice(0,n)])return WMI[v.slice(0,n)];return '';}
function vinYear(v){const c=v[9];const L='ABCDEFGHJKLMNPRSTVWXY123456789';const i=L.indexOf(c);if(i<0)return 0;const max=new Date().getFullYear()+1;return [1980+i,2010+i].filter(y=>y<=max).pop()||0;}
/* the VINs inside some read text. The text holds several readings of the same picture (split by \f).
   Reading mistakes are repaired: up to 2 extra letters, and up to 2 look-alike letters (S↔5, B↔8/6, E→6, Z↔2…) when that
   makes the VIN's own check number right. A VIN that comes out of more than one reading is trusted more. Best ones first. */
const VIN_LOOK={'0':'D8','1':'7L','2':'Z','3':'8','4':'A','5':'S','6':'GBE','7':'T1','8':'B36','9':'G','A':'4','B':'86','C':'G','D':'0','E':'6F','F':'E','G':'6C','L':'1','S':'5','T':'7','Z':'2'};
const VIN_LOOK2={'5':'S','S':'5','B':'86','8':'B','E':'6','6':'GB','Z':'2','2':'Z','G':'6','D':'0','0':'D','A':'4','4':'A'};
const VIN_YR='ABCDEFGHJKLMNPRSTVWXY123456789';
const vinLetters=c=>(c.match(/[A-Z]/g)||[]).length;
function vinScore(c,ed){return (vinCheck(c)?6:0)+(vinMake(c)?3:0)+(VIN_YR.includes(c[9])?1:0)+(vinLetters(c)>=3?1:0)-ed*1.5;}
function vinCands(reading,exact){const out=new Map();const add=(c,sc)=>{if(vinLetters(c)<2)return;if(!out.has(c)||out.get(c)<sc)out.set(c,sc);};
  String(reading||'').toUpperCase().split(/\n/).forEach(line=>{
    let s=line.replace(/[^A-Z0-9]/g,'');if(!exact)s=s.replace(/[OQ]/g,'0').replace(/I/g,'1');
    if(exact&&s.length===18&&s[0]==='I')s=s.slice(1);/* the US import mark before a barcode VIN */
    for(let i=0;i+17<=s.length;i++){const c=s.slice(i,i+17);if(VIN_RX.test(c))add(c,vinScore(c,0)+(s.length===17?2:0));}
    if(exact)return;
    const toks=line.toUpperCase().replace(/[OQ]/g,'0').replace(/I/g,'1').split(/[^A-Z0-9]+/).filter(t=>t.length>=15);const pieces=new Set(toks);if(s.length>=15&&s.length<=24)pieces.add(s);
    pieces.forEach(t=>{if(vinLetters(t)<2)return;
      for(let L=17;L<=Math.min(19,t.length);L++)for(let i=0;i+L<=t.length;i++){const w=t.slice(i,i+L);const dels=L-17;
        const tries=dels===0?[w]:dels===1?[...Array(L).keys()].map(a=>w.slice(0,a)+w.slice(a+1)):[...Array(L).keys()].flatMap(a=>[...Array(L).keys()].filter(b=>b>a).map(b=>w.slice(0,a)+w.slice(a+1,b)+w.slice(b+1)));
        tries.forEach(c=>{if(!VIN_RX.test(c))return;if(vinCheck(c)){add(c,vinScore(c,dels));return;}
          for(let k=0;k<17;k++){const alt=VIN_LOOK[c[k]];if(!alt)continue;for(const a of alt){const c2=c.slice(0,k)+a+c.slice(k+1);if(!VIN_RX.test(c2))continue;if(vinCheck(c2)){add(c2,vinScore(c2,dels+1));continue;}
            if(dels>1||!VIN_LOOK2[c[k]]||!VIN_LOOK2[c[k]].includes(a))continue;
            for(let m=k+1;m<17;m++){const a2=VIN_LOOK2[c2[m]];if(!a2)continue;for(const b of a2){const c3=c2.slice(0,m)+b+c2.slice(m+1);if(VIN_RX.test(c3)&&vinCheck(c3))add(c3,vinScore(c3,dels+2));}}}}});}});});
  return out;}
function vinFind(txt,exact){const R=String(txt||'').split('\f');const tot=new Map(),seen=new Map();
  R.forEach(r=>vinCands(r,exact).forEach((sc,c)=>{seen.set(c,(seen.get(c)||0)+1);if(!tot.has(c)||tot.get(c)<sc)tot.set(c,sc);}));
  const L=[...tot.entries()].map(([c,sc])=>[c,sc+(seen.get(c)-1)*4]).sort((a,b)=>b[1]-a[1]);const best=L.length?L[0][1]:0;
  /* a number that passes the check digit AND starts with a known maker beats a number read twice that fails them */
  const strong=c=>vinCheck(c)&&!!vinMake(c);const K=L.filter(x=>x[1]>=best-4||strong(x[0]));K.sort((a,b)=>(strong(b[0])-strong(a[0]))||(b[1]-a[1]));
  return K.map(x=>x[0]).slice(0,3);}
/* turn the prepared picture a few degrees: a tilted photo reads much better straightened */
function ocrTurn(c,deg){const r=deg*Math.PI/180,s=Math.abs(Math.sin(r)),k=Math.abs(Math.cos(r));const o=document.createElement('canvas');o.width=Math.round(c.width*k+c.height*s);o.height=Math.round(c.width*s+c.height*k);
  const g=o.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,o.width,o.height);g.translate(o.width/2,o.height/2);g.rotate(r);g.drawImage(c,-c.width/2,-c.height/2);return o;}
/* read; if no number passes the check digit, try the picture turned a little each way (stops at the first good one) */
async function ocrDeep(src,crop,step){const c=ocrPrep(src,crop);let raw=await ocrRead(c,step);let L=vinFind(raw);
  const sure=()=>L.length&&vinCheck(L[0])&&raw.split('\f').filter(r=>vinFind(r).includes(L[0])).length>=2;
  for(const d of [-4,4,-8,8]){if(sure())break;raw+='\f'+await ocrRead(ocrTurn(c,d),step);L=vinFind(raw);}return {L,raw};}
/* make a picture easier to read: grey, stronger contrast, about 1600 px wide */
function ocrPrep(src,crop){const sw=crop?crop.w:(src.videoWidth||src.naturalWidth||src.width),sh=crop?crop.h:(src.videoHeight||src.naturalHeight||src.height);
  const k=Math.min(3,2400/sw);const c=document.createElement('canvas');c.width=Math.round(sw*k);c.height=Math.round(sh*k);const g=c.getContext('2d');
  g.drawImage(src,crop?crop.x:0,crop?crop.y:0,sw,sh,0,0,c.width,c.height);const im=g.getImageData(0,0,c.width,c.height),d=im.data;let lo=255,hi=0;
  for(let i=0;i<d.length;i+=4){const y=d[i]*.299+d[i+1]*.587+d[i+2]*.114;d[i]=y;if(y<lo)lo=y;if(y>hi)hi=y;}const r=Math.max(1,hi-lo);
  for(let i=0;i<d.length;i+=4){const y=(d[i]-lo)*255/r;d[i]=d[i+1]=d[i+2]=y;}g.putImageData(im,0,0);return c;}
async function ocrRead(canvas,step){const w=await ocrWorker(step);step&&step(T_('Reading…'));const r=await w.recognize(canvas);let t=(r&&r.data&&r.data.text)||'';
  /* a second reading in black and white catches what the first one misses */
  try{const b=document.createElement('canvas');b.width=canvas.width;b.height=canvas.height;const g=b.getContext('2d');g.drawImage(canvas,0,0);const d=g.getImageData(0,0,b.width,b.height),a=d.data;let sum=0;for(let i=0;i<a.length;i+=4)sum+=a[i];const th=sum/(a.length/4)*.8;
    for(let i=0;i<a.length;i+=4){const y=a[i]<th?0:255;a[i]=a[i+1]=a[i+2]=y;}g.putImageData(d,0,0);const r2=await w.recognize(b);t+='\f'+((r2&&r2.data&&r2.data.text)||'');}catch(e){}
  return t;}
/* ---- barcodes: the phone's own reader when it has one, else ZXing ---- */
let BCD=null,ZX=null;
async function barcodeReader(){if(BCD||ZX)return true;
  try{if('BarcodeDetector' in window){const f=await BarcodeDetector.getSupportedFormats();const want=['code_39','code_128','data_matrix','qr_code','pdf417'].filter(x=>f.includes(x));if(want.length){BCD=new BarcodeDetector({formats:want});return true;}}}catch(e){}
  try{if(!window.ZXing)await loadScript(await ocrFile('zxing.min.js','text/javascript'));const Z=window.ZXing;const h=new Map();
    h.set(Z.DecodeHintType.POSSIBLE_FORMATS,[Z.BarcodeFormat.CODE_39,Z.BarcodeFormat.CODE_128,Z.BarcodeFormat.DATA_MATRIX,Z.BarcodeFormat.QR_CODE,Z.BarcodeFormat.PDF_417]);h.set(Z.DecodeHintType.TRY_HARDER,true);
    ZX={Z,r:new Z.MultiFormatReader()};ZX.r.setHints(h);return true;}catch(e){return false;}}
async function barcodeRead(canvas){if(BCD){try{const r=await BCD.detect(canvas);return r.map(x=>x.rawValue);}catch(e){return [];}}
  if(ZX){try{const Z=ZX.Z;const src=new Z.HTMLCanvasElementLuminanceSource(canvas);const r=ZX.r.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(src)));return r?[r.getText()]:[];}catch(e){return [];}}return [];}
/* ---- which lens: phones with several back cameras (main, wide, zoom). The main one is picked (on Android it is listed first,
   "camera2 0"); 🔄 switches to the next back camera and the choice is remembered on this phone. 🔦 turns the light on. ---- */
const camSaved=()=>{try{return localStorage.getItem('ws_cam')||'';}catch(e){return '';}};
async function camBacks(){try{const L=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');const back=L.filter(d=>/back|rear|environment|خلف/i.test(d.label));
  const B=(back.length?back:L).slice().sort((a,b)=>{const n=x=>{const m=x.label.match(/camera2?\s*(\d+)/i)||x.label.match(/(\d+)/);return m?+m[1]:99;};return n(a)-n(b);});return B;}catch(e){return [];}}
async function camOpen(vid,el,setS){const md=navigator.mediaDevices;const q=id=>({video:Object.assign(id?{deviceId:{exact:id}}:{facingMode:'environment'},{width:{ideal:1920},height:{ideal:1440},aspectRatio:{ideal:4/3}}),audio:false});
  let s=null;const want=camSaved();try{s=await md.getUserMedia(q(want||null));}catch(e){s=await md.getUserMedia(q(null));}
  let B=await camBacks();const cur=()=>{const t=s.getVideoTracks()[0];return t&&t.getSettings?t.getSettings().deviceId:'';};
  /* first time: if the phone gave a side lens, move to the main back camera */
  if(!want&&B.length>1&&B[0].deviceId&&cur()!==B[0].deviceId){try{const s2=await md.getUserMedia(q(B[0].deviceId));s.getTracks().forEach(t=>t.stop());s=s2;}catch(e){}}
  const tune=()=>{const t=s.getVideoTracks()[0];if(!t)return;try{const c=t.getCapabilities?t.getCapabilities():{};if(c.zoom&&c.zoom.min!=null)t.applyConstraints({advanced:[{zoom:c.zoom.min}]}).catch(()=>{});if(c.focusMode&&c.focusMode.includes('continuous'))t.applyConstraints({advanced:[{focusMode:'continuous'}]}).catch(()=>{});
      const tb=el.querySelector('#vstorch');if(tb){tb.hidden=!c.torch;let on=false;tb.onclick=()=>{on=!on;t.applyConstraints({advanced:[{torch:on}]}).catch(()=>{});tb.classList.toggle('on',on);};}}catch(e){}};
  const lens=()=>{const lb=el.querySelector('#vslens');if(!lb)return;lb.hidden=B.length<2;const i=Math.max(0,B.findIndex(d=>d.deviceId===cur()));lb.querySelector('span').textContent=(i+1)+'/'+B.length;
    lb.onclick=async()=>{const nx=B[(i+1)%B.length];try{s.getTracks().forEach(t=>t.stop());s=await md.getUserMedia(q(nx.deviceId));setS(s);vid.srcObject=s;await vid.play().catch(()=>{});try{localStorage.setItem('ws_cam',nx.deviceId);}catch(e){}tune();lens();}catch(e){toast(T_('This lens could not open'));}};};
  const fit=()=>{const w=vid.videoWidth,h=vid.videoHeight;const box=vid.parentNode;if(w&&h&&box){box.style.setProperty('--ar',w+' / '+h);box.style.setProperty('--arn',String(w/h));}};vid.onloadedmetadata=fit;vid.onresize=fit;
  vid.srcObject=s;await vid.play().catch(()=>{});setS(s);tune();lens();return s;}
/* ---- the scanner sheet ---- */
function vinScan(onPick){let stream=null,stop=false,busy=false;
  const end=()=>{stop=true;try{stream&&stream.getTracks().forEach(t=>t.stop());}catch(e){}};
  openSheet(`<h3>📷 ${T_('Chassis number (VIN)')}</h3>
    <div class="vsv camv">${camView('vsvid')}<div class="vsbox"></div><div class="vscam"><button id="vslens" hidden>🔄 <span></span></button><button id="vstorch" hidden>🔦</button></div></div>
    <p class="hint" id="vsst">${T_('Point the camera at the VIN barcode or the printed number, inside the frame.')}</p>
    <div class="two"><button class="btn" id="vsocr">📸 ${T_('Read the number')}</button><button class="btn ghost" id="vspic">🖼 ${T_('From a photo')}</button></div>
    <div id="vsres"></div>`,el=>{
    const st=t=>{const e=el.querySelector('#vsst');if(e)e.textContent=t;};const vid=el.querySelector('#vsvid');camLive(vid);
    const show=(L,raw)=>{const box=el.querySelector('#vsres');if(!box)return;
      if(!L.length){box.innerHTML=`<p class="hint">${T_('No VIN found. Hold the camera closer, keep it straight, and try again — or type it.')}</p>${raw?`<details class="pmore"><summary>${T_('What was read')}</summary><pre class="vsraw">${esc(raw)}</pre></details>`:''}`;return;}
      box.innerHTML=`<label class="lbl">${T_('Found — check it, then tap to use')}</label>`+L.map((v,ix)=>{const mk=vinMake(v),y=vinYear(v);return `<div class="vsc"><input class="field" value="${v}" maxlength="17" style="text-transform:uppercase;font-family:monospace;letter-spacing:1px"><button class="btn okb sm">${T_('Use')}</button><small>${[L.length>1&&!ix?'⭐ '+T_('Most likely'):'',mk,y?('~'+y):'',vinCheck(v)?'✓ '+T_('number checks out'):''].filter(Boolean).join(' · ')}</small></div>`;}).join('');
      /* which car each one is (online or from your own cars) — helps pick the right one */
      box.querySelectorAll('.vsc').forEach(r=>{const v=r.querySelector('input').value;if(typeof vinDecode!=='function')return;vinDecode(v).then(o=>{if(!o||!document.body.contains(r))return;const sm=r.querySelector('small');if(sm&&(o.model||o.src.includes('online')))sm.innerHTML='🚗 <b>'+esc(vinLabel(o))+'</b> · '+sm.innerHTML;}).catch(()=>{});});
      box.querySelectorAll('.vsc').forEach(r=>r.querySelector('button').onclick=()=>{const v=r.querySelector('input').value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(v.length!==17&&!confirm0(v))return;end();closeSheet();onPick(v);});};
    const confirm0=v=>{st(T_('A VIN has 17 letters and numbers. This one has {n}.'.replace('{n}',v.length)));return v.length>=11;};
    const grab=()=>{const c=document.createElement('canvas');c.width=vid.videoWidth;c.height=vid.videoHeight;c.getContext('2d').drawImage(vid,0,0);return c;};
    const band=c=>({x:0,y:Math.round(c.height*.3),w:c.width,h:Math.round(c.height*.4)});/* the frame on screen */
    const ocrFrom=async(src,crop)=>{if(busy)return;busy=true;try{let {L,raw}=await ocrDeep(src,crop,st);if(!L.length&&crop){const raw2=(await ocrDeep(src,null,st)).raw;L=vinFind(raw2);if(!L.length){show([],raw+'\n'+raw2);st('');return;}}show(L,raw);st(L.length?'':T_('No VIN found.'));}
      catch(e){st(navigator.onLine===false?T_('The reader downloads once (about 7 MB). Connect to the internet one time, then it works without internet.'):T_('Could not start the reader')+': '+(e&&e.message||e));}finally{busy=false;}};
    /* 📸: take the picture at once (the camera stops and the picture stays on screen), then read it — no need to keep aiming */
    let frozen=false;const shot=el.querySelector('#vsocr');
    const unfreeze=()=>{frozen=false;const im=el.querySelector('#vsimg');if(im)im.remove();camWait(vid);vid.hidden=false;shot.textContent='📸 '+T_('Read the number');el.querySelector('#vsres').innerHTML='';startCam();};
    const take=async()=>{if(frozen){unfreeze();return;}if(!vid.videoWidth){st(T_('No camera here. Use «From a photo».'));return;}
      const c=grab();frozen=true;end();try{navigator.vibrate&&navigator.vibrate(25);}catch(e){}
      const im=document.createElement('img');im.id='vsimg';im.src=c.toDataURL('image/jpeg',.85);vid.hidden=true;vid.after(im);shot.textContent='📸 '+T_('Another photo');
      st(T_('Photo taken — reading it now. You can put the phone down.'));
      if(await barcodeReader()){const B=(await barcodeRead(c)).flatMap(t=>vinFind(t,true));if(B.length){show(B);st(T_('Read from the barcode.'));return;}}
      ocrFrom(c,band(c));};
    shot.onclick=take;vid.onclick=take;
    el.querySelector('#vspic').onclick=()=>{const f=document.createElement('input');f.type='file';f.accept='image/*';f.onchange=()=>{const x=f.files&&f.files[0];if(!x)return;const im=new Image();im.onload=async()=>{
        const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);await barcodeReader();const B=(await barcodeRead(c)).flatMap(t=>vinFind(t,true));if(B.length){show(B);st(T_('Read from the barcode.'));return;}ocrFrom(c);};im.src=URL.createObjectURL(x);};f.click();};
    /* live camera: keep looking for a barcode */
    const startCam=async()=>{stop=false;try{stream=await camOpen(vid,el,s=>{stream=s;});if(stop){end();return;}}
      catch(e){st(T_('No camera here. Use «From a photo».'));el.querySelector('.vsv').hidden=true;return;}
      const ok=await barcodeReader();const loop=async()=>{if(stop||!document.body.contains(vid))return end();
        if(!busy&&ok&&vid.videoWidth){const B=(await barcodeRead(grab())).flatMap(t=>vinFind(t,true));if(B.length){show(B);st(T_('Read from the barcode.'));try{navigator.vibrate&&navigator.vibrate(30);}catch(e){}return;}}
        setTimeout(loop,350);};loop();};startCam();
    /* get the reader ready while the camera is open, so reading starts at once after 📸 */
    setTimeout(()=>{if(!stop||frozen)ocrWorker().catch(()=>{});},600);
    const x=el.querySelector('[data-close]');if(x){const c0=x.onclick;x.onclick=()=>{end();c0&&c0();};}
    const sh=$('#sheet');if(sh){const o=sh.onclick;sh.onclick=e=>{if(e.target===sh)end();o&&o(e);};}});}
/* a 📷 button next to every VIN field (new car in, edit car); a full VIN — scanned or typed — fills make, model, year and engine */
const nKeep=()=>{const N=S.p&&S.p.n;if(!N)return null;const M={nphone:'phone',nname:'name',nplate:'plate',nkm:'km',nmake:'make',nmodel:'model',nyear:'year',nkm2:'km',nvin:'vin'};Object.keys(M).forEach(id=>{const e=$('#'+id);if(e)N[M[id]]=e.value;});return N;};
const vvDraft=()=>{const C=S.vinCtx||{};const g=id=>{const e=document.querySelector('#sheet '+id);return e?e.value:'';};
  return Object.assign({},C.dr||C.v||{},{make:g('#vm'),model:g('#vmo'),year:g('#vy'),engine:g('#veng'),plate:g('#vp'),km:num(g('#vk')),vin:g('#vv').toUpperCase().trim(),size:g('#vsz')===''?null:+g('#vsz')});};
let VIN_BUSY='';
async function vinUse(where,vin,draft){vin=String(vin||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(VIN_BUSY===where+vin)return;VIN_BUSY=where+vin;
  try{if(where==='nvin'){const N=nKeep();if(!N)return;N.vin=vin;N.vinInfo={vin,wait:1};render();const o=await vinDecode(vin,N.vehId);const N2=S.p&&S.p.n;if(N2!==N)return;
      if(!o){N.vinInfo=null;render();return;}const ch=vinFill(N,o,false);N.vinInfo=Object.assign(o,{ch});render();}
    else{const C=S.vinCtx||{};const dd=draft||vvDraft();dd.vin=vin;S.vinNote={vin,wait:1};vehSheet(C.cust,C.v||null,dd);const o=await vinDecode(vin,C.v&&C.v.id);
      if(!document.querySelector('#sheet #vv'))return;const d2=vvDraft();if(d2.vin!==vin)return;if(!o){S.vinNote=null;vehSheet(C.cust,C.v||null,d2);return;}const ch=vinFill(d2,o,false);S.vinNote=Object.assign(o,{ch});vehSheet(C.cust,C.v||null,d2);}}
  finally{VIN_BUSY='';}}
/* the line under the VIN: what was found, where from, and a button when it differs from what is already chosen */
function vinNoteHtml(o,d){if(o.wait)return `<div class="vinnote wait">⏳ ${T_('Looking up the car…')}</div>`;
  const diff=['make','model','year'].filter(k=>{const v=k==='year'?(o.year?String(o.year):''):o[k];return v&&d[k]&&String(d[k]).toLowerCase()!==String(v).toLowerCase();});
  const src=o.src.includes('online')?T_('from the VIN database'):o.src.includes('local')?T_('from your cars with the same VIN start'):T_('from the VIN start only — choose the model');
  return `<div class="vinnote${diff.length?' diff':''}"><b>🚗 ${esc(vinLabel(o))}</b><small>${esc(src)}${o.extra?' · '+esc(o.extra):''}${o.ch&&o.ch.length?' · ✓ '+T_('filled in'):''}</small>${diff.length?`<button class="btn sm" data-vinforce>${T_('Use this car')}</button>`:''}</div>`;}
function vinAttach(root){(root||document).querySelectorAll('#nvin,#vv').forEach(inp=>{
  if(!inp._vs){inp._vs=1;const w=document.createElement('div');w.className='vinw';inp.parentNode.insertBefore(w,inp);w.appendChild(inp);
    const b=document.createElement('button');b.type='button';b.className='vinb';b.title=T_('Scan the VIN');b.textContent='📷';w.appendChild(b);
    b.onclick=()=>{if(inp.id==='vv'){const dd=vvDraft();vinScan(vin=>vinUse('vv',vin,dd));return;}nKeep();vinScan(v=>{vinUse('nvin',v);toast(T_('VIN added')+' · '+v);});};
    const typed=()=>{const v=inp.value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(v.length===17&&VIN_RX.test(v))vinUse(inp.id,v);};inp.addEventListener('change',typed);inp.addEventListener('input',()=>{if(inp.value.replace(/\s/g,'').length===17)typed();});}
  /* the note */
  const w=inp.closest('.vinw');const old=w&&w.nextElementSibling&&w.nextElementSibling.classList.contains('vinnote')?w.nextElementSibling:null;if(old)old.remove();
  const val=inp.value.toUpperCase().trim();let o=null,d=null;
  if(inp.id==='nvin'){const N=S.p&&S.p.n;o=N&&N.vinInfo;d=N;}else{o=S.vinNote;d=vvDraft();}
  if(!o||o.vin!==val||!w)return;w.insertAdjacentHTML('afterend',vinNoteHtml(o,d||{}));const f=w.nextElementSibling.querySelector('[data-vinforce]');
  if(f)f.onclick=()=>{if(inp.id==='nvin'){const N=nKeep();vinFill(N,o,true);N.engine=o.engine||'';o.ch=['make'];render();}else{const C=S.vinCtx||{};const dd=vvDraft();vinFill(dd,o,true);dd.engine=o.engine||'';o.ch=['make'];vehSheet(C.cust,C.v||null,dd);}};});}
(function(){if(typeof vehSheet==='function'){const VS=vehSheet;window.vehSheet=vehSheet=function(cust,v,dr){S.vinCtx={cust,v,dr};return VS(cust,v,dr);};}
  const R=render;window.render=render=function(){const r=R.apply(this,arguments);try{vinAttach($('#main'));}catch(e){}return r;};
  const O=openSheet;window.openSheet=openSheet=function(h,bind){return O(h,el=>{bind&&bind(el);try{vinAttach(el);}catch(e){}});};})();
