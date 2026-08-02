'use client'

import { motion } from 'motion/react'

// Shared section header: brand eyebrow pill + headline (+ optional subtitle).
// Used across landing sections so every heading shares the same flavor.
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}: {
  eyebrow: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  className?: string
}) {
  const alignment =
    align === 'left' ? 'text-left max-w-xl' : 'text-center max-w-xl mx-auto'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className={`${alignment} ${className}`}
    >
      <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-text bg-brand-light rounded-full px-4 py-1.5 mb-5">
        {eyebrow}
      </span>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-gray-500 leading-relaxed">{subtitle}</p>
      )}
    </motion.div>
  )
}
