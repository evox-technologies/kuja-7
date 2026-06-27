'use client'

import { passwordScore, passwordLabel } from '@/lib/auth/password'
import { useI18n } from '@/lib/i18n/use-i18n'

const BAR_COLORS = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500']
const TEXT_COLORS = ['text-red-500', 'text-red-500', 'text-amber-500', 'text-lime-600', 'text-emerald-600']

export default function PasswordStrength({ value }: { value: string }) {
  const { t } = useI18n()
  if (!value) return null
  const score = passwordScore(value)

  return (
    <div className="-mt-2 mb-4">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? BAR_COLORS[score] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-semibold mt-1.5 ${TEXT_COLORS[score]}`}>
        {t(`auth.passwordStrength.${passwordLabel(score)}`)}
      </p>
    </div>
  )
}
