import type { CityMeta, SubstreamMeta } from '@/types'

/**
 * MUMBAI — Brihanmumbai Municipal Corporation area.
 *
 * DEMO DATA. Every figure in the Phase 2 model is illustrative prototype data
 * for the WasteFlow Nexus build; it is not operational BMC data and must not be
 * presented as such.
 */
export const city: CityMeta = {
  id: 'mumbai',
  name: 'MUMBAI',
  region: 'Brihanmumbai Municipal Corporation',
  population: 12_442_373,
  areaKm2: 603,
  households: 2_484_000,
  world: { width: 1700, height: 1100 },
}

export const substreams: SubstreamMeta[] = [
  { id: 'organic', label: 'Organic', color: '#8FD06A' },
  { id: 'residual', label: 'Residual', color: '#8B939E' },
  { id: 'recyclable', label: 'Recyclable', color: '#5FD4E3' },
  { id: 'commercial', label: 'Commercial', color: '#A98CFF' },
]

export const substreamColor = (id: SubstreamMeta['id']) =>
  substreams.find((s) => s.id === id)?.color ?? '#8B939E'

export interface CityOption {
  id: string
  name: string
  region: string
  status: 'live' | 'syncing' | 'offline'
  zones: number
  facilities: number
  tpd: number
}

/** City selector. Only the Mumbai mesh streams mock telemetry in Phase 2. */
export const cityOptions: CityOption[] = [
  { id: 'mumbai', name: 'Mumbai', region: 'Brihanmumbai Municipal Corporation', status: 'live', zones: 8, facilities: 10, tpd: 6830 },
  { id: 'navi-mumbai', name: 'Navi Mumbai', region: 'Navi Mumbai Municipal Corporation', status: 'syncing', zones: 7, facilities: 9, tpd: 1450 },
  { id: 'thane', name: 'Thane', region: 'Thane Municipal Corporation', status: 'syncing', zones: 6, facilities: 7, tpd: 1180 },
  { id: 'pune', name: 'Pune', region: 'Pune Municipal Corporation', status: 'offline', zones: 9, facilities: 11, tpd: 2100 },
]
