'use client'

import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/use-i18n'

interface Props {
  current: 1 | 2 | 3 | 'review'
}

export default function ProfileStepper({ current }: Props) {
  const { messages } = useI18n()
  const steps = [
    { num: 1, label: messages.profile.steps.basic },
    { num: 2, label: messages.profile.steps.horoscope },
    { num: 3, label: messages.profile.steps.private },
  ] as const

  function stepState(num: number) {
    if (current === 'review') return 'done'
    if (num < current) return 'done'
    if (num === current) return 'active'
    return 'upcoming'
  }

  return (
    <div className="flex items-start justify-center gap-2 sm:gap-4 mb-8 px-2">
      {steps.map((step, i) => {
        const state = stepState(step.num)
        return (
          <div key={step.num} className="flex items-center gap-2 sm:gap-4 flex-1 max-w-[8rem] sm:max-w-none">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold',
                  state === 'done' && 'bg-emerald-500 text-white',
                  state === 'active' && 'bg-gray-900 text-white',
                  state === 'upcoming' && 'bg-white border-2 border-gray-200 text-gray-400',
                )}
              >
                {String(step.num).padStart(2, '0')}
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-xs mt-2 text-center leading-tight',
                  state === 'active' ? 'text-gray-900 font-semibold' : 'text-gray-400',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden sm:block flex-1 h-px bg-gray-200 mt-5 min-w-[1rem]" />
            )}
          </div>
        )
      })}
    </div>
  )
}
