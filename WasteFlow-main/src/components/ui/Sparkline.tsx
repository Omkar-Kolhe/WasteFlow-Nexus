import { useMemo } from 'react'

export interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  color?: string
  className?: string
  /** Adds a soft area wash under the line. */
  area?: boolean
}

/** Clean data-first sparkline: one thin line, optional wash, no chrome. */
export function Sparkline({
  values,
  width = 92,
  height = 26,
  color = '#4FE3C1',
  className,
  area = true,
}: SparklineProps) {
  const { line, fill } = useMemo(() => {
    if (!values.length) return { line: '', fill: '' }
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const step = width / (values.length - 1 || 1)
    const pts = values.map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / span) * (height - 3) - 1.5
      return [x, y] as const
    })
    const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
    return { line: d, fill: `${d} L${width},${height} L0,${height} Z` }
  }, [values, width, height])

  return (
    <svg width={width} height={height} className={className} aria-hidden>
      {area && <path d={fill} fill={color} opacity={0.08} />}
      <path d={line} fill="none" stroke={color} strokeWidth={1.1} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
