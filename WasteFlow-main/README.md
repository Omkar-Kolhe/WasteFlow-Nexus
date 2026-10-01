# WasteFlow Nexus — Phase 4

**A waste digital twin and bottleneck analysis platform.**
Phase 1 built the product foundation and the interactive twin. Phase 2 made it a data-driven
Mumbai network. Phase 3 added the calculation engine behind it. **Phase 4 adds Bottleneck
Intelligence**: the engine now explains WHERE flow fails, WHY it fails, and WHAT it costs —
with an animated root-cause chain, impact estimation and fix previews, all derived from the
ledgers rather than authored copy.

> Waste is a flow. Make it visible.

---

## Run

```bash
npm install
npm run dev        # http://localhost:5183
npm run build      # typecheck + production build
npm run typecheck
```

## What Phase 4 is (and is not)

**Built on top of Phases 1–3 (visual identity unchanged)**

- **`src/engine/bottleneckEngine.ts`** — detection, root causes, impacts and fixes, all read
  from the Phase 3 ledgers: pressure score (utilisation + queue friction + accumulation),
  severity on the twin's node-state bands, topology-derived root causes (congested inbound
  corridors, over-capacity, tipping-face constraints), and a derived dependency chain.
- **Impact model** — queue population from TRIPS (not fleet units) over the operating window;
  delayed tonnage = queue-held + ledger backlog + zone-held; idle + rework fuel from the
  transport engine's own per-trip figures; CO₂e from combustion; diversion potential above the
  85% healthy band.
- **Bottleneck Intelligence page** (`BottlenecksView`): header + four KPI cards (Active
  Bottlenecks, Critical Capacity, Waste Currently Delayed, Potential CO₂ Reduction), the
  six-stage `StageFlow` visualisation (utilisation-coloured vessels, particles that slow and
  pile up behind constrained stages), ranked `BottleneckCard`s with `CapacityGauge`s, and an
  upstream service-gap section for the wards.
- **`BottleneckDetailPanel`** — the WHY modal: animated `RootCauseChain` (observed signal →
  likely cause → environmental consequence, with a replay control), `ImpactMetrics` with
  rAF-eased numbers, capacity-vs-incoming bars, inbound corridor loads, waste accumulation,
  and WHAT-COULD-FIX-IT preview cards (explicitly labelled as Phase 6 previews).
- **Map integration without map replacement** — `requestFocus()` in the store lets module
  views move the twin's camera; facility panels keep working; the existing layers, particles
  and status layer are untouched.

**Deliberately not built yet** — what-if simulation and intervention effects (Phase 6: the fix
cards are previews, not simulations), AI/ML prediction (5), optimisation (7).

## What Phase 3 is (and is not)

**Built on top of Phases 1–2 (unchanged visuals)**

- **`src/engine/` — the calculation core.** Pure modules, no React, no canvas:
  - `collectionEngine` — ward service ledger: generated / collected / uncollected, collection
    trips, round fuel, and tonnage **held at zone** when its outbound corridor is blocked.
  - `transportEngine` — corridor economics: payload by corridor type, trips/day (spec case 3),
    mix-weighted diesel-equivalent litres; blocked corridors burn nothing and report `heldT`.
  - `facilityEngine` — node ledger from the route set: incoming, processed = min(in, capacity),
    **backlog** = max(0, in − capacity), over-capacity flag, product exit, disposal sink,
    yard-buffer stock draw, and a per-node mass audit that closes to zero.
  - `environmentalEngine` — haulage CO₂e by drivetrain mix, facility footprints minus credits.
  - `metricsEngine` — the city rollup (recovery rate, landfill load, system utilisation, fuel
    split, trips) plus the **deterministic 7-day ledger**, which re-runs the facility and
    transport engines at each day's scaled demand — the Fri/Sat market surge genuinely pushes
    Kanjurmarg Sorting over capacity (45/118 t backlog) instead of the numbers being typed in.
  - `wasteFlowEngine` — load factor, route state, flow tier, particle counts, per-link CO₂e
    (the Phase 2 flow model, relocated into the engine per the §22 layout).
  - `validation` — the five §20 cases against the primitives **plus** a 41-case consistency
    audit of the live network (processed/backlog identities, mass residuals).
