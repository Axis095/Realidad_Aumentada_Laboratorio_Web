import { test, expect } from '@playwright/test'
import { createProcessFrameLimiter } from '../../src/components/canvas/processFrameLimiter.js'

test('maintains 20/30 FPS with 60/90/120 Hz callbacks and timestamp jitter', () => {
  for (const fps of [20, 30]) for (const hz of [60, 90, 120]) {
    const limiter = createProcessFrameLimiter(fps)
    limiter.reset(0)
    const renders = []
    for (let frame = 1; frame <= hz * 10; frame++) {
      // Alternating early/late callbacks reproduce the old lost-interval bug.
      const now = frame * 1000 / hz + (frame % 2 ? -0.2 : 0.2)
      if (limiter.shouldRender(now)) renders.push(now)
    }
    expect(renders.length).toBe(fps * 10)
    for (let i = 1; i < renders.length; i++) {
      expect(renders[i] - renders[i - 1]).toBeLessThanOrEqual(1000 / fps + 1000 / hz + 0.5)
    }
  }
})

test('skips stalled frames without catch-up bursts and resets on resume or quality change', () => {
  const limiter = createProcessFrameLimiter(20)
  limiter.reset(0)
  expect(limiter.shouldRender(49)).toBe(false)
  expect(limiter.shouldRender(50)).toBe(true)
  expect(limiter.shouldRender(50)).toBe(false)
  expect(limiter.shouldRender(5000)).toBe(true)
  expect(limiter.shouldRender(5000)).toBe(false)
  expect(limiter.shouldRender(5016)).toBe(false)
  expect(limiter.shouldRender(5050)).toBe(true)
  limiter.reset(9000)
  expect(limiter.shouldRender(9016)).toBe(false)
  expect(limiter.shouldRender(9050)).toBe(true)
  limiter.reset(10000, 30)
  expect(limiter.shouldRender(10020)).toBe(false)
  expect(limiter.shouldRender(10034)).toBe(true)
  limiter.reset(11000, 20)
  expect(limiter.shouldRender(11034)).toBe(false)
  expect(limiter.shouldRender(11050)).toBe(true)
})
