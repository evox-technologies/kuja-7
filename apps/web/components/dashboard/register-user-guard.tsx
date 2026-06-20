'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRegisterUser } from '@/lib/hooks/use-register-user'
import OnboardingPromptModal from '@/components/dashboard/onboarding-prompt-modal'

export default function RegisterUserGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { registered, isLoading } = useRegisterUser()
  const [dismissed, setDismissed] = useState(false)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  if (registered === true) {
    return <>{children}</>
  }

  return (
    <OnboardingPromptModal
      open={!dismissed}
      onConfirm={() => router.push('/onboarding')}
      onCancel={() => setDismissed(true)}
    />
  )
}
