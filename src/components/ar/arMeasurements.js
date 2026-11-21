// Measures processed tracking frames, not screen refreshes or GPU execution time.
// No timers, observers, frame loops or unbounded history are created here.
export function createARMeasurements(now = () => performance.now()) {
  let enabled = false
  let started = 0
  let count = 0, detected = 0, totalMs = 0, maxMs = 0
  let last = null
  const reset = () => { started = now(); count = detected = totalMs = maxMs = 0 }
  return {
    setEnabled(value) {
      if (enabled === value) return
      enabled = value
      if (enabled) { reset(); last = null }
    },
    begin() { return enabled ? now() : null },
    end(start, found) {
      if (!enabled || start === null) return
      const elapsed = now() - start
      count += 1
      detected += found ? 1 : 0
      totalMs += elapsed
      maxMs = Math.max(maxMs, elapsed)
    },
    snapshot() {
      const elapsed = now() - started
      if (enabled && elapsed >= 1000) {
        last = {
          measuredAt: new Date().toISOString(),
          windowMs: Math.round(elapsed),
          trackingFps: +(count * 1000 / elapsed).toFixed(1),
          processingMeanMs: count ? +(totalMs / count).toFixed(1) : null,
          processingMaxMs: count ? +maxMs.toFixed(1) : null,
          detectedPercent: count ? Math.round(detected * 100 / count) : null,
          frames: count,
        }
        reset()
      }
      return last
    },
  }
}
