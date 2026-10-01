import { TAU } from '@/lib/geometry'
import { C, NODE_STATE_COLOR, rgbaStr, type RGB } from '../palette'
import type { RenderContext } from '../renderContext'
import { measure } from '../text'
import type { NodeGeo } from '../network'

const STATE_ORDER: Record<NodeGeo['derived']['state'], number> = { normal: 0, warning: 1, critical: 2 }

function polygon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  sides: number,
  rotation = -Math.PI / 2,
) {
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i / sides) * TAU
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function plateFill(ctx: CanvasRenderingContext2D, stroke: RGB, alpha: number) {
  ctx.fillStyle = rgbaStr(C.base, 0.92)
  ctx.fill()
  ctx.strokeStyle = rgbaStr(stroke, alpha)
  ctx.stroke()
}

/**
 * FACILITY LAYER — the physical plant of the waste system.
 *
 * Two encodings carry the whole picture without opening a panel:
 *   glyph shape → node type (cluster, hex, splitter, digester, recovery, mound)
 *   state colour + pulse → utilisation band (normal / warning / critical)
 * Critical nodes additionally show accumulation, so a failing node reads as
 * filling up rather than merely being red.
 */
export function drawNodes(rc: RenderContext) {
  const { ctx, geo, camera, time, layers, activeId, activeLinks, selectedId, hoveredId, reducedMotion } = rc
  const inv = 1 / camera.scale
  const scale = camera.scale
  const showGlyphs = layers.facilities
  const showAllLabels = showGlyphs && scale > 0.55

  for (const node of geo.nodes) {
    const isSelected = node.id === selectedId
    const isHovered = node.id === hoveredId
    const connected = isConnectedToActive(geo, activeLinks, node.id)
    const focus = activeId ? (connected || isSelected || isHovered ? 1 : 0.2) : 1
    const emphasis = isSelected ? 1.16 : isHovered ? 1.09 : 1
    const r = node.r * emphasis
    const state = node.derived.state
    const color = NODE_STATE_COLOR[state]

    ctx.save()
    ctx.globalAlpha = focus

    // Halo: selection, hover, or a graded state glow.
    if (isSelected || isHovered || state !== 'normal') {
      const strength = isSelected ? 0.17 : isHovered ? 0.11 : STATE_ORDER[state] === 2 ? 0.1 : 0.06
      const halo = ctx.createRadialGradient(node.x, node.y, r * 0.4, node.x, node.y, r * 3.4)
      halo.addColorStop(0, rgbaStr(color, strength))
      halo.addColorStop(1, rgbaStr(color, 0))
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(node.x, node.y, r * 3.4, 0, TAU)
      ctx.fill()
    }

    if (!showGlyphs) {
      ctx.fillStyle = rgbaStr(color, 0.5 * (isSelected ? 1 : 0.65))
      ctx.beginPath()
      ctx.arc(node.x, node.y, Math.max(1.7, r * 0.17), 0, TAU)
      ctx.fill()
      ctx.restore()
      continue
    }

    drawStateOverlay(rc, node, r, color)

    ctx.lineWidth = 1.15 * inv
    switch (node.facility.kind) {
      case 'zone':
        drawZoneGlyph(rc, node, r)
        break
      case 'transfer':
        drawTransferGlyph(rc, node, r, color)
        break
      case 'sorting':
        drawSortingGlyph(rc, node, r, color)
        break
      case 'processing':
        drawProcessingGlyph(rc, node, r, color, time, reducedMotion)
        break
      case 'recovery':
        drawRecoveryGlyph(rc, node, r, color)
        break
      case 'landfill':
        drawLandfillGlyph(rc, node, r, color)
        break
    }

    if (isSelected) drawSelectionInstrument(rc, node, r, time, reducedMotion)
    drawNodeLabel(rc, node, r, { isSelected, isHovered, showGlyphs, showAllLabels })
    ctx.restore()
  }
}

