import { UspCard } from './UspCard'

export function RootCauseSlide() {
  return (
    <div className="h-full relative">
      <UspCard 
        title="Understand Why it Fails"
        subtitle="Root-Cause Analysis"
        align="right"
      >
        <p className="mb-4">
          It's not enough to know there's a problem. We need to know the origin.
        </p>
        <p>
          WasteFlow Nexus analyzes the dependencies of the network to trace back delays and blockages to their absolute origin—whether it's an equipment failure, route congestion, or structural capacity limits.
        </p>
      </UspCard>
    </div>
  )
}
