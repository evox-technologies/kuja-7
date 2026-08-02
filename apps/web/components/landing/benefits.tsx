'use client'

import Image from 'next/image'
import { asset } from '@/lib/assets'
import {
  Search,
  MessageCircle,
  ShieldCheck,
  Bell,
  Heart,
  Users,
  Sparkles,
  MousePointerClick,
  Headphones,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import SectionHeading from '@/components/landing/section-heading'
import { useI18n } from '@/lib/i18n/use-i18n'

const BENEFIT_ICONS = [
  Search,
  MessageCircle,
  ShieldCheck,
  Bell,
  Heart,
  Users,
  Sparkles,
  MousePointerClick,
  Headphones,
] as const

// ponytail: heart-shaped icon backdrop via CSS mask (no extra deps); icon child sits in the heart's center
const heartUrl =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill='black'/%3E%3C/svg%3E\")"

const heartMask = {
  WebkitMaskImage: heartUrl,
  maskImage: heartUrl,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
} as const

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

function BenefitCard({
  title,
  description,
  idx,
}: {
  title: string
  description: string
  idx: number
}) {
  const Icon = BENEFIT_ICONS[idx] ?? Search
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="text-center group cursor-default"
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        style={heartMask}
        className="w-20 h-20 bg-brand-light flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-border transition-colors"
      >
        <Icon className="w-6 h-6 text-brand -translate-y-1" />
      </motion.div>
      <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  )
}

export default function Benefits() {
  const { messages } = useI18n()
  const items = messages.benefits.items

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' }, [
    Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }),
  ])
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setActive(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  const goTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  return (
    <section>
      {/* Background image */}
      <div className="relative h-80 overflow-hidden">
        <Image
          src={asset('/images/benefits.webp')}
          alt="Couple"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />

        {/* Members badge */}
        <motion.div
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          <div className="flex items-center gap-2 bg-white/95 rounded-full px-4 py-2 shadow-lg text-sm font-semibold text-brand">
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            {messages.benefits.statsMembers}
          </div>
        </motion.div>
      </div>

      {/* Benefits grid */}
      <div className="bg-white pb-20 px-4">
        <SectionHeading
          eyebrow={messages.benefits.title}
          title={messages.benefits.subtitle}
          className="mb-14"
        />

        {/* Desktop: grid */}
        <div className="mx-auto max-w-4xl hidden lg:grid grid-cols-3 gap-10">
          {items.map(({ title, description }, idx) => (
            <BenefitCard key={title} title={title} description={description} idx={idx} />
          ))}
        </div>

        {/* Mobile: looping autoplay carousel + dots */}
        <div className="lg:hidden">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {items.map(({ title, description }, idx) => (
                <div key={title} className="shrink-0 basis-[70%] min-w-0 px-3">
                  <BenefitCard title={title} description={description} idx={idx} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-6">
            {items.map(({ title }, i) => (
              <button
                key={title}
                onClick={() => goTo(i)}
                aria-label={`Go to benefit ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === active ? 'w-5 bg-brand' : 'w-2 bg-brand-border'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
