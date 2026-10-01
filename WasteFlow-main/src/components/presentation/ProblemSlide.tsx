import { UspCard } from './UspCard'

export function ProblemSlide() {
  return (
    <div className="h-full relative">
      <UspCard 
        title="Understand Where it Fails"
        subtitle="Bottleneck Intelligence"
        align="right"
      >
        <p className="mb-4">
          Data is useless if it doesn't highlight the friction points.
        </p>
        <p>
          The system actively detects congestion, capacity overloads, and routing failures in real-time, instantly surfacing where the network is bleeding efficiency.
        </p>
      </UspCard>
    </div>
  )
}
