'use client'

import { Pencil } from 'lucide-react'
import type { ProfileDraft } from '@/lib/profile/types'
import { useI18n } from '@/lib/i18n/use-i18n'
import { PrivacyBanner } from '@/components/ui/sheet'

interface Props {
  data: ProfileDraft
  onEdit: (step: 1 | 2 | 3) => void
}

function Section({
  title,
  step,
  onEdit,
  children,
  privacyText,
  privateSection,
}: {
  title: string
  step: 1 | 2 | 3
  onEdit: (step: 1 | 2 | 3) => void
  children: React.ReactNode
  privacyText?: string
  privateSection?: boolean
}) {
  const { t } = useI18n()
  return (
    <section className="border-b border-gray-100 pb-6 mb-6 last:border-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand"
        >
          <Pencil className="w-3 h-3" />
          {t('common.edit')}
        </button>
      </div>
      {privateSection && privacyText && <PrivacyBanner text={privacyText} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {children}
      </div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-800">{value || '—'}</p>
    </div>
  )
}

export default function ReviewProfile({ data, onEdit }: Props) {
  const { messages } = useI18n()
  const f = messages.profile.fields
  const s = messages.profile.sections
  const privacy = messages.profile.privacyBanner

  return (
    <div>
      <Section title={s.contactDetails} step={3} onEdit={onEdit} privateSection privacyText={privacy}>
        <Field label={f.mobileNumber} value={data.mobileNumber} />
        <Field label={f.whatsappNumber} value={data.whatsappNumber} />
        <Field label={f.address} value={data.address} />
      </Section>

      <Section title={s.myImages} step={3} onEdit={onEdit} privateSection privacyText={privacy}>
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          {data.images.length === 0 ? (
            <p className="text-gray-400 text-sm">—</p>
          ) : (
            data.images.map((src, i) => (
              <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))
          )}
        </div>
      </Section>

      <Section title={s.personalInfo} step={1} onEdit={onEdit}>
        <Field label={f.firstName} value={data.firstName} />
        <Field label={f.lastName} value={data.lastName} />
        <Field label={f.age} value={data.age} />
        <Field label={f.gender} value={data.gender} />
        <Field label={f.ethnicity} value={data.ethnicity} />
        <Field label={f.civilStatus} value={data.civilStatus} />
        <Field label={f.religion} value={data.religion} />
        <Field label={f.birthday} value={data.birthday} />
        <Field label={f.height} value={data.height} />
      </Section>

      <Section title={s.residency} step={1} onEdit={onEdit}>
        <Field label={f.country} value={data.country} />
        <Field label={f.city} value={data.city} />
        <Field label={f.stateDistrict} value={data.stateDistrict} />
      </Section>

      <Section title={s.educationProfession} step={1} onEdit={onEdit}>
        <Field label={f.education} value={data.education} />
        <Field label={f.profession} value={data.profession} />
      </Section>

      <Section title={s.habits} step={1} onEdit={onEdit}>
        <Field label={f.drinking} value={data.drinking} />
        <Field label={f.smoking} value={data.smoking} />
        <Field label={f.foodPreference} value={data.foodPreference} />
      </Section>

      <Section title={s.horoscopeInfo} step={2} onEdit={onEdit} privateSection privacyText={privacy}>
        <Field label={f.kujaNumber} value={data.kujaNumber} />
        <Field label={f.birthDay} value={data.birthDay} />
        <Field label={f.birthStar} value={data.birthStar} />
      </Section>
    </div>
  )
}
