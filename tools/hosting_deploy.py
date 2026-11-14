"""Deploy /home/claude/fsw-app/hosting to a Firebase Hosting site with the service account in ~/.config/garage/firebase-sa.json.
Usage: python3 hosting_deploy.py <site-id>   (rewrite /f/** -> /f/index.html)"""
import sys, json, time, base64, gzip, hashlib, os, urllib.request
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
SITE = sys.argv[1]; ROOT = '/home/claude/fsw-app/hosting'
sa = json.load(open(os.path.expanduser('~/.config/garage/firebase-sa.json')))
b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b'=').decode()
now = int(time.time())
hdr = b64(json.dumps({'alg': 'RS256', 'typ': 'JWT'}).encode()); cl = b64(json.dumps({'iss': sa['client_email'], 'scope': 'https://www.googleapis.com/auth/firebase.hosting https://www.googleapis.com/auth/cloud-platform', 'aud': 'https://oauth2.googleapis.com/token', 'iat': now, 'exp': now + 3600}).encode())
key = serialization.load_pem_private_key(sa['private_key'].encode(), None)
sig = b64(key.sign((hdr + '.' + cl).encode(), padding.PKCS1v15(), hashes.SHA256()))
def req(url, data=None, method=None, token=None, raw=None, ctype='application/json'):
    h = {'Content-Type': ctype}
    if token: h['Authorization'] = 'Bearer ' + token
    body = raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
    r = urllib.request.Request(url, data=body, headers=h, method=method or ('POST' if body is not None else 'GET'))
    try:
        with urllib.request.urlopen(r, timeout=120) as f: t = f.read(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e: raise SystemExit(f'{e.code} {url}\n{e.read()[:800]!r}')
tok = req('https://oauth2.googleapis.com/token', raw=('grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + hdr + '.' + cl + '.' + sig).encode(), ctype='application/x-www-form-urlencoded')['access_token']
API = 'https://firebasehosting.googleapis.com/v1beta1'
v = req(f'{API}/sites/{SITE}/versions', {'config': {'rewrites': [{'glob': '/f/**', 'path': '/f/index.html'}], 'headers': [{'glob': '**', 'headers': {'Cache-Control': 'no-cache', 'X-Robots-Tag': 'noindex'}}]}}, token=tok)
files = {}; blobs = {}
for dp, _, fs in os.walk(ROOT):
    for fn in fs:
        p = os.path.join(dp, fn); g = gzip.compress(open(p, 'rb').read(), mtime=0); h = hashlib.sha256(g).hexdigest()
        files['/' + os.path.relpath(p, ROOT)] = h; blobs[h] = g
pf = req(f"{API}/{v['name']}:populateFiles", {'files': files}, token=tok)
for h in pf.get('uploadRequiredHashes', []): req(pf['uploadUrl'] + '/' + h, raw=blobs[h], token=tok, ctype='application/octet-stream')
req(f"{API}/{v['name']}?update_mask=status", {'status': 'FINALIZED'}, method='PATCH', token=tok)
rel = req(f"{API}/sites/{SITE}/releases?versionName={v['name']}", {}, token=tok)
print('released', rel.get('name'), 'files', list(files), '→ https://' + SITE + '.web.app/')
