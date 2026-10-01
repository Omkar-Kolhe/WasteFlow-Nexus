import type { Route } from '@/types'

/**
 * MUMBAI NETWORK LINKS — the single source of the twin's flow geometry.
 *
 * DEMO DATA. Nothing in the renderer draws a line that does not exist here:
 * stroke weight, particle density, particle speed, colour, congestion treatment,
 * vehicle movement and emissions all read these records.
 *
 * `capacityT` is the corridor's rated daily throughput; load factor
 * (volumeT ÷ capacityT) drives route state via `config/network.ts`.
 */
export const routes: Route[] = [
  /* ── COLLECTION: zones → transfer stations ────────────────── */
  {
    id: 'RT-01', from: 'Z-BO', to: 'T-MU', volumeT: 500, distanceKm: 24.6, travelTimeMin: 58,
    capacityT: 810, vehicleCount: 3, substream: 'residual', label: 'COLLECTION HAUL',
    fuelMix: { diesel: 0.6, cng: 0.4 }, note: 'Highway approach shared with commuter traffic; the longest collection leg in the network.',
  },
  {
    id: 'RT-02', from: 'Z-BO', to: 'T-KJ', volumeT: 365, distanceKm: 19.2, travelTimeMin: 46,
    capacityT: 480, vehicleCount: 2, substream: 'organic', label: 'COLLECTION HAUL',
    fuelMix: { diesel: 0.5, cng: 0.5 }, note: 'Second Borivali corridor, used by the organic-segregated round.',
  },
  {
    id: 'RT-03', from: 'Z-MU', to: 'T-MU', volumeT: 769, distanceKm: 8.4, travelTimeMin: 26,
    capacityT: 960, vehicleCount: 4, substream: 'residual', label: 'COLLECTION HAUL',
    fuelMix: { cng: 0.75, electric: 0.25 }, note: 'Short internal round with good lane width; the cleanest operating corridor.',
  },
  {
    id: 'RT-04', from: 'Z-AN', to: 'T-KJ', volumeT: 936, distanceKm: 14.8, travelTimeMin: 44,
    capacityT: 1000, vehicleCount: 5, substream: 'residual', label: 'COLLECTION HAUL',
    fuelMix: { diesel: 0.8, cng: 0.2 }, note: 'Cross-town haul from the western corridor; peak-hour slippage of 9–14 minutes.',
  },
  {
    id: 'RT-05', from: 'Z-BA', to: 'T-KJ', volumeT: 798, distanceKm: 17.6, travelTimeMin: 52,
    capacityT: 1010, vehicleCount: 4, substream: 'organic', label: 'COLLECTION HAUL',
    fuelMix: { diesel: 0.55, cng: 0.35, electric: 0.1 }, note: 'Market-quarter organic loads; odour-sensitive route with fixed windows.',
  },
  {
    id: 'RT-06', from: 'Z-KU', to: 'T-KJ', volumeT: 838, distanceKm: 6.9, travelTimeMin: 24,
    capacityT: 1270, vehicleCount: 4, substream: 'residual', label: 'COLLECTION HAUL',
    fuelMix: { diesel: 0.45, cng: 0.55 },
    status: 'blocked',
    note: 'BLOCKED — corridor closed at Sion Circle after waterlogging. Loads are being held at the zone and manually diverted.',
  },
  {
    id: 'RT-07', from: 'Z-PO', to: 'T-KJ', volumeT: 619, distanceKm: 5.4, travelTimeMin: 19,
    capacityT: 1070, vehicleCount: 3, substream: 'recyclable', label: 'COLLECTION HAUL',
    fuelMix: { electric: 0.66, cng: 0.34 }, note: 'Highest dry-recyclable capture; electric rounds keep the lake corridor quiet.',
  },
  {
    id: 'RT-08', from: 'Z-DA', to: 'T-DE', volumeT: 887, distanceKm: 13.2, travelTimeMin: 42,
    capacityT: 980, vehicleCount: 4, substream: 'organic', label: 'COLLECTION HAUL',
    fuelMix: { diesel: 0.7, cng: 0.3 }, note: 'Wholesale market waste; heavy organic load and the second-longest haul time.',
  },
  {
    id: 'RT-09', from: 'Z-CH', to: 'T-DE', volumeT: 722, distanceKm: 7.8, travelTimeMin: 24,
    capacityT: 1060, vehicleCount: 3, substream: 'commercial', label: 'COLLECTION HAUL',
    fuelMix: { diesel: 0.5, cng: 0.5 }, note: 'Industrial frontage with wide approach roads and a short cycle time.',
  },

  /* ── TRANSFER: transfer stations → sorting ────────────────── */
  {
    id: 'RT-10', from: 'T-MU', to: 'S-KJ', volumeT: 1269, distanceKm: 9.6, travelTimeMin: 34,
    capacityT: 1630, vehicleCount: 6, substream: 'residual', label: 'BULK TRANSFER',
    fuelMix: { diesel: 0.85, cng: 0.15 }, note: 'Compacted bulk transfer on a single arterial; stable through the day.',
  },
  {
    id: 'RT-11', from: 'T-KJ', to: 'S-KJ', volumeT: 2100, distanceKm: 4.2, travelTimeMin: 18,
    capacityT: 2230, vehicleCount: 8, substream: 'recyclable', label: 'BULK TRANSFER',
    fuelMix: { cng: 0.6, diesel: 0.4 }, note: 'The busiest link in the network — 33% of all routed tonnage moves through it.',
  },
  {
    id: 'RT-12', from: 'T-KJ', to: 'S-DE', volumeT: 1456, distanceKm: 12.4, travelTimeMin: 41,
    capacityT: 1840, vehicleCount: 5, substream: 'residual', label: 'BULK TRANSFER',
    fuelMix: { diesel: 0.9, cng: 0.1 }, note: 'Cross-city transfer for the residual-heavy eastern consignment.',
  },
  {
    id: 'RT-13', from: 'T-DE', to: 'S-DE', volumeT: 1609, distanceKm: 3.1, travelTimeMin: 14,
    capacityT: 2120, vehicleCount: 6, substream: 'residual', label: 'BULK TRANSFER',
    fuelMix: { diesel: 0.5, cng: 0.5 }, note: 'Very short compound transfer between adjacent Deonar sites.',
  },

  /* ── SORTED FRACTIONS: sorting → downstream ───────────────── */
  {
    id: 'RT-14', from: 'S-KJ', to: 'R-KJ', volumeT: 1020, distanceKm: 5.8, travelTimeMin: 22,
    capacityT: 1260, vehicleCount: 4, substream: 'recyclable', label: 'SORTED RECYCLATE',
    fuelMix: { cng: 0.55, diesel: 0.45 }, note: 'Dry recyclate to recovery; bale quality highest in the network.',
  },
  {
    id: 'RT-15', from: 'S-KJ', to: 'R-DE', volumeT: 480, distanceKm: 13.6, travelTimeMin: 44,
    capacityT: 700, vehicleCount: 2, substream: 'recyclable', label: 'SORTED RECYCLATE',
    fuelMix: { diesel: 1 }, note: 'Long recyclate transfer used when the Kanjurmarg recovery line is loaded.',
  },
  {
    id: 'RT-16', from: 'S-KJ', to: 'P-KJ', volumeT: 900, distanceKm: 3.4, travelTimeMin: 15,
    capacityT: 1100, vehicleCount: 3, substream: 'organic', label: 'ORGANIC FEEDSTOCK',
    fuelMix: { cng: 0.7, diesel: 0.3 }, note: 'Screened organic fraction to anaerobic digestion.',
  },
  {
    id: 'RT-17', from: 'S-KJ', to: 'L-DE', volumeT: 595, distanceKm: 15.2, travelTimeMin: 48,
    capacityT: 660, vehicleCount: 2, substream: 'residual', label: 'RESIDUE TO LANDFILL',
    fuelMix: { diesel: 1 }, note: 'Screening residue — the largest single inflow to the Deonar site.',
  },
  {
    id: 'RT-18', from: 'S-DE', to: 'R-DE', volumeT: 1055, distanceKm: 2.6, travelTimeMin: 12,
    capacityT: 1320, vehicleCount: 4, substream: 'recyclable', label: 'SORTED RECYCLATE',
    fuelMix: { cng: 0.6, diesel: 0.4 }, note: 'On-site transfer between the Deonar sorting and recovery plants.',
  },
  {
    id: 'RT-19', from: 'S-DE', to: 'R-KJ', volumeT: 320, distanceKm: 13.4, travelTimeMin: 43,
    capacityT: 440, vehicleCount: 2, substream: 'recyclable', label: 'SORTED RECYCLATE',
    fuelMix: { diesel: 1 }, note: 'Recyclate moved north when the Deonar recovery line is at grade.',
  },
  {
    id: 'RT-20', from: 'S-DE', to: 'P-TR', volumeT: 700, distanceKm: 5.2, travelTimeMin: 21,
    capacityT: 1150, vehicleCount: 3, substream: 'organic', label: 'ORGANIC FEEDSTOCK',
    fuelMix: { cng: 0.8, electric: 0.2 }, note: 'Organic fraction to Trombay, which still has capacity headroom.',
  },
  {
    id: 'RT-21', from: 'S-DE', to: 'L-DE', volumeT: 645, distanceKm: 2.2, travelTimeMin: 11,
    capacityT: 700, vehicleCount: 3, substream: 'residual', label: 'RESIDUE TO LANDFILL',
    fuelMix: { cng: 0.45, diesel: 0.55 }, note: 'Short compound haul; queue time at the tipping face dominates the cycle.',
  },

  /* ── PROCESSING OUTPUT ────────────────────────────────────── */
  {
    id: 'RT-22', from: 'P-TR', to: 'R-DE', volumeT: 140, distanceKm: 4.6, travelTimeMin: 18,
    capacityT: 250, vehicleCount: 1, substream: 'recyclable', label: 'RECOVERED FINES',
    fuelMix: { electric: 0.5, cng: 0.5 }, note: 'Screened fines returned to recovery.',
  },
  {
    id: 'RT-23', from: 'P-TR', to: 'L-DE', volumeT: 520, distanceKm: 3.4, travelTimeMin: 15,
    capacityT: 680, vehicleCount: 2, substream: 'residual', label: 'DIGESTATE',
    fuelMix: { cng: 0.7, diesel: 0.3 }, note: 'Digestate to landfill cover operations.',
  },
  {
    id: 'RT-24', from: 'P-KJ', to: 'R-KJ', volumeT: 210, distanceKm: 3.1, travelTimeMin: 14,
    capacityT: 350, vehicleCount: 1, substream: 'recyclable', label: 'RECOVERED FINES',
    fuelMix: { electric: 1 }, note: 'Electric shuttle between adjacent Kanjurmarg plants.',
  },
  {
    id: 'RT-25', from: 'P-KJ', to: 'L-DE', volumeT: 640, distanceKm: 14.6, travelTimeMin: 46,
    capacityT: 730, vehicleCount: 3, substream: 'residual', label: 'DIGESTATE',
    fuelMix: { diesel: 0.9, cng: 0.1 }, note: 'Long digestate haul across the city; the second-largest landfill inflow.',
  },

  /* ── RECOVERY RESIDUE ─────────────────────────────────────── */
  {
    id: 'RT-26', from: 'R-KJ', to: 'L-DE', volumeT: 200, distanceKm: 14.9, travelTimeMin: 47,
    capacityT: 320, vehicleCount: 1, substream: 'residual', label: 'PROCESS RESIDUE',
    fuelMix: { diesel: 1 }, note: 'Recovery reject fraction, cross-city.',
  },
  {
    id: 'RT-27', from: 'R-DE', to: 'L-DE', volumeT: 240, distanceKm: 3.6, travelTimeMin: 16,
    capacityT: 360, vehicleCount: 1, substream: 'residual', label: 'PROCESS RESIDUE',
    fuelMix: { cng: 0.6, diesel: 0.4 }, note: 'Rejects from the Deonar recovery line.',
  },
]

export const routeById = (id: string) => routes.find((r) => r.id === id)

/** Total fleet units assigned across every corridor. */
export const networkFleetSize = routes.reduce((sum, r) => sum + r.vehicleCount, 0)
