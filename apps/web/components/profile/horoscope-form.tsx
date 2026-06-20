'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldLabel, PrivacyBanner } from '@/components/ui/sheet'
import { DROPDOWN_OPTIONS, type ProfileDraft } from '@/lib/profile/types'
import { useI18n } from '@/lib/i18n/use-i18n'
import { EyeOff } from 'lucide-react'

interface Props {
  data: ProfileDraft
  onChange: (data: ProfileDraft) => void
}

export default function HoroscopeForm({ data, onChange }: Props) {
  const { messages, t } = useI18n()
  const f = messages.profile.fields

  function set<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    onChange({ ...data, [key]: value })
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <EyeOff className="w-4 h-4 text-gray-400" />
        <h2 className="font-semibold text-gray-900">{messages.profile.sections.horoscopeInfo}</h2>
      </div>
      <PrivacyBanner text={messages.profile.privacyBanner} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FieldLabel label={f.kujaNumber}>
          <Select value={data.kujaNumber || undefined} onValueChange={(v) => set('kujaNumber', v)}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.choose')} />
            </SelectTrigger>
            <SelectContent>
              {DROPDOWN_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>
        <FieldLabel label={f.birthDay}>
          <Input value={data.birthDay} onChange={(e) => set('birthDay', e.target.value)} />
        </FieldLabel>
        <FieldLabel label={f.birthStar}>
          <Select value={data.birthStar || undefined} onValueChange={(v) => set('birthStar', v)}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.choose')} />
            </SelectTrigger>
            <SelectContent>
              {DROPDOWN_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>
      </div>
    </div>
  )
}
