import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function UspCard({ title, subtitle, children, align = 'left' }: { title: string, subtitle: string, children?: ReactNode, align?: 'left' | 'right' }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: align === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className={`absolute top-1/3 ${align === 'left' ? 'left-16' : 'right-16'} w-96 p-6 border border-emerald-500/30 bg-black/80 backdrop-blur-md rounded shadow-2xl shadow-emerald-900/20`}
    >
      <div className="text-emerald-400 font-mono text-xs uppercase tracking-widest mb-2 border-b border-emerald-500/30 pb-2">
        {subtitle}
      </div>
      <h2 className="text-3xl font-light text-white mb-4">
        {title}
      </h2>
      <div className="text-white/70 text-sm leading-relaxed">
        {children}
      </div>
    </motion.div>
  )
}