- **Single source of calculations.** `data/metrics.ts` now composes the engine run; every HUD
  figure, panel value and view table resolves through `TwinModel.engine` / `TwinModel.totals`.
- **UI feedback, twin still dominant (§21):** facility panel shows INCOMING / PROCESSED /
  BACKLOG (or WAITING), OVER CAPACITY and HELD AT ZONE banners, product exit, zone trips and
  fuel; route panel adds TRIPS and FUEL (HELD on a closed corridor); the HUD footer shows fleet
  fuel and trips/day; Operations gains a fuel-split card and over-capacity backlog badges.
- **7-day ledger table** in Analytics: generated / collected / processed / recovered / landfill
  / backlog / trips / fuel / CO₂e, Thursday stamped LIVE — identical on every load (no random).
- **QA hook:** in dev, `__wasteflowQA()` in the console runs the full validation suite.

**Deliberately not built yet** — bottleneck detection and root-cause analysis (Phase 4),
AI/ML prediction (5), what-if simulation (6), optimisation (7). The engine's output contract
(`CityTotals`, `FacilityResult`, `TransportResult`, `CollectionResult`, `DayLedgerEntry`) is
what those phases consume; the detection phase replaces threshold flags with real analysis.

## Architecture

```
src/
  App.tsx                     landing ⇄ app phases + entry wipe
  config/network.ts           every threshold, factor, label, model constant
  data/                       the mock network (records only — no business rules)
    city.ts                    city metadata, substreams, city selector options
    cityZones.ts               8 Mumbai wards + collection profiles + generation points
    facilities.ts              10 infrastructure nodes, capacities, queues, mix
    routes.ts                  27 links: volume, distance, travel time, capacity, fleet
    vehicles.ts                12 tracked fleet units with route assignment
    metrics.ts                 derives TwinModel by RUNNING the engine (§ composition)
    series.ts                  deterministic mock 24h traces
  engine/                     PHASE 3 CALCULATION CORE (pure, testable, React-free)
    primitives.ts              backlog, trips, fuel, recovery, utilization, mix math
    collectionEngine.ts        ward service ledger + held-at-zone
    transportEngine.ts         trips, payload, mix-weighted fuel per corridor
    facilityEngine.ts          incoming/processed/backlog + full mass audit
    environmentalEngine.ts     CO₂e by drivetrain mix + facility footprints
    metricsEngine.ts           city rollup + deterministic 7-day ledger
    wasteFlowEngine.ts         load factor, route state, tiers, particles, per-link CO₂e
    run.ts                     orchestrates one pass: collection → facility → transport…
    dayModel.ts                named §19 ledger API
    validation.ts              §20 cases + live consistency audit
    types.ts                   EngineResult contract consumed by Phases 4–7
  state/twinStore.ts          UI + system state (zustand); never owned by the renderer
  twin/                       rendering engine (framework-agnostic TypeScript)
    TwinEngine.ts              camera, input, picking, render loop, layer orchestration
    network.ts                 geometry + particle pools from the model
    renderContext.ts           the per-frame contract every layer receives
    layers/
      backdrop.ts              procedural Mumbai plan, streets, district lettering
      routeLayer.ts            flow: strokes, particles, congestion, emission readouts
      facilityNode.ts          facility glyphs, state overlays, zone service arcs
      statusLayer.ts           contention rings, queue chips, state chips
      vehicleLayer.ts          fleet movement bound to corridor state
    palette.ts, text.ts        colour + typography tokens for canvas
  components/
    landing/                   entry experience + ambient flow field
    shell/                     TopBar, Navigation, AppShell, BottomStatusBar, Logo
    twin/                      WasteNetwork, DigitalTwin, SystemHUD, MetricCard,
                               SystemStatus, StatusIndicator, MaterialPipeline,
                               NetworkLegend, LayerControls, ViewportControls,
                               FacilityPanel, RoutePanel, NodeTooltip, SimulationPlaceholder
    views/                     the six non-twin modules + ModuleShell
    ui/                        Button, Panel, Meter, Sparkline, Tooltip
```

