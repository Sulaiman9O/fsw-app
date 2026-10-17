"""Make light mode and the Indigo colour theme from the dark CSS.
Every colour in the CSS becomes a variable (--kN). The dark Red values stay as they are;
light mode and Indigo get new values worked out from each colour and where it is used
(text, background, border, shadow). Invoice and sticker CSS (white paper) are left alone."""
import re, colorsys

COL = re.compile(r'#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|rgba?\([^()]*\)')
ACCENT_VARS = ('--red', '--orange', '--ok', '--bad', '--warn', '--red2', '--v')
KEEP_HUE = {'--ok', '--bad', '--warn'}          # status colours keep their meaning in every theme
FG_VARS = {'--white', '--text', '--muted', '--dim'}
BD_VARS = {'--line', '--line2'}
INDIGO = 0.638   # #2a49f4 (blue)
VIOLET = 0.73    # #7c3aed
NAVY = 0.70      # dark backgrounds get a navy tint in Indigo


def parse(c):
    c = c.strip()
    if c.startswith('#'):
        h = c[1:]
        if len(h) in (3, 4):
            h = ''.join(x * 2 for x in h)
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        a = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
        return r, g, b, a
    n = re.findall(r'[\d.]+%?', c)
    if len(n) < 3:
        return None
    vals = []
    for x in n[:3]:
        vals.append(float(x[:-1]) * 2.55 if x.endswith('%') else float(x))
    a = n[3] if len(n) > 3 else '1'
    a = float(a[:-1]) / 100 if a.endswith('%') else float(a)
    return vals[0], vals[1], vals[2], a


def fmt(r, g, b, a):
    r, g, b = (max(0, min(255, round(v))) for v in (r, g, b))
    if a >= 0.999:
        return '#%02x%02x%02x' % (r, g, b)
    return 'rgba(%d,%d,%d,%s)' % (r, g, b, ('%.3f' % a).rstrip('0').rstrip('.'))


def hls(c):
    r, g, b, a = c
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return h, l, s, a


def rgb(h, l, s, a):
    r, g, b = colorsys.hls_to_rgb(h % 1, max(0, min(1, l)), max(0, min(1, s)))
    return r * 255, g * 255, b * 255, a


def indigo(c, keep):
    h, l, s, a = hls(c)
    if keep:
        return c
    if s > 0.3 and (h < 0.045 or h > 0.94):            # red family -> blue
        return rgb(INDIGO, l * 0.98, min(1, s * 1.0), a)
    if s > 0.3 and 0.045 <= h < 0.12:                   # orange -> violet
        return rgb(VIOLET, l * 0.95, s * 0.85, a)
    if s <= 0.3 and l < 0.35:                           # dark greys -> navy tint
        return rgb(NAVY, l * 1.08, 0.32 if l < 0.2 else 0.2, a)
    if s <= 0.3 and l < 0.8:
        return rgb(NAVY, l, 0.1, a)
    return c


def light(c, role):
    h, l, s, a = hls(c)
    neutral = s < 0.15 or l < 0.03 or l > 0.97
    if role == 'sh':                                    # shadows and glows
        if neutral:
            return rgb(h, 0, 0, a * 0.18) if l < 0.5 else rgb(h, 0, 0, a * 0.06)
        return rgb(h, l, s, a * 0.55)
    if neutral:
        if a < 0.999 and l < 0.01:
            return rgb(h, 0, 0, a * 0.75 if a >= 0.4 else a * 0.6)   # black overlays and the screen behind popups
        if role == 'fg' and l < 0.15 and a > 0.9:
            return c                                    # dark text was already on a light/coloured spot
        if role == 'fg':
            nl = 0.1 if l > 0.9 else max(0.08, min(0.75, 1.02 - l))
        elif role == 'bd':
            nl = max(0.62, min(0.93, 1.0 - l * 0.75))
        else:  # background
            if l <= 0.055:
                nl = 0.955
            elif l <= 0.4:
                nl = max(0.82, min(1.0, 1.06 - (l - 0.05) * 1.25))
            else:
                nl = 1.0 - l * 0.9
        if a < 0.999 and l > 0.9:                       # white haze on dark -> dark haze on light
            return rgb(h, 0.05, s, a * 0.7)
        return rgb(h, nl, s * 0.8, a)
    # coloured
    if role == 'fg':
        return rgb(h, min(l, 0.42), min(1, s * 1.05), a)
    if role == 'bd':
        return rgb(h, 1 - l * 0.55 if l < 0.4 else l, s * 0.7 if l < 0.4 else s, a)
    if l < 0.3:                                         # dark tints (cards, gradients) -> pale tints
        return rgb(h, 0.93 - l * 0.4, min(1, s * 1.2), a)
    return c


