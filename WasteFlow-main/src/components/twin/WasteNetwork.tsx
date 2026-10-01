import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { TwinEngine } from '@/twin/TwinEngine'
import { useTwinModel } from '@/hooks/useTwinModel'
import { useTwinStore } from '@/state/twinStore'
import { validateEngines } from '@/engine/validation'
import { TwinEngineProvider } from './TwinContext'
import 'leaflet/dist/leaflet.css'

/**
 * WASTE NETWORK — the digital twin surface.
 *
 * Owns the engine instance, mirrors application state into it whenever it
 * changes, and exposes the engine to the DOM overlays through context so panels
 * and tooltips can anchor themselves to nodes and corridors on the map.
 */
export function WasteNetwork({ children }: { children?: ReactNode }) {
  const model = useTwinModel()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const [engine, setEngine] = useState<TwinEngine | null>(null)

  const view = useTwinStore((s) => s.view)
  const layers = useTwinStore((s) => s.layers)
  const selectedId = useTwinStore((s) => s.selectedId)
  const selectedRouteId = useTwinStore((s) => s.selectedRouteId)
  const hoveredId = useTwinStore((s) => s.hoveredId)
  const hoveredRouteId = useTwinStore((s) => s.hoveredRouteId)
  const rerouteState = useTwinStore((s) => s.rerouteState)
  const select = useTwinStore((s) => s.select)
  const selectRoute = useTwinStore((s) => s.selectRoute)
  const hover = useTwinStore((s) => s.hover)
  const hoverRoute = useTwinStore((s) => s.hoverRoute)

  useEffect(() => {
    const canvas = canvasRef.current
    const mapDiv = mapRef.current
    if (!canvas || !mapDiv) return
    const instance = new TwinEngine(canvas, mapDiv, model, {
      onSelect: select,
      onSelectRoute: selectRoute,
      onHover: hover,
      onHoverRoute: hoverRoute,
    })
    // Dev affordance: the engine is scriptable from the console for QA.
    if (import.meta.env.DEV) {
      ;(window as unknown as { __wasteflow?: TwinEngine }).__wasteflow = instance
      ;(window as unknown as { __wasteflowModel?: unknown }).__wasteflowModel = model
      ;(
        window as unknown as { __wasteflowQA?: () => unknown }
      ).__wasteflowQA = () => validateEngines(model.engine)
    }
    setEngine(instance)
    return () => {
      instance.destroy()
      setEngine(null)
    }
  }, [model, select, selectRoute, hover, hoverRoute])

  // The twin keeps rendering only while it is the visible module.
  useEffect(() => engine?.setActive(view === 'twin'), [engine, view])
  useEffect(() => engine?.setLayers(layers), [engine, layers])
  useEffect(() => engine?.setSelected(selectedId), [engine, selectedId])
  useEffect(() => engine?.setSelectedRoute(selectedRouteId), [engine, selectedRouteId])
  useEffect(() => engine?.setHovered(hoveredId), [engine, hoveredId])
  useEffect(() => engine?.setHoveredRoute(hoveredRouteId), [engine, hoveredRouteId])
  useEffect(() => engine?.setRerouteState(rerouteState), [engine, rerouteState])

  // Camera-focus requests from module views (rendered outside the engine context).
  const focusNodeId = useTwinStore((s) => s.focusNodeId)
  const clearFocusRequest = useTwinStore((s) => s.clearFocusRequest)
  useEffect(() => {
    if (!engine || !focusNodeId) return
    engine.focusNode(focusNodeId)
    clearFocusRequest()
  }, [engine, focusNodeId, clearFocusRequest])

  return (
    <div className="absolute inset-0 select-none">
      <div
        ref={mapRef}
        className="absolute inset-0"
        style={{
          zIndex: 0,
          opacity: 0.35,
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab-twin touch-none"
        style={{ zIndex: 1 }}
        aria-label="Mumbai waste network digital twin"
      />
      {!engine && (
        <div className="absolute inset-0 grid place-items-center bg-void">
          <span className="label-tech animate-flicker text-signal/80">INITIALISING MUMBAI MESH…</span>
        </div>
      )}
      <TwinEngineProvider engine={engine}>{children}</TwinEngineProvider>
    </div>
  )
}