function isConnectedToActive(geo: RenderContext['geo'], activeLinks: Set<string>, id: string) {
  const list = geo.linksByNode[id]
  if (!list) return false
  for (const l of list) if (activeLinks.has(l)) return true
  return false
}

/**
 * State overlay: a slow pulse for warning, an inward accumulation cascade plus a
 * rising stock gauge for critical.
 */
function drawStateOverlay(rc: RenderContext, node: NodeGeo, r: number, color: RGB) {
  const { ctx, camera, time, reducedMotion } = rc
  const state = node.derived.state
  if (state === 'normal') return
  const inv = 1 / camera.scale
  const speed = state === 'critical' ? 1.9 : 0.85
  const phase = reducedMotion ? 0.5 : (Math.sin(time * speed + node.x * 0.01) + 1) / 2

  ctx.save()
  ctx.lineWidth = 1.2 * inv
  ctx.strokeStyle = rgbaStr(color, 0.2 + phase * 0.3)
  ctx.beginPath()
  ctx.arc(node.x, node.y, r * (1.45 + phase * 0.26), 0, TAU)
  ctx.stroke()

  if (state === 'critical') {
    // Waste accumulating: three rings marching inward, faster when fuller.
    for (let i = 0; i < 3; i++) {
      const t = (reducedMotion ? 0.5 : (time * 0.55 + i * 0.33) % 1)
      const radius = r * (2.5 - t * 0.95)
      ctx.strokeStyle = rgbaStr(color, 0.3 * (1 - t) + 0.08)
      ctx.lineWidth = 1.4 * inv
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, TAU)
      ctx.stroke()
    }

    // Stock gauge beside the node: fill height tracks utilisation over threshold.
    const over = Math.min(1, (node.derived.utilizationPct - 70) / 30)
    const gx = node.x + r * 1.9
    const gy = node.y - r * 1.1
    const gw = 3.2 * inv * camera.scale + 1.6
    const gh = 16 * inv * camera.scale + 6
    ctx.strokeStyle = rgbaStr(color, 0.5)
    ctx.lineWidth = 1 * inv
    ctx.strokeRect(gx, gy, gw, gh)
    ctx.fillStyle = rgbaStr(color, 0.55 + (1 - phase) * 0.2)
    ctx.fillRect(gx + inv, gy + gh - over * gh + inv, gw - 2 * inv, Math.max(1, over * gh - 2 * inv))
  }
  ctx.restore()
}

function drawSelectionInstrument(rc: RenderContext, node: NodeGeo, r: number, time: number, reducedMotion: boolean) {
  const { ctx, camera } = rc
  const inv = 1 / camera.scale
  ctx.save()
  ctx.strokeStyle = rgbaStr(C.signal, 0.75)
  ctx.lineWidth = 1.1 * inv
  ctx.setLineDash([9 * inv, 9 * inv])
  ctx.lineDashOffset = -time * 16 * (reducedMotion ? 0.2 : 1)
  ctx.beginPath()
  ctx.arc(node.x, node.y, r * 1.6, 0, TAU)
  ctx.stroke()
  ctx.restore()

  ctx.strokeStyle = rgbaStr(C.signal, 0.9)
  ctx.lineWidth = 1.4 * inv
  const tickR = r * 1.6
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4
    ctx.beginPath()
    ctx.moveTo(node.x + Math.cos(a) * (tickR + 3 * inv), node.y + Math.sin(a) * (tickR + 3 * inv))
    ctx.lineTo(node.x + Math.cos(a) * (tickR + 9 * inv), node.y + Math.sin(a) * (tickR + 9 * inv))
    ctx.stroke()
  }
}

