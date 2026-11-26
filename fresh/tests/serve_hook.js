/* Run any test without a local web server: node -r ./serve_hook.js tXX.js
   Every browser context answers http://localhost:<PORT>/ from fresh/www (or WWW=dir) inside the browser itself. */
const path=require('path'),fs=require('fs');
const WWW=path.resolve(__dirname,process.env.WWW||'../www');
const MIME={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
const pw=require('playwright');
const serve=async r=>{let u=new URL(r.request().url()).pathname;if(u.endsWith('/'))u+='index.html';const f=path.join(WWW,decodeURIComponent(u));
  if(!f.startsWith(WWW)||!fs.existsSync(f)||fs.statSync(f).isDirectory())return r.fulfill({status:404,body:''});
  return r.fulfill({status:200,contentType:MIME[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)});};
const patchBrowser=b=>{const nc=b.newContext.bind(b);b.newContext=async(...a)=>{const c=await nc(...a);await c.route(/^http:\/\/(localhost|127\.0\.0\.1):\d+\//,serve);return c;};
  const np=b.newPage.bind(b);b.newPage=async(...a)=>{const c=await b.newContext(...a);const p=await c.newPage();return p;};return b;};
const launch=pw.chromium.launch.bind(pw.chromium);pw.chromium.launch=async(...a)=>patchBrowser(await launch(...a));
