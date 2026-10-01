import { cubicPoint, cubicTangent, TAU, type Vec2 } from '@/lib/geometry'
import { C, FLOW_TIER_ALPHA, emissionColor, rgbaStr } from '../palette'
import type { RenderContext } from '../renderContext'
import type { LinkGeo } from '../network'

const pA: Vec2 = { x: 0, y: 0 }
const pB: Vec2 = { x: 0, y: 0 }
const tan: Vec2 = { x: 0, y: 0 }

/**
 * FLOW LAYER — the network's circulation, driven entirely by `RouteFlow`.
 *
 * Encoding, all from data:
 *   stroke weight      → tonnage
 *   particle density   → tonnage (PARTICLE_MODEL.tonnesPerParticle)
 *   particle speed     → tonnage, throttled by route state
 *   particle size      → tonnage band (LOW / MEDIUM / HIGH)
 *   colour             → material stream, or CO₂e intensity in emission mode
 *   congestion casing  → route state (busy / congested / blocked)
 *   reroute highlight  → active or simulated diversion corridor
 */
export function drawRoutes(rc: RenderContext) {
  const { ctx, geo, time, dt, layers, reducedMotion, selectedRouteId, hoveredRouteId, rerouteState } = rc
  const motionScale = reducedMotion ? 0.25 : 1
  const showFlow = layers.flow

  const isRerouteActive =
    rerouteState &&
    (rerouteState.status === 'simulated' || rerouteState.status === 'applied') &&
    rerouteState.plan
  const allocationMap = new Map<string, number>()
  if (isRerouteActive && rerouteState.plan) {
    for (const alloc of rerouteState.plan.allocations) {
      allocationMap.set(alloc.routeId, alloc.allocatedT)
    }
  }

  for (const link of geo.links) {
    const path = () => {
      ctx.beginPath()
      ctx.moveTo(link.curve.p0.x, link.curve.p0.y)
      ctx.bezierCurveTo(
        link.curve.c1.x, link.curve.c1.y,
        link.curve.c2.x, link.curve.c2.y,
        link.curve.p1.x, link.curve.p1.y,
      )
    }

    const focus = selectionFocus(rc, link)
    const isSelected = link.id === selectedRouteId
    const isHovered = link.id === hoveredRouteId
    const inEmissions = layers.emissions && link.emissionIntensity > 0.1
    const baseColor = inEmissions ? emissionColor(link.emissionIntensity) : link.color
    const isDiverted = allocationMap.has(link.id)
    const allocatedT = allocationMap.get(link.id) ?? 0
    const blocked = link.status === 'blocked' || (isRerouteActive && link.id === rerouteState.plan?.blockedRouteId)

    ctx.lineCap = 'round'

    // ── casing: soft glow scaled by magnitude ────────────────
    if (showFlow) {
      path()
      ctx.strokeStyle = rgbaStr(isDiverted ? C.signal : baseColor, (0.05 + link.magnitude * 0.045) * focus)
      ctx.lineWidth = link.width * (isDiverted ? 3.2 : 2.6)
      ctx.stroke()
    }

    // ── congestion / state casing ───────────────────────────
    if (showFlow && !inEmissions && link.status !== 'normal') {
      path()
      const stateColor = blocked ? C.critical : link.status === 'congested' ? C.warn : C.flow
      ctx.strokeStyle = rgbaStr(stateColor, (blocked ? 0.35 : 0.13) * focus)
      ctx.lineWidth = link.width * (blocked ? 1.6 : 1.3)
      if (blocked) {
        ctx.save()
        ctx.setLineDash([9, 7])
        ctx.lineDashOffset = time * 6 * motionScale
        ctx.stroke()
        ctx.restore()
      } else {
        ctx.stroke()
      }
    }

    // ── reroute diversion casing ────────────────────────────
    if (showFlow && isDiverted) {
      path()
      ctx.save()
      ctx.strokeStyle = rgbaStr(C.signal, 0.38 * focus)
      ctx.lineWidth = link.width * 2.8
      ctx.stroke()

      ctx.setLineDash([10, 8])
      ctx.lineDashOffset = -time * 28 * motionScale
      ctx.strokeStyle = rgbaStr(C.signal, 0.85 * focus)
      ctx.lineWidth = Math.max(1.4, link.width * 0.9)
      ctx.stroke()
      ctx.restore()
    }

    // ── core line ───────────────────────────────────────────
    path()
    if (blocked) {
      ctx.strokeStyle = rgbaStr(C.critical, 0.55 * focus)
      ctx.lineWidth = Math.max(1.2, link.width * 0.8)
    } else if (isDiverted) {
      ctx.strokeStyle = rgbaStr(C.signal, 0.9 * focus)
      ctx.lineWidth = link.width * 1.15
    } else if (showFlow) {
      const tierAlpha = FLOW_TIER_ALPHA[link.tier]
      ctx.strokeStyle = rgbaStr(baseColor, (0.09 + link.magnitude * 0.14) * tierAlpha * focus)
      ctx.lineWidth = link.width
    } else {
      ctx.strokeStyle = rgbaStr(C.ink, 0.035)
      ctx.lineWidth = link.width * 0.5
    }
    ctx.stroke()

    // ── selected / hovered corridor ─────────────────────────
    if (showFlow && (isSelected || isHovered)) {
      path()
      ctx.save()
      ctx.setLineDash([8, 10])
      ctx.lineDashOffset = -time * (isSelected ? 34 : 22) * motionScale
      ctx.strokeStyle = rgbaStr(isSelected ? C.signal : C.ink, isSelected ? 0.85 : 0.45)
      ctx.lineWidth = Math.max(1.2, link.width * (isSelected ? 0.7 : 0.5))
      ctx.stroke()
      ctx.restore()

      if (isSelected) {
        path()
        ctx.strokeStyle = rgbaStr(C.signal, 0.18)
        ctx.lineWidth = link.width * 3.4
        ctx.stroke()
      }
    }

    if (!showFlow) continue

    // ── flow particles ──────────────────────────────────────
    const tierAlpha = FLOW_TIER_ALPHA[link.tier]
    const particleColor = isDiverted ? C.signal : baseColor
    for (const p of link.particles) {
      const speedMult = isDiverted ? 1.4 : 1
      p.t += p.speed * dt * motionScale * speedMult
      if (p.t > 1.06) p.t -= 1.12

      const t = p.t < 0 ? p.t + 1 : p.t
      if (t < 0 || t > 1) continue

      cubicPoint(link.curve, t, pA)
      cubicTangent(link.curve, t, tan)
      const len = Math.hypot(tan.x, tan.y) || 1
      const nx = -tan.y / len
      const ny = tan.x / len
      const ox = nx * p.lane
      const oy = ny * p.lane

      const tailT = Math.max(0, t - (0.02 + link.magnitude * 0.03))
      cubicPoint(link.curve, tailT, pB)

      const alpha = p.alpha * tierAlpha * focus * (blocked ? 0.35 : 1)
      ctx.strokeStyle = rgbaStr(particleColor, alpha * (isDiverted ? 0.9 : 0.7))
      ctx.lineWidth = p.size * (0.85 + link.magnitude * 0.35)
      ctx.beginPath()
      ctx.moveTo(pA.x + ox, pA.y + oy)
      ctx.lineTo(pB.x + nx * p.lane, pB.y + ny * p.lane)
      ctx.stroke()

      ctx.fillStyle = rgbaStr(particleColor, Math.min(1, alpha * (isDiverted ? 1.8 : 1.4)))
      ctx.beginPath()
      ctx.arc(pA.x + ox, pA.y + oy, p.size * (isDiverted ? 0.75 : 0.6), 0, TAU)
      ctx.fill()
    }

    // ── blocked marker ──────────────────────────────────────
    if (blocked) drawBlockedMarker(rc, link)

    // ── diversion marker / badge ────────────────────────────
    if (isDiverted && allocatedT > 0) {
      drawDiversionMarker(rc, link, allocatedT, rerouteState?.status === 'applied')
    }
  }

  if (layers.emissions) drawEmissionOverlay(rc)
}

