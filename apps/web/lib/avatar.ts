type Gender = 'MALE' | 'FEMALE' | string | null | undefined

export function defaultAvatarSrc(gender: Gender): string | null {
  if (gender === 'MALE') return '/avatars/default-male.svg'
  if (gender === 'FEMALE') return '/avatars/default-female.svg'
  return null
}
