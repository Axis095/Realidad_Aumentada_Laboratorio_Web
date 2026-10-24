# Recursos de realidad aumentada

- `markers/*.svg` y `markers/*.patt`: patrones originales generados para este
  proyecto, con borde negro, patrón interior del 50 % y cuatro orientaciones.
  Su correspondencia con los instrumentos se define en `src/data/instruments.js`.
- `hiro.png`, `patt.hiro` y `camera_para.dat`: recursos de AR.js 3.4.8,
  conservados para calibración y compatibilidad con la demo inicial.
  Fuentes: https://github.com/AR-js-org/AR.js/tree/3.4.8/data
- Motor: `@ar-js-org/artoolkit5-js` 0.3.2, sin modificar el código del paquete.
  Fuente: https://github.com/AR-js-org/artoolkit5-js
  Se incluye su licencia distribuida en `LICENSE-ARToolkit.txt`.
- Three.js y qrcode se instalan como dependencias; conservan sus propias licencias
  en los paquetes correspondientes. Los GLB son los recursos entregados al proyecto.

Formato de los patrones: https://ar-js-org.github.io/AR.js-Docs/marker-based/
El QR no sustituye al patrón de seguimiento y no contiene datos personales.