def role_of(prop):
    p = prop.strip().lower()
    if p in ('color', 'fill', 'caret-color', '-webkit-text-fill-color', 'stroke'):
        return 'fg'
    if p.startswith('border') or p.startswith('outline'):
        return 'bd'
    if 'shadow' in p or p == 'filter':
        return 'sh'
    if p in FG_VARS:
        return 'fg'
    if p in BD_VARS:
        return 'bd'
    return 'bg'


def build(css):
    keys = {}          # (role, keep, literal) -> name
    vals = []          # (name, dark, darkIndigo, light, lightIndigo)
    masked = []

    def mask(m):
        masked.append(m.group(0))
        return '\x00%d\x00' % (len(masked) - 1)
    css = re.sub(r'url\([^)]*\)', mask, css)

    def var_for(lit, role, keep):
        c = parse(lit)
        if c is None:
            return lit
        k = (role, keep, fmt(*c))
        if k not in keys:
            name = '--k%d' % len(keys)
            keys[k] = name
            ind = indigo(c, keep)
            vals.append((name, fmt(*c), fmt(*ind), fmt(*light(c, role)), fmt(*light(ind, role))))
        return 'var(%s)' % keys[k]

    out = []
    pos = 0
    for m in re.finditer(r'([^{}]*)\{([^{}]*)\}', css):
        sel, body = m.group(1), m.group(2)
        out.append(css[pos:m.start(2)])
        pos = m.end(2)
        last = sel.split('{')[-1]
        if re.search(r'\.inv\b|\.wstk|@font-face', last) or re.search(r'html\.m-light|html\.t-indigo', last):
            out.append(body)
            continue
        decls = body.split(';')
        accent_bg = any(re.match(r'\s*background', d) and (re.search('|'.join(re.escape(v) for v in ACCENT_VARS), d) or any(
            (lambda c: c and hls(c)[2] > 0.35 and 0.25 < hls(c)[1] < 0.8 and c[3] > 0.6)(parse(x)) for x in COL.findall(d))) for d in decls)
        nd = []
        for d in decls:
            if ':' not in d or not COL.search(d):
                nd.append(d)
                continue
            prop, val = d.split(':', 1)
            role = role_of(prop)
            keep = prop.strip() in KEEP_HUE

            def rep(mm):
                lit = mm.group(0)
                c = parse(lit)
                if role == 'fg' and accent_bg and c:
                    return lit                          # text on a coloured button keeps its colour
                return var_for(lit, role, keep)
            nd.append(prop + ':' + COL.sub(rep, val))
        out.append(';'.join(nd))
    out.append(css[pos:])
    css = ''.join(out)
    css = re.sub('\x00(\\d+)\x00', lambda m: masked[int(m.group(1))], css)

    root = ':root{' + ';'.join('%s:%s' % (n, d) for n, d, _, _, _ in vals) + '}'
    ti = 'html.t-indigo{' + ';'.join('%s:%s' % (n, i) for n, d, i, _, _ in vals if i != d) + '}'
    ml = 'html.m-light{color-scheme:light;' + ';'.join('%s:%s' % (n, l) for n, d, _, l, _ in vals if l != d) + '}'
    mli = 'html.m-light.t-indigo{' + ';'.join('%s:%s' % (n, li) for n, d, i, l, li in vals if li != l) + '}'
    return root + '\n' + ti + '\n' + ml + '\n' + mli + '\n' + css, len(vals)
