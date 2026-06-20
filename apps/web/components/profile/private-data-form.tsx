'use client'

import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { FieldLabel, PrivacyBanner } from '@/components/ui/sheet'
import type { ProfileDraft } from '@/lib/profile/types'
import { useI18n } from '@/lib/i18n/use-i18n'
import { EyeOff, Plus } from 'lucide-react'

interface Props {
  data: ProfileDraft
  onChange: (data: ProfileDraft) => void
}

export default function PrivateDataForm({ data, onChange }: Props) {
  const { messages } = useI18n()
  const f = messages.profile.fields
  const fileRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    onChange({ ...data, [key]: value })
  }

  function handleImages(files: FileList | null) {
    if (!files) return
    const readers = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        }),
    )
    Promise.all(readers).then((urls) => {
      onChange({ ...data, images: [...data.images, ...urls] })
    })
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <EyeOff className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">{messages.profile.sections.contactDetails}</h2>
        </div>
        <PrivacyBanner text={messages.profile.privacyBanner} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldLabel label={f.mobileNumber}>
            <Input value={data.mobileNumber} onChange={(e) => set('mobileNumber', e.target.value)} />
          </FieldLabel>
          <FieldLabel label={f.whatsappNumber}>
            <Input value={data.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} />
          </FieldLabel>
          <FieldLabel label={f.address}>
            <Input value={data.address} onChange={(e) => set('address', e.target.value)} />
          </FieldLabel>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <EyeOff className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">{messages.profile.sections.myImages}</h2>
        </div>
        <PrivacyBanner text={messages.profile.privacyBanner} />
        <div className="flex flex-wrap gap-3">
          {data.images.map((src, i) => (
            <div key={i} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-sky-300 flex flex-col items-center justify-center text-sky-500 hover:bg-sky-50"
          >
            <Plus className="w-6 h-6" />
            <span className="text-[10px] mt-1">{messages.profile.addImage}</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleImages(e.target.files)}
          />
        </div>
      </section>
    </div>
  )
}
