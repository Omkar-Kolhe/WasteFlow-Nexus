import { motion } from 'framer-motion'

export function IntroSlide() {
  return (
    <div className="flex h-full items-center justify-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center bg-black/50 p-12 rounded-xl backdrop-blur-md border border-white/10"
      >
        <div className="text-emerald-500 font-mono text-sm tracking-[0.3em] mb-6">WELCOME TO</div>
        <h1 className="text-6xl font-light text-white tracking-tight mb-4">
          WasteFlow <span className="font-medium text-emerald-400">Nexus</span>
        </h1>
        <p className="text-lg text-white/70 font-light max-w-xl mx-auto leading-relaxed">
          A digital waste twin that doesn't just visualize waste movement — it identifies system bottlenecks, traces their environmental consequences, tests operational interventions, and shows how the entire network changes before a decision is implemented.
        </p>
      </motion.div>
    </div>
  )
}
