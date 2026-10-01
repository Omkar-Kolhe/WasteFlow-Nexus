import type { FlowTier, NodeState, RouteStatus, SubstreamId } from '@/types'

export type RGB = readonly [number, number, number]

export const rgbaStr = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ] as const
}

export let IS_LIGHT_MODE = false
if (typeof document !== 'undefined') {
  IS_LIGHT_MODE = document.documentElement.classList.contains('light-mode')
  const observer = new MutationObserver(() => {
    IS_LIGHT_MODE = document.documentElement.classList.contains('light-mode')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

/**
 * The twin's canvas palette. Near-black foundation, restrained luminance —
 * colour is reserved for meaning (material stream, status, intensity).
 */
export const DARK_C = {
  base: [8, 9, 11] as RGB,
  void: [4, 5, 6] as RGB,
  panel: [11, 13, 16] as RGB,
  ink: [233, 236, 241] as RGB,
  dim: [139, 147, 158] as RGB,
  faint: [90, 97, 107] as RGB,
  ghost: [58, 64, 73] as RGB,
  signal: [79, 227, 193] as RGB,
  flow: [108, 155, 255] as RGB,
  warn: [229, 180, 76] as RGB,
  critical: [226, 89, 91] as RGB,
  organic: [143, 208, 106] as RGB,
  glass: [95, 212, 227] as RGB,
  polymer: [169, 140, 255] as RGB,
  paper: [214, 199, 160] as RGB,
}

export const LIGHT_C = {
  ...DARK_C,
  base: [241, 245, 249] as RGB,
  void: [248, 250, 252] as RGB,
  panel: [255, 255, 255] as RGB,
  ink: [15, 23, 42] as RGB,
  dim: [51, 65, 85] as RGB,
  faint: [71, 85, 105] as RGB,
  ghost: [100, 116, 139] as RGB,
  signal: [13, 148, 136] as RGB,
  flow: [37, 99, 235] as RGB,
  warn: [217, 119, 6] as RGB,
  critical: [220, 38, 38] as RGB,
  organic: [101, 163, 13] as RGB,
  glass: [8, 145, 178] as RGB,
  polymer: [124, 58, 237] as RGB,
  paper: [180, 83, 9] as RGB,
}

export const C = new Proxy(DARK_C, {
  get: (_target, prop: keyof typeof DARK_C) => {
    return (IS_LIGHT_MODE ? LIGHT_C : DARK_C)[prop] || DARK_C[prop]
  }
})

const rgbToHex = (c: RGB) => '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('')

export const STREAM_COLOR: Record<SubstreamId, RGB> = {
  get residual() { return C.dim },
  get organic() { return C.organic },
  get recyclable() { return C.glass },
  get commercial() { return C.polymer },
}

export const STREAM_COLOR_HEX: Record<SubstreamId, string> = {
  get residual() { return rgbToHex(C.dim) },
  get organic() { return rgbToHex(C.organic) },
  get recyclable() { return rgbToHex(C.glass) },
  get commercial() { return rgbToHex(C.polymer) },
}

/**
 * Node state palette. Utilisation bands (config/network.ts) resolve to these
 * three colours everywhere: glyphs, HUD pips, tables, panels.
 */
export const NODE_STATE_COLOR: Record<NodeState, RGB> = {
  get normal() { return C.signal },
  get warning() { return C.warn },
  get critical() { return C.critical },
}

export const NODE_STATE_COLOR_HEX: Record<NodeState, string> = {
  get normal() { return rgbToHex(C.signal) },
  get warning() { return rgbToHex(C.warn) },
  get critical() { return rgbToHex(C.critical) },
}

/** Route state palette: how a corridor is behaving, not what it carries. */
export const ROUTE_STATUS_COLOR: Record<RouteStatus, RGB> = {
  get normal() { return C.signal },
  get busy() { return C.flow },
  get congested() { return C.warn },
  get blocked() { return C.critical },
}

export const ROUTE_STATUS_COLOR_HEX: Record<RouteStatus, string> = {
  get normal() { return rgbToHex(C.signal) },
  get busy() { return rgbToHex(C.flow) },
  get congested() { return rgbToHex(C.warn) },
  get blocked() { return rgbToHex(C.critical) },
}

/** Particle brightness by flow tier, so LOW/MEDIUM/HIGH are legible at a glance. */
export const FLOW_TIER_ALPHA: Record<FlowTier, number> = {
  low: 0.5,
  medium: 0.72,
  high: 0.95,
}

/** Emissions intensity ramp: cool → amber → critical red. */
export function emissionColor(intensity: number): RGB {
  const t = Math.max(0, Math.min(1, intensity))
  if (t < 0.5) {
    const k = t / 0.5
    return [
      Math.round(C.flow[0] + (C.warn[0] - C.flow[0]) * k),
      Math.round(C.flow[1] + (C.warn[1] - C.flow[1]) * k),
      Math.round(C.flow[2] + (C.warn[2] - C.flow[2]) * k),
    ] as RGB
  }
  const k = (t - 0.5) / 0.5
  return [
    Math.round(C.warn[0] + (C.critical[0] - C.warn[0]) * k),
    Math.round(C.warn[1] + (C.critical[1] - C.warn[1]) * k),
    Math.round(C.warn[2] + (C.critical[2] - C.warn[2]) * k),
  ] as RGB
}
