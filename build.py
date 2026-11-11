#!/usr/bin/env python3
"""Genera index.html juntando src/template.html, los scripts de src/js/ y el proyecto de ejemplo.

Uso:
  python3 build.py           # genera index.html

El proyecto de ejemplo (la vivienda Tipo 05) sale de src/plan_data.py, medido en píxeles
sobre plano/plano.png. Los planos nuevos se crean desde la propia app.
"""
import json, struct, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'
JS_ORDER = ['core.js', 'viewer.js', 'exterior.js', 'vr.js', 'detect.js', 'plan.js', 'editor.js', 'app.js']

sys.path.insert(0, str(SRC))
import plan_data as P  # noqa: E402


def png_size(path):
    with open(path, 'rb') as f:
        head = f.read(24)
    w, h = struct.unpack('>II', head[16:24])
    return w, h


def seed():
    w, h = png_size(ROOT / 'plano' / 'plano.png')
    walls = []
    for x in P.WALLS:
        ops = []
        for o in x['o']:
            q = {k: v for k, v in o.items() if k in ('s', 'e', 'kind', 'hinge', 'sill', 'top')}
            if 'into' in o:
                q['into'] = list(o['into'])
            ops.append(q)
        walls.append({'a': list(x['a']), 'b': list(x['b']), 't': x['t'],
                      'hMode': 'low' if x['h'] < 2 else 'full', 'o': ops})
    rooms = [{'id': r['id'], 'label': r['label'], 'm2': r['m2'], 'floor': r['floor'],
              'terrace': r.get('terrace', False), 'poly': [list(p) for p in r['poly']]} for r in P.ROOMS]
    closets = [{'r': list(c['r']), 'h': c['h'], 'kind': c['kind']} for c in P.CLOSETS]
    src = {'v': 2, 'img': {'w': w, 'h': h}, 'origin': [P.OX, P.OY],
           'scale': {'cotas': [], 'fixed': P.S}, 'H_INT': P.H_INT, 'H_DOOR': P.H_DOOR,
           'walls': walls, 'rooms': rooms, 'closets': closets}
    return {'name': 'Vivienda Tipo 05', 'image': 'plano/plano.png', 'src': src}


def main():
    tpl = (SRC / 'template.html').read_text(encoding='utf-8')
    js = '\n'.join((SRC / 'js' / n).read_text(encoding='utf-8') for n in JS_ORDER)
    js = js.replace('__SEED_JSON__', json.dumps(seed(), ensure_ascii=False, separators=(',', ':')))
    app = '(function(){\n"use strict";\n' + js + '\n})();'
    assert '/*__APP_JS__*/' in tpl, 'La plantilla no tiene la marca /*__APP_JS__*/'
    html = tpl.replace('/*__APP_JS__*/', app)
    (ROOT / 'index.html').write_text(html, encoding='utf-8')
    print(f"index.html generado ({len(html)//1024} KB)")


if __name__ == '__main__':
    main()
