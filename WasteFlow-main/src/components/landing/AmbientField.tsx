import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  bright: boolean
}

/**
 * AMBIENT FIELD — the atmosphere behind the entry experience.
 *
 * A slow vector field of material drifting through a dim perspective floor
 * grid. It is deliberately abstract: it communicates movement and containment,
 * not a specific network. Capped at 30fps internally and paused when hidden.
 */
export function AmbientField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let running = true
    let time = 0
    let last = performance.now()
    let acc = 0
    const particles: Particle[] = []
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }

    const spawn = (initial: boolean): Particle => {
      const bright = Math.random() < 0.16
      return {
        x: initial ? Math.random() * width : -40 - Math.random() * 120,
        y: Math.random() * height,
        vx: 14 + Math.random() * 34,
        vy: (Math.random() - 0.5) * 10,
        life: 0,
        maxLife: 8 + Math.random() * 14,
        size: bright ? 1.5 + Math.random() * 1.4 : 0.5 + Math.random() * 0.9,
        bright,
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      dpr = Math.min(2, window.devicePixelRatio || 1)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const target = Math.round(Math.min(320, Math.max(90, (width * height) / 9000)))
      while (particles.length < target) particles.push(spawn(true))
      particles.length = target
    }

    const onPointer = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth
      pointer.ty = e.clientY / window.innerHeight
    }

    const onVisibility = () => {
      running = !document.hidden
      if (running) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      } else {
        cancelAnimationFrame(raf)
      }
    }

    /** Smooth vector field: horizontal drift bent by two slow sine fields. */
    const flow = (x: number, y: number, t: number) => {
      const a = Math.sin(x * 0.0016 + t * 0.09) * 26
      const b = Math.cos(y * 0.0022 - t * 0.07) * 18
      const ctxInfluence = (pointer.x - 0.5) * 90
      return { ax: 10 + ctxInfluence * 0.4, ay: a + b + Math.sin(t * 0.2 + x * 0.01) * 12 }
    }

    const drawFloor = (t: number) => {
      const horizon = height * 0.66
      const vpX = width * 0.5 + (pointer.x - 0.5) * 80
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.045)'
      ctx.lineWidth = 1

      // Horizon
      ctx.beginPath()
      ctx.moveTo(0, horizon)
      ctx.lineTo(width, horizon)
      ctx.stroke()

      // Converging verticals
      for (let i = -14; i <= 14; i++) {
        const x = vpX + i * (width / 12)
        ctx.beginPath()
        ctx.moveTo(vpX + i * 12, horizon)
        ctx.lineTo(x, height + 40)
        ctx.stroke()
      }

      // Depth lines, drifting toward the viewer
      const spacing = 26
      const drift = (t * 12) % spacing
      let y = horizon + drift
      let k = 0
      while (y < height + 40) {
        const step = spacing * Math.pow(1.16, k)
        ctx.globalAlpha = Math.max(0, 0.5 - k * 0.06)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
        y += step
        k++
      }
      ctx.restore()
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      acc += dt

      // Throttle to ~30fps: the atmosphere must never cost the frame budget.
      if (acc < 1 / 30) {
        raf = requestAnimationFrame(frame)
        return
      }
      const step = acc
      acc = 0
      time += step

      pointer.x += (pointer.tx - pointer.x) * 0.05
      pointer.y += (pointer.ty - pointer.y) * 0.05

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      // Warm glow behind the headline block
      const glow = ctx.createRadialGradient(width * 0.22, height * 0.46, 0, width * 0.22, height * 0.46, width * 0.6)
      glow.addColorStop(0, 'rgba(24,52,48,0.5)')
      glow.addColorStop(0.5, 'rgba(10,16,20,0.28)')
      glow.addColorStop(1, 'rgba(4,5,6,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      drawFloor(time)

      ctx.lineCap = 'round'
      for (const p of particles) {
        const { ax, ay } = flow(p.x, p.y, reduced ? 0 : time)
        p.vx += ax * step * 6
        p.vy += ay * step * 6
        p.vx *= 0.985
        p.vy *= 0.985
        if (reduced) {
          p.x += p.vx * 0.25 * step
          p.y += p.vy * 0.25 * step
        } else {
          p.x += p.vx * step
          p.y += p.vy * step
        }
        p.life += step

        // Slight upward pull toward the vanishing point reads as "flowing through"
        p.y += (height * 0.5 - p.y) * 0.02 * step

        const fade = 1 - p.life / p.maxLife
        if (p.life > p.maxLife || p.x > width + 60 || p.y < -60 || p.y > height + 60) {
          Object.assign(p, spawn(false))
          continue
        }

        const alpha = (p.bright ? 0.4 : 0.16) * Math.max(0, fade)
        ctx.strokeStyle = p.bright ? `rgba(143,235,215,${alpha})` : `rgba(190,205,215,${alpha})`
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.moveTo(p.x - p.vx * 0.06, p.y - p.vy * 0.06)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }

      raf = requestAnimationFrame(frame)
    }

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointer)
    document.addEventListener('visibilitychange', onVisibility)
    resize()
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden />
}
