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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function Benefits() {
  const { messages } = useI18n()

  return (
    <section>
      {/* Background image */}
      <div className="relative h-80 overflow-hidden">
        <Image
          src={asset('/images/benefits.jpg')}
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
        <motion.div
          className="mx-auto max-w-4xl text-center mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            {messages.benefits.title}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-gray-400"
          >
            {messages.benefits.subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          className="mx-auto max-w-4xl grid grid-cols-3 gap-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={{ staggerChildren: 0.08 }}
        >
          {messages.benefits.items.map(({ title, description }, idx) => {
            const Icon = BENEFIT_ICONS[idx] ?? Search
            return (
            <motion.div
              key={title}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -4 }}
              className="text-center group cursor-default"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-100 transition-colors"
              >
                <Icon className="w-6 h-6 text-brand" />
              </motion.div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
            </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
