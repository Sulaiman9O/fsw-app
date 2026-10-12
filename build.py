#!/usr/bin/env python3
"""Builds docs/app (the live app files) from src/. Run after any change in src/."""
import json, time, pathlib
R = pathlib.Path(__file__).parent
js = (R/'src/app.js').read_text().replace('__SVG__', json.dumps((R/'src/icons.svg').read_text()))
(R/'docs/app').mkdir(parents=True, exist_ok=True)
(R/'docs/app/app.js').write_text(js)
(R/'docs/app/app.css').write_text((R/'src/app.css').read_text())
v = int(time.strftime('%Y%m%d%H%M'))
(R/'docs/app/version.json').write_text(json.dumps({'v': v}))
print('built version', v)
