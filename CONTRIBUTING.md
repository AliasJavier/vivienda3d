# Cómo está hecho

## Datos de un proyecto

Cada proyecto guarda dos bloques:

- **`src`**: el plano, en **píxeles de la imagen**. Es lo que edita la vista Plano.
  - `walls`: `a`, `b` (eje), `t` (grosor), `hMode` (`auto` | `full` | `low`), `ext` (prolongación de cada extremo) y `o` (huecos).
    Cada hueco lleva `s` y `e` (distancia desde `a`), `kind` (`door`, `glassdoor`, `window` o `glass`), `hinge` (`start` o `end`), `side` (`1` o `-1`, respecto a la normal del muro) y, opcionalmente, `sill` y `top` en metros.
  - `rooms`: `label`, `m2` (lo que pone el plano, opcional), `floor`, `terrace` y `poly`.
  - `closets`: `r` (rectángulo), `h` y `kind` (`closet` o `pillar`).
  - `scale`: `cotas` (`a`, `b`, `m`) y `fixed` (px por metro puesto a mano).
  - `origin`, `H_INT` y `H_DOOR`.
- **`design`**: lo del 3D. Contiene los materiales por superficie, los muebles (en metros), las referencias a fotos y si los choques están activados.

`planFromSrc()` (en `plan.js`) convierte `src` a la planta en metros que usa `viewer.js` (`loadPlan`). La escala sale de `scaleInfo()`: es la mediana de las cotas y de las estancias que tienen m² escritos, salvo que se haya fijado a mano.

## Detección (`detect.js`)

1. Marca como "tinta" los píxeles más oscuros que un umbral. Por defecto es unos 100, así que los muebles en gris quedan fuera.
2. Rellena el interior de los muros dibujados a doble línea. Para eso busca tramos blancos cortos encerrados entre dos líneas en horizontal, en vertical y a 45°, y huecos blancos cerrados y estrechos.
3. Hace una apertura morfológica para quitar textos y líneas finas.
4. Extrae bandas horizontales y verticales. Lo que sobra se analiza con PCA: si es alargado y oblicuo, es un muro diagonal.
5. Une tramos colineales. Si el hueco entre ellos tiene tamaño de puerta, lo convierte en hueco.
6. Resuelve los encuentros en T y en L. Prolonga los extremos sueltos hasta el muro cercano solo si se ve el arco de una puerta.
7. Marca como ventanas los tramos de muro con tres o más líneas a lo ancho.
8. Decide la bisagra y el lado de cada puerta buscando su arco y su hoja dibujados.
9. Para las estancias, dibuja los muros (sin huecos) en un lienzo, rellena cada zona cerrada y sigue su contorno.

## Ejemplo incluido

La vivienda Tipo 05 sale de `src/plan_data.py`, medida a mano en píxeles sobre `plano/plano.png`. Al arrancar por primera vez, la app la crea como primer proyecto y recupera el diseño guardado por la versión anterior, si lo había.
