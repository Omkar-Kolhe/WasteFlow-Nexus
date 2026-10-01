import type { Facility, GenerationPoint } from '@/types'
import { hashString, seeded } from '@/lib/utils'

/**
 * COLLECTION ZONES — the eight Mumbai wards modelled in the Phase 2 demo.
 *
 * `input` mirrors `collection.collectedT` and `capacity` mirrors the zone's
 * daily generation, so one formula covers every node in the network:
 * utilisation = input ÷ capacity = the share of generated waste actually
 * collected. Node state then grades it on the service bands in
 * `config/network.ts`.
 *
 * Totals: 6,830 T/day generated · 6,434 T/day collected · 396 T/day uncollected.
 */
export const zones: Facility[] = [
  {
    id: 'Z-AN', code: 'CZ-AN', name: 'Andheri Collection Zone', shortName: 'ANDHERI',
    latLon: { lat: 19.1136, lon: 72.8697 },
    kind: 'zone', position: { x: 773, y: 453 }, input: 936, output: 936, capacity: 980,
    waiting: 0, processingTimeMin: 0, elevation: 14,
    mix: { organic: 52, residual: 26, recyclable: 14, commercial: 8 },
    crew: 58, uptimePct: 97.8, commissioned: '2016-04',
    note: 'Largest generator in the western corridor. Mixed residential and commercial frontage along the SV Road spine.',
    tags: ['western-corridor', 'commercial-heavy'],
    collection: {
      generatedT: 980, collectedT: 936, uncollectedT: 44, collectionRate: 0.955,
      frequency: 'TWICE DAILY (06:00 / 15:00)', vehicleCount: 9, avgVehicleCapacityT: 12,
      routeLengthMin: 268, access: 'Arterial roads with heavy peak congestion; service lanes used as bin yards.',
    },
  },
  {
    id: 'Z-BA', code: 'CZ-BA', name: 'Bandra Collection Zone', shortName: 'BANDRA',
    latLon: { lat: 19.0596, lon: 72.8295 },
    kind: 'zone', position: { x: 526, y: 575 }, input: 798, output: 798, capacity: 860,
    waiting: 0, processingTimeMin: 0, elevation: 12,
    mix: { organic: 48, residual: 28, recyclable: 17, commercial: 7 },
    crew: 46, uptimePct: 96.4, commissioned: '2015-09',
    note: 'Dense mixed-use ward with market clusters; organic fraction rises sharply on weekend cycles.',
    tags: ['market-cluster', 'organic-heavy'],
    collection: {
      generatedT: 860, collectedT: 798, uncollectedT: 62, collectionRate: 0.928,
      frequency: 'DAILY (06:30)', vehicleCount: 7, avgVehicleCapacityT: 12,
      routeLengthMin: 232, access: 'Narrow lanes in the market quarter force rear-loader-only rounds.',
    },
  },
  {
    id: 'Z-KU', code: 'CZ-KU', name: 'Kurla Collection Zone', shortName: 'KURLA',
    latLon: { lat: 19.0728, lon: 72.8797 },
    kind: 'zone', position: { x: 835, y: 546 }, input: 838, output: 838, capacity: 890,
    waiting: 0, processingTimeMin: 0, elevation: 11,
    mix: { organic: 46, residual: 31, recyclable: 15, commercial: 8 },
    crew: 44, uptimePct: 95.1, commissioned: '2017-02',
    note: 'Mixed residential and light industry around the railway terminus. Sensitive to corridor closures at Sion.',
    tags: ['rail-adjacent', 'corridor-risk'],
    collection: {
      generatedT: 890, collectedT: 838, uncollectedT: 52, collectionRate: 0.942,
      frequency: 'DAILY (06:30)', vehicleCount: 8, avgVehicleCapacityT: 12,
      routeLengthMin: 226, access: 'Level crossings and depot queues dominate the round; monsoon flooding risk.',
    },
  },
  {
    id: 'Z-PO', code: 'CZ-PO', name: 'Powai Collection Zone', shortName: 'POWAI',
    latLon: { lat: 19.1176, lon: 72.9060 },
    kind: 'zone', position: { x: 997, y: 444 }, input: 619, output: 619, capacity: 640,
    waiting: 0, processingTimeMin: 0, elevation: 26,
    mix: { organic: 44, residual: 24, recyclable: 26, commercial: 6 },
    crew: 34, uptimePct: 98.6, commissioned: '2019-07',
    note: 'High-rises and institutional campuses; the strongest dry-recyclable capture in the network.',
    tags: ['high-capture', 'high-rise'],
    collection: {
      generatedT: 640, collectedT: 619, uncollectedT: 21, collectionRate: 0.967,
      frequency: 'DAILY (06:30)', vehicleCount: 5, avgVehicleCapacityT: 12,
      routeLengthMin: 174, access: 'Gated societies with fixed collection windows; minimal on-street dumping.',
    },
  },
  {
    id: 'Z-DA', code: 'CZ-DA', name: 'Dadar Collection Zone', shortName: 'DADAR',
    latLon: { lat: 19.0178, lon: 72.8473 },
    kind: 'zone', position: { x: 636, y: 670 }, input: 887, output: 887, capacity: 940,
    waiting: 0, processingTimeMin: 0, elevation: 9,
    mix: { organic: 50, residual: 29, recyclable: 14, commercial: 7 },
    crew: 49, uptimePct: 96.9, commissioned: '2014-11',
    note: 'Old-city density with wholesale flower and produce markets; second-highest organic load.',
    tags: ['market-cluster', 'old-city'],
    collection: {
      generatedT: 940, collectedT: 887, uncollectedT: 53, collectionRate: 0.944,
      frequency: 'TWICE DAILY (05:30 / 14:30)', vehicleCount: 9, avgVehicleCapacityT: 12,
      routeLengthMin: 284, access: 'Very narrow service lanes; hand-carts transfer loads to compactors.',
    },
  },
  {
    id: 'Z-BO', code: 'CZ-BO', name: 'Borivali Collection Zone', shortName: 'BORIVALI',
    latLon: { lat: 19.2290, lon: 72.8573 },
    kind: 'zone', position: { x: 697, y: 193 }, input: 865, output: 865, capacity: 900,
    waiting: 0, processingTimeMin: 0, elevation: 19,
    mix: { organic: 47, residual: 30, recyclable: 16, commercial: 7 },
    crew: 47, uptimePct: 97.2, commissioned: '2016-08',
    note: 'Northern sprawl with a long haul to the eastern processing corridor — the network\'s longest collection leg.',
    tags: ['long-haul', 'northern-corridor'],
    collection: {
      generatedT: 900, collectedT: 865, uncollectedT: 35, collectionRate: 0.961,
      frequency: 'DAILY (05:30)', vehicleCount: 8, avgVehicleCapacityT: 12,
      routeLengthMin: 296, access: 'Two transfer corridors compete with commuter traffic on the highway approach.',
    },
  },
  {
    id: 'Z-CH', code: 'CZ-CH', name: 'Chembur Collection Zone', shortName: 'CHEMBUR',
    latLon: { lat: 19.0522, lon: 72.8996 },
    kind: 'zone', position: { x: 957, y: 592 }, input: 722, output: 722, capacity: 810,
    waiting: 0, processingTimeMin: 0, elevation: 13,
    mix: { organic: 43, residual: 34, recyclable: 15, commercial: 8 },
    crew: 40, uptimePct: 95.6, commissioned: '2015-03',
    note: 'Closest ward to the Deonar complex, and the weakest collection service in the network — the highest residual share in the east.',
    tags: ['landfill-adjacent', 'high-residue', 'service-gap'],
    collection: {
      generatedT: 810, collectedT: 722, uncollectedT: 88, collectionRate: 0.891,
      frequency: 'DAILY (06:30)', vehicleCount: 7, avgVehicleCapacityT: 12,
      routeLengthMin: 208, access: 'Industrial frontage with wide roads, but odour-sensitive receptors along the approach.',
    },
  },
  {
    id: 'Z-MU', code: 'CZ-MU', name: 'Mulund Collection Zone', shortName: 'MULUND',
    latLon: { lat: 19.1725, lon: 72.9425 },
    kind: 'zone', position: { x: 1221, y: 320 }, input: 769, output: 769, capacity: 810,
    waiting: 0, processingTimeMin: 0, elevation: 17,
    mix: { organic: 45, residual: 29, recyclable: 18, commercial: 8 },
    crew: 41, uptimePct: 98.1, commissioned: '2018-05',
    note: 'North-eastern ward feeding the Mulund transfer station; short internal round, long transfer haul.',
    tags: ['short-round', 'transfer-fed'],
    collection: {
      generatedT: 810, collectedT: 769, uncollectedT: 41, collectionRate: 0.949,
      frequency: 'DAILY (06:30)', vehicleCount: 7, avgVehicleCapacityT: 12,
      routeLengthMin: 196, access: 'Suburban grid with good lane width; collection completes inside two shifts.',
    },
  },
]

