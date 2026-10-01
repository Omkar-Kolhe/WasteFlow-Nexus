import { motion } from 'framer-motion'
import { Check, Wand2 } from 'lucide-react'
import { SIMULATION_PRESETS } from '@/engine/simulationEngine'
import { cn } from '@/lib/utils'

export function SimulationPresets({
  selectedPresetId,
  onSelectPreset,
}: {
  selectedPresetId: string | null
  onSelectPreset: (presetId: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Wand2 size={12} className="text-signal" />
          <span className="label-tech text-[8.5px]">SCENARIO PRESETS</span>
        </div>
        <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
          1-CLICK STRATEGIC TEMPLATES
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {SIMULATION_PRESETS.map((preset, idx) => {
          const isSelected = selectedPresetId === preset.id

          return (
            <motion.button
              key={preset.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              onClick={() => onSelectPreset(preset.id)}
              className={cn(
                'group relative flex flex-col justify-between border p-2.5 text-left transition-all',
                isSelected
                  ? 'border-signal/80 bg-signal/[0.08] shadow-panel ring-1 ring-signal/40'
                  : 'border-hair bg-white/[0.015] hover:border-hair2 hover:bg-white/[0.035]',
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'border px-1 py-[1px] font-mono text-[6.5px] tracking-[0.12em]',
                      isSelected
                        ? 'border-signal/50 bg-signal/15 text-signal'
                        : 'border-white/10 text-ink-ghost',
                    )}
                  >
                    {preset.tag}
                  </span>
                  {isSelected && <Check size={11} className="text-signal" />}
                </div>

                <h4 className="mt-1.5 font-mono text-[10px] font-medium leading-tight text-ink group-hover:text-signal transition-colors">
                  {preset.label}
                </h4>

                <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-ink-faint">
                  {preset.shortDescription}
                </p>
              </div>

              <div className="mt-2 border-t border-hair/40 pt-1 font-mono text-[7px] text-ink-ghost">
                Click to load parameters
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
