// Bounded, opt-in measurements of animation renders, not RAF callbacks or GPU time.
// This collector never schedules work or causes a render.
export function createProcessMeasurements(now = () => performance.now()) {
  let enabled = false, playing = false, active = false
  let started = 0, frames = 0, totalMs = 0, maxMs = 0, last = null
  const resetWindow = () => { started = now(); frames = totalMs = maxMs = 0 }
  const snapshot = () => {
    if (active) {
      const elapsed = now() - started
      if (elapsed >= 1000) {
        last = {
          measuredAt: new Date().toISOString(), windowMs: Math.round(elapsed), frames,
          renderedFps: +(frames * 1000 / elapsed).toFixed(1),
          renderCpuMeanMs: frames ? +(totalMs / frames).toFixed(2) : null,
          renderCpuMaxMs: frames ? +maxMs.toFixed(2) : null,
        }
        resetWindow()
      }
    }
    return last
  }
  const sync = () => {
    const next = enabled && playing
    if (next === active) return
    if (!next) snapshot() // Freeze the last complete window, never dilute with idle time.
    active = next
    if (next) { last = null; resetWindow() }
  }
  return {
    setEnabled(value) { enabled = Boolean(value); sync() },
    setPlaying(value) { playing = Boolean(value); sync() },
    reset() { last = null; if (active) resetWindow() },
    begin() { return active ? now() : null },
    end(start) {
      if (!active || start === null) return
      const duration = now() - start
      frames++; totalMs += duration; maxMs = Math.max(maxMs, duration)
    },
    snapshot,
  }
}