/**
 * Procedural waste generation points inside each zone.
 * Deterministic (seeded by zone id) so the mesh is identical on every load, and
 * shaped so a Phase 3 telemetry adapter can bind readings to individual points.
 */
export function buildGenerationPoints(): GenerationPoint[] {
  const points: GenerationPoint[] = []
  const substreamIds = ['organic', 'residual', 'recyclable', 'commercial'] as const

  for (const zone of zones) {
    const rand = seeded(hashString(zone.id))
    const count = 5 + Math.floor(rand() * 3) // 5–7 points
    const shares: number[] = []
    let remaining = 1
    for (let i = 0; i < count; i++) {
      const share = i === count - 1 ? remaining : remaining * (0.2 + rand() * 0.3)
      shares.push(share)
      remaining -= share
    }
    const radius = 62 + rand() * 24
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.8
      const r = radius * (0.55 + rand() * 0.7)
      points.push({
        id: `${zone.id}-G${i + 1}`,
        parentId: zone.id,
        label: `${zone.shortName} SITE ${i + 1}`,
        share: shares[i],
        offset: { x: Math.cos(angle) * r, y: Math.sin(angle) * r * 0.78 },
        substream: substreamIds[Math.floor(rand() * substreamIds.length)],
      })
    }
  }

  return points
}

export const zoneById = (id: string) => zones.find((z) => z.id === id)
