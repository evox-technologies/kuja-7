'use client'

import { useCallback, useEffect, useState } from 'react'

const REGISTER_USER_KEY = 'registeruser'
const PROFILE_DRAFT_KEY = 'kuja7-profile-draft'
const WIZARD_DRAFT_KEY = 'kuja7-wizard-draft'

export function isProfileComplete(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(REGISTER_USER_KEY) === 'true'
}

export function useRegisterUser() {
  const [registered, setRegistered] = useState<boolean | null>(null)

  useEffect(() => {
    setRegistered(isProfileComplete())
  }, [])

  const setRegisterUser = useCallback((value: boolean) => {
    localStorage.setItem(REGISTER_USER_KEY, value ? 'true' : 'false')
    setRegistered(value)
  }, [])

  return { registered, setRegisterUser, isLoading: registered === null }
}

export function getProfileDraft<T>(): T | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(PROFILE_DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveProfileDraft<T>(data: T) {
  localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(data))
}

export function getWizardDraft<T>(): T | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(WIZARD_DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveWizardDraft<T>(data: T) {
  sessionStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(data))
}

export function clearWizardDraft() {
  sessionStorage.removeItem(WIZARD_DRAFT_KEY)
}
