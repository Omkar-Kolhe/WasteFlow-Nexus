import { backlogOf, processedOf, utilizationPct } from './primitives'
import type { EngineInput, FacilityResult } from './types'

/**
 * FACILITY ENGINE — node ledger derived from the route set.
 *
 * `incomingT` is Σ inbound route volumes (blocked corridors contribute 0, so
 * the ledger reflects what the plant actually receives). Collection zones have
 * no inbound routes — their inflow is the collected tonnage passed in via
 * `zoneInflow` by the orchestrator (collection engine runs first).
 *
 * Processing is capped at capacity: the surplus becomes `backlogT`, the
 * plant's accumulating waste. Outflows are fully accounted so the mass audit
 * closes to zero for every node:
 *   routing onward  → `outgoingT`
 *   certified sales → `productExitT` (recovery plants)
 *   disposal        → `disposedT` (landfill sink)
 *   yard buffer     → `stockDrawnT` (bulk corridors run to schedule; a node
 *                     short of supply draws the difference from yard stock)
 *   held at source  → `heldAtSourceT` (zone tonnage stranded by a blocked
 *                     corridor — accumulation, like backlog, but at the kerb)
 *   moisture/trim   → `processLossT` (the remainder; nonzero here flags a
 *                     wiring bug, because the demo's loss is routed explicitly)
 */
export function runFacilityEngine(
  input: EngineInput,
  zoneInflow: Record<string, number> = {},
): Record<string, FacilityResult> {
  const results: Record<string, FacilityResult> = {}

  // Route index — only active corridors move material.
  const inbound: Record<string, number> = {}
  const outbound: Record<string, number> = {}
  const blockedOut: Record<string, number> = {}
  for (const route of input.routes) {
    if (route.status === 'blocked') {
      blockedOut[route.from] = (blockedOut[route.from] ?? 0) + route.volumeT
      continue
    }
    inbound[route.to] = (inbound[route.to] ?? 0) + route.volumeT
    outbound[route.from] = (outbound[route.from] ?? 0) + route.volumeT
  }

  for (const facility of input.facilities) {
    const isZone = facility.kind === 'zone'
    const incomingT = isZone ? (zoneInflow[facility.id] ?? 0) : (inbound[facility.id] ?? 0)
    const processingCapacityT = facility.capacity
    const processedT = processedOf(incomingT, processingCapacityT)
    const backlogT = backlogOf(incomingT, processingCapacityT)
    const utilizationP = utilizationPct(incomingT, processingCapacityT)
    const outgoingT = outbound[facility.id] ?? 0
    const heldAtSourceT = isZone ? (blockedOut[facility.id] ?? 0) : 0

    // Certified material leaving the network from recovery plants: whatever
    // is processed and not sent onward to another node.
    const productExitT =
      facility.kind === 'recovery' ? Math.max(0, processedT - outgoingT) : 0

    // Landfill is a terminal sink: everything it processes stays disposed.
    const disposedT = facility.kind === 'landfill' ? processedT : 0

    // Yard buffer: bulk corridors run to schedule even when inflow dips, so a
    // node short of supply draws the difference from stock on the yard. This
    // is the modelled mechanism behind "the yard is used as a buffer" notes.
    const stockDrawnT = Math.max(0, outgoingT - processedT)

    // Moisture/trim loss: processed material accounted by no onward route.
    // Whatever remains after every sink is the plant's physical loss.
    const unaccountedT =
      incomingT + stockDrawnT - outgoingT - productExitT - disposedT - backlogT - heldAtSourceT
    const processLossT = Math.max(0, unaccountedT)

    // Negative only when the data commits a node beyond its supply — an
    // integrity failure `validateEngines` reports.
    const massResidual = Math.min(0, unaccountedT - processLossT)

    results[facility.id] = {
      facilityId: facility.id,
      incomingT,
      processedT,
      backlogT,
      utilizationPct: utilizationP,
      overCapacity: backlogT > 0,
      outgoingT,
      productExitT,
      disposedT,
      processLossT,
      heldAtSourceT,
      stockDrawnT,
      waitingMin: facility.waiting,
      processingCapacityT,
      massResidualT: massResidual,
    }
  }

  return results
}
