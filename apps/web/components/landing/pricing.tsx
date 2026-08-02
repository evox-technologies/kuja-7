'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Check, ShieldCheck, RefreshCw, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/landing/section-heading'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const PLANS = [
  {
    name: 'Free',
    price: 'Rs. 0',
    period: 'forever',
    description: 'Start exploring and build your profile at no cost.',
    features: [
      'Browse member profiles',
      'Basic search & filters',
      'Limited interest requests',
      'Create and edit your profile',
    ],
    cta: 'Get Started Free',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: 'Rs. 2,990',
    period: 'per month',
    description: 'Unlock full matching power for serious seekers.',
    features: [
      'Everything in Free',
      'Unlimited interest requests',
      'Chat after mutual interest',
      'Priority profile visibility',
      'Advanced search filters',
    ],
    cta: 'Get Premium',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Gold',
    price: 'Rs. 7,990',
    period: 'per 3 months',
    description: 'Maximum reach with featured placement and support.',
    features: [
      'Everything in Premium',
      'Featured profile boost',
      'Advanced Kuja filters',
      'Priority customer support',
      'Best value for 3 months',
    ],
    cta: 'Get Gold',
    href: '/register',
    highlighted: false,
  },
] as const

const TRUST_ITEMS = [
  {
    icon: Lock,
    title: 'Privacy-first',
    description: 'Sensitive details stay protected until mutual interest.',
  },
  {
    icon: RefreshCw,
    title: 'Flexible membership',
    description: 'Upgrade when you are ready — cancel anytime.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure payments',
    description: 'Your payment details are handled safely and privately.',
  },
] as const

const FAQS = [
  {
    q: 'What does the Free plan include?',
    a: 'You can create a profile, browse members, use basic filters, and send a limited number of interest requests.',
  },
  {
    q: 'When can I start chatting?',
    a: 'Chat unlocks after mutual interest — both members must show interest before messaging begins.',
  },
  {
    q: 'How do I upgrade later?',
    a: 'Create your free account first, then upgrade to Premium or Gold anytime from your dashboard.',
  },
] as const

export default function Pricing() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-50 pt-16 pb-12 lg:pt-20 lg:pb-16">
        <div className="pointer-events-none absolute -top-24 right-0 w-80 h-80 rounded-full bg-brand-light blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 lg:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-text bg-brand-light rounded-full px-4 py-1.5 mb-5">
              Pricing
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
              Simple membership plans
            </h1>
            <p className="mt-4 text-sm md:text-base text-gray-500 leading-relaxed">
              Choose the plan that fits your journey — start free, upgrade when
              you are ready to connect more deeply.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="pb-16 lg:pb-20 -mt-2">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-5 items-stretch">
            {PLANS.map((plan, idx) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-white p-6 sm:p-7 shadow-sm',
                  plan.highlighted
                    ? 'border-brand shadow-md lg:scale-[1.03] z-10'
                    : 'border-gray-100'
                )}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-on-brand bg-brand rounded-full px-3 py-1">
                    Recommended
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  {plan.description}
                </p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-xs text-gray-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.highlighted ? 'gradient' : 'outline'}
                  size="lg"
                  className="mt-7 w-full rounded-full"
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included / trust */}
      <section className="pb-16 lg:pb-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <SectionHeading
            eyebrow="Peace of mind"
            title="What’s included with every plan"
            subtitle="Membership on Kuja7.lk is built around trust and control."
            className="mb-12"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TRUST_ITEMS.map(({ icon: Icon, title, description }, idx) => (
              <motion.div
                key={title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="text-center px-2"
              >
                <div className="w-11 h-11 mx-auto rounded-full bg-brand-light text-brand-text flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions"
            subtitle="Quick answers before you choose a plan."
            className="mb-12"
          />
          <div className="max-w-3xl mx-auto space-y-4">
            {FAQS.map(({ q, a }, idx) => (
              <motion.div
                key={q}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6"
              >
                <h3 className="font-semibold text-gray-900 text-sm mb-2">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-brand px-6 py-12 sm:px-10 sm:py-14 text-center text-on-brand"
          >
            <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight relative">
              Start free. Upgrade when it feels right.
            </h2>
            <p className="mt-3 text-sm text-on-brand/80 max-w-md mx-auto relative">
              Create your Kuja7.lk profile today and take the next step toward a
              meaningful match.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 relative">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-brand-text hover:bg-white/95"
              >
                <Link href="/register">Create Account</Link>
              </Button>
              <Link
                href="/login"
                className="text-sm text-on-brand/90 hover:text-on-brand underline-offset-4 hover:underline"
              >
                Already have an account? Log in
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
