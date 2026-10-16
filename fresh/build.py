#!/usr/bin/env python3
"""Builds fresh/www/index.html: a brand-new workshop app (no FSW data). Local storage only, no sync."""
import pathlib
R=pathlib.Path(__file__).parent;ROOT=R.parent
css=(ROOT/'docs/app/app.css').read_text()+'\n'+(ROOT/'ops/ops.css').read_text()+'\n'+(R/'src/fresh.css').read_text()
svg=(ROOT/'src/icons.svg').read_text()
js='\n'.join((R/'src'/f).read_text() for f in ['data.js','core.js','ui.js','screens_work.js','screens_job.js','screens_more.js','screens_admin.js','screens_lists.js','boot.js'])
html=f'''<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#000"><title>Workshop</title>
<style>{css}</style></head><body>{svg}<div id="root"></div><div class="toast" id="toast" hidden></div>
<script>{js}</script></body></html>'''
(R/'www').mkdir(exist_ok=True);(R/'www/index.html').write_text(html)
print('fresh built',len(html))