function drawNodeLabel(
  rc: RenderContext,
  node: NodeGeo,
  r: number,
  o: { isSelected: boolean; isHovered: boolean; showGlyphs: boolean; showAllLabels: boolean },
) {
  const { ctx, camera } = rc
  const inv = 1 / camera.scale
  const scale = camera.scale
  const isPrimary =
    node.facility.kind === 'zone' || node.facility.kind === 'sorting' || node.facility.kind === 'landfill'
  if (!(o.showAllLabels || isPrimary || o.isSelected || o.isHovered)) return

  const baseY = node.y + r + 7 * inv
  const nameSize = 9.5 * inv
  const name = node.facility.shortName
  const w = measure(ctx, name, nameSize, { family: 'mono', weight: 600, tracking: 0.8 })
  const chip = `${Math.round(node.derived.inflow).toLocaleString('en-US')} T/D`

  ctx.textBaseline = 'middle'
  ctx.fillStyle = rgbaStr(NODE_STATE_COLOR[node.derived.state], 0.95)
  ctx.beginPath()
  ctx.arc(node.x - w / 2 - 7 * inv, baseY, 1.8 * inv, 0, TAU)
  ctx.fill()

  ctx.font = `600 ${nameSize.toFixed(2)}px "IBM Plex Mono", monospace`
  ctx.textAlign = 'left'
  ctx.fillStyle = o.isSelected || o.isHovered ? rgbaStr(C.ink, 0.95) : rgbaStr(C.ink, 0.6)
  ctx.fillText(name, node.x - w / 2, baseY + 0.4 * inv)

  if (o.showGlyphs && (scale > 0.62 || o.isSelected || o.isHovered)) {
    ctx.textAlign = 'center'
    ctx.font = `400 ${(9 * inv).toFixed(2)}px "IBM Plex Mono", monospace`
    ctx.fillStyle = rgbaStr(o.isSelected ? C.signal : C.dim, 0.85)
    ctx.fillText(chip, node.x, baseY + 12 * inv)
  }
}

/**
 * COLLECTION ZONE — a service survey: the ring is the zone's daily generation
 * and the filled arc is the share of it actually collected. The remaining gap is
 * the service shortfall, so a poorly served ward is visible from across the room.
 */
