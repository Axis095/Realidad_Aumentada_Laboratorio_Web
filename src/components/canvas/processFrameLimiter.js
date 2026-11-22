// Keep deadlines on the original cadence instead of accumulating RAF lateness.
// Missed slots are skipped: never render a burst to catch up after a stall.
export function createProcessFrameLimiter(fps) {
  let interval = 1000 / fps
  let nextFrame = 0
  const tolerance = 0.01 // Timestamp rounding only, not a whole-frame allowance.
  return {
    reset(now, nextFps = fps) {
      fps = nextFps
      interval = 1000 / fps
      nextFrame = now + interval
    },
    shouldRender(now) {
      if (now + tolerance < nextFrame) return false
      const slots = Math.floor((now + tolerance - nextFrame) / interval) + 1
      nextFrame += slots * interval
      return true
    },
  }
}
