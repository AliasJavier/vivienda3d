# Vivienda 3D

Convierte el plano de una vivienda (una imagen o un PDF) en un modelo 3D que puedes recorrer, texturizar y amueblar.
Puedes tener tantas viviendas como quieras. Todas se guardan en el navegador.

Está hecho con [Three.js](https://threejs.org/) r128 y JavaScript sin frameworks. El resultado es un único `index.html`.

## Arrancar (WSL)

```bash
cd ~/vivienda3d
./setup.sh      # descarga Three.js a vendor/ y genera index.html
./serve.sh      # sirve en http://localhost:8000
```

Abre **http://localhost:8000** en el navegador de Windows.
Entra siempre por la misma dirección y el mismo puerto, porque lo guardado va ligado a ellos.

## Flujo de trabajo

1. **Proyectos › + Nuevo plano.** Sube una imagen (PNG o JPG) o un PDF del plano a escala. Para el PDF hace falta internet, porque usa pdf.js desde CDN.
2. **Detección automática.** La app busca:
   - muros, tanto rellenos como dibujados a doble línea, incluidos los de 45°;
   - huecos de puerta, con el sentido de apertura sacado del arco dibujado;
   - ventanas, reconocibles por las líneas dentro del muro;
   - zonas cerradas, que se convierten en estancias.

   Esto da un **borrador**: revísalo siempre.
3. **Corrige en la vista Plano** con la barra de herramientas:
   - *Muro*: clic en el inicio y clic en el final. Se ajusta solo a otros muros y a ángulos de 45°.
   - *Puerta, Ventana, Ventanal, Pta. cristal*: clic sobre un muro.
   - *Estancia*: clic dentro de una zona cerrada. *Estancia a mano*: clic en las esquinas, útil para zonas abiertas.
   - *Armario* y *Pilar*: arrastrar.
   - *Seleccionar*: toca un elemento para editar sus medidas en el panel. Si está seleccionado, se puede arrastrar. `Supr` lo borra y `Ctrl+Z` deshace.
4. **Escala.** Hay dos formas:
   - selecciona dos o tres estancias y escribe los m² que pone el plano;
   - usa *Medir una cota*: dos clics sobre una medida conocida y escribes los metros.

   La app combina todas las referencias y avisa si alguna se aleja más de un 4 %.
5. **Ver en 3D.** Tienes lo de siempre: fotos como textura, muebles con medidas propias, catálogo IKEA, modelos `.glb`/`.obj`, choques, paseo en primera persona y medición.

Las alturas se pueden ajustar: el techo y las puertas para todo el proyecto, y la de cada muro por separado. Un muro que solo separa una terraza del exterior se convierte solo en un peto de 1,05 m.

## Guardado

- **Automático:** cada proyecto se guarda en el navegador (IndexedDB) con su imagen, sus fotos y sus modelos.
- **Exportar proyecto:** descarga un `.json` con todo dentro, incluidas la imagen, las fotos y los modelos. Se carga con **Importar** en cualquier otro navegador u ordenador.
- **Plano DXF:** descarga la planta en DXF R12, en metros y con una capa por elemento (muros, tabiques, puertas, ventanas, estancias…).
- Los diseños `.json` de la versión anterior se pueden importar: se aplican al proyecto que tengas abierto.

## Estructura

```
index.html            app generada (no la edites a mano)
build.py              junta src/template.html + src/js/*.js + el proyecto de ejemplo -> index.html
setup.sh / serve.sh   descarga Three.js y genera / servidor local
vendor/               Three.js r128 y sus cargadores GLTF/OBJ (si faltan, se cargan desde la CDN)
src/template.html     HTML y CSS
src/js/core.js        utilidades e IndexedDB
src/js/viewer.js      escena 3D: suelos, muros, huecos, muebles, cámara, choques, panel 3D
src/js/detect.js      detección de muros, huecos y estancias sobre la imagen
src/js/plan.js        datos del plano (píxeles) -> planta en metros, escala, DXF
src/js/editor.js      editor 2D del plano
src/js/app.js         proyectos, vistas Plano/3D, exportar/importar y arranque
src/plan_data.py      la vivienda de ejemplo (Tipo 05) medida a mano sobre plano/plano.png
plano/                plano de ejemplo y su DXF
```

Si cambias algo en `src/`, ejecuta `python3 build.py` y recarga el navegador.
En la consola del navegador, `__vivienda` da acceso al editor y al proyecto abierto para depurar.

## Límites conocidos

- La detección automática funciona mejor con planos limpios: muros negros o a doble línea y muebles en gris. Con planos escaneados, torcidos o muy cargados de cotas encontrará menos cosas, así que toca corregir más.
- Las estancias abiertas entre sí (salón con vestíbulo, por ejemplo) salen juntas. Sepáralas con *Estancia a mano*.
- No admite `.glb` con compresión Draco.
- Las medidas IKEA son de ikea.com/es (septiembre de 2026). Compruébalas antes de comprar.
