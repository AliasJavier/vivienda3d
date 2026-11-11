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

## Exterior: urbanización y calle

En la vista 3D, el botón **Exterior** rodea la vivienda de un barrio en movimiento, para que por las ventanas y desde las terrazas se vea algo real:

- **Lado de la urbanización:** jardín, piscina con gente nadando y tomando el sol, piscina infantil, pista de pádel con jugadores, zona de juegos con niños y los otros bloques cerrando el recinto.
- **Lado de la calle:** aceras con peatones (uno pasea al perro), carril bici con un ciclista, coches aparcados, avenida de dos calzadas con mediana arbolada, coches y un autobús circulando, bloques enfrente y una obra con su grúa.
- **A lo lejos:** más bloques, grúas y cerros.

En el panel *Suelos y paredes › Exterior* eliges la planta en la que está la vivienda y hacia qué lado quedan la piscina y la calle. En automático, la piscina queda frente a la terraza más grande y la calle frente a la otra terraza.

Es un decorado genérico de barrio nuevo de Madrid, no una reproducción de la parcela real.

## Realidad virtual (Meta Quest 2)

El botón **Entrar en VR** aparece en la vista 3D cuando el navegador tiene gafas disponibles. Entras en la vivienda a escala real, con tu altura real.

| Mando | Acción |
|---|---|
| Gatillo apuntando al suelo | Aparece un aro; al soltar, te teletransportas ahí |
| Gatillo apuntando a un mueble | Lo agarras y lo arrastras por el suelo (respeta los choques) |
| Joystick del mando que agarra | Gira el mueble de 15° en 15° |
| Joystick izquierdo | Andar hacia donde miras |
| Joystick derecho | Girar a saltos de 30° |

En la muñeca izquierda ves la estancia en la que estás y sus m². Dentro de las gafas no hay sombras dinámicas, para mantener la fluidez. Si va a tirones, apaga el exterior.

El navegador de las gafas solo permite VR en páginas `https://` o en `http://localhost`. Hay dos formas de llegar:

**Con cable USB (todo queda en tu ordenador).** Necesitas el modo desarrollador activado en las gafas y `adb` en Windows.

```powershell
adb reverse tcp:8000 tcp:8000     # en Windows, con las gafas conectadas y ./serve.sh en marcha
```

Después abre `http://localhost:8000` en el navegador de las gafas.

**Sin cable, con GitHub Pages.** El repositorio incluye `.github/workflows/pages.yml`. Actívalo en GitHub en *Settings › Pages › Source: GitHub Actions* y abre en las gafas `https://USUARIO.github.io/vivienda3d/`. Lo que subas a `proyectos/` queda público.

**Llevar tu proyecto a las gafas.** Lo guardado en el navegador del ordenador no viaja solo. Exporta el proyecto, deja el `.json` en la carpeta `proyectos/` y abre en las gafas:

```
http://localhost:8000/?p=proyectos/mi-casa.json
```

Se importa la primera vez y las siguientes abre el que ya tiene.

## Atajos en el 3D

- `Ctrl+Z` / `Ctrl+Y`: deshacer y rehacer cambios de muebles y materiales.
- `Ctrl+D`: duplicar el mueble seleccionado. `R`: girarlo. `Supr`: quitarlo.
- **Foto**: descarga la vista actual en PNG.
- Las estancias interiores tienen techo. Solo se ve desde dentro, así que no estorba en la vista aérea.

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
src/js/viewer.js      escena 3D: suelos, techos, muros, huecos, muebles, cámara, choques, panel 3D
src/js/exterior.js    entorno exterior animado: urbanización, calle, gente y tráfico
src/js/vr.js          modo VR (WebXR): mandos, teletransporte, andar, mover muebles
src/js/detect.js      detección de muros, huecos y estancias sobre la imagen
src/js/plan.js        datos del plano (píxeles) -> planta en metros, escala, DXF
src/js/editor.js      editor 2D del plano
src/js/app.js         proyectos, vistas Plano/3D, exportar/importar y arranque
src/plan_data.py      la vivienda de ejemplo (Tipo 05) medida a mano sobre plano/plano.png
plano/                plano de ejemplo y su DXF
proyectos/            proyectos exportados para abrir con ?p=proyectos/archivo.json
```

Si cambias algo en `src/`, ejecuta `python3 build.py` y recarga el navegador.
En la consola del navegador, `__vivienda` da acceso al editor y al proyecto abierto para depurar.

## Límites conocidos

- La detección automática funciona mejor con planos limpios: muros negros o a doble línea y muebles en gris. Con planos escaneados, torcidos o muy cargados de cotas encontrará menos cosas, así que toca corregir más.
- Las estancias abiertas entre sí (salón con vestíbulo, por ejemplo) salen juntas. Sepáralas con *Estancia a mano*.
- No admite `.glb` con compresión Draco.
- Las medidas IKEA son de ikea.com/es (septiembre de 2026). Compruébalas antes de comprar.
