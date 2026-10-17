#!/usr/bin/env python3
"""Builds the Workshop test app (new workshop, no FSW data, local storage only).
- docs/garage/: app.css, app.js, version.json  -> the app downloads these to update itself (no reinstall)
- www/: loader index.html + a bundled copy of the same files (works offline on first start)"""
import pathlib,json,time,shutil
R=pathlib.Path(__file__).parent;ROOT=R.parent
v=int(time.strftime('%Y%m%d%H%M'));name=(R/'VERSION').read_text().strip()
css=(ROOT/'docs/app/app.css').read_text()+'\n'+(ROOT/'ops/ops.css').read_text()+'\n'+(R/'src/fresh.css').read_text()
svg=(ROOT/'src/icons.svg').read_text()
js=(R/'src/vendor/gsap.min.js').read_text()+'\n'+f'window.WS_V={v};window.WS_VN={json.dumps(name)};document.body.insertAdjacentHTML("afterbegin",{json.dumps(svg)});\n'+'\n'.join((R/'src'/f).read_text() for f in ['data.js','cardb.js','core.js','ui.js','screens_work.js','screens_job.js','screens_more.js','screens_stock.js','screens_admin.js','screens_lists.js','screens_tour.js','screens_demo.js','screens_cars.js','screens_smart.js','motion.js','boot.js'])
ver=json.dumps({'v':v,'name':name})
for d in [ROOT/'docs/garage',R/'www/app']:
    d.mkdir(parents=True,exist_ok=True);(d/'app.css').write_text(css);(d/'app.js').write_text(js);(d/'version.json').write_text(ver)
(R/'www/index.html').write_text((R/'src/loader.html').read_text())
print('built',name,v,len(js))
