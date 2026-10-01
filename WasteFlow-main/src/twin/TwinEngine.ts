import type { LayerId } from '@/types'
import L from 'leaflet'
import type { TwinModel } from '@/data/metrics'
import { clamp, damp } from '@/lib/utils'
import { cubicPoint, TAU, type Vec2 } from '@/lib/geometry'
import { buildNetwork, type LinkGeo, type NetworkGeometry } from './network'
import { linkCurve } from '@/lib/geometry'
import { buildBackdrop, drawBackdrop, type Backdrop } from './layers/backdrop'
import { drawRoutes } from './layers/routeLayer'
import { drawGenerations, drawNodes } from './layers/facilityNode'
import { drawStatusLayer } from './layers/statusLayer'
import { drawVehicles, initVehicleStates, updateVehicles, type VehicleState } from './layers/vehicleLayer'
import { C, rgbaStr } from './palette'
import type { Camera, RenderContext } from './renderContext'
import type { RerouteState } from '@/engine/rerouteEngine'
import { label } from './text'

export interface TwinEngineHandlers {
  onSelect: (id: string | null) => void
  onSelectRoute: (id: string | null) => void
  onHover: (id: string | null) => void
  onHoverRoute: (id: string | null) => void
  onStats?: (stats: { fps: number }) => void
}

const MIN_SCALE = 0.28
const MAX_SCALE = 2.8
const scratch: Vec2 = { x: 0, y: 0 }

interface Ping {
  x: number
  y: number
  t: number
  max: number
}

/**
 * TWIN ENGINE
 *
 * Owns the canvas: camera, input, picking, particle clocks and the render loop.
 * It reads application state (`setLayers`, `setSelected`, `setSelectedRoute`,
 * `setHovered`) and reports interactions back through handlers. It never owns
 * domain data and never mutates the model, so Phase 3+ engines can drive the
 * same view without touching a layer.
 */
export class TwinEngine {
  readonly geo: NetworkGeometry
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private model: TwinModel
  private handlers: TwinEngineHandlers
  private backdrop: Backdrop

  private camera: Camera
  private target: Camera
  private view = { w: 1, h: 1 }
  private dpr = 1

  private layersState: Record<LayerId, boolean> = {
    flow: true,
    vehicles: true,
    facilities: true,
    bottlenecks: true,
    emissions: false,
  }
  private selectedId: string | null = null
  private selectedRouteId: string | null = null
  private hoveredId: string | null = null
  private hoveredRouteId: string | null = null
  private activeId: string | null = null
  private activeLinks = new Set<string>()

  private vehicles: VehicleState[]
  private time = 0
  private last = 0
  private raf = 0
  private running = false
  private active = true
  private reducedMotion = false

  private dragging = false
  private pointerDown = false
  private moved = 0
  private lastPointer: Vec2 = { x: 0, y: 0 }
  private pointer: Vec2 = { x: 0, y: 0 }
  private pings: Ping[] = []

  private subscribers = new Set<() => void>()
  private hasFitted = false
  /** Cleared while the operator has not framed the view themselves. */
  private userFramed = false
  private fps = 60
  private statsTimer = 0
  private resizeObserver?: ResizeObserver
  private motionQuery?: MediaQueryList

  private lmap: L.Map
  private tileLight: L.TileLayer
  private tileDark: L.TileLayer

  constructor(canvas: HTMLCanvasElement, mapDiv: HTMLDivElement, model: TwinModel, handlers: TwinEngineHandlers) {
    this.canvas = canvas
    this.model = model
    this.handlers = handlers

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    this.ctx = ctx

    this.lmap = L.map(mapDiv, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      // Allow fractional zoom so Leaflet scale exactly matches canvas scale
      zoomSnap: 0,
      zoomDelta: 0.1,
      // Disable all animations so the map doesn't lag behind the canvas
      fadeAnimation: false,
      markerZoomAnimation: false,
      zoomAnimation: false,
    })
    
