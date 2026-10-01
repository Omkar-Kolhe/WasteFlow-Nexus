import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTwinStore } from '@/state/twinStore'
import { WasteNetwork } from './WasteNetwork'
import { SystemHUD } from './SystemHUD'
import { SystemStatus } from './SystemStatus'
import { MaterialPipeline } from './MaterialPipeline'
import { NetworkLegend } from './NetworkLegend'
import { LayerControls } from './LayerControls'
import { ViewportControls } from './ViewportControls'
import { SimulationPlaceholder } from './SimulationPlaceholder'
import { FacilityPanel } from './FacilityPanel'
import { RoutePanel } from './RoutePanel'
import { NodeTooltip } from './NodeTooltip'
import { ReroutePlanner } from './ReroutePlanner'

/**
 * DIGITAL TWIN — the primary screen.
 *
 * The map is the product; every HUD module is a small instrument floating over
 * it. Overlay order is intentional: map → overlays → contextual panel.
 */
export function DigitalTwin() {
  const select = useTwinStore((s) => s.select)
  const selectRoute = useTwinStore((s) => s.selectRoute)
  const view = useTwinStore((s) => s.view)

  // Esc clears the current inspection (node or corridor).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        select(null)
        selectRoute(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [select, selectRoute])

  return (
    <WasteNetwork>
      <AnimatePresence>
        {view === 'twin' && (
          <motion.div
            key="twin-overlays"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-0"
          >
            {/* top-left: vitals */}
            <SystemHUD className="pointer-events-auto absolute left-16 top-3 hidden w-[372px] md:block" />

            {/* top-right: health + diversion */}
            <SystemStatus className="pointer-events-auto absolute right-3 top-3 hidden w-[320px] xl:block" />

            {/* bottom-left: legend */}
            <NetworkLegend className="pointer-events-auto absolute bottom-3 left-16 hidden w-[342px] xl:block" />

            {/* bottom-centre: material path */}
            <MaterialPipeline className="pointer-events-auto absolute bottom-3 left-1/2 hidden -translate-x-1/2 lg:block" />

            {/* right rail: simulation → layers → camera */}
            <div className="pointer-events-auto absolute bottom-3 right-3 flex flex-col items-end gap-2">
              <SimulationPlaceholder className="hidden xl:block" />
              <LayerControls />
              <ViewportControls />
            </div>

            {/* contextual inspection */}
            <NodeTooltip />
            <FacilityPanel />
            <RoutePanel />
            {/* reroute planner — overlays the full viewport */}
            <ReroutePlanner />
          </motion.div>
        )}
      </AnimatePresence>
    </WasteNetwork>
  )
}
