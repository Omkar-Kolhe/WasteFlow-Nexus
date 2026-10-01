import { cubicPoint, cubicTangent, TAU, type Vec2 } from '@/lib/geometry'
import { C, NODE_STATE_COLOR, rgbaStr } from '../palette'
import type { RenderContext } from '../renderContext'

const scratch: Vec2 = { x: 0, y: 0 }
const tang: Vec2 = { x: 0, y: 0 }

/**
 * BOTTLENECK LAYER (Phase 5)
 *
 * Visually communicates where flow is obstructed:
 * - Prominent amber (warning) and controlled red (critical) emphasis
 * - Subtle visual ripple and flow accumulation rings around congested facilities
 * - Ticking pressure markers on inbound corridors
 * - Queue dwell chips and backlog indicators
 * - Upstream/downstream connectivity highlighting
 */
export function drawStatusLayer(rc: RenderContext) {
  const { ctx, geo, camera, time, reducedMotion, selectedId, hoveredId } = rc

  const activeFocusId = selectedId || hoveredId

  for (const node of geo.nodes) {
    const state = node.derived.state
    const isBottleneck = state !== 'normal'
    const isFocusNode = node.id === activeFocusId

    if (!isBottleneck && !isFocusNode) continue

    const inv = 1 / camera.scale
    const color = NODE_STATE_COLOR[state]
    const critical = state === 'critical'
    const pulse = reducedMotion ? 0.5 : (Math.sin(time * (critical ? 2.4 : 1.5)) + 1) / 2

    // ── 1. Subtle Multi-Ring Ripple / Contention Wave ───────
    ctx.strokeStyle = rgbaStr(color, 0.22 + (1 - pulse) * 0.28)
    ctx.lineWidth = 1.2 * inv
    ctx.beginPath()
    ctx.arc(node.x, node.y, node.r * (1.9 + pulse * 0.45), 0, TAU)
    ctx.stroke()

    ctx.strokeStyle = rgbaStr(color, 0.12)
    ctx.lineWidth = 1 * inv
    ctx.beginPath()
    ctx.arc(node.x, node.y, node.r * (2.6 + pulse * 0.6), 0, TAU)
    ctx.stroke()

    // ── 2. Inward Accumulation Rings for Critical Nodes ─────
    if (critical) {
      for (let i = 0; i < 2; i++) {
        const t = (time * 0.5 + i * 0.5) % 1
        const radius = node.r * (3.0 - t * 1.4)
        ctx.strokeStyle = rgbaStr(color, 0.25 * (1 - t) + 0.05)
        ctx.lineWidth = 1.1 * inv
        ctx.beginPath()
        ctx.arc(node.x, node.y, Math.max(node.r, radius), 0, TAU)
        ctx.stroke()
      }
    }

    // ── 3. Pressure Chevrons on Inbound Feeding Corridors ────
    for (const linkId of node.derived.inboundRouteIds) {
      const link = geo.linkById[linkId]
      if (!link) continue
      const isBlocked = link.status === 'blocked'
      ctx.strokeStyle = rgbaStr(isBlocked ? C.critical : color, isBlocked ? 0.75 : 0.45)
      ctx.lineWidth = 1.2 * inv

      for (const t of [0.42, 0.58, 0.74]) {
        cubicPoint(link.curve, t, scratch)
        cubicTangent(link.curve, t, tang)
        const l = Math.hypot(tang.x, tang.y) || 1
        const nx = -tang.y / l
        const ny = tang.x / l
        const half = link.width * 0.5 + 4.5

        ctx.beginPath()
        ctx.moveTo(scratch.x + nx * half, scratch.y + ny * half)
        ctx.lineTo(scratch.x - nx * half, scratch.y - ny * half)
        ctx.stroke()
      }
    }

    // ── 4. Tactical Status Chip ─────────────────────────────
    const queue = node.derived.facility.waiting
    const backlog = Math.round(node.derived.backlogT)
    const text = `${critical ? 'CRITICAL' : 'WARNING'} · ${node.derived.utilizationPct.toFixed(0)}%${
      queue > 0 ? ` · ${queue}m QUEUE` : ''
    }${backlog > 0 ? ` · ${backlog}T HELD` : ''}`

    const fontSize = 9.5 * inv
    ctx.save()
    ctx.font = `500 ${fontSize.toFixed(2)}px "IBM Plex Mono", monospace`
    const w = ctx.measureText(text).width
    const padX = 6 * inv
    const h = 16 * inv
    const boxW = w + padX * 2 + 12 * inv
    const bx = node.x - boxW / 2
    const by = node.y - node.r - h - 14 * inv

    // Chip backdrop
    ctx.fillStyle = rgbaStr(C.base, 0.92)
    ctx.fillRect(bx, by, boxW, h)
    ctx.strokeStyle = rgbaStr(color, 0.7)
    ctx.lineWidth = 1 * inv
    ctx.strokeRect(bx, by, boxW, h)

    // Leading beacon indicator
    ctx.fillStyle = rgbaStr(color, 0.95)
    ctx.beginPath()
    ctx.moveTo(bx + 6 * inv, by + h / 2 - 3.5 * inv)
    ctx.lineTo(bx + 10.5 * inv, by + h / 2 + 3.5 * inv)
    ctx.lineTo(bx + 2 * inv, by + h / 2 + 3.5 * inv)
    ctx.closePath()
    ctx.fill()

    // Chip text
    ctx.fillStyle = rgbaStr(C.ink, 0.96)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, bx + 14 * inv, by + h / 2 + 0.5 * inv)
    ctx.restore()

    // Stem line connecting chip to node
    ctx.strokeStyle = rgbaStr(color, 0.35)
    ctx.lineWidth = 1 * inv
    ctx.beginPath()
    ctx.moveTo(node.x, by + h)
    ctx.lineTo(node.x, node.y - node.r * 1.5)
    ctx.stroke()
  }
}
