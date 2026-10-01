import { UspCard } from './UspCard'

export function FlowSlide() {
  return (
    <div className="h-full relative">
      <UspCard 
        title="See the Invisible"
        subtitle="Digital Waste Twin"
      >
        <p className="mb-4">
          Every vehicle, every facility, every ton of waste. Fully mapped in real-time.
        </p>
        <p>
          We've built a digital replica of the entire municipal waste network, allowing operators to see the actual flows and volumes across the city before they turn into crises.
        </p>
      </UspCard>
    </div>
  )
}
