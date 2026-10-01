import { createContext, useContext, useEffect, useReducer, useState } from 'react'
import type { ReactNode } from 'react'
import type { TwinEngine } from '@/twin/TwinEngine'

const TwinEngineContext = createContext<TwinEngine | null>(null)

export function TwinEngineProvider({ engine, children }: { engine: TwinEngine | null; children: ReactNode }) {
  return <TwinEngineContext.Provider value={engine}>{children}</TwinEngineContext.Provider>
}

export function useTwinEngine() {
  return useContext(TwinEngineContext)
}

/** Re-renders the calling component whenever the camera or viewport moves. */
export function useViewTick() {
  const engine = useTwinEngine()
  const [tick, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    if (!engine) return
    return engine.subscribe(bump)
  }, [engine])
  return tick
}

/** Screen-space projection of a network node, kept in sync with the camera. */
export function useNodeScreenPosition(id: string | null) {
  const engine = useTwinEngine()
  useViewTick()
  if (!engine || !id) return null
  return engine.screenOf(id)
}

/** Screen-space projection of a network node's glyph radius, in pixels. */
export function useNodeScreenRadius(id: string | null) {
  const engine = useTwinEngine()
  useViewTick()
  if (!engine || !id) return 0
  const node = engine.geo.nodeById[id]
  return node ? node.r * engine.getScale() : 0
}

/** Screen-space projection of a corridor's midpoint. */
export function useRouteScreenPosition(routeId: string | null) {
  const engine = useTwinEngine()
  useViewTick()
  if (!engine || !routeId) return null
  const link = engine.geo.linkById[routeId]
  if (!link) return null
  return engine.screenOfPoint(link.mid.x, link.mid.y)
}

export function useZoomScale() {
  const engine = useTwinEngine()
  useViewTick()
  return engine?.getScale() ?? 1
}

/** Live engine telemetry (fps) polled at a low rate so it never trashes React. */
export function useEngineStats(intervalMs = 700) {
  const engine = useTwinEngine()
  const [stats, setStats] = useState({ fps: 60, vehicles: 0, nodes: 0, links: 0 })
  useEffect(() => {
    if (!engine) return
    const id = window.setInterval(() => setStats(engine.getStats()), intervalMs)
    return () => window.clearInterval(id)
  }, [engine, intervalMs])
  return stats
}
