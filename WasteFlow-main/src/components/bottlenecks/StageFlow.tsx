import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { C, NODE_STATE_COLOR_HEX, rgbaStr } from '@/twin/palette'
import type { NodeState } from '@/types'
import { cn } from '@/lib/utils'

/**
 * STAGE FLOW (§2) — the network as one horizontal current.
 *
 * COLLECTION → TRANSFER → SORTING → PROCESSING → RECOVERY → LANDFILL, each
 * stage rendered by its utilisation band, with particles drifting through the
 * channel and waste visibly accumulating behind constrained stages. Canvas-
 * driven so the motion stays smooth and independent of React re-renders.
 */

export interface StageNode {
  id: string
  label: string
  sublabel: string
  /** Aggregated utilisation for the stage, percent. */
  utilizationPct: number
  /** Bottleneck facility id at this stage, if any. */
  bottleneckId: string | null
  /** Tonnes/day accumulating behind this stage (backlog + held upstream). */
  accumulatingT: number
  onClick?: (stageId: string) => void
}

const STROKE = 2

export function StageFlow({ stages, className }: { stages: StageNode[]; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<{ stages: StageNode[]; hoverId: string | null }>({ stages, hoverId: null })
  stateRef.current.stages = stages

  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let time = 0
    let last = performance.now()
    const particles: { stage: number; t: number; speed: number; lane: number }[] = []

    // Seed particles across all stages.
    for (let i = 0; i < stages.length; i++) {
      const count = 7
      for (let j = 0; j < count; j++) {
        particles.push({ stage: i, t: j / count, speed: 0.09 + Math.random() * 0.05, lane: (Math.random() - 0.5) * 10 })
      }
    }

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!reduced) time += dt

      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const stagesNow = stateRef.current.stages
      const n = stagesNow.length
      const nodeGap = w / n
      const nodeY = h / 2
      const nodeR = 13

      // Channels between stages + particles + accumulation pools.
      for (let i = 0; i < n - 1; i++) {
        const a = { x: nodeGap * i + nodeGap / 2, y: nodeY }
        const b = { x: nodeGap * (i + 1) + nodeGap / 2, y: nodeY }

        // Upstream constraint slows the channel into the NEXT stage.
        const nextStage = stagesNow[i + 1]
        const nextColor = NODE_STATE_COLOR_HEX[stateOf(nextStage.utilizationPct)]
        const slow = nextStage.utilizationPct >= 90 ? 0.12 : nextStage.utilizationPct >= 70 ? 0.45 : 1
        const congested = nextStage.accumulatingT > 0

        ctx.strokeStyle = congested ? `${nextColor}55` : rgbaStr(C.ink, 0.10)
        ctx.lineWidth = STROKE
        ctx.beginPath()
        ctx.moveTo(a.x + nodeR + 6, a.y)
        ctx.lineTo(b.x - nodeR - 6, b.y)
        ctx.stroke()

        // Particles: speed encodes the downstream constraint.
        if (!reduced) {
          for (const p of particles) {
            if (p.stage !== i) continue
            p.t += p.speed * dt * slow
            if (p.t > 1) p.t -= 1
            const x = a.x + nodeR + 6 + p.t * (b.x - a.x - nodeR * 2 - 12)
            const y = a.y + p.lane * (0.4 + (1 - slow))
            ctx.fillStyle = congested ? `${nextColor}cc` : rgbaStr(C.ink, 0.5)
            ctx.beginPath()
            ctx.arc(x, y, 1.4, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        // Accumulation: ticks piling behind a constrained stage.
        if (congested) {
          const poolX = b.x - nodeR - 10
          const lines = Math.min(7, Math.ceil(nextStage.accumulatingT / 40))
          ctx.strokeStyle = `${nextColor}88`
          ctx.lineWidth = 1
          for (let k = 0; k < lines; k++) {
            const yy = nodeY + 6 + k * 3.2
            ctx.beginPath()
            ctx.moveTo(poolX - 9 + k * 1.2, yy)
            ctx.lineTo(poolX + 9 - k * 1.2, yy)
            ctx.stroke()
          }
        }
      }

      // Nodes.
      for (let i = 0; i < n; i++) {
        const stage = stagesNow[i]
        const x = nodeGap * i + nodeGap / 2
        const state = stateOf(stage.utilizationPct)
        const color = NODE_STATE_COLOR_HEX[state]
        const hover = stateRef.current.hoverId === stage.id

        // halo
        ctx.strokeStyle = `${color}${state === 'normal' ? '33' : '55'}`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(x, nodeY, nodeR + (hover ? 8 : 5), 0, Math.PI * 2)
        ctx.stroke()

        ctx.fillStyle = rgbaStr(C.base, 0.95)
        ctx.beginPath()
        ctx.arc(x, nodeY, nodeR, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = color
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(x, nodeY, nodeR, 0, Math.PI * 2)
        ctx.stroke()

        // fill fraction — the vessel metaphor
        ctx.fillStyle = `${color}2e`
        ctx.beginPath()
        ctx.moveTo(x - nodeR, nodeY + nodeR - (2 * nodeR * stage.utilizationPct) / 100)
        ctx.arc(x, nodeY, nodeR, Math.PI, 0, stage.utilizationPct > 0)
        ctx.closePath()
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const n = stateRef.current.stages.length
      const nodeGap = rect.width / n
      const idx = Math.round((x - nodeGap / 2) / nodeGap)
      stateRef.current.hoverId = stateRef.current.stages[idx]?.id ?? null
      canvas.style.cursor = stateRef.current.hoverId ? 'pointer' : 'default'
    }
    const onLeave = () => {
      stateRef.current.hoverId = null
    }
    const onClick = () => {
      const id = stateRef.current.hoverId
      if (!id) return
      const stage = stateRef.current.stages.find((s) => s.id === id)
      stage?.onClick?.(id)
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('click', onClick)
    }
    // Stage geometry only depends on count; data flows through stateRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages.length, reduced])

  return (
    <div ref={wrapRef} className={cn('relative h-[132px] w-full', className)}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Labels overlay (DOM, so text stays crisp and accessible). */}
      {stages.map((stage, i) => {
        const n = stages.length
        const left = `calc(${((i + 0.5) / n) * 100}% )`
        const state = stateOf(stage.utilizationPct)
        const color = NODE_STATE_COLOR_HEX[state]
        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute -translate-x-1/2 text-center"
            style={{ left, top: 6 }}
          >
            <span className="label-tech block text-[8px]" style={{ color: state === 'normal' ? undefined : color }}>
              {stage.label}
            </span>
            <span className="mt-0.5 block font-mono text-[9px] tracking-[0.06em] text-ink-faint">
              {stage.utilizationPct.toFixed(0)}%
            </span>
            {stage.accumulatingT > 0 && (
              <span className="mt-0.5 block font-mono text-[8px] tracking-[0.1em]" style={{ color }}>
                +{Math.round(stage.accumulatingT)} T HELD
              </span>
            )}
          </motion.div>
        )
      })}
      {stages.map((stage, i) => (
        <span
          key={`${stage.id}-sub`}
          className="pointer-events-none absolute -translate-x-1/2 font-mono text-[8px] tracking-[0.14em] text-ink-ghost"
          style={{ left: `calc(${((i + 0.5) / stages.length) * 100}%)`, bottom: 4 }}
        >
          {stage.sublabel}
        </span>
      ))}
    </div>
  )
}

function stateOf(utilizationPct: number): NodeState {
  if (utilizationPct >= 90) return 'critical'
  if (utilizationPct >= 70) return 'warning'
  return 'normal'
}
