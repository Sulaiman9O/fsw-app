#!/usr/bin/env python3
"""Builds the Workshop test app (new workshop, no FSW data, local storage only).
- docs/garage/: app.css, app.js, version.json  -> the app downloads these to update itself (no reinstall)
- www/: loader index.html + a bundled copy of the same files (works offline on first start)"""
import pathlib,json,time,shutil
R=pathlib.Path(__file__).parent;ROOT=R.parent
v=int(time.strftime('%Y%m%d%H%M'));name=(R/'VERSION').read_text().strip()
css=(ROOT/'docs/app/app.css').read_text()+'\n'+(ROOT/'ops/ops.css').read_text()+'\n'+(R/'src/fresh.css').read_text()
import base64
def ff(fam,file,w,rng=''):
    b=base64.b64encode((R/'src/vendor/fonts'/file).read_bytes()).decode()
    return '@font-face{font-family:"%s";src:url(data:font/woff2;base64,%s) format("woff2");font-weight:%d;font-display:swap%s}\n'%(fam,b,w,(';unicode-range:'+rng) if rng else '')
css+='\n'+''.join(ff('Manrope','manrope-latin-%d-normal.woff2'%w,w) for w in (400,600,700,800))+''.join(ff('Tajawal','tajawal-arabic-%d-normal.woff2'%w,w,'U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF') for w in (400,500,700,800))+ff('SFBrand','manrope-latin-800-normal.woff2',400)+ff('SFBrand','tajawal-arabic-800-normal.woff2',400,'U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF')
import theme
css,nvars=theme.build(css);print('theme colours',nvars)
svg=(ROOT/'src/icons.svg').read_text()
js=(R/'src/vendor/gsap.min.js').read_text()+'\n'+'if(!window.__FB_TEST_CFG){'+(R/'src/vendor/firebase.js').read_text()+'\n}\n'+f'window.WS_V={v};window.WS_VN={json.dumps(name)};window.SF_LOGO={json.dumps((R/"src/vendor/shopflo-logo.svg").read_text().replace("#FFFFFF","currentColor"))};window.SF_MARK={json.dumps((R/"src/vendor/shopflo-mark.svg").read_text().replace("#FFFFFF","currentColor"))};document.body.insertAdjacentHTML("afterbegin",{json.dumps(svg)});\n'+'\n'.join((R/'src'/f).read_text() for f in ['data.js','cardb.js','core.js','store.js','sync.js','look.js','i18n_ar.js','i18n.js','ui.js','screens_work.js','screens_job.js','screens_more.js','screens_stock.js','screens_admin.js','screens_lists.js','screens_tour.js','screens_demo.js','screens_cars.js','screens_smart.js','recipes.js','motion.js','screens_secure.js','screens_press.js','boot.js'])
ver=json.dumps({'v':v,'name':name})
for d in [ROOT/'docs/garage',R/'www/app']:
    d.mkdir(parents=True,exist_ok=True);(d/'app.css').write_text(css);(d/'app.js').write_text(js);(d/'version.json').write_text(ver)
(R/'www/index.html').write_text((R/'src/loader.html').read_text())
# sign the update so the app only accepts code made by us (key lives outside the repo)
key=pathlib.Path.home()/'.config/garage/sign.pem'
if key.exists():
    from cryptography.hazmat.primitives import serialization,hashes
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
    import base64
    k=serialization.load_pem_private_key(key.read_bytes(),None)
    der=k.sign((str(v)+'\n'+css+'\n'+js).encode('utf-8'),ec.ECDSA(hashes.SHA256()))
    r,s_=decode_dss_signature(der);raw=r.to_bytes(32,'big')+s_.to_bytes(32,'big')
    (ROOT/'docs/garage/sig.json').write_text(json.dumps({'v':v,'sig':base64.b64encode(raw).decode()}))
    print('signed')
else:
    print('WARNING: no signing key at',key,'- phones with the new loader will NOT take this update')
print('built',name,v,len(js))
