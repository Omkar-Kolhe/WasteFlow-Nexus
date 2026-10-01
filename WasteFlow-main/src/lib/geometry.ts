/**
 * Dependency-free 2D math for the digital-twin canvas engine.
 * Written to avoid per-frame allocations: the render loop runs at 60fps.
 */

export interface Vec2 {
  x: number
  y: number
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface CubicCurve {
  p0: Vec2
  c1: Vec2
  c2: Vec2
  p1: Vec2
}

export const v2 = (x = 0, y = 0): Vec2 => ({ x, y })

export function cubicPoint(curve: CubicCurve, t: number, out: Vec2 = { x: 0, y: 0 }): Vec2 {
  const mt = 1 - t
  const a = mt * mt * mt
  const b = 3 * mt * mt * t
  const c = 3 * mt * t * t
  const d = t * t * t
  out.x = a * curve.p0.x + b * curve.c1.x + c * curve.c2.x + d * curve.p1.x
  out.y = a * curve.p0.y + b * curve.c1.y + c * curve.c2.y + d * curve.p1.y
  return out
}

export function cubicTangent(curve: CubicCurve, t: number, out: Vec2 = { x: 0, y: 0 }): Vec2 {
  const mt = 1 - t
  const a = 3 * mt * mt
  const b = 6 * mt * t
  const c = 3 * t * t
  out.x = a * (curve.c1.x - curve.p0.x) + b * (curve.c2.x - curve.c1.x) + c * (curve.p1.x - curve.c2.x)
  out.y = a * (curve.c1.y - curve.p0.y) + b * (curve.c2.y - curve.c1.y) + c * (curve.p1.y - curve.c2.y)
  return out
}

/**
 * Build a smooth link between two anchor points.
 * Curve bulge is derived from the perpendicular of the connection so networks
 * fan out naturally instead of drawing straight spaghetti.
 */
export function linkCurve(a: Vec2, b: Vec2, bow = 0.18): CubicCurve {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.hypot(dx, dy)
  const nx = -dy / (dist || 1)
  const ny = dx / (dist || 1)
  const offset = dist * bow
  return {
    p0: { x: a.x, y: a.y },
    c1: { x: a.x + dx * 0.34 + nx * offset, y: a.y + dy * 0.34 + ny * offset },
    c2: { x: a.x + dx * 0.68 + nx * offset, y: a.y + dy * 0.68 + ny * offset },
    p1: { x: b.x, y: b.y },
  }
}

export function expandBounds(b: Bounds, pad: number): Bounds {
  return { minX: b.minX - pad, minY: b.minY - pad, maxX: b.maxX + pad, maxY: b.maxY + pad }
}

export function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(bx - ax, by - ay)
}

export const TAU = Math.PI * 2
