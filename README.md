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
pnpm run test:learning
```

Las pruebas usan Microsoft Edge instalado, un perfil aislado y cámara simulada.
No abren la webcam real. Los tests sirven la compilación de `dist`; vuelve a
compilar después de editar. Las pruebas físicas en Android/iPhone siguen siendo
necesarias, especialmente con tarjetas enmicadas y teléfonos modestos.

## Prototipo del proceso en el Módulo 2

En `/modulo/2`, después de la explicación de la etapa, abre **Abrir prototipo 3D**.
El visor opcional muestra únicamente las escenas de la etapa seleccionada:

| Etapa | Escenas disponibles |
| --- | --- |
| Preparar aceite | Llenado ilustrativo del vaso |
| Preparar NaOH | Medición de agua; disolución de NaOH con termómetro |
| Mezclar | Vertido de solución alcalina; agitación |
| Observar traza | Formación de emulsión |
| Moldear | Vertido en moldes |

El filtrado, la medición del aceite y el curado no están animados; se explican en
el contenido y en las notas del visor. La emulsión no sustituye la comprobación
de la temperatura o de la traza. Hay botones **Reproducir**, **Pausar**, **Reiniciar**
y un control de avance para observar
cualquier instante sin movimiento continuo. Cada escena termina sin avanzar
automáticamente a la siguiente. No modifica el progreso de las cinco etapas ni
el reto de secuencia; la explicación ilustrada sigue disponible sin abrir el 3D.
La zona visual muestra el esquema **o** el visor, nunca ambos a la vez. Cambiar
de etapa cierra el visor y cancela su carga/reproducción.

Implementación y límites:

- Three.js y el visor se importan al abrirlo. Llenado descarga `VasoBlender.glb`
  (aprox. 1,2 MB). Vertido y agitación descargan su GLB optimizado al seleccionarlos
  (118.788 y 159.828 bytes). Agua y disolución ocupan 163.960 y 187.372 bytes;
  emulsión y moldeo, 680.444 y 703.580 bytes. Abrir las etapas 2–5 no descarga
  el vaso de llenado. No se precargan otras escenas.
- Los GLB originales no se reexportan ni se modifican. Se usan instancias propias,
  independientes de las cachés del Módulo 1 y AR. Llenado conserva la deformación
  del líquido ajustada en memoria. Las otras seis escenas reproducen los clips de
  Blender, con su duración original y control de avance reversible.
- Las copias omiten números de texto extruido y agrupan marcas estáticas.
  Vidrio simple sin transmisión física, sombras dinámicas ni motor de fluidos.
- Un solo canvas para las escenas de la etapa; hasta 20 FPS/DPR 1 en Ligero y 30 FPS/DPR
  máximo 1,35 en Completo. En pausa solo redibuja por una acción o un cambio de
  tamaño. No hay reproducción automática, incluso con movimiento reducido.
- El limitador conserva la cadencia aunque un callback llegue tarde. Omite
  intervalos perdidos sin acumular retrasos ni dibujar ráfagas para recuperarlos.
- Salir de la pestaña o dejar el panel fuera de pantalla pausa sin reanudar solo.
  Cambiar de animación libera la anterior y cancela descargas pendientes; el
  recurso de llenado se conserva mientras el visor está abierto. Cerrar o cambiar
  de módulo libera todo. Un fallo de escena permite reintentar o elegir otra.
- Es una representación esquemática: no calcula dosis, temperatura, volúmenes,
  viscosidad real ni finalización química/curado. El vaso vertedor contiene la
  solución alcalina preparada; el receptor contiene aceite. El movimiento y los
  colores son ilustrativos.

Las pruebas de `test:process` verifican carga bajo demanda, las cinco etapas,
pausa/reinicio/avance, fin de reproducción, perfiles, anchos 320/390/1366 px,
cancelación, recuperación y ausencia de renders continuos en pausa. No sustituyen
la comprobación de fluidez y temperatura en un teléfono físico.

### Prueba de rendimiento del prototipo

Debajo de los controles, abre **Prueba de rendimiento**, abre el visor y
reproduce una escena con el panel abierto. Espera a que aparezca **Resultado
disponible** (al menos dos segundos de reproducción); preferiblemente deja
terminar la escena y pulsa **Copiar resultado**. Indica opcionalmente el teléfono.
Repite en las escenas de cada etapa; compara Ligero y Completo sin confundir
sus límites de 20/30 FPS. El panel indica la duración de la última muestra:
los valores no son un promedio de toda la escena.

No se puede exportar un resultado sin fotogramas medidos. Si ocurre un fallo,
**Copiar informe de error** permite exportarlo aunque no haya FPS. El formato
`diagnosticVersion: 2` identifica `resultType: measurement` o `error`. La copia
visible se retira cuando cambia la muestra o el estado de la prueba, para evitar
confundirla con un resultado nuevo; el contenido ya copiado al portapapeles no
se actualiza automáticamente.

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

## Moléculas 3D del Módulo 3

En `/modulo/3`, selecciona **Hidróxido de sodio** o **Glicerol** y pulsa
**Explorar … en 3D**. Los otros modelos conservan su esquema educativo. Arrastra,
usa los botones de giro/zoom/centrado o pulsa **Volver al esquema**. Cambiar de
molécula cierra y libera el visor; no abre ni descarga el siguiente modelo solo.
El progreso, las explicaciones y el quiz siguen disponibles sin activar el 3D.

- Copias optimizadas: NaOH 30.124 bytes; glicerol 31.424 bytes, con cuatro grupos
  de instancias para los átomos y enlaces. No requieren decodificadores externos.
- Render bajo demanda, sin autorrotación, damping ni RAF continuo. DPR 1 en
  Ligero y hasta 1,35 en Completo. Un único canvas por visor activo.
- Manejo de errores, cancelación y reintento; las pruebas incluyen cierre,
  cambio rápido de modelo, contexto perdido y anchos de 320/1366 px.

### Conservación y preparación de recursos

Los ocho originales usados se conservan en `public/models/molecules` y
`public/models/process`. Las versiones web están en `public/models/optimized`.
`manifest.json` registra tamaños y SHA-256 de fuentes y resultados.

Para regenerar únicamente las copias: `pnpm run assets:learning`. El script usa
la herramienta glTF Transform ya instalada, comprueba que las fuentes no cambian,
elimina números extruidos y restos de líquido sin animar, agrupa graduaciones,
simplifica el vidrio y remuestrea las curvas sin eliminar sus canales. Las cuatro
escenas nuevas también reducen geometría fuera del navegador con Meshoptimizer,
sin añadir decodificadores a la web. No debe
aplicarse automáticamente a nuevas escenas sin revisar sus nombres y contenido.

Para pruebas aisladas en Vercel, usa la rama `feat/mobile-learning-models` como
Preview. Mantén `main` como rama de producción y no promociones la Preview hasta
validar la versión en celulares físicos.

## Catálogo de realidad aumentada

- `/ar`: catálogo de los 12 instrumentos finales, sin descargar GLB ni activar cámara.
- `/ar/beaker`, `/ar/probeta`, etc.: visor específico con cámara opcional y vista 3D alternativa.
- `/ar/tarjeta?instrumento=probeta`: selector, QR descargable y tarjeta imprimible del instrumento.

El catálogo está en `src/data/instruments.js`; también alimenta el Módulo 1.
El Módulo 1 incluye los 16 materiales de laboratorio disponibles: los diez anteriores
y mortero y pistillo, soporte universal, vidrio de reloj, matraz aforado, matraz
Erlenmeyer y embudo de decantación. Los 12 instrumentos finales también están
disponibles en AR. Las moléculas y escenas del proceso pertenecen a sus módulos.
Cada GLB se descarga al seleccionarlo, sin precargar todo el catálogo ni reproducir
animaciones automáticamente. El progreso anterior se conserva sobre el nuevo total
de 16 instrumentos; los seis nuevos quedan pendientes de explorar.

Los matraces aforado y Erlenmeyer utilizan copias en `public/models/instruments`.
Sus números exportados estaban separados del vidrio: `pnpm assets:instruments`
ajusta la geometría de las inscripciones a la superficie y recalcula sus normales.
El proceso se ejecuta al preparar los archivos, sin trabajo adicional por fotograma.
Los GLB originales se conservan; `manifest.json` registra sus hashes y los de las copias.
El catálogo compartido utiliza estas correcciones tanto en el Módulo 1 como en AR.

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
de diagnóstico**. Si el navegador bloquea el
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
