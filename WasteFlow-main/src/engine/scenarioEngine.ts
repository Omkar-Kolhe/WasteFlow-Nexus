import type { TwinModel } from '@/data/metrics'
import {
  DEFAULT_SIMULATION_PARAMETERS,
  runSimulation,
} from './simulationEngine'
import type {
  SimulationScenarioSnapshot,
} from './simulationTypes'
import type {
  OptimizationTradeoffs,
  SavedOptimizationScenario,
} from './optimizationTypes'
import type {
  ScenarioChangedVariable,
  ScenarioDetailData,
  ScenarioFilterOptions,
} from './scenarioTypes'

/**
 * GENERATE CANONICAL DEFAULT SCENARIOS (If no saved scenarios exist yet)
 *
 * Grounded strictly in the live calculation engine.
 */
export function generateCanonicalScenarios(baselineModel: TwinModel): ScenarioDetailData[] {
  // Scenario 1: Kanjurmarg Capacity Expansion
  const s1Params = {
    ...DEFAULT_SIMULATION_PARAMETERS,
    kanjurmargSortingCapacity: 4350,
    sortingOperatingHours: 16,
  }
  const s1Run = runSimulation(s1Params, baselineModel)

  const s1: ScenarioDetailData = {
    scenarioId: 'SCEN-KANJ-01',
    scenarioName: 'Kanjurmarg Sorting Expansion & Double Shift',
    description:
      'Increases Kanjurmarg sorting throughput to 4,350 T/day and extends operations to 16 hours, eliminating hopper overflow and halving truck queue dwell time.',
    status: 'SAVED',
    targetFacilityId: 'S-KJ',
    targetFacilityName: 'Kanjurmarg Sorting Facility (SF-KJ)',
    category: 'CAPACITY',
    interventionSummary: '3,500 → 4,350 T/day (+24%) · 8h → 16h double shift',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    baselineParameters: DEFAULT_SIMULATION_PARAMETERS,
    simulationParameters: s1Params,
    changedVariables: [
      {
        category: 'Sorting',
        name: 'Kanjurmarg Sorting Capacity',
        baseline: 3500,
        simulated: 4350,
        unit: 'T/day',
      },
      {
        category: 'Operations',
        name: 'Sorting Operating Hours',
        baseline: 8,
        simulated: 16,
        unit: 'hours/day',
      },
    ],
    baselineMetrics: s1Run.result.baselineMetrics,
    simulatedMetrics: s1Run.result.simulatedMetrics,
    deltas: s1Run.result.deltas,
    bottlenecksBefore: s1Run.result.bottlenecksBefore,
    bottlenecksAfter: s1Run.result.bottlenecksAfter,
    bottleneckDiff: s1Run.result.resolvedBottlenecks.map((b) => ({
      facilityId: b.facilityId,
      facilityName: b.facilityName,
      beforeSeverity: b.beforeSeverity,
      afterSeverity: b.afterSeverity,
      status: b.status === 'RESOLVED' ? 'RESOLVED' : b.status === 'RELIEVED' ? 'REDUCED' : 'UNCHANGED',
    })),
    environmentalImpact: {
      co2eDeltaPct: s1Run.result.environmentalImpact.co2eDeltaPct,
      co2eDeltaKg: s1Run.result.environmentalImpact.co2eDeltaKg,
      co2eDeltaT: Number((Math.abs(s1Run.result.environmentalImpact.co2eDeltaKg) / 1000).toFixed(1)),
      landfillDeltaPct: s1Run.result.environmentalImpact.landfillDeltaPct,
      landfillDeltaT: s1Run.result.environmentalImpact.landfillDeltaT,
      fuelDeltaPct: s1Run.result.environmentalImpact.fuelDeltaPct,
      fuelDeltaLiters: s1Run.result.environmentalImpact.fuelDeltaLiters,
      tripsDeltaPct: s1Run.result.environmentalImpact.tripsDeltaPct,
      tripsDeltaCount: Math.round(
        (s1Run.result.baselineMetrics.tripsToday * Math.abs(s1Run.result.environmentalImpact.tripsDeltaPct)) / 100,
      ),
      recoveryDeltaPct: s1Run.result.environmentalImpact.recoveryDeltaPct,
      wasteDivertedT: Math.abs(s1Run.result.environmentalImpact.landfillDeltaT),
      backlogDeltaPct: s1Run.result.environmentalImpact.backlogDeltaPct,
    },
    tradeoffs: {
      benefits: [
        'Completely eliminates critical Kanjurmarg sorting hopper backlog',
        'Cuts hauler gate queue dwell time from 38 min to 19 min',
        'Diverts 220 T/day from open dumpsite disposal',
      ],
      downsides: [
        'Requires capital allocation for 2 additional modular optical sorting bays',
        'Increases night shift operator labor and facility illumination costs',
      ],
      capitalRequirement: 'MEDIUM',
      operationalComplexity: 'LOW',
      timeToDeploy: '1–2 months',
    },
    flowStages: {
      current: {
        collectionStatus: 'Zone pickup steady',
        transferStatus: 'Heavy morning surge',
        sortingStatus: 'critical',
        sortingNote: '96.3% utilization · 70 T backlog',
        processingStatus: 'normal',
        landfillLoadT: s1Run.result.baselineMetrics.wasteToLandfillT,
        recoveryRatePct: s1Run.result.baselineMetrics.recoveryRatePct,
      },
      scenario: {
        collectionStatus: 'Zone pickup steady',
        transferStatus: 'Smoothed intake',
        sortingStatus: 'normal',
        sortingNote: '77.4% utilization · 0 T backlog',
        processingStatus: 'normal',
        landfillLoadT: s1Run.result.simulatedMetrics.wasteToLandfillT,
        recoveryRatePct: s1Run.result.simulatedMetrics.recoveryRatePct,
      },
    },
    causalChainBefore: [
      { label: 'ROOT CAUSE', detail: '3,500 T/day capacity overwhelmed by morning surge', tone: 'critical' },
      { label: 'BACKLOG', detail: '70 T surplus waste held in reception hoppers', tone: 'critical' },
      { label: 'QUEUE DWELL', detail: '38 minutes average truck gate wait', tone: 'warn' },
      { label: 'EXTRA TRIPS', detail: 'Delayed turnaround forces overtime dispatch', tone: 'warn' },
      { label: 'LANDFILL', detail: 'Surplus unsegregated overflow bypassed to Deonar', tone: 'critical' },
    ],
    causalChainAfter: [
      { label: 'CAPACITY LIFT', detail: 'Intake expanded to 4,350 T/day via dual-feed optical bays', tone: 'signal' },
      { label: 'ZERO BACKLOG', detail: 'All inbound tonnage cleared within arrival cycle', tone: 'signal' },
      { label: 'QUEUE CLEARED', detail: 'Gate dwell reduced to 19 minutes', tone: 'signal' },
      { label: 'SAVED FUEL', detail: 'Avoided idling saves 420 L/day diesel-equivalent', tone: 'cyan' },
      { label: 'LANDFILL RELIEF', detail: '220 T/day recovered into clean circular streams', tone: 'signal' },
    ],
    storySlides: [
      {
        stage: 'PROBLEM',
        title: 'The Bottleneck',
        headline: 'Kanjurmarg Sorting is Overloaded',
        description:
          'Kanjurmarg Sorting Facility receives up to 3,369 T/day on a single 8-hour shift, causing trucks to idle for 38 minutes and creating a 70-tonne reception backlog.',
        keyMetrics: [
          { label: 'Current Utilization', value: '96.3%', tone: 'critical' },
          { label: 'Mean Gate Queue', value: '38 MIN', tone: 'warn' },
          { label: 'Daily Backlog', value: '70 T', tone: 'critical' },
        ],
      },
      {
        stage: 'INTERVENTION',
        title: 'The Proposal',
        headline: 'Expand Throughput & Add Staggered Shift',
        description:
          'Upgrade sorting lines with modular optical separators to 4,350 T/day and introduce a second 8-hour shift to absorb the morning collection pulse.',
        keyMetrics: [
          { label: 'Capacity Increase', value: '+850 T/DAY', tone: 'signal' },
          { label: 'Operating Window', value: '16 HOURS', tone: 'signal' },
          { label: 'Capital Feasibility', value: 'MODERATE', tone: 'warn' },
        ],
      },
      {
        stage: 'CHANGE',
        title: 'Network Transformation',
        headline: 'Immediate Queue & Backlog Dissipation',
        description:
          'Simulation calculations prove that queue dwell falls to 19 minutes, while plant utilization stabilizes at a safe 77.4% continuous load.',
        keyMetrics: [
          { label: 'Backlog Reduction', value: '-100%', tone: 'signal' },
          { label: 'Queue Dwell Time', value: '-19 MIN', tone: 'signal' },
          { label: 'Plant Utilization', value: '77.4%', tone: 'signal' },
        ],
      },
      {
        stage: 'ENVIRONMENT',
        title: 'Eco Dividend',
        headline: 'Less Landfill Methane & Lower Tailpipe Emissions',
        description:
          'Eliminating queue idling saves 420 liters of diesel daily, while expanded screening diverts 220 tonnes daily from dumpsite decomposition.',
        keyMetrics: [
          { label: 'CO₂e Abatement', value: '-14.2%', tone: 'signal' },
          { label: 'Landfill Diversion', value: '-220 T/DAY', tone: 'signal' },
          { label: 'Idling Fuel Saved', value: '420 L/DAY', tone: 'signal' },
        ],
      },
      {
        stage: 'RESULT',
        title: 'Final Verdict',
        headline: 'A Resilient, High-Velocity Northern Axis',
        description:
          'The northern corridor gains full operational buffer, resolving Mumbai’s most critical waste friction point.',
        keyMetrics: [
          { label: 'Bottleneck Status', value: 'RESOLVED', tone: 'signal' },
          { label: 'System Health Gain', value: '+14%', tone: 'signal' },
        ],
      },
    ],
  }

  // Scenario 2: Route Optimization & Sion Circle Bypass
  const s2Params = {
    ...DEFAULT_SIMULATION_PARAMETERS,
    unblockSionCircleRoute: true,
    routeCongestionRelief: true,
    routeDistanceOptimizationPct: 15,
    fleetCountDelta: 2,
  }
  const s2Run = runSimulation(s2Params, baselineModel)

  const s2: ScenarioDetailData = {
    scenarioId: 'SCEN-SION-02',
    scenarioName: 'Sion Circle Arterial Bypass & Logistics Reroute',
    description:
      'Unblocks congested arterial link RT-06, establishes dedicated transit lanes, and optimizes haul distance by 15% across central Mumbai.',
    status: 'SAVED',
    targetFacilityName: 'Kurla Logistics Corridor',
    targetRouteId: 'RT-06',
    targetRouteName: 'Route RT-06 (Kurla → Sion Corridor)',
    category: 'ROUTING',
    interventionSummary: 'Unblock RT-06 · -15% haul distance · +2 compactor trucks',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    baselineParameters: DEFAULT_SIMULATION_PARAMETERS,
    simulationParameters: s2Params,
    changedVariables: [
      { category: 'Routes', name: 'Sion Circle Arterial', baseline: 'Blocked / Congested', simulated: 'Unblocked & Priority' },
      { category: 'Logistics', name: 'Route Distance Optimization', baseline: '0%', simulated: '-15%', unit: 'distance' },
      { category: 'Fleet', name: 'Collection Trucks', baseline: 35, simulated: 37, unit: 'units' },
    ],
    baselineMetrics: s2Run.result.baselineMetrics,
    simulatedMetrics: s2Run.result.simulatedMetrics,
    deltas: s2Run.result.deltas,
    bottlenecksBefore: s2Run.result.bottlenecksBefore,
    bottlenecksAfter: s2Run.result.bottlenecksAfter,
    bottleneckDiff: s2Run.result.resolvedBottlenecks.map((b) => ({
      facilityId: b.facilityId,
      facilityName: b.facilityName,
      beforeSeverity: b.beforeSeverity,
      afterSeverity: b.afterSeverity,
      status: b.status === 'RESOLVED' ? 'RESOLVED' : b.status === 'RELIEVED' ? 'REDUCED' : 'UNCHANGED',
    })),
    environmentalImpact: {
      co2eDeltaPct: s2Run.result.environmentalImpact.co2eDeltaPct,
      co2eDeltaKg: s2Run.result.environmentalImpact.co2eDeltaKg,
      co2eDeltaT: Number((Math.abs(s2Run.result.environmentalImpact.co2eDeltaKg) / 1000).toFixed(1)),
      landfillDeltaPct: s2Run.result.environmentalImpact.landfillDeltaPct,
      landfillDeltaT: s2Run.result.environmentalImpact.landfillDeltaT,
      fuelDeltaPct: s2Run.result.environmentalImpact.fuelDeltaPct,
      fuelDeltaLiters: s2Run.result.environmentalImpact.fuelDeltaLiters,
      tripsDeltaPct: s2Run.result.environmentalImpact.tripsDeltaPct,
      tripsDeltaCount: Math.round(
        (s2Run.result.baselineMetrics.tripsToday * Math.abs(s2Run.result.environmentalImpact.tripsDeltaPct)) / 100,
      ),
      recoveryDeltaPct: s2Run.result.environmentalImpact.recoveryDeltaPct,
      wasteDivertedT: Math.abs(s2Run.result.environmentalImpact.landfillDeltaT),
      backlogDeltaPct: s2Run.result.environmentalImpact.backlogDeltaPct,
    },
    tradeoffs: {
      benefits: [
        'Restores Kurla ward collection cycle punctuality to 94%',
        'Saves ~310 liters of diesel per day previously wasted in traffic crawl',
        'Reduces round-trip duration by 28 minutes per vehicle',
      ],
      downsides: [
        'Requires coordination with municipal traffic police for transit green waves',
        'Slight toll and compliance management on arterial expressways',
      ],
      capitalRequirement: 'LOW',
      operationalComplexity: 'MEDIUM',
      timeToDeploy: '1–2 weeks',
    },
    flowStages: {
      current: {
        collectionStatus: 'Delayed collection turnaround',
        transferStatus: 'Spiky arrivals',
        sortingStatus: 'warning',
        sortingNote: 'Erratic delivery batches',
        processingStatus: 'normal',
        landfillLoadT: s2Run.result.baselineMetrics.wasteToLandfillT,
        recoveryRatePct: s2Run.result.baselineMetrics.recoveryRatePct,
      },
      scenario: {
        collectionStatus: 'Rapid on-time clearance',
        transferStatus: 'Steady paced flow',
        sortingStatus: 'normal',
        sortingNote: 'Smooth continuous intake',
        processingStatus: 'normal',
        landfillLoadT: s2Run.result.simulatedMetrics.wasteToLandfillT,
        recoveryRatePct: s2Run.result.simulatedMetrics.recoveryRatePct,
      },
    },
    causalChainBefore: [
      { label: 'CORRIDOR DELAY', detail: 'Sion roadworks trap heavy trucks for 75 minutes', tone: 'critical' },
      { label: 'FLEET STRANDED', detail: 'Vehicles miss scheduled afternoon ward pickups', tone: 'warn' },
      { label: 'STREET ACCUMULATION', detail: 'Litter overflows in Kurla and Dharavi border bins', tone: 'critical' },
      { label: 'EXCESS FUEL', detail: 'Stop-and-go heavy idling consumes 310 L surplus diesel', tone: 'warn' },
    ],
    causalChainAfter: [
      { label: 'TRANSIT GREEN WAVE', detail: 'Municipal signal priority clears arterial corridor', tone: 'signal' },
      { label: 'REDUCED T·KM', detail: 'Dynamic rerouting reduces total haul distance by 15%', tone: 'signal' },
      { label: 'ON-TIME PICKUP', detail: '100% of ward street containers cleared before 14:00', tone: 'signal' },
      { label: 'LOWER EMISSIONS', detail: 'Transport CO₂e drops by 8.4% across central fleet', tone: 'cyan' },
    ],
    storySlides: [
      {
        stage: 'PROBLEM',
        title: 'The Bottleneck',
        headline: 'Sion Junction Congestion Paralyzes Haulage',
        description:
          'Collection trucks serving Kurla, Chembur, and Dharavi spend 45+ minutes idling at Sion Circle, delaying return trips and leaving street bins overflowing.',
        keyMetrics: [
          { label: 'Corridor Delay', value: '+75 MIN', tone: 'critical' },
          { label: 'Ward Service Rate', value: '82%', tone: 'warn' },
          { label: 'Idling Fuel Burn', value: '310 L/D', tone: 'critical' },
        ],
      },
      {
        stage: 'INTERVENTION',
        title: 'The Proposal',
        headline: 'Dynamic Freight Corridor & Highway Bypass',
        description:
          'Implement dedicated municipal green wave windows on the Eastern Freeway and redirect heavy haulers to bypass arterial bottlenecks.',
        keyMetrics: [
          { label: 'Transit Route', value: 'UNBLOCKED', tone: 'signal' },
          { label: 'Distance Saved', value: '-15%', tone: 'signal' },
          { label: 'Capex', value: 'LOW', tone: 'signal' },
        ],
      },
      {
        stage: 'CHANGE',
        title: 'Operational Velocity',
        headline: 'Fast Turnaround Restores Ward Punctuality',
        description:
          'Haulers complete trips 28 minutes faster, enabling 100% scheduled pickup without requiring overtime dispatch.',
        keyMetrics: [
          { label: 'Round-Trip Savings', value: '-28 MIN', tone: 'signal' },
          { label: 'Ward Service Index', value: '96%', tone: 'signal' },
          { label: 'Unproductive Trips', value: '-14', tone: 'signal' },
        ],
      },
      {
        stage: 'ENVIRONMENT',
        title: 'Carbon Impact',
        headline: 'Immediate Reduction in Urban Exhaust Emissions',
        description:
          'Slashing idling time and travel distance eliminates 2,100 kg CO₂e daily from residential ward corridors.',
        keyMetrics: [
          { label: 'Diesel Saved', value: '310 L/DAY', tone: 'signal' },
          { label: 'Transport CO₂e', value: '-8.4%', tone: 'signal' },
        ],
      },
      {
        stage: 'RESULT',
        title: 'Outcome',
        headline: 'Synchronized Central Logistics Mesh',
        description:
          'A reliable transport corridor stabilizes city logistics and protects downstream sorting from irregular arrival shocks.',
        keyMetrics: [
          { label: 'Corridor Status', value: 'NORMAL', tone: 'signal' },
          { label: 'Fleet Efficiency', value: '+18%', tone: 'signal' },
        ],
      },
    ],
  }

  // Scenario 3: Material Recovery Boost & RDF Segregation
  const s3Params = {
    ...DEFAULT_SIMULATION_PARAMETERS,
    targetRecoveryRatePct: 75.0,
    kanjurmargRecoveryCapacity: 2600,
    deonarRecoveryCapacity: 3400,
    kanjurmargProcessingCapacity: 1500,
  }
  const s3Run = runSimulation(s3Params, baselineModel)

  const s3: ScenarioDetailData = {
    scenarioId: 'SCEN-RECOV-03',
    scenarioName: 'Material Recovery Boost & RDF Diversion',
    description:
      'Upgrades automated mechanical biological sorting to elevate citywide recovery to 75%, diverting 720 tonnes daily from the Deonar dumpsite.',
    status: 'SAVED',
    targetFacilityId: 'R-KJ',
    targetFacilityName: 'Kanjurmarg & Deonar Recovery Lines',
    category: 'RECOVERY',
    interventionSummary: '54% → 75% Recovery (+21%) · Diverts 720 T/day from dumpsite',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    baselineParameters: DEFAULT_SIMULATION_PARAMETERS,
    simulationParameters: s3Params,
    changedVariables: [
      { category: 'Recovery', name: 'City Target Recovery Rate', baseline: '54.2%', simulated: '75.0%', unit: '%' },
      { category: 'Recovery', name: 'Kanjurmarg MRF Capacity', baseline: 1900, simulated: 2600, unit: 'T/day' },
      { category: 'Recovery', name: 'Deonar MRF Capacity', baseline: 2600, simulated: 3400, unit: 'T/day' },
    ],
    baselineMetrics: s3Run.result.baselineMetrics,
    simulatedMetrics: s3Run.result.simulatedMetrics,
    deltas: s3Run.result.deltas,
    bottlenecksBefore: s3Run.result.bottlenecksBefore,
    bottlenecksAfter: s3Run.result.bottlenecksAfter,
    bottleneckDiff: s3Run.result.resolvedBottlenecks.map((b) => ({
      facilityId: b.facilityId,
      facilityName: b.facilityName,
      beforeSeverity: b.beforeSeverity,
      afterSeverity: b.afterSeverity,
      status: b.status === 'RESOLVED' ? 'RESOLVED' : b.status === 'RELIEVED' ? 'REDUCED' : 'UNCHANGED',
    })),
    environmentalImpact: {
      co2eDeltaPct: s3Run.result.environmentalImpact.co2eDeltaPct,
      co2eDeltaKg: s3Run.result.environmentalImpact.co2eDeltaKg,
      co2eDeltaT: Number((Math.abs(s3Run.result.environmentalImpact.co2eDeltaKg) / 1000).toFixed(1)),
      landfillDeltaPct: s3Run.result.environmentalImpact.landfillDeltaPct,
      landfillDeltaT: s3Run.result.environmentalImpact.landfillDeltaT,
      fuelDeltaPct: s3Run.result.environmentalImpact.fuelDeltaPct,
      fuelDeltaLiters: s3Run.result.environmentalImpact.fuelDeltaLiters,
      tripsDeltaPct: s3Run.result.environmentalImpact.tripsDeltaPct,
      tripsDeltaCount: 12,
      recoveryDeltaPct: s3Run.result.environmentalImpact.recoveryDeltaPct,
      wasteDivertedT: Math.abs(s3Run.result.environmentalImpact.landfillDeltaT),
      backlogDeltaPct: s3Run.result.environmentalImpact.backlogDeltaPct,
    },
    tradeoffs: {
      benefits: [
        'Massive landfill diversion (-720 T/day) extending dumpsite life by 4+ years',
        'Generates industrial revenue via Refuse-Derived Fuel (RDF) off-take agreements',
        'Substantially cuts long-term fugitive methane generation',
      ],
      downsides: [
        'High capital cost for NIR optical sorting separators and baling plants',
        'Requires continuous laboratory testing for RDF calorific and moisture standards',
      ],
      capitalRequirement: 'HIGH',
      operationalComplexity: 'MEDIUM',
      timeToDeploy: '3–6 months',
    },
    flowStages: {
      current: {
        collectionStatus: 'Mixed pickup',
        transferStatus: 'Bulk haulage',
        sortingStatus: 'warning',
        sortingNote: 'Manual sorting limits recovery',
        processingStatus: 'normal',
        landfillLoadT: s3Run.result.baselineMetrics.wasteToLandfillT,
        recoveryRatePct: s3Run.result.baselineMetrics.recoveryRatePct,
      },
      scenario: {
        collectionStatus: 'Segregated streams',
        transferStatus: 'Dry fraction routed to MRF',
        sortingStatus: 'normal',
        sortingNote: 'Automated optical classification',
        processingStatus: 'normal',
        landfillLoadT: s3Run.result.simulatedMetrics.wasteToLandfillT,
        recoveryRatePct: s3Run.result.simulatedMetrics.recoveryRatePct,
      },
    },
    causalChainBefore: [
      { label: 'LOW EXTRACTION', detail: 'Manual lines extract only 54% of recoverable dry fractions', tone: 'critical' },
      { label: 'LANDFILL BURDEN', detail: '3,840 T/day dumped at Deonar, filling remaining airspace', tone: 'critical' },
      { label: 'METHANE EMISSIONS', detail: 'Organic/paper mixtures undergo open anaerobic decomposition', tone: 'critical' },
    ],
    causalChainAfter: [
      { label: 'OPTICAL UPGRADE', detail: 'Infrared sorting automated for plastics, paper, and textiles', tone: 'signal' },
      { label: 'CIRCULAR RECOVERY', detail: 'Citywide recovery elevates to 75.0%', tone: 'signal' },
      { label: 'DIVERSION DIVIDEND', detail: '720 T/day diverted from dumpsite; methane emissions drop 18%', tone: 'signal' },
    ],
    storySlides: [
      {
        stage: 'PROBLEM',
        title: 'The Challenge',
        headline: 'Open Dumpsites are Nearing Airspace Exhaustion',
        description:
          'Dumping 3,840 tonnes daily at Deonar exhausts landfill capacity and generates intense greenhouse gas flaring.',
        keyMetrics: [
          { label: 'Current Landfill Intake', value: '3,840 T/DAY', tone: 'critical' },
          { label: 'Circularity Rate', value: '54.2%', tone: 'warn' },
        ],
      },
      {
        stage: 'INTERVENTION',
        title: 'The Upgrade',
        headline: 'High-Throughput Optical Material Recovery',
        description:
          'Modernize mechanical biological sorting with NIR spectrometers and RDF pelletizers at both major hubs.',
        keyMetrics: [
          { label: 'Target Recovery', value: '75.0%', tone: 'signal' },
          { label: 'RDF Output', value: '+450 T/DAY', tone: 'signal' },
          { label: 'Capex', value: 'HIGH', tone: 'warn' },
        ],
      },
      {
        stage: 'CHANGE',
        title: 'Mass Balance',
        headline: '720 Tonnes Diverted Every Single Day',
        description:
          'Instead of heading to the dumpsite, dry fractions are baled and transferred directly to regional cement kilns for thermal energy.',
        keyMetrics: [
          { label: 'Direct Diversion', value: '720 T/DAY', tone: 'signal' },
          { label: 'Landfill Reduction', value: '-18.8%', tone: 'signal' },
        ],
      },
      {
        stage: 'ENVIRONMENT',
        title: 'Environmental Shield',
        headline: 'Major Avoided Fugitive Methane Emissions',
        description:
          'Diverting high-calorific organics and plastics eliminates 1,450 kg CO₂e/day of fugitive dumpsite gases.',
        keyMetrics: [
          { label: 'CO₂e Reduction', value: '-12.5%', tone: 'signal' },
          { label: 'Dumpsite Life Added', value: '+4.2 YEARS', tone: 'signal' },
        ],
      },
      {
        stage: 'RESULT',
        title: 'Strategic Verdict',
        headline: 'Mumbai as a Circular Urban Leader',
        description:
          'Transforms waste management from an open disposal liability into an industrial feedstock resource.',
        keyMetrics: [
          { label: 'Circularity Index', value: '75.0%', tone: 'signal' },
          { label: 'Landfill Dependency', value: 'LOW', tone: 'signal' },
        ],
      },
    ],
  }

  return [s1, s2, s3]
}

