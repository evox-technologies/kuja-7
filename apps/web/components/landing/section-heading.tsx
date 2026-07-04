'use client'

import { motion } from 'motion/react'

// Shared section header: brand eyebrow pill + headline. Used across landing sections.
export default function SectionHeading({
  eyebrow,
  title,
  className = '',
}: {
  eyebrow: string
  title: string
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className={`text-center max-w-xl mx-auto ${className}`}
    >
      <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand bg-brand-50 rounded-full px-4 py-1.5 mb-5">
        {eyebrow}
      </span>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
        {title}
      </h2>
    </motion.div>
  )
}
