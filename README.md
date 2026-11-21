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
pnpm run test:process
```

Las pruebas usan Microsoft Edge instalado, un perfil aislado y cámara simulada.
No abren la webcam real. Los tests sirven la compilación de `dist`; vuelve a
compilar después de editar. Las pruebas físicas en Android/iPhone siguen siendo
necesarias, especialmente con tarjetas enmicadas y teléfonos modestos.

## Prototipo del proceso en el Módulo 2

En `/modulo/2`, después de la explicación de la etapa, abre **Abrir prototipo 3D**.
El visor opcional contiene **Llenado**, **Vertido** y **Agitación**, con botones
**Reproducir**, **Pausar**, **Reiniciar** y un control de avance para observar
cualquier instante sin movimiento continuo. Cada escena termina sin avanzar
automáticamente a la siguiente. No modifica el progreso de las cinco etapas ni
el reto de secuencia; la explicación ilustrada sigue disponible sin abrir el 3D.

Implementación y límites:

- Three.js y el visor se importan al abrirlo. Solo descarga `VasoBlender.glb` y
  `AgitadorVidrio.glb` (aprox. 1,2 MiB de modelos); no usa cámara ni descarga
  balanza, guantes, HDR ni modelos de los otros módulos.
- Los GLB originales no se reexportan ni se modifican. Se usan instancias propias,
  independientes de las cachés del Módulo 1 y AR. El vaso se reutiliza para ambos
  recipientes. Se conserva la deformación original del líquido, ajustando su
  escala desproporcionada únicamente en la copia de esta escena.
- Omite los números de texto extruido y agrupa marcas estáticas en memoria.
  Vidrio simple sin transmisión física, sombras dinámicas ni motor de fluidos.
- Un solo canvas para las tres escenas; hasta 20 FPS/DPR 1 en Ligero y 30 FPS/DPR
  máximo 1,35 en Completo. En pausa solo redibuja por una acción o un cambio de
  tamaño. No hay reproducción automática, incluso con movimiento reducido.
- Salir de la pestaña o dejar el panel fuera de pantalla pausa sin reanudar solo.
  Cerrar, cambiar de módulo o fallar libera recursos y cancela descargas. Errores
  de modelo/WebGL permiten reintentar o continuar con la explicación sin 3D.
- Es una representación esquemática: no calcula dosis, temperatura, volúmenes,
  viscosidad real ni finalización química/curado. Azul identifica la solución
  alcalina ya preparada; amarillo identifica el aceite, no colores reales
  obligatorios. El vertido y el cambio de aspecto son ilustrativos.

Las pruebas de `test:process` verifican carga bajo demanda, las tres escenas,
pausa/reinicio/avance, fin de reproducción, perfiles, anchos 320/390/1366 px,
cancelación, recuperación y ausencia de renders continuos en pausa. No sustituyen
la comprobación de fluidez y temperatura en un teléfono físico.

### Diagnóstico del prototipo

Debajo de los controles, abre **Diagnóstico del prototipo**, abre el visor y
reproduce una escena al menos dos segundos. Puedes pausarla antes de pulsar
**Copiar informe del prototipo**. Indica opcionalmente el teléfono y pega el
informe en el chat junto con lo que observaste. Repite en Llenado, Vertido y
Agitación; compara Ligero y Completo sin confundir sus límites de 20/30 FPS.

El panel está cerrado por defecto, no inicia el 3D y solo sondea una vez por
segundo cuando está abierto y la pestaña visible. No añade renders. Cuenta
renders de animación, no callbacks RAF; pausas, avances manuales y cambios de
tamaño no se cuentan como reproducción. CPU mide la actualización de la escena
y el envío del render, no la ejecución de la GPU ni toda la aplicación.

Al pausar, terminar o cerrar conserva la última ventana completa de medición.
Cambiar de escena/calidad, reiniciar o volver a abrir el visor evita mezclar
mediciones anteriores; al reanudar comienza una ventana nueva. Si no hay un
segundo de reproducción medido aparece «—», no un resultado inventado.

El informe identifica módulo, escena, avance, perfil efectivo, resolución,
tiempos de inicio/carga (descarga más preparación, posiblemente desde caché),
bytes de cada GLB, llamadas/triángulos del último render y errores. Incluye
navegador, pantalla y conexión estimada cuando esté disponible. No graba imágenes,
no mide temperatura ni RAM total, no persiste datos ni los envía a un servidor.
Si el portapapeles falla, se puede copiar manualmente el texto visible. Los GLB
originales y el panel AR no cambian.

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

### Diagnóstico durante las pruebas en celulares

En cada visor `/ar/:instrumento`, abre **Diagnóstico de rendimiento**, debajo
de los botones de cámara. Está cerrado por defecto y no activa la cámara ni
descarga modelos. Abre el panel, activa la experiencia, encuadra la tarjeta y
espera unos segundos. Indica opcionalmente el teléfono y pulsa **Copiar informe
de diagnóstico**. Puedes pegar el texto en el chat; si el navegador bloquea el
portapapeles, selecciona el informe visible y cópialo manualmente.

- Solo mide continuamente con el panel abierto y la pestaña visible; actualiza
  la interfaz una vez por segundo, sin otro bucle de animación ni dependencias.
- FPS significa ciclos de seguimiento procesados (límite 15 Ligero / 24 Completo),
  no refresco de pantalla ni FPS de la cámara. La vista sin cámara es bajo demanda.
- CPU medio/máximo incluye análisis y envío del render, no ejecución GPU.
  La detección es el porcentaje de ciclos con marcador reconocido, no confianza.
- Carga GLB incluye descarga y preparación; inicio incluye espera del permiso.
  El tamaño GLB no indica memoria RAM. Las llamadas/triángulos son del último
  render: pueden ser cero si el marcador no está visible.
- Conserva la última muestra al cerrar o fallar la experiencia; reiniciar limpia
  la medición. Cambiar de instrumento limpia también el informe y el teléfono.
- El informe contiene fecha, instrumento, navegador, pantalla, conexión estimada
  si está disponible, perfil efectivo de la sesión y errores. No contiene imágenes,
  identificadores de cámara ni mediciones de temperatura/RAM total. No se persiste
  ni se envía a un servidor. Solo se copia al portapapeles por acción del usuario.

### Archivos que deben incluirse al desplegar

Incluye los archivos nuevos de `src/data`, `src/components/ar`, `public/models`
y `public/ar/markers`, además del resto de cambios de código. No subas
`node_modules`, `.pnpm-store` ni `test-results`. Vercel debe usar esta carpeta
como raíz, `pnpm run build` y salida `dist`; las rutas SPA usan `vercel.json`.