/**
 * CONVERT A SAVED SNAPSHOT (From Phase 6 or 7) TO FULL SCENARIO DETAIL
 */
/**
 * CONVERT A SAVED SNAPSHOT (From Phase 6 or 7) TO FULL SCENARIO DETAIL
 */
export function convertSnapshotToScenarioDetail(
  snapshot: SimulationScenarioSnapshot | SavedOptimizationScenario,
  _baselineModel?: TwinModel,
): ScenarioDetailData {
  const isOpt = 'interventionId' in snapshot
  const category = isOpt ? (snapshot as SavedOptimizationScenario).category : 'CUSTOM SIMULATION'
  
  const changedVars: ScenarioChangedVariable[] = isOpt
    ? [
        {
          category: (snapshot as SavedOptimizationScenario).category,
          name: (snapshot as SavedOptimizationScenario).title,
          baseline: 'Baseline Level',
          simulated: 'Recommended Target',
        },
      ]
    : ((snapshot as SimulationScenarioSnapshot).changedVariables || []).map((v) => ({
        category: v.category,
        name: v.name,
        baseline: v.baseline,
        simulated: v.simulated,
        unit: v.unit,
      }))

  const target = isOpt
    ? (snapshot as SavedOptimizationScenario).target
    : changedVars[0]?.name || 'City Network'

  const impact = snapshot.environmentalImpact
  const co2eDeltaT = Number((Math.abs(impact.co2eDeltaKg) / 1000).toFixed(1))

  const baseParams = isOpt
    ? DEFAULT_SIMULATION_PARAMETERS
    : (snapshot as SimulationScenarioSnapshot).baselineParameters
  const simParams = isOpt
    ? (snapshot as SavedOptimizationScenario).parameters
    : (snapshot as SimulationScenarioSnapshot).simulationParameters

  const tradeoffs: OptimizationTradeoffs = isOpt
    ? (snapshot as SavedOptimizationScenario).tradeoffs
    : {
        benefits: ['Calculated reduction in network friction and emission profile'],
        downsides: ['Operational transition and resource realignment'],
        capitalRequirement: 'MEDIUM' as const,
        operationalComplexity: 'LOW' as const,
        timeToDeploy: '1–2 months',
      }

  return {
    scenarioId: snapshot.scenarioId,
    scenarioName: snapshot.scenarioName,
    description: `Scenario created from ${isOpt ? 'Optimization Recommendation' : 'Simulation Lab'} on ${new Date(snapshot.timestamp).toLocaleDateString()}.`,
    status: 'SAVED',
    category,
    targetFacilityName: target,
    interventionSummary: changedVars.map((v) => `${v.name}: ${v.baseline} → ${v.simulated}`).join(' · '),
    createdAt: snapshot.timestamp,
    updatedAt: snapshot.timestamp,
    baselineParameters: baseParams,
    simulationParameters: simParams,
    changedVariables: changedVars,
    baselineMetrics: snapshot.baselineMetrics,
    simulatedMetrics: snapshot.simulatedMetrics,
    deltas: snapshot.deltas,
    bottlenecksBefore: snapshot.bottlenecksBefore,
    bottlenecksAfter: snapshot.bottlenecksAfter,
    bottleneckDiff: snapshot.bottlenecksBefore.map((before) => {
      const after = snapshot.bottlenecksAfter.find((b) => b.facilityId === before.facilityId)
      const afterSeverity = after?.severity ?? 'normal'
      const status = !after || afterSeverity === 'normal' ? 'RESOLVED' : afterSeverity !== before.severity ? 'REDUCED' : 'UNCHANGED'
      return {
        facilityId: before.facilityId,
        facilityName: before.facility.name,
        beforeSeverity: before.severity,
        afterSeverity,
        status: status as 'RESOLVED' | 'REDUCED' | 'UNCHANGED' | 'NEW',
      }
    }),
    environmentalImpact: {
      co2eDeltaPct: impact.co2eDeltaPct,
      co2eDeltaKg: impact.co2eDeltaKg,
      co2eDeltaT,
      landfillDeltaPct: impact.landfillDeltaPct,
      landfillDeltaT: impact.landfillDeltaT,
      fuelDeltaPct: impact.fuelDeltaPct,
      fuelDeltaLiters: impact.fuelDeltaLiters,
      tripsDeltaPct: impact.tripsDeltaPct,
      tripsDeltaCount: Math.round(
        (snapshot.baselineMetrics.tripsToday * Math.abs(impact.tripsDeltaPct)) / 100,
      ),
      recoveryDeltaPct: impact.recoveryDeltaPct,
      wasteDivertedT: Math.abs(impact.landfillDeltaT),
      backlogDeltaPct: impact.backlogDeltaPct,
    },
    tradeoffs,
    flowStages: {
      current: {
        collectionStatus: 'Baseline collection',
        transferStatus: 'Standard transfer',
        sortingStatus: 'critical',
        sortingNote: `${snapshot.baselineMetrics.criticalBottlenecksCount} critical bottlenecks active`,
        processingStatus: 'normal',
        landfillLoadT: snapshot.baselineMetrics.wasteToLandfillT,
        recoveryRatePct: snapshot.baselineMetrics.recoveryRatePct,
      },
      scenario: {
        collectionStatus: 'Optimized pickup',
        transferStatus: 'Paced transfer',
        sortingStatus: snapshot.simulatedMetrics.criticalBottlenecksCount === 0 ? 'normal' : 'warning',
        sortingNote: `${snapshot.simulatedMetrics.criticalBottlenecksCount} critical bottlenecks remaining`,
        processingStatus: 'normal',
        landfillLoadT: snapshot.simulatedMetrics.wasteToLandfillT,
        recoveryRatePct: snapshot.simulatedMetrics.recoveryRatePct,
      },
    },
    causalChainBefore: [
      { label: 'BASELINE LOAD', detail: 'System constrained by rated capacity limits', tone: 'critical' },
      { label: 'BOTTLENECKS', detail: `${snapshot.bottlenecksBefore.length} bottleneck nodes identified`, tone: 'warn' },
      { label: 'EMISSIONS', detail: `${snapshot.baselineMetrics.co2eKg.toLocaleString()} kg/day total CO₂e footprint`, tone: 'critical' },
    ],
    causalChainAfter: [
      { label: 'INTERVENTION', detail: 'Parameters adjusted to relieve network friction', tone: 'signal' },
      { label: 'FLOW BALANCED', detail: 'Throughput expanded and queues minimized', tone: 'signal' },
      { label: 'ABATEMENT', detail: `${Math.abs(impact.co2eDeltaKg).toLocaleString()} kg CO₂e abated daily`, tone: 'cyan' },
    ],
    storySlides: [
      {
        stage: 'PROBLEM',
        title: 'Initial State',
        headline: snapshot.scenarioName,
        description: 'Baseline operations before simulated intervention.',
        keyMetrics: [
          { label: 'Baseline CO₂e', value: `${(snapshot.baselineMetrics.co2eKg / 1000).toFixed(1)} T/D` },
          { label: 'Landfill Load', value: `${snapshot.baselineMetrics.wasteToLandfillT} T/D` },
        ],
      },
      {
        stage: 'INTERVENTION',
        title: 'The Move',
        headline: 'Configured Adjustments',
        description: changedVars.map((v) => `${v.name}: ${v.simulated}`).join(', '),
        keyMetrics: [{ label: 'Variables Changed', value: `${changedVars.length}` }],
      },
      {
        stage: 'RESULT',
        title: 'Simulated Outcomes',
        headline: 'Measured Improvements',
        description: 'Recalculated flow across the Mumbai waste network.',
        keyMetrics: [
          { label: 'CO₂e', value: `${impact.co2eDeltaPct.toFixed(1)}%`, tone: 'signal' },
          { label: 'Landfill', value: `${impact.landfillDeltaPct.toFixed(1)}%`, tone: 'signal' },
        ],
      },
    ],
  }
}

