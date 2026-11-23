// Single source for instrument names, files and educational content.
const instruments = [
  {
    "id": "beaker",
    "title": "Vaso de precipitados",
    "emoji": "🧪",
    "modelUrl": "/models/VasoBlender.glb",
    "description": "Recipiente cilíndrico de vidrio utilizado para contener líquidos y realizar reacciones químicas.",
    "use": "Se utiliza para mezclar sustancias, calentar soluciones y observar reacciones en el laboratorio.",
    "question": "¿Por qué sus marcas de volumen son aproximadas?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-01"
  },
  {
    "id": "probeta",
    "title": "Probeta graduada",
    "emoji": "⚗️",
    "modelUrl": "/models/Probeta.glb",
    "description": "Tubo cilíndrico graduado para medir volúmenes de líquidos con precisión.",
    "use": "Ideal para medir volúmenes exactos en experimentos químicos.",
    "question": "¿En qué se diferencia medir con una probeta de hacerlo con un vaso?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-02"
  },
  {
    "id": "balanza",
    "title": "Balanza Digital",
    "emoji": "⚖️",
    "modelUrl": "/models/digital_kitchen5M.glb",
    "description": "Instrumento electrónico para medir la masa de sustancias con alta precisión.",
    "use": "Esencial para pesar reactivos y productos en reacciones químicas.",
    "question": "¿Para qué utilizarías este instrumento?",
    "module1": true,
    "ar": false
  },
  {
    "id": "termo",
    "title": "Termómetro",
    "emoji": "🌡️",
    "modelUrl": "/models/Termometro.glb",
    "description": "Dispositivo para medir la temperatura de sustancias.",
    "use": "Se utiliza para controlar temperaturas en reacciones exotérmicas o endotérmicas.",
    "question": "¿Qué parte del termómetro debe estar en contacto con la sustancia?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-03"
  },
  {
    "id": "agitador",
    "title": "Agitador de Vidrio",
    "emoji": "🔬",
    "modelUrl": "/models/AgitadorVidrio.glb",
    "description": "Varilla de vidrio para mezclar soluciones manualmente.",
    "use": "Ayuda a disolver sólidos en líquidos y homogenizar mezclas.",
    "question": "¿Por qué conviene mezclar suavemente?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-04"
  },
  {
    "id": "espatula",
    "title": "Espátula",
    "emoji": "🔧",
    "modelUrl": "/models/blade5M.glb",
    "description": "Herramienta metálica para transferir sólidos en pequeñas cantidades.",
    "use": "Útil para medir y transferir polvos o cristales sin derramar.",
    "question": "¿Para qué utilizarías este instrumento?",
    "module1": true,
    "ar": false
  },
  {
    "id": "guantes",
    "title": "Guantes",
    "emoji": "🧤",
    "modelUrl": "/models/blue_nitrile5M.glb",
    "description": "Guantes resistentes a químicos para proteger las manos.",
    "use": "Protegen contra sustancias corrosivas y mantienen la higiene en el laboratorio.",
    "question": "¿Para qué utilizarías este instrumento?",
    "module1": true,
    "ar": false
  },
  {
    "id": "parrilla",
    "title": "Parrilla Eléctrica",
    "emoji": "🔥",
    "modelUrl": "/models/ParrillaFinal.glb",
    "description": "Plataforma calefactora para calentar recipientes de laboratorio.",
    "use": "Se utiliza para calentar mezclas a temperaturas controladas.",
    "question": "¿Qué precauciones tomarías antes de calentar un recipiente?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-05"
  },
  {
    "id": "molde",
    "title": "Molde para Jabones",
    "emoji": "🧼",
    "modelUrl": "/models/mintOrganizer5M.glb",
    "description": "Recipientes para dar forma a los jabones durante la solidificación.",
    "use": "Permiten crear jabones con formas específicas y facilitar su extracción.",
    "question": "¿Para qué utilizarías este instrumento?",
    "module1": true,
    "ar": false
  },
  {
    "id": "gafas",
    "title": "Lentes de Cristal de Protección",
    "emoji": "🕶️",
    "modelUrl": "/models/LentesFinal.glb",
    "description": "Este equipamiento recibe el nombre de gafas de seguridad o gafas de protección.",
    "use": "Proteger los ojos del trabajador de forma efectiva, garantizando su seguridad.",
    "question": "¿Por qué debemos proteger también los lados de los ojos?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-06"
  },
  {
    "id": "mortero",
    "title": "Mortero y pistillo",
    "emoji": "🥣",
    "modelUrl": "/models/MorteroYpistillo.glb",
    "description": "Recipiente y pieza de mano que permiten triturar sólidos.",
    "use": "Se utiliza para reducir el tamaño de partículas y facilitar mezclas.",
    "question": "¿Qué cambia en un sólido cuando lo trituramos?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-07"
  },
  {
    "id": "soporte",
    "title": "Soporte universal",
    "emoji": "🔬",
    "modelUrl": "/models/SoporteUniversal.glb",
    "description": "Base con una varilla que sostiene pinzas y otros accesorios.",
    "use": "Permite montar instrumentos de forma estable durante un experimento.",
    "question": "¿Por qué importa que la base sea estable?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-08"
  },
  {
    "id": "vidrio-reloj",
    "title": "Vidrio de reloj",
    "emoji": "🔎",
    "modelUrl": "/models/VidrioReloj.glb",
    "description": "Pieza circular de vidrio ligeramente cóncava.",
    "use": "Sirve para contener pequeñas muestras o cubrir un vaso de precipitados.",
    "question": "¿Qué ventajas tiene su forma cóncava?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-09"
  },
  {
    "id": "matraz-aforado",
    "title": "Matraz aforado",
    "emoji": "⚗️",
    "modelUrl": "/models/instruments/matraz-aforado.glb",
    "description": "Recipiente calibrado para contener un volumen determinado.",
    "use": "Permite preparar soluciones hasta la marca de aforo.",
    "question": "¿Por qué debemos observar la marca a la altura de los ojos?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-10"
  },
  {
    "id": "matraz-erlenmeyer",
    "title": "Matraz Erlenmeyer",
    "emoji": "⚗️",
    "modelUrl": "/models/instruments/matraz-erlenmeyer.glb",
    "description": "Recipiente de cuerpo cónico y cuello estrecho.",
    "use": "Facilita mezclar líquidos mediante movimientos circulares.",
    "question": "¿Cómo ayuda su forma a reducir las salpicaduras?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-11"
  },
  {
    "id": "matraz-decantacion",
    "title": "Embudo de decantación",
    "emoji": "⚗️",
    "modelUrl": "/models/matraz decantacion.glb",
    "description": "Recipiente con llave para separar líquidos inmiscibles.",
    "use": "Permite retirar por separado líquidos que forman capas.",
    "question": "¿Qué propiedades determinan cuál líquido queda abajo?",
    "module1": true,
    "ar": true,
    "markerCode": "LAB-12"
  }
]

export const INSTRUMENTS = Object.freeze(instruments.map(Object.freeze))
export const MODULE1_INSTRUMENTS = INSTRUMENTS.filter(item => item.module1)
export const AR_INSTRUMENTS = Object.freeze(INSTRUMENTS.filter(item => item.ar).map(item => Object.freeze({
  ...item,
  markerImage: `/ar/markers/${item.id}.svg`,
  markerPattern: `/ar/markers/${item.id}.patt`,
  cameraParameters: '/ar/camera_para.dat',
})))
export function getARInstrument(id) { return AR_INSTRUMENTS.find(item => item.id === id) }
export function instrumentPath(id) { return `/ar/${encodeURIComponent(id)}` }
export function cardPath(id) { return `/ar/tarjeta?instrumento=${encodeURIComponent(id)}` }

