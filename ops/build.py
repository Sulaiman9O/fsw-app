#!/usr/bin/env python3
"""Builds ops/www/index.html: the full FSW app (docs/app) + the Ops room section, self-contained (no code updates from GitHub)."""
import pathlib,json
R=pathlib.Path(__file__).parent;ROOT=R.parent
css=(ROOT/'docs/app/app.css').read_text()+'\n'+(R/'ops.css').read_text()
app=(ROOT/'docs/app/app.js').read_text()
ops=(R/'ops.js').read_text()
svg_marker='document.body.insertAdjacentHTML'
html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>FSW Ops</title>
<style>{css}</style></head><body>
<script>{ops}</script>
<script>{app}</script></body></html>'''
(R/'www').mkdir(exist_ok=True);(R/'www/index.html').write_text(html)
print('ops built',len(html))
