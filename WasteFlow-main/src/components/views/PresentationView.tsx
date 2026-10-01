import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePresentationStore } from '@/state/presentationStore'
import { useTwinStore } from '@/state/twinStore'
import { IntroSlide } from '../presentation/IntroSlide'
import { CitySlide } from '../presentation/CitySlide'
import { FlowSlide } from '../presentation/FlowSlide'
import { ProblemSlide } from '../presentation/ProblemSlide'
import { RootCauseSlide } from '../presentation/RootCauseSlide'
import { WhatIfSlide } from '../presentation/WhatIfSlide'
import { NetworkRespondsSlide } from '../presentation/NetworkRespondsSlide'
import { ImpactSlide } from '../presentation/ImpactSlide'
import { OverviewSlide } from '../presentation/OverviewSlide'
import { RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react'

export function PresentationView() {
  const { currentStep, nextStep, prevStep, startDemo, stopDemo } = usePresentationStore()
  const { setLayer, resetLayers, setView, applySimulationPreset, setSimulationState } = useTwinStore()

  // Effects to orchestrate the Twin and App state based on the current presentation step
  useEffect(() => {
    switch (currentStep) {
      case 'intro':
      case 'city':
        resetLayers()
        setView('twin')
        break
      case 'flow':
        setLayer('flow', true)
        setLayer('facilities', true)
        setLayer('vehicles', true)
        setView('twin')
        break
      case 'problem':
        resetLayers()
        setLayer('flow', true)
        setLayer('bottlenecks', true)
        setView('bottlenecks')
        break
      case 'root-cause':
        setView('bottlenecks')
        break
      case 'what-if':
        setView('simulation')
        // Automatically start an intervention
        applySimulationPreset('SORTING_EXPANSION')
        break
      case 'network-responds':
        setView('optimization')
        break
      case 'impact':
        setView('environment')
        break
      case 'overview':
        setView('twin') // The Judge Overview dashboard can be an overlay here
        break
    }
  }, [currentStep, resetLayers, setLayer, setView, applySimulationPreset, setSimulationState])

  const renderSlide = () => {
    switch (currentStep) {
      case 'intro': return <IntroSlide />
      case 'city': return <CitySlide />
      case 'flow': return <FlowSlide />
      case 'problem': return <ProblemSlide />
      case 'root-cause': return <RootCauseSlide />
      case 'what-if': return <WhatIfSlide />
      case 'network-responds': return <NetworkRespondsSlide />
      case 'impact': return <ImpactSlide />
      case 'overview': return <OverviewSlide />
      default: return null
    }
  }

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="flex-1 pointer-events-auto"
        >
          {renderSlide()}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-auto flex items-center justify-between mt-8">
        <div className="flex gap-4">
          <button
            onClick={() => {
              startDemo()
              resetLayers()
              setView('twin')
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-mono text-sm hover:bg-emerald-500/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset Demo
          </button>
          <button
            onClick={() => {
              stopDemo()
              resetLayers()
              setView('twin')
            }}
            className="flex items-center gap-2 px-4 py-2 bg-black/50 text-white/70 border border-white/20 rounded font-mono text-sm hover:bg-white/10 hover:text-white transition-colors"
          >
            Exit Demo
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={prevStep}
            className="p-2 bg-black/60 border border-white/10 rounded text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-mono text-xs text-white/40 tracking-widest uppercase">
            {currentStep}
          </div>
          <button
            onClick={nextStep}
            className="p-2 bg-black/60 border border-white/10 rounded text-white/50 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
