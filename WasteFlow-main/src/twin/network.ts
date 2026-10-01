import type { Facility, FlowTier, Route, RouteStatus, SubstreamId, TwinSnapshot } from '@/types'
import type { FacilityDerived, TwinModel } from '@/data/metrics'
import type { RouteFlow } from '@/engine/wasteFlowEngine'
import { PARTICLE_MODEL } from '@/config/network'
import { type CubicCurve, linkCurve } from '@/lib/geometry'
import { hashString, seeded } from '@/lib/utils'
import { C, NODE_STATE_COLOR, ROUTE_STATUS_COLOR, STREAM_COLOR, type RGB } from './palette'

/**
 * NETWORK GEOMETRY
 *
 * The bridge between the data model and the renderer: every node, link and
 * particle pool is derived from `TwinModel`, so nothing on screen exists that is
 * not in the data. No layer draws from a hardcoded coordinate or a literal flow
 * value — they all read this structure.
 */

export interface NodeGeo {
  id: string
  facility: Facility
  derived: FacilityDerived
  x: number
  y: number
  /** Real-world coordinates for Leaflet-based pixel-perfect projection. */
  latLon: { lat: number; lon: number } | null
  /** Base glyph radius in world units, scaled by throughput share. */
  r: number
  /** Utilisation colour: normal / warning / critical. */
  stateColor: RGB
  elevScale: number
}

export interface Particle {
  t: number
  lane: number
  size: number
  speed: number
  alpha: number
  wobble: number
}

export interface LinkGeo {
  id: string
  route: Route
  flow: RouteFlow
  status: RouteStatus
  tier: FlowTier
  curve: CubicCurve
  from: NodeGeo
  to: NodeGeo
  /** Material stream colour. */
  color: RGB
  width: number
  magnitude: number
  emissionsKg: number
  emissionIntensity: number
  emissionColor: RGB
  particles: Particle[]
  lanes: number
  mid: { x: number; y: number }
}

export interface GenerationGeo {
  id: string
  parentId: string
  x: number
  y: number
  size: number
  color: RGB
  phase: number
}

export interface NetworkGeometry {
  nodes: NodeGeo[]
  nodeById: Record<string, NodeGeo>
  links: LinkGeo[]
  linkById: Record<string, LinkGeo>
  generations: GenerationGeo[]
  /** Links grouped by endpoint for fast highlight lookups. */
  linksByNode: Record<string, string[]>
  maxVolume: number
  /** Counts for the HUD and legend. */
  counts: { nodes: number; zones: number; links: number; critical: number; warning: number; blocked: number }
}

const KIND_RADIUS: Record<Facility['kind'], number> = {
  zone: 32,
  transfer: 18,
  sorting: 21,
  processing: 18,
  recovery: 17,
  landfill: 23,
}

export function buildNetwork(model: TwinModel): NetworkGeometry {
  const snapshot: TwinSnapshot = model.snapshot

  const nodes: NodeGeo[] = snapshot.facilities.map((facility) => {
    const derived = model.derivedById[facility.id]
    const elevScale = 1 + facility.elevation / 320
    const throughputWeight = facility.kind === 'zone' ? Math.min(1, derived.utilizationPct / 100) : Math.min(1, derived.throughputShare * 2.2)
    return {
      id: facility.id,
      facility,
      derived,
      x: facility.position.x,
      y: facility.position.y,
      latLon: facility.latLon ?? null,
      r: KIND_RADIUS[facility.kind] * elevScale * (0.9 + throughputWeight * 0.3),
      stateColor: NODE_STATE_COLOR[derived.state],
      elevScale,
    }
  })

  const nodeById: Record<string, NodeGeo> = {}
  for (const n of nodes) nodeById[n.id] = n

  const links: LinkGeo[] = []
  const linkById: Record<string, LinkGeo> = {}
  const linksByNode: Record<string, string[]> = {}
  const pushNodeLink = (id: string, linkId: string) => {
    ;(linksByNode[id] ||= []).push(linkId)
  }

  for (const route of snapshot.routes) {
    const flow = model.routeDerivedById[route.id]
    const from = nodeById[route.from]
    const to = nodeById[route.to]
    if (!flow || !from || !to) continue

    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.hypot(dx, dy) || 1
    const ux = dx / dist
    const uy = dy / dist

    const start = { x: from.x + ux * (from.r * 0.86), y: from.y + uy * (from.r * 0.9) }
    const end = { x: to.x - ux * (to.r * 0.9), y: to.y - uy * (to.r * 0.94) }

    // Bow alternates with connection angle so parallel corridors fan apart.
    const bow = 0.1 + Math.min(0.1, (dist / 1600) * 0.1) + ((hashString(route.id) % 5) - 2) * 0.012
    const curve = linkCurve(start, end, bow)

    const magnitude = flow.magnitude
    const width = 1.1 + magnitude * 5.2
    const rand = seeded(hashString(route.id))

    // Particle density comes from the flow model, never from the renderer.
    const count = flow.particles
    const lanes = count > 16 ? 3 : count > 9 ? 2 : 1
    const particles: Particle[] = []
    const speedFactor = PARTICLE_MODEL.stateSpeed[flow.status]
    for (let i = 0; i < count; i++) {
      particles.push({
        t: (i + rand() * 0.6) / count,
        lane: (Math.floor(rand() * lanes) - (lanes - 1) / 2) * (width * 0.32),
        size:
          PARTICLE_MODEL.minSize +
          magnitude * (PARTICLE_MODEL.maxSize - PARTICLE_MODEL.minSize) +
          rand() * 0.45,
        speed: (PARTICLE_MODEL.baseSpeed + magnitude * PARTICLE_MODEL.speedPerMagnitude + rand() * 0.012) * speedFactor,
        alpha: 0.4 + magnitude * 0.42 + rand() * 0.12,
        wobble: rand() * Math.PI * 2,
      })
    }

    const emissionIntensity = model.flow.maxEmissionsKg > 0 ? flow.emissionsKg / model.flow.maxEmissionsKg : 0

    const link: LinkGeo = {
      id: route.id,
      route,
      flow,
      status: flow.status,
      tier: flow.tier,
      curve,
      from,
      to,
      color: STREAM_COLOR[route.substream as SubstreamId] ?? C.dim,
      width,
      magnitude,
      emissionsKg: flow.emissionsKg,
      emissionIntensity,
      emissionColor: ROUTE_STATUS_COLOR[flow.status],
      particles,
      lanes,
      mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    }
    links.push(link)
    linkById[link.id] = link
    pushNodeLink(route.from, route.id)
    pushNodeLink(route.to, route.id)
  }

  const generations: GenerationGeo[] = snapshot.generations.map((point) => {
    const parent = nodeById[point.parentId]
    const rand = seeded(hashString(point.id))
    return {
      id: point.id,
      parentId: point.parentId,
      x: (parent?.x ?? 0) + point.offset.x,
      y: (parent?.y ?? 0) + point.offset.y,
      size: 1.6 + point.share * 5,
      color: STREAM_COLOR[point.substream as SubstreamId] ?? C.dim,
      phase: rand() * Math.PI * 2,
    }
  })

  const counts = {
    nodes: nodes.length,
    zones: nodes.filter((n) => n.facility.kind === 'zone').length,
    links: links.length,
    critical: nodes.filter((n) => n.derived.state === 'critical').length,
    warning: nodes.filter((n) => n.derived.state === 'warning').length,
    blocked: links.filter((l) => l.status === 'blocked').length,
  }

  return { nodes, nodeById, links, linkById, generations, linksByNode, maxVolume: model.flow.maxVolumeT, counts }
}
