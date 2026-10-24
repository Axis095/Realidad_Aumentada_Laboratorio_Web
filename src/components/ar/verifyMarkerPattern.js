// ARToolkit can keep the previous identity while a square remains in place.
// Verify the actual pixels too, so replacing a card cannot reuse that identity.
export function readPatternTemplates(text, minCorrelation = 0.7) {
  const values = text.trim().split(/\s+/).map(Number)
  if (values.length !== 3072 || values.some(n => !Number.isFinite(n) || n < 0 || n > 255)) {
    throw new Error('El archivo de marcador no es válido.')
  }
  return [0, 1, 2, 3].map(rotation => {
    const pixels = values.slice(rotation * 768, rotation * 768 + 256)
    const mean = pixels.reduce((sum, n) => sum + n, 0) / 256
    const centered = pixels.map(n => n - mean)
    return { centered, norm: Math.sqrt(centered.reduce((sum, n) => sum + n * n, 0)), minCorrelation }
  })
}

export function matchesMarkerPixels(context, vertices, templates) {
  if (!vertices || vertices.length !== 4) return false
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = vertices
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3
  const determinant = dx1 * dy2 - dx2 * dy1
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1) return false
  const g = (sx * dy2 - dx2 * sy) / determinant
  const h = (dx1 * sy - sx * dy1) / determinant
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3
  const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3
  const left = Math.max(0, Math.floor(Math.min(x0, x1, x2, x3)))
  const top = Math.max(0, Math.floor(Math.min(y0, y1, y2, y3)))
  const right = Math.min(context.canvas.width, Math.ceil(Math.max(x0, x1, x2, x3)))
  const bottom = Math.min(context.canvas.height, Math.ceil(Math.max(y0, y1, y2, y3)))
  if (right - left < 16 || bottom - top < 16) return false
  const { data, width, height } = context.getImageData(left, top, right - left, bottom - top)
  const samples = []
  for (let row = 0; row < 16; row++) for (let col = 0; col < 16; col++) {
    // The inner pattern occupies half the marker width (standard pattRatio .5).
    const u = 0.25 + 0.5 * (col + 0.5) / 16, v = 0.25 + 0.5 * (row + 0.5) / 16
    const divisor = g * u + h * v + 1
    const x = Math.round((a * u + b * v + x0) / divisor) - left
    const y = Math.round((d * u + e * v + y0) / divisor) - top
    if (x < 0 || y < 0 || x >= width || y >= height) return false
    const i = (y * width + x) * 4
    samples.push((data[i] + data[i + 1] + data[i + 2]) / 3)
  }
  const mean = samples.reduce((sum, n) => sum + n, 0) / 256
  const centered = samples.map(n => n - mean)
  const norm = Math.sqrt(centered.reduce((sum, n) => sum + n * n, 0))
  if (norm < 160) return false
  return templates.some(template => template.norm > 0 &&
    centered.reduce((sum, n, i) => sum + n * template.centered[i], 0) / (norm * template.norm) >= template.minCorrelation)
}
