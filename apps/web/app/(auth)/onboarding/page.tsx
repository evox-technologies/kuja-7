'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProfileLayout, { ProfileFooterButtons } from '@/components/profile/profile-layout'
import BasicDetailsForm from '@/components/profile/basic-details-form'
import HoroscopeForm from '@/components/profile/horoscope-form'
import PrivateDataForm from '@/components/profile/private-data-form'
import ReviewProfile from '@/components/profile/review-profile'
import { EMPTY_PROFILE_DRAFT, type ProfileDraft } from '@/lib/profile/types'
import {
  getWizardDraft,
  saveWizardDraft,
  clearWizardDraft,
  saveProfileDraft,
  useRegisterUser,
} from '@/lib/hooks/use-register-user'
import { useI18n } from '@/lib/i18n/use-i18n'

type Step = 1 | 2 | 3 | 'review'

export default function OnboardingPage() {
  const router = useRouter()
  const { t } = useI18n()
  const { registered, setRegisterUser } = useRegisterUser()
  const [step, setStep] = useState<Step>(1)
  const [data, setData] = useState<ProfileDraft>(EMPTY_PROFILE_DRAFT)
  const [error, setError] = useState('')

  useEffect(() => {
    const draft = getWizardDraft<ProfileDraft>()
    if (draft) setData(draft)
  }, [])

  useEffect(() => {
    if (registered === true) {
      router.replace('/dashboard/home')
    }
  }, [registered, router])

  useEffect(() => {
    saveWizardDraft(data)
  }, [data])

  function goTo(s: Step) {
    setError('')
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function validateStep1() {
    if (!data.firstName || !data.lastName || !data.gender) {
      setError(t('profile.requiredFields'))
      return false
    }
    return true
  }

  function handleConfirm() {
    saveProfileDraft(data)
    clearWizardDraft()
    setRegisterUser(true)
    router.replace('/dashboard/home')
  }

  if (registered === null || registered === true) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <ProfileLayout
      step={step}
      onBack={step === 1 ? undefined : () => goTo(step === 'review' ? 3 : ((step - 1) as Step))}
      footer={
        step === 'review' ? (
          <ProfileFooterButtons
            onBack={() => goTo(3)}
            onContinue={handleConfirm}
            continueLabel={t('common.confirmCreate')}
          />
        ) : (
          <ProfileFooterButtons
            onBack={step > 1 ? () => goTo((step - 1) as Step) : undefined}
            onSkip={step < 3 ? () => goTo((step + 1) as Step) : () => goTo('review')}
            onContinue={() => {
              if (step === 1 && !validateStep1()) return
              if (step === 3) goTo('review')
              else goTo((step + 1) as Step)
            }}
            continueLabel={step === 3 ? t('common.saveReview') : t('common.saveContinue')}
          />
        )
      }
    >
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {step === 1 && <BasicDetailsForm data={data} onChange={setData} />}
      {step === 2 && <HoroscopeForm data={data} onChange={setData} />}
      {step === 3 && <PrivateDataForm data={data} onChange={setData} />}
      {step === 'review' && <ReviewProfile data={data} onEdit={(s) => goTo(s)} />}
    </ProfileLayout>
  )
}
