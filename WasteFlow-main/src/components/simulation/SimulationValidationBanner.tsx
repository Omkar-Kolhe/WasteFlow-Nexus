import { AlertTriangle, XCircle } from 'lucide-react'
import type { SimulationValidationResult } from '@/engine/simulationTypes'

export function SimulationValidationBanner({
  validation,
  className,
}: {
  validation: SimulationValidationResult
  className?: string
}) {
  if (validation.isValid && validation.warnings.length === 0) return null

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      {validation.errors.map((err, i) => (
        <div
          key={`err-${i}`}
          className="flex items-start gap-2 border border-critical/40 bg-critical/[0.08] p-2.5 text-[10.5px] text-critical"
        >
          <XCircle size={13} className="shrink-0 mt-0.5" />
          <div className="flex-1 font-mono leading-relaxed">
            <strong>Simulation constraint violated:</strong> {err}
          </div>
        </div>
      ))}

      {validation.warnings.map((warn, i) => (
        <div
          key={`warn-${i}`}
          className="flex items-start gap-2 border border-warn/40 bg-warn/[0.08] p-2.5 text-[10.5px] text-warn"
        >
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <div className="flex-1 font-mono leading-relaxed">
            <strong>Operational warning:</strong> {warn}
          </div>
        </div>
      ))}
    </div>
  )
}
