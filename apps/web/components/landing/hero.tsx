'use client'

import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Hero() {
  return (
    <section className="relative h-[90vh] min-h-[560px] w-full overflow-hidden">
      <Image
        src="/images/hero.jpg"
        alt="Happy couple"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/25" />

      {/* Carousel dots */}
      <motion.div
        className="absolute bottom-44 left-1/2 -translate-x-1/2 flex gap-2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        {[true, false, false].map((active, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${active ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`}
          />
        ))}
      </motion.div>

      {/* Search card */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10">
      <motion.div
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.3 }}
      >
        <form action="/search" method="GET">
          <div className="bg-white rounded-2xl shadow-2xl px-6 py-5 flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                Looking For
              </label>
              <div className="relative">
                <select
                  name="gender"
                  defaultValue="FEMALE"
                  className="w-full h-10 rounded-full border border-gray-200 bg-white pl-4 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
                >
                  <option value="FEMALE">Bride</option>
                  <option value="MALE">Groom</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ▾
                </div>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                Age Range
              </label>
              <div className="flex items-center gap-2">
                <Input name="ageMin" type="number" placeholder="Min" className="text-center" />
                <span className="text-gray-300 font-light">—</span>
                <Input name="ageMax" type="number" placeholder="Max" className="text-center" />
              </div>
            </div>

            <Button type="submit" className="rounded-full px-6 shrink-0">
              Get Started <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>
      </motion.div>
      </div>
    </section>
  )
}
