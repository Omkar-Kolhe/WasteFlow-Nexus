import type { EngineInput, EngineResult } from './types'
import { runCollectionEngine } from './collectionEngine'
import { runFacilityEngine } from './facilityEngine'
import { runTransportEngine } from './transportEngine'
import { runEnvironmentalEngine } from './environmentalEngine'
import { runMetricsEngine } from './metricsEngine'

/**
 * ENGINE RUN — compose the calculation modules and stamp the result.
 *
 * The whole city is recalculated from one `EngineInput` pass; the output is a
 * plain, serialisable tree so Phase 4 detection and Phase 6 simulation can run
 * the same pipeline over modified inputs (a reroute, a closure, a new line)
 * and diff the ledgers.
 *
 * Order matters: collection runs first, because the facility engine needs the
 * zones' collected tonnage as their inflow — zones have no inbound routes.
 */
export function runEngines(input: EngineInput): EngineResult {
  const collection = runCollectionEngine(input)
  const facility = runFacilityEngine(
    input,
    Object.fromEntries(
      Object.values(collection).map((c) => [c.zoneId, c.collectedT]),
    ),
  )
  const transport = runTransportEngine(input)
  const environmental = runEnvironmentalEngine(input)
  const city = runMetricsEngine(input, { collection, facility, transport, environmental })

  return { collection, facility, transport, environmental, city }
}