function drawZoneGlyph(rc: RenderContext, node: NodeGeo, r: number) {
  const { ctx, camera, time, reducedMotion } = rc
  const inv = 1 / camera.scale
  const collectionRate = Math.max(0, Math.min(1, node.derived.utilizationPct / 100))
  const stateColor = NODE_STATE_COLOR[node.derived.state]

  const gapColor = node.derived.state === 'normal' ? C.dim : stateColor

  // Survey ring
  ctx.save()
  ctx.strokeStyle = rgbaStr(stateColor, 0.18)
  ctx.lineWidth = 1 * inv
  ctx.setLineDash([3 * inv, 5 * inv])
  ctx.beginPath()
  ctx.arc(node.x, node.y, r * 1.55, 0, TAU)
  ctx.stroke()
  ctx.restore()

  // Capacity ring (generation) + collected arc
  const ringR = r * 1.06
  ctx.lineWidth = Math.max(1.4, 3.2 * inv)
  ctx.strokeStyle = rgbaStr(C.ink, 0.09)
  ctx.beginPath()
  ctx.arc(node.x, node.y, ringR, 0, TAU)
  ctx.stroke()

  ctx.strokeStyle = rgbaStr(stateColor, 0.85)
  ctx.lineWidth = Math.max(1.6, 3.4 * inv)
  ctx.beginPath()
  ctx.arc(node.x, node.y, ringR, -Math.PI / 2, -Math.PI / 2 + collectionRate * TAU)
  ctx.stroke()

  // Uncollected gap, marked in the shortfall direction
  if (collectionRate < 0.999) {
    ctx.strokeStyle = rgbaStr(gapColor, 0.6)
    ctx.lineWidth = Math.max(1.6, 3.4 * inv)
    ctx.beginPath()
    ctx.arc(node.x, node.y, ringR, -Math.PI / 2 + collectionRate * TAU, Math.PI * 1.5)
    ctx.stroke()
  }

  // Survey ticks
  ctx.strokeStyle = rgbaStr(stateColor, 0.3)
  ctx.lineWidth = 1 * inv
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU
    const long = i % 6 === 0
    const r1 = r * 1.22
    const r2 = r * (1.22 + (long ? 0.24 : 0.12))
    ctx.beginPath()
    ctx.moveTo(node.x + Math.cos(a) * r1, node.y + Math.sin(a) * r1)
    ctx.lineTo(node.x + Math.cos(a) * r2, node.y + Math.sin(a) * r2)
    ctx.stroke()
  }

  // Core
  const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 0.8)
  g.addColorStop(0, rgbaStr(stateColor, 0.26))
  g.addColorStop(1, rgbaStr(stateColor, 0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(node.x, node.y, r * 0.8, 0, TAU)
  ctx.fill()

  const pulse = reducedMotion ? 0.5 : (Math.sin(time * 1.1 + node.x * 0.01) + 1) / 2
  ctx.strokeStyle = rgbaStr(stateColor, 0.16 + pulse * 0.2)
  ctx.lineWidth = 1 * inv
  ctx.beginPath()
  ctx.arc(node.x, node.y, r * (0.82 + pulse * 0.16), 0, TAU)
  ctx.stroke()
}

function drawTransferGlyph(rc: RenderContext, node: NodeGeo, r: number, color: RGB) {
  const { ctx, camera } = rc
  const inv = 1 / camera.scale
  ctx.save()
  polygon(ctx, node.x, node.y, r, 6, Math.PI / 6)
  plateFill(ctx, color, 0.72)
  ctx.lineWidth = 1.15 * inv
  ctx.stroke()

  // Two outbound chevrons: this node exists to move waste on.
  ctx.strokeStyle = rgbaStr(color, 0.85)
  for (let i = 0; i < 2; i++) {
    const ox = node.x - 3 * inv + i * 5 * inv
    ctx.beginPath()
    ctx.moveTo(ox, node.y - 4 * inv)
    ctx.lineTo(ox + 3.4 * inv, node.y)
    ctx.lineTo(ox, node.y + 4 * inv)
    ctx.stroke()
  }
  ctx.restore()
}

function drawSortingGlyph(rc: RenderContext, node: NodeGeo, r: number, color: RGB) {
  const { ctx, camera } = rc
  const inv = 1 / camera.scale
  ctx.save()
  const s = r * 1.75
  ctx.beginPath()
  ctx.rect(node.x - s / 2, node.y - s / 2, s, s)
  plateFill(ctx, color, 0.78)
  ctx.lineWidth = 1.15 * inv
  ctx.stroke()

  // One inbound line splitting into three sorted streams.
  ctx.strokeStyle = rgbaStr(color, 0.8)
  ctx.lineWidth = 1 * inv
  for (let i = 0; i < 3; i++) {
    const y = node.y - r * 0.55 + i * r * 0.55
    ctx.beginPath()
    ctx.moveTo(node.x - s * 0.32, y)
    ctx.lineTo(node.x + s * 0.05, y)
    ctx.lineTo(node.x + s * 0.28, y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawProcessingGlyph(
  rc: RenderContext,
  node: NodeGeo,
  r: number,
  color: RGB,
  time: number,
  reducedMotion: boolean,
) {
  const { ctx, camera } = rc
  const inv = 1 / camera.scale
  ctx.save()
  ctx.beginPath()
  ctx.arc(node.x, node.y, r, 0, TAU)
  plateFill(ctx, color, 0.72)
  ctx.lineWidth = 1.15 * inv
  ctx.stroke()

  // Rotating digester ticks — the only continuously spinning motif in the twin.
  const spin = reducedMotion ? 0 : time * 0.32
  ctx.strokeStyle = rgbaStr(color, 0.55)
  ctx.lineWidth = 1 * inv
  for (let i = 0; i < 8; i++) {
    const a = spin + (i / 8) * TAU
    ctx.beginPath()
    ctx.moveTo(node.x + Math.cos(a) * r * 0.42, node.y + Math.sin(a) * r * 0.42)
    ctx.lineTo(node.x + Math.cos(a) * r * 0.72, node.y + Math.sin(a) * r * 0.72)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(node.x, node.y, r * 0.26, 0, TAU)
  ctx.fillStyle = rgbaStr(color, 0.85)
  ctx.fill()
  ctx.restore()
}

function drawRecoveryGlyph(rc: RenderContext, node: NodeGeo, r: number, color: RGB) {
  const { ctx, camera } = rc
  const inv = 1 / camera.scale
  ctx.save()
  ctx.beginPath()
  ctx.arc(node.x, node.y, r, 0, TAU)
  plateFill(ctx, color, 0.7)
  ctx.lineWidth = 1.15 * inv
  ctx.stroke()

  ctx.strokeStyle = rgbaStr(color, 0.9)
  ctx.lineWidth = 1.1 * inv
  polygon(ctx, node.x, node.y + r * 0.06, r * 0.52, 3, -Math.PI / 2)
  ctx.stroke()
  ctx.restore()
}

function drawLandfillGlyph(rc: RenderContext, node: NodeGeo, r: number, color: RGB) {
  const { ctx, camera } = rc
  const inv = 1 / camera.scale
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(node.x - r * 1.3, node.y + r * 0.75)
  ctx.lineTo(node.x - r * 0.55, node.y - r * 0.5)
  ctx.lineTo(node.x + r * 0.35, node.y - r * 0.65)
  ctx.lineTo(node.x + r * 1.3, node.y + r * 0.75)
  ctx.closePath()
  plateFill(ctx, color, 0.74)
  ctx.lineWidth = 1.15 * inv
  ctx.stroke()

  // Lifts / cells
  ctx.strokeStyle = rgbaStr(color, 0.45)
  ctx.lineWidth = 0.9 * inv
  for (let i = 1; i <= 3; i++) {
    const t = i / 4
    const y = node.y + r * 0.75 - t * r * 1.25
    const half = r * (0.42 + t * 0.88)
    ctx.beginPath()
    ctx.moveTo(node.x - half, y)
    ctx.lineTo(node.x + half, y)
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * GENERATION LAYER — waste generation points inside each zone. Each point emits
 * a pulse toward its zone core at a rate proportional to its share of tonnage.
 */
export function drawGenerations(rc: RenderContext) {
  const { ctx, geo, camera, time, layers, activeId, reducedMotion } = rc
  if (!layers.flow) return
  const inv = 1 / camera.scale
  const dim = activeId ? 0.35 : 1

  ctx.save()
  ctx.globalAlpha = dim

  for (const gp of geo.generations) {
    const parent = geo.nodeById[gp.parentId]
    if (!parent) continue

    ctx.strokeStyle = rgbaStr(gp.color, 0.15)
    ctx.lineWidth = 0.9 * inv
    ctx.beginPath()
    ctx.moveTo(parent.x, parent.y)
    ctx.lineTo(gp.x, gp.y)
    ctx.stroke()

    const period = 2.6 + (1 - Math.min(1, gp.size / 6)) * 2.4
    const t = reducedMotion ? 0.5 : ((time + gp.phase) % period) / period
    const px = parent.x + (gp.x - parent.x) * t
    const py = parent.y + (gp.y - parent.y) * t
    ctx.fillStyle = rgbaStr(gp.color, 0.7 * (1 - t * 0.6))
    ctx.beginPath()
    ctx.arc(px, py, Math.max(0.7, gp.size * 0.28) * (1 - t * 0.4), 0, TAU)
    ctx.fill()

    ctx.fillStyle = rgbaStr(gp.color, 0.55)
    ctx.beginPath()
    ctx.arc(gp.x, gp.y, gp.size * 0.5, 0, TAU)
    ctx.fill()
    ctx.strokeStyle = rgbaStr(gp.color, 0.24)
    ctx.lineWidth = 1 * inv
    ctx.beginPath()
    ctx.arc(gp.x, gp.y, gp.size * 0.5 + 3 * inv, 0, TAU)
    ctx.stroke()
  }

  ctx.restore()
}
