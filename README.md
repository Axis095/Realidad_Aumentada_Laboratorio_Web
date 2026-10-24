# Realidad_Aumentada_Laboratorio_Web
Desarrollo de un proyecto de realidad aumentada para un laboratorio.

## Ejecutar y comprobar

Desde esta carpeta (no desde `.pnpm-store`):

```sh
pnpm install
pnpm run dev
```

Para comprobar una versión antes de publicarla:

```sh
pnpm run build
pnpm run test:models
pnpm run test:ar
```

Las pruebas usan Microsoft Edge instalado, un perfil aislado y cámara simulada.
No abren la webcam real. Los tests sirven la compilación de `dist`; vuelve a
compilar después de editar. Las pruebas físicas en Android/iPhone siguen siendo
necesarias, especialmente con tarjetas enmicadas y teléfonos modestos.

## Catálogo de realidad aumentada

- `/ar`: catálogo de los 12 instrumentos finales, sin descargar GLB ni activar cámara.
- `/ar/beaker`, `/ar/probeta`, etc.: visor específico con cámara opcional y vista 3D alternativa.
- `/ar/tarjeta?instrumento=probeta`: selector, QR descargable y tarjeta imprimible del instrumento.

El catálogo está en `src/data/instruments.js`; también alimenta el Módulo 1.
Los diez instrumentos del módulo se mantienen. Los modelos finales adicionales
están disponibles en AR; los cuatro modelos antiguos no finales permanecen solo
en el Módulo 1. No se reproducen animaciones automáticamente.

### Preparar tarjetas para un evento

1. Publica el proyecto por HTTPS y abre `/ar/tarjeta`.
2. Elige el instrumento y confirma el dominio público. En local puedes pegar el
   dominio de tu despliegue; el formulario no comprueba que ese despliegue exista.
3. Comprueba el enlace desde un celular antes de imprimir.
4. Imprime en A4 al 100 %, conservando el borde negro y el margen blanco.
5. Escanea el QR, abre el navegador, activa la cámara y apunta al marcador de
   esa misma tarjeta. Prefiere enmicado mate y evita reflejos.

El QR es un enlace estable, no contiene el modelo ni datos de estudiantes.
Puedes sustituir el GLB sin reimprimir si conservas dominio, identificador y
marcador. Cada instrumento tiene su propio patrón en `public/ar/markers/`.
No intercambies ni modifiques sus SVG o `.patt` después de imprimir tarjetas.
Los diseños binarios originales están registrados en `scripts/ar-marker-patterns.mjs`.

El enlace antiguo `/ar/beaker` se conserva y acepta también el Hiro de la demo.
Hiro no activa otros instrumentos. La detección se limita al instrumento elegido:
apuntar a una tarjeta distinta no cambia de modelo automáticamente.

### Rendimiento y recuperación

Solo se carga el GLB elegido al pulsar un botón. Cambiar de instrumento, cerrar
o dejar la pestaña detiene la cámara y libera los recursos del visor. Las cargas
en curso se cancelan y los recursos que llegan tarde se descartan. Si falta un
modelo, se muestra un mensaje y se permite reintentar o seleccionar otro.

Los modelos se centran y ajustan al visor, pero no representan una escala física
calibrada. El vidrio usa transparencia ligera para mostrar la imagen real de la
cámara detrás del modelo. El modo ligero limita resolución y frecuencia del
seguimiento; la vista sin cámara solo renderiza al interactuar.

Las pruebas comprueban los 12 GLB, coincidencia QR/título/marcador, tarjetas A4,
rotación de patrones, rechazo de tarjetas diferentes, compatibilidad con Hiro,
recuperación de errores y cierre de cámara. No certifican rendimiento en un
dispositivo físico ni reconocimiento bajo cualquier condición de iluminación.

### Archivos que deben incluirse al desplegar

Incluye los archivos nuevos de `src/data`, `src/components/ar`, `public/models`
y `public/ar/markers`, además del resto de cambios de código. No subas
`node_modules`, `.pnpm-store` ni `test-results`. Vercel debe usar esta carpeta
como raíz, `pnpm run build` y salida `dist`; las rutas SPA usan `vercel.json`.
