'use client'

import {
  HEIGHT_MIN_IN,
  HEIGHT_MAX_IN,
  formatHeight,
  heightToInches,
} from '@/lib/height'

function RequiredStar() {
  return <span className="text-red-500 ml-0.5">*</span>
}

/**
 * Single-thumb height picker that always emits the canonical `5' 8"` format
 * expected by the height search filter (see lib/height.ts).
 */
export default function HeightSlider({ value, onChange, required, error }: {
  value: string; onChange: (v: string) => void; required?: boolean; error?: boolean
}) {
  const inches = heightToInches(value)
  const display = formatHeight(inches)

  return (
    <div className={error ? 'rounded-xl ring-2 ring-red-200' : ''}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">
          Height{required && <RequiredStar />}
        </p>
        <span className="text-sm font-semibold text-gray-900 tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={HEIGHT_MIN_IN}
        max={HEIGHT_MAX_IN}
        step={1}
        value={inches}
        onChange={e => onChange(formatHeight(Number(e.target.value)))}
        className="w-full h-2 accent-brand cursor-pointer"
        aria-label="Height"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{formatHeight(HEIGHT_MIN_IN)}</span>
        <span>{formatHeight(HEIGHT_MAX_IN)}</span>
      </div>
    </div>
  )
}
