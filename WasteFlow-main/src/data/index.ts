import { buildTwinModel, type TwinModel } from './metrics'

export * from './city'
export * from './cityZones'
export * from './facilities'
export * from './routes'
export * from './vehicles'
export * from './metrics'
export * from './series'
export * from './briefs'

let cached: TwinModel | null = null

/**
 * The single source of truth for Phase 2.
 *
 * `TwinModel` is a plain serialisable tree, so a later phase can replace this
 * builder with an async telemetry adapter (for example
 * `GET /network/mumbai/snapshot`) and keep every component, layer and panel
 * unchanged.
 */
export function getTwinModel(): TwinModel {
  if (!cached) cached = buildTwinModel()
  return cached
}
