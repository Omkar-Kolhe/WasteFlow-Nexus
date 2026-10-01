import { UspCard } from './UspCard'

export function WhatIfSlide() {
  return (
    <div className="h-full relative">
      <UspCard 
        title="Test Interventions"
        subtitle="What-If Simulation"
        align="left"
      >
        <p className="mb-4">
          You shouldn't have to guess if an expensive operational change will work.
        </p>
        <p>
          Our Simulation Engine lets you safely adjust fleet sizes, routing rules, and facility capacities to see exactly how the network behaves under the new parameters, without risking a single dollar.
        </p>
      </UspCard>
    </div>
  )
}
