import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Presentation,
  X,
} from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function ScenarioStoryModal({
  scenario,
  onClose,
}: {
  scenario: ScenarioDetailData
  onClose: () => void
}) {
  const [slideIndex, setSlideIndex] = useState(0)
  const slides = scenario.storySlides

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && slideIndex < slides.length - 1) setSlideIndex((i) => i + 1)
      if (e.key === 'ArrowLeft' && slideIndex > 0) setSlideIndex((i) => i - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, slideIndex, slides.length])

  const slide = slides[slideIndex]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 grid place-items-center bg-void/85 p-4 backdrop-blur-[8px]"
        onClick={onClose}
      >
        <motion.article
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="surface ticks border border-hair bg-void p-6 shadow-panel max-w-2xl w-full flex flex-col justify-between min-h-[420px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-hair">
            <div className="flex items-center gap-2">
              <Presentation size={14} className="text-signal" />
              <span className="label-tech text-[9px] text-signal">
                EXECUTIVE STORY MODE · {slide.stage}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-ink-ghost">
                SLIDE {slideIndex + 1} OF {slides.length}
              </span>
              <button onClick={onClose} className="text-ink-ghost hover:text-ink">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Slide Content */}
          <div className="my-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <span className="font-mono text-[8.5px] uppercase tracking-wider text-cyan-400 font-semibold">
                  {slide.title}
                </span>

                <h2 className="text-[20px] font-semibold tracking-tight text-ink">
                  {slide.headline}
                </h2>

                <p className="text-[13px] leading-relaxed text-ink-faint">
                  {slide.description}
                </p>

                {/* Key Metrics on Slide */}
                <div className="mt-4 grid grid-cols-3 gap-2.5 pt-3 border-t border-hair/50 font-mono">
                  {slide.keyMetrics.map((km, i) => (
                    <div key={i} className="border border-hair/50 bg-white/[0.015] p-2.5 text-center">
                      <span className="label-tech block text-[7px] text-ink-ghost">{km.label}</span>
                      <span
                        className={cn(
                          'data-value mt-1 block text-[13px] font-bold leading-none',
                          km.tone === 'critical'
                            ? 'text-critical'
                            : km.tone === 'warn'
                              ? 'text-warn'
                              : 'text-signal',
                        )}
                      >
                        {km.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-hair pt-3">
            <Button
              size="sm"
              variant="outline"
              icon={<ChevronLeft size={12} />}
              disabled={slideIndex === 0}
              onClick={() => setSlideIndex((i) => i - 1)}
              className="font-mono text-[8.5px]"
            >
              PREVIOUS
            </Button>

            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className={cn(
                    'h-1.5 transition-all',
                    i === slideIndex ? 'w-5 bg-signal' : 'w-1.5 bg-white/20 hover:bg-white/40',
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <Button
              size="sm"
              variant={slideIndex === slides.length - 1 ? 'outline' : 'primary'}
              icon={<ChevronRight size={12} />}
              disabled={slideIndex === slides.length - 1}
              onClick={() => setSlideIndex((i) => i + 1)}
              className="font-mono text-[8.5px]"
            >
              NEXT
            </Button>
          </div>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  )
}