### Conventions that keep later phases cheap

- **DATA → ENGINE → VISUALIZATION → UI.** Components never compute business rules; the engine
  is the only place utilisation, backlog, trips, fuel and CO₂e are calculated (§22).
- **One run, one tree.** `runEngines(input)` produces a serialisable `EngineResult`. Phase 6
  simulation re-runs the same pipeline over modified inputs and diffs ledgers.
- **Integrity is enforced, not assumed.** Every node's mass audit must close to zero (held
  material, yard-buffer draws, disposal and product exits are explicit sinks);
  `validateEngines()` fails loudly otherwise.
- **The store owns state, the engine reads it.** `setLayers/setSelected/setHovered/setActive`
  are the whole engine ↔ React contract; the engine emits `onSelect/onHover/onStats`.
- **Config, not scatter.** Thresholds, fuel factors, payload/road models and the weekly demand
  shape live in `config/network.ts` and the engine's constant blocks.
- **Derived, not hard-coded.** The landing page's "mass balance verified" line, the HUD, the
  panels and the 7-day table all resolve from the same engine output.

### Validation (§20)

The five spec cases run against the primitives — plus per-node consistency checks on the live
network (41 cases in dev via `__wasteflowQA()`):

| Case | Input | Expected |
| --- | --- | --- |
| C1 | input 100 T, capacity 150 T | backlog 0 |
| C2 | input 200 T, capacity 150 T | backlog 50 T |
| C3 | payload 10 T, waste 50 T | 5 trips |
| C4 | processed 100 T, recovered 70 T | 70% recovery |
| C5 | input 500 T, capacity 400 T | 125% utilisation |

### Interaction reference

| Input | Action |
| --- | --- |
| Drag | Pan |
| Wheel / `+` `-` | Zoom (cursor-anchored) |
| Click node | Open facility panel (zone or plant ledger) |
| Click corridor | Open route panel (flow, trips, fuel) |
| Double-click node / route | Camera focus |
| `0` | Reset view |
| Arrows | Pan |
| Esc | Clear inspection |
| Shift-click layer | Isolate layer |
| `Enter` (landing) | Enter the twin |

### Performance notes

- One canvas, `devicePixelRatio` capped at 2, ~250 particles network-wide.
- The render loop pauses when the tab is hidden and whenever the twin is not the visible module.
- The engine runs once per model build (memoised), not per frame or per render.
- Reduced-motion is respected: atmosphere remains, movement stops.
- Framer Motion is used for DOM transitions only; nothing animates the canvas through React.

## Mock dataset (Mumbai)

Eight wards (Andheri, Bandra, Kurla, Powai, Dadar, Borivali, Chembur, Mulund) generating
6,830 t/day; 6,434 t/day collected; 396 t/day service gap. Ten infrastructure nodes across
transfer (Mulund, Kanjurmarg, Deonar), sorting (Kanjurmarg, Deonar), processing (Kanjurmarg,
Trombay), recovery (Kanjurmarg, Deonar) and the Deonar landfill, joined by 27 corridors and
89 fleet assignments (12 units tracked individually). Kanjurmarg Sorting runs at 96.3% and
Deonar landfill at 91.6%; corridor RT-06 (Kurla) is blocked, holding 838 t/day at the zone —
all computed by the engine, not painted on.

**DEMO DATA.** Every figure is illustrative prototype data for the WasteFlow Nexus build. It
does not represent real BMC operational data and must not be presented as such.
