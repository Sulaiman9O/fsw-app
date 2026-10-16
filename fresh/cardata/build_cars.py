import json,re
exec(open('gcc.py').read())
base=json.load(open('base.json'))
def norm(n):
    n=n.strip()
    def w(x):
        if re.fullmatch(r'[A-Z]{4,}',x): return x.capitalize()
        return x
    n=re.sub(r'[A-Za-z]+',lambda m:w(m.group(0)),n)
    n=n.replace('-CLASS','-Class').replace(' SERIES',' Series')
    return n
key=lambda n:re.sub(r'[^a-z0-9]','',n.lower().replace('class',''))
junk=re.compile(r'^(L|LP|LPS)\d{3,4}$|^\d{3,4}$(?<!86)|^MB1\d0$|^SK\d\d$|^CP\d')
mk=[]
allmk=ORDER+[m for m in base if m not in ORDER]
for M in allmk:
    if M not in base and M not in POP and M not in EXTRA: continue
    names=[];seen=set()
    def add(n):
        k=key(n)
        if not k or k in seen: return
        seen.add(k);names.append(n)
    for n in POP.get(M,[]): add(n)
    for n in EXTRA.get(M,[]): add(n)
    for n,y1,y2 in sorted(base.get(M,[]),key=lambda x:-x[2]):
        nn=norm(n)
        if junk.match(nn.replace(' ','')) and M not in('TANK',): continue
        add(nn)
    rest=sorted(names[len(POP.get(M,[])):],key=str.lower)
    pop=[n for n in POP.get(M,[])]
    disp=NAME.get(M,M.title())
    mk.append([disp,AR.get(M,''),pop,[n for n in names if n not in pop and n in rest] and sorted([n for n in names if n not in pop],key=str.lower)])
eng={}
for k,L in E.items():
    M,mo=k.split('|');disp=NAME.get(M,M.title())
    out=[]
    for e in L:
        if '(check)' in e or '?' in e: continue
        p=e.split('|');lab=p[0];a=int(p[1]) if len(p)>1 and p[1] else 0;b=int(p[2]) if len(p)>2 and p[2] else 0
        out.append([lab,a,b] if a or b else [lab])
    eng[disp+'|'+mo]=out
js='const CARDB='+json.dumps({'mk':mk,'eng':eng},ensure_ascii=False,separators=(',',':'))+';\n'
open('cars.js','w').write(js)
print(len(mk),'makes',sum(len(m[2])+len(m[3]) for m in mk),'models',len(eng),'models with engines',sum(len(v) for v in eng.values()),'engines',len(js)//1024,'KB')
t=[m for m in mk if m[0]=='Toyota'][0];print(t[2][:10],t[3][:40])
