'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface ProfileGuardCtx {
  profileCompleted: boolean | null
  refreshStatus: () => void
  guardAction: (action: () => void) => void
}

const Ctx = createContext<ProfileGuardCtx>({
  profileCompleted: null,
  refreshStatus: () => {},
  guardAction: (fn) => fn(),
})

export function useProfileGuard() {
  return useContext(Ctx)
}

interface ProfileSummary {
  profileCompleted: boolean
}

export function ProfileGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const refreshStatus = useCallback(() => {
    apiFetch<ProfileSummary>('/auth/me')
      .then(p => setProfileCompleted(p.profileCompleted))
      .catch(() => setProfileCompleted(null))
  }, [])

  useEffect(() => { refreshStatus() }, [refreshStatus])

  const guardAction = useCallback((action: () => void) => {
    if (profileCompleted === false) {
      setPendingAction(() => action)
      setShowModal(true)
    } else {
      action()
    }
  }, [profileCompleted])

  function handleCompleteProfile() {
    setShowModal(false)
    setPendingAction(null)
    router.push('/dashboard/profile')
  }

  function handleLater() {
    setShowModal(false)
    setPendingAction(null)
    // still run the action if they chose Later (optional — currently we just close)
  }

  return (
    <Ctx.Provider value={{ profileCompleted, refreshStatus, guardAction }}>
      {children}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleLater} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-up">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>

            <h2 className="text-center font-bold text-gray-900 text-lg mb-2">
              Complete Your Profile
            </h2>
            <p className="text-center text-sm text-gray-500 mb-6 leading-relaxed">
              You need to complete your profile before you can send interests, view matches, or start chatting.
              It only takes a minute!
            </p>

            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={handleCompleteProfile}
                className="w-[90%] py-2.5 px-6 rounded-full bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Complete Profile
              </button>
              <button
                onClick={handleLater}
                className="w-[90%] py-2.5 px-6 mb-4 rounded-full border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Complete Later
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
