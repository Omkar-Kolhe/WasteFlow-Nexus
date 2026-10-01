import { cubicPoint, cubicTangent, TAU, type Vec2 } from '@/lib/geometry'
import { VEHICLE_MODEL } from '@/config/network'
import { C, rgbaStr, type RGB } from '../palette'
import type { RenderContext } from '../renderContext'
import type { NetworkGeometry } from '../network'
import type { Vehicle } from '@/types'

export interface VehicleState {
  vehicle: Vehicle
  linkId: string
  /** Normalised position along the route curve. */
  t: number
  dir: 1 | -1
  /** Remaining dwell in seconds (loading, queueing, tipping). */
  dwell: number
  length: number
  /** True while the corridor is blocked — the unit holds position. */
  halted: boolean
}

const FUEL_COLOR: Record<string, RGB> = {
  electric: C.signal,
  cng: C.flow,
  hybrid: C.flow,
  diesel: C.dim,
}

const pos: Vec2 = { x: 0, y: 0 }
const tan: Vec2 = { x: 0, y: 0 }

/** Build fleet state and park each unit on its assigned corridor. */
export function initVehicleStates(geo: NetworkGeometry, fleet: Vehicle[]): VehicleState[] {
  const states: VehicleState[] = []
  for (const vehicle of fleet) {
    const link = geo.linkById[vehicle.routeId]
    if (!link) continue
    const length = Math.hypot(link.curve.p1.x - link.curve.p0.x, link.curve.p1.y - link.curve.p0.y) * 1.06 || 1
    const returning = vehicle.status === 'returning'
    states.push({
      vehicle,
      linkId: link.id,
      t: vehicle.phase,
      dir: returning ? -1 : 1,
      dwell: VEHICLE_MODEL.dwellSeconds[vehicle.status] ?? 0,
      length,
      halted: link.status === 'blocked',
    })
  }
  return states
}

/**
 * VEHICLE LAYER — discrete units moving through the network.
 * Motion is bound to the corridor: a unit on a congested link moves slowly, and a
 * unit on a blocked corridor holds position. Status drives dwell beats, so
 * COLLECTING, WAITING and AT FACILITY units behave differently on screen.
 */
export function updateVehicles(rc: RenderContext, states: VehicleState[]) {
  const { dt, geo, reducedMotion } = rc
  const motion = reducedMotion ? 0.25 : 1

  for (const s of states) {
    const link = geo.linkById[s.linkId]
    if (!link) continue
    s.halted = link.status === 'blocked'

    if (s.halted || s.dwell > 0) {
      if (s.dwell > 0) s.dwell -= dt
      continue
    }

    const stateFactor = link.status === 'congested' ? 0.5 : link.status === 'busy' ? 1.05 : 1
    const speedT = ((VEHICLE_MODEL.worldUnitsPerSecond * stateFactor) / s.length) * s.vehicle.pace * motion
    s.t += speedT * s.dir * dt

    if (s.t >= 1) {
      s.t = 1
      if (s.dir === 1) {
        s.dir = -1
        s.dwell = s.vehicle.status === 'at-facility' ? 3.4 : 1.8
      }
    } else if (s.t <= 0) {
      s.t = 0
      s.dir = 1
      s.dwell = s.vehicle.status === 'collecting' ? 3 : 0.9
    }
  }
}

export function drawVehicles(rc: RenderContext, states: VehicleState[]) {
  const { ctx, geo, camera, layers, activeId, activeLinks, selectedRouteId, time, reducedMotion } = rc
  if (!layers.vehicles) return
  const inv = 1 / camera.scale

  for (const s of states) {
    const link = geo.linkById[s.linkId]
    if (!link) continue
    const connected = activeLinks.has(link.id) || link.id === selectedRouteId
    const focus = activeId || selectedRouteId ? (connected ? 1 : 0.16) : 1

    const t = Math.max(0, Math.min(1, s.t))
    cubicPoint(link.curve, t, pos)
    cubicTangent(link.curve, t, tan)
    const angle = Math.atan2(tan.y, tan.x) + (s.dir === -1 ? Math.PI : 0)
    const len = Math.hypot(tan.x, tan.y) || 1
    const nx = -tan.y / len
    const ny = tan.x / len
    const lateral = link.width * 0.6 + 2.4 * inv
    const x = pos.x + nx * lateral
    const y = pos.y + ny * lateral

    const color = FUEL_COLOR[s.vehicle.fuel] ?? C.dim
    const body = 9
    const width = 3.8

    ctx.save()
    ctx.globalAlpha = focus
    ctx.translate(x, y)
    ctx.rotate(angle)

    ctx.fillStyle = rgbaStr(C.base, 0.95)
    ctx.strokeStyle = rgbaStr(color, s.halted ? 0.5 : 0.85)
    ctx.lineWidth = 1 * inv
    ctx.beginPath()
    ctx.roundRect(-body / 2, -width / 2, body, width, 1.1 * inv)
    ctx.fill()
    ctx.stroke()

    // Load bar: how full this unit is right now.
    const fill = Math.max(0.06, s.vehicle.utilization)
    ctx.fillStyle = rgbaStr(color, 0.3 + fill * 0.6)
    ctx.fillRect(-body / 2 + 0.9 * inv, -width / 2 + 0.9 * inv, (body - 1.8) * fill, width - 1.8 * inv)

    ctx.fillStyle = rgbaStr(C.ink, 0.9)
    ctx.beginPath()
    ctx.arc(body / 2 - 0.7 * inv, 0, 0.7 * inv, 0, TAU)
    ctx.fill()
    ctx.restore()

    if (s.halted) {
      // Held unit marker: dotted tether and a stationary pulse.
      const pulse = reducedMotion ? 0.5 : (Math.sin(time * 3.4) + 1) / 2
      ctx.strokeStyle = rgbaStr(C.critical, 0.35 + pulse * 0.3)
      ctx.lineWidth = 1 * inv
      ctx.beginPath()
      ctx.arc(x, y, (6 + pulse * 2.4) * inv, 0, TAU)
      ctx.stroke()
    } else if (s.dwell > 0 && !reducedMotion) {
      const pulse = (Math.sin(time * 4) + 1) / 2
      ctx.strokeStyle = rgbaStr(color, 0.2 + pulse * 0.25)
      ctx.lineWidth = 1 * inv
      ctx.beginPath()
      ctx.arc(x, y, (5.5 + pulse * 2.2) * inv, 0, TAU)
      ctx.stroke()
    }
  }
}