/** Dim unrelated corridors while a node or corridor is in focus. */
function selectionFocus(rc: RenderContext, link: LinkGeo): number {
  const { activeId, activeLinks, selectedRouteId, rerouteState } = rc
  const isRouteSelected = link.id === selectedRouteId
  if (isRouteSelected) return 1
  if (rerouteState && rerouteState.plan) {
    if (link.id === rerouteState.plan.blockedRouteId) return 1
    if (rerouteState.plan.allocations.some((a) => a.routeId === link.id)) return 1
  }
  if (activeId) return activeLinks.has(link.id) ? 1 : 0.14
  if (selectedRouteId) return 0.32
  return 1
}

function drawBlockedMarker(rc: RenderContext, link: LinkGeo) {
  const { ctx, camera, time, reducedMotion } = rc
  const inv = 1 / camera.scale
  const pulse = reducedMotion ? 0.6 : (Math.sin(time * 3) + 1) / 2
  const r = 7 * inv

  ctx.save()
  ctx.fillStyle = rgbaStr(C.base, 0.9)
  ctx.strokeStyle = rgbaStr(C.critical, 0.7 + pulse * 0.3)
  ctx.lineWidth = 1.2 * inv
  ctx.beginPath()
  ctx.arc(link.mid.x, link.mid.y, r, 0, TAU)
  ctx.fill()
  ctx.stroke()

  // bar + cross: a stopped corridor reads as stopped, not as slow flow
  ctx.strokeStyle = rgbaStr(C.critical, 0.95)
  ctx.lineWidth = 1.6 * inv
  ctx.beginPath()
  ctx.moveTo(link.mid.x - r * 0.45, link.mid.y - r * 0.45)
  ctx.lineTo(link.mid.x + r * 0.45, link.mid.y + r * 0.45)
  ctx.moveTo(link.mid.x + r * 0.45, link.mid.y - r * 0.45)
  ctx.lineTo(link.mid.x - r * 0.45, link.mid.y + r * 0.45)
  ctx.stroke()
  ctx.restore()
}

