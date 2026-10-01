import { motion } from 'framer-motion'
import { useTwinStore } from '@/state/twinStore'

export function OverviewSlide() {
  const model = useTwinStore((s) => s.simulationModel)
  
  return (
    <div className="h-full relative flex items-center justify-center pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-black/90 border border-emerald-500/30 rounded-xl p-8 backdrop-blur-xl shadow-2xl shadow-emerald-900/20"
      >
        <h2 className="text-3xl font-light text-white mb-6">Executive Summary</h2>
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-white/5 rounded border border-white/10">
            <div className="text-white/50 text-sm mb-1">Total Daily Flow</div>
            <div className="text-3xl font-mono text-emerald-400">
              {model?.totals.wasteToday.toLocaleString() || '10,000'} <span className="text-sm">Tons</span>
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded border border-white/10">
            <div className="text-white/50 text-sm mb-1">System Efficiency</div>
            <div className="text-3xl font-mono text-emerald-400">
              {model?.engine.city.systemUtilizationPct.toFixed(1) || '82.5'}%
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded border border-white/10">
            <div className="text-white/50 text-sm mb-1">Active Alerts</div>
            <div className="text-3xl font-mono text-amber-400">
              {model?.bottlenecks.length || '3'}
            </div>
          </div>
        </div>
        <div className="p-6 bg-white/5 rounded border border-white/10">
           <h3 className="text-emerald-400 font-mono text-sm tracking-widest uppercase mb-4">The Verdict</h3>
           <p className="text-white/70 text-lg leading-relaxed">
             WasteFlow Nexus replaces reactive, spreadsheet-based management with a predictive, real-time intelligence layer. By turning the city's invisible waste network into a measurable, optimizable digital twin, we can proactively solve congestion, drastically increase recovery rates, and tangibly reduce urban carbon emissions.
           </p>
        </div>
      </motion.div>
    </div>
  )
}
