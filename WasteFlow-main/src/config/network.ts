import type { FacilityKind, RouteStatus, SubstreamId, VehicleStatus } from '@/types'

/**
 * NETWORK CONFIGURATION
 *
 * Every threshold, factor and label that shapes how the twin reads the data
 * lives here — never inside a component or a render layer. Phase 3+ detection
 * and simulation engines read the same config, so their outputs and the
 * existing visuals stay in agreement.
 */

/* ── Facility state ───────────────────────────────────────── */
/** Utilisation bands that drive node state, colour and pulse behaviour. */
export const UTILIZATION_THRESHOLDS = {
  /** ≥ this and < critical → WARNING */
  warning: 70,
  /** ≥ this → CRITICAL */
  critical: 90,
} as const

/* ── Collection service ───────────────────────────────────── */
/**
 * Collection zones are graded on service, not on plant load: the same ratio
 * means "share of generated waste actually collected", so the bands invert.
 */
export const COLLECTION_SERVICE_THRESHOLDS = {
  /** Below this collection rate → WARNING */
  warning: 92,
  /** Below this collection rate → CRITICAL */
  critical: 85,
} as const

/* ── Route state ──────────────────────────────────────────── */
/**
 * Route status bands, by load factor (flow ÷ route capacity).
 * `blocked` is normally an explicit operational state (a closed corridor), but
 * a route pinned above `blocked` is treated as blocked too.
 */
export const ROUTE_STATUS_THRESHOLDS = {
  busy: 70,
  congested: 85,
  blocked: 97,
} as const

/* ── Flow tiers ───────────────────────────────────────────── */
/**
 * Flow tiers are relative to the busiest link in the network, so the visual
 * language scales with the city rather than with absolute tonnage.
 */
export const FLOW_TIERS = {
  medium: 0.35,
  high: 0.7,
} as const

/* ── Particle model ───────────────────────────────────────── */
export const PARTICLE_MODEL = {
  /** Tonnes/day per particle — density is the primary quantity encoding. */
  tonnesPerParticle: 90,
  minParticles: 3,
  maxParticles: 26,
  minSize: 1.05,
  maxSize: 2.6,
  baseSpeed: 0.026,
  /** Added per unit of normalised magnitude — bigger flows move faster. */
  speedPerMagnitude: 0.062,
  /** Motion multipliers by route state. */
  stateSpeed: {
    normal: 1,
    busy: 1.12,
    congested: 0.45,
    blocked: 0,
  } as Record<RouteStatus, number>,
} as const

/* ── Vehicle model ────────────────────────────────────────── */
/** Vehicles travel at a world-constant pace; state changes dwell behaviour. */
export const VEHICLE_MODEL = {
  worldUnitsPerSecond: 46,
  dwellSeconds: {
    collecting: 2.8,
    'en-route': 0,
    waiting: 3.4,
    'at-facility': 3.2,
    returning: 0,
  } as Record<VehicleStatus, number>,
} as const

/* ── Transport fleet model (calculation engine, Phase 3) ──── */
/**
 * Demo fleet economics for the transport engine. `payloadT` converts daily
 * tonnage into vehicle trips (spec case 3: 50 t at 10 t payload = 5 trips);
 * `litersPerKm` is litres of diesel-equivalent per kilometre by drivetrain.
 * These are prototype factors, not measured fleet data.
 */
export const TRANSPORT_MODEL = {
  /** Payload per trip by corridor label, tonnes. */
  payloadT: {
    'COLLECTION HAUL': 12,
  } as Record<string, number | undefined>,
  /** Payload for corridors without a label-specific entry, tonnes. */
  defaultPayloadT: 20,
  /** Litres diesel-equivalent per km by drivetrain. */
  litersPerKm: {
    diesel: 0.34,
    cng: 0.3,
    electric: 0.05,
    hybrid: 0.24,
  } as Record<string, number | undefined>,
  /** Depot → corridor → depot repositioning overhead applied to every cycle. */
  deadheadFactor: 1.12,
} as const

/** Collection-round economics for the collection engine. */
export const COLLECTION_MODEL = {
  /** Drivetrain mix assumed for the ~89-unit collection fleet. */
  fuelMix: { diesel: 0.55, cng: 0.35, electric: 0.1 } as Record<string, number>,
  /** Mean distance of one collection trip (bin cluster → handover), km. */
  avgTripKm: 14,
  /** Repositioning overhead per collection trip. */
  deadheadFactor: 1.08,
} as const

/* ── Emissions ────────────────────────────────────────────── */
/** kg CO₂e per tonne-kilometre by drivetrain — mock Phase 2 factors. */
export const EMISSION_FACTORS = {
  transport: {
    diesel: 0.21,
    cng: 0.16,
    electric: 0.05,
  } as Record<string, number>,
  /** kg CO₂e/day per facility, by kind (mock processing footprint). */
  facilityByKind: {
    zone: 0,
    transfer: 46,
    sorting: 74,
    processing: 68,
    recovery: 52,
    landfill: 168,
  } as Record<FacilityKind, number>,
  /** Anaerobic digestion is a net energy exporter, so it carries a credit. */
  facilityCredits: {
    'PF-KJ': -12,
    'PF-TR': -8,
  } as Record<string, number>,
} as const

