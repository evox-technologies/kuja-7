'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Heart,
  ShieldCheck,
  Sparkles,
  Users,
  Lock,
  Eye,
  KeyRound,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/landing/section-heading'
import { asset } from '@/lib/assets'
import { useI18n } from '@/lib/i18n/use-i18n'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const DIFFERENTIATOR_ICONS = [Sparkles, Lock, Users, Heart] as const
const TRUST_ICONS = [Eye, ShieldCheck, KeyRound] as const

export default function About() {
  const { messages } = useI18n()
  const a = messages.about

  return (
    <>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[420px] w-full overflow-hidden">
        <Image
          src={asset('/images/hero.webp')}
          alt={a.heroTitle}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto max-w-6xl w-full px-4 lg:px-6">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="max-w-xl text-white"
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-white/90 bg-white/15 rounded-full px-4 py-1.5 mb-5 backdrop-blur-sm">
                {a.heroEyebrow}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                {a.heroTitle}
              </h1>
              <p className="mt-4 text-sm md:text-base text-white/85 leading-relaxed max-w-md">
                {a.heroSubtitle}
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Button asChild variant="gradient" size="lg" className="rounded-full">
                  <Link href="/register">{a.createAccount}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Link href="/dashboard/home">{a.findMatches}</Link>
                </Button>
              </div>
              <p className="mt-5 text-xs text-white/70 tracking-wide">
                {a.trustLine}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
            <div className="flex-1 min-w-0">
              <SectionHeading
                eyebrow={a.storyEyebrow}
                title={a.storyTitle}
                align="left"
                className="mb-6"
              />
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45 }}
                className="space-y-4 text-sm text-gray-600 leading-relaxed"
              >
                <p>{a.storyP1}</p>
                <p>{a.storyP2}</p>
                <p>{a.storyP3}</p>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="w-full lg:w-[45%] shrink-0 relative h-64 sm:h-80 rounded-2xl overflow-hidden"
            >
              <Image
                src={asset('/images/benefits.webp')}
                alt={a.storyImageAlt}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="pb-16 lg:pb-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <SectionHeading
            eyebrow={a.purposeEyebrow}
            title={a.purposeTitle}
            subtitle={a.purposeSubtitle}
            className="mb-12"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm"
            >
              <div className="w-11 h-11 rounded-full bg-brand-50 text-brand flex items-center justify-center mb-4">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{a.missionTitle}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{a.missionText}</p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm"
            >
              <div className="w-11 h-11 rounded-full bg-brand-50 text-brand flex items-center justify-center mb-4">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{a.visionTitle}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{a.visionText}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <SectionHeading
            eyebrow={a.whyEyebrow}
            title={a.whyTitle}
            subtitle={a.whySubtitle}
            className="mb-12"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {a.differentiators.map(({ title, description }, idx) => {
              const Icon = DIFFERENTIATOR_ICONS[idx] ?? Sparkles
              return (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 flex gap-4"
                >
                  <div className="w-10 h-10 shrink-0 rounded-full bg-brand-50 text-brand flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How We Protect You */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <SectionHeading
            eyebrow={a.trustEyebrow}
            title={a.trustTitle}
            subtitle={a.trustSubtitle}
            className="mb-12"
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {a.trustPoints.map(({ title, description }, idx) => {
              const Icon = TRUST_ICONS[idx] ?? Eye
              return (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                  className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 sm:p-6"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {description}
                  </p>
                </motion.div>
              )
            })}
          </div>
          <p className="mt-8 text-center text-xs text-gray-400">{a.neverSell}</p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand to-pink-500 px-6 py-12 sm:px-10 sm:py-14 text-center text-white"
          >
            <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight relative">
              {a.ctaTitle}
            </h2>
            <p className="mt-3 text-sm text-white/85 max-w-md mx-auto relative">
              {a.ctaSubtitle}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 relative">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-brand hover:bg-white/95"
              >
                <Link href="/register">{a.getStarted}</Link>
              </Button>
              <Link
                href="/login"
                className="text-sm text-white/90 hover:text-white underline-offset-4 hover:underline"
              >
                {a.alreadyHaveAccount}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
