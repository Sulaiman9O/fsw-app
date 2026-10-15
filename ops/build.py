#!/usr/bin/env python3
"""Builds ops/www/index.html (FSW Ops test app) with the main app's stylesheet inlined."""
import base64,json,pathlib,re
R=pathlib.Path(__file__).parent; ROOT=R.parent
css=(ROOT/'docs/app/app.css').read_text()
svg=(ROOT/'src/icons.svg').read_text()
EM='data:image/png;base64,'+base64.b64encode((ROOT/'src/assets/emblem.png').read_bytes()).decode()
extra=(R/'ops.css').read_text()
js=(R/'ops.js').read_text().replace('__EMBLEM__',EM)
html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>FSW Ops</title>
<style>{css}</style><style>{extra}</style></head><body>{svg}<div id="root"></div><div class="toast" id="toast" hidden></div>
<script>{js}</script></body></html>'''
(R/'www').mkdir(exist_ok=True);(R/'www/index.html').write_text(html)
print('ops built',len(html))