/* ── Bottleneck intelligence (Phase 5) ────────────────────── */
/**
 * Bottleneck detection weights, classification labels, and impact factors.
 * All detection scores are transparent linear combinations of physical ledger metrics.
 */
export const BOTTLENECK_WEIGHTS = {
  capacity: 0.35,
  backlog: 0.25,
  waiting: 0.15,
  transport: 0.15,
  upstreamInflow: 0.10,
} as const

export const BOTTLENECK_TYPE_CONFIG = {
  CAPACITY_BOTTLENECK: {
    code: 'CAPACITY_BOTTLENECK',
    label: 'Capacity Bottleneck',
    shortLabel: 'CAPACITY',
    description: 'Insufficient processing capacity limits throughput.',
    colorHex: '#E2595B',
  },
  TRANSPORT_BOTTLENECK: {
    code: 'TRANSPORT_BOTTLENECK',
    label: 'Transport Bottleneck',
    shortLabel: 'TRANSPORT',
    description: 'Transport distance, corridor congestion or vehicle shortage restricts flow.',
    colorHex: '#6C9BFF',
  },
  SCHEDULING_BOTTLENECK: {
    code: 'SCHEDULING_BOTTLENECK',
    label: 'Scheduling Bottleneck',
    shortLabel: 'SCHEDULING',
    description: 'Poor timing creates unnecessary waiting or uneven facility utilization.',
    colorHex: '#E5B44C',
  },
  TRANSFER_BOTTLENECK: {
    code: 'TRANSFER_BOTTLENECK',
    label: 'Transfer Bottleneck',
    shortLabel: 'TRANSFER',
    description: 'Transfer station capacity is restricting downstream flow.',
    colorHex: '#C084FC',
  },
  SORTING_BOTTLENECK: {
    code: 'SORTING_BOTTLENECK',
    label: 'Sorting Bottleneck',
    shortLabel: 'SORTING',
    description: 'Sorting capacity cannot handle incoming waste.',
    colorHex: '#E2595B',
  },
  PROCESSING_BOTTLENECK: {
    code: 'PROCESSING_BOTTLENECK',
    label: 'Processing Bottleneck',
    shortLabel: 'PROCESSING',
    description: 'Processing capacity limits organic and recovery throughput.',
    colorHex: '#4FE3C1',
  },
  RECOVERY_BOTTLENECK: {
    code: 'RECOVERY_BOTTLENECK',
    label: 'Recovery Bottleneck',
    shortLabel: 'RECOVERY',
    description: 'Recovery capacity causes additional landfill dependency.',
    colorHex: '#F97316',
  },
} as const

export const BOTTLENECK_MODEL = {
  /** Daily operating window for arrival-rate math, minutes. */
  operatingWindowMin: 480,
  /** Queue time above which a node counts as flow friction, minutes. */
  queueWatchMin: 20,
  /** Diesel-equivalent litres per minute a truck burns while idling. */
  idleLitersPerMin: 0.06,
  /** kg CO₂e per litre of diesel equivalent. */
  co2eKgPerLiter: 2.68,
  /** Mean detour added when the blocked corridor is worked around, km. */
  detourKm: 9.2,
  /** Utilisation target relocating tonnage would restore, percent. */
  restoreTargetPct: 85,
  /** kg CO₂e per tonne of residual sent to disposal (demo factor). */
  landfillDisposalKgPerT: 220,
  /** Weights for the multi-factor score. */
  weights: BOTTLENECK_WEIGHTS,
} as const

/* ── Daily ledger (§19) ───────────────────────────────────── */
/** Days in the deterministic ledger. 7 = Mon..Sun; day 4 is "today". */
export const CITY_DAY_COUNT = 7

/* ── Display labels ───────────────────────────────────────── */
export const FACILITY_KIND_LABEL: Record<FacilityKind, string> = {
  zone: 'COLLECTION ZONE',
  transfer: 'TRANSFER STATION',
  sorting: 'SORTING FACILITY',
  processing: 'PROCESSING FACILITY',
  recovery: 'RECOVERY FACILITY',
  landfill: 'LANDFILL',
}

export const SUBSTREAM_LABEL: Record<SubstreamId, string> = {
  residual: 'RESIDUAL',
  organic: 'ORGANIC',
  recyclable: 'RECYCLABLE',
  commercial: 'COMMERCIAL',
}

export const ROUTE_STATUS_LABEL: Record<RouteStatus, string> = {
  normal: 'NORMAL',
  busy: 'BUSY',
  congested: 'CONGESTED',
  blocked: 'BLOCKED',
}

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  collecting: 'COLLECTING',
  'en-route': 'EN ROUTE',
  waiting: 'WAITING',
  'at-facility': 'AT FACILITY',
  returning: 'RETURNING',
}

export const VEHICLE_KIND_LABEL: Record<string, string> = {
  compactor: 'COMPACTOR',
  'rear-loader': 'REAR LOADER',
  'roll-off': 'ROLL-OFF',
  'transfer-hauler': 'TRANSFER HAULER',
  tipper: 'TIPPER',
}
