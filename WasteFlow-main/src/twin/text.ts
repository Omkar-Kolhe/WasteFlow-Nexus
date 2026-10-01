/** Canvas typography helpers — technical labels with optional tracking. */

export const FONT_SANS = 'Inter, system-ui, -apple-system, sans-serif'
export const FONT_MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, monospace'

export interface LabelOptions {
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  weight?: number | string
  tracking?: number
  family?: 'sans' | 'mono'
  alpha?: number
}

export function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  opts: Pick<LabelOptions, 'weight' | 'family' | 'tracking'> = {},
) {
  const family = opts.family === 'sans' ? FONT_SANS : FONT_MONO
  ctx.font = `${opts.weight ?? 400} ${size.toFixed(2)}px ${family}`
  const ls = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
  if ('letterSpacing' in ls) ls.letterSpacing = `${(opts.tracking ?? 0).toFixed(2)}px`
}

export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  opts: LabelOptions = {},
) {
  ctx.save()
  setFont(ctx, size, opts)
  ctx.textAlign = opts.align ?? 'left'
  ctx.textBaseline = opts.baseline ?? 'alphabetic'
  ctx.globalAlpha = opts.alpha ?? 1
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  ctx.restore()
}

export function measure(
  ctx: CanvasRenderingContext2D,
  text: string,
  size: number,
  opts: Pick<LabelOptions, 'weight' | 'family' | 'tracking'> = {},
) {
  ctx.save()
  setFont(ctx, size, opts)
  const w = ctx.measureText(text).width
  ctx.restore()
  return w
}