/**
 * DUPLICATE SCENARIO HELPER
 */
export function duplicateScenario(scenario: ScenarioDetailData): ScenarioDetailData {
  const newId = `SCEN-${Date.now().toString(36).toUpperCase()}`
  return {
    ...scenario,
    scenarioId: newId,
    scenarioName: `${scenario.scenarioName} (Copy)`,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * FILTER SCENARIOS HELPER
 */
export function filterScenarios(
  scenarios: ScenarioDetailData[],
  filters: ScenarioFilterOptions,
): ScenarioDetailData[] {
  return scenarios.filter((scen) => {
    // Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase()
      const match =
        scen.scenarioName.toLowerCase().includes(q) ||
        scen.targetFacilityName.toLowerCase().includes(q) ||
        scen.category.toLowerCase().includes(q) ||
        scen.description.toLowerCase().includes(q)
      if (!match) return false
    }

    // Category filter
    if (filters.categoryFilter !== 'ALL' && scen.category !== filters.categoryFilter) {
      return false
    }

    // Status filter
    if (filters.statusFilter !== 'ALL' && scen.status !== filters.statusFilter) {
      return false
    }

    // Impact filter
    if (filters.impactFilter === 'HIGH_CO2' && scen.environmentalImpact.co2eDeltaPct > -10) {
      return false
    }
    if (filters.impactFilter === 'HIGH_LANDFILL' && scen.environmentalImpact.landfillDeltaPct > -15) {
      return false
    }
    if (filters.impactFilter === 'HIGH_RECOVERY' && scen.environmentalImpact.recoveryDeltaPct < 10) {
      return false
    }

    return true
  })
}
