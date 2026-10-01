import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Check, ChevronDown, CircleDot, Cpu, MapPin, Radio, Moon, Sun } from 'lucide-react'
import { cityOptions } from '@/data/city'
import { useTwinModel } from '@/hooks/useTwinModel'
import { useClickOutside, useClock } from '@/hooks'
import { useTwinStore } from '@/state/twinStore'
import { cn } from '@/lib/utils'
import { StatusIndicator } from '@/components/twin/StatusIndicator'
import { NexusMark, Wordmark } from './Logo'

const SEVERITY_COLOR = {
  info: 'rgb(var(--color-flow))',
  warning: 'rgb(var(--color-warn))',
  critical: 'rgb(var(--color-critical))',
} as const

/** TOP BAR — the console's spine: identity, live state, context, operator. */
export function TopBar() {
  const model = useTwinModel()
  const now = useClock(1000)
  const [cityOpen, setCityOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const cityId = useTwinStore((s) => s.cityId)
  const setCityId = useTwinStore((s) => s.setCityId)
  const notifications = useTwinStore((s) => s.notifications)
  const notificationsOpen = useTwinStore((s) => s.notificationsOpen)
  const setNotificationsOpen = useTwinStore((s) => s.setNotificationsOpen)
  const markAllRead = useTwinStore((s) => s.markNotificationsRead)
  const exitToLanding = useTwinStore((s) => s.exitToLanding)
  const theme = useTwinStore((s) => s.theme)
  const toggleTheme = useTwinStore((s) => s.toggleTheme)

  const unread = notifications.filter((n) => !n.read).length
  const cityRef = useClickOutside<HTMLDivElement>(() => setCityOpen(false))
  const notifRef = useClickOutside<HTMLDivElement>(() => setNotificationsOpen(false))
  const userRef = useClickOutside<HTMLDivElement>(() => setUserOpen(false))

  const activeCity = cityOptions.find((c) => c.id === cityId) ?? cityOptions[0]

  return (
    <header className="relative z-40 flex h-12 items-center gap-3 border-b border-hair bg-base/85 px-3 backdrop-blur-xl">
      <button
        onClick={exitToLanding}
        className="focus-ring group flex items-center gap-2.5 pl-0.5 pr-2 text-signal"
        title="Return to entry sequence"
      >
        <NexusMark size={20} />
        <Wordmark />
      </button>

      <span className="hidden items-center gap-1.5 border border-hair px-1.5 py-[3px] font-mono text-[8.5px] tracking-[0.14em] text-ink-ghost lg:flex">
        DIGITAL TWIN · PHASE 2
      </span>

      <span className="mx-1 hidden h-5 w-px bg-hair lg:block" />

      {/* Live system state */}
      <div className="hidden items-center gap-2 md:flex">
        <Radio size={12} className="text-signal/70" strokeWidth={1.75} />
        <StatusIndicator state={model.systemState} variant="inline" />
        <span className="hidden font-mono text-[9px] tracking-[0.1em] text-ink-ghost xl:inline">
          MESH {model.derivedList.length}/{model.derivedList.length} ONLINE
        </span>
      </div>

      {/* City selector */}
      <div ref={cityRef} className="relative">
        <button
          onClick={() => setCityOpen((v) => !v)}
          className={cn(
            'focus-ring flex h-7 items-center gap-2 border px-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-200',
            cityOpen ? 'border-hair2 bg-white/[0.05] text-ink' : 'border-hair text-ink-dim hover:border-hair2 hover:text-ink',
          )}
        >
          <MapPin size={11.5} strokeWidth={1.75} className="text-signal/80" />
          {activeCity.name}
          <ChevronDown size={11} strokeWidth={2} className={cn('transition-transform duration-200', cityOpen && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {cityOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="surface absolute left-0 top-9 z-50 w-[290px] border-hair shadow-panel"
            >
              <header className="border-b border-hair px-3 py-2">
                <span className="label-tech text-[8.5px]">CITY NETWORK</span>
              </header>
              <ul>
                {cityOptions.map((c) => {
                  const isActive = c.id === activeCity.id
                  const live = c.status === 'live'
                  return (
                    <li key={c.id}>
                      <button
                        disabled={!live}
                        onClick={() => {
                          setCityId(c.id)
                          setCityOpen(false)
                        }}
                        className={cn(
                          'focus-ring flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
                          live ? 'hover:bg-white/[0.045]' : 'cursor-not-allowed opacity-45',
                        )}
                      >
                        <CircleDot size={10} strokeWidth={2} className={live ? 'text-signal' : 'text-ink-ghost'} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink">{c.name}</span>
                          <span className="block font-mono text-[8.5px] tracking-[0.06em] text-ink-ghost">
                            {c.region} · {c.zones} ZONES · {c.facilities} NODES · {c.tpd.toLocaleString()} T/DAY
                          </span>
                        </span>
                        <span
                          className={cn(
                            'font-mono text-[8px] tracking-[0.12em]',
                            live ? 'text-signal/80' : 'text-ink-ghost',
                          )}
                        >
                          {live ? 'LIVE' : 'SYNC REQUIRED'}
                        </span>
                        {isActive && <Check size={11} strokeWidth={2} className="text-signal" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <footer className="border-t border-hair px-3 py-2 font-mono text-[8px] leading-relaxed tracking-[0.08em] text-ink-ghost">
                PHASE 2 STREAMS ONE CITY MESH. ADDITIONAL NETWORKS JOIN THE FEDERATION IN A LATER PHASE.
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Simulation status */}
        <span className="hidden h-7 items-center gap-2 border border-hair px-2 font-mono text-[9.5px] tracking-[0.12em] text-ink-faint lg:flex">
          <Cpu size={11.5} strokeWidth={1.75} className="text-flow/70" />
          SIMULATION
          <span className="text-ink-ghost">IDLE · PHASE 6</span>
        </span>

        <span className="hidden font-mono text-[9.5px] tabular-nums tracking-[0.12em] text-ink-faint xl:block">
          {now.toISOString().slice(11, 19)} UTC
        </span>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="focus-ring grid h-7 w-7 place-items-center border border-hair text-ink-dim transition-colors hover:border-hair2 hover:text-ink"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={13} strokeWidth={1.75} /> : <Moon size={13} strokeWidth={1.75} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen)
              setUserOpen(false)
            }}
            className="focus-ring relative grid h-7 w-7 place-items-center border border-hair text-ink-dim transition-colors hover:border-hair2 hover:text-ink"
            aria-label="Notifications"
          >
            <Bell size={13} strokeWidth={1.75} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-3.5 min-w-[14px] place-items-center bg-critical px-1 font-mono text-[8px] font-semibold text-void">
                {unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="surface absolute right-0 top-9 z-50 w-[336px] border-hair shadow-panel"
              >
                <header className="flex items-center gap-2 border-b border-hair px-3 py-2">
                  <span className="label-tech text-[8.5px]">OPERATIONS FEED</span>
                  <button
                    onClick={markAllRead}
                    className="focus-ring ml-auto font-mono text-[8.5px] tracking-[0.12em] text-ink-ghost transition-colors hover:text-signal"
                  >
                    MARK ALL READ
                  </button>
                </header>
                <ul className="divide-y divide-white/[0.055]">
                  {notifications.map((n) => (
                    <li key={n.id} className={cn('px-3 py-2.5 transition-colors hover:bg-white/[0.03]', n.read && 'opacity-55')}>
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-[5px] h-1.5 w-1.5 shrink-0"
                          style={{ background: SEVERITY_COLOR[n.severity] }}
                        />
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink">{n.title}</p>
                          <p className="mt-1 text-[10.5px] leading-relaxed text-ink-faint">{n.detail}</p>
                          <span className="mt-1 block font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">{n.at}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Operator */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => {
              setUserOpen((v) => !v)
              setNotificationsOpen(false)
            }}
            className="focus-ring flex h-7 items-center gap-2 border border-hair pl-1 pr-2 transition-colors hover:border-hair2"
          >
            <span className="grid h-5 w-5 place-items-center bg-signal/15 font-mono text-[9px] font-semibold text-signal">
              OP
            </span>
            <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-dim sm:block">OPERATOR</span>
            <ChevronDown size={11} strokeWidth={2} className="text-ink-ghost" />
          </button>

          <AnimatePresence>
            {userOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="surface absolute right-0 top-9 z-50 w-[228px] border-hair shadow-panel"
              >
                <div className="border-b border-hair px-3 py-2.5">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink">OPS LEAD</p>
                  <p className="mt-1 font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
                    {model.snapshot.city.region.toUpperCase()}
                  </p>
                </div>
                <ul className="py-1">
                  {[
                    `Session scope: ${activeCity.name.toUpperCase()}`,
                    'Telemetry: MOCK · PHASE 2',
                    'Access: COMMAND CENTRE',
                  ].map((row) => (
                    <li key={row} className="px-3 py-1.5 font-mono text-[9px] tracking-[0.1em] text-ink-faint">
                      {row}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-hair p-1">
                  <button
                    onClick={exitToLanding}
                    className="focus-ring w-full px-2 py-1.5 text-left font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-dim transition-colors hover:bg-white/[0.05] hover:text-ink"
                  >
                    Exit to entry sequence
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* live scan line along the bottom edge of the bar */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden">
        <span className="block h-px w-1/4 animate-sweep bg-gradient-to-r from-transparent via-signal/60 to-transparent" />
      </span>
    </header>
  )
}
