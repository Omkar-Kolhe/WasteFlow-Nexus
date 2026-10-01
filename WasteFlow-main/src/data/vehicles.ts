import type { Vehicle } from '@/types'

/**
 * FLEET — 12 individually tracked units across the Mumbai mesh.
 * DEMO DATA. Each unit is bound to a corridor in `routes.ts`; the twin moves it
 * along that route's real geometry, and its status drives dwell behaviour
 * (collecting and waiting units hold position, haulers run the corridor).
 *
 * Fleet-wide there are 89 assigned units (see `networkFleetSize`); these 12 are
 * the ones the prototype tracks live.
 */
export const vehicles: Vehicle[] = [
  {
    id: 'V-01', code: 'MH-01 WT-024', kind: 'compactor', routeId: 'RT-04', zoneId: 'Z-AN',
    destinationId: 'T-KJ', status: 'collecting', capacityT: 14, loadT: 9.8, utilization: 0.7,
    etaMin: 38, speedKph: 0, crew: 3, fuel: 'diesel', plate: 'MH-01 WT-024', phase: 0.08, pace: 0.94,
  },
  {
    id: 'V-02', code: 'MH-01 WT-037', kind: 'rear-loader', routeId: 'RT-05', zoneId: 'Z-BA',
    destinationId: 'T-KJ', status: 'en-route', capacityT: 12, loadT: 7.4, utilization: 0.62,
    etaMin: 24, speedKph: 22, crew: 3, fuel: 'diesel', plate: 'MH-01 WT-037', phase: 0.31, pace: 1.04,
  },
  {
    id: 'V-03', code: 'MH-01 WT-051', kind: 'compactor', routeId: 'RT-06', zoneId: 'Z-KU',
    destinationId: 'T-KJ', status: 'waiting', capacityT: 14, loadT: 11.6, utilization: 0.83,
    etaMin: 55, speedKph: 0, crew: 3, fuel: 'diesel', plate: 'MH-01 WT-051', phase: 0.62, pace: 0.9,
  },
  {
    id: 'V-04', code: 'MH-01 WT-064', kind: 'compactor', routeId: 'RT-08', zoneId: 'Z-DA',
    destinationId: 'T-DE', status: 'en-route', capacityT: 14, loadT: 12.9, utilization: 0.92,
    etaMin: 19, speedKph: 26, crew: 3, fuel: 'diesel', plate: 'MH-01 WT-064', phase: 0.47, pace: 0.88,
  },
  {
    id: 'V-05', code: 'MH-01 WT-078', kind: 'rear-loader', routeId: 'RT-09', zoneId: 'Z-CH',
    destinationId: 'T-DE', status: 'collecting', capacityT: 12, loadT: 6.1, utilization: 0.51,
    etaMin: 31, speedKph: 0, crew: 3, fuel: 'cng', plate: 'MH-01 WT-078', phase: 0.14, pace: 1.08,
  },
  {
    id: 'V-06', code: 'MH-01 WT-083', kind: 'compactor', routeId: 'RT-07', zoneId: 'Z-PO',
    destinationId: 'T-KJ', status: 'en-route', capacityT: 14, loadT: 10.2, utilization: 0.73,
    etaMin: 12, speedKph: 24, crew: 3, fuel: 'electric', plate: 'MH-01 WT-083', phase: 0.58, pace: 0.96,
  },
  {
    id: 'V-07', code: 'MH-01 WT-091', kind: 'rear-loader', routeId: 'RT-02', zoneId: 'Z-BO',
    destinationId: 'T-KJ', status: 'en-route', capacityT: 12, loadT: 8.8, utilization: 0.73,
    etaMin: 33, speedKph: 28, crew: 3, fuel: 'cng', plate: 'MH-01 WT-091', phase: 0.22, pace: 0.9,
  },
  {
    id: 'V-08', code: 'MH-01 WT-104', kind: 'compactor', routeId: 'RT-03', zoneId: 'Z-MU',
    destinationId: 'T-MU', status: 'at-facility', capacityT: 14, loadT: 13.2, utilization: 0.94,
    etaMin: 0, speedKph: 0, crew: 3, fuel: 'cng', plate: 'MH-01 WT-104', phase: 0.95, pace: 0.86,
  },
  {
    id: 'V-09', code: 'MH-01 WT-118', kind: 'transfer-hauler', routeId: 'RT-10', zoneId: 'T-MU',
    destinationId: 'S-KJ', status: 'en-route', capacityT: 22, loadT: 20.4, utilization: 0.93,
    etaMin: 14, speedKph: 34, crew: 2, fuel: 'diesel', plate: 'MH-01 WT-118', phase: 0.36, pace: 0.74,
  },
  {
    id: 'V-10', code: 'MH-01 WT-127', kind: 'transfer-hauler', routeId: 'RT-11', zoneId: 'T-KJ',
    destinationId: 'S-KJ', status: 'en-route', capacityT: 22, loadT: 21.1, utilization: 0.96,
    etaMin: 8, speedKph: 30, crew: 2, fuel: 'cng', plate: 'MH-01 WT-127', phase: 0.71, pace: 0.82,
  },
  {
    id: 'V-11', code: 'MH-01 WT-139', kind: 'transfer-hauler', routeId: 'RT-13', zoneId: 'T-DE',
    destinationId: 'S-DE', status: 'returning', capacityT: 22, loadT: 8.2, utilization: 0.37,
    etaMin: 21, speedKph: 32, crew: 2, fuel: 'diesel', plate: 'MH-01 WT-139', phase: 0.66, pace: 0.7,
  },
  {
    id: 'V-12', code: 'MH-01 WT-142', kind: 'roll-off', routeId: 'RT-17', zoneId: 'S-KJ',
    destinationId: 'L-DE', status: 'en-route', capacityT: 20, loadT: 18.6, utilization: 0.93,
    etaMin: 27, speedKph: 38, crew: 2, fuel: 'diesel', plate: 'MH-01 WT-142', phase: 0.43, pace: 0.78,
  },
]

export const vehicleById = (id: string) => vehicles.find((v) => v.id === id)
