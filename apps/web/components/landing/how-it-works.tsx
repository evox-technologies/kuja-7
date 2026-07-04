'use client'

import Image from 'next/image'
import { ChevronRight, UserPlus, Search, MessageCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/landing/section-heading'
import { asset } from '@/lib/assets'
import { useI18n } from '@/lib/i18n/use-i18n'

const STEP_ICONS = [UserPlus, Search, MessageCircle] as const
const STEP_SHOTS = [
  '/images/how-create-profile.jpg',
  '/images/how-find-matches.jpg',
  '/images/how-start-chatting.jpg',
] as const

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function HowItWorks() {
  const { messages } = useI18n()
  const steps = messages.howItWorks.steps

  return (
    <section className="py-20 px-4 bg-white">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={messages.howItWorks.title}
          title={messages.howItWorks.subtitle}
          className="mb-14"
        />

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Dashed connector behind the numbered nodes (desktop) */}
          <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] border-t-2 border-dashed border-brand-100" />

          {steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? UserPlus
            return (
              <motion.div
                key={step.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                {/* Step number */}
                <div className="grid place-items-center w-16 h-16 rounded-full bg-brand text-white text-xl font-bold shadow-lg shadow-brand/30 ring-4 ring-white">
                  {i + 1}
                </div>

                {/* Card */}
                <div className="group mt-6 w-full rounded-3xl border border-brand-100 bg-white p-5 shadow-xl shadow-brand/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand/10">
                  {/* Screenshot */}
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-brand-50/40 ring-1 ring-black/5">
                    <Image
                      src={asset(STEP_SHOTS[i])}
                      alt={step.title}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 90vw, 33vw"
                    />
                  </div>

                  {/* Title + icon */}
                  <div className="flex items-center gap-3 mt-5 text-left">
                    <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-50 text-brand shrink-0">
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3 className="font-bold text-gray-900 text-lg">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500 text-left">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-14">
          <Button variant="dark" className="rounded-full px-8 h-12 text-base">
            {messages.howItWorks.cta} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  )
}
