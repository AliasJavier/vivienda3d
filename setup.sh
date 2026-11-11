#!/usr/bin/env bash
# Descarga Three.js r128 y sus cargadores de modelos a vendor/ para que la app funcione sin internet.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p vendor
get(){ # url destino
  if [ ! -s "$2" ]; then curl -fsSL -o "$2" "$1" && echo "Descargado $2"; else echo "$2 ya existe"; fi
}
get https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js vendor/three.min.js
get https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js vendor/GLTFLoader.js
get https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js vendor/OBJLoader.js
python3 build.py
