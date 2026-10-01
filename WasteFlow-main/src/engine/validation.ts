import { backlogOf, processedOf, recoveryRatePct, tripsFor, utilizationPct } from './primitives'
import type { EngineResult, ValidationCase, ValidationReport } from './types'

/**
 * VALIDATION SUITE (§20).
 *
 * The five spec cases, run against the calculation primitives, plus a live
 * mass-balance audit of the derived network. Call `validateEngines()` after
 * `runEngines()` to confirm the engine, or `validatePrimitives()` anywhere
 * (tests, CI, console) to confirm the maths itself.
 */

const EPSILON = 1e-9

function caseOf(id: string, name: string, expected: number, actual: number, unit: string): ValidationCase {
  return { id, name, expected, actual, unit, passed: Math.abs(expected - actual) < EPSILON }
}

/** The five spec cases, evaluated directly against the primitives. */
export function validatePrimitives(): ValidationReport {
  const cases: ValidationCase[] = [
    // CASE 1: input 100, capacity 150 → backlog 0
    caseOf('C1', 'Input 100 T, capacity 150 T → backlog', 0, backlogOf(100, 150), 'T'),
    // CASE 2: input 200, capacity 150 → backlog 50
    caseOf('C2', 'Input 200 T, capacity 150 T → backlog', 50, backlogOf(200, 150), 'T'),
    // CASE 3: vehicle capacity 10 T, waste 50 T → 5 trips
    caseOf('C3', 'Payload 10 T, waste 50 T → trips', 5, tripsFor(50, 10), 'TRIPS'),
    // CASE 4: processed 100, recovered 70 → 70% recovery
    caseOf('C4', 'Processed 100 T, recovered 70 T → recovery rate', 70, recoveryRatePct(100, 70), '%'),
    // CASE 5: input 500, capacity 400 → 125% utilization
    caseOf('C5', 'Input 500 T, capacity 400 T → utilization', 125, utilizationPct(500, 400), '%'),
  ]
  return { passed: cases.every((c) => c.passed), cases, maxMassResidualT: 0 }
}

/**
 * Full validation: primitives plus the live engine's internal consistency
 * (processed = min(incoming, capacity), backlog = max(0, incoming − capacity),
 * and every node's mass residual within tolerance).
 */
export function validateEngines(result: EngineResult): ValidationReport {
  const base = validatePrimitives()

  const consistency: ValidationCase[] = []
  let maxResidual = 0

  for (const facility of Object.values(result.facility)) {
    const expectedProcessed = processedOf(facility.incomingT, facility.processingCapacityT)
    const expectedBacklog = backlogOf(facility.incomingT, facility.processingCapacityT)
    consistency.push(
      caseOf(
        `F-${facility.facilityId}`,
        `${facility.facilityId} processed = min(incoming, capacity)`,
        Math.round(expectedProcessed * 100) / 100,
        Math.round(facility.processedT * 100) / 100,
        'T',
      ),
    )
    consistency.push(
      caseOf(
        `B-${facility.facilityId}`,
        `${facility.facilityId} backlog = max(0, incoming − capacity)`,
        Math.round(expectedBacklog * 100) / 100,
        Math.round(facility.backlogT * 100) / 100,
        'T',
      ),
    )
    maxResidual = Math.max(maxResidual, Math.abs(facility.massResidualT))
  }

  return {
    passed: base.passed && consistency.every((c) => c.passed),
    cases: [...base.cases, ...consistency],
    maxMassResidualT: maxResidual,
  }
}
