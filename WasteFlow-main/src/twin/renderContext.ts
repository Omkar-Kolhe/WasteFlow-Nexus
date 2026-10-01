import type { LayerId } from '@/types'
import type { TwinModel } from '@/data/metrics'
import type { NetworkGeometry } from './network'
import type { RerouteState } from '@/engine/rerouteEngine'

export interface Camera {
  /** World-space centre of the viewport. */
  x: number
  y: number
  scale: number
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D
  geo: NetworkGeometry
  model: TwinModel
  /** Seconds since engine start (animation clock). */
  time: number
  /** Clamped delta in seconds. */
  dt: number
  dpr: number
  width: number
  height: number
  camera: Camera
  layers: Record<LayerId, boolean>
  selectedId: string | null
  selectedRouteId: string | null
  hoveredId: string | null
  hoveredRouteId: string | null
  /** True once the user (or OS) asks for reduced motion. */
  reducedMotion: boolean
  /** Highlighted node = hovered node, else selected node. */
  activeId: string | null
  /** Link ids attached to the active node. */
  activeLinks: Set<string>
  /** Active / simulated reroute status and allocations. */
  rerouteState?: RerouteState
}
