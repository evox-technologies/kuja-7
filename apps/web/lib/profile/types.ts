export interface MockProfile {
  id: string
  firstName: string
  lastName: string
  age: number
  gender: 'MALE' | 'FEMALE'
  kujaNumber: string
  location: string
  language: string
  profession: string
  religion: string
  height: string
  education: string
  ethnicity: string
  createdAt: string
  interestType: 'sent' | 'received' | null
  interestStatus: 'pending' | 'accepted' | null
  interestedBy: string | null
  avatarUrl: string | null
}

export interface ProfileDraft {
  firstName: string
  lastName: string
  age: string
  nationality: string
  gender: string
  ethnicity: string
  caste: string
  civilStatus: string
  religion: string
  birthday: string
  height: string
  weight: string
  skinColor: string
  bodyType: string
  country: string
  city: string
  stateDistrict: string
  homeAddress: string
  education: string
  profession: string
  drinking: string
  smoking: string
  foodPreference: string
  kujaNumber: string
  birthDay: string
  birthStar: string
  kujaDosha: string
  mobileNumber: string
  whatsappNumber: string
  address: string
  images: string[]
}

export const EMPTY_PROFILE_DRAFT: ProfileDraft = {
  firstName: '',
  lastName: '',
  age: '',
  nationality: '',
  gender: '',
  ethnicity: '',
  caste: '',
  civilStatus: '',
  religion: '',
  birthday: '',
  height: '',
  weight: '',
  skinColor: '',
  bodyType: '',
  country: '',
  city: '',
  stateDistrict: '',
  homeAddress: '',
  education: '',
  profession: '',
  drinking: '',
  smoking: '',
  foodPreference: '',
  kujaNumber: '',
  birthDay: '',
  birthStar: '',
  kujaDosha: '',
  mobileNumber: '',
  whatsappNumber: '',
  address: '',
  images: [],
}

export const DROPDOWN_OPTIONS = ['1', '2', '3', '4'] as const

export async function fetchMockProfiles(): Promise<MockProfile[]> {
  const res = await fetch('/data/registerUsrs.json')
  if (!res.ok) throw new Error('Failed to load profiles')
  return res.json()
}

export function formatTimeAgo(iso: string, locale: string): string {
  const days = Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)),
  )
  const key = days === 1 ? 'dayAgo' : 'daysAgo'
  const template =
    locale === 'si'
      ? days === 1
        ? 'දින {{count}}කට පෙර'
        : 'දින {{count}}කට පෙර'
      : days === 1
        ? '{{count}} Day Ago'
        : '{{count}} Days Ago'
  return template.replace('{{count}}', String(days))
}
