'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DROPDOWN_OPTIONS } from '@/lib/profile/types'
import { useI18n } from '@/lib/i18n/use-i18n'
import { cn } from '@/lib/utils'

export interface FilterState {
  lookingFor: string
  ageMin: string
  ageMax: string
  heightMin: string
  heightMax: string
  country: string
  religion: string
  ethnicity: string
  civilStatus: string
  profession: string
  education: string
  foodPreference: string
  drinking: string
  smoking: string
}

export const DEFAULT_FILTERS: FilterState = {
  lookingFor: '',
  ageMin: '',
  ageMax: '',
  heightMin: '',
  heightMax: '',
  country: '',
  religion: '',
  ethnicity: '',
  civilStatus: '',
  profession: '',
  education: '',
  foodPreference: '',
  drinking: '',
  smoking: '',
}

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
  className?: string
}

function FilterSelect({
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
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-xs">
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
    </div>
  )
}

export default function FilterSidebar({ filters, onChange, className }: Props) {
  const { messages, t } = useI18n()
  const f = messages.home.filters

  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <aside className={cn('space-y-4', className)}>
      <div className="bg-gray-900 text-white rounded-xl p-4">
        <p className="font-semibold text-sm">Naveen Perera</p>
        <p className="text-xs text-gray-400 mt-1">Profile</p>
      </div>

      <div className="bg-gradient-to-br from-brand to-pink-500 rounded-xl p-3">
        <p className="text-white text-xs font-semibold mb-2">{f.quickMatches}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {['Kuja 01', 'Kuja 02', 'Kuja 03', 'Kuja 04', 'Kuja 05', 'Kuja 06'].map((k) => (
            <button
              key={k}
              type="button"
              className="bg-white/20 text-white text-[10px] rounded-lg py-1.5 hover:bg-white/30"
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">{f.lookingFor}</label>
          <div className="flex gap-2">
            {(['MALE', 'FEMALE'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set('lookingFor', g)}
                className={cn(
                  'flex-1 py-2 text-xs rounded-full border',
                  filters.lookingFor === g
                    ? 'border-brand bg-brand-50 text-brand'
                    : 'border-gray-200 text-gray-500',
                )}
              >
                {g === 'MALE' ? t('common.male') : t('common.female')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FilterSelect label={`${f.ageRange} ${f.min}`} value={filters.ageMin} onChange={(v) => set('ageMin', v)} />
          <FilterSelect label={f.max} value={filters.ageMax} onChange={(v) => set('ageMax', v)} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FilterSelect label={`${f.height} ${f.min}`} value={filters.heightMin} onChange={(v) => set('heightMin', v)} />
          <FilterSelect label={f.max} value={filters.heightMax} onChange={(v) => set('heightMax', v)} />
        </div>

        <FilterSelect label={f.country} value={filters.country} onChange={(v) => set('country', v)} />
        <FilterSelect label={f.religion} value={filters.religion} onChange={(v) => set('religion', v)} />
        <FilterSelect label={f.ethnicity} value={filters.ethnicity} onChange={(v) => set('ethnicity', v)} />
        <FilterSelect label={f.civilStatus} value={filters.civilStatus} onChange={(v) => set('civilStatus', v)} />
        <FilterSelect label={f.profession} value={filters.profession} onChange={(v) => set('profession', v)} />
        <FilterSelect label={f.education} value={filters.education} onChange={(v) => set('education', v)} />
        <FilterSelect label={f.foodPreference} value={filters.foodPreference} onChange={(v) => set('foodPreference', v)} />
        <FilterSelect label={f.drinking} value={filters.drinking} onChange={(v) => set('drinking', v)} />
        <FilterSelect label={f.smoking} value={filters.smoking} onChange={(v) => set('smoking', v)} />
      </div>
    </aside>
  )
}
