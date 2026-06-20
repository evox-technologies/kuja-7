'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldLabel } from '@/components/ui/sheet'
import { DROPDOWN_OPTIONS, type ProfileDraft } from '@/lib/profile/types'
import { useI18n } from '@/lib/i18n/use-i18n'

interface Props {
  data: ProfileDraft
  onChange: (data: ProfileDraft) => void
}

function DropdownField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <FieldLabel label={label}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('common.choose')} />
        </SelectTrigger>
        <SelectContent>
          {DROPDOWN_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldLabel>
  )
}

export default function BasicDetailsForm({ data, onChange }: Props) {
  const { messages } = useI18n()
  const f = messages.profile.fields
  const s = messages.profile.sections

  function set<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold text-gray-900 mb-4">{s.personalInfo}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldLabel label={f.firstName}>
            <Input value={data.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </FieldLabel>
          <FieldLabel label={f.lastName}>
            <Input value={data.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </FieldLabel>
          <FieldLabel label={f.age}>
            <Input value={data.age} onChange={(e) => set('age', e.target.value)} />
          </FieldLabel>
          <FieldLabel label={f.nationality}>
            <Input value={data.nationality} onChange={(e) => set('nationality', e.target.value)} />
          </FieldLabel>
          <DropdownField label={f.gender} value={data.gender} onChange={(v) => set('gender', v)} />
          <DropdownField label={f.ethnicity} value={data.ethnicity} onChange={(v) => set('ethnicity', v)} />
          <DropdownField label={f.caste} value={data.caste} onChange={(v) => set('caste', v)} />
          <DropdownField label={f.civilStatus} value={data.civilStatus} onChange={(v) => set('civilStatus', v)} />
          <DropdownField label={f.religion} value={data.religion} onChange={(v) => set('religion', v)} />
          <FieldLabel label={f.birthday}>
            <Input type="date" value={data.birthday} onChange={(e) => set('birthday', e.target.value)} />
          </FieldLabel>
          <DropdownField label={f.height} value={data.height} onChange={(v) => set('height', v)} />
          <DropdownField label={f.weight} value={data.weight} onChange={(v) => set('weight', v)} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900 mb-4">{s.residency}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DropdownField label={f.country} value={data.country} onChange={(v) => set('country', v)} />
          <DropdownField label={f.city} value={data.city} onChange={(v) => set('city', v)} />
          <DropdownField label={f.stateDistrict} value={data.stateDistrict} onChange={(v) => set('stateDistrict', v)} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900 mb-4">{s.educationProfession}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DropdownField label={f.education} value={data.education} onChange={(v) => set('education', v)} />
          <DropdownField label={f.profession} value={data.profession} onChange={(v) => set('profession', v)} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900 mb-4">{s.habits}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DropdownField label={f.drinking} value={data.drinking} onChange={(v) => set('drinking', v)} />
          <DropdownField label={f.smoking} value={data.smoking} onChange={(v) => set('smoking', v)} />
          <DropdownField label={f.foodPreference} value={data.foodPreference} onChange={(v) => set('foodPreference', v)} />
        </div>
      </section>
    </div>
  )
}
