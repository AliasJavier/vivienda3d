#!/usr/bin/env python3
"""Genera index.html juntando src/template.html, los scripts de src/js/ y el proyecto de ejemplo.

Uso:
  python3 build.py           # genera index.html

El proyecto de ejemplo está en src/ejemplo.json (solo geometría, sin imagen del plano).
Los planos nuevos se crean desde la propia app y se guardan en el navegador de cada uno.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'
JS_ORDER = ['core.js', 'viewer.js', 'exterior.js', 'vr.js', 'detect.js', 'plan.js', 'editor.js', 'app.js']


def seed():
    return json.loads((SRC / 'ejemplo.json').read_text(encoding='utf-8'))


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
