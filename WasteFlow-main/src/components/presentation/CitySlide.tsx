import { motion } from 'framer-motion'

export function CitySlide() {
  return (
    <div className="h-full relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-12 left-12 max-w-lg"
      >
        <h1 className="text-5xl font-light text-white mb-2">The City</h1>
        <p className="text-xl text-white/60">
          A living, breathing organism. Millions of interactions every day.
          But beneath the surface lies an invisible network of waste.
        </p>
      </motion.div>
    </div>
  )
}
