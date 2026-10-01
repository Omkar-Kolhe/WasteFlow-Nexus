import { AnimatePresence } from 'framer-motion'
import { useTwinStore } from '@/state/twinStore'
import { DigitalTwin } from '@/components/twin/DigitalTwin'
import { MODULE_VIEWS } from '@/components/views'
import { TopBar } from './TopBar'
import { Navigation } from './Navigation'
import { BottomStatusBar } from './BottomStatusBar'

import { usePresentationStore } from '@/state/presentationStore'
import { PresentationView } from '@/components/views/PresentationView'

/**
 * APP SHELL — the digital twin is never unmounted. Modules open over it, so the
 * map is always the substrate and the camera state survives navigation.
 */
export function AppShell() {
  const view = useTwinStore((s) => s.view)
  const isDemoActive = usePresentationStore((s) => s.isActive)
  const Module = view === 'twin' ? undefined : MODULE_VIEWS[view as keyof typeof MODULE_VIEWS]

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-void">
      <TopBar />

      <div className="relative min-h-0 flex-1">
        <DigitalTwin />
        <Navigation />
        <AnimatePresence>{Module ? <Module key={view} /> : null}</AnimatePresence>
        <AnimatePresence>{isDemoActive ? <PresentationView key="presentation" /> : null}</AnimatePresence>
      </div>

      <BottomStatusBar />
    </div>
  )
}
