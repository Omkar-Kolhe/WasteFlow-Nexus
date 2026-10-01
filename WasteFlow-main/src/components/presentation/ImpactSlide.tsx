import { UspCard } from './UspCard'

export function ImpactSlide() {
  return (
    <div className="h-full relative">
      <UspCard 
        title="Measure the Environmental Consequences"
        subtitle="Environmental Consequence Engine"
        align="left"
      >
        <p className="mb-4">
          Operations don't exist in a vacuum. Every decision impacts the planet.
        </p>
        <p>
          Our intelligence platform tracks the exact carbon footprint and landfill diversion trajectory of every simulation, turning raw logistical choices into clear, measurable environmental outcomes.
        </p>
      </UspCard>
    </div>
  )
}
