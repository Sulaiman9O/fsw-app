/* ---------- the invoice as a PDF: the same page as the print, made on the device (no internet, no library),
   sent straight to the customer's WhatsApp chat. Tablet app: through the app (FswShare.sharePdf). Phone browser: the share sheet.
   Computer: the PDF is saved and the customer's chat opens, to drop it in. ---------- */
const PDF_MM=96/25.4;
function invDocCss(){return INV_CSS+(window.INV2_CSS||INV2_CSS);}
/* HTML -> picture: drawn by the browser itself inside an SVG, so Arabic, the logo and the stamp look exactly as on screen */
async function htmlJpeg(html,css,wmm,scale,q){
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-20000px;top:0;width:'+wmm+'mm;background:#fff;color:#000';
  host.innerHTML='<style>'+css+'</style><div class="pdfpg" style="width:'+wmm+'mm;padding:9mm;box-sizing:border-box;background:#fff">'+html+'</div>';
  document.body.appendChild(host);
  const W=Math.ceil(wmm*PDF_MM),H=Math.ceil(host.querySelector('.pdfpg').getBoundingClientRect().height)+40;
  host.querySelectorAll('img').forEach(i=>i.removeAttribute('loading'));
  host.style.cssText='width:'+wmm+'mm;background:#fff;color:#000';const xml=new XMLSerializer().serializeToString(host);host.remove();
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'"><foreignObject x="0" y="0" width="100%" height="100%">'+xml+'</foreignObject></svg>';
  const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await im.decode();
  await new Promise(r=>setTimeout(r,60));   /* pictures inside the page finish decoding */
  const c=document.createElement('canvas');c.width=Math.round(W*scale);c.height=Math.round(H*scale);const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
  /* cut the white space left under the page */
  let bot=c.height;try{const d=x.getImageData(0,0,c.width,c.height).data,rw=c.width*4;
    for(let y=c.height-1;y>0;y--){let ink=false;for(let i=y*rw;i<y*rw+rw;i+=16){if(d[i]<245||d[i+1]<245||d[i+2]<245){ink=true;break;}}if(ink){bot=Math.min(c.height,y+Math.round(9*PDF_MM*scale));break;}}}catch(e){}
  let o=c;if(bot<c.height){o=document.createElement('canvas');o.width=c.width;o.height=bot;const y=o.getContext('2d');y.fillStyle='#fff';y.fillRect(0,0,o.width,o.height);y.drawImage(c,0,0);}
  const url=o.toDataURL('image/jpeg',q||0.88);return {b64:url.slice(url.indexOf(',')+1),w:o.width,h:o.height};}
/* one picture on one page (A4 width; longer than A4 only when the invoice is) */
function jpegPdf(J){const bin=atob(J.b64),img=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)img[i]=bin.charCodeAt(i);
  const A4=841.89,pw=595.28;let iw=pw,ih=pw*J.h/J.w;if(ih>A4&&A4/ih>=0.62){iw=pw*A4/ih;ih=A4;}const ph=Math.max(A4,ih),ix=(pw-iw)/2;   /* a little longer than A4: shrunk onto one A4 page, like the print */
  const enc=new TextEncoder(),parts=[],off=[];let len=0;
  const add=s=>{const b=typeof s==='string'?enc.encode(s):s;parts.push(b);len+=b.length;};const obj=(n,s)=>{off[n]=len;add(n+' 0 obj\n'+s+'\nendobj\n');};
  add('%PDF-1.4\n');
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pw+' '+ph.toFixed(2)+'] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  off[4]=len;add('4 0 obj\n<< /Type /XObject /Subtype /Image /Width '+J.w+' /Height '+J.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+img.length+' >>\nstream\n');add(img);add('\nendstream\nendobj\n');
  const cs='q '+iw.toFixed(2)+' 0 0 '+ih.toFixed(2)+' '+ix.toFixed(2)+' '+(ph-ih).toFixed(2)+' cm /Im0 Do Q';obj(5,'<< /Length '+cs.length+' >>\nstream\n'+cs+'\nendstream');
  const xr=len;add('xref\n0 6\n0000000000 65535 f \n'+[1,2,3,4,5].map(n=>String(off[n]).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF\n');
  const out=new Uint8Array(len);let p=0;parts.forEach(b=>{out.set(b,p);p+=b.length;});return out;}
async function invoicePdf(j){const J=await htmlJpeg(invoiceHtml(j,true),invDocCss(),210,2.2);return {bytes:jpegPdf(J),name:'Invoice-'+j.inv.no+'.pdf'};}
function invCaption(j){const x=jobVars(j),T=jobTotals(j);return ['فاتورة رقم '+j.inv.no+' — '+DB.ws.name,'الإجمالي: '+x.total,T.due>0.0005&&!j.returned?'المتبقي: '+x.due:'','شكراً لثقتكم'].filter(Boolean).join('\n');}
const b64of=u8=>{let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);};
/* ---------- the invoice as a LINK: the picture of the invoice is kept online under a long random name (inv/{id}, readable only by
   someone who has the link, nobody can list them), and the customer's chat opens with the invoice line + the link: one tap on Send.
   The link opens a page with the invoice and «Download PDF». Free (a few hundred KB each). ---------- */
const INV_VIEW='https://sulaiman9o.github.io/fsw-app/i/';
const rid=n=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789',b=new Uint8Array(n);crypto.getRandomValues(b);return Array.from(b,x=>a[x%a.length]).join('');};
async function invUploadLink(j){let J;for(const [sc,q] of [[2,0.82],[1.7,0.72],[1.4,0.62]]){J=await htmlJpeg(invoiceHtml(j,true),invDocCss(),210,sc,q);if(J.b64.length<900000)break;}
  if(J.b64.length>=900000)throw new Error('too big');const id=rid(24);
  await FBS.collection('inv').doc(id).set({img:J.b64,w:J.w,h:J.h,no:String(j.inv.no),ws:DB.ws.name||'',ph:DB.ws.phone||'',job:j.id,t:firebase.firestore.FieldValue.serverTimestamp()});
  return INV_VIEW+'?k='+id;}