    this.tileLight = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: 'abc',
      maxZoom: 19,
    })
    this.tileDark = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: 'abc',
      maxZoom: 19,
    })
    this.tileDark.addTo(this.lmap)

    this.geo = buildNetwork(model)
    this.backdrop = buildBackdrop(this.geo, model.snapshot.city.world)
    this.vehicles = initVehicleStates(this.geo, model.snapshot.vehicles)

    this.camera = { x: 0, y: 0, scale: 0.5 }
    this.target = { ...this.camera }

    this.attach()
    this.resize()
    this.start()
  }

  /* ── lifecycle ───────────────────────────────────────────── */

  private attach() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false })
    this.canvas.addEventListener('dblclick', this.onDoubleClick)
    window.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('visibilitychange', this.onVisibility)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.canvas)

    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedMotion = this.motionQuery.matches
    this.motionQuery.addEventListener('change', this.onMotionPreference)
  }

  destroy() {
    this.stop()
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('wheel', this.onWheel)
    this.canvas.removeEventListener('dblclick', this.onDoubleClick)
    window.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.motionQuery?.removeEventListener('change', this.onMotionPreference)
    this.resizeObserver?.disconnect()
    this.subscribers.clear()
    this.lmap?.remove()
  }

  private onMotionPreference = (e: MediaQueryListEvent) => {
    this.reducedMotion = e.matches
  }

  private onVisibility = () => {
    if (document.hidden) this.stop()
    else if (this.active) this.start()
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  /** Pause the render loop when the twin is not the visible module. */
  setActive(active: boolean) {
    this.active = active
    if (active && !document.hidden) this.start()
    else this.stop()
  }

  /* ── external API ────────────────────────────────────────── */

  setLayers(layers: Record<LayerId, boolean>) {
    this.layersState = { ...layers }
    this.touch()
  }

  setSelected(id: string | null) {
    if (this.selectedId === id) return
    this.selectedId = id
    if (id) {
      const node = this.geo.nodeById[id]
      if (node) this.pings.push({ x: node.x, y: node.y, t: 0, max: node.r * 4.6 })
    }
    this.recomputeActive()
    this.touch()
  }

  setSelectedRoute(id: string | null) {
    if (this.selectedRouteId === id) return
    this.selectedRouteId = id
    this.recomputeActive()
    this.touch()
  }

  setHovered(id: string | null) {
    if (this.hoveredId === id) return
    this.hoveredId = id
    this.recomputeActive()
    this.touch()
  }

  setHoveredRoute(id: string | null) {
    if (this.hoveredRouteId === id) return
    this.hoveredRouteId = id
    this.touch()
  }

  setRerouteState(state?: RerouteState) {
    this.rerouteState = state
    this.touch()
  }

  private rerouteState?: RerouteState

  private recomputeActive() {
    this.activeId = this.hoveredId ?? this.selectedId
    this.activeLinks = new Set()
    if (this.activeId) {
      for (const id of this.geo.linksByNode[this.activeId] ?? []) this.activeLinks.add(id)
    }
    if (this.selectedRouteId) this.activeLinks.add(this.selectedRouteId)
  }

  /** Subscribe to camera/viewport changes so DOM overlays can follow the map. */
  subscribe(cb: () => void) {
    this.subscribers.add(cb)
    return () => {
      this.subscribers.delete(cb)
    }
  }

  private touch() {
    for (const cb of this.subscribers) cb()
  }

  /** Screen-space position (CSS pixels) of a network node. */
  screenOf(id: string): { x: number; y: number } | null {
    const node = this.geo.nodeById[id]
    if (!node) return null
    return this.worldToScreen(node.x, node.y)
  }

  /** Screen-space position of any world point — used to anchor the route panel. */
  screenOfPoint(x: number, y: number) {
    return this.worldToScreen(x, y)
  }

  worldToScreen(x: number, y: number) {
    return {
      x: this.view.w / 2 + (x - this.camera.x) * this.camera.scale,
      y: this.view.h / 2 + (y - this.camera.y) * this.camera.scale,
    }
  }

  screenToWorld(x: number, y: number, camera: Camera = this.camera) {
    return {
      x: camera.x + (x - this.view.w / 2) / camera.scale,
      y: camera.y + (y - this.view.h / 2) / camera.scale,
    }
  }

  getViewport() {
    return { ...this.view }
  }

  getScale() {
    return this.camera.scale
  }

  getPointer() {
    return { ...this.pointer }
  }

  /**
   * Safe area kept clear of the HUD so the fitted network never hides behind a
   * panel. Derived from viewport width, matching the responsive overlay rules.
   */
  private safeInsets() {
    const w = this.view.w
    return {
      left: w >= 1200 ? 396 : w >= 900 ? 320 : 16,
      right: w >= 1280 ? 300 : 60,
      top: 58,
      bottom: w >= 1024 ? 76 : 44,
    }
  }

  fitCamera(zoomOut = 1) {
    const nodes = this.geo.nodes
    const bounds = nodes.reduce(
      (acc, n) => ({
        minX: Math.min(acc.minX, n.x - n.r),
        minY: Math.min(acc.minY, n.y - n.r),
        maxX: Math.max(acc.maxX, n.x + n.r),
        maxY: Math.max(acc.maxY, n.y + n.r),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    )
    const sized = this.view.w > 40 && this.view.h > 40
    if (!sized) {
      return { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2, scale: 0.5 }
    }
    const insets = this.safeInsets()
    const availW = Math.max(160, this.view.w - insets.left - insets.right)
    const availH = Math.max(160, this.view.h - insets.top - insets.bottom)
    const w = bounds.maxX - bounds.minX + 72
    const h = bounds.maxY - bounds.minY + 72
    const scale = clamp(Math.min(availW / w, availH / h) / zoomOut, MIN_SCALE, MAX_SCALE)

    const netCenter = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 }
    const safeCenter = { x: insets.left + availW / 2, y: insets.top + availH / 2 }
    return {
      x: netCenter.x - (safeCenter.x - this.view.w / 2) / scale,
      y: netCenter.y - (safeCenter.y - this.view.h / 2) / scale,
      scale,
    }
  }

  resetView() {
    this.target = this.fitCamera(1.05)
    this.userFramed = false
    this.touch()
  }

  focusNode(id: string, scale?: number) {
    const node = this.geo.nodeById[id]
    if (!node) return
    this.userFramed = true
    this.target = {
      x: node.x,
      y: node.y,
      scale: clamp(scale ?? Math.max(1.05, this.camera.scale), MIN_SCALE, MAX_SCALE),
    }
    this.touch()
  }

  /** Frame a corridor: centre its midpoint and fit its span. */
  focusRoute(id: string) {
    const link = this.geo.linkById[id]
    if (!link) return
    this.userFramed = true
    const insets = this.safeInsets()
    const spanX = Math.abs(link.curve.p1.x - link.curve.p0.x) + 320
    const spanY = Math.abs(link.curve.p1.y - link.curve.p0.y) + 320
    const scale = clamp(
      Math.min((this.view.w - insets.left) / spanX, (this.view.h - 120) / spanY),
      MIN_SCALE,
      1.7,
    )
    this.target = { x: link.mid.x, y: link.mid.y, scale }
    this.touch()
  }

  zoomBy(factor: number, anchorScreen?: Vec2) {
    this.userFramed = true
    const anchor = anchorScreen ?? { x: this.view.w / 2, y: this.view.h / 2 }
    const before = this.screenToWorld(anchor.x, anchor.y, this.target)
    const scale = clamp(this.target.scale * factor, MIN_SCALE, MAX_SCALE)
    const ratio = scale / this.target.scale
    this.target = {
      scale,
      x: before.x + (this.target.x - before.x) / ratio,
      y: before.y + (this.target.y - before.y) / ratio,
    }
    this.clampTarget()
    this.touch()
  }

  panBy(dx: number, dy: number) {
    this.userFramed = true
    this.target.x -= dx / this.target.scale
    this.target.y -= dy / this.target.scale
    this.clampTarget()
    this.touch()
  }

  private clampTarget() {
    const world = this.model.snapshot.city.world
    const margin = 160
    this.target.x = clamp(this.target.x, -margin, world.width + margin)
    this.target.y = clamp(this.target.y, -margin, world.height + margin)
    this.target.scale = clamp(this.target.scale, MIN_SCALE, MAX_SCALE)
  }

  /* ── input ───────────────────────────────────────────────── */

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    this.pointerDown = true
    this.dragging = false
    this.moved = 0
    this.lastPointer = { x: e.clientX, y: e.clientY }
    this.canvas.setPointerCapture?.(e.pointerId)
  }

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top }

    if (this.pointerDown) {
      const dx = e.clientX - this.lastPointer.x
      const dy = e.clientY - this.lastPointer.y
      this.moved += Math.abs(dx) + Math.abs(dy)
      if (this.moved > 4) {
        this.dragging = true
        this.panBy(dx, dy)
      }
      this.lastPointer = { x: e.clientX, y: e.clientY }
      return
    }

    const outside =
      this.pointer.x < 0 || this.pointer.y < 0 || this.pointer.x > this.view.w || this.pointer.y > this.view.h
    if (outside) {
      if (this.hoveredId) this.handlers.onHover(null)
      if (this.hoveredRouteId) this.handlers.onHoverRoute(null)
      this.hoveredId = null
      this.hoveredRouteId = null
      this.recomputeActive()
      this.touch()
      return
    }

    const hit = this.pickNode(this.pointer.x, this.pointer.y)
    if (hit !== this.hoveredId) {
      this.hoveredId = hit
      if (hit) {
        this.hoveredRouteId = null
        this.handlers.onHoverRoute(null)
      }
      this.handlers.onHover(hit)
      this.recomputeActive()
      this.touch()
      return
    }
    if (!hit) {
      const link = this.pickLink(this.pointer.x, this.pointer.y)
      if (link !== this.hoveredRouteId) {
        this.hoveredRouteId = link
        this.handlers.onHoverRoute(link)
        this.touch()
      }
    }
  }

  private onPointerUp = (e: PointerEvent) => {
    if (!this.pointerDown) return
    this.pointerDown = false
    this.canvas.releasePointerCapture?.(e.pointerId)
    if (this.dragging) {
      this.dragging = false
      return
    }
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const node = this.pickNode(x, y) ?? this.pickGeneration(x, y)
    if (node) {
      this.handlers.onSelect(node)
      return
    }
    const link = this.pickLink(x, y)
    if (link) {
      this.handlers.onSelectRoute(link)
      return
    }
    this.handlers.onSelect(null)
    this.handlers.onSelectRoute(null)
  }

  private onDoubleClick = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const node = this.pickNode(x, y)
    if (node) {
      this.focusNode(node)
      return
    }
    const link = this.pickLink(x, y)
    if (link) this.focusRoute(link)
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const rect = this.canvas.getBoundingClientRect()
    const factor = Math.exp(-e.deltaY * 0.0015)
    this.zoomBy(factor, { x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
    switch (e.key) {
      case '+':
      case '=':
        this.zoomBy(1.22)
        break
      case '-':
      case '_':
        this.zoomBy(1 / 1.22)
        break
      case '0':
        this.resetView()
        break
      case 'ArrowUp':
        this.panBy(0, 80)
        break
      case 'ArrowDown':
        this.panBy(0, -80)
        break
      case 'ArrowLeft':
        this.panBy(80, 0)
        break
      case 'ArrowRight':
        this.panBy(-80, 0)
        break
      default:
        return
    }
    e.preventDefault()
  }

  /* ── picking ─────────────────────────────────────────────── */

  private pickNode(sx: number, sy: number): string | null {
    let best: string | null = null
    let bestDist = Infinity
    for (const node of this.geo.nodes) {
      const p = this.worldToScreen(node.x, node.y)
      const d = Math.hypot(p.x - sx, p.y - sy)
      const radius = Math.max(13, node.r * this.camera.scale * 1.25)
      if (d < radius && d < bestDist) {
        best = node.id
        bestDist = d
      }
    }
    return best
  }

  private pickGeneration(sx: number, sy: number): string | null {
    for (const gp of this.geo.generations) {
      const p = this.worldToScreen(gp.x, gp.y)
      if (Math.hypot(p.x - sx, p.y - sy) < 12) return gp.parentId
    }
    return null
  }

  private pickLink(sx: number, sy: number): string | null {
    let best: string | null = null
    let bestDist = 10
    for (const link of this.geo.links) {
      for (let i = 0; i <= 18; i++) {
        cubicPoint(link.curve, i / 18, scratch)
        const p = this.worldToScreen(scratch.x, scratch.y)
        const d = Math.hypot(p.x - sx, p.y - sy)
        if (d < bestDist) {
          bestDist = d
          best = link.id
        }
      }
    }
    return best
  }

  /* ── render ──────────────────────────────────────────────── */

  private resize() {
    const rect = this.canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const first = !this.hasFitted
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.view = { w: rect.width, h: rect.height }
    this.canvas.width = Math.round(rect.width * this.dpr)
    this.canvas.height = Math.round(rect.height * this.dpr)

    if (first) {
      // Arrival: start pulled back, then ease into the fitted framing.
      const fitted = this.fitCamera(1.06)
      this.camera = { ...fitted, scale: fitted.scale * 0.82 }
      this.target = { ...fitted }
      this.hasFitted = true
    } else if (!this.userFramed) {
      // Responsive foundation: keep the network framed until the operator pans.
      this.target = this.fitCamera(1.06)
    } else {
      this.clampTarget()
    }
    this.touch()
    // Let leaflet recalculate its own dimensions after resize
    this.lmap?.invalidateSize()
  }

  private frame = (now: number) => {
    if (!this.running) return
    // rAF timestamps can predate a `performance.now()` taken mid-frame, so the
    // delta is clamped at both ends — a negative dt would make damping diverge.
    const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000))
    this.last = now
    this.time += dt
    this.fps = this.fps * 0.92 + (1 / Math.max(dt, 0.0001)) * 0.08

    this.updateCamera(dt)
    this.render(dt)

    this.statsTimer += dt
    if (this.statsTimer > 0.6) {
      this.statsTimer = 0
      this.handlers.onStats?.({ fps: this.fps })
    }

    this.raf = requestAnimationFrame(this.frame)
  }

  private updateCamera(dt: number) {
    // If the first fit happened before the canvas had a real layout size, fit
    // again as soon as we have one — the engine must never strand at MIN_SCALE.
    if (!this.hasFitted && this.view.w > 40 && this.view.h > 40) {
      const fitted = this.fitCamera(1.06)
      this.camera = { ...fitted, scale: fitted.scale * 0.82 }
      this.target = { ...fitted }
      this.hasFitted = true
      this.touch()
    }

    const smoothing = 0.0009
    const before = this.camera
    const nx = damp(before.x, this.target.x, smoothing, dt)
    const ny = damp(before.y, this.target.y, smoothing, dt)
    const ns = damp(before.scale, this.target.scale, smoothing, dt)

    const changed =
      Math.abs(nx - before.x) > 0.02 || Math.abs(ny - before.y) > 0.02 || Math.abs(ns - before.scale) > 0.0004

    if (Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(ns)) {
      this.camera = { x: nx, y: ny, scale: ns }
    } else {
      this.camera = { ...this.target }
    }
    if (changed) this.touch()
    this.syncMap()
  }

  private syncMap() {
    if (!this.lmap) return
    const min_lon = 72.7763
    const max_lon = 72.9797
    const min_lat = 18.8940
    const max_lat = 19.2702

    const lon = min_lon + ((this.camera.x - 200) / 1250) * (max_lon - min_lon)
    const lat = max_lat - ((this.camera.y - 100) / 850) * (max_lat - min_lat)
    const zoom = Math.log2(this.camera.scale) + 13.07717

    this.lmap.setView([lat, lon], zoom, { animate: false })

    const isLight = document.documentElement.classList.contains('light-mode')
    if (isLight && !this.lmap.hasLayer(this.tileLight)) {
      this.lmap.removeLayer(this.tileDark)
      this.lmap.addLayer(this.tileLight)
    } else if (!isLight && !this.lmap.hasLayer(this.tileDark)) {
      this.lmap.removeLayer(this.tileLight)
      this.lmap.addLayer(this.tileDark)
    }
  }

  /** Reproject every node from its real lat/lon through Leaflet each frame
   *  so nodes are pixel-perfectly stuck to their real-world map positions. */
  private updateNodePositionsFromLeaflet() {
    if (!this.lmap || !this.view.w) return
    const { scale, x: cx, y: cy } = this.camera
    const hw = this.view.w / 2
    const hh = this.view.h / 2

    let anyChanged = false
    for (const node of this.geo.nodes) {
      if (!node.latLon) continue
      const pt = this.lmap.latLngToContainerPoint([node.latLon.lat, node.latLon.lon])
      // Convert Leaflet screen point to canvas world position
      const wx = (pt.x - hw) / scale + cx
      const wy = (pt.y - hh) / scale + cy
      node.x = wx
      node.y = wy
      anyChanged = true
    }

    if (!anyChanged) return

    // Recompute route curves so they connect updated node positions
    for (const link of this.geo.links) {
      const from = link.from
      const to = link.to
      const dx = to.x - from.x
      const dy = to.y - from.y
      const dist = Math.hypot(dx, dy) || 1
      const ux = dx / dist
      const uy = dy / dist
      const start = { x: from.x + ux * (from.r * 0.86), y: from.y + uy * (from.r * 0.9) }
      const end = { x: to.x - ux * (to.r * 0.9), y: to.y - uy * (to.r * 0.94) }
      const bow = link.curve ? (link as { _bow?: number })._bow ?? 0.12 : 0.12
      link.curve = linkCurve(start, end, bow)
      link.mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
    }
  }

  private render(dt: number) {
    const { ctx } = this
    const s = this.dpr
    // Reproject all nodes to pixel-perfect Leaflet positions before rendering
    this.updateNodePositionsFromLeaflet()
    // Clear the canvas so transparent areas show the Leaflet map beneath
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.setTransform(s, 0, 0, s, 0, 0)
    ctx.save()
    ctx.translate(this.view.w / 2, this.view.h / 2)
    ctx.scale(this.camera.scale, this.camera.scale)
    ctx.translate(-this.camera.x, -this.camera.y)

    const rc: RenderContext = {
      ctx,
      geo: this.geo,
      model: this.model,
      time: this.time,
      dt,
      dpr: this.dpr,
      width: this.view.w,
      height: this.view.h,
      camera: this.camera,
      layers: this.layersState,
      selectedId: this.selectedId,
      selectedRouteId: this.selectedRouteId,
      hoveredId: this.hoveredId,
      hoveredRouteId: this.hoveredRouteId,
      reducedMotion: this.reducedMotion,
      activeId: this.activeId,
      activeLinks: this.activeLinks,
      rerouteState: this.rerouteState,
    }

    // backdrop is drawn with a screen-space transform
    ctx.save()
    ctx.setTransform(s, 0, 0, s, 0, 0)
    drawBackdrop(rc, this.backdrop)
    ctx.restore()

    drawRoutes(rc)
    updateVehicles(rc, this.vehicles)
    drawVehicles(rc, this.vehicles)
    drawGenerations(rc)
    drawNodes(rc)
    if (this.layersState.bottlenecks) drawStatusLayer(rc)
    this.drawPings(dt)
    this.drawLinkTag(rc)
    ctx.restore()

    // Vignette: cinematic framing, screen space.
    ctx.save()
    const vg = ctx.createRadialGradient(
      this.view.w / 2, this.view.h / 2, Math.min(this.view.w, this.view.h) * 0.32,
      this.view.w / 2, this.view.h / 2, Math.max(this.view.w, this.view.h) * 0.78,
    )
    const isLight = document.documentElement.classList.contains('light-mode')
    vg.addColorStop(0, isLight ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)')
    vg.addColorStop(1, isLight ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.55)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, this.view.w, this.view.h)
    ctx.restore()
  }

  private drawPings(dt: number) {
    const { ctx } = this
    for (let i = this.pings.length - 1; i >= 0; i--) {
      const ping = this.pings[i]
      ping.t += dt / 0.85
      if (ping.t >= 1) {
        this.pings.splice(i, 1)
        continue
      }
      const inv = 1 / this.camera.scale
      ctx.strokeStyle = rgbaStr(C.signal, 0.5 * (1 - ping.t))
      ctx.lineWidth = 1.6 * inv
      ctx.beginPath()
      ctx.arc(ping.x, ping.y, ping.max * ping.t, 0, TAU)
      ctx.stroke()
    }
  }

  /** Hover tag for a corridor: id, daily tonnage and state, straight from data. */
  private drawLinkTag(rc: RenderContext) {
    const link = this.hoveredRouteId ? this.geo.linkById[this.hoveredRouteId] : null
    if (!link || this.hoveredId || this.selectedRouteId === link.id) return
    const { ctx } = rc
    const inv = 1 / this.camera.scale
    const text = `${link.id}  ${Math.round(link.route.volumeT).toLocaleString('en-US')} T/DAY  ${link.flow.status.toUpperCase()}`
    ctx.save()
    ctx.font = `500 ${(9.5 * inv).toFixed(2)}px "IBM Plex Mono", monospace`
    const w = ctx.measureText(text).width
    const padX = 6 * inv
    const h = 15 * inv
    ctx.fillStyle = rgbaStr(C.base, 0.92)
    ctx.fillRect(link.mid.x - w / 2 - padX, link.mid.y - h * 1.3, w + padX * 2, h)
    ctx.strokeStyle = rgbaStr(link.color, 0.6)
    ctx.lineWidth = 1 * inv
    ctx.strokeRect(link.mid.x - w / 2 - padX, link.mid.y - h * 1.3, w + padX * 2, h)
    label(ctx, text, link.mid.x, link.mid.y - h * 0.8, 9.5 * inv, rgbaStr(C.ink, 0.92), {
      align: 'center',
      baseline: 'middle',
      weight: 500,
    })
    ctx.restore()
  }

  getHoveredLink(): LinkGeo | null {
    return this.hoveredRouteId ? this.geo.linkById[this.hoveredRouteId] ?? null : null
  }

  getStats() {
    return {
      fps: Math.round(this.fps),
      vehicles: this.vehicles.length,
      nodes: this.geo.nodes.length,
      links: this.geo.links.length,
    }
  }
}
