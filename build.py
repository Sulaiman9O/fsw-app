#!/usr/bin/env python3
"""Builds docs/app (the live app files) from src/. Run after any change in src/."""
import json, time, pathlib
R = pathlib.Path(__file__).parent
js = None  # built below once the version name is known
(R/'docs/app').mkdir(parents=True, exist_ok=True)
b64 = lambda p: __import__('base64').b64encode((R/p).read_bytes()).decode()
css = (R/'src/app.css').read_text().replace('__F_MILL__', b64('src/assets/millburn.woff2')).replace('__F_RUBIK__', b64('src/assets/rubik.woff2'))
(R/'docs/app/app.css').write_text(css)
src_js = (R/'src/app.js').read_text().replace('__LOGO__', b64('src/assets/logo.png')).replace('__EMBLEM__', b64('src/assets/emblem.png')).replace('__SVG__', json.dumps((R/'src/icons.svg').read_text()))
v = int(time.strftime('%Y%m%d%H%M'))
# human version: src/VERSION holds MAJOR.MINOR.PATCH; each build bumps PATCH
maj, mi, pa = (R/'src/VERSION').read_text().strip().split('.')
name = f'{maj}.{mi}.{int(pa)+1}'
(R/'src/VERSION').write_text(name + '\n')
(R/'docs/app/version.json').write_text(json.dumps({'v': v, 'name': name}))
js = 'window.FSW_APP_NAME=' + json.dumps(name) + ';\n' + src_js.replace('__SVG__', json.dumps((R/'src/icons.svg').read_text()))
(R/'docs/app/app.js').write_text(js)
print('built version', name, v)