function drawDiversionMarker(
  rc: RenderContext,
  link: LinkGeo,
  allocatedT: number,
  isApplied: boolean,
) {
  const { ctx, camera } = rc
  const inv = 1 / camera.scale
  const text = `${isApplied ? 'DIVERSION ACTIVE' : 'DIVERSION'} · ${Math.round(allocatedT).toLocaleString()} T/DAY`

  ctx.save()
  ctx.font = `600 ${(9 * inv).toFixed(2)}px "IBM Plex Mono", monospace`
  const w = ctx.measureText(text).width
  const padX = 6 * inv
  const h = 15 * inv
  const offsetY = -14 * inv

  // Solid dark badge
  ctx.fillStyle = 'rgba(10, 13, 18, 0.94)'
  ctx.fillRect(link.mid.x - w / 2 - padX, link.mid.y + offsetY - h * 0.5, w + padX * 2, h)

  // Cyan border
  ctx.strokeStyle = 'rgba(79, 227, 193, 0.75)'
  ctx.lineWidth = 1 * inv
  ctx.strokeRect(link.mid.x - w / 2 - padX, link.mid.y + offsetY - h * 0.5, w + padX * 2, h)

  // Text
  ctx.fillStyle = '#4FE3C1'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, link.mid.x, link.mid.y + offsetY)
  ctx.restore()
}

/**
 * EMISSIONS LAYER — colour comes from the corridor's fuel mix
 * (`wasteFlows.routeEmissionFactor`), and the heaviest links carry their
 * daily CO₂e load as a readout.
 */
function drawEmissionOverlay(rc: RenderContext) {
  const { ctx, geo, camera } = rc
  const inv = 1 / camera.scale
  const hot = [...geo.links].sort((a, b) => b.emissionsKg - a.emissionsKg).slice(0, 8)

  for (const link of hot) {
    const text = `${Math.round(link.emissionsKg).toLocaleString('en-US')} KG CO₂e`
    ctx.save()
    ctx.font = `500 ${(9.5 * inv).toFixed(2)}px "IBM Plex Mono", monospace`
    const w = ctx.measureText(text).width
    const padX = 5 * inv
    const h = 14 * inv
    ctx.fillStyle = rgbaStr(C.base, 0.8)
    ctx.fillRect(link.mid.x - w / 2 - padX, link.mid.y - h * 0.5, w + padX * 2, h)
    ctx.strokeStyle = rgbaStr(emissionColor(link.emissionIntensity), 0.45)
    ctx.lineWidth = inv
    ctx.strokeRect(link.mid.x - w / 2 - padX, link.mid.y - h * 0.5, w + padX * 2, h)
    ctx.fillStyle = rgbaStr(emissionColor(link.emissionIntensity), 0.92)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, link.mid.x, link.mid.y + 0.5 * inv)
    ctx.restore()
  }

  // Warm haze over the highest-emitting sink (the landfill corridor).
  const worst = hot[0]
  if (!worst) return
  const r = 200
  const g = ctx.createRadialGradient(worst.to.x, worst.to.y, 0, worst.to.x, worst.to.y, r)
  g.addColorStop(0, rgbaStr(C.critical, 0.07))
  g.addColorStop(1, rgbaStr(C.critical, 0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(worst.to.x, worst.to.y, r, 0, TAU)
  ctx.fill()
}
