#!/usr/bin/env bash
# Sirve la app en http://localhost:8000 (ábrelo desde el navegador de Windows).
cd "$(dirname "$0")"
PORT="${1:-8001}"
echo "Abre http://localhost:${PORT} en tu navegador (Ctrl+C para parar)"
python3 -m http.server "$PORT" --bind 127.0.0.1
