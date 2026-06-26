'use client'

import { Fragment } from 'react'
import { ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/use-i18n'

const STEP_NUMBERS = ['01', '02', '03'] as const

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function HowItWorks() {
  const { messages } = useI18n()

  return (
    <section className="py-20 px-4 bg-white">
      <motion.div
        className="mx-auto max-w-3xl text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ staggerChildren: 0.12 }}
      >
        {/* Heading */}
        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          {messages.howItWorks.title}
        </motion.h2>
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-gray-400 mb-12"
        >
          {messages.howItWorks.subtitle}
        </motion.p>

        {/* Step indicators */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center mb-8"
        >
          {STEP_NUMBERS.map((number, i) => (
            <Fragment key={number}>
              <div className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shrink-0">
                {number}
              </div>
              {i < STEP_NUMBERS.length - 1 && (
                <div className="flex-1 h-px bg-gray-200 mx-1" />
              )}
            </Fragment>
          ))}
        </motion.div>

        {/* Step cards — staggered */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {messages.howItWorks.steps.map((step, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(229,56,86,0.10)' }}
              className="border border-brand-100 rounded-xl p-5 text-left cursor-default"
            >
              <h3 className="font-semibold text-brand text-sm mb-2">{step.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
          <Button variant="dark" className="rounded-full px-8">
            {messages.howItWorks.cta} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}
