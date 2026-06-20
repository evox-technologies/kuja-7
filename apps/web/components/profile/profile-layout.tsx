'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LanguageToggle from '@/components/layout/language-toggle'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/use-i18n'
import ProfileStepper from './profile-stepper'

interface Props {
  step: 1 | 2 | 3 | 'review'
  onBack?: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function ProfileLayout({ step, onBack, children, footer }: Props) {
  const { messages, t } = useI18n()

  return (
    <div className="min-h-screen bg-gray-50">
     

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 ">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-600 mb-4 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('common.back')}
          </button>
        )}

        <p className="text-center text-xs text-gray-400 mb-1">{messages.profile.siteName}</p>
        <h1 className="text-center text-2xl sm:text-3xl font-bold bg-gradient-to-r from-brand to-pink-500 bg-clip-text text-transparent mb-1">
          {messages.profile.title}
        </h1>
        {step === 'review' && (
          <p className="text-center text-sm text-gray-500 mb-4">{messages.profile.reviewTitle}</p>
        )}

        {step !== 'review' && <ProfileStepper current={step} />}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          {children}
        </div>

        {footer && <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">{footer}</div>}
      </div>
    </div>
  )
}

export function ProfileFooterButtons({
  onBack,
  onSkip,
  onContinue,
  continueLabel,
  loading,
}: {
  onBack?: () => void
  onSkip?: () => void
  onContinue: () => void
  continueLabel: string
  loading?: boolean
}) {
  const { t } = useI18n()

  return (
    <>
      {onBack && (
        <Button variant="outline" className="rounded-full" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('common.back')}
        </Button>
      )}
      <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto w-full sm:w-auto">
        {onSkip && (
          <Button variant="dark" className="rounded-full" onClick={onSkip}>
            {t('common.skip')}
          </Button>
        )}
        <Button
          variant="gradient"
          className="rounded-full"
          onClick={onContinue}
          disabled={loading}
        >
          {continueLabel}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </>
  )
}