const invLinkOk=()=>typeof FBS!=='undefined'&&FBS&&typeof SYNC!=='undefined'&&SYNC.user&&navigator.onLine!==false;
async function sendInvoiceLink(j){const c=custOf(j)||{};
  /* the browser lets a new tab open only right after the tap: open it now, fill it when the link is ready */
  let w=null;if(!window.CapApp){try{w=window.open('about:blank','_blank');}catch(e){}}
  toast(T_('Making the invoice link…'));
  try{const url=await Promise.race([invUploadLink(j),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),15000))]);
    const t=invCaption(j)+'\n\n📄 الفاتورة PDF:\n'+url;const u='https://wa.me/'+(c.phone?waNum(c.phone):'')+'?text='+encodeURIComponent(t);
    j.invLink=url;logJ(j,'Invoice link sent');save();trail('pdf','link '+url.slice(-6));
    if(w){try{w.opener=null;}catch(e){}w.location.href=u;}else shareText(c.phone,t);return true;}
  catch(e){trail('pdf','link failed: '+(e&&e.message||e));if(w)try{w.close();}catch(x){}return false;}}
async function sendInvoicePdf(j){if(invLinkOk()&&await sendInvoiceLink(j))return;const c=custOf(j)||{},cap=invCaption(j);const asText=()=>shareText(c.phone,docText(j,'invoice'));
  const P=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.FswShare;const app=!!window.CapApp;
  if(app&&!(P&&typeof P.sharePdf==='function')){toast(T_('This app version sends text. Install the new app to send a PDF.'));asText();return;}
  toast(T_('Making the PDF…'));let pdf;try{pdf=await invoicePdf(j);}catch(e){toast(T_('Could not make the PDF, sent as text'));asText();return;}
  const sent=()=>{logJ(j,'Invoice PDF sent');save();};
  const appSend=async(txt)=>{try{await P.sharePdf({b64:b64of(pdf.bytes),name:pdf.name,phone:c.phone?waNum(c.phone):'',text:txt});sent();}catch(e){toast(T_('Could not send the PDF')+': '+(e&&e.message||e));}};
  /* WhatsApp opens a chat straight from a number only for text, and puts a file straight into a chat only for a saved contact.
     So: 1) the customer's chat opens with the invoice line (any number); 2) back in the app, one tap sends the PDF —
     the customer is then the first chat in WhatsApp's list. */
  if(app){if(!c.phone){appSend(cap);return;}
    const ask=()=>openSheet(`<h3>📄 ${T_('Now send the PDF')}</h3><p class="hint">${T_('In WhatsApp, the customer is at the top of the list.')}</p><button class="btn" id="pdfgo">📄 ${T_('Send the invoice PDF')}</button>`,el=>el.querySelector('#pdfgo').onclick=()=>{closeSheet();appSend('');});
    const back=()=>{if(document.hidden)return;document.removeEventListener('visibilitychange',back);clearTimeout(tm);setTimeout(ask,250);};
    document.addEventListener('visibilitychange',back);const tm=setTimeout(()=>{document.removeEventListener('visibilitychange',back);ask();},20000);
    trail('pdf','chat first, then PDF');shareText(c.phone,cap);return;}
  const f=new File([pdf.bytes],pdf.name,{type:'application/pdf'});
  const touch=matchMedia('(pointer:coarse)').matches;
  if(touch&&navigator.canShare&&navigator.canShare({files:[f]})){
    const go2=()=>navigator.share({files:[f],text:cap}).then(sent).catch(e=>{if(e&&e.name==='NotAllowedError')ask();});
    /* the phone allows the share sheet only right after a tap: if making the PDF took too long, one more tap */
    const ask=()=>openSheet(`<h3>${T_('The PDF is ready')}</h3><button class="btn wa" id="pdfgo">📄 ${T_('Send on WhatsApp')}</button>`,el=>el.querySelector('#pdfgo').onclick=()=>{closeSheet();go2();});
    go2();return;}
  /* computer: save the file, open the customer's chat; drop the file in */
  const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=pdf.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},5000);
  shareText(c.phone,cap);sent();toast(T_('PDF saved: drag it into the WhatsApp chat'),5000);}
/* print on ONE page: a page that runs a little over A4 is shrunk to fit, so «شكراً لثقتكم» never lands alone on a second page.
   Measured here (the tablet's print view runs no scripts) and written into the page. */
function invPrintDoc(j,mar){mar=mar||12;const inner=210-2*mar,avail=297-2*mar,css=invDocCss(),html=invoiceHtml(j,true);let z=1;
  try{const host=document.createElement('div');host.style.cssText='position:fixed;left:-20000px;top:0;width:'+inner+'mm;background:#fff;font-family:Arial,sans-serif';
    host.innerHTML='<style>'+css+'</style>'+html;document.body.appendChild(host);const iv=host.querySelector('.iv2')||host.querySelector('.inv');
    const h=iv?iv.getBoundingClientRect().height:0;host.remove();const av=avail*PDF_MM-6;if(h>av&&av/h>=0.62)z=av/h;}catch(e){}
  return '<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:'+mar+'mm}html,body{margin:0;background:#fff}body{font-family:Arial,sans-serif}'+css+
   '.iv2-seal,.iv2-ft,.iv2-bot{break-inside:avoid}'+(z<1?'.iv2,.inv{zoom:'+z.toFixed(4)+'}':'')+'</style></head><body>'+html+'</body></html>';}
