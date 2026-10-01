import type { Facility } from '@/types'

/**
 * MUMBAI INFRASTRUCTURE — transfer, sorting, processing, recovery and landfill.
 *
 * DEMO DATA (prototype figures, not BMC operational data).
 *
 * Mass balance, all consistent with `routes.ts` (tonnes/day):
 *   6,434 collected → 6,434 transfer intake → 6,434 sorting intake
 *   → 3,594 recovered (55.9% diversion) · 2,840 to Deonar Waste Facility
 *   Deonar is at 91.6% of its 3,100 T/day rated intake.
 */
export const facilities: Facility[] = [
  /* ── TRANSFER STATIONS ───────────────────────────────────── */
  {
    id: 'T-MU', code: 'TS-MU', name: 'Mulund Transfer Station', shortName: 'MULUND TRANSFER',
    latLon: { lat: 19.1725, lon: 72.9425 },
    kind: 'transfer', position: { x: 1250, y: 320 }, input: 1269, output: 1269, capacity: 1500,
    waiting: 14, processingTimeMin: 9, elevation: 16,
    mix: { organic: 48, residual: 29, recyclable: 16, commercial: 7 },
    crew: 42, uptimePct: 97.4, commissioned: '2018-02',
    note: 'North-eastern bulking point. Two tipping bays, compaction before the Kanjurmarg haul.',
    tags: ['bulking', '2-bay'],
  },
  {
    id: 'T-KJ', code: 'TS-KJ', name: 'Kanjurmarg Transfer Station', shortName: 'KANJURMARG TRANSFER',
    latLon: { lat: 19.1314, lon: 72.9356 },
    kind: 'transfer', position: { x: 1178, y: 413 }, input: 3556, output: 3556, capacity: 4600,
    waiting: 21, processingTimeMin: 12, elevation: 12,
    mix: { organic: 49, residual: 28, recyclable: 16, commercial: 7 },
    crew: 96, uptimePct: 96.2, commissioned: '2014-06',
    note: 'Busiest node in the network — the central sink for the western and central corridors.',
    tags: ['network-hub', 'high-throughput'],
  },
  {
    id: 'T-DE', code: 'TS-DE', name: 'Deonar Transfer Station', shortName: 'DEONAR TRANSFER',
    latLon: { lat: 19.0494, lon: 72.9189 },
    kind: 'transfer', position: { x: 1076, y: 598 }, input: 1609, output: 1609, capacity: 2200,
    waiting: 11, processingTimeMin: 10, elevation: 8,
    mix: { organic: 47, residual: 32, recyclable: 14, commercial: 7 },
    crew: 54, uptimePct: 95.8, commissioned: '2015-01',
    note: 'Serves the southern corridor and feeds the Deonar sorting and recovery complex directly.',
    tags: ['southern-corridor'],
  },

  /* ── SORTING ─────────────────────────────────────────────── */
  {
    id: 'S-KJ', code: 'SF-KJ', name: 'Kanjurmarg Sorting Facility', shortName: 'KANJURMARG SORTING',
    latLon: { lat: 19.1330, lon: 72.9380 },
    kind: 'sorting', position: { x: 1210, y: 420 }, input: 3369, output: 2995, capacity: 3500,
    waiting: 38, processingTimeMin: 22, elevation: 11,
    mix: { organic: 46, residual: 30, recyclable: 18, commercial: 6 },
    crew: 182, uptimePct: 93.7, commissioned: '2016-09',
    note: 'Dual-line MRF running above nominal rate. Inbound exceeds screening capacity on the morning tide, so the yard is used as a buffer.',
    tags: ['above-nominal-rate', 'yard-buffered', 'capacity-watch'],
  },
  {
    id: 'S-DE', code: 'SF-DE', name: 'Deonar Sorting Facility', shortName: 'DEONAR SORTING',
    latLon: { lat: 19.0520, lon: 72.9210 },
    kind: 'sorting', position: { x: 1110, y: 600 }, input: 3065, output: 2720, capacity: 3600,
    waiting: 16, processingTimeMin: 19, elevation: 9,
    mix: { organic: 44, residual: 33, recyclable: 16, commercial: 7 },
    crew: 166, uptimePct: 95.4, commissioned: '2017-11',
    note: 'Single tipping hall with a wider discharge apron; handles the higher-residual eastern stream.',
    tags: ['single-tip-hall', 'eastern-stream'],
  },

  /* ── PROCESSING ──────────────────────────────────────────── */
  {
    id: 'P-KJ', code: 'PF-KJ', name: 'Kanjurmarg Processing Facility', shortName: 'KANJURMARG PROCESSING',
    latLon: { lat: 19.1300, lon: 72.9360 },
    kind: 'processing', position: { x: 1240, y: 430 }, input: 900, output: 850, capacity: 1150,
    waiting: 8, processingTimeMin: 34, elevation: 10,
    mix: { organic: 88, residual: 12 },
    crew: 74, uptimePct: 96.8, commissioned: '2019-03',
    note: 'Anaerobic digestion with biogas to the grid; digestate leaves for the landfill cover programme.',
    tags: ['biogas', 'energy-recovery'],
  },
  {
    id: 'P-TR', code: 'PF-TR', name: 'Trombay Processing Facility', shortName: 'TROMBAY PROCESSING',
    latLon: { lat: 19.0145, lon: 72.9150 },
    kind: 'processing', position: { x: 1052, y: 677 }, input: 700, output: 660, capacity: 1200,
    waiting: 5, processingTimeMin: 31, elevation: 7,
    mix: { organic: 84, residual: 16 },
    crew: 58, uptimePct: 97.6, commissioned: '2020-08',
    note: 'Newest process line, comfortably inside capacity — the modelled relief option for eastern organic loads.',
    tags: ['spare-capacity', 'newest-line'],
  },

  /* ── RECOVERY ────────────────────────────────────────────── */
  {
    id: 'R-KJ', code: 'RC-KJ', name: 'Kanjurmarg Recovery Facility', shortName: 'KANJURMARG RECOVERY',
    latLon: { lat: 19.1320, lon: 72.9400 },
    kind: 'recovery', position: { x: 1240, y: 395 }, input: 1550, output: 1550, capacity: 1900,
    waiting: 13, processingTimeMin: 16, elevation: 9,
    mix: { recyclable: 62, residual: 22, organic: 16 },
    crew: 96, uptimePct: 97.1, commissioned: '2018-06',
    note: 'Sorts recyclable fractions to saleable specification; 1,350 T/day certified product leaves the network.',
    tags: ['material-recovery', 'certified-output'],
  },
  {
    id: 'R-DE', code: 'RC-DE', name: 'Deonar Recovery Facility', shortName: 'DEONAR RECOVERY',
    latLon: { lat: 19.0510, lon: 72.9220 },
    kind: 'recovery', position: { x: 1140, y: 585 }, input: 1675, output: 1675, capacity: 2600,
    waiting: 7, processingTimeMin: 15, elevation: 8,
    mix: { recyclable: 58, residual: 26, organic: 16 },
    crew: 88, uptimePct: 96.5, commissioned: '2019-10',
    note: 'Dry-fraction recovery with headroom; the natural receiving point for redirected sorted recyclate.',
    tags: ['spare-capacity', 'dry-fraction'],
  },

  /* ── LANDFILL ────────────────────────────────────────────── */
  {
    id: 'L-DE', code: 'LF-DE', name: 'Deonar Waste Facility', shortName: 'DEONAR WASTE FACILITY',
    latLon: { lat: 19.0494, lon: 72.9189 },
    kind: 'landfill', position: { x: 1140, y: 620 }, input: 2840, output: 0, capacity: 3100,
    waiting: 24, processingTimeMin: 6, elevation: 34,
    mix: { residual: 100 },
    crew: 118, uptimePct: 99.2, commissioned: '1927-01',
    note: 'Oldest and largest disposal site in the system, receiving 44% of collected waste. Methane capture at 64% against a 80% target.',
    tags: ['over-capacity-watch', 'methane-capture', 'closure-programme'],
  },
]

export const facilityById = (id: string) => facilities.find((f) => f.id === id)
