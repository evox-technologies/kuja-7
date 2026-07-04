'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import SectionHeading from '@/components/landing/section-heading'
import { asset } from '@/lib/assets'
import { useI18n } from '@/lib/i18n/use-i18n'

const STEP_SHOTS = [
  '/images/how-create-profile.jpg',
  '/images/how-find-matches.jpg',
  '/images/how-start-chatting.jpg',
] as const
const URL_PATHS = ['register', 'matches', 'chat'] as const

const TICK_MS = 55
const TICK_STEP = 1.2 // ~4.5s per step

export default function HowItWorks() {
  const { messages } = useI18n()
  const steps = messages.howItWorks.steps

  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)

  // Autoplay: fill the active step's progress bar, then advance.
  useEffect(() => {
    if (paused) return
    const id = setInterval(
      () => setProgress((p) => (p >= 100 ? 100 : p + TICK_STEP)),
      TICK_MS,
    )
    return () => clearInterval(id)
  }, [paused, active])

  useEffect(() => {
    if (progress < 100) return
    setActive((a) => (a + 1) % steps.length)
    setProgress(0)
  }, [progress, steps.length])

  const select = (i: number) => {
    setActive(i)
    setProgress(0)
  }

  return (
    <section className="py-20 px-4 bg-white">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={messages.howItWorks.title}
          title={messages.howItWorks.subtitle}
          align="left"
          className="mb-12"
        />

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="flex flex-col gap-5 lg:gap-0"
        >
          {/* Mobile: tab bar */}
          <div className="flex lg:hidden gap-2">
            {steps.map((step, i) => {
              const on = i === active
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => select(i)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl transition-all ${
                    on
                      ? 'bg-white border border-brand-100 shadow-md shadow-brand/5'
                      : 'border border-transparent'
                  }`}
                >
                  <span
                    className={`grid place-items-center w-8 h-8 rounded-lg font-bold text-xs ${
                      on ? 'bg-brand text-white' : 'bg-brand-50 text-brand'
                    }`}
                  >
                    0{i + 1}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      on ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-0 lg:gap-12 items-center">
            {/* Desktop: step selector */}
            <div className="hidden lg:flex flex-col gap-2">
              {steps.map((step, i) => {
                const on = i === active
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => select(i)}
                    className={`w-full text-left flex gap-4 items-start p-5 rounded-2xl transition-all duration-300 ${
                      on
                        ? 'bg-white border border-brand-100 shadow-lg shadow-brand/5'
                        : 'border border-transparent hover:bg-brand-50/40'
                    }`}
                  >
                    <span
                      className={`shrink-0 grid place-items-center w-11 h-11 rounded-xl font-bold text-base transition-all ${
                        on
                          ? 'bg-brand text-white shadow-md shadow-brand/30'
                          : 'bg-brand-50 text-brand'
                      }`}
                    >
                      0{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 pt-1.5 text-lg">
                        {step.title}
                      </h3>
                      {on && (
                        <>
                          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                            {step.description}
                          </p>
                          <div className="mt-3 h-[3px] rounded-full bg-brand-100 overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Browser-framed preview */}
            <div className="rounded-3xl border border-brand-100 bg-white shadow-2xl shadow-brand/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
                <div className="mx-auto text-[11px] text-gray-400 bg-gray-100 px-4 py-1 rounded-full">
                  kuja7.lk / {URL_PATHS[active]}
                </div>
              </div>
              <div className="relative h-[440px] lg:h-[460px] bg-brand-50/30">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={asset(STEP_SHOTS[active])}
                      alt={steps[active].title}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile: caption for the active step */}
          <div className="block lg:hidden">
            <h3 className="font-bold text-lg text-gray-900">
              {steps[active].title}
            </h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              {steps[active].description}
            </p>
            <div className="mt-3.5 h-[3px] rounded-full bg-brand-100 overflow-hidden">
              <div
                className="h-full bg-brand rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
